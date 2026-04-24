export type VisualMetrics = {
  sampleCount: number;
  faceDetectedRatio: number;
  centeredFaceRatio: number;
  lookingAwayRatio: number;
  steadyRatio: number;
  averageEyeContactScore: number;
};

export type LiveInterviewFeedback = {
  totalScore: number;
  relevance: number;
  keyword: number;
  semantic: number;
  delivery: number;
  visualPresence: number;
  strengths: string[];
  improvements: string[];
  followUp: string;
  answerLength: number;
  includesExample: boolean;
  includesOutcome: boolean;
  visualMetrics: VisualMetrics | null;
};

export type InterviewFeedbackEntry = {
  question: string;
  answer: string;
  feedback: LiveInterviewFeedback;
};

export type InterviewSessionFeedback = {
  totalScore: number;
  relevance: number;
  keyword: number;
  semantic: number;
  delivery: number;
  visualPresence: number;
  strengths: string[];
  improvements: string[];
  followUp: string;
  answerCount: number;
  entries: InterviewFeedbackEntry[];
  averageAnswerLength: number;
  includesExampleRate: number;
  includesOutcomeRate: number;
  visualMetrics: VisualMetrics | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function splitSentences(text: string) {
  return text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function countDigits(text: string) {
  return (text.match(/\d/g) || []).length;
}

function mentionsExample(text: string) {
  const lowered = text.toLowerCase();
  return [
    "for example",
    "for instance",
    "in one project",
    "i worked on",
    "i built",
    "i used",
    "my role",
  ].some((phrase) => lowered.includes(phrase));
}

function mentionsOutcome(text: string) {
  const lowered = text.toLowerCase();
  return [
    "result",
    "outcome",
    "impact",
    "improved",
    "reduced",
    "increased",
    "faster",
    "saved",
    "delivered",
  ].some((phrase) => lowered.includes(phrase));
}

function containsAny(text: string, phrases: string[]) {
  const lowered = text.toLowerCase();
  return phrases.some((phrase) => lowered.includes(phrase));
}

function extractMentionedTerm(text: string, phrases: string[]) {
  const lowered = text.toLowerCase();

  for (const phrase of phrases) {
    const index = lowered.indexOf(phrase);
    if (index !== -1) {
      return text.slice(index, index + phrase.length);
    }
  }

  return null;
}

function getAnswerSignals(answer: string) {
  const lowered = answer.toLowerCase();

  const mentionedTool =
    extractMentionedTerm(answer, [
      "python",
      "javascript",
      "typescript",
      "react",
      "next.js",
      "next",
      "node",
      "fastapi",
      "sql",
      "mongodb",
      "postgres",
      "docker",
      "aws",
      "api",
      "model",
      "algorithm",
      "framework",
    ]) || null;

  return {
    hasChallenge: containsAny(lowered, [
      "challenge",
      "problem",
      "issue",
      "bug",
      "difficult",
      "hard",
      "obstacle",
      "pressure",
      "deadline",
      "conflict",
      "blocker",
    ]),
    hasTeamwork: containsAny(lowered, [
      "team",
      "teammate",
      "manager",
      "stakeholder",
      "client",
      "we worked",
      "collaborated",
      "together",
    ]),
    hasOwnership: containsAny(lowered, [
      "i ",
      "i was",
      "i led",
      "i built",
      "i designed",
      "i decided",
      "my role",
      "i owned",
      "i implemented",
      "i worked on",
    ]),
    hasTradeoff: containsAny(lowered, [
      "tradeoff",
      "trade-off",
      "instead of",
      "rather than",
      "alternative",
      "choice",
      "decided",
      "decision",
    ]),
    hasLearning: containsAny(lowered, [
      "learned",
      "lesson",
      "would change",
      "next time",
      "improve",
      "improved",
    ]),
    hasMetric: countDigits(answer) > 0 || containsAny(lowered, [
      "percent",
      "%",
      "faster",
      "slower",
      "saved",
      "increased",
      "reduced",
      "latency",
      "accuracy",
      "performance",
    ]),
    hasTool: Boolean(mentionedTool),
    mentionedTool,
    hasReasoning: containsAny(lowered, [
      "because",
      "so that",
      "in order to",
      "the reason",
      "why",
    ]),
    hasTesting: containsAny(lowered, [
      "test",
      "tested",
      "validate",
      "verified",
      "checked",
      "measured",
      "monitor",
    ]),
  };
}

export function buildCoachingReply(
  answer: string,
  currentQuestion: string,
  interviewType: string,
) {
  const sentences = splitSentences(answer);
  const words = wordCount(answer);
  const hasExample = mentionsExample(answer);
  const hasOutcome = mentionsOutcome(answer) || countDigits(answer) > 0;
  const isBehavioral = interviewType.toLowerCase() === "behavioral";
  const loweredQuestion = currentQuestion.toLowerCase();
  const signals = getAnswerSignals(answer);

  if (words < 12) {
    return "Please expand your answer a bit more. Walk me through your thinking, the steps you took, and what happened in the end.";
  }

  if (!hasOutcome) {
    return "That gives me the context. What was the final outcome, and how did you measure whether your approach worked?";
  }

  if (sentences.length < 2) {
    return "Good start. Can you structure that in a clearer sequence: the problem, your action, and the result?";
  }

  if (!hasExample && words < 28) {
    return isBehavioral
      ? "Can you anchor that in one specific situation and explain exactly what you did?"
      : "Can you make that more concrete by walking me through one case where you applied that approach?";
  }

  if (signals.hasChallenge && !signals.hasReasoning) {
    return "You mentioned a challenge there. How did you decide on your approach, and why did you choose it over the main alternative?";
  }

  if (signals.hasTool && !signals.hasTradeoff) {
    return `You mentioned ${signals.mentionedTool}. Why was that the right choice for this situation, and what would have been the main alternative?`;
  }

  if (signals.hasTeamwork && !signals.hasOwnership) {
    return "You mentioned working with others. What part did you personally own, and how did your contribution affect the result?";
  }

  if (signals.hasMetric && !signals.hasTesting) {
    return "Those results sound strong. How did you verify or measure that improvement in practice?";
  }

  if (signals.hasTradeoff) {
    return "You hinted at a decision point there. What tradeoff mattered most, and what did you optimize for?";
  }

  if (signals.hasTeamwork) {
    return "How did you align with the other people involved when priorities or opinions were different?";
  }

  if (signals.hasChallenge) {
    return "What was the hardest part of that situation, and how did you work through it when things were not going smoothly?";
  }

  if (signals.hasLearning) {
    return "What did that experience change in how you approach similar work now?";
  }

  if (loweredQuestion.includes("how") || loweredQuestion.includes("design")) {
    return "Thanks. What tradeoff did you consider, and why did you choose that approach over the main alternative?";
  }

  if (loweredQuestion.includes("time you") || loweredQuestion.includes("describe")) {
    return "Thanks. If you faced the same situation again, what would you keep the same and what would you change?";
  }

  return "Thank you. That was clear. Before we move on, what is the key principle or decision from that answer that you would apply again in a similar situation?";
}

export function buildInterviewFeedback(
  answer: string,
  currentQuestion: string,
  interviewType: string,
  visualMetrics: VisualMetrics | null,
): LiveInterviewFeedback {
  const words = wordCount(answer);
  const sentenceCount = splitSentences(answer).length;
  const hasExample = mentionsExample(answer);
  const hasOutcome = mentionsOutcome(answer) || countDigits(answer) > 0;

  const relevance = clamp(
    4 +
      Math.min(words / 12, 2.3) +
      (hasExample ? 1.2 : 0) +
      (hasOutcome ? 1.3 : 0),
    1,
    10,
  );

  const keyword = clamp(
    4 +
      (hasExample ? 2 : 0) +
      (hasOutcome ? 2 : 0) +
      Math.min(sentenceCount, 3) * 0.6,
    1,
    10,
  );

  const semantic = clamp(
    4.5 +
      Math.min(words / 18, 2) +
      Math.min(sentenceCount, 3) * 0.7 +
      (currentQuestion ? 0.6 : 0),
    1,
    10,
  );

  const delivery = clamp(
    visualMetrics
      ? 3 +
          visualMetrics.averageEyeContactScore / 20 +
          visualMetrics.steadyRatio * 2
      : 6.2,
    1,
    10,
  );

  const visualPresence = clamp(
    visualMetrics
      ? 2 +
          visualMetrics.faceDetectedRatio * 3 +
          visualMetrics.centeredFaceRatio * 2.5 +
          visualMetrics.steadyRatio * 1.5 +
          (1 - visualMetrics.lookingAwayRatio) * 1
      : 6,
    1,
    10,
  );

  const totalScore = Math.round(
    ((relevance + keyword + semantic) / 3) * 7 +
      ((delivery + visualPresence) / 2) * 3,
  );

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (hasExample) {
    strengths.push("You grounded your answer in a concrete example instead of staying too general.");
  } else {
    improvements.push("Anchor your answer in one specific situation and make your personal role clearer.");
  }

  if (hasOutcome) {
    strengths.push("You referenced the outcome or impact, which makes your answer more convincing.");
  } else {
    improvements.push("Finish with a measurable result so the interviewer can judge the impact of your work.");
  }

  if (words >= 40 && sentenceCount >= 3) {
    strengths.push("Your answer had enough detail to show structure, context, and progression.");
  } else {
    improvements.push("Add a bit more structure: situation, action, and result in separate clear steps.");
  }

  if (visualMetrics) {
    if (visualMetrics.centeredFaceRatio >= 0.7 && visualMetrics.averageEyeContactScore >= 70) {
      strengths.push("Your camera presence was steady and you maintained strong eye contact for most of the answer.");
    } else {
      improvements.push("Keep your face centered and look toward the camera more consistently while answering.");
    }

    if (visualMetrics.faceDetectedRatio < 0.75) {
      improvements.push("Stay visible in the camera frame throughout the answer so the visual coaching stays reliable.");
    }

    if (visualMetrics.steadyRatio < 0.55) {
      improvements.push("Reduce extra head movement to appear calmer and more confident on camera.");
    }
  } else {
    improvements.push("Enable the camera during practice so feedback can include eye contact and on-camera presence.");
  }

  return {
    totalScore,
    relevance: Number(relevance.toFixed(1)),
    keyword: Number(keyword.toFixed(1)),
    semantic: Number(semantic.toFixed(1)),
    delivery: Number(delivery.toFixed(1)),
    visualPresence: Number(visualPresence.toFixed(1)),
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    followUp: buildCoachingReply(answer, currentQuestion, interviewType),
    answerLength: words,
    includesExample: hasExample,
    includesOutcome: hasOutcome,
    visualMetrics,
  };
}

export function buildSessionInterviewFeedback(
  entries: InterviewFeedbackEntry[],
): InterviewSessionFeedback | null {
  if (!entries.length) {
    return null;
  }

  const sum = <K extends keyof LiveInterviewFeedback>(key: K) =>
    entries.reduce((total, entry) => total + (entry.feedback[key] as number), 0);

  const average = (value: number) => Number((value / entries.length).toFixed(1));

  const strengthsByCount = new Map<string, number>();
  const improvementsByCount = new Map<string, number>();

  for (const entry of entries) {
    for (const strength of entry.feedback.strengths) {
      strengthsByCount.set(strength, (strengthsByCount.get(strength) || 0) + 1);
    }

    for (const improvement of entry.feedback.improvements) {
      improvementsByCount.set(improvement, (improvementsByCount.get(improvement) || 0) + 1);
    }
  }

  const topItems = (items: Map<string, number>) =>
    [...items.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([text]) => text);

  const visualEntries = entries
    .map((entry) => entry.feedback.visualMetrics)
    .filter((metric): metric is VisualMetrics => Boolean(metric));

  const averagedVisualMetrics = visualEntries.length
    ? {
        sampleCount: Math.round(
          visualEntries.reduce((total, metric) => total + metric.sampleCount, 0) /
            visualEntries.length,
        ),
        faceDetectedRatio: Number(
          (
            visualEntries.reduce((total, metric) => total + metric.faceDetectedRatio, 0) /
            visualEntries.length
          ).toFixed(3),
        ),
        centeredFaceRatio: Number(
          (
            visualEntries.reduce((total, metric) => total + metric.centeredFaceRatio, 0) /
            visualEntries.length
          ).toFixed(3),
        ),
        lookingAwayRatio: Number(
          (
            visualEntries.reduce((total, metric) => total + metric.lookingAwayRatio, 0) /
            visualEntries.length
          ).toFixed(3),
        ),
        steadyRatio: Number(
          (
            visualEntries.reduce((total, metric) => total + metric.steadyRatio, 0) /
            visualEntries.length
          ).toFixed(3),
        ),
        averageEyeContactScore: Math.round(
          visualEntries.reduce((total, metric) => total + metric.averageEyeContactScore, 0) /
            visualEntries.length,
        ),
      }
    : null;

  const averageAnswerLength = Math.round(
    entries.reduce((total, entry) => total + entry.feedback.answerLength, 0) / entries.length,
  );

  const includesExampleRate = Number(
    (
      entries.filter((entry) => entry.feedback.includesExample).length / entries.length
    ).toFixed(2),
  );

  const includesOutcomeRate = Number(
    (
      entries.filter((entry) => entry.feedback.includesOutcome).length / entries.length
    ).toFixed(2),
  );

  return {
    totalScore: Math.round(sum("totalScore") / entries.length),
    relevance: average(sum("relevance")),
    keyword: average(sum("keyword")),
    semantic: average(sum("semantic")),
    delivery: average(sum("delivery")),
    visualPresence: average(sum("visualPresence")),
    strengths: topItems(strengthsByCount),
    improvements: topItems(improvementsByCount),
    followUp:
      "Across the interview, which answer would you improve first, and how would you make it more specific, measurable, or better structured?",
    answerCount: entries.length,
    entries,
    averageAnswerLength,
    includesExampleRate,
    includesOutcomeRate,
    visualMetrics: averagedVisualMetrics,
  };
}
