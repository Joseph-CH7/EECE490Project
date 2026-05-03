# Real-Time Interview Simulator

Real-Time Interview Simulator is a web application for interview preparation. Users can upload or paste resume content, choose a target role, practice mock interviews, complete role-based challenges, receive feedback, save results, and track progress over time through a dashboard.

The project was built for **EECE 490 - Introduction to Machine Learning**. It combines a **Next.js frontend**, **Clerk authentication**, **Firebase Firestore storage**, **Next.js API routes**, trained local ML models, and a separate **FastAPI machine learning service** for challenge and progress evaluation.

---

## Problem and Motivation

Interview preparation is often passive, generic, or expensive. Many students rely on static question lists, videos, or human coaching that may not adapt to their target role or resume.

This project augments interview preparation by helping users answer three practical questions:

- What role does my resume most closely match?
- What kind of interview questions should I practice?
- How are my answers improving over time?

The system is intended for students, job seekers, university career centers, and interview-preparation platforms.

---

## Main Features

- User authentication with Clerk
- CV upload and resume-category detection
- Manual category override for incorrect or missing CV predictions
- Job-description-aware interview question selection
- Randomized interview questions when no job description is provided
- Technical and behavioral mock interview practice
- Follow-up questions when the answer needs more detail
- Camera-based visual-presence signals during interviews
- Challenge-based practice
- ML-based challenge answer evaluation
- Progress prediction using a Random Forest Regressor
- Readiness label prediction using a Random Forest Classifier
- Saved results in Firebase Firestore
- Dashboard progress tracking and analytics
- Feedback, recommendations, and readiness insights

---

## How the App Works

1. The user signs in.
2. The user selects or confirms a job category.
3. The user optionally uploads a CV and/or enters a job description.
4. The app generates role-appropriate interview questions.
5. The user answers each question and optional follow-up.
6. The app scores the answers and generates feedback.
7. Results are saved and shown in the dashboard.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js / React | User interface, interview flow, setup flow, feedback, and dashboard |
| Styling | Tailwind CSS | Responsive UI styling |
| Authentication | Clerk | Sign-up, login, sessions, and user identity |
| Database | Firebase Firestore | Stores user-specific interview and challenge results |
| API Layer | Next.js API routes | Connects the frontend to backend logic and the ML service |
| ML Service | Python / FastAPI | Serves challenge evaluation and progress prediction endpoints |
| Text Features | TF-IDF | Converts resume and question text into numerical features |
| Resume Model | LinearSVC | Predicts resume/job category |
| Question Model | TF-IDF + classifier | Predicts whether questions are technical or behavioral |
| Semantic Evaluation | SentenceTransformer + cosine similarity | Compares answer meaning against expected content |
| Progress Model | Random Forest Regressor | Predicts the user's next expected score |
| Readiness Model | Random Forest Classifier | Predicts readiness level from progress features |
| Deployment | Docker / Docker Compose | Runs the frontend and ML API as reproducible services |

---

## Machine Learning Components

### Resume Classification

The resume classifier predicts the user's likely job category from raw CV or resume text.

```txt
Input: resume text
Features: TF-IDF text vectors
Model: LinearSVC
Output: job category
```

This helps the system select questions that match the user's background. Because the resume model is not perfect, the app also allows the user to manually correct or override the detected category.

### Question Taxonomy

The question classifier organizes prompts as technical or behavioral.

```txt
Input: interview question text
Features: TF-IDF text vectors
Output: technical or behavioral
```

This makes the interview flow more balanced and prevents the system from relying only on manually grouped questions.

### Semantic Answer Evaluation

Challenge answers are evaluated using sentence embeddings and cosine similarity. This is useful because open-ended answers can express the same idea with different wording.

```txt
Input: question, expected answer, user answer
Method: SentenceTransformer embeddings + cosine similarity
Output: relevance, semantic similarity, score, feedback
```

### Progress and Readiness Prediction

The dashboard uses structured performance features such as average score, recent average, trend change, consistency, attempt count, best score, and weakest skills.

```txt
Input: progress features
Random Forest Regressor output: predicted next score
Random Forest Classifier output: readiness level
```

---

## Experimental Results

The project includes reproducible training and audit scripts in the `scripts` folder.

| Model / Dataset | Result |
|---|---|
| Curated question bank | 2,058 questions |
| Balanced question dataset | 1,554 questions |
| Question type classifier test accuracy | 99.36% |
| Question type classifier mean CV macro F1 | 99.84% |
| Source-holdout question classifier accuracy | 96.21% |
| Resume category classifier test accuracy | 75.30% |
| Resume category classifier macro F1 | 75.49% |

The source-holdout test is important because it evaluates whether the question-type model generalizes to a held-out source instead of only memorizing one dataset style.

---

## Baseline Comparison

A non-AI baseline can use:

- Keyword matching
- Answer length
- Presence of expected terms
- Rule-based structure checks
- Manual category rules

The baseline is interpretable and fast, but it struggles when users express correct ideas with different wording. The ML approach improves this by using learned text representations, supervised classification, and semantic similarity.

---

## Responsible ML

Responsible ML matters because the app gives feedback that may affect how users judge their interview readiness.

### Explainability

The system shows scores with strengths and improvement points instead of only showing a number. Feedback is connected to criteria such as relevance, clarity, completeness, examples, structure, and outcome.

### Fairness and Bias

The system should not unfairly penalize non-native English phrasing or different writing styles. The app should be tested with varied answer styles and resume formats.

### Privacy

CVs, answers, and scores may contain personal information. Results are linked to authenticated Clerk user IDs and stored in Firestore so users only access their own history.

### Robustness

The system is tested with short, long, vague, strong, weak, and differently worded answers. The resume model also includes a manual override because category prediction can be wrong for unusual or mixed-role resumes.

---

## Error Analysis

Known failure cases include:

- Resume categories can be confused when roles overlap.
- Long but vague answers can sometimes receive too much credit.
- Short but correct answers can sometimes be under-scored.
- Follow-up questions can be too generic if the answer contains broad keywords.
- Camera-based visual metrics are approximate and depend on lighting, position, and browser access.
- Challenge answers can be evaluated poorly if the expected answer is too narrow.

Possible improvements include adding more labeled examples, adding expert-labeled answers, improving calibration, expanding evaluation logs, and increasing test coverage across resume styles and question domains.

---

## Project Structure

```txt
app/                    Next.js pages and API routes
components/             Reusable UI components
data/                   Raw and processed datasets
lib/                    Shared frontend/backend logic
ml-service-dashboard/   FastAPI ML service for challenge/progress endpoints
models/                 Saved trained models
scripts/                Data processing, training, inference, and audit scripts
sample_cvs/             Sample CV files for testing
types/                  Shared TypeScript types
```

---

## Getting Started

### Prerequisites

Install:

- Node.js
- npm
- Git
- Python 3.10 or later
- pip

You also need accounts/keys for:

- Clerk authentication
- Firebase Firestore

---

## Clone the Repository

```bash
git clone https://github.com/Joseph-CH7/EECE490Project.git
cd EECE490Project
```

---

## Install Frontend Dependencies

```bash
npm install
```

---

## Environment Variables

Create a `.env.local` file in the root folder.

```bash
touch .env.local
```

Add the required variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id_here

# Optional external feedback API
GEMINI_API_KEY=your_gemini_api_key_here

# ML Service
ML_SERVICE_URL=http://localhost:8000
```

Without valid environment variables, authentication, database storage, and external feedback generation may not work correctly.

---

## Run Locally Without Docker

Start the ML service:

```bash
cd ml-service-dashboard
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

In a second terminal, start the frontend from the project root:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## Run with Docker

The repository includes a Docker setup for the frontend and ML API.

```bash
docker compose --env-file .env.local up --build
```

Services:

- `frontend` on port `3000`
- `ml-api` on port `8000`

Open:

```txt
http://localhost:3000
```

---

## Reproducible Experiments

Useful scripts:

```bash
python scripts/dataset_summary.py
python scripts/audit_dataset_readiness.py
python scripts/train_question_type.py
python scripts/train_question_type_by_source.py
python scripts/train_resume_category.py
```

These scripts summarize the datasets, audit readiness, train models, and report evaluation metrics.

---

## Testing

The system can be tested using weak, acceptable, and strong answers.

Example testing approach:

```txt
Weak answer: short, vague, or unrelated
Acceptable answer: partially correct with some missing detail
Strong answer: clear definition, example, tradeoff, and outcome
```

Evaluation checks:

- Question generation matches the selected role or job description.
- CV upload extracts text and predicts a reasonable category.
- Manual category override changes the generated questions.
- Weak answers receive lower scores than strong answers.
- Follow-up answers are included in feedback when asked.
- Dashboard shows only the signed-in user's saved history.
- Docker Compose starts the frontend and ML API.

---

## Limitations

The project has some limitations:

- Resume classification is useful but not perfect.
- Dataset size and label quality limit model reliability.
- Answer quality is partly subjective.
- Scores are based on a designed rubric and model estimates.
- The app may over-score long but vague answers.
- The app may under-score short but correct answers.
- Camera metrics are approximate and browser-dependent.
- More expert-labeled answers would improve reliability.
- The app does not replace human interview practice.

---

## Future Work

Future improvements include:

- Expanding the resume and answer datasets
- Adding expert-labeled answers
- Improving calibration for scores
- Adding more fairness and robustness tests
- Improving deployment monitoring
- Adding more detailed ablation results
- Improving voice delivery metrics for filler words, pauses, and speaking rate

---

## Disclaimer

Real-Time Interview Simulator is intended for interview practice and educational use. The feedback generated by the app may not always be fully accurate and should not be treated as a final judgment of a user's interview ability.

Users should treat the feedback as guidance for improvement and not as a replacement for expert human feedback.
