import { spawn } from "node:child_process";

export const runtime = "nodejs";

type GenerateQuestionsInput = {
  cvText?: string;
  jobDescription?: string;
  interviewType?: string;
};

const PYTHON_COMMANDS =
  process.platform === "win32"
    ? [["py"], ["python"], ["python3"]]
    : [["python3"], ["python"], ["py"]];

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
