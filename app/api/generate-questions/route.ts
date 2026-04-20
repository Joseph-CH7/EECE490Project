import { spawn } from "node:child_process";

export const runtime = "nodejs";

type GenerateQuestionsInput = {
  cvText?: string;
  jobDescription?: string;
  interviewType?: string;
};

function runInterviewBundle(input: GenerateQuestionsInput) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn("py", ["scripts/generate_interview_bundle.py"], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr || `Python process exited with code ${code}`));
    });

    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}

export async function POST(req: Request) {
  try {
    const input = (await req.json()) as GenerateQuestionsInput;
    const raw = await runInterviewBundle(input);
    const data = JSON.parse(raw);
    const questionDetails = Array.isArray(data.questions) ? data.questions : [];

    return Response.json({
      ...data,
      questions: questionDetails.map((question: { text?: string }) => question.text ?? ""),
      questionDetails,
    });
  } catch (error) {
    console.error("Generate questions route error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate questions",
      },
      { status: 500 }
    );
  }
}
