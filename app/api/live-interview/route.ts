export const runtime = "nodejs";

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildCoachingReply,
  buildInterviewFeedback,
  extractCandidateKeywords,
  extractQuestionFocusConcept,
  type LiveInterviewFeedback,
  type VisualMetrics,
} from "@/lib/interview-feedback";

type Message = {
  role: "interviewer" | "candidate";
  text: string;
};

type LiveInterviewRequest = {
  conversation?: Message[];
  currentQuestion?: string;
  interviewType?: string;
  visualMetrics?: VisualMetrics | null;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function extractJsonObject(text: string) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini did not return a JSON object.");
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

function scoreFromModel(value: unknown, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Number(clamp(value, 1, 10).toFixed(1));
}

function listFromModel(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .slice(0, 4);

  return items.length ? items : fallback;
}

function followUpUsesAnswerKeyword(followUp: string, keywords: string[]) {
  const lowered = followUp.toLowerCase();

  return keywords.some((keyword) => lowered.includes(keyword.toLowerCase()));
}

function looksGenericFollowUp(followUp: string) {
  const lowered = followUp.toLowerCase();

  return [
    "tell me more",
    "can you elaborate",
    "can you explain more",
    "what was the outcome",
    "how did you measure",
    "what did you learn",
  ].some((phrase) => lowered.includes(phrase));
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter(
      (word) =>
        ![
          "about",
          "answer",
          "could",
          "explain",
          "follow",
          "interview",
          "more",
          "question",
          "that",
          "this",
          "what",
          "when",
          "where",
          "which",
          "with",
          "would",
          "your",
        ].includes(word),
    );
}

function similarityScore(first: string, second: string) {
  const firstTokens = new Set(tokenize(first));
  const secondTokens = new Set(tokenize(second));

  if (!firstTokens.size || !secondTokens.size) {
    return 0;
  }

  const overlap = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  const union = new Set([...firstTokens, ...secondTokens]).size;

  return overlap / union;
}

function isValidModelFollowUp(
  followUp: string,
  focusKeyword: string,
  currentQuestion: string,
  groundedKeywords: string[],
) {
  if (!followUp || looksGenericFollowUp(followUp)) {
    return false;
  }

  if (similarityScore(followUp, currentQuestion) > 0.72) {
    return false;
  }

  if (!groundedKeywords.length) {
    return true;
  }

  const normalizedFocusKeyword = focusKeyword.toLowerCase();
  const focusKeywordIsGrounded = groundedKeywords.some(
    (keyword) => keyword.toLowerCase() === normalizedFocusKeyword,
  );

  return (
    (focusKeywordIsGrounded && followUp.toLowerCase().includes(normalizedFocusKeyword)) ||
    followUpUsesAnswerKeyword(followUp, groundedKeywords)
  );
}

async function buildGeminiFeedback(
  answer: string,
  currentQuestion: string,
  interviewType: string,
  visualMetrics: VisualMetrics | null,
): Promise<{ reply: string; feedback: LiveInterviewFeedback } | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const baselineFeedback = buildInterviewFeedback(
    answer,
    currentQuestion,
    interviewType,
    visualMetrics,
  );

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const answerKeywords = extractCandidateKeywords(answer);
  const questionFocusConcept = extractQuestionFocusConcept(currentQuestion);
  const groundedKeywords = [
    ...(questionFocusConcept ? [questionFocusConcept] : []),
    ...answerKeywords.filter((keyword) => keyword !== questionFocusConcept),
  ];
  const keywordHint = groundedKeywords.length ? groundedKeywords.join(", ") : "none";

  const prompt = `
You are an interview coach evaluating one candidate answer.

Return only valid JSON with this exact shape:
{
  "relevance": number from 1 to 10,
  "keyword": number from 1 to 10,
  "semantic": number from 1 to 10,
  "delivery": number from 1 to 10,
  "strengths": ["short specific strength", "short specific strength"],
  "improvements": ["short specific improvement", "short specific improvement"],
  "focusKeyword": "one exact keyword or short phrase from the candidate answer or the original concept being tested",
  "missingDimension": "example | tradeoff | reasoning | metric | ownership | failure_handling | technical_depth | limitation",
  "followUp": "one adaptive follow-up question"
}

Interview type: ${interviewType}
Question: ${currentQuestion}
Candidate answer: ${answer}
Ranked candidate answer keywords, from most important to least important: ${keywordHint}

Scoring guidance:
- relevance: how directly the answer addresses the question.
- keyword: use of role-relevant concepts, skills, tools, and terminology.
- semantic: depth, reasoning, specificity, and interview quality.
- delivery: clarity and structure of the written/spoken answer only.
- strengths/improvements must be concrete and based on the answer.
- followUp must adapt to the candidate answer and should not repeat the original question.
- followUp must explicitly build on one of the ranked candidate answer keywords when any are listed.
- Prefer the highest ranked keyword that is relevant to the original question.
- Name that keyword or concept naturally in the follow-up question, then ask for deeper reasoning, a tradeoff, an example, a limitation, validation, or ownership.
- For definition or concept questions, focus on the concept being tested in the original question, not broad category words such as "database", "code", "software", or "project".
- focusKeyword must be copied from the candidate answer or the original question, not invented.
- missingDimension should identify the single most useful thing the candidate has not explained yet.
- followUp should combine focusKeyword + missingDimension into one sharp interview question.
- Do not use generic follow-ups such as "tell me more", "can you elaborate", "what was the outcome", or "how did you measure impact" unless that directly fits the question and answer.
- If the original question is technical, system design, architecture, security, implementation, or debugging, the followUp must stay technical.
- For hypothetical design questions, do not ask about "final outcome" or "measuring impact" as if the candidate already built it. Ask about architecture, data flow, security, scalability, failure handling, tradeoffs, or testing instead.
- For concept questions such as "what is", "define", "difference between", "explain the concept", "explain the use", or programming keyword questions, do not ask about outcomes or design constraints. Ask for a clearer explanation, practical example, use case, limitation, or common misconception.
`.trim();

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const parsed = extractJsonObject(responseText);

  const relevance = scoreFromModel(parsed.relevance, baselineFeedback.relevance);
  const keyword = scoreFromModel(parsed.keyword, baselineFeedback.keyword);
  const semantic = scoreFromModel(parsed.semantic, baselineFeedback.semantic);
  const delivery = scoreFromModel(parsed.delivery, baselineFeedback.delivery);
  const visualPresence = baselineFeedback.visualPresence;

  const totalScore = Math.round(
    ((relevance + keyword + semantic) / 3) * 7 +
      ((delivery + visualPresence) / 2) * 3,
  );

  const localFollowUp = buildCoachingReply(answer, currentQuestion, interviewType);
  const modelFollowUp = normalizeText(parsed.followUp);
  const focusKeyword = normalizeText(parsed.focusKeyword);
  const followUp =
    isValidModelFollowUp(modelFollowUp, focusKeyword, currentQuestion, groundedKeywords)
      ? modelFollowUp
      : localFollowUp;

  const feedback: LiveInterviewFeedback = {
    ...baselineFeedback,
    totalScore,
    relevance,
    keyword,
    semantic,
    delivery,
    strengths: listFromModel(parsed.strengths, baselineFeedback.strengths),
    improvements: listFromModel(parsed.improvements, baselineFeedback.improvements),
    followUp,
  };

  return {
    reply: followUp,
    feedback,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LiveInterviewRequest;
    const conversation = Array.isArray(body.conversation) ? body.conversation : [];
    const currentQuestion = normalizeText(body.currentQuestion);
    const interviewType = normalizeText(body.interviewType) || "Mixed";
    const visualMetrics = body.visualMetrics ?? null;

    const latestCandidateAnswer = [...conversation]
      .reverse()
      .find((message) => message.role === "candidate");

    const answer = normalizeText(latestCandidateAnswer?.text);

    if (!answer) {
      return Response.json(
        { error: "Missing candidate answer." },
        { status: 400 },
      );
    }

    let aiFeedback: { reply: string; feedback: LiveInterviewFeedback } | null = null;

    try {
      aiFeedback = await buildGeminiFeedback(
        answer,
        currentQuestion,
        interviewType,
        visualMetrics,
      );
    } catch (error) {
      console.error("Gemini feedback failed, using local fallback:", error);
    }

    const feedback =
      aiFeedback?.feedback ||
      buildInterviewFeedback(
        answer,
        currentQuestion,
        interviewType,
        visualMetrics,
      );

    const reply =
      aiFeedback?.reply ||
      buildCoachingReply(answer, currentQuestion, interviewType);

    return Response.json({
      reply,
      feedback,
    });
  } catch (error) {
    console.error("Live interview route error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process live interview step",
      },
      { status: 500 },
    );
  }
}
