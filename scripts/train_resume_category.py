from pathlib import Path
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, f1_score
from sklearn.utils import shuffle

RESUMES_PATH = Path("data/processed/resumes_normalized.csv")
PROFILES_PATH = Path("data/processed/resume_profiles_balanced.csv")  # Using balanced dataset
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)
FAST_MODE = True
GRIDSEARCH_JOBS = 1
PROFILE_CLASS_CAP = 500  # Increased to use full balanced dataset

REMOVE_CLASSES = {"professional_other", "business_commercial"}
CATEGORY_MAP = {
    "software_engineering": "software_engineering",
    "it_support": "software_engineering",
    "data_science": "data_science",
    "finance": "finance",
    "design_creative": "design_creative",
    "business_development": "business_development",
    "hospitality": "hospitality",
    "fitness_wellness": "fitness_wellness",
    "healthcare": "healthcare",
    "construction": "construction",
    "human_resources": "human_resources",
    "education": "education",
    "general_business": "business_development",
    "sales": "business_development",
}

ALLOWED_PROFILE_CLASSES = {
    "software_engineering",
    "data_science",
    "finance",
    "design_creative",
    "business_development",
    "hospitality",
    "fitness_wellness",
    "healthcare",
    "construction",
    "human_resources",
    "education",
}


def clean_resume_text(text: str) -> str:
    text = str(text).lower().strip()
    if text in {"nan", "none", "null"}:
        return ""
    text = " ".join(text.split())
    return text


def normalize_category_label(label: str) -> str:
    normalized = str(label).lower().strip()
    return CATEGORY_MAP.get(normalized, normalized)


def prepare_labeled_resumes() -> pd.DataFrame:
    df = pd.read_csv(RESUMES_PATH)

    required_cols = ["resume_text", "job_category_normalized"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in resumes_normalized.csv: {missing}")

    df = df[required_cols].copy()
    df["resume_text"] = df["resume_text"].map(clean_resume_text)
    df["job_category_normalized"] = (
        df["job_category_normalized"]
        .astype(str)
        .map(normalize_category_label)
    )

    df = df[df["resume_text"] != ""].copy()
    df = df[~df["job_category_normalized"].isin(REMOVE_CLASSES)].copy()
    return df


def prepare_profile_resumes() -> pd.DataFrame:
    df = pd.read_csv(PROFILES_PATH)

    required_cols = ["profile_text", "job_category_guess"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in resume_profiles_training_ready.csv: {missing}")

    df = df[required_cols].copy()
    df = df.rename(
        columns={
            "profile_text": "resume_text",
            "job_category_guess": "job_category_normalized",
        }
    )

    df["resume_text"] = df["resume_text"].map(clean_resume_text)
    df["job_category_normalized"] = (
        df["job_category_normalized"]
        .astype(str)
        .map(normalize_category_label)
    )

    df = df[df["resume_text"] != ""].copy()
    df = df[~df["job_category_normalized"].isin(REMOVE_CLASSES)].copy()
    df = df[df["job_category_normalized"].isin(ALLOWED_PROFILE_CLASSES)].copy()

    sampled_frames = []
    for class_name, group in df.groupby("job_category_normalized"):
        # Keep structured profiles helpful without letting synthetic-heavy classes
        # dominate the real resume distribution.
        take_n = min(len(group), PROFILE_CLASS_CAP)
        sampled_frames.append(group.sample(n=take_n, random_state=42))

    if sampled_frames:
        df = pd.concat(sampled_frames, ignore_index=True)
    else:
        df = pd.DataFrame(columns=["resume_text", "job_category_normalized"])

    return df


def main():
    resumes_df = prepare_labeled_resumes()
    profiles_df = prepare_profile_resumes()

    print("Labeled resumes shape:", resumes_df.shape)
    print("Profiles shape:", profiles_df.shape)

    df = pd.concat([resumes_df, profiles_df], ignore_index=True)

    df = df.drop_duplicates(subset=["resume_text"]).copy()

    counts = df["job_category_normalized"].value_counts()
    keep_classes = counts[counts >= 80].index.tolist()
    df = df[df["job_category_normalized"].isin(keep_classes)].copy()

    df = shuffle(df, random_state=42).reset_index(drop=True)

    print("\nFinal dataset shape:", df.shape)
    print("\nFinal class distribution:")
    print(df["job_category_normalized"].value_counts())

    X = df["resume_text"]
    y = df["job_category_normalized"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        stratify=y,
        random_state=42,
    )

    print("\nTrain shape:", X_train.shape)
    print("Test shape:", X_test.shape)

    cv_splits = 3 if FAST_MODE else 5
    cv = StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=42)

    # 1) LinearSVC search
    svc_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(stop_words="english")),
        ("clf", LinearSVC(class_weight="balanced", random_state=42, max_iter=30000)),
    ])

    svc_param_grid = (
        {
            "tfidf__ngram_range": [(1, 2)],
            "tfidf__max_features": [30000, 40000],
            "tfidf__min_df": [2],
            "tfidf__max_df": [0.95],
            "tfidf__sublinear_tf": [True],
            "clf__C": [1.0, 2.0],
        }
        if FAST_MODE
        else {
            "tfidf__ngram_range": [(1, 2), (1, 3)],
            "tfidf__max_features": [40000, 60000],
            "tfidf__min_df": [2, 3],
            "tfidf__max_df": [0.9, 0.95],
            "tfidf__sublinear_tf": [True],
            "clf__C": [0.5, 1.0, 2.0, 3.0],
        }
    )

    svc_search = GridSearchCV(
        svc_pipeline,
        svc_param_grid,
        scoring="f1_macro",
        cv=cv,
        n_jobs=GRIDSEARCH_JOBS,
        verbose=1,
    )

    # 2) LogisticRegression search
    logreg_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(stop_words="english")),
        ("clf", LogisticRegression(
            class_weight="balanced",
            random_state=42,
            max_iter=8000,
        )),
    ])

    logreg_param_grid = (
        {
            "tfidf__ngram_range": [(1, 2)],
            "tfidf__max_features": [30000, 40000],
            "tfidf__min_df": [2],
            "tfidf__max_df": [0.95],
            "tfidf__sublinear_tf": [True],
            "clf__C": [1.0, 2.0],
        }
        if FAST_MODE
        else {
            "tfidf__ngram_range": [(1, 2), (1, 3)],
            "tfidf__max_features": [40000, 60000],
            "tfidf__min_df": [2, 3],
            "tfidf__max_df": [0.9, 0.95],
            "tfidf__sublinear_tf": [True],
            "clf__C": [0.5, 1.0, 2.0, 3.0],
        }
    )

    logreg_search = GridSearchCV(
        logreg_pipeline,
        logreg_param_grid,
        scoring="f1_macro",
        cv=cv,
        n_jobs=GRIDSEARCH_JOBS,
        verbose=1,
    )

    print(f"\nFAST_MODE: {FAST_MODE} | CV folds: {cv_splits} | GridSearch jobs: {GRIDSEARCH_JOBS}")

    print("\n" + "=" * 70)
    print("Running LinearSVC grid search...")
    svc_search.fit(X_train, y_train)
    print("Best LinearSVC CV Macro F1:", svc_search.best_score_)
    print("Best LinearSVC Params:", svc_search.best_params_)

    print("\n" + "=" * 70)
    print("Running LogisticRegression grid search...")
    logreg_search.fit(X_train, y_train)
    print("Best LogisticRegression CV Macro F1:", logreg_search.best_score_)
    print("Best LogisticRegression Params:", logreg_search.best_params_)

    if svc_search.best_score_ >= logreg_search.best_score_:
        best_name = "linearsvc"
        best_model = svc_search.best_estimator_
        best_cv = svc_search.best_score_
    else:
        best_name = "logreg"
        best_model = logreg_search.best_estimator_
        best_cv = logreg_search.best_score_

    print("\n" + "=" * 70)
    print("BEST MODEL:", best_name)
    print("BEST CV MACRO F1:", best_cv)

    preds = best_model.predict(X_test)

    test_acc = accuracy_score(y_test, preds)
    test_f1 = f1_score(y_test, preds, average="macro")

    print("\nTest Accuracy:", test_acc)
    print("Test Macro F1:", test_f1)
    print("\nClassification Report:")
    print(classification_report(y_test, preds, zero_division=0))

    out_path = MODEL_DIR / "resume_category_model.joblib"
    joblib.dump(best_model, out_path)
    print(f"\nSaved model to {out_path}")


if __name__ == "__main__":
    main()
