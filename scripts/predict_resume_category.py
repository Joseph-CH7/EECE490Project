from pathlib import Path
import joblib

MODEL_PATH = Path("models/resume_category_model.joblib")


def main():
    if not MODEL_PATH.exists():
        print("Model file not found. Train the model first.")
        return

    model = joblib.load(MODEL_PATH)

    examples = [
        "Built REST APIs with Python and Flask, worked on SQL databases, deployed backend systems and maintained cloud services.",
        "Managed recruitment pipelines, employee onboarding, HR documentation, and internal policy communication.",
        "Prepared financial statements, handled forecasting, budgeting, and account reconciliation.",
        "Led digital campaigns, social media content planning, SEO optimization, and brand awareness analysis.",
    ]

    preds = model.predict(examples)

    print("\nPredictions:")
    for text, pred in zip(examples, preds):
        print(f"- [{pred}] {text[:120]}...")


if __name__ == "__main__":
    main()