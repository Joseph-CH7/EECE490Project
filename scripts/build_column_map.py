from pathlib import Path

# This script only stores the file/column map for the current project structure.
# It is made to match your newer folder names and the resume files you showed.

BASE_DIR = Path("data")
RAW_DIR = BASE_DIR / "raw"

QUESTION_DIR = RAW_DIR / "interview_questions_v2"
RESUME_DIR = RAW_DIR / "resumes" / "Resume"
RESUME_DATA_DIR = RESUME_DIR / "Data"

COLUMN_MAP = {
    "questions_main": {
        "file": str(QUESTION_DIR / "full_interview_questions_dataset.csv"),
        "question_col": "question",
        "role_col": "role",
        "category_col": "category",
        "difficulty_col": "difficulty"
    },
    "questions_software": {
        "file": str(QUESTION_DIR / "Software Questions.csv"),
        "question_col": "Question",
        "answer_col": "Answer",
        "category_col": "Category",
        "difficulty_col": "Difficulty"
    },
    "questions_behavioral_v2": {
        "file": str(QUESTION_DIR / "behavioral_questions_v2.csv"),
        "question_col": "question_text",
        "answer_col": "ideal_answer",
        "role_col": "job_role",
        "question_type_col": "question_type",
        "difficulty_col": "difficulty",
        "source_col": "source",
        "job_category_col": "job_category"
    },
    "questions_behavioral_extra": {
        "file": str(QUESTION_DIR / "behavioral_questions_v2_extra_260.csv"),
        "question_col": "question_text",
        "answer_col": "answer_guidance",
        "role_col": "job_role",
        "question_type_col": "question_type",
        "difficulty_col": "difficulty",
        "source_col": "source",
        "job_category_col": "job_category"
    },
    "questions_deeplearning": {
        "file": str(QUESTION_DIR / "deeplearning_questions.csv"),
        "question_col": "DESCRIPTION",
        "id_col": "ID"
    },
    "questions_extracted": {
        "file": str(QUESTION_DIR / "extracted_questions.csv"),
        "question_col": "question_text",
        "question_type_col": "question_type",
        "role_col": "job_role",
        "source_col": "source"
    },

    # Resume tables you showed
    "resume_people": {
        "file": str(RESUME_DIR / "01_people.xlsx"),
        "id_col": "person_id"
    },
    "resume_abilities": {
        "file": str(RESUME_DIR / "02_abilities.xlsx"),
        "id_col": "person_id"
    },
    "resume_education": {
        "file": str(RESUME_DIR / "03_education.xlsx"),
        "id_col": "person_id"
    },
    "resume_experience": {
        "file": str(RESUME_DIR / "04_experience.xlsx"),
        "id_col": "person_id"
    },
    "resume_person_skills": {
        "file": str(RESUME_DIR / "05_person_skills.xlsx"),
        "id_col": "person_id"
    },
    "resume_skills": {
        "file": str(RESUME_DIR / "06_skills.xlsx")
    },

    # Resume PDF folders
    "resume_pdf_root": {
        "folder": str(RESUME_DATA_DIR)
    }
}


def main():
    print("Current file map:\n")
    for name, info in COLUMN_MAP.items():
        print(f"{name}:")
        for key, value in info.items():
            print(f"  {key}: {value}")
        print()


if __name__ == "__main__":
    main()