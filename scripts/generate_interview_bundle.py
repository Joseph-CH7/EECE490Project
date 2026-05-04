from __future__ import annotations

import json
import re
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

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has",
    "have", "in", "into", "is", "it", "of", "on", "or", "our", "that", "the",
    "their", "this", "to", "using", "with", "you", "your", "will", "work",
    "role", "job", "candidate", "experience", "team", "skills", "ability",
}

IMPORTANT_TERMS = {
    "api", "endpoint", "endpoints", "backend", "frontend", "fullstack",
    "full-stack", "react", "next", "javascript", "typescript",
    "python", "java", "sql", "database", "postgres", "mongodb", "firebase",
    "cloud", "aws", "docker", "kubernetes", "security", "secure",
    "authentication", "authorization", "encryption", "payment", "mobile",
    "distributed", "scalable", "performance", "latency", "testing", "debug",
    "machine", "learning", "model", "data", "analytics", "finance", "sales",
}

HIGH_PRIORITY_TERMS = {
    "payment", "mobile", "security", "secure", "authentication",
    "authorization", "encryption", "fraud", "transaction", "transactions",
    "api", "endpoint", "endpoints", "rest", "backend", "frontend",
    "fullstack", "full-stack", "javascript", "typescript",
}

BAD_QUESTION_PATTERNS = (
    "when would you use sql injection over big o notation",
    "explain the difference between sql injection and big o notation",
    "rest api over virtual memory",
    "rest api over stack",
    "rest api over linked list",
    "rest api over dictionary",
    "rest api over exception handling",
    "rest api over multithreading",
    "rest api over big o notation",
    "when would you use rest api over",
    "difference between rest api and",
    "api over virtual memory",
)

CONCEPT_GROUPS = {
    "array": "data_structure",
    "linked list": "data_structure",
    "dictionary": "data_structure",
    "hashmap": "data_structure",
    "queue": "data_structure",
    "stack": "data_structure",
    "inheritance": "oop",
    "encapsulation": "oop",
    "polymorphism": "oop",
    "interface": "oop",
    "class": "oop",
    "object": "oop",
    "deadlock": "concurrency",
    "multithreading": "concurrency",
    "thread": "concurrency",
    "race condition": "concurrency",
    "sql injection": "security",
    "xss": "security",
    "authentication": "security",
    "authorization": "security",
    "merge sort": "algorithm",
    "quick sort": "algorithm",
    "binary search": "algorithm",
    "big o notation": "algorithm",
    "recursion": "algorithm",
    "pointers": "memory",
    "pointer": "memory",
    "virtual memory": "memory",
    "heap memory": "memory",
    "stack memory": "memory",
}

ALLOWED_CROSS_GROUP_PAIRS = {
    frozenset({"sql", "nosql"}),
    frozenset({"http", "https"}),
    frozenset({"git", "svn"}),
    frozenset({"black-box testing", "white-box testing"}),
    frozenset({"java", "javascript"}),
    frozenset({"stack memory", "heap memory"}),
}

FALLBACK_SOFTWARE_QUESTIONS = [
    {
        "question_text": "What is a RESTful API, and how would you design one for a simple user-management feature?",
        "question_type": "technical",
        "job_category": "software_engineering",
        "difficulty": "medium",
        "source": "fallback",
        "source_priority": 0,
    },
    {
        "question_text": "Explain the difference between SQL and NoSQL databases, and give one case where each is a better choice.",
        "question_type": "technical",
        "job_category": "software_engineering",
        "difficulty": "medium",
        "source": "fallback",
        "source_priority": 0,
    },
    {
        "question_text": "How would you debug a frontend page that is not showing updated data after an API request?",
        "question_type": "technical",
        "job_category": "software_engineering",
        "difficulty": "medium",
        "source": "fallback",
        "source_priority": 0,
    },
    {
        "question_text": "Tell me about a time when you had to make a technical decision with incomplete information.",
        "question_type": "behavioral",
        "job_category": "software_engineering",
        "difficulty": "medium",
        "source": "fallback",
        "source_priority": 0,
    },
    {
        "question_text": "Describe a situation where you took ownership of a problem outside your formal responsibilities.",
        "question_type": "behavioral",
        "job_category": "software_engineering",
        "difficulty": "medium",
        "source": "fallback",
        "source_priority": 0,
    },
]


def clean_text(value: object) -> str:
    if value is None or pd.isna(value):
        return ""
    text = str(value).strip()
    if text.lower() in {"nan", "none", "null"}:
        return ""
    return text


def normalize_question_for_dedup(text: str) -> str:
    lowered = text.lower()
    lowered = re.sub(
        r"\b(can you|could you|please|explain|describe|tell me about|what is|what are|how would|how do)\b",
        " ",
        lowered,
    )
    lowered = re.sub(r"[^a-z0-9\s]", " ", lowered)
    return re.sub(r"\s+", " ", lowered).strip()


def question_signature(text: str) -> str:
    normalized = normalize_question_for_dedup(text)
    words = [
        word
        for word in normalized.split()
        if len(word) > 3 and word not in STOPWORDS
    ]
    return " ".join(sorted(words[:8]))


def find_concepts(text: str) -> list[str]:
    lowered = text.lower()
    return [
        concept
        for concept in CONCEPT_GROUPS
        if re.search(rf"(^|[^a-z0-9]){re.escape(concept)}([^a-z0-9]|$)", lowered)
    ]


def is_bad_comparison_question(text: str) -> bool:
    lowered = text.lower()
    is_comparison = (
        "difference between" in lowered or
        re.search(r"\bwhen would you use\b.+\bover\b", lowered) is not None
    )

    if not is_comparison:
        return False

    concepts = find_concepts(text)
    if len(concepts) < 2:
        return False

    for first_index, first in enumerate(concepts):
        for second in concepts[first_index + 1:]:
            if frozenset({first, second}) in ALLOWED_CROSS_GROUP_PAIRS:
                return False

            if CONCEPT_GROUPS[first] != CONCEPT_GROUPS[second]:
                return True

    return False


def filter_bad_questions(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    filtered = df.copy()
    lowered = filtered["question_text"].str.lower()

    for pattern in BAD_QUESTION_PATTERNS:
        filtered = filtered[~lowered.str.contains(pattern, na=False)].copy()
        lowered = filtered["question_text"].str.lower()

    filtered = filtered[
        ~filtered["question_text"].map(is_bad_comparison_question)
    ].copy()

    if "source" in filtered.columns:
        synthetic_comparisons = (
            filtered["source"].eq("full_interview_questions_dataset") &
            filtered["question_text"].str.lower().str.contains(
                r"difference between|when would you use .+ over ",
                regex=True,
                na=False,
            )
        )
        filtered = filtered[~synthetic_comparisons].copy()

    return filtered


def dedupe_similar_questions(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    deduped_rows = []
    seen_normalized: set[str] = set()
    seen_signatures: set[str] = set()

    for row in df.to_dict(orient="records"):
        question_text = clean_text(row.get("question_text"))
        normalized = normalize_question_for_dedup(question_text)
        signature = question_signature(question_text)

        if normalized in seen_normalized or (signature and signature in seen_signatures):
            continue

        seen_normalized.add(normalized)
        if signature:
            seen_signatures.add(signature)
        deduped_rows.append(row)

    return pd.DataFrame(deduped_rows)


def infer_question_type(text: str) -> str:
    lowered = text.lower()
    behavioral_score = sum(keyword in lowered for keyword in BEHAVIORAL_KEYWORDS)
    technical_score = sum(keyword in lowered for keyword in TECHNICAL_KEYWORDS)
    return "behavioral" if behavioral_score > technical_score else "technical"


def count_keyword_hits(text: str, keywords: set[str]) -> int:
    lowered = text.lower()
    return sum(keyword in lowered for keyword in keywords)


def extract_focus_terms(*texts: str) -> set[str]:
    combined = " ".join(texts).lower()
    words = re.findall(r"[a-z][a-z0-9+#.]{2,}", combined)
    terms = {
        word.strip(".")
        for word in words
        if word not in STOPWORDS and (len(word) >= 4 or word in IMPORTANT_TERMS)
    }

    terms = terms | {term for term in IMPORTANT_TERMS if term in combined}

    if "endpoint" in terms or "endpoints" in terms or "rest" in terms:
        terms.add("api")
    if "full" in terms and "stack" in terms:
        terms.update({"fullstack", "full-stack", "frontend", "backend", "api"})

    return terms


def has_technical_focus(focus_terms: set[str]) -> bool:
    return bool(
        focus_terms
        & {
            "api", "endpoint", "endpoints", "backend", "frontend",
            "fullstack", "full-stack", "javascript", "typescript", "react",
            "node", "database", "sql", "security", "authentication",
        }
    )


def priority_focus_groups(focus_terms: set[str]) -> list[set[str]]:
    groups: list[set[str]] = []

    if focus_terms & {"api", "endpoint", "endpoints", "rest"}:
        groups.append({"api", "endpoint", "endpoints", "rest", "cors"})
    if focus_terms & {"javascript", "typescript"}:
        groups.append({"javascript", "typescript", "closure", "event delegation"})
    if focus_terms & {"backend", "fullstack", "full-stack"}:
        groups.append({"backend", "server", "api", "database"})
    if focus_terms & {"frontend", "react", "next"}:
        groups.append({"frontend", "react", "next", "javascript"})

    return groups


def score_question_relevance(question_text: str, focus_terms: set[str]) -> int:
    if not focus_terms:
        return 0

    lowered = question_text.lower()
    score = 0

    for term in focus_terms:
        if term in lowered:
            if term in HIGH_PRIORITY_TERMS:
                score += 6
            elif term in IMPORTANT_TERMS:
                score += 3
            else:
                score += 1

    return score


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
    df = filter_bad_questions(df)
    df = df.drop_duplicates(subset=["question_text"])
    return df


def select_questions(
    df: pd.DataFrame,
    job_category: str,
    interview_type: str,
    focus_terms: set[str],
    n: int = 4,
) -> pd.DataFrame:
    interview_type = clean_text(interview_type).lower()
    job_category = clean_text(job_category).lower()

    filtered = df[df["job_category"] == job_category].copy()
    if filtered.empty:
        filtered = df.copy()

    def rank_and_sample(pool_df: pd.DataFrame, take_n: int) -> pd.DataFrame:
        if pool_df.empty or take_n <= 0:
            return pool_df.head(0)

        pool_df = pool_df.copy()

        if not focus_terms:
            return pool_df.sample(n=min(take_n, len(pool_df))).reset_index(drop=True)

        pool_df["relevance_score"] = pool_df["question_text"].map(
            lambda text: score_question_relevance(text, focus_terms)
        )
        ranked_pool = pool_df.sort_values(
            by=["relevance_score", "source_priority", "difficulty", "question_text"],
            ascending=[False, True, True, True],
        ).reset_index(drop=True)
        best_relevance = int(ranked_pool["relevance_score"].max())
        if best_relevance > 0:
            ranked_pool = ranked_pool[ranked_pool["relevance_score"] > 0].reset_index(drop=True)

        priority_rows = []
        used_questions: set[str] = set()
        for group in priority_focus_groups(focus_terms):
            if len(priority_rows) >= take_n:
                break

            group_match = ranked_pool[
                ranked_pool["question_text"].str.lower().map(
                    lambda text: any(term in text for term in group)
                )
            ].head(1)

            if group_match.empty:
                continue

            row = group_match.iloc[0].to_dict()
            question_text = clean_text(row.get("question_text"))
            if question_text and question_text not in used_questions:
                priority_rows.append(row)
                used_questions.add(question_text)

        if priority_rows:
            remaining_ranked = ranked_pool[
                ~ranked_pool["question_text"].isin(used_questions)
            ].reset_index(drop=True)
            ranked_pool = pd.concat(
                [pd.DataFrame(priority_rows), remaining_ranked],
                ignore_index=True,
            )

        shortlist = ranked_pool.head(max(take_n * 4, take_n))
        locked = pd.DataFrame(priority_rows).head(take_n) if priority_rows else shortlist.head(0)
        remaining_slots = take_n - len(locked)
        remaining_shortlist = shortlist[
            ~shortlist["question_text"].isin(locked.get("question_text", []))
        ]
        sampled = remaining_shortlist.sample(
            n=min(remaining_slots, len(remaining_shortlist))
        ) if remaining_slots > 0 else remaining_shortlist.head(0)
        return pd.concat([locked, sampled], ignore_index=True).reset_index(drop=True)

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
        technical_count = n // 2
        if has_technical_focus(focus_terms):
            technical_count = max(technical_count, n - 1)

        technical = rank_and_sample(
            filtered[filtered["question_type"] == "technical"].copy(),
            technical_count,
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
        remaining = filter_bad_questions(remaining)
        extra = remaining.sample(n=min(n - len(pool), len(remaining)))
        pool = pd.concat([pool, extra], ignore_index=True)

    pool = dedupe_similar_questions(pool)
    pool = filter_bad_questions(pool)

    if len(pool) < n and job_category == "software_engineering":
        fallback = pd.DataFrame(FALLBACK_SOFTWARE_QUESTIONS)
        fallback = fallback[~fallback["question_text"].isin(pool["question_text"])]
        pool = pd.concat([pool, fallback.head(n - len(pool))], ignore_index=True)

    return rank_and_sample(pool, n)


def build_payload(raw: dict[str, object]) -> dict[str, object]:
    cv_text = clean_text(raw.get("cvText"))
    job_description = clean_text(raw.get("jobDescription"))
    interview_type = clean_text(raw.get("interviewType")) or "Mixed"
    category_override = clean_text(raw.get("categoryOverride")).lower()

    combined_text = " ".join(part for part in [cv_text, job_description] if part).strip()
    if not combined_text and not category_override:
        raise ValueError("Provide CV text, a job description, or a selected category.")

    inferred_category = DEFAULT_CATEGORY
    if combined_text and RESUME_MODEL_PATH.exists():
        model = joblib.load(RESUME_MODEL_PATH)
        inferred_category = str(model.predict([combined_text])[0])

    selected_category = category_override or inferred_category
    question_category = QUESTION_CATEGORY_MAP.get(selected_category, "software_engineering")

    questions_df = load_questions()
    focus_terms = extract_focus_terms(cv_text, job_description) if job_description else set()
    selected = select_questions(questions_df, question_category, interview_type, focus_terms, n=4)

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
                "relevanceScore": int(row.get("relevance_score", 0) or 0),
            }
        )

    return {
        "inferredCategory": inferred_category,
        "selectedCategory": selected_category,
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
