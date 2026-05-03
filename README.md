# Real-Time Interview Simulator

Real-Time Interview Simulator is a web application for interview preparation. It allows users to practice mock interviews, complete role-based challenges, receive feedback, save results, and track progress over time through a dashboard.

The project was built for **EECE 490 - Introduction to Machine Learning**. It combines a **Next.js frontend**, **Clerk authentication**, **Firebase Firestore storage**, **API routes**, and a separate **machine learning service** for challenge answer evaluation.

---

## Main Features

- User authentication with Clerk
- Mock interview practice
- Challenge-based practice
- CV-based and job-description-based interview practice
- Role-specific and interviewer-mode practice
- Voice/speech-to-text answer input
- ML-based challenge answer evaluation
- Score prediction using a Random Forest Regressor
- Quality label prediction using a Random Forest Classifier
- Saved results in Firebase Firestore
- Dashboard progress tracking and analytics
- Feedback, recommendations, and readiness insights

---

## How the App Works

The user signs in, chooses an interview or challenge, submits an answer, receives feedback, and can later review results in the dashboard.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js / React | User interface, pages, forms, dashboard, and client-side interaction |
| Styling | Tailwind CSS | Responsive and clean user interface styling |
| Authentication | Clerk | Sign-up, login, sessions, and user identity |
| Database | Firebase Firestore | Stores interview results, challenge results, scores, labels, feedback, timestamps, and user IDs |
| API Layer | Next.js API routes | Connects the frontend to the ML service and backend logic |
| ML Service | Python / FastAPI | Runs challenge answer evaluation |
| Embeddings | SentenceTransformer | Converts written answers into numerical semantic vectors |
| Score Model | Random Forest Regressor | Predicts numerical score out of 100 |
| Label Model | Random Forest Classifier | Predicts answer quality label |
| Dataset | CSV | Stores labeled challenge answers used for training |

---

## Authentication

The application uses **Clerk** for authentication.

Clerk handles:

- User sign-up
- User sign-in
- User sessions
- Logout
- User identity
- Protected user-specific pages

Each authenticated user receives a unique Clerk user ID. This ID is attached to saved interview and challenge results in Firestore. The dashboard then filters results using the current user ID so each user only sees their own data.

---

## Database and Saved Results

The app uses **Firebase Firestore** as the cloud database.

Firestore stores:

- Interview attempts
- Challenge attempts
- User answers
- Scores
- Quality labels
- Feedback
- Timestamps
- Clerk user IDs
- User email when available

Saved results are important because they allow the dashboard to show progress over time instead of only giving one-time feedback.

---

## Machine Learning Component

The challenge evaluation uses a supervised machine learning pipeline.

The ML pipeline uses:

1. **Text preprocessing**
2. **Sentence embeddings**
3. **Random Forest Regressor**
4. **Random Forest Classifier**

### Text Preprocessing

Before evaluation, the submitted answer is prepared for the model. This includes handling empty input, removing unnecessary spacing, and combining useful context such as the answer and challenge difficulty.

### Sentence Embeddings

The answer is converted into a numerical vector using a SentenceTransformer embedding model.

Embeddings are used because interview and challenge answers are open-ended. Two users can write different sentences but still express the same correct idea. Embeddings help represent the meaning of the answer instead of only checking exact keywords.

### Random Forest Regressor

The Random Forest Regressor predicts the numerical score of the answer.

```txt
Input: answer embedding
Output: score out of 100
```

It is used because score prediction is a regression task. Each tree predicts a score, and the final prediction is based on the average of the trees.

### Random Forest Classifier

The Random Forest Classifier predicts the quality label of the answer.

```txt
Input: answer embedding
Output: quality label
```

Example labels:

- Weak
- Acceptable
- Strong

It is used because label prediction is a classification task. Each tree votes for a label, and the final label is selected by majority vote.

---

## Why This Is Supervised Learning

The challenge model is supervised because it was trained using labeled examples.

Each training example contains:

```txt
sample answer → score → quality label
```

The model learns the relationship between the answer embedding and the target outputs.

The regressor learns:

```txt
answer embedding → numerical score
```

The classifier learns:

```txt
answer embedding → quality label
```

---

## Baseline Comparison

A simple baseline would use rules such as answer length, keyword overlap, presence of expected terms, and basic structure checks.

However, this is limited because users may express correct ideas using different wording.

The ML approach improves on the baseline by using embeddings and supervised learning. This allows the system to evaluate answer meaning and quality patterns instead of relying only on exact keyword matches.

---

## Dashboard

The dashboard provides progress tracking and performance insights.

It loads saved results from Firestore and calculates:

- Total completed interviews
- Total completed challenges
- Average interview score
- Average challenge score
- Highest score
- Recent attempts
- Progress trend
- Strongest areas
- Weakest areas
- Recommendations
- Readiness insights

The dashboard uses rule-based analytics and feature engineering for direct calculations such as averages, totals, and recent attempts.

For readiness-style insights, dashboard features can include:

- Total attempts
- Average score
- Recent average
- Older average
- Trend change
- Consistency
- Best score
- Weakest categories

These features help estimate whether the user is improving and what they should practice next.

---

## Responsible ML

Responsible ML is important because the app gives feedback that may affect how users judge their interview readiness.

### Explainability

The system gives a score with feedback instead of only showing a number. Feedback is connected to criteria such as relevance, clarity, completeness, structure, and professionalism.

### Fairness and Bias

The system should not unfairly penalize users for writing style, language background, or non-native English phrasing. The dataset should include varied answer styles to improve fairness.

### Privacy

User answers may contain personal information. Results are linked to authenticated users and stored in Firestore so users only access their own history.

### Robustness

The system is tested with weak, average, strong, short, long, vague, and differently worded answers to understand how it behaves in different cases.

---

## Error Analysis

Common error cases include:

- Long but vague answers receiving high scores
- Short but correct answers receiving low scores
- Answers using different wording from the training examples
- Polished answers that sound professional but miss the main point
- Challenge answers being evaluated against the wrong challenge type
- Feedback being too general

Possible improvements include adding more labeled examples, adding concise strong answers, adding weak long answers, balancing weak/acceptable/strong examples, adding expert-labeled data, and improving challenge-specific grouping.

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

# Optional external feedback API, if used
GEMINI_API_KEY=your_gemini_api_key_here

# ML Service
ML_SERVICE_URL=http://localhost:8000
```

Without valid environment variables, authentication, database storage, or feedback generation may not work correctly.

---

## Run the Frontend

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## Run the ML Service

Go to the ML service folder:

```bash
cd ml-service-challenges
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Train the model if needed:

```bash
python train_model.py
```

Run the FastAPI service:

```bash
uvicorn api:app --reload --port 8000
```

The ML service should run on:

```txt
http://localhost:8000
```

---

## Running with Docker

Since the repository includes a Docker setup, the app can be run with Docker Compose.

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

## Testing

The system can be tested using weak, acceptable, and strong answers.

Example testing approach:

```txt
Weak answer → should receive a low score and weak label
Acceptable answer → should receive a medium score and acceptable label
Strong answer → should receive a high score and strong label
```

Evaluation metrics:

- Mean Absolute Error for the score regressor
- Classification accuracy for the label classifier
- Manual review of selected predictions
- Score consistency for similar answers

---

## Limitations

The project has some limitations:

- Dataset size is limited
- Scores are based on a manually designed rubric
- Answer quality can be subjective
- The model may over-score long but vague answers
- The model may under-score short but strong answers
- More real user testing is needed
- More expert-labeled answers would improve reliability
- The app does not replace human interview practice
- Feedback should be treated as guidance, not as a final judgment

---

## Future Work

Future improvements include:

- Expanding the training dataset
- Adding expert-labeled answers
- Improving evaluation logs and test cases
- Adding stronger model calibration
- Improving feedback specificity
- Adding more fairness and robustness tests
- Improving deployment and reproducibility

---

## Disclaimer

Real-Time Interview Simulator is intended for interview practice and educational use. The feedback generated by the app may not always be fully accurate and should not be treated as a final judgment of a user's interview ability.

Users should treat the feedback as guidance for improvement and not as a replacement for expert human feedback.
