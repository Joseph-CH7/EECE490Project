export const runtime = "nodejs";

import {
  buildCoachingReply,
  buildInterviewFeedback,
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

    const reply = buildCoachingReply(answer, currentQuestion, interviewType);
    const feedback = buildInterviewFeedback(
      answer,
      currentQuestion,
      interviewType,
      visualMetrics,
    );

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
