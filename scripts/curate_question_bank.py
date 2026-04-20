from __future__ import annotations

from pathlib import Path
import re

import pandas as pd


IN_FILE = Path("data/processed/questions_normalized_v2.csv")
MANUAL_ADDITIONS_PATTERN = "questions_manual*.csv"
OUT_FILE = Path("data/processed/questions_app_curated.csv")
FLAGGED_FILE = Path("data/interim/question_quality_flags.csv")

VALID_TYPES = {"technical", "behavioral"}
VALID_CATEGORIES = {
    "software_engineering",
    "human_resources",
    "data_science",
    "finance",
    "design_creative",
    "education",
    "healthcare",
    "hospitality",
    "business_development",
    "construction",
    "fitness_wellness",
}

BEHAVIORAL_STARTERS = (
    "tell me about",
    "describe a time",
    "describe a situation",
    "provide an example",
    "how do you handle",
    "how would you handle",
    "how did you handle",
    "what would you do",
    "share an example",
)

TECHNICAL_STARTERS = (
    "what is",
    "what are",
    "how does",
    "how would",
    "how do you",
    "explain",
    "compare",
    "design",
    "implement",
    "when would you",
    "why is",
    "what happens",
    "what steps",
)

BAD_SUBSTRINGS = (
    "difference between list and recursion",
    "difference between list and inheritance",
    "difference between list and encapsulation",
    "difference between list and polymorphism",
    "difference between list and rest api",
    "difference between list and sql injection",
    "difference between list and multithreading",
    "difference between list and deadlock",
    "difference between list and garbage collection",
    "difference between list and big o notation",
)

SOURCE_PRIORITY = {
    "software questions": 1,
    "extracted_questions": 1,
    "behavioral_questions_v2": 1,
    "behavioral_questions_v2_extra_260": 2,
    "deeplearning_questions": 2,
    "full_interview_questions_dataset": 3,
}


def clean_text(value: object) -> str:
    if pd.isna(value):
        return ""
    text = str(value).strip()
    if text.lower() in {"nan", "none", "null"}:
        return ""
    return re.sub(r"\s+", " ", text)


def normalize_for_dedup(text: str) -> str:
    lowered = text.lower().strip()
    lowered = re.sub(r"[^a-z0-9\s]", "", lowered)
    return re.sub(r"\s+", " ", lowered)


def infer_quality_flags(question_text: str, question_type: str) -> list[str]:
    text = clean_text(question_text)
    lowered = text.lower()
    flags: list[str] = []

    if len(text) < 15:
        flags.append("too_short")
    if len(text) > 220:
        flags.append("too_long")
    if any(bad in lowered for bad in BAD_SUBSTRINGS):
        flags.append("bad_template_pair")
    if "work internally" in lowered:
        flags.append("work_internally_template")
    if "  " in question_text:
        flags.append("double_space")
    if re.search(r"\bwhat is [a-z]+\s+what does it do\b", lowered):
        flags.append("duplicated_phrase")
    if lowered.count("list and") >= 1 and lowered.startswith("explain the difference between list and"):
        flags.append("suspicious_list_comparison")
    if question_type == "behavioral" and not lowered.startswith(BEHAVIORAL_STARTERS):
        flags.append("weak_behavioral_pattern")
    if question_type == "technical" and not lowered.startswith(TECHNICAL_STARTERS):
        flags.append("weak_technical_pattern")
    if lowered in {"tell me about yourself.", "tell me about yourself"}:
        flags.append("generic_behavioral")

    return flags


def main() -> None:
    if not IN_FILE.exists():
        raise FileNotFoundError(f"Missing input file: {IN_FILE}")

    df = pd.read_csv(IN_FILE).copy()
    required = ["question_text", "question_type", "job_category", "source"]
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    for column in ["question_text", "question_type", "job_category", "source"]:
        df[column] = df[column].map(clean_text)

    manual_files = sorted(IN_FILE.parent.glob(MANUAL_ADDITIONS_PATTERN))
    for manual_file in manual_files:
        manual_df = pd.read_csv(manual_file).copy()
        for column in ["question_text", "question_type", "job_category", "source"]:
            manual_df[column] = manual_df[column].map(clean_text)
        if "difficulty" in manual_df.columns:
            manual_df["difficulty"] = manual_df["difficulty"].map(clean_text).str.lower()
        df = pd.concat([df, manual_df], ignore_index=True, sort=False)

    if "difficulty" in df.columns:
        df["difficulty"] = df["difficulty"].map(clean_text).str.lower()
    else:
        df["difficulty"] = "medium"

    df["question_type"] = df["question_type"].str.lower()
    df["job_category"] = df["job_category"].str.lower()
    df["source"] = df["source"].str.lower()

    df = df[df["question_type"].isin(VALID_TYPES)].copy()
    df = df[df["job_category"].isin(VALID_CATEGORIES)].copy()
    df = df[df["question_text"] != ""].copy()

    df["normalized_question"] = df["question_text"].map(normalize_for_dedup)
    df["quality_flags"] = df.apply(
        lambda row: infer_quality_flags(row["question_text"], row["question_type"]),
        axis=1,
    )
    df["flag_count"] = df["quality_flags"].map(len)

    flagged = df[df["flag_count"] > 0].copy()
    flagged["quality_flags"] = flagged["quality_flags"].map(lambda items: "|".join(items))
    flagged = flagged.sort_values(
        by=["flag_count", "job_category", "question_type", "question_text"],
        ascending=[False, True, True, True],
    )

    curated = df[df["flag_count"] == 0].copy()
    curated = curated.drop_duplicates(subset=["normalized_question"]).copy()

    curated["source_priority"] = curated["source"].map(lambda value: SOURCE_PRIORITY.get(value, 4))
    curated["word_count"] = curated["question_text"].str.split().str.len()
    curated = curated.sort_values(
        by=["job_category", "question_type", "source_priority", "word_count", "question_text"],
        ascending=[True, True, True, True, True],
    ).reset_index(drop=True)

    curated = curated.drop(columns=["normalized_question", "quality_flags", "flag_count", "word_count"])
    flagged = flagged.drop(columns=["normalized_question"])

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    FLAGGED_FILE.parent.mkdir(parents=True, exist_ok=True)
    curated.to_csv(OUT_FILE, index=False)
    flagged.to_csv(FLAGGED_FILE, index=False)

    print(f"Saved curated file: {OUT_FILE}")
    print(f"Saved flagged file: {FLAGGED_FILE}")
    print("\nCurated shape:", curated.shape)
    print("\nCurated distribution:")
    print(pd.crosstab(curated["job_category"], curated["question_type"]))
    print("\nTop flagged reasons:")
    print(flagged["quality_flags"].str.split("|", regex=False).explode().value_counts().head(15))


if __name__ == "__main__":
    main()
