from pathlib import Path
import pandas as pd
import re

RAW_DIR = Path("data/raw/interview_questions_v2")
PROCESSED_DIR = Path("data/processed")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

OUT_FILE = PROCESSED_DIR / "questions_clean_v2.csv"


def read_csv_safe(file: Path):
    encodings = ["utf-8", "latin1", "cp1252"]
    separators = [",", ";", "\t", "|"]

    for enc in encodings:
        for sep in separators:
            try:
                df = pd.read_csv(file, encoding=enc, sep=sep, engine="python")
                if df is not None and df.shape[1] >= 1:
                    return df
            except Exception:
                continue

    for enc in encodings:
        try:
            df = pd.read_csv(file, encoding=enc, sep=None, engine="python")
            if df is not None and df.shape[1] >= 1:
                return df
        except Exception:
            continue

    return None


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [
        str(c).strip().lower().replace(" ", "_").replace("-", "_")
        for c in df.columns
    ]
    return df


def infer_question_col(columns):
    for c in ["question", "question_text", "questions", "description", "prompt"]:
        if c in columns:
            return c
    return None


def infer_answer_col(columns):
    for c in ["answer", "ideal_answer", "answers", "response"]:
        if c in columns:
            return c
    return None


def infer_role_col(columns):
    for c in ["role", "job_role", "job_title", "position", "title"]:
        if c in columns:
            return c
    return None


def infer_type_col(columns):
    for c in ["category", "question_type", "type", "domain"]:
        if c in columns:
            return c
    return None


def infer_difficulty_col(columns):
    for c in ["difficulty", "level"]:
        if c in columns:
            return c
    return None


def default_role_from_filename(file_name: str) -> str:
    f = file_name.lower()

    if "behavior" in f or "hr" in f:
        return "HR"
    if "deep" in f or "machine" in f or "ml" in f or "data" in f:
        return "Data Scientist"
    if "software" in f or "python" in f or "programming" in f or "coding" in f:
        return "Software Engineer"

    return "Unknown"


def default_type_from_filename(file_name: str) -> str:
    f = file_name.lower()

    if "behavior" in f or "hr" in f:
        return "Behavioral"
    if "software" in f or "python" in f or "deep" in f or "machine" in f or "ml" in f or "data" in f:
        return "Technical"

    return "Unknown"


def clean_question_text(text) -> str:
    if pd.isna(text):
        return ""

    text = str(text).strip()
    text = re.sub(r"\s+", " ", text)
    return text


def clean_optional_text(series: pd.Series) -> pd.Series:
    return series.fillna("").astype(str).str.strip()


def convert_file(file: Path) -> pd.DataFrame:
    df = read_csv_safe(file)

    if df is None or df.empty:
        print(f"Skipping {file.name}: could not read file")
        return pd.DataFrame()

    df = normalize_columns(df)

    q_col = infer_question_col(df.columns)
    a_col = infer_answer_col(df.columns)
    r_col = infer_role_col(df.columns)
    t_col = infer_type_col(df.columns)
    d_col = infer_difficulty_col(df.columns)

    if q_col is None:
        print(f"Skipping {file.name}: no question-like column found")
        return pd.DataFrame()

    out = pd.DataFrame()
    out["question_text"] = df[q_col].map(clean_question_text)

    if a_col:
        out["ideal_answer"] = clean_optional_text(df[a_col])
    else:
        out["ideal_answer"] = pd.NA

    if r_col:
        out["job_role"] = clean_optional_text(df[r_col]).replace("", default_role_from_filename(file.stem))
    else:
        out["job_role"] = default_role_from_filename(file.stem)

    if t_col:
        out["question_type"] = clean_optional_text(df[t_col]).replace("", default_type_from_filename(file.stem))
    else:
        out["question_type"] = default_type_from_filename(file.stem)

    if d_col:
        out["difficulty"] = clean_optional_text(df[d_col]).str.lower().replace("", "medium")
    else:
        out["difficulty"] = "medium"

    out["source"] = file.stem

    out = out[
        (out["question_text"] != "") &
        (~out["question_text"].str.lower().isin(["nan", "none", "null"])) &
        (out["question_text"].str.len() > 10) &
        (out["question_text"].str.len() < 300)
    ].copy()

    return out


def main():
    all_frames = []

    csv_files = list(RAW_DIR.rglob("*.csv"))
    if not csv_files:
        print("No CSV question files found.")
        return

    for file in csv_files:
        print(f"Processing {file} ...")
        try:
            converted = convert_file(file)
            if not converted.empty:
                print(f"  -> kept {len(converted)} rows")
                all_frames.append(converted)
            else:
                print("  -> kept 0 rows")
        except Exception as e:
            print(f"Skipping {file.name}: {e}")

    if not all_frames:
        print("No usable question files found.")
        return

    merged = pd.concat(all_frames, ignore_index=True)

    merged["question_text"] = merged["question_text"].fillna("").astype(str).str.strip()
    merged["job_role"] = merged["job_role"].fillna("Unknown").astype(str).str.strip()
    merged["question_type"] = merged["question_type"].fillna("Unknown").astype(str).str.strip()
    merged["difficulty"] = merged["difficulty"].fillna("medium").astype(str).str.strip().str.lower()

    merged = merged.drop_duplicates(subset=["question_text", "job_role", "question_type", "difficulty"])
    merged = merged.reset_index(drop=True)

    merged.to_csv(OUT_FILE, index=False)

    print(f"\nSaved: {OUT_FILE}")
    print("Shape:", merged.shape)

    print("\nJob role counts:")
    print(merged["job_role"].value_counts().head(30))

    print("\nQuestion type counts:")
    print(merged["question_type"].value_counts().head(30))

    print("\nDifficulty counts:")
    print(merged["difficulty"].value_counts().head(20))


if __name__ == "__main__":
    main()