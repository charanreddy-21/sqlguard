"""SQLite persistence and read models for prediction history."""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATABASE_PATH = PROJECT_ROOT / "data" / "sqlguard.sqlite3"


def database_path(path: str | Path | None = None) -> Path:
    configured = path or os.environ.get("SQLGUARD_DB_PATH") or DEFAULT_DATABASE_PATH
    return Path(configured).expanduser().resolve()


@contextmanager
def _connect(path: str | Path | None = None):
    selected_path = database_path(path)
    selected_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(selected_path, timeout=5)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize_database(path: str | Path | None = None) -> None:
    """Create the prediction tables if they do not already exist."""
    selected_path = database_path(path)
    with _connect(selected_path) as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                query TEXT NOT NULL,
                label TEXT NOT NULL CHECK (label IN ('attack', 'benign')),
                prediction INTEGER NOT NULL CHECK (prediction IN (0, 1)),
                attack_probability REAL NOT NULL,
                threshold REAL NOT NULL,
                candidate_count INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS candidate_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                start_position INTEGER NOT NULL,
                end_position INTEGER NOT NULL,
                label TEXT NOT NULL CHECK (label IN ('attack', 'benign')),
                prediction INTEGER NOT NULL CHECK (prediction IN (0, 1)),
                attack_probability REAL NOT NULL,
                threshold REAL NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_predictions_created_at
                ON predictions(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_candidate_results_prediction_id
                ON candidate_results(prediction_id);
            """
        )
    # Keep local query history private on systems that support POSIX modes.
    try:
        selected_path.chmod(0o600)
    except OSError:
        pass


def save_prediction(
    query: str,
    result: dict[str, Any],
    path: str | Path | None = None,
) -> int:
    """Persist a successful result and its candidate metadata atomically."""
    created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with _connect(path) as connection:
        cursor = connection.execute(
            """
            INSERT INTO predictions (
                created_at, query, label, prediction, attack_probability,
                threshold, candidate_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                created_at,
                query,
                result["label"],
                int(result["prediction"]),
                float(result["attack_probability"]),
                float(result["threshold"]),
                int(result["candidate_count"]),
            ),
        )
        prediction_id = int(cursor.lastrowid)
        connection.executemany(
            """
            INSERT INTO candidate_results (
                prediction_id, type, start_position, end_position, label,
                prediction, attack_probability, threshold
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    prediction_id,
                    candidate["type"],
                    int(candidate["start"]),
                    int(candidate["end"]),
                    candidate["label"],
                    int(candidate["prediction"]),
                    float(candidate["attack_probability"]),
                    float(candidate["threshold"]),
                )
                for candidate in result["candidates"]
            ],
        )
    return prediction_id


def get_analytics(path: str | Path | None = None, recent_limit: int = 6) -> dict[str, Any]:
    """Return aggregate counts, the last seven UTC days, and recent metadata."""
    with _connect(path) as connection:
        totals = connection.execute(
            """
            SELECT COUNT(*) AS total_queries,
                   COALESCE(SUM(prediction), 0) AS flagged_attacks,
                   COALESCE(SUM(candidate_count), 0) AS total_candidates
            FROM predictions
            """
        ).fetchone()

        today = datetime.now(timezone.utc).date()
        first_day = today - timedelta(days=6)
        daily_rows = connection.execute(
            """
            SELECT substr(created_at, 1, 10) AS day,
                   COUNT(*) AS total_queries,
                   COALESCE(SUM(prediction), 0) AS flagged_attacks
            FROM predictions
            WHERE created_at >= ?
            GROUP BY day
            ORDER BY day
            """,
            (first_day.isoformat(),),
        ).fetchall()
        daily_by_date = {row["day"]: row for row in daily_rows}
        daily_activity = []
        for offset in range(7):
            day = first_day + timedelta(days=offset)
            row = daily_by_date.get(day.isoformat())
            daily_activity.append(
                {
                    "date": day.isoformat(),
                    "total_queries": int(row["total_queries"]) if row else 0,
                    "flagged_attacks": int(row["flagged_attacks"]) if row else 0,
                }
            )

        prediction_rows = connection.execute(
            """
            SELECT id, created_at, label, prediction, attack_probability,
                   threshold, candidate_count
            FROM predictions
            ORDER BY id DESC
            LIMIT ?
            """,
            (recent_limit,),
        ).fetchall()
        recent_activity = []
        for row in prediction_rows:
            pattern_rows = connection.execute(
                """
                SELECT DISTINCT type FROM candidate_results
                WHERE prediction_id = ? AND type != 'full_query'
                ORDER BY type
                """,
                (row["id"],),
            ).fetchall()
            recent_activity.append(
                {
                    "id": int(row["id"]),
                    "created_at": row["created_at"],
                    "label": row["label"],
                    "prediction": int(row["prediction"]),
                    "attack_probability": float(row["attack_probability"]),
                    "threshold": float(row["threshold"]),
                    "candidate_count": int(row["candidate_count"]),
                    "extracted_pattern_types": [item["type"] for item in pattern_rows],
                }
            )

    total_queries = int(totals["total_queries"])
    flagged_attacks = int(totals["flagged_attacks"])
    return {
        "total_queries": total_queries,
        "flagged_attacks": flagged_attacks,
        "attack_rate": flagged_attacks / total_queries if total_queries else None,
        "total_candidates": int(totals["total_candidates"]),
        "daily_activity": daily_activity,
        "recent_activity": recent_activity,
    }
