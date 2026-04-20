from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
BALANCED_QUESTIONS_PATH = ROOT / "data" / "processed" / "questions_balanced.csv"
CURATED_QUESTIONS_PATH = ROOT / "data" / "processed" / "questions_app_curated.csv"
QUESTIONS_PATH = ROOT / "data" / "processed" / "questions_normalized_v2.csv"
RESUME_MODEL_PATH = ROOT / "models" / "resume_category_model.joblib"
DIFFICULTY_MODEL_PATH = ROOT / "models" / "question_difficulty_model.joblib"

DEFAULT_CATEGORY = "it_support"
QUESTION_CATEGORY_MAP = {
    "software_engineering": "software_engineering",
    "it_support": "software_engineering",
    "data_science": "data_science",
    "finance": "finance",
    "design_creative": "design_creative",
    "education": "education",
    "healthcare": "healthcare",
    "hospitality": "hospitality",
    "business_development": "business_development",
    "construction": "construction",
    "fitness_wellness": "fitness_wellness",
    "human_resources": "human_resources",
    "general_business": "business_development",
    "sales": "business_development",
}

TECHNICAL_KEYWORDS = {
    "algorithm", "api", "architecture", "cache", "class", "database", "debug",
    "design", "distributed", "framework", "machine learning", "model",
    "network", "oop", "performance", "process", "programming", "scalable",
    "sql", "system", "thread",
}

BEHAVIORAL_KEYWORDS = {
    "challenge", "collaborate", "communication", "conflict", "deadline",
    "feedback", "leadership", "mistake", "pressure", "situation", "strength",
    "stress", "teammate", "time", "weakness",
}

HARD_PATTERNS = (
    "design", "architect", "scale", "optimize", "distributed", "millions",
)

EASY_PATTERNS = (
    "what is", "define", "difference between", "tell me about a time",
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
    if value is None or pd.isna(value):
        return ""
    text = str(value).strip()
    if text.lower() in {"nan", "none", "null"}:
        return ""
    return text


def infer_question_type(text: str) -> str:
    lowered = text.lower()
    behavioral_score = sum(keyword in lowered for keyword in BEHAVIORAL_KEYWORDS)
    technical_score = sum(keyword in lowered for keyword in TECHNICAL_KEYWORDS)
    return "behavioral" if behavioral_score > technical_score else "technical"


def count_keyword_hits(text: str, keywords: set[str]) -> int:
    lowered = text.lower()
    return sum(keyword in lowered for keyword in keywords)


def predict_difficulty(model, question_text: str, question_type: str, job_category: str) -> str:
    lowered = question_text.lower()
    features = pd.DataFrame(
        [
            {
                "question_text": question_text,
                "question_type": question_type,
                "job_category": job_category,
                "technical_keyword_count": count_keyword_hits(question_text, TECHNICAL_KEYWORDS),
                "behavioral_keyword_count": count_keyword_hits(question_text, BEHAVIORAL_KEYWORDS),
                "starts_hard_pattern": int(any(lowered.startswith(pattern) for pattern in HARD_PATTERNS)),
                "starts_easy_pattern": int(any(lowered.startswith(pattern) for pattern in EASY_PATTERNS)),
            }
        ]
    )
    return str(model.predict(features)[0])


def load_questions() -> pd.DataFrame:
    if BALANCED_QUESTIONS_PATH.exists():
        source_path = BALANCED_QUESTIONS_PATH
    elif CURATED_QUESTIONS_PATH.exists():
        source_path = CURATED_QUESTIONS_PATH
    else:
        source_path = QUESTIONS_PATH
    df = pd.read_csv(source_path).copy()
    required = ["question_text", "question_type", "job_category"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required question columns: {missing}")

    df["question_text"] = df["question_text"].map(clean_text)
    df["question_type"] = df["question_type"].map(clean_text).str.lower()
    df["job_category"] = df["job_category"].map(clean_text).str.lower()

    if "difficulty" in df.columns:
        df["difficulty"] = df["difficulty"].map(clean_text).str.lower()
    else:
        df["difficulty"] = ""

    if "source" in df.columns:
        df["source"] = df["source"].map(clean_text).str.lower()
        df["source_priority"] = df["source"].map(lambda value: SOURCE_PRIORITY.get(value, 4))
    else:
        df["source"] = ""
        df["source_priority"] = 4

    df = df[df["question_text"] != ""].copy()
    df = df.drop_duplicates(subset=["question_text"])
    return df


def select_questions(df: pd.DataFrame, job_category: str, interview_type: str, n: int = 4) -> pd.DataFrame:
    interview_type = clean_text(interview_type).lower()
    job_category = clean_text(job_category).lower()

    filtered = df[df["job_category"] == job_category].copy()
    if filtered.empty:
        filtered = df.copy()

    def rank_and_sample(pool_df: pd.DataFrame, take_n: int) -> pd.DataFrame:
        if pool_df.empty or take_n <= 0:
            return pool_df.head(0)

        ranked_pool = pool_df.sort_values(
            by=["source_priority", "difficulty", "question_text"],
            ascending=[True, True, True],
        ).reset_index(drop=True)
        shortlist = ranked_pool.head(max(take_n * 8, take_n))
        return shortlist.sample(n=min(take_n, len(shortlist)), random_state=42).reset_index(drop=True)

    def refine_behavioral_pool(pool_df: pd.DataFrame) -> pd.DataFrame:
        if job_category == "human_resources":
            return pool_df

        refined = pool_df[
            ~pool_df["question_text"].str.contains("customer", case=False, na=False)
        ].copy()
        return refined if not refined.empty else pool_df

    if interview_type == "technical":
        pool = rank_and_sample(filtered[filtered["question_type"] == "technical"].copy(), n)
    elif interview_type == "behavioral":
        behavioral_pool = filtered[filtered["question_type"] == "behavioral"].copy()
        if behavioral_pool.empty:
            behavioral_pool = df[
                (df["job_category"] == "human_resources") &
                (df["question_type"] == "behavioral")
            ].copy()
        behavioral_pool = refine_behavioral_pool(behavioral_pool)
        pool = rank_and_sample(behavioral_pool, n)
    else:
        technical = rank_and_sample(
            filtered[filtered["question_type"] == "technical"].copy(),
            n // 2,
        )
        behavioral_pool = filtered[filtered["question_type"] == "behavioral"].copy()
        if behavioral_pool.empty:
            behavioral_pool = df[
                (df["job_category"] == "human_resources") &
                (df["question_type"] == "behavioral")
            ].copy()
        behavioral_pool = refine_behavioral_pool(behavioral_pool)
        behavioral = rank_and_sample(behavioral_pool, n - len(technical))
        pool = pd.concat([technical, behavioral], ignore_index=True)

    if pool.empty:
        pool = filtered.copy()

    if len(pool) < n:
        remaining = filtered[~filtered["question_text"].isin(pool["question_text"])]
        extra = remaining.sample(n=min(n - len(pool), len(remaining)), random_state=42)
        pool = pd.concat([pool, extra], ignore_index=True)

    return rank_and_sample(pool, n)


def build_payload(raw: dict[str, object]) -> dict[str, object]:
    cv_text = clean_text(raw.get("cvText"))
    job_description = clean_text(raw.get("jobDescription"))
    interview_type = clean_text(raw.get("interviewType")) or "Mixed"

    combined_text = " ".join(part for part in [cv_text, job_description] if part).strip()
    if not combined_text:
        raise ValueError("Provide CV text or a job description.")

    inferred_category = DEFAULT_CATEGORY
    if RESUME_MODEL_PATH.exists():
        model = joblib.load(RESUME_MODEL_PATH)
        inferred_category = str(model.predict([combined_text])[0])

    question_category = QUESTION_CATEGORY_MAP.get(inferred_category, "software_engineering")

    questions_df = load_questions()
    selected = select_questions(questions_df, question_category, interview_type, n=4)

    difficulty_model = joblib.load(DIFFICULTY_MODEL_PATH) if DIFFICULTY_MODEL_PATH.exists() else None

    questions = []
    for row in selected.to_dict(orient="records"):
        question_text = clean_text(row.get("question_text"))
        question_type = clean_text(row.get("question_type")).lower() or infer_question_type(question_text)
        difficulty = clean_text(row.get("difficulty")).lower()

        if difficulty_model is not None:
            difficulty = predict_difficulty(difficulty_model, question_text, question_type, inferred_category)
        elif not difficulty:
            difficulty = "medium"

        questions.append(
            {
                "text": question_text,
                "type": question_type,
                "difficulty": difficulty,
                "jobCategory": question_category,
            }
        )

    return {
        "inferredCategory": inferred_category,
        "questionCategory": question_category,
        "interviewType": interview_type,
        "questionCount": len(questions),
        "questions": questions,
    }


def main() -> None:
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        raise ValueError("Missing JSON input on stdin.")

    payload = json.loads(raw_input)
    result = build_payload(payload)
    sys.stdout.write(json.dumps(result))


if __name__ == "__main__":
    main()
