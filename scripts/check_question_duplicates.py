from pathlib import Path
import pandas as pd

DATA_PATH = Path("data/processed/questions_with_features_v2.csv")

df = pd.read_csv(DATA_PATH)

df["question_text"] = df["question_text"].astype(str).str.lower().str.strip()

print("Total rows:", len(df))
print("Unique question_text:", df["question_text"].nunique())
print("Duplicate question_text rows:", len(df) - df["question_text"].nunique())

dupes = df[df.duplicated(subset=["question_text"], keep=False)].sort_values("question_text")
print("\nSample duplicates:")
print(dupes[["question_text", "question_type"]].head(20))