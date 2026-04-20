from pathlib import Path
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, f1_score

DATA_PATH = Path("data/processed/resumes_normalized.csv")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def require_columns(df, required):
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def clean_text(x):
    if pd.isna(x):
        return ""
    x = str(x).strip()
    if x.lower() in {"nan", "none", "null"}:
        return ""
    return x


def build_model():
    return Pipeline([
        ("tfidf", TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 3),
            max_features=20000,
            min_df=1,
            max_df=0.9,
            sublinear_tf=True,
        )),
        ("clf", LinearSVC(
            class_weight="balanced",
            max_iter=8000,
            C=1.5,
        )),
    ])


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Input file not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH).copy()

    require_columns(df, ["resume_text", "job_category_normalized"])

    df["resume_text"] = df["resume_text"].map(clean_text)
    df["job_category_normalized"] = (
        df["job_category_normalized"]
        .map(clean_text)
        .str.lower()
    )

    # remove empty rows and remove the messy bucket
    df = df[
        (df["resume_text"] != "") &
        (df["job_category_normalized"] != "") &
        (~df["job_category_normalized"].isin(["unknown", "professional_other"]))
    ].copy()

    # optional merge to reduce overlap
    df["job_category_normalized"] = df["job_category_normalized"].replace({
        "business_development": "business_commercial"
    })

    counts = df["job_category_normalized"].value_counts()
    keep_labels = counts[counts >= 50].index
    df = df[df["job_category_normalized"].isin(keep_labels)].copy()

    if df.empty:
        raise ValueError("No data left after filtering categories.")

    if df["job_category_normalized"].nunique() < 2:
        raise ValueError("Need at least 2 classes to train.")

    print("Dataset shape:", df.shape)

    print("\nCategory distribution:")
    print(df["job_category_normalized"].value_counts())

    X = df["resume_text"]
    y = df["job_category_normalized"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    print("\nTrain size:", len(X_train))
    print("Test size:", len(X_test))

    model = build_model()

    min_class_count = y_train.value_counts().min()
    cv_folds = min(3, min_class_count)

    if cv_folds < 2:
        raise ValueError("Not enough samples per class for cross-validation.")

    cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)

    scores = cross_val_score(
        model,
        X_train,
        y_train,
        cv=cv,
        scoring="f1_macro",
        n_jobs=-1
    )

    print("\nCV Macro F1:", scores)
    print("Mean CV Macro F1:", scores.mean())

    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    acc = accuracy_score(y_test, preds)
    macro_f1 = f1_score(y_test, preds, average="macro")

    print("\nTest Accuracy:", acc)
    print("Test Macro F1:", macro_f1)

    print("\nClassification Report:")
    print(classification_report(y_test, preds, zero_division=0))

    labels = sorted(y.unique())
    cm = confusion_matrix(y_test, preds, labels=labels)

    print("\nLabels order:")
    print(labels)

    print("\nConfusion Matrix:")
    print(cm)

    model_file = MODEL_DIR / "resume_category_model.joblib"
    joblib.dump(model, model_file)
    print(f"\nSaved model to {model_file}")


if __name__ == "__main__":
    main()