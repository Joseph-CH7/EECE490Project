from __future__ import annotations

import random
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

MODEL_PATH = Path(__file__).with_name("progress_model.joblib")
RANDOM_SEED = 42

FEATURE_NAMES = [
    "total_attempts",
    "interview_count",
    "challenge_count",
    "average_score",
    "recent_average",
    "older_average",
    "trend_change",
    "score_std",
    "best_score",
    "worst_score",
    "average_difficulty",
    "ml_attempt_ratio",
    "weak_skill_count",
    "skill_count",
]


def clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))


def readiness_label(average_score: float, predicted_next_score: float, trend_change: float, score_std: float) -> str:
    if average_score >= 86 and predicted_next_score >= 85 and score_std <= 14:
        return "Strong Candidate"
    if average_score >= 76 and predicted_next_score >= 74:
        return "Interview Ready"
    if average_score >= 60 or predicted_next_score >= 63:
        return "Almost Ready"
    return "Needs Practice"


def generate_training_rows(n_rows: int = 5000):
    random.seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    X = []
    y_score = []
    y_label = []

    for _ in range(n_rows):
        total_attempts = random.randint(1, 35)
        interview_count = random.randint(0, total_attempts)
        challenge_count = total_attempts - interview_count

        base_ability = random.uniform(35, 92)
        learning_slope = random.uniform(-1.8, 2.8)
        noise_level = random.uniform(3, 16)

        scores = []
        difficulties = []
        ml_flags = []

        for attempt_index in range(total_attempts):
            difficulty = random.randint(1, 5)
            difficulties.append(difficulty)
            difficulty_penalty = (difficulty - 3) * random.uniform(1.2, 3.5)
            score = base_ability + attempt_index * learning_slope - difficulty_penalty + random.gauss(0, noise_level)
            scores.append(clamp(score))
            ml_flags.append(1 if random.random() < 0.65 else 0)

        midpoint = max(1, total_attempts // 2)
        older_scores = scores[:midpoint]
        recent_scores = scores[midpoint:] or scores

        average_score = float(np.mean(scores))
        recent_average = float(np.mean(recent_scores))
        older_average = float(np.mean(older_scores))
        trend_change = recent_average - older_average
        score_std = float(np.std(scores))
        best_score = float(np.max(scores))
        worst_score = float(np.min(scores))
        average_difficulty = float(np.mean(difficulties))
        ml_attempt_ratio = float(np.mean(ml_flags))
        skill_count = random.randint(2, 9)

        weak_skill_count = int(
            max(
                0,
                min(
                    skill_count,
                    round((75 - average_score) / 8 + random.uniform(-1, 2)),
                ),
            )
        )

        true_next_score = clamp(
            recent_average
            + 0.58 * trend_change
            - 0.18 * score_std
            + 0.9 * np.log1p(total_attempts)
            - 1.1 * weak_skill_count
            + random.gauss(0, 3.5)
        )

        label = readiness_label(average_score, true_next_score, trend_change, score_std)

        X.append(
            [
                total_attempts,
                interview_count,
                challenge_count,
                average_score,
                recent_average,
                older_average,
                trend_change,
                score_std,
                best_score,
                worst_score,
                average_difficulty,
                ml_attempt_ratio,
                weak_skill_count,
                skill_count,
            ]
        )
        y_score.append(true_next_score)
        y_label.append(label)

    return np.array(X, dtype=float), np.array(y_score), np.array(y_label)


def main():
    X, y_score, y_label = generate_training_rows()

    X_train, X_test, y_score_train, y_score_test, y_label_train, y_label_test = train_test_split(
        X, y_score, y_label, test_size=0.2, random_state=RANDOM_SEED, stratify=y_label
    )

    score_model = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "regressor",
                RandomForestRegressor(
                    n_estimators=220,
                    random_state=RANDOM_SEED,
                    min_samples_leaf=3,
                ),
            ),
        ]
    )

    readiness_model = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=220,
                    random_state=RANDOM_SEED,
                    class_weight="balanced",
                    min_samples_leaf=3,
                ),
            ),
        ]
    )

    score_model.fit(X_train, y_score_train)
    readiness_model.fit(X_train, y_label_train)

    predicted_scores = score_model.predict(X_test)
    predicted_labels = readiness_model.predict(X_test)

    metrics = {
        "next_score_mae": round(float(mean_absolute_error(y_score_test, predicted_scores)), 3),
        "readiness_accuracy": round(float(accuracy_score(y_label_test, predicted_labels)), 3),
        "training_rows": int(len(X)),
        "test_rows": int(len(X_test)),
    }

    artifact = {
        "feature_names": FEATURE_NAMES,
        "score_model": score_model,
        "readiness_model": readiness_model,
        "metrics": metrics,
        "label_order": ["Needs Practice", "Almost Ready", "Interview Ready", "Strong Candidate"],
        "training_note": "Supervised Random Forest models trained on synthetic learning-progress trajectories. Replace with real user-history labels when enough production data is available.",
    }

    joblib.dump(artifact, MODEL_PATH)

    print("Saved", MODEL_PATH)
    print(metrics)


if __name__ == "__main__":
    main()
