# Architecture

## Project Goal

The system is an AI-powered real-time interview simulator. It helps a user upload or describe a CV, optionally provide a job description, receive role-aware interview questions, answer them in a web interview flow, and review structured feedback and progress.

## Main Components

### Web App

- Framework: Next.js
- Authentication: Clerk
- Storage: Firebase/Firestore for saved user results, with localStorage fallback for local demos
- UI flows: setup, CV upload, interview practice, feedback, challenges, dashboard

### Question Generation

The setup flow sends CV text, job description text, and selected interview type to `/api/generate-questions`.

That route calls `scripts/generate_interview_bundle.py`, which:

- infers the resume/job category using the trained resume classifier
- filters the curated question bank by category and selected interview type
- uses job-description and CV focus terms to rank relevant questions
- randomizes final selection so repeated interviews do not always show the same questions
- returns metadata such as category, source, difficulty, and relevance score

### CV Extraction

The CV upload route is `/api/extract-cv`.

It supports PDF extraction through a Node PDF parser path and a Python fallback path using `scripts/extract_pdf_text.py`.

After extraction, `scripts/infer_resume_category.py` predicts the most likely job category. The UI shows the detected category instead of dumping the full CV into the job-description box.

### Interview Evaluation

The live interview route is `/api/live-interview`.

It combines:

- a local heuristic baseline in `lib/interview-feedback.ts`
- an answer-evaluation layer for semantic feedback when configured
- fallback feedback when external evaluation is unavailable

The local evaluator checks answer length, relevance, clarity, missing concepts, technical details, and answer structure. It also contains question-type-aware follow-up logic so technical questions receive technical follow-ups and behavioral questions receive behavioral follow-ups.

### Camera Coach

`components/ui/InterviewCameraCoach.tsx` uses browser camera tracking and face landmarks to estimate face detection, eye contact quality, looking away, and excessive movement.

This is a lightweight client-side coaching signal, not a medical or biometric identity system.

### Dashboard

The dashboard summarizes stored attempts:

- average interview score
- best interview score
- challenge performance
- readiness estimate
- skill-level summaries
- attempt history

## Data Flow

```txt
User CV / job description / interview type
        |
        v
/api/generate-questions
        |
        v
Python question bundle script + trained resume classifier + curated question bank
        |
        v
Interview page
        |
        v
User answer + question + transcript context
        |
        v
/api/live-interview
        |
        v
Hybrid answer evaluation + fallback scoring
        |
        v
Feedback page + dashboard history
```

## Separation of Concerns

- `app/`: web pages and API routes
- `components/`: reusable UI and camera coaching components
- `lib/`: Firebase, voice helpers, and interview feedback logic
- `scripts/`: data processing, training, inference, and question selection
- `models/`: trained local model artifacts
- `data/`: processed datasets
- `ml-service*`: optional ML service experiments for scoring and dashboard insights

## Engineering Notes

- The app separates user-facing screens, API routes, model scripts, and reusable feedback logic.
- The question pipeline is reproducible because the trained local models and curated question bank are stored in the project.
- The evaluation flow includes fallback scoring so the interview demo can continue if an optional external service is unavailable.
- CV extraction uses more than one parsing path because real PDF files can vary in structure.
- The dashboard can use saved local attempts during development and Firebase-backed persistence when configured.
