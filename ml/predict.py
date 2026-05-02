import joblib


MODEL_PATH = "ml/model.pkl"

model = joblib.load(MODEL_PATH)


def score_answer(question, expected_answer, user_answer, difficulty="medium"):
    text = (
        f"Question: {question} "
        f"Expected answer: {expected_answer} "
        f"User answer: {user_answer} "
        f"Difficulty: {difficulty}"
    )

    score = float(model.predict([text])[0])
    score = max(0, min(100, score))

    if score < 50:
        label = "bad"
    elif score < 80:
        label = "okay"
    else:
        label = "great"

    return {
        "score": round(score, 2),
        "label": label
    }