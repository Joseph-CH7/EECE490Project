from pathlib import Path

MODEL_DIR = Path("models")
REPORT_DIR = Path("data/interim/model_reports")

print("Models folder exists:", MODEL_DIR.exists())
print("Report folder exists:", REPORT_DIR.exists())

if MODEL_DIR.exists():
    print("\nModel files:")
    for f in MODEL_DIR.glob("*"):
        print("-", f.name)

if REPORT_DIR.exists():
    print("\nReport files:")
    for f in REPORT_DIR.glob("*"):
        print("-", f.name)