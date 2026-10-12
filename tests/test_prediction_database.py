import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import sqlite3
from fastapi import HTTPException

from backend.database import get_analytics, initialize_database, save_prediction
from backend.main import PredictionRequest, analytics as analytics_route, predict as predict_route


class PredictionDatabaseTests(unittest.TestCase):
    def test_prediction_is_saved_and_aggregated_without_query_text(self):
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "history.sqlite3"
            initialize_database(database)
            initialize_database(database)

            query = "SELECT * FROM users WHERE id = 1 OR '1'='1'"
            result = {
                "prediction": 1,
                "label": "attack",
                "attack_probability": 0.87,
                "threshold": 0.3,
                "candidate_count": 2,
                "candidates": [
                    {
                        "type": "full_query",
                        "start": 0,
                        "end": len(query),
                        "prediction": 1,
                        "label": "attack",
                        "attack_probability": 0.87,
                        "threshold": 0.3,
                    },
                    {
                        "type": "boolean_condition",
                        "start": 35,
                        "end": 44,
                        "prediction": 1,
                        "label": "attack",
                        "attack_probability": 0.92,
                        "threshold": 0.3,
                    },
                ],
            }

            prediction_id = save_prediction(query, result, database)
            analytics = get_analytics(database)

        self.assertGreater(prediction_id, 0)
        self.assertEqual(analytics["total_queries"], 1)
        self.assertEqual(analytics["flagged_attacks"], 1)
        self.assertEqual(analytics["attack_rate"], 1.0)
        self.assertEqual(analytics["total_candidates"], 2)
        self.assertEqual(len(analytics["daily_activity"]), 7)
        self.assertEqual(analytics["recent_activity"][0]["extracted_pattern_types"], ["boolean_condition"])
        self.assertNotIn("query", analytics["recent_activity"][0])

    def test_empty_database_returns_zeroes_and_no_recent_rows(self):
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "history.sqlite3"
            initialize_database(database)
            analytics = get_analytics(database)

        self.assertEqual(analytics["total_queries"], 0)
        self.assertEqual(analytics["flagged_attacks"], 0)
        self.assertIsNone(analytics["attack_rate"])
        self.assertEqual(analytics["recent_activity"], [])
        self.assertEqual(len(analytics["daily_activity"]), 7)

    def test_prediction_persistence_failure_returns_service_unavailable(self):
        valid_result = {
            "prediction": 0,
            "label": "benign",
            "attack_probability": 0.1,
            "threshold": 0.3,
            "candidate_count": 0,
            "candidates": [],
        }
        with patch("backend.main.predict_query", return_value=valid_result), patch(
            "backend.main.save_prediction", side_effect=sqlite3.OperationalError("disk unavailable")
        ), self.assertLogs("backend.main", level="ERROR"):
            with self.assertRaises(HTTPException) as raised:
                predict_route(PredictionRequest(query="SELECT 1"))

        self.assertEqual(raised.exception.status_code, 503)

    def test_analytics_database_failure_returns_service_unavailable(self):
        with patch("backend.main.get_analytics", side_effect=sqlite3.OperationalError("disk unavailable")), self.assertLogs("backend.main", level="ERROR"):
            with self.assertRaises(HTTPException) as raised:
                analytics_route()

        self.assertEqual(raised.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
