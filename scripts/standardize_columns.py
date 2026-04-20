from pathlib import Path
import pandas as pd

RAW_DIR = Path("data/raw")
INTERIM_DIR = Path("data/interim")

INTERIM_DIR.mkdir(parents=True, exist_ok=True)

def clean_column(name):
    return (
        name.strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("/", "_")
    )

def read_csv_safe(file):
    for enc in ["utf-8", "latin1", "cp1252"]:
        try:
            return pd.read_csv(file, encoding=enc)
        except:
            pass
    raise ValueError("Cannot read file")

for file in RAW_DIR.rglob("*.csv"):
    print("Processing:", file)

    try:
        df = read_csv_safe(file)

        df.columns = [clean_column(c) for c in df.columns]

        out_file = INTERIM_DIR / f"{file.stem}_clean.csv"
        df.to_csv(out_file, index=False)

        print("Saved:", out_file)

    except Exception as e:
        print("Skipped:", file, e)