from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="Interview Coach ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

semantic_model = SentenceTransformer("all-MiniLM-L6-v2")
PROGRESS_MODEL_PATH = Path(__file__).with_name("progress_model.joblib")
progress_artifact = joblib.load(PROGRESS_MODEL_PATH) if PROGRESS_MODEL_PATH.exists() else None


class EvaluationRequest(BaseModel):
    question: str
    expected_answer: str
    user_answer: str


class ProgressRequest(BaseModel):
    interviews: list[dict[str, Any]] = []
    challenges: list[dict[str, Any]] = []


def clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))


def safe_float(value: Any, fallback: float = 0) -> float:
    try:
        number = float(value)
        if np.isnan(number) or np.isinf(number):
            return fallback
        return number
    except Exception:
        return fallback


def get_attempt_date(attempt: dict[str, Any]) -> str:
    return str(attempt.get("date") or attempt.get("createdAt") or "")


def normalize_skill(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned or None


def extract_attempts(data: ProgressRequest) -> list[dict[str, Any]]:
    attempts: list[dict[str, Any]] = []

    for index, interview in enumerate(data.interviews):
        attempts.append(
            {
                "source": "Interview",
                "title": interview.get("title") or interview.get("question") or f"Interview {index + 1}",
                "score": clamp(safe_float(interview.get("score"))),
                "difficulty": safe_float(interview.get("difficulty"), 3),
                "date": get_attempt_date(interview),
                "used_ml": bool(interview.get("usedML", True)),
                "skills": ["Communication", "Answer Structure", "Interview Readiness"],
            }
        )

    for index, challenge in enumerate(data.challenges):
        raw_skills = challenge.get("testedSkills") or challenge.get("skills") or []
        skills = [skill for skill in (normalize_skill(item) for item in raw_skills) if skill]

        if not skills:
            skills = [
                normalize_skill(challenge.get("major")) or "General Reasoning",
                normalize_skill(challenge.get("type")) or "Problem Solving",
            ]

        attempts.append(
            {
                "source": "Challenge",
                "title": challenge.get("title") or f"Challenge {index + 1}",
                "score": clamp(safe_float(challenge.get("score"))),
                "difficulty": safe_float(challenge.get("difficulty"), 3),
                "date": get_attempt_date(challenge),
                "used_ml": bool(challenge.get("usedML", False)),
                "skills": skills,
            }
        )

    return sorted(attempts, key=lambda item: item.get("date") or "")


def skill_summary(attempts: list[dict[str, Any]]) -> dict[str, Any]:
    skill_map: dict[str, list[float]] = {}

    for attempt in attempts:
        for skill in attempt["skills"]:
            skill_map.setdefault(skill, []).append(attempt["score"])

    if not skill_map:
        return {
            "strongest_skill": "Not enough data yet",
            "weakest_skill": "Not enough data yet",
            "strongest_score": 0,
            "weakest_score": 0,
            "weak_skill_count": 0,
            "skill_count": 0,
        }

    rows = [
        {"skill": skill, "average": float(np.mean(scores)), "attempts": len(scores)}
        for skill, scores in skill_map.items()
    ]
    rows.sort(key=lambda row: row["average"], reverse=True)

    weak_skill_count = sum(1 for row in rows if row["average"] < 70)

    return {
        "strongest_skill": rows[0]["skill"],
        "weakest_skill": rows[-1]["skill"],
        "strongest_score": round(rows[0]["average"], 1),
        "weakest_score": round(rows[-1]["average"], 1),
        "weak_skill_count": weak_skill_count,
        "skill_count": len(rows),
        "skills": rows,
    }


def build_progress_features(attempts: list[dict[str, Any]], skills: dict[str, Any]) -> list[float]:
    scores = [attempt["score"] for attempt in attempts]
    midpoint = max(1, len(scores) // 2)
    older_scores = scores[:midpoint]
    recent_scores = scores[midpoint:] or scores

    interview_count = sum(1 for attempt in attempts if attempt["source"] == "Interview")
    challenge_count = sum(1 for attempt in attempts if attempt["source"] == "Challenge")

    return [
        len(attempts),
        interview_count,
        challenge_count,
        float(np.mean(scores)),
        float(np.mean(recent_scores)),
        float(np.mean(older_scores)),
        float(np.mean(recent_scores) - np.mean(older_scores)),
        float(np.std(scores)),
        float(np.max(scores)),
        float(np.min(scores)),
        float(np.mean([attempt["difficulty"] for attempt in attempts])),
        float(np.mean([1 if attempt["used_ml"] else 0 for attempt in attempts])),
        float(skills["weak_skill_count"]),
        float(skills["skill_count"]),
    ]


def fallback_readiness(average_score: float, predicted_next_score: float) -> str:
    if average_score >= 88 and predicted_next_score >= 85:
        return "Strong Candidate"
    if average_score >= 78 and predicted_next_score >= 75:
        return "Interview Ready"
    if average_score >= 62 or predicted_next_score >= 65:
        return "Almost Ready"
    return "Needs Practice"


def recommendation_from_insights(readiness: str, trend: str, skills: dict[str, Any]) -> str:
    weakest = skills.get("weakest_skill", "Not enough data yet")

    if weakest == "Not enough data yet":
        return "Complete more interviews and challenges to unlock stronger recommendations."

    if trend in ["Dropping", "Needs Consistency"]:
        return f"Repeat a medium-difficulty {weakest} challenge and focus on clearer structure, examples, and complete reasoning."

    if readiness in ["Needs Practice", "Almost Ready"]:
        return f"Practice more {weakest} tasks next. This is currently your weakest area."

    return f"Move to a harder {weakest} challenge to test whether your improvement is stable under higher difficulty."


@app.post("/evaluate-challenge")
def evaluate_challenge(data: EvaluationRequest):
    expected_embedding = semantic_model.encode([data.expected_answer])
    user_embedding = semantic_model.encode([data.user_answer])
    question_embedding = semantic_model.encode([data.question])

    quality_similarity = cosine_similarity(user_embedding, expected_embedding)[0][0]
    relevance_similarity = cosine_similarity(user_embedding, question_embedding)[0][0]

    length_bonus = min(len(data.user_answer.split()) / 120, 1) * 0.15
    structure_bonus = 0.1 if "\n" in data.user_answer or "-" in data.user_answer else 0

    final_score = (
        quality_similarity * 0.6
        + relevance_similarity * 0.25
        + length_bonus
        + structure_bonus
    ) * 100
    final_score = clamp(float(final_score))

    if final_score >= 80:
        label = "Excellent"
    elif final_score >= 60:
        label = "Good"
    else:
        label = "Needs Improvement"

    if quality_similarity < 0.6:
        feedback = "Your answer does not fully cover the expected concepts."
    elif relevance_similarity < 0.5:
        feedback = "Your answer may not be directly focused on the question."
    else:
        feedback = "Your answer is relevant and covers the main expected ideas."

    return {
        "score": round(final_score, 2),
        "label": label,
        "quality_similarity": round(float(quality_similarity), 2),
        "relevance_similarity": round(float(relevance_similarity), 2),
        "feedback": feedback,
    }


@app.post("/score")
def score(data: EvaluationRequest):
    return evaluate_challenge(data)


@app.post("/predict-progress")
def predict_progress(data: ProgressRequest):
    attempts = extract_attempts(data)

    if not attempts:
        return {
            "hasData": False,
            "modelType": "Trained Random Forest progress model",
            "readinessLevel": "Start Practicing",
            "readinessConfidence": 0,
            "predictedNextScore": None,
            "trend": "No trend yet",
            "averageScore": 0,
            "recentAverage": 0,
            "olderAverage": 0,
            "consistency": "No data yet",
            "strongestSkill": "Not enough data yet",
            "weakestSkill": "Not enough data yet",
            "recommendation": "Complete your first challenge or interview.",
            "metrics": progress_artifact.get("metrics") if progress_artifact else None,
        }

    skills = skill_summary(attempts)
    features = build_progress_features(attempts, skills)
    feature_array = np.array([features], dtype=float)

    average_score = features[3]
    recent_average = features[4]
    older_average = features[5]
    trend_change = features[6]
    score_std = features[7]

    if progress_artifact:
        predicted_next_score = float(progress_artifact["score_model"].predict(feature_array)[0])
        readiness_level = str(progress_artifact["readiness_model"].predict(feature_array)[0])

        probabilities = progress_artifact["readiness_model"].predict_proba(feature_array)[0]
        readiness_confidence = round(float(np.max(probabilities)), 2)
        metrics = progress_artifact.get("metrics")
    else:
        predicted_next_score = recent_average + 0.45 * trend_change - (4 if score_std >= 18 else 0)
        readiness_level = fallback_readiness(average_score, predicted_next_score)
        readiness_confidence = 0.5
        metrics = None

    predicted_next_score = round(clamp(predicted_next_score), 1)

    if len(attempts) < 2:
        trend = "Not enough attempts yet"
    elif trend_change >= 8:
        trend = "Strongly Improving"
    elif trend_change >= 3:
        trend = "Improving"
    elif trend_change <= -8:
        trend = "Dropping"
    elif trend_change <= -3:
        trend = "Needs Consistency"
    else:
        trend = "Stable"

    if score_std >= 18:
        consistency = "Inconsistent"
    elif score_std >= 10:
        consistency = "Moderately consistent"
    else:
        consistency = "Very consistent"

    return {
        "hasData": True,
        "modelType": "Trained Random Forest progress model",
        "readinessLevel": readiness_level,
        "readinessConfidence": readiness_confidence,
        "predictedNextScore": predicted_next_score,
        "trend": trend,
        "trendChange": round(float(trend_change), 1),
        "averageScore": round(float(average_score), 1),
        "recentAverage": round(float(recent_average), 1),
        "olderAverage": round(float(older_average), 1),
        "consistency": consistency,
        "strongestSkill": skills["strongest_skill"],
        "weakestSkill": skills["weakest_skill"],
        "strongestScore": skills["strongest_score"],
        "weakestScore": skills["weakest_score"],
        "recommendation": recommendation_from_insights(readiness_level, trend, skills),
        "featuresUsed": progress_artifact.get("feature_names") if progress_artifact else [],
        "metrics": metrics,
    }
