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
  visualPresence: number | null;
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
  followUpQuestion?: string;
  followUpAnswer?: string;
  followUpFeedback?: LiveInterviewFeedback;
  feedback: LiveInterviewFeedback;
};

export type InterviewSessionFeedback = {
  totalScore: number;
  relevance: number;
  keyword: number;
  semantic: number;
  delivery: number;
  visualPresence: number | null;
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
    "a practical example",
    "practical example",
    "an example",
    "example is",
    "such as",
    "like a",
    "like an",
    "in one project",
    "in a project",
    "in one case",
    "in practice",
    "i worked on",
    "i built",
    "i used",
    "we used",
    "the frontend could",
    "the backend could",
    "get /",
    "post /",
    "patch /",
    "delete /",
    "my role",
  ].some((phrase) => lowered.includes(phrase));
}

function mentionsOutcome(text: string) {
  const lowered = text.toLowerCase();
  return [
    "result",
    "outcome",
    "impact",
    "user impact",
    "measurable",
    "improved",
    "improvement",
    "reduced",
    "increased",
    "faster",
    "saved",
    "delivered",
    "became",
    "easier",
    "more reliable",
    "more scalable",
    "more maintainable",
    "noticeably",
    "because of that",
    "as a result",
    "this helped",
    "this made",
  ].some((phrase) => lowered.includes(phrase));
}

function containsAny(text: string, phrases: string[]) {
  const lowered = text.toLowerCase();
  return phrases.some((phrase) => lowered.includes(phrase));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countKeywordMentions(text: string, keyword: string) {
  const escaped = escapeRegex(keyword);
  const pattern = /[a-z0-9+#.]/i.test(keyword[0]) && /[a-z0-9+#.]/i.test(keyword[keyword.length - 1])
    ? new RegExp(`(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#.])`, "gi")
    : new RegExp(escaped, "gi");

  return (text.match(pattern) || []).length;
}

function extractMentionedTerm(text: string, phrases: string[]) {
  const lowered = text.toLowerCase();

  for (const phrase of phrases) {
    const escaped = escapeRegex(phrase);
    const match = lowered.match(
      new RegExp(`(^|[^a-z0-9+#.])(${escaped})($|[^a-z0-9+#.])`, "i"),
    );

    if (match?.[2]) {
      const index = lowered.indexOf(match[2]);
      return text.slice(index, index + match[2].length);
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

export function extractCandidateKeywords(text: string) {
  const lowered = text.toLowerCase();
  const knownKeywords = [
    "database normalization",
    "normalization",
    "denormalization",
    "foreign key",
    "primary key",
    "referential integrity",
    "entity relationship",
    "indexing",
    "transactions",
    "acid",
    "machine learning",
    "deep learning",
    "data pipeline",
    "event-driven",
    "integration test",
    "unit test",
    "javascript",
    "typescript",
    "kubernetes",
    "microservices",
    "microservice",
    "authentication",
    "authorization",
    "serverless",
    "scalability",
    "performance",
    "encryption",
    "streaming",
    "react",
    "next.js",
    "node",
    "python",
    "java",
    "c++",
    "c#",
    "sql",
    "postgres",
    "mysql",
    "mongodb",
    "nosql",
    "redis",
    "docker",
    "aws",
    "azure",
    "gcp",
    "graphql",
    "rest",
    "api",
    "cache",
    "caching",
    "oauth",
    "jwt",
    "secure",
    "latency",
    "security",
    "testing",
    "e2e",
    "lambda",
    "agile",
    "scrum",
    "stakeholder",
    "stakeholders",
    "leadership",
    "collaboration",
    "conflict",
    "deadline",
    "communication",
    "prioritization",
    "planning",
    "debugging",
  ];

  const stopWords = new Set([
    "about",
    "after",
    "also",
    "because",
    "before",
    "being",
    "built",
    "could",
    "during",
    "every",
    "first",
    "from",
    "have",
    "into",
    "just",
    "like",
    "more",
    "most",
    "much",
    "need",
    "only",
    "other",
    "over",
    "problem",
    "project",
    "question",
    "same",
    "some",
    "solution",
    "that",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "through",
    "used",
    "using",
    "very",
    "were",
    "what",
    "when",
    "where",
    "which",
    "while",
    "with",
    "work",
    "worked",
    "would",
  ]);

  const candidates = new Map<string, { count: number; firstIndex: number; known: boolean }>();

  for (const keyword of knownKeywords) {
    const count = countKeywordMentions(lowered, keyword);

    if (count > 0) {
      candidates.set(keyword, {
        count,
        firstIndex: lowered.indexOf(keyword),
        known: true,
      });
    }
  }

  for (const match of lowered.matchAll(/\b[a-z][a-z0-9+#.]{3,}\b/g)) {
    const term = match[0];

    if (stopWords.has(term) || /^\d+$/.test(term)) {
      continue;
    }

    const current = candidates.get(term);
    candidates.set(term, {
      count: (current?.count || 0) + 1,
      firstIndex: current?.firstIndex ?? match.index ?? 0,
      known: current?.known || false,
    });
  }

  return [...candidates.entries()]
    .sort((a, b) => {
      const scoreA = a[1].count * 3 + (a[1].known ? 2 : 0);
      const scoreB = b[1].count * 3 + (b[1].known ? 2 : 0);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      return a[1].firstIndex - b[1].firstIndex;
    })
    .map(([keyword]) => keyword)
    .slice(0, 6);
}

export function extractQuestionFocusConcept(question: string) {
  const lowered = question.toLowerCase();
  const knownConcepts = [
    "database normalization",
    "normalization",
    "denormalization",
    "foreign key",
    "primary key",
    "referential integrity",
    "entity relationship",
    "indexing",
    "transactions",
    "acid",
    "sql",
    "nosql",
    "authentication",
    "authorization",
    "encryption",
    "cache",
    "caching",
    "closure",
    "lexical scope",
    "api",
    "react",
    "javascript",
    "typescript",
    "python",
  ];

  for (const concept of knownConcepts) {
    if (countKeywordMentions(lowered, concept) > 0) {
      return concept;
    }
  }

  const match = lowered.match(
    /^(?:what is|what are|define|explain(?: the concept of| the use of| how)?)\s+(.+?)(?:\s+in\s+|\s+for\s+|\s+within\s+|\?|$)/,
  );

  if (!match?.[1]) {
    return null;
  }

  const genericWords = new Set([
    "concept",
    "database",
    "design",
    "software",
    "system",
    "programming",
    "development",
  ]);
  const conceptWords = match[1]
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !genericWords.has(word));

  return conceptWords.join(" ") || null;
}

function isSystemDesignQuestion(question: string) {
  const lowered = question.toLowerCase();
  return containsAny(lowered, [
    "design a",
    "design an",
    "design the",
    "architect",
    "architecture",
    "system",
    "scalable",
    "distributed",
    "payment",
    "secure",
    "security",
    "infrastructure",
  ]);
}

function isTechnicalQuestion(question: string, interviewType: string) {
  const loweredType = interviewType.toLowerCase();
  const loweredQuestion = question.toLowerCase();

  return (
    loweredType === "technical" ||
    isSystemDesignQuestion(question) ||
    loweredQuestion.startsWith("what is") ||
    loweredQuestion.startsWith("define") ||
    loweredQuestion.includes("difference between") ||
    loweredQuestion.includes("compare") ||
    containsAny(loweredQuestion, [
      "implement",
      "explain",
      "optimize",
      "database",
      "api",
      "algorithm",
      "network",
      "protocol",
      "testing",
      "debug",
      "performance",
      "java",
      "javascript",
      "react",
      "python",
      "sql",
      "html",
      "css",
    ])
  );
}

function isConceptQuestion(question: string) {
  const lowered = question.toLowerCase();
  return (
    lowered.startsWith("what is") ||
    lowered.startsWith("define") ||
    lowered.startsWith("explain the concept") ||
    lowered.startsWith("explain the use") ||
    lowered.startsWith("explain how") ||
    lowered.includes("difference between") ||
    lowered.includes("compare") ||
    lowered.includes(" keyword") ||
    lowered.includes(" principle") ||
    lowered.includes(" in javascript") ||
    lowered.includes(" in java") ||
    lowered.includes(" in python")
  );
}

function isSqlNoSqlQuestion(question: string) {
  const lowered = question.toLowerCase();
  return lowered.includes("sql") && lowered.includes("nosql");
}

function hasConceptContrast(answer: string) {
  const lowered = answer.toLowerCase();
  return containsAny(lowered, [
    "while",
    "whereas",
    "but",
    "however",
    "structured",
    "relational",
    "non-relational",
    "nosql",
    "sql",
    "use case",
    "used for",
  ]);
}

function buildTechnicalFollowUp(
  answer: string,
  currentQuestion: string,
  answerKeywords: string[],
) {
  const loweredQuestion = currentQuestion.toLowerCase();
  const loweredAnswer = answer.toLowerCase();
  const questionConcept = extractQuestionFocusConcept(currentQuestion);

  if (isConceptQuestion(currentQuestion)) {
    if (questionConcept?.includes("normalization")) {
      return "You explained normalization. Can you give a small example of moving data from an unnormalized table into first or second normal form, and what redundancy that removes?";
    }

    if (/\bjava\b/.test(loweredQuestion) && /\bjavascript\b/.test(loweredQuestion)) {
      return "Good start. Can you give one practical example of where Java is commonly used and one example of where JavaScript is commonly used?";
    }

    if (questionConcept?.includes("closure")) {
      return "Good. Can you give a small JavaScript example where a closure preserves state between function calls?";
    }

    if (loweredQuestion.includes("this") && loweredQuestion.includes("javascript")) {
      return "Good start. Can you explain how the value of this changes depending on how a function is called in JavaScript?";
    }

    if (loweredQuestion.includes("sql") && loweredQuestion.includes("nosql")) {
      return "Good. Can you give one use case where SQL is the better choice and one use case where NoSQL is the better choice?";
    }

    if (questionConcept) {
      return `You explained ${questionConcept}. Can you give a practical example and one limitation or common mistake to watch for?`;
    }
  }

  if (answerKeywords.length) {
    const keyword = answerKeywords[0].toLowerCase();

    if (keyword.includes("react") || keyword.includes("next")) {
      return "You mentioned React. Why was it the right choice here, and how did it affect your component structure or state handling?";
    }

    if (keyword.includes("docker") || keyword.includes("kubernetes") || keyword.includes("container")) {
      return "You mentioned containerization. Can you explain how you would deploy and manage this solution in production?";
    }

    if (keyword.includes("aws") || keyword.includes("azure") || keyword.includes("gcp")) {
      return "You mentioned cloud infrastructure. Which cloud services would you use, and how would they support reliability and scalability?";
    }

    if (
      keyword.includes("sql") ||
      keyword.includes("mongodb") ||
      keyword.includes("nosql") ||
      keyword.includes("postgres") ||
      keyword.includes("mysql")
    ) {
      return "You mentioned a database technology. How does that choice affect data modeling, consistency, and performance for this problem?";
    }

    if (keyword.includes("api") || keyword.includes("rest") || keyword.includes("graphql")) {
      return "You mentioned API design. What are the main endpoints or contracts, and how would you secure and version them?";
    }

    if (
      keyword.includes("auth") ||
      keyword.includes("authentication") ||
      keyword.includes("authorization") ||
      keyword.includes("jwt") ||
      keyword.includes("oauth")
    ) {
      return "You mentioned authentication. How would you handle secure access and protect user data in this design?";
    }

    if (keyword.includes("cache") || keyword.includes("redis") || keyword.includes("caching")) {
      return "You mentioned caching. What would you cache, and how would you keep cached data fresh and correct?";
    }

    if (keyword.includes("latency") || keyword.includes("performance") || keyword.includes("optimize")) {
      return "You mentioned performance. What metric would you use to measure it, and where would you focus optimization first?";
    }

    return `You mentioned ${answerKeywords[0]}. Can you explain the key decision you made around it and what tradeoff or limitation came with that choice?`;
  }

  if (isConceptQuestion(currentQuestion)) {
    return "Good start. Can you add a concrete example that shows the concept in practice?";
  }

  if (containsAny(loweredQuestion, ["secure", "security", "payment", "authentication", "fraud"])) {
    if (!containsAny(loweredAnswer, ["encrypt", "token", "auth", "fraud", "2fa", "mfa", "pci"])) {
      return "Security is central to this design. How would you handle authentication, transaction encryption, and fraud prevention?";
    }

    return "Good. Now walk me through the payment flow step by step, from user authentication to transaction confirmation and failure handling.";
  }

  if (containsAny(loweredQuestion, ["scale", "scalable", "distributed", "millions"])) {
    return "How would your design handle high traffic, retries, and partial failures without creating duplicate or inconsistent transactions?";
  }

  if (containsAny(loweredQuestion, ["database", "data", "storage"])) {
    return "What data would you store, which database design would you choose, and how would you keep the data consistent?";
  }

  if (containsAny(loweredQuestion, ["api", "backend", "service"])) {
    return "What are the main API endpoints or services in your design, and how would they communicate safely?";
  }

  if (containsAny(loweredQuestion, ["optimize", "performance", "latency"])) {
    return "Where would the main bottleneck be, and what would you measure first before optimizing it?";
  }

  return "What is the most important technical tradeoff in your design, and why would you choose that approach over the main alternative?";
}

function buildKeywordAwareFollowUp(
  keyword: string,
  currentQuestion: string,
  interviewType: string,
) {
  const loweredQuestion = currentQuestion.toLowerCase();
  const loweredKeyword = keyword.toLowerCase();
  const isBehavioral = interviewType.toLowerCase() === "behavioral";

  if (containsAny(loweredKeyword, ["deadline", "prioritization", "planning"])) {
    return `You mentioned ${keyword}. What did you prioritize first, and what tradeoff did that force you to make?`;
  }

  if (containsAny(loweredKeyword, ["leadership", "collaboration", "stakeholder", "stakeholders"])) {
    return `You mentioned ${keyword}. What did you personally own, and how did you align the people involved when priorities differed?`;
  }

  if (containsAny(loweredKeyword, ["communication", "conflict"])) {
    return `You mentioned ${keyword}. What was the hardest message to communicate, and how did you adjust your approach for the other person?`;
  }

  if (containsAny(loweredKeyword, ["testing", "debugging"])) {
    return `You mentioned ${keyword}. What specific test or debugging step proved that your fix actually worked?`;
  }

  if (containsAny(loweredKeyword, ["security", "authentication", "authorization", "encryption", "jwt", "oauth"])) {
    return `You mentioned ${keyword}. What threat or failure case were you protecting against, and how would you validate that the design is secure?`;
  }

  if (containsAny(loweredKeyword, ["performance", "latency", "scalability", "cache", "caching", "redis"])) {
    return `You mentioned ${keyword}. What metric would show whether that choice worked, and what bottleneck would you investigate first?`;
  }

  if (containsAny(loweredKeyword, ["api", "rest", "graphql", "microservice", "microservices"])) {
    return `You mentioned ${keyword}. What contract or endpoint mattered most, and how would you handle errors or version changes?`;
  }

  if (isSqlNoSqlQuestion(currentQuestion)) {
    return "Good. Can you give one specific case where SQL is the better choice and one specific case where NoSQL is the better choice?";
  }

  if (containsAny(loweredKeyword, ["sql", "postgres", "mysql", "mongodb", "nosql", "database"])) {
    return `You mentioned ${keyword}. How did that affect your data model, and what consistency or performance tradeoff did you consider?`;
  }

  if (isConceptQuestion(currentQuestion)) {
    return `You mentioned ${keyword}. Can you give a practical example that shows how it works and one limitation to watch for?`;
  }

  if (isSystemDesignQuestion(currentQuestion)) {
    return `You mentioned ${keyword}. How would that shape your architecture, data flow, and failure handling?`;
  }

  if (isBehavioral || containsAny(loweredQuestion, ["time you", "describe", "tell me about"])) {
    return `You mentioned ${keyword}. What did you personally do there, and how did that affect the outcome?`;
  }

  if (containsAny(loweredQuestion, ["why", "choose", "decision", "tradeoff", "trade-off"])) {
    return `You mentioned ${keyword}. What made it the right choice compared with the main alternative?`;
  }

  return `You mentioned ${keyword}. What decision did that influence, and what evidence showed that your approach worked?`;
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
  const technicalQuestion = isTechnicalQuestion(currentQuestion, interviewType);
  const conceptQuestion = isConceptQuestion(currentQuestion);
  const answerKeywords = extractCandidateKeywords(answer);

  if (isSqlNoSqlQuestion(currentQuestion) && words >= 12) {
    return "Good. Can you give one specific case where SQL is the better choice and one specific case where NoSQL is the better choice?";
  }

  if (words < 12) {
    if (conceptQuestion) {
      return hasConceptContrast(answer)
        ? buildTechnicalFollowUp(answer, currentQuestion, answerKeywords)
        : "No problem. Try explaining the concept in simple terms, then give one practical use case.";
    }

    return technicalQuestion
      ? "Please expand your technical answer. Walk me through the main components, data flow, and the most important tradeoff."
      : "Please expand your answer a bit more. Walk me through your thinking, the steps you took, and what happened in the end.";
  }

  if (technicalQuestion) {
    if (conceptQuestion) {
      return buildTechnicalFollowUp(answer, currentQuestion, answerKeywords);
    }

    if (signals.hasTool && !signals.hasTradeoff) {
      return `You mentioned ${signals.mentionedTool}. Why was that the right choice here, and what alternative would you compare it against?`;
    }

    if (!signals.hasReasoning && words < 45) {
      return "Can you explain why you chose that design and what constraint mattered most: security, latency, reliability, cost, or usability?";
    }

    return buildTechnicalFollowUp(answer, currentQuestion, answerKeywords);
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

  if (answerKeywords.length) {
    return buildKeywordAwareFollowUp(answerKeywords[0], currentQuestion, interviewType);
  }

  if (!hasOutcome) {
    return "That gives me the context. What was the final outcome, and what evidence showed that your approach worked?";
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
  const signals = getAnswerSignals(answer);
  const conceptQuestion = isConceptQuestion(currentQuestion);
  const technicalQuestion = isTechnicalQuestion(currentQuestion, interviewType);
  const hasVisualMetrics = Boolean(visualMetrics && visualMetrics.sampleCount > 0);

  const relevance = clamp(
    conceptQuestion
      ? 3.2 +
          Math.min(words / 10, 3) +
          Math.min(sentenceCount, 3) * 0.5 +
          (signals.hasReasoning ? 1 : 0)
      : 4 +
          Math.min(words / 12, 2.3) +
          (hasExample ? 1.2 : 0) +
          (hasOutcome ? 1.3 : 0),
    1,
    10,
  );

  const keyword = clamp(
    conceptQuestion || technicalQuestion
      ? 3.4 +
          (signals.hasTool ? 1.8 : 0) +
          (signals.hasReasoning ? 1.1 : 0) +
          Math.min(sentenceCount, 3) * 0.6 +
          Math.min(words / 18, 1.6)
      : 4 +
          (hasExample ? 2 : 0) +
          (hasOutcome ? 2 : 0) +
          Math.min(sentenceCount, 3) * 0.6,
    1,
    10,
  );

  const semantic = clamp(
    conceptQuestion || technicalQuestion
      ? 3.5 +
          Math.min(words / 14, 3) +
          Math.min(sentenceCount, 3) * 0.7 +
          (signals.hasReasoning ? 1.1 : 0)
      : 4.5 +
          Math.min(words / 18, 2) +
          Math.min(sentenceCount, 3) * 0.7 +
          (currentQuestion ? 0.6 : 0),
    1,
    10,
  );

  const delivery = clamp(
    hasVisualMetrics && visualMetrics
      ? 3 +
          visualMetrics.averageEyeContactScore / 20 +
          visualMetrics.steadyRatio * 2
      : 6.2,
    1,
    10,
  );

  const visualPresence = clamp(
    hasVisualMetrics && visualMetrics
      ? 2 +
          visualMetrics.faceDetectedRatio * 3 +
          visualMetrics.centeredFaceRatio * 2.5 +
          visualMetrics.steadyRatio * 1.5 +
          (1 - visualMetrics.lookingAwayRatio) * 1
      : 6,
    1,
    10,
  );

  let totalScore = Math.round(
    ((relevance + keyword + semantic) / 3) * 8.5 +
      ((delivery + visualPresence) / 2) * 1.5,
  );

  if (words < 8) {
    totalScore = Math.min(totalScore, 35);
  } else if (words < 15) {
    totalScore = Math.min(totalScore, 50);
  }

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (conceptQuestion) {
    if (words >= 25 && signals.hasReasoning) {
      strengths.push("You explained the concept with enough detail to show understanding.");
    } else {
      improvements.push("Add a clearer definition and one practical example to show you understand the concept.");
    }
  } else if (hasExample) {
    strengths.push("You grounded your answer in a concrete example instead of staying too general.");
  } else {
    improvements.push("Anchor your answer in one specific situation and make your personal role clearer.");
  }

  if (hasOutcome) {
    strengths.push("You referenced the outcome or impact, which makes your answer more convincing.");
  } else if (!conceptQuestion) {
    improvements.push("Finish with a measurable result so the interviewer can judge the impact of your work.");
  }

  if (words >= 40 && sentenceCount >= 3) {
    strengths.push("Your answer had enough detail to show structure, context, and progression.");
  } else {
    improvements.push("Add a bit more structure: situation, action, and result in separate clear steps.");
  }

  if (hasVisualMetrics && visualMetrics) {
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
  }

  return {
    totalScore,
    relevance: Number(relevance.toFixed(1)),
    keyword: Number(keyword.toFixed(1)),
    semantic: Number(semantic.toFixed(1)),
    delivery: Number(delivery.toFixed(1)),
    visualPresence: hasVisualMetrics ? Number(visualPresence.toFixed(1)) : null,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    followUp: buildCoachingReply(answer, currentQuestion, interviewType),
    answerLength: words,
    includesExample: hasExample,
    includesOutcome: hasOutcome,
    visualMetrics: hasVisualMetrics ? visualMetrics : null,
  };
}

export function buildSessionInterviewFeedback(
  entries: InterviewFeedbackEntry[],
): InterviewSessionFeedback | null {
  if (!entries.length) {
    return null;
  }

  const sum = <K extends keyof LiveInterviewFeedback>(key: K) =>
    entries.reduce((total, entry) => total + (Number(entry.feedback[key]) || 0), 0);

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

  const visualEntries = entries
    .map((entry) => entry.feedback.visualMetrics)
    .filter(
      (metric): metric is VisualMetrics =>
        Boolean(metric && metric.sampleCount > 0),
    );

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

  const topItems = (items: Map<string, number>) =>
    [...items.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([text]) => text);

  const strengths = topItems(strengthsByCount);
  const rawImprovements = topItems(improvementsByCount);
  const filteredImprovements = rawImprovements.filter((item) => {
    const lowered = item.toLowerCase();

    if (includesExampleRate >= 0.5 && lowered.includes("example")) {
      return false;
    }

    if (
      includesOutcomeRate >= 0.5 &&
      (lowered.includes("measurable result") ||
        lowered.includes("outcome") ||
        lowered.includes("impact"))
    ) {
      return false;
    }

    if (
      averageAnswerLength >= 45 &&
      (lowered.includes("more structure") ||
        lowered.includes("situation, action, and result") ||
        lowered.includes("separate clear steps"))
    ) {
      return false;
    }

    if (
      strengths.some((strength) => strength.toLowerCase().includes("concept")) &&
      lowered.includes("clearer definition")
    ) {
      return false;
    }

    if (
      strengths.some((strength) => strength.toLowerCase().includes("concrete example")) &&
      lowered.includes("specific situation")
    ) {
      return false;
    }

    return true;
  });

  const improvements = filteredImprovements.length
    ? filteredImprovements
    : rawImprovements.filter(
        (item) =>
          !strengths.some((strength) => {
            const loweredStrength = strength.toLowerCase();
            const loweredItem = item.toLowerCase();
            return (
              (loweredStrength.includes("example") && loweredItem.includes("example")) ||
              (loweredStrength.includes("outcome") && loweredItem.includes("outcome")) ||
              (loweredStrength.includes("structure") && loweredItem.includes("structure"))
            );
          }),
      );

  return {
    totalScore: Math.round(sum("totalScore") / entries.length),
    relevance: average(sum("relevance")),
    keyword: average(sum("keyword")),
    semantic: average(sum("semantic")),
    delivery: average(sum("delivery")),
    visualPresence: averagedVisualMetrics ? average(sum("visualPresence")) : null,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
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
