from __future__ import annotations

from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parent.parent

STEPS = [
    ("Prepare training-ready profiles", ["py", "scripts/prepare_training_ready_profiles.py"]),
    ("Generate manual question expansion", ["py", "scripts/generate_manual_question_expansion.py"]),
    ("Curate question bank", ["py", "scripts/curate_question_bank.py"]),
    ("Build balanced question set", ["py", "scripts/build_balanced_question_set.py"]),
    ("Build question features", ["py", "scripts/build_question_features.py"]),
    ("Dataset summary", ["py", "scripts/dataset_summary.py"]),
    ("Train resume category", ["py", "scripts/train_resume_category.py"]),
    ("Train question type", ["py", "scripts/train_question_type.py"]),
    ("Train question type text only", ["py", "scripts/train_question_type_text_only.py"]),
    ("Train question type by source", ["py", "scripts/train_question_type_by_source.py"]),
    ("Predict resume category samples", ["py", "scripts/predict_resume_category.py"]),
    ("Predict question type samples", ["py", "scripts/predict_question_type_manual.py"]),
    ("Predict question difficulty samples", ["py", "scripts/predict_question_difficulty.py"]),
    ("Audit dataset readiness", ["py", "scripts/audit_dataset_readiness.py"]),
]


def main() -> None:
    for title, command in STEPS:
        print("\n" + "#" * 90)
        print(title)
        print("#" * 90)
        print("Command:", " ".join(command))

        result = subprocess.run(command, cwd=ROOT)
        if result.returncode != 0:
            print(f"\nStep failed: {title}")
            sys.exit(result.returncode)

    print("\nPipeline finished successfully.")


if __name__ == "__main__":
    main()
