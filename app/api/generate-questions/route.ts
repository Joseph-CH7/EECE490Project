import { spawn } from "node:child_process";

export const runtime = "nodejs";

type GenerateQuestionsInput = {
  cvText?: string;
  jobDescription?: string;
  interviewType?: string;
  categoryOverride?: string;
};

type QuestionDetail = {
  text?: string;
  [key: string]: unknown;
};

const PYTHON_COMMANDS =
  process.platform === "win32"
    ? [["py"], ["python"], ["python3"]]
    : [["python3"], ["python"], ["py"]];

function normalizeQuestionText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(can you|could you|please|explain|describe|tell me about|what is|what are|how would|how do)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getQuestionSignature(value: string) {
  const normalized = normalizeQuestionText(value);
  const words = normalized
    .split(" ")
    .filter((word) => word.length > 3)
    .filter(
      (word) =>
        ![
          "question",
          "interview",
          "candidate",
          "experience",
          "using",
          "with",
          "your",
          "would",
          "about",
        ].includes(word),
    );

  return words.slice(0, 8).sort().join(" ");
}

function dedupeQuestions(questions: QuestionDetail[]) {
  const seenText = new Set<string>();
  const seenSignatures = new Set<string>();
  const deduped: QuestionDetail[] = [];

  for (const question of questions) {
    const text = typeof question.text === "string" ? question.text.trim() : "";

    if (!text) {
      continue;
    }

    const normalized = normalizeQuestionText(text);
    const signature = getQuestionSignature(text);

    if (seenText.has(normalized) || (signature && seenSignatures.has(signature))) {
      continue;
    }

    seenText.add(normalized);
    if (signature) {
      seenSignatures.add(signature);
    }
    deduped.push({ ...question, text });
  }

  return deduped;
}

function runInterviewBundle(input: GenerateQuestionsInput) {
  const runWithCommand = (commandIndex: number): Promise<string> => {
    const [pythonCommand, ...pythonArgs] = PYTHON_COMMANDS[commandIndex];

    return new Promise<string>((resolve, reject) => {
      const child = spawn(
        pythonCommand,
        [...pythonArgs, "scripts/generate_interview_bundle.py"],
        {
          cwd: process.cwd(),
          stdio: ["pipe", "pipe", "pipe"],
        },
      );

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", (error) => {
        if (commandIndex < PYTHON_COMMANDS.length - 1) {
          runWithCommand(commandIndex + 1).then(resolve).catch(reject);
          return;
        }

        reject(error);
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout);
          return;
        }

        if (commandIndex < PYTHON_COMMANDS.length - 1) {
          runWithCommand(commandIndex + 1).then(resolve).catch(reject);
          return;
        }

        reject(new Error(stderr || `Python process exited with code ${code}`));
      });

      child.stdin.write(JSON.stringify(input));
      child.stdin.end();
    });
  };

  return runWithCommand(0);
}

export async function POST(req: Request) {
  try {
    const input = (await req.json()) as GenerateQuestionsInput;
    const raw = await runInterviewBundle(input);
    const data = JSON.parse(raw);
    const questionDetails = dedupeQuestions(
      Array.isArray(data.questions) ? data.questions : [],
    );

    return Response.json({
      ...data,
      questions: questionDetails.map((question: { text?: string }) => question.text ?? ""),
      questionCount: questionDetails.length,
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
