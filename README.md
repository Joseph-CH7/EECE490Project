# AI Interview Simulator

## Setup

Install frontend dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root and add:

```env
GEMINI_API_KEY=your_key_here
```

Yes, your teammates should replace `your_key_here` with their own real Gemini API key on their machines.

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
