from pathlib import Path
import re
import pandas as pd

# This version avoids label leakage.
# It only creates neutral text-shape features, not behavioral/technical clue features.

IN_FILE = Path("data/processed/questions_balanced.csv")
OUT_FILE = Path("data/processed/questions_with_features_v2.csv")


def clean_text(x):
    if pd.isna(x):
        return ""
    return str(x).strip()


def count_sentences(text):
    if not text:
        return 0
    parts = re.split(r"[.!?]+", text)
    parts = [p.strip() for p in parts if p.strip()]
    return len(parts)


def count_uppercase_words(text):
    words = re.findall(r"\b[A-Z]{2,}\b", text)
    return len(words)


def count_digits(text):
    return sum(ch.isdigit() for ch in text)


def count_punctuation(text):
    return len(re.findall(r"[^\w\s]", text))


def average_word_length(text):
    words = re.findall(r"\b\w+\b", text.lower())
    if not words:
        return 0.0
    return sum(len(w) for w in words) / len(words)


def unique_word_ratio(text):
    words = re.findall(r"\b\w+\b", text.lower())
    if not words:
        return 0.0
    return len(set(words)) / len(words)


def starts_with_wh_word(text):
    text = text.lower().strip()
    wh_words = ("what", "why", "how", "when", "where", "which", "who")
    return int(text.startswith(wh_words))


def starts_with_command_style(text):
    text = text.lower().strip()
    starters = (
        "tell",
        "describe",
        "explain",
        "walk",
        "share",
        "give",
        "define",
        "compare",
        "discuss",
        "implement",
        "design"
    )
    return int(text.startswith(starters))


def main():
    if not IN_FILE.exists():
        raise FileNotFoundError(f"Input file not found: {IN_FILE}")

    df = pd.read_csv(IN_FILE)

    if "question_text" not in df.columns:
        raise ValueError("Missing required column: question_text")

    df["question_text"] = df["question_text"].apply(clean_text)
    df = df[df["question_text"] != ""].copy()

    # Basic text features
    df["char_count"] = df["question_text"].str.len()
    df["word_count"] = df["question_text"].str.split().str.len()
    df["sentence_count"] = df["question_text"].apply(count_sentences)

    # Punctuation / structure features
    df["question_mark_count"] = df["question_text"].str.count(r"\?")
    df["comma_count"] = df["question_text"].str.count(r",")
    df["colon_count"] = df["question_text"].str.count(r":")
    df["digit_count"] = df["question_text"].apply(count_digits)
    df["punctuation_count"] = df["question_text"].apply(count_punctuation)

    # Word-level neutral features
    df["avg_word_length"] = df["question_text"].apply(average_word_length)
    df["unique_word_ratio"] = df["question_text"].apply(unique_word_ratio)
    df["uppercase_word_count"] = df["question_text"].apply(count_uppercase_words)

    # Start-pattern features
    df["starts_with_wh_word"] = df["question_text"].apply(starts_with_wh_word)
    df["starts_with_command_style"] = df["question_text"].apply(starts_with_command_style)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_FILE, index=False)

    print(f"Saved: {OUT_FILE}")
    print("Shape:", df.shape)

    preview_cols = [
        "question_text",
        "char_count",
        "word_count",
        "sentence_count",
        "question_mark_count",
        "avg_word_length",
        "unique_word_ratio",
        "starts_with_wh_word",
        "starts_with_command_style",
    ]

    if "question_type" in df.columns:
        preview_cols.insert(1, "question_type")

    print("\nPreview:")
    print(df[preview_cols].head())


if __name__ == "__main__":
    main()
