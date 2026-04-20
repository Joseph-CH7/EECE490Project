export const runtime = "nodejs";

type Message = {
  role: "interviewer" | "candidate";
  text: string;
};

type LiveInterviewRequest = {
  conversation?: Message[];
  currentQuestion?: string;
  interviewType?: string;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

function buildCoachingReply(answer: string, currentQuestion: string, interviewType: string) {
  const sentences = splitSentences(answer);
  const words = wordCount(answer);
  const hasExample = mentionsExample(answer);
  const hasOutcome = mentionsOutcome(answer) || countDigits(answer) > 0;
  const isBehavioral = interviewType.toLowerCase() === "behavioral";

  if (words < 12) {
    return "Please expand your answer a bit more. Walk me through your thinking, the steps you took, and what happened in the end.";
  }

  if (!hasExample) {
    return isBehavioral
      ? "Can you ground that in one specific situation and explain what you personally did?"
      : "Can you give one concrete example from your own work and explain the exact steps you took?";
  }

  if (!hasOutcome) {
    return "That gives me the context. What was the final outcome, and how did you measure whether your approach worked?";
  }

  if (sentences.length < 2) {
    return "Good start. Can you structure that in a clearer sequence: the problem, your action, and the result?";
  }

  const loweredQuestion = currentQuestion.toLowerCase();

  if (loweredQuestion.includes("how") || loweredQuestion.includes("design")) {
    return "Thanks. What tradeoff did you consider, and why did you choose that approach over the main alternative?";
  }

  if (loweredQuestion.includes("time you") || loweredQuestion.includes("describe")) {
    return "Thanks. If you faced the same situation again, what would you keep the same and what would you change?";
  }

  return "Thank you. That was clear. Before we move on, what is the most important lesson or principle you would take from that example?";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LiveInterviewRequest;
    const conversation = Array.isArray(body.conversation) ? body.conversation : [];
    const currentQuestion = normalizeText(body.currentQuestion);
    const interviewType = normalizeText(body.interviewType) || "Mixed";

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

    return Response.json({
      reply,
      feedback: {
        answerLength: wordCount(answer),
        includesExample: mentionsExample(answer),
        includesOutcome: mentionsOutcome(answer) || countDigits(answer) > 0,
      },
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
