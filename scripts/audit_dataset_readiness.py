from __future__ import annotations

from pathlib import Path
import re

import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
PROCESSED_DIR = ROOT / "data" / "processed"
INTERIM_DIR = ROOT / "data" / "interim"
REPORT_PATH = INTERIM_DIR / "dataset_readiness_report.md"


def clean_text(value: object) -> str:
    if pd.isna(value):
        return ""
    text = str(value).strip()
    if text.lower() in {"nan", "none", "null"}:
        return ""
    return re.sub(r"\s+", " ", text)


def normalized_series(series: pd.Series) -> pd.Series:
    return (
        series.fillna("")
        .astype(str)
        .str.lower()
        .str.replace(r"[^a-z0-9\s]", "", regex=True)
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )


def summarize_questions(path: Path) -> list[str]:
    if not path.exists():
        return [f"- Missing file: `{path.relative_to(ROOT)}`"]

    df = pd.read_csv(path).copy()
    df["question_text"] = df["question_text"].map(clean_text)
    df["question_type"] = df["question_type"].astype(str).str.lower().str.strip()
    df["job_category"] = df["job_category"].astype(str).str.lower().str.strip()

    norm_q = normalized_series(df["question_text"])
    exact_dupes = int(df.duplicated(subset=["question_text"]).sum())
    norm_dupes = int(norm_q.duplicated().sum())

    lines = [
        f"- File: `{path.relative_to(ROOT)}`",
        f"- Shape: `{df.shape[0]} rows x {df.shape[1]} cols`",
        f"- Question types: `{df['question_type'].value_counts().to_dict()}`",
        f"- Job categories: `{df['job_category'].value_counts().to_dict()}`",
        f"- Exact duplicate questions: `{exact_dupes}`",
        f"- Normalized duplicate questions: `{norm_dupes}`",
    ]

    if "source" in df.columns:
        lines.append(f"- Sources: `{df['source'].astype(str).str.lower().value_counts().to_dict()}`")

    return lines


def summarize_resumes(path: Path, text_col: str, label_col: str) -> list[str]:
    if not path.exists():
        return [f"- Missing file: `{path.relative_to(ROOT)}`"]

    df = pd.read_csv(path).copy()
    df[text_col] = df[text_col].map(clean_text)
    df[label_col] = df[label_col].astype(str).str.lower().str.strip()

    lines = [
        f"- File: `{path.relative_to(ROOT)}`",
        f"- Shape: `{df.shape[0]} rows x {df.shape[1]} cols`",
        f"- Empty `{text_col}`: `{int((df[text_col] == '').sum())}`",
        f"- Exact duplicate `{text_col}`: `{int(df.duplicated(subset=[text_col]).sum())}`",
        f"- Label distribution head: `{df[label_col].value_counts().head(12).to_dict()}`",
    ]
    return lines


def summarize_flags(path: Path) -> list[str]:
    if not path.exists():
        return [f"- Missing file: `{path.relative_to(ROOT)}`"]

    df = pd.read_csv(path).copy()
    exploded = df["quality_flags"].astype(str).str.split("|", regex=False).explode()
    lines = [
        f"- File: `{path.relative_to(ROOT)}`",
        f"- Flagged rows: `{len(df)}`",
        f"- Top reasons: `{exploded.value_counts().head(12).to_dict()}`",
    ]
    return lines


def main() -> None:
    INTERIM_DIR.mkdir(parents=True, exist_ok=True)

    questions_main = PROCESSED_DIR / "questions_normalized_v2.csv"
    questions_curated = PROCESSED_DIR / "questions_app_curated.csv"
    questions_balanced = PROCESSED_DIR / "questions_balanced.csv"
    question_flags = INTERIM_DIR / "question_quality_flags.csv"
    resumes_main = PROCESSED_DIR / "resumes_normalized.csv"
    profiles_main = PROCESSED_DIR / "resume_profiles_normalized.csv"
    profiles_ready = PROCESSED_DIR / "resume_profiles_training_ready.csv"

    report_lines = [
        "# Dataset Readiness Report",
        "",
        "## Verdict",
        "- Resume dataset: mostly usable for training after class filtering.",
        "- Resume profile dataset: usable but very duplicate-heavy; prefer a deduped training-ready version.",
        "- Question dataset: raw data is not ready for direct app use; use the balanced file for training and app selection.",
        "",
        "## Questions Raw",
        *summarize_questions(questions_main),
        "",
        "## Questions Curated",
        *summarize_questions(questions_curated),
        "",
        "## Questions Balanced",
        *summarize_questions(questions_balanced),
        "",
        "## Question Flags",
        *summarize_flags(question_flags),
        "",
        "## Resumes",
        *summarize_resumes(resumes_main, "resume_text", "job_category_normalized"),
        "",
        "## Resume Profiles",
        *summarize_resumes(profiles_main, "profile_text", "job_category_guess"),
        "",
    ]

    if profiles_ready.exists():
        report_lines.extend([
            "## Resume Profiles Training Ready",
            *summarize_resumes(profiles_ready, "profile_text", "job_category_guess"),
            "",
        ])

    report_lines.extend([
        "## Recommended Files To Use",
        f"- App question selection: `{questions_balanced.relative_to(ROOT)}`",
        f"- Model feature generation source: `{questions_balanced.relative_to(ROOT)}`",
        f"- Main resumes: `{resumes_main.relative_to(ROOT)}`",
        f"- Profile resumes for training: `{profiles_ready.relative_to(ROOT)}` if available, otherwise `{profiles_main.relative_to(ROOT)}`",
        "",
        "## Ready / Not Ready",
        "- Ready: `resumes_normalized.csv`",
        "- Ready with caution: `resume_profiles_normalized.csv`",
        "- Ready for app use: `questions_balanced.csv`",
        "- Ready as a larger source pool: `questions_app_curated.csv`",
        "- Not ready for direct app use: `questions_normalized_v2.csv`",
    ])

    REPORT_PATH.write_text("\n".join(report_lines), encoding="utf-8")
    print(f"Saved report to {REPORT_PATH}")


if __name__ == "__main__":
    main()
