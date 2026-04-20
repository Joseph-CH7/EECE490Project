from pathlib import Path
import pandas as pd

QUESTIONS_PATH = Path("data/processed/questions_balanced.csv")


def require_columns(df: pd.DataFrame, required: list[str]):
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def clean_text(x) -> str:
    if pd.isna(x):
        return ""
    x = str(x).strip()
    if x.lower() in {"nan", "none", "null"}:
        return ""
    return x


def sample_rows(df: pd.DataFrame, n: int) -> pd.DataFrame:
    if df.empty:
        return df
    if len(df) <= n:
        return df.sample(frac=1, random_state=42).reset_index(drop=True)
    return df.sample(n=n, random_state=42).reset_index(drop=True)


def select_questions(job_category: str, interview_type: str, n: int = 5) -> pd.DataFrame:
    if not QUESTIONS_PATH.exists():
        raise FileNotFoundError(f"Missing file: {QUESTIONS_PATH}")

    df = pd.read_csv(QUESTIONS_PATH).copy()
    require_columns(df, ["question_text", "question_type", "job_category"])

    df["question_text"] = df["question_text"].map(clean_text)
    df["question_type"] = df["question_type"].map(clean_text).str.lower()
    df["job_category"] = df["job_category"].map(clean_text).str.lower()

    if "ideal_answer" in df.columns:
        df["ideal_answer"] = df["ideal_answer"].map(clean_text)

    if "difficulty" in df.columns:
        df["difficulty"] = df["difficulty"].map(clean_text).str.lower()

    df = df[df["question_text"] != ""].copy()
    df = df.drop_duplicates(subset=["question_text"])

    job_category = clean_text(job_category).lower()
    interview_type = clean_text(interview_type).lower()

    filtered = df[df["job_category"] == job_category].copy()
    if filtered.empty:
        filtered = df.copy()

    if interview_type == "technical":
        filtered = filtered[filtered["question_type"] == "technical"].copy()

    elif interview_type == "behavioral":
        filtered = filtered[filtered["question_type"] == "behavioral"].copy()

        if "ideal_answer" in filtered.columns:
            with_answer = filtered[filtered["ideal_answer"] != ""]
            without_answer = filtered[filtered["ideal_answer"] == ""]
            filtered = pd.concat([with_answer, without_answer], ignore_index=True)

    elif interview_type == "mixed":
        technical = filtered[filtered["question_type"] == "technical"].copy()
        behavioral = filtered[filtered["question_type"] == "behavioral"].copy()

        tech_n = n // 2
        beh_n = n - tech_n

        if "ideal_answer" in behavioral.columns:
            with_answer = behavioral[behavioral["ideal_answer"] != ""]
            without_answer = behavioral[behavioral["ideal_answer"] == ""]
            behavioral = pd.concat([with_answer, without_answer], ignore_index=True)

        technical = sample_rows(technical, tech_n)
        behavioral = sample_rows(behavioral, beh_n)

        mixed_df = pd.concat([technical, behavioral], ignore_index=True)

        if len(mixed_df) < n:
            remaining = filtered[
                ~filtered["question_text"].isin(mixed_df["question_text"])
            ]
            extra = sample_rows(remaining, n - len(mixed_df))
            mixed_df = pd.concat([mixed_df, extra], ignore_index=True)

        return mixed_df.drop_duplicates(subset=["question_text"]).head(n).reset_index(drop=True)

    else:
        filtered = filtered[filtered["question_type"].isin(["technical", "behavioral"])].copy()

    if filtered.empty:
        print("No matching questions found.")
        return pd.DataFrame()

    return sample_rows(filtered, n)


if __name__ == "__main__":
    sample = select_questions("software_engineering", "technical", n=5)

    if sample.empty:
        print("No questions selected.")
    else:
        cols = ["question_text", "question_type", "job_category"]
        if "difficulty" in sample.columns:
            cols.append("difficulty")
        if "ideal_answer" in sample.columns:
            cols.append("ideal_answer")
        print(sample[cols])
