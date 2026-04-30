import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { spawn } from "node:child_process";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const PYTHON_COMMANDS =
  process.platform === "win32"
    ? [["py"], ["python"], ["python3"]]
    : [["python3"], ["python"], ["py"]];

function normalizeExtractedText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function inferResumeCategory(text: string) {
  const runWithCommand = (commandIndex: number): Promise<Record<string, string>> => {
    const [pythonCommand, ...pythonArgs] = PYTHON_COMMANDS[commandIndex];

    return new Promise((resolve, reject) => {
      const child = spawn(
        pythonCommand,
        [...pythonArgs, "scripts/infer_resume_category.py"],
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
          resolve(JSON.parse(stdout) as Record<string, string>);
          return;
        }

        if (commandIndex < PYTHON_COMMANDS.length - 1) {
          runWithCommand(commandIndex + 1).then(resolve).catch(reject);
          return;
        }

        reject(new Error(stderr || `Python process exited with code ${code}`));
      });

      child.stdin.write(JSON.stringify({ text }));
      child.stdin.end();
    });
  };

  return runWithCommand(0);
}

function extractPdfTextWithPython(pdfBuffer: Buffer) {
  const runWithCommand = (
    commandIndex: number,
  ): Promise<{ text: string; pageCount: number }> => {
    const [pythonCommand, ...pythonArgs] = PYTHON_COMMANDS[commandIndex];

    return new Promise((resolve, reject) => {
      const child = spawn(
        pythonCommand,
        [...pythonArgs, "scripts/extract_pdf_text.py"],
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
          resolve(JSON.parse(stdout) as { text: string; pageCount: number });
          return;
        }

        if (commandIndex < PYTHON_COMMANDS.length - 1) {
          runWithCommand(commandIndex + 1).then(resolve).catch(reject);
          return;
        }

        reject(new Error(stderr || `Python process exited with code ${code}`));
      });

      child.stdin.write(
        JSON.stringify({
          data: pdfBuffer.toString("base64"),
        }),
      );
      child.stdin.end();
    });
  };

  return runWithCommand(0);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Missing PDF file." }, { status: 400 });
    }

    if (file.type && file.type !== "application/pdf") {
      return Response.json({ error: "Please upload a PDF file." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        { error: "PDF is too large. Please upload a file under 8 MB." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    let extracted: { text: string; pageCount: number };

    try {
      const result = await pdfParse(pdfBuffer);
      extracted = {
        text: result.text || "",
        pageCount: result.numpages,
      };
    } catch (error) {
      console.error("Node PDF parser failed, trying Python fallback:", error);
      extracted = await extractPdfTextWithPython(pdfBuffer);
    }

    const text = normalizeExtractedText(extracted.text || "");

    if (!text) {
      return Response.json(
        { error: "No readable text was found in this PDF." },
        { status: 422 },
      );
    }

    const category = await inferResumeCategory(text);

    return Response.json({
      fileName: file.name,
      text,
      ...category,
      pageCount: extracted.pageCount,
      characterCount: text.length,
    });
  } catch (error) {
    console.error("CV extraction route error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to extract CV text.",
      },
      { status: 500 },
    );
  }
}
