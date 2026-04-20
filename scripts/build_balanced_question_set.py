from __future__ import annotations

from pathlib import Path

import pandas as pd


IN_FILE = Path("data/processed/questions_app_curated.csv")
OUT_FILE = Path("data/processed/questions_balanced.csv")

CAPS = {
    ("software_engineering", "technical"): 250,
    ("software_engineering", "behavioral"): 90,
    ("data_science", "technical"): 150,
    ("data_science", "behavioral"): 90,
    ("human_resources", "behavioral"): 180,
    ("finance", "technical"): 50,
    ("finance", "behavioral"): 50,
    ("design_creative", "technical"): 50,
    ("design_creative", "behavioral"): 50,
    ("education", "technical"): 50,
    ("education", "behavioral"): 50,
    ("healthcare", "technical"): 50,
    ("healthcare", "behavioral"): 50,
    ("hospitality", "technical"): 50,
    ("hospitality", "behavioral"): 50,
    ("business_development", "technical"): 50,
    ("business_development", "behavioral"): 50,
    ("construction", "technical"): 50,
    ("construction", "behavioral"): 50,
    ("fitness_wellness", "technical"): 50,
    ("fitness_wellness", "behavioral"): 50,
}


def clean_text(series: pd.Series) -> pd.Series:
    return series.fillna("").astype(str).str.strip().str.lower()


def main() -> None:
    if not IN_FILE.exists():
        raise FileNotFoundError(f"Missing input file: {IN_FILE}")

    df = pd.read_csv(IN_FILE).copy()
    df["job_category"] = clean_text(df["job_category"])
    df["question_type"] = clean_text(df["question_type"])

    if "source_priority" not in df.columns:
        df["source_priority"] = 4

    balanced_parts: list[pd.DataFrame] = []

    for (category, question_type), limit in CAPS.items():
        subset = df[
            (df["job_category"] == category) &
            (df["question_type"] == question_type)
        ].copy()

        if subset.empty:
            continue

        subset = subset.sort_values(
            by=["source_priority", "difficulty", "question_text"],
            ascending=[True, True, True],
        ).reset_index(drop=True)

        if len(subset) > limit:
            subset = subset.head(limit).copy()

        balanced_parts.append(subset)

    if not balanced_parts:
        raise ValueError("No rows selected for balanced dataset.")

    balanced = pd.concat(balanced_parts, ignore_index=True)
    balanced = balanced.drop_duplicates(subset=["question_text"]).reset_index(drop=True)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    balanced.to_csv(OUT_FILE, index=False)

    print(f"Saved balanced question set to {OUT_FILE}")
    print("Shape:", balanced.shape)
    print("\nCounts by major x question type:")
    print(pd.crosstab(balanced["job_category"], balanced["question_type"]))


if __name__ == "__main__":
    main()
