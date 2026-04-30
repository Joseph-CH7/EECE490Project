from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib


ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "models" / "resume_category_model.joblib"

KEYWORD_RULES = [
    (
        "data_science",
        {
            "data scientist", "machine learning", "scikit", "pandas", "numpy",
            "feature engineering", "classification", "regression", "model evaluation",
            "predictive analytics", "f1 score", "data visualization",
        },
        2,
    ),
    (
        "finance",
        {
            "financial", "budgeting", "forecasting", "account reconciliation",
            "balance sheet", "income statement", "cash flow", "variance analysis",
        },
        2,
    ),
    (
        "human_resources",
        {
            "recruitment", "onboarding", "employee relations", "payroll",
            "performance review", "offer letters", "hr documentation",
        },
        2,
    ),
    (
        "healthcare",
        {
            "patient care", "medical records", "clinical", "vital signs",
            "nurses", "physicians", "care plans",
        },
        2,
    ),
    (
        "design_creative",
        {
            "graphic designer", "photoshop", "illustrator", "figma",
            "branding", "typography", "visual identity", "wireframes",
        },
        2,
    ),
]


def clean_text(value: object) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if text.lower() in {"nan", "none", "null"}:
        return ""
    return " ".join(text.split())

def keyword_override(text: str) -> str | None:
    lowered = text.lower()

    best_category = None
    best_hits = 0

    for category, keywords, minimum_hits in KEYWORD_RULES:
        hits = sum(keyword in lowered for keyword in keywords)
        if hits >= minimum_hits and hits > best_hits:
            best_category = category
            best_hits = hits

    return best_category


def main() -> None:
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        raise ValueError("Missing JSON input on stdin.")

    payload = json.loads(raw_input)
    text = clean_text(payload.get("text"))

    if not text:
        raise ValueError("Missing resume text.")

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    model = joblib.load(MODEL_PATH)
    category = keyword_override(text) or str(model.predict([text])[0])

    result = {
        "inferredCategory": category,
        "displayCategory": category.replace("_", " ").title(),
    }

    sys.stdout.write(json.dumps(result))


if __name__ == "__main__":
    main()
