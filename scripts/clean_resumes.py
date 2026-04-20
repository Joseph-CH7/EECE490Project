from pathlib import Path
import pandas as pd

IN_FILE = Path("data/raw/resumes/Resume/Resume.csv")
OUT_FILE = Path("data/processed/resumes_clean.csv")


def clean_text(x):
    if pd.isna(x):
        return ""
    x = str(x).strip()
    if x.lower() in {"nan", "none", "null"}:
        return ""
    return x


def main():
    if not IN_FILE.exists():
        raise FileNotFoundError(f"Input file not found: {IN_FILE}")

    df = pd.read_csv(IN_FILE).copy()

    required = ["ID", "Resume_str", "Category"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    df = df[["ID", "Resume_str", "Category"]].copy()
    df.columns = ["resume_id", "resume_text", "job_category"]

    df["resume_id"] = df["resume_id"].map(clean_text)
    df["resume_text"] = df["resume_text"].map(clean_text)
    df["job_category"] = df["job_category"].map(clean_text)

    df = df[
        (df["resume_id"] != "") &
        (df["resume_text"] != "") &
        (df["job_category"] != "")
    ].copy()

    df = df.drop_duplicates(subset=["resume_id"]).reset_index(drop=True)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_FILE, index=False)

    print(f"Saved: {OUT_FILE}")
    print("Shape:", df.shape)
    print("\nJob category counts:")
    print(df["job_category"].value_counts().head(30))
    print("\nSample:")
    print(df.head())


if __name__ == "__main__":
    main()