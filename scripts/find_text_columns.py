from pathlib import Path
import pandas as pd

INTERIM_DIR = Path("data/interim")

for file in INTERIM_DIR.glob("*.csv"):
    print("\n" + "=" * 80)
    print("FILE:", file.name)
    try:
        df = pd.read_csv(file)
        for col in df.columns:
            if df[col].dtype == "object":
                sample = df[col].dropna().astype(str).head(2).tolist()
                avg_len = df[col].dropna().astype(str).str.len().mean()
                print(f"\nColumn: {col}")
                print(f"Average length: {avg_len:.2f}" if pd.notna(avg_len) else "Average length: N/A")
                print("Sample values:")
                for s in sample:
                    print("-", s[:200])
    except Exception as e:
        print("Error:", e)