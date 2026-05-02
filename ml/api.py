from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models = joblib.load("ml/model.pkl")

embedding_model = models["embedding_model"]
score_model = models["score_model"]
label_model = models["label_model"]


class Request(BaseModel):
    question: str
    expected_answer: str
    user_answer: str
    difficulty: str = "medium"


@app.post("/score")
def score_answer(req: Request):
    text = (
        f"User answer: {req.user_answer} "
        f"Difficulty: {req.difficulty}"
    )

    embedding = embedding_model.encode([text])
    embedding = np.array(embedding)

    predicted_score = float(score_model.predict(embedding)[0])
    predicted_score = max(0, min(100, predicted_score))

    predicted_label = label_model.predict(embedding)[0]
    if predicted_label == "bad":
        predicted_score = min(predicted_score, 49)
    elif predicted_label == "okay":
        predicted_score = min(max(predicted_score, 50), 79)
    elif predicted_label == "great":
        predicted_score = max(predicted_score, 80)

    return {
        "score": round(predicted_score, 2),
        "label": predicted_label,
        "feedback": "This score and label were predicted using sentence embeddings and two trained ML models."
    }