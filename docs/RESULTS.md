# Results and Evidence

## Dataset Summary

Final feature-ready question dataset:

- Total questions: 1,554
- Technical questions: 800
- Behavioral questions: 754
- Exact duplicate questions: 0
- Normalized duplicate questions: 0

Major job-category coverage:

| Category | Count |
| --- | ---: |
| software_engineering | 337 |
| data_science | 237 |
| human_resources | 180 |
| finance | 100 |
| design_creative | 100 |
| education | 100 |
| healthcare | 100 |
| hospitality | 100 |
| business_development | 100 |
| construction | 100 |
| fitness_wellness | 100 |

Software engineering coverage includes 250 technical questions and 87 behavioral questions.

Resume training data used for category classification:

- Final training dataset: 3,319 examples
- Classes: 11 job categories
- Largest classes: finance, software engineering, business development

## Question Type Classifier

Task: classify an interview question as technical or behavioral.

Results:

- Mean cross-validation accuracy: 0.9984
- Mean cross-validation macro F1: 0.9984
- Test accuracy: 0.9936
- Source-holdout accuracy: 0.9621

The source-holdout test checks whether the model generalizes to questions from a held-out data source instead of only memorizing one dataset style.

## Resume Category Classifier

Task: classify resume text into a job category.

Best model:

- TF-IDF text features
- LinearSVC

Results:

- Best cross-validation macro F1: 0.7245
- Test accuracy: 0.7530
- Test macro F1: 0.7549

The resume model is useful but not perfect. This is why the app should allow the user to correct or override the detected category during setup.

## Baselines

The project includes non-AI and simple-model baselines:

- answer-length checks
- keyword overlap
- expected concept matching
- rule-based completeness checks
- TF-IDF models for classification

These baselines are useful because they are fast, interpretable, and reproducible. The hybrid feedback layer is used where pure keyword rules are too brittle.

## Evaluation Commands

Run these from the project root:

```bash
py scripts/dataset_summary.py
py scripts/train_question_type.py
py scripts/train_question_type_by_source.py
py scripts/train_resume_category.py
```

For the full local pipeline:

```bash
py scripts/run_ml_pipeline.py
```

## Known Error Cases

- Resume category classification can confuse categories with overlapping business or analytics language.
- Short but correct answers can be under-scored if they do not include enough context.
- Long but vague answers can sometimes receive more credit than they deserve.
- PDF parsing depends on the structure of the uploaded PDF.
- Camera tracking can be sensitive to lighting, webcam angle, and fast head movement.

