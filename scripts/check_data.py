from pathlib import Path
import pandas as pd

RAW_DIR = Path("data/raw")

def try_read_csv(file):
    encodings = ["utf-8", "latin1", "cp1252"]
    for enc in encodings:
        try:
            return pd.read_csv(file, encoding=enc)
        except Exception:
            continue
    raise ValueError(f"Could not read {file}")

def show_csv_info(folder: Path):
    csv_files = list(folder.rglob("*.csv"))

    for file in csv_files:
        print("\n" + "=" * 80)
        print("FILE:", file)

        try:
            df = try_read_csv(file)

            print("Shape:", df.shape)
            print("Columns:", df.columns.tolist())

            print("\nFirst rows:")
            print(df.head(3))

            print("\nMissing values:")
            print(df.isna().sum().sort_values(ascending=False).head(10))

        except Exception as e:
            print("Could not read:", e)

if __name__ == "__main__":
    show_csv_info(RAW_DIR)