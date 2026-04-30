export const runtime = "nodejs";

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildCoachingReply,
  buildInterviewFeedback,
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
  "followUp": "one adaptive follow-up question"
}

Interview type: ${interviewType}
Question: ${currentQuestion}
Candidate answer: ${answer}

Scoring guidance:
- relevance: how directly the answer addresses the question.
- keyword: use of role-relevant concepts, skills, tools, and terminology.
- semantic: depth, reasoning, specificity, and interview quality.
- delivery: clarity and structure of the written/spoken answer only.
- strengths/improvements must be concrete and based on the answer.
- followUp must adapt to the candidate answer and should not repeat the original question.
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

  const followUp =
    normalizeText(parsed.followUp) ||
    buildCoachingReply(answer, currentQuestion, interviewType);

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
