from pathlib import Path
import pandas as pd
import re

DATA_PATH = Path("data/processed/questions_with_features_v2.csv")

def normalize_text(text: str) -> str:
    text = str(text).lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

df = pd.read_csv(DATA_PATH)
df = df[df["question_type"].isin(["technical", "behavioral"])].copy()
df["normalized_question"] = df["question_text"].apply(normalize_text)

print("Total rows:", len(df))
print("Unique normalized questions:", df["normalized_question"].nunique())
print("Near-duplicate rows:", len(df) - df["normalized_question"].nunique())

dupes = df[df.duplicated(subset=["normalized_question"], keep=False)].sort_values("normalized_question")
print("\nSample near-duplicates:")
print(dupes[["question_text", "normalized_question", "question_type"]].head(30))