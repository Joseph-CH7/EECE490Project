# Demo Script

## Goal

Show that the project is a deployable interview simulator with role-aware question generation, CV/category inference, feedback, progress tracking, and responsible ML considerations.

## Demo Flow

### 1. Start From Home

Show the main app screen and explain that users can practice interviews, complete challenges, and track progress.

### 2. Authentication

Sign in with a test account. Clerk handles user identity and lets the app connect saved results to the correct user.

### 3. Setup Interview

Go to setup, upload a sample CV or paste CV text, and show:

- detected category
- optional job description
- selected interview type

Explain that CV/job text is used to choose role-aware questions from the curated bank.

### 4. Run Interview

Start the interview. Answer one question well and one question weakly.

Show:

- follow-up question behavior
- score differences
- structured feedback
- camera coaching if the webcam is available

### 5. Feedback Page

After the final question, go to feedback.

Explain that the score is guidance, not a final judgment, and that the feedback explains strengths and missing points.

### 6. Challenge Mode

Open Challenges and submit one answer. Explain that challenge mode tests deeper applied reasoning beyond simple Q&A.

### 7. Dashboard

Open the dashboard and show previous attempts, average score, best score, readiness estimate, and skill summaries.

### 8. Evidence

Mention key model results:

- question type classifier test accuracy: 99.36%
- question type source-holdout accuracy: 96.21%
- resume category classifier test accuracy: 75.30%
- resume category macro F1: 75.49%

### 9. Responsible ML

State the limitations:

- resume prediction can be wrong
- scoring is guidance, not a hiring decision
- camera signals are approximate
- user data should be handled carefully

## Likely Q&A

### Why use ML?

The app uses ML because exact keyword matching is too rigid for resumes and interview answers. Two correct answers can use different wording, so the system combines simple baselines with trained local models and semantic evaluation.

### What is the baseline?

The baseline checks answer length, keyword overlap, expected concepts, and structure. It is interpretable but less flexible than semantic evaluation.

### What is the biggest limitation?

Resume classification is useful but not perfect, with about 75% test accuracy. The next improvement should be a user-correctable category dropdown and more balanced resume data.

### What makes this deployable?

The app has authentication, API routes, saved history, dashboard review, trained model artifacts, documented run commands, and fallback behavior when optional services fail.
