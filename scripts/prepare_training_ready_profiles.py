from __future__ import annotations

from pathlib import Path
import re

import pandas as pd


IN_FILE = Path("data/processed/resume_profiles_normalized.csv")
OUT_FILE = Path("data/processed/resume_profiles_training_ready.csv")


def clean_text(value: object) -> str:
    if pd.isna(value):
        return ""
    text = str(value).strip()
    if text.lower() in {"nan", "none", "null"}:
        return ""
    return re.sub(r"\s+", " ", text)


def main() -> None:
    if not IN_FILE.exists():
        raise FileNotFoundError(f"Missing input file: {IN_FILE}")

    df = pd.read_csv(IN_FILE).copy()
    required = ["profile_text", "job_category_guess"]
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    for column in df.columns:
        if df[column].dtype == object:
            df[column] = df[column].map(clean_text)

    df["job_category_guess"] = df["job_category_guess"].astype(str).str.lower().str.strip()
    df = df[df["profile_text"] != ""].copy()
    df = df.drop_duplicates(subset=["profile_text"]).reset_index(drop=True)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_FILE, index=False)

    print(f"Saved training-ready profiles to {OUT_FILE}")
    print("Shape:", df.shape)
    print("\nCategory distribution:")
    print(df["job_category_guess"].value_counts().head(15))


if __name__ == "__main__":
    main()
