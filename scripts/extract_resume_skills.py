from pathlib import Path
import pandas as pd

# This version matches:
# data/raw/resumes/Resume/05_person_skills.xlsx
# and uses 06_skills.xlsx optionally only for reference if needed later.

RESUME_DIR = Path("data/raw/resumes/Resume")
PROCESSED_DIR = Path("data/processed")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

IN_FILE = RESUME_DIR / "05_person_skills.xlsx"
OUT_FILE = PROCESSED_DIR / "resume_skills.csv"


def clean_text_value(x):
    if pd.isna(x):
        return ""
    x = str(x).strip()
    if x.lower() in ["nan", "none", "null"]:
        return ""
    return x


def find_first_existing_column(df, candidates, file_name):
    for col in candidates:
        if col in df.columns:
            return col
    raise ValueError(f"Could not find any of {candidates} in {file_name}")


def main():
    if not IN_FILE.exists():
        raise FileNotFoundError(f"Input file not found: {IN_FILE}")

    skills = pd.read_excel(IN_FILE).copy()

    person_id_col = find_first_existing_column(skills, ["person_id", "PersonID", "id", "ID"], "05_person_skills.xlsx")
    skill_col = find_first_existing_column(skills, ["skill", "Skill", "skill_name", "name"], "05_person_skills.xlsx")

    skills = skills[[person_id_col, skill_col]].copy()
    skills.columns = ["person_id", "skill"]

    skills["person_id"] = skills["person_id"].map(clean_text_value)
    skills["skill"] = skills["skill"].map(clean_text_value)

    skills = skills[
        (skills["person_id"] != "") &
        (skills["skill"] != "")
    ].copy()

    skills = skills[skills["skill"].str.len() > 1]
    skills = skills.drop_duplicates().reset_index(drop=True)

    skills.to_csv(OUT_FILE, index=False)

    print(f"Saved: {OUT_FILE}")
    print("Shape:", skills.shape)
    print("\nSample:")
    print(skills.head())


if __name__ == "__main__":
    main()