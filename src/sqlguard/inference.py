
from pathlib import Path

import joblib

from src.sqlguard.payload_extractor import extract_payloads


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "models" / "sqli_v3_baseline.joblib"


def load_artifacts():
    """Load the fitted vectorizer, model, and decision threshold."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. "
            "Save the trained model using the SQLiV3 notebook first."
        )

    artifacts = joblib.load(MODEL_PATH)

    return (
        artifacts["vectorizer"],
        artifacts["model"],
        artifacts["threshold"],
    )


vectorizer, model, threshold = load_artifacts()


def classify_text(text: str) -> dict:
    """Classify one text string using the existing trained model."""
    features = vectorizer.transform([text])
    attack_probability = float(model.predict_proba(features)[0, 1])

    prediction = int(attack_probability >= threshold)

    return {
        "prediction": prediction,
        "label": "attack" if prediction == 1 else "benign",
        "attack_probability": round(attack_probability, 4),
        "threshold": threshold,
    }


def predict_query(query: str) -> dict:
    """Analyze a complete SQL query and its extracted candidates."""
    if not isinstance(query, str) or not query.strip():
        raise ValueError("query must be a non-empty string")

    candidates = extract_payloads(query)

    results = []

    for candidate in candidates:
        result = classify_text(candidate["text"])

        results.append({
            **candidate,
            **result,
        })

    # The overall result is flagged if any candidate is classified
    # as attack-related.
    is_attack = any(
        result["prediction"] == 1
        for result in results
    )

    max_probability = max(
        result["attack_probability"]
        for result in results
    )

    return {
        "prediction": int(is_attack),
        "label": "attack" if is_attack else "benign",
        "attack_probability": max_probability,
        "threshold": threshold,
        "candidate_count": len(results),
        "candidates": results,
    }
