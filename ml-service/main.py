from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = FastAPI()

model = SentenceTransformer("all-MiniLM-L6-v2")


class EvaluationRequest(BaseModel):
    question: str
    expected_answer: str
    user_answer: str


@app.post("/evaluate-challenge")
def evaluate_challenge(data: EvaluationRequest):
    expected_embedding = model.encode([data.expected_answer])
    user_embedding = model.encode([data.user_answer])
    question_embedding = model.encode([data.question])

    quality_similarity = cosine_similarity(user_embedding, expected_embedding)[0][0]
    relevance_similarity = cosine_similarity(user_embedding, question_embedding)[0][0]

    length_bonus = min(len(data.user_answer.split()) / 120, 1) * 0.15
    structure_bonus = 0.1 if "\n" in data.user_answer or "-" in data.user_answer else 0
    coverage_score = cosine_similarity(user_embedding, expected_embedding)

    final_score = (
        quality_similarity * 0.6 +
        relevance_similarity * 0.25 +
        length_bonus +
        structure_bonus
    ) * 100

    if final_score >= 80:
        label = "Excellent"
    elif final_score >= 60:
        label = "Good"
    else:
        label = "Needs Improvement"

    missing_feedback = ""

    if quality_similarity < 0.6:
        missing_feedback = "Your answer does not fully cover the expected concepts."
    elif relevance_similarity < 0.5:
        missing_feedback = "Your answer may not be directly focused on the question."
    else:
        missing_feedback = "Your answer is relevant and covers the main expected ideas."

    return {
        "score": round(float(final_score), 2),
        "label": label,
        "quality_similarity": round(float(quality_similarity), 2),
        "relevance_similarity": round(float(relevance_similarity), 2),
        "feedback": missing_feedback
    }