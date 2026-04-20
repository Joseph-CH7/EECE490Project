from __future__ import annotations

from pathlib import Path
import re

import pandas as pd


PROCESSED_DIR = Path("data/processed")

QUESTIONS_RAW = PROCESSED_DIR / "questions_normalized_v2.csv"
QUESTIONS_CURATED = PROCESSED_DIR / "questions_app_curated.csv"
QUESTIONS_BALANCED = PROCESSED_DIR / "questions_balanced.csv"
QUESTIONS_FEATURES = PROCESSED_DIR / "questions_with_features_v2.csv"
RESUMES = PROCESSED_DIR / "resumes_normalized.csv"
PROFILES = PROCESSED_DIR / "resume_profiles_training_ready.csv"


def normalize_text(series: pd.Series) -> pd.Series:
    return (
        series.fillna("")
        .astype(str)
        .str.lower()
        .str.replace(r"[^a-z0-9\s]", "", regex=True)
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )


def print_header(title: str) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def summarize_questions(path: Path, label: str) -> None:
    if not path.exists():
        print_header(label)
        print(f"Missing file: {path}")
        return

    df = pd.read_csv(path).copy()
    df["question_text"] = df["question_text"].fillna("").astype(str).str.strip()
    df["question_type"] = df["question_type"].fillna("").astype(str).str.lower().str.strip()
    df["job_category"] = df["job_category"].fillna("").astype(str).str.lower().str.strip()

    print_header(label)
    print("Shape:", df.shape)
    print("\nQuestion type counts:")
    print(df["question_type"].value_counts(dropna=False))
    print("\nJob category counts:")
    print(df["job_category"].value_counts(dropna=False))
    print("\nSource counts:")
    if "source" in df.columns:
        print(df["source"].fillna("").astype(str).str.lower().value_counts(dropna=False))
    else:
        print("No source column")

    exact_dupes = int(df.duplicated(subset=["question_text"]).sum())
    norm_dupes = int(normalize_text(df["question_text"]).duplicated().sum())
    print("\nExact duplicate questions:", exact_dupes)
    print("Normalized duplicate questions:", norm_dupes)

    print("\nCounts by major x question type:")
    print(pd.crosstab(df["job_category"], df["question_type"]))


def summarize_resumes(path: Path, label: str, text_col: str, category_col: str) -> None:
    if not path.exists():
        print_header(label)
        print(f"Missing file: {path}")
        return

    df = pd.read_csv(path).copy()
    df[text_col] = df[text_col].fillna("").astype(str).str.strip()
    df[category_col] = df[category_col].fillna("").astype(str).str.lower().str.strip()

    print_header(label)
    print("Shape:", df.shape)
    print("\nCategory counts:")
    print(df[category_col].value_counts().head(20))
    print("\nEmpty text rows:", int((df[text_col] == "").sum()))
    print("Exact duplicate text rows:", int(df.duplicated(subset=[text_col]).sum()))


def main() -> None:
    summarize_questions(QUESTIONS_RAW, "Questions Raw")
    summarize_questions(QUESTIONS_CURATED, "Questions Curated")
    summarize_questions(QUESTIONS_BALANCED, "Questions Balanced")
    summarize_questions(QUESTIONS_FEATURES, "Questions Features")
    summarize_resumes(RESUMES, "Resumes Main", "resume_text", "job_category_normalized")
    summarize_resumes(PROFILES, "Resume Profiles Training Ready", "profile_text", "job_category_guess")


if __name__ == "__main__":
    main()
