# AI Interview Simulator

## Setup

Install frontend dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root and add your Clerk keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

These keys are needed because the setup, interview, feedback, preview, and dashboard routes are protected by Clerk middleware.

The current question generation flow uses the included Python scripts, processed datasets, and local `.joblib` models. It does not require a Gemini API key.

## Run The App

Start the frontend:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Run The ML Pipeline

To regenerate the processed datasets and models locally:

```bash
py scripts\run_ml_pipeline.py
```

The app route that generates interview questions will try `py`, `python`, and `python3` on Windows, and `python3`, `python`, and `py` on macOS/Linux.

## What Is Included

This repo includes:

- app/frontend code
- backend-related route handlers and helper files
- current Python scripts
- final processed datasets needed by the project
- current model files used by the app

This repo does not include regenerated/local-only files such as:

- `node_modules`
- `.next`
- `data/raw`
- `data/interim`
- old backup model artifacts
