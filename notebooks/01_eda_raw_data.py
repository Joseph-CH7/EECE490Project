from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

RAW_DIR = Path("data/raw")
EDA_DIR = Path("data/interim/eda_outputs")
EDA_DIR.mkdir(parents=True, exist_ok=True)

def read_csv_safe(file: Path) -> pd.DataFrame:
    for enc in ("utf-8", "latin1", "cp1252"):
        try:
            return pd.read_csv(file, encoding=enc)
        except Exception:
            continue
    raise ValueError(f"Could not read {file}")

def load_all_csvs():
    datasets = {}
    for file in RAW_DIR.rglob("*.csv"):
        try:
            datasets[file.stem] = read_csv_safe(file)
        except Exception as e:
            print(f"Skipping {file}: {e}")
    return datasets

def save_histogram(series, title: str, out_name: str):
    plt.figure(figsize=(8, 4))
    series.hist(bins=30)
    plt.title(title)
    plt.xlabel("Characters")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(EDA_DIR / out_name, dpi=150)
    plt.close()

def basic_eda(name: str, df: pd.DataFrame):
    print("\n" + "=" * 80)
    print(f"DATASET: {name}")
    print(f"Shape: {df.shape}")
    print("Columns:", df.columns.tolist())

    print("\nDtypes:")
    print(df.dtypes)

    print("\nMissing values:")
    print(df.isna().sum().sort_values(ascending=False).head(15))

    print("\nDuplicate rows:", df.duplicated().sum())

    possible_text_cols = [
        c for c in df.columns
        if any(k in c.lower() for k in ["resume", "question", "answer", "description", "text", "category", "role"])
    ]

    for col in possible_text_cols[:4]:
        try:
            series = df[col].dropna().astype(str)
            lengths = series.str.len()

            print(f"\nText length stats for {col}:")
            print(lengths.describe())

            out_name = f"{name}_{col}_hist.png".replace(" ", "_")
            save_histogram(lengths, f"{name} - {col} length distribution", out_name)

        except Exception as e:
            print(f"Could not analyze {col}: {e}")

if __name__ == "__main__":
    datasets = load_all_csvs()
    for name, df in datasets.items():
        basic_eda(name, df)

    print(f"\nSaved EDA plots to: {EDA_DIR}")