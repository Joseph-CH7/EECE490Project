import pandas as pd
import joblib
import numpy as np

from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, classification_report


DATA_PATH = "ml-service-challenges/dataset/challenge_answers.csv"
MODEL_PATH = "ml-service-challenges/model.pkl"


def combine_text(row):
    return (
        f"User answer: {row['user_answer']} "
        f"Difficulty: {row['difficulty']}"
    )


df = pd.read_csv(DATA_PATH)
df["text"] = df.apply(combine_text, axis=1)

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

X = embedding_model.encode(df["text"].tolist(), show_progress_bar=True)
X = np.array(X)

y_score = df["score"]
y_label = df["label"]

X_train, X_test, y_score_train, y_score_test, y_label_train, y_label_test = train_test_split(
    X,
    y_score,
    y_label,
    test_size=0.2,
    random_state=42,
    stratify=y_label
)

score_model = RandomForestRegressor(
    n_estimators=300,
    random_state=42
)

label_model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight="balanced"
)

score_model.fit(X_train, y_score_train)
label_model.fit(X_train, y_label_train)

score_predictions = score_model.predict(X_test)
label_predictions = label_model.predict(X_test)

print("Regression Model")
print("MAE:", mean_absolute_error(y_score_test, score_predictions))
print("R2:", r2_score(y_score_test, score_predictions))

print("\nClassification Model")
print("Accuracy:", accuracy_score(y_label_test, label_predictions))
print(classification_report(y_label_test, label_predictions))

joblib.dump(
    {
        "embedding_model": embedding_model,
        "score_model": score_model,
        "label_model": label_model,
    },
    MODEL_PATH
)

print("Embedding-based dual ML models saved to", MODEL_PATH)