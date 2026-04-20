from pathlib import Path
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.metrics import classification_report, accuracy_score

DATA_PATH = Path("data/processed/questions_with_features_v2.csv")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def main():
    df = pd.read_csv(DATA_PATH)
    df = df.dropna(subset=["question_text", "question_type"]).copy()
    df["question_text"] = df["question_text"].astype(str).str.lower().str.strip()
    df["question_type"] = df["question_type"].astype(str).str.lower().str.strip()

    df = df[df["question_type"].isin(["technical", "behavioral"])]

    # remove exact duplicate question texts
    df = df.drop_duplicates(subset=["question_text"])

    print("Dataset size:", df.shape)
    print("\nQuestion type distribution:")
    print(df["question_type"].value_counts())

    X = df["question_text"]
    y = df["question_type"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        stratify=y,
        random_state=42,
    )

    model = Pipeline([
        ("tfidf", TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=20000,
            min_df=2,
            sublinear_tf=True,
        )),
        ("clf", LinearSVC(
            random_state=42,
            max_iter=15000,
            class_weight="balanced",
            C=1.0,
        )),
    ])

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_acc = cross_val_score(model, X_train, y_train, cv=cv, scoring="accuracy")
    cv_f1 = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1_macro")

    print("\nCV Accuracy:", cv_acc)
    print("Mean CV Accuracy:", cv_acc.mean())
    print("\nCV Macro F1:", cv_f1)
    print("Mean CV Macro F1:", cv_f1.mean())

    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    print("\nTest Accuracy:", accuracy_score(y_test, preds))
    print("\nClassification Report:")
    print(classification_report(y_test, preds, zero_division=0))

    joblib.dump(model, MODEL_DIR / "question_type_model_text_only.joblib")
    print("\nSaved model to models/question_type_model_text_only.joblib")

if __name__ == "__main__":
    main()