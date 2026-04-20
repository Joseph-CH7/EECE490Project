from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

OUT_DIR = Path("data/interim/eda_outputs_processed")
OUT_DIR.mkdir(parents=True, exist_ok=True)

questions = pd.read_csv("data/processed/questions_normalized.csv")
resumes = pd.read_csv("data/processed/resumes_normalized.csv")
profiles = pd.read_csv("data/processed/resume_profiles_normalized.csv")

print("Questions:", questions.shape)
print("Resumes:", resumes.shape)
print("Profiles:", profiles.shape)

print("\nQuestion job categories:")
print(questions["job_category"].value_counts())

print("\nQuestion types:")
print(questions["question_type"].value_counts())

print("\nQuestion difficulties:")
print(questions["difficulty"].value_counts())

print("\nResume normalized categories:")
print(resumes["job_category_normalized"].value_counts())

print("\nProfile guessed categories:")
print(profiles["job_category_guess"].value_counts().head(20))

questions["question_length"] = questions["question_text"].astype(str).str.len()
resumes["resume_length"] = resumes["resume_text"].astype(str).str.len()
profiles["profile_length"] = profiles["profile_text"].astype(str).str.len()

def save_hist(series, title, filename, xlabel):
    plt.figure(figsize=(8, 4))
    series.hist(bins=40)
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(OUT_DIR / filename, dpi=150)
    plt.close()

def save_bar(series, title, filename):
    plt.figure(figsize=(10, 4))
    series.value_counts().plot(kind="bar")
    plt.title(title)
    plt.tight_layout()
    plt.savefig(OUT_DIR / filename, dpi=150)
    plt.close()

save_hist(questions["question_length"], "Question Length Distribution", "question_length.png", "Characters")
save_hist(resumes["resume_length"], "Resume Length Distribution", "resume_length.png", "Characters")
save_hist(profiles["profile_length"], "Structured Profile Length Distribution", "profile_length.png", "Characters")

save_bar(questions["job_category"], "Question Categories", "question_categories.png")
save_bar(questions["difficulty"], "Question Difficulty", "question_difficulty.png")
save_bar(resumes["job_category_normalized"], "Resume Categories", "resume_categories.png")

print(f"\nSaved plots to: {OUT_DIR}")