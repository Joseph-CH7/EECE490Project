from pathlib import Path
import pandas as pd
import joblib

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import OneHotEncoder
from sklearn.svm import LinearSVC
from sklearn.metrics import classification_report, accuracy_score

DATA_PATH = Path("data/processed/questions_with_features_v2.csv")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def main():
    df = pd.read_csv(DATA_PATH)

    required = ["question_text", "question_type", "job_category", "source"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    df = df.dropna(subset=["question_text", "question_type", "source"]).copy()
    df["question_text"] = df["question_text"].astype(str).str.lower().str.strip()
    df["question_type"] = df["question_type"].astype(str).str.lower().str.strip()
    df["job_category"] = df["job_category"].astype(str).str.lower().str.strip()
    df["source"] = df["source"].astype(str).str.lower().str.strip()

    df = df[df["question_type"].isin(["technical", "behavioral"])].copy()
    df = df.drop_duplicates(subset=["question_text"])

    print("Sources:")
    print(df["source"].value_counts())

    # choose one source as test set
    test_source = df["source"].value_counts().index[0]
    print("\nUsing held-out source as test:", test_source)

    train_df = df[df["source"] != test_source].copy()
    test_df = df[df["source"] == test_source].copy()

    print("\nTrain shape:", train_df.shape)
    print("Test shape:", test_df.shape)

    print("\nTrain distribution:")
    print(train_df["question_type"].value_counts())
    print("\nTest distribution:")
    print(test_df["question_type"].value_counts())

    X_train = train_df[["question_text", "job_category"]]
    y_train = train_df["question_type"]

    X_test = test_df[["question_text", "job_category"]]
    y_test = test_df["question_type"]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "text",
                TfidfVectorizer(
                    stop_words="english",
                    ngram_range=(1, 2),
                    max_features=20000,
                    min_df=2,
                    sublinear_tf=True,
                ),
                "question_text",
            ),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore"),
                ["job_category"],
            ),
        ]
    )

    model = Pipeline([
        ("features", preprocessor),
        ("classifier", LinearSVC(random_state=42, max_iter=15000, class_weight="balanced")),
    ])

    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    print("\nSource-holdout Accuracy:", accuracy_score(y_test, preds))
    print("\nClassification Report:")
    print(classification_report(y_test, preds, zero_division=0))

    joblib.dump(model, MODEL_DIR / "question_type_model_source_holdout.joblib")
    print("\nSaved model to models/question_type_model_source_holdout.joblib")

if __name__ == "__main__":
    main()