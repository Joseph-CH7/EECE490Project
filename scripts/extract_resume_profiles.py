from pathlib import Path
import pandas as pd

# This version reads the Excel files from:
# data/raw/resumes/Resume/

RESUME_DIR = Path("data/raw/resumes/Resume")
PROCESSED_DIR = Path("data/processed")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

PEOPLE_FILE = RESUME_DIR / "01_people.xlsx"
ABILITIES_FILE = RESUME_DIR / "02_abilities.xlsx"
EDUCATION_FILE = RESUME_DIR / "03_education.xlsx"
EXPERIENCE_FILE = RESUME_DIR / "04_experience.xlsx"
PERSON_SKILLS_FILE = RESUME_DIR / "05_person_skills.xlsx"
SKILLS_FILE = RESUME_DIR / "06_skills.xlsx"

OUT_FILE = PROCESSED_DIR / "resume_profiles_clean.csv"


def require_columns(df, required, file_name):
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in {file_name}: {missing}")


def clean_text_value(x):
    if pd.isna(x):
        return ""
    x = str(x).strip()
    if x.lower() in ["nan", "none", "null"]:
        return ""
    return x


def clean_id(series):
    return series.map(clean_text_value).astype(str).str.strip()


def find_first_existing_column(df, candidates, file_name):
    for col in candidates:
        if col in df.columns:
            return col
    raise ValueError(f"Could not find any of {candidates} in {file_name}")


def aggregate_unique(df, group_col, value_col, out_col):
    temp = df[[group_col, value_col]].copy()

    temp[group_col] = clean_id(temp[group_col])
    temp[value_col] = temp[value_col].map(clean_text_value)

    temp = temp[
        (temp[group_col] != "") &
        (temp[value_col] != "")
    ].copy()

    if temp.empty:
        return pd.DataFrame(columns=[group_col, out_col])

    agg = (
        temp.groupby(group_col)[value_col]
        .apply(lambda x: " | ".join(sorted(set(x))))
        .reset_index()
        .rename(columns={value_col: out_col})
    )
    return agg


def main():
    for file in [PEOPLE_FILE, ABILITIES_FILE, EDUCATION_FILE, EXPERIENCE_FILE, PERSON_SKILLS_FILE, SKILLS_FILE]:
        if not file.exists():
            raise FileNotFoundError(f"Missing file: {file}")

    people = pd.read_excel(PEOPLE_FILE)
    abilities = pd.read_excel(ABILITIES_FILE)
    education = pd.read_excel(EDUCATION_FILE)
    experience = pd.read_excel(EXPERIENCE_FILE)
    person_skills = pd.read_excel(PERSON_SKILLS_FILE)
    skills_master = pd.read_excel(SKILLS_FILE)

    people_id_col = find_first_existing_column(people, ["person_id", "PersonID", "id", "ID"], "01_people.xlsx")
    people_name_col = find_first_existing_column(people, ["name", "Name", "full_name", "FullName"], "01_people.xlsx")

    abilities_id_col = find_first_existing_column(abilities, ["person_id", "PersonID", "id", "ID"], "02_abilities.xlsx")
    abilities_val_col = find_first_existing_column(abilities, ["ability", "Ability", "ability_name", "name"], "02_abilities.xlsx")

    education_id_col = find_first_existing_column(education, ["person_id", "PersonID", "id", "ID"], "03_education.xlsx")
    education_val_col = find_first_existing_column(education, ["program", "Program", "degree", "Degree", "education"], "03_education.xlsx")

    experience_id_col = find_first_existing_column(experience, ["person_id", "PersonID", "id", "ID"], "04_experience.xlsx")
    experience_val_col = find_first_existing_column(experience, ["title", "Title", "job_title", "position"], "04_experience.xlsx")

    ps_id_col = find_first_existing_column(person_skills, ["person_id", "PersonID", "id", "ID"], "05_person_skills.xlsx")
    ps_skill_col = find_first_existing_column(person_skills, ["skill", "Skill", "skill_name", "name"], "05_person_skills.xlsx")

    people = people[[people_id_col, people_name_col]].copy()
    people.columns = ["person_id", "name"]

    people["person_id"] = clean_id(people["person_id"])
    people["name"] = people["name"].map(clean_text_value)
    people = people[people["person_id"] != ""].copy()

    abilities = abilities[[abilities_id_col, abilities_val_col]].copy()
    abilities.columns = ["person_id", "ability"]

    education = education[[education_id_col, education_val_col]].copy()
    education.columns = ["person_id", "program"]

    experience = experience[[experience_id_col, experience_val_col]].copy()
    experience.columns = ["person_id", "title"]

    person_skills = person_skills[[ps_id_col, ps_skill_col]].copy()
    person_skills.columns = ["person_id", "skill"]

    abilities_agg = aggregate_unique(abilities, "person_id", "ability", "abilities_text")
    skills_agg = aggregate_unique(person_skills, "person_id", "skill", "skills_text")
    exp_agg = aggregate_unique(experience, "person_id", "title", "experience_titles")
    edu_agg = aggregate_unique(education, "person_id", "program", "education_programs")

    profiles = people.merge(abilities_agg, on="person_id", how="left")
    profiles = profiles.merge(skills_agg, on="person_id", how="left")
    profiles = profiles.merge(exp_agg, on="person_id", how="left")
    profiles = profiles.merge(edu_agg, on="person_id", how="left")

    for col in ["abilities_text", "skills_text", "experience_titles", "education_programs"]:
        profiles[col] = profiles[col].fillna("").astype(str).str.strip()

    profiles["profile_text"] = (
        "Name: " + profiles["name"].fillna("").astype(str).str.strip()
        + " || Experience Titles: " + profiles["experience_titles"]
        + " || Skills: " + profiles["skills_text"]
        + " || Abilities: " + profiles["abilities_text"]
        + " || Education: " + profiles["education_programs"]
    ).str.replace(r"\s+", " ", regex=True).str.strip()

    profiles = profiles.drop_duplicates(subset=["person_id"]).reset_index(drop=True)

    profiles.to_csv(OUT_FILE, index=False)

    print(f"Saved: {OUT_FILE}")
    print("Shape:", profiles.shape)
    print("\nColumns:")
    print(profiles.columns.tolist())
    print("\nSample:")
    print(profiles.head())


if __name__ == "__main__":
    main()