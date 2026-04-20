from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path("models/question_type_model.joblib")

def main():
    model = joblib.load(MODEL_PATH)

    samples = pd.DataFrame([
        {
            "question_text": "Tell me about a time you had a conflict with a teammate.",
            "job_category": "software_engineering",
        },
        {
            "question_text": "Explain the difference between a process and a thread.",
            "job_category": "software_engineering",
        },
        {
            "question_text": "Describe how you handled pressure while debugging a production issue.",
            "job_category": "software_engineering",
        },
        {
            "question_text": "Design a scalable URL shortener system.",
            "job_category": "software_engineering",
        },
    ])

    preds = model.predict(samples)

    for text, pred in zip(samples["question_text"], preds):
        print(f"[{pred}] {text}")

if __name__ == "__main__":
    main()