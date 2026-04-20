from pathlib import Path
import pandas as pd

RESUMES_FILE = Path("data/processed/resumes_normalized.csv")
QUESTIONS_FILE = Path("data/processed/questions_normalized.csv")

def main():
    if not RESUMES_FILE.exists():
        raise FileNotFoundError(f"Missing file: {RESUMES_FILE}")

    if not QUESTIONS_FILE.exists():
        raise FileNotFoundError(f"Missing file: {QUESTIONS_FILE}")

    resumes = pd.read_csv(RESUMES_FILE)
    questions = pd.read_csv(QUESTIONS_FILE)

    if "job_category_normalized" not in resumes.columns:
        raise ValueError("Missing column 'job_category_normalized' in resumes_normalized.csv")

    if "job_category" not in questions.columns:
        raise ValueError("Missing column 'job_category' in questions_normalized.csv")

    resume_cats = set(
        resumes["job_category_normalized"].dropna().astype(str).str.strip()
    )
    question_cats = set(
        questions["job_category"].dropna().astype(str).str.strip()
    )

    overlap = resume_cats.intersection(question_cats)

    print("Resume categories:", sorted(resume_cats))
    print("Question categories:", sorted(question_cats))
    print("Overlap:", sorted(overlap))

    print("\nResume counts:")
    print(
        resumes["job_category_normalized"]
        .fillna("missing")
        .astype(str)
        .str.strip()
        .value_counts()
    )

    print("\nQuestion counts:")
    print(
        questions["job_category"]
        .fillna("missing")
        .astype(str)
        .str.strip()
        .value_counts()
    )

    if not overlap:
        print("\nWarning: No overlapping job categories found.")
        print("Your resume-question pairing step will fail or produce empty results.")

if __name__ == "__main__":
    main()