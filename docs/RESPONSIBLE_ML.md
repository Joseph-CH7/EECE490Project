# Responsible ML

## Why Responsible ML Matters

The system gives users scores and coaching feedback about interview readiness. That feedback can influence confidence, study decisions, and perceived ability. Because of that, the app should be clear that the score is guidance, not a final judgment of a person.

## Explainability

The app does not only return a score. It also returns:

- strengths
- missing points
- improvement suggestions
- answer-specific feedback
- readiness level

This helps the user understand why the score was assigned and what they can improve.

## Fairness and Bias

Potential bias risks:

- non-native English speakers may use simpler wording
- users may have different communication styles
- some job categories have less training data than others
- resumes from different countries may use different formatting or terminology

Mitigations:

- scoring should emphasize relevance and correctness over polished wording
- the app should avoid treating accent, camera quality, or wording style as proof of ability
- camera coaching should stay separate from technical correctness scoring
- resume category prediction should be user-correctable

## Privacy

The app can process sensitive information:

- CV content
- job history
- education
- answers about personal experiences
- voice/camera signals during practice

Privacy safeguards:

- API keys are stored in `.env.local`, not committed to GitHub
- authenticated user sessions are handled by Clerk
- saved results are linked to the signed-in user
- CV extraction is used for interview setup, not for unrelated reuse
- camera tracking runs client-side for coaching signals

Recommended demo statement:

> This is an educational interview-practice tool. The score is a coaching signal, not a hiring decision.

## Robustness

The app should be tested with:

- empty answers
- very short answers
- strong detailed answers
- off-topic answers
- correct answers using different wording
- different CV formats
- different lighting and camera positions
- missing API keys
- Firebase unavailable

## Limitations

- The resume classifier is around 75% accurate, so it should not be treated as final.
- Answer scoring is partly subjective.
- Some feedback features depend on external API availability and may fail if keys or quota are unavailable.
- Camera signals are approximate and can fail under poor lighting or difficult webcam angles.
- The current system does not prove fairness statistically across demographic groups.

## Responsible Use

The app should be presented as a practice and coaching tool. It should not be used to make real hiring, admission, or employment decisions without expert human review.
