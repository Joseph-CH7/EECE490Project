from pathlib import Path
import pandas as pd

# This version creates a cleaner matching dataset.
# It builds:
# - positive pairs: resume category matches question category
# - negative pairs: resume category does not match question category
#
# This is only useful if you want a resume-question matching/retrieval task.
# It is better than making unlabeled random same-category pairs only.

PROCESSED_DIR = Path("data/processed")

RESUMES_FILE = PROCESSED_DIR / "resumes_normalized.csv"
PROFILES_FILE = PROCESSED_DIR / "resume_profiles_training_ready.csv"
QUESTIONS_FILE = PROCESSED_DIR / "questions_balanced.csv"

OUT_FILE = PROCESSED_DIR / "training_pairs_v2.csv"

MAX_POSITIVE_PER_CATEGORY = 300
MAX_NEGATIVE_PER_CATEGORY = 300
RANDOM_STATE = 42


def require_columns(df, needed, file_name):
    missing = [c for c in needed if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in {file_name}: {missing}")


def clean_text(series):
    return series.fillna("").astype(str).str.strip()


def normalize_category(series):
    return series.fillna("").astype(str).str.strip().str.lower()


def build_resume_pool(resumes, profiles):
    # Labeled resumes
    resumes_pool = resumes[["resume_text", "job_category_normalized"]].copy()
    resumes_pool = resumes_pool.rename(columns={"job_category_normalized": "job_category"})
    resumes_pool["resume_source"] = "labeled_resume"

    # Structured profiles
    profiles_pool = profiles[["profile_text", "job_category_guess"]].copy()
    profiles_pool = profiles_pool.rename(
        columns={
            "profile_text": "resume_text",
            "job_category_guess": "job_category"
        }
    )
    profiles_pool["resume_source"] = "structured_profile"

    all_resumes = pd.concat([resumes_pool, profiles_pool], ignore_index=True)
    all_resumes["resume_text"] = clean_text(all_resumes["resume_text"])
    all_resumes["job_category"] = normalize_category(all_resumes["job_category"])

    all_resumes = all_resumes[
        (all_resumes["resume_text"] != "") &
        (all_resumes["job_category"] != "")
    ].copy()

    return all_resumes


def prepare_questions(questions):
    needed_cols = ["question_text", "job_category", "question_type", "job_role"]
    require_columns(questions, needed_cols, "questions_balanced.csv")

    questions = questions.copy()
    questions["question_text"] = clean_text(questions["question_text"])
    questions["job_category"] = normalize_category(questions["job_category"])
    questions["question_type"] = clean_text(questions["question_type"]).str.lower()
    questions["job_role"] = clean_text(questions["job_role"])

    if "ideal_answer" in questions.columns:
        questions["ideal_answer"] = clean_text(questions["ideal_answer"])
    else:
        questions["ideal_answer"] = ""

    questions = questions[
        (questions["question_text"] != "") &
        (questions["job_category"] != "")
    ].copy()

    return questions


def sample_positive_pairs(resumes_cat, questions_cat, category):
    pairs = []

    if resumes_cat.empty or questions_cat.empty:
        return pairs

    n = min(len(resumes_cat), len(questions_cat), MAX_POSITIVE_PER_CATEGORY)

    resumes_sample = resumes_cat.sample(n=n, random_state=RANDOM_STATE).reset_index(drop=True)
    questions_sample = questions_cat.sample(n=n, random_state=RANDOM_STATE).reset_index(drop=True)

    for i in range(n):
        r = resumes_sample.iloc[i]
        q = questions_sample.iloc[i]

        pairs.append({
            "label": 1,
            "job_category": category,
            "resume_source": r["resume_source"],
            "resume_text": r["resume_text"],
            "question_text": q["question_text"],
            "question_type": q["question_type"],
            "job_role": q["job_role"],
            "ideal_answer": q["ideal_answer"]
        })

    return pairs


def sample_negative_pairs(resumes_cat, questions_other, category):
    pairs = []

    if resumes_cat.empty or questions_other.empty:
        return pairs

    n = min(len(resumes_cat), len(questions_other), MAX_NEGATIVE_PER_CATEGORY)

    resumes_sample = resumes_cat.sample(n=n, random_state=RANDOM_STATE).reset_index(drop=True)
    questions_sample = questions_other.sample(n=n, random_state=RANDOM_STATE).reset_index(drop=True)

    for i in range(n):
        r = resumes_sample.iloc[i]
        q = questions_sample.iloc[i]

        pairs.append({
            "label": 0,
            "job_category": category,
            "resume_source": r["resume_source"],
            "resume_text": r["resume_text"],
            "question_text": q["question_text"],
            "question_type": q["question_type"],
            "job_role": q["job_role"],
            "ideal_answer": q["ideal_answer"]
        })

    return pairs


def main():
    for file in [RESUMES_FILE, PROFILES_FILE, QUESTIONS_FILE]:
        if not file.exists():
            raise FileNotFoundError(f"Missing file: {file}")

    resumes = pd.read_csv(RESUMES_FILE)
    profiles = pd.read_csv(PROFILES_FILE)
    questions = pd.read_csv(QUESTIONS_FILE)

    require_columns(
        resumes,
        ["resume_text", "job_category_normalized"],
        "resumes_normalized.csv"
    )
    require_columns(
        profiles,
        ["profile_text", "job_category_guess"],
        "resume_profiles_training_ready.csv"
    )

    resume_pool = build_resume_pool(resumes, profiles)
    questions = prepare_questions(questions)

    resume_categories = sorted(set(resume_pool["job_category"]))
    question_categories = sorted(set(questions["job_category"]))
    common_categories = sorted(set(resume_categories).intersection(question_categories))

    print("Resume categories:", resume_categories)
    print("\nQuestion categories:", question_categories)
    print("\nCommon categories:", common_categories)

    if not common_categories:
        raise ValueError("No common categories found between resumes and questions.")

    all_pairs = []

    for category in common_categories:
        resumes_cat = resume_pool[resume_pool["job_category"] == category].copy()
        questions_cat = questions[questions["job_category"] == category].copy()
        questions_other = questions[questions["job_category"] != category].copy()

        positive_pairs = sample_positive_pairs(resumes_cat, questions_cat, category)
        negative_pairs = sample_negative_pairs(resumes_cat, questions_other, category)

        all_pairs.extend(positive_pairs)
        all_pairs.extend(negative_pairs)

        print(
            f"\nCategory: {category} | "
            f"resumes={len(resumes_cat)} | "
            f"matching_questions={len(questions_cat)} | "
            f"other_questions={len(questions_other)} | "
            f"positive_pairs={len(positive_pairs)} | "
            f"negative_pairs={len(negative_pairs)}"
        )

    pairs_df = pd.DataFrame(all_pairs)

    if pairs_df.empty:
        raise ValueError("No training pairs were created.")

    pairs_df = pairs_df.sample(frac=1, random_state=RANDOM_STATE).reset_index(drop=True)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    pairs_df.to_csv(OUT_FILE, index=False)

    print(f"\nSaved: {OUT_FILE}")
    print("Shape:", pairs_df.shape)

    print("\nCounts by label:")
    print(pairs_df["label"].value_counts())

    print("\nCounts by job category:")
    print(pairs_df["job_category"].value_counts())

    print("\nCounts by resume source:")
    print(pairs_df["resume_source"].value_counts())

    print("\nCounts by question type:")
    print(pairs_df["question_type"].value_counts())

    print("\nSample rows:")
    print(pairs_df.head())


if __name__ == "__main__":
    main()
