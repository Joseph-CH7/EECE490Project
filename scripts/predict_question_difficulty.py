from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path("models/question_difficulty_model.joblib")

TECHNICAL_KEYWORDS = {
    "algorithm", "api", "architecture", "cache", "class", "database", "debug",
    "design", "distributed", "framework", "machine learning", "model",
    "network", "oop", "performance", "process", "programming", "scalable",
    "sql", "system", "thread"
}

BEHAVIORAL_KEYWORDS = {
    "challenge", "collaborate", "communication", "conflict", "deadline",
    "feedback", "leadership", "mistake", "pressure", "situation", "strength",
    "stress", "teammate", "time", "weakness"
}

HARD_PATTERNS = (
    "design", "architect", "scale", "optimize", "distributed", "millions"
)

EASY_PATTERNS = (
    "what is", "define", "difference between", "tell me about a time"
)


def infer_question_type(text: str) -> str:
    lowered = text.lower()
    behavioral_score = sum(keyword in lowered for keyword in BEHAVIORAL_KEYWORDS)
    technical_score = sum(keyword in lowered for keyword in TECHNICAL_KEYWORDS)
    return "behavioral" if behavioral_score > technical_score else "technical"


def count_keyword_hits(text: str, keywords: set[str]) -> int:
    lowered = text.lower()
    return sum(keyword in lowered for keyword in keywords)


def build_examples() -> pd.DataFrame:
    questions = [
        "What is polymorphism in object oriented programming?",
        "Explain the difference between process and thread.",
        "How would you design a distributed caching system for millions of users?",
        "Tell me about a time you worked under pressure.",
        "What is overfitting in machine learning?",
    ]

    rows = []
    for question in questions:
        lowered = question.lower()
        rows.append(
            {
                "question_text": question,
                "question_type": infer_question_type(question),
                "job_category": "software_engineering",
                "technical_keyword_count": count_keyword_hits(question, TECHNICAL_KEYWORDS),
                "behavioral_keyword_count": count_keyword_hits(question, BEHAVIORAL_KEYWORDS),
                "starts_hard_pattern": int(any(lowered.startswith(pattern) for pattern in HARD_PATTERNS)),
                "starts_easy_pattern": int(any(lowered.startswith(pattern) for pattern in EASY_PATTERNS)),
            }
        )

    return pd.DataFrame(rows)


def main():
    if not MODEL_PATH.exists():
        print("Model file not found. Train the model first.")
        return

    model = joblib.load(MODEL_PATH)

    examples = build_examples()
    preds = model.predict(examples)

    print("\nPredictions:")
    for q, q_type, p in zip(examples["question_text"], examples["question_type"], preds):
        print(f"- [{p}] ({q_type}) {q}")


if __name__ == "__main__":
    main()
