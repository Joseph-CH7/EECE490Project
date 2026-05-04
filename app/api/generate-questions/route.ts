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

const CONCEPT_GROUPS: Record<string, string> = {
  array: "data_structure",
  "linked list": "data_structure",
  dictionary: "data_structure",
  hashmap: "data_structure",
  queue: "data_structure",
  stack: "data_structure",
  inheritance: "oop",
  encapsulation: "oop",
  polymorphism: "oop",
  interface: "oop",
  class: "oop",
  object: "oop",
  deadlock: "concurrency",
  multithreading: "concurrency",
  thread: "concurrency",
  "race condition": "concurrency",
  "sql injection": "security",
  xss: "security",
  authentication: "security",
  authorization: "security",
  "merge sort": "algorithm",
  "quick sort": "algorithm",
  "binary search": "algorithm",
  "big o notation": "algorithm",
  recursion: "algorithm",
  pointers: "memory",
  pointer: "memory",
  "virtual memory": "memory",
  "heap memory": "memory",
  "stack memory": "memory",
};

const ALLOWED_CROSS_GROUP_PAIRS = new Set([
  "nosql|sql",
  "http|https",
  "git|svn",
  "black-box testing|white-box testing",
  "java|javascript",
  "heap memory|stack memory",
]);

const FALLBACK_SOFTWARE_QUESTIONS: QuestionDetail[] = [
  {
    text: "What is a RESTful API, and how would you design one for a simple user-management feature?",
    type: "technical",
    difficulty: "medium",
    jobCategory: "software_engineering",
  },
  {
    text: "Explain the difference between SQL and NoSQL databases, and give one case where each is a better choice.",
    type: "technical",
    difficulty: "medium",
    jobCategory: "software_engineering",
  },
  {
    text: "How would you debug a frontend page that is not showing updated data after an API request?",
    type: "technical",
    difficulty: "medium",
    jobCategory: "software_engineering",
  },
  {
    text: "Tell me about a time when you had to make a technical decision with incomplete information.",
    type: "behavioral",
    difficulty: "medium",
    jobCategory: "software_engineering",
  },
  {
    text: "Describe a situation where you took ownership of a problem outside your formal responsibilities.",
    type: "behavioral",
    difficulty: "medium",
    jobCategory: "software_engineering",
  },
];

const BAD_QUESTION_PATTERNS = [
  "mtcars",
  "simple line ar regression",
  "dependent variable",
  "independent variable",
];

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

function hasWholeConcept(text: string, concept: string) {
  return new RegExp(`(^|[^a-z0-9])${concept.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(text);
}

function isBadComparisonQuestion(text: string) {
  const lowered = text.toLowerCase();
  const isComparison =
    lowered.includes("difference between") ||
    /\bwhen would you use\b.+\bover\b/i.test(lowered);

  if (!isComparison) {
    return false;
  }

  const concepts = Object.keys(CONCEPT_GROUPS).filter((concept) =>
    hasWholeConcept(lowered, concept),
  );

  if (concepts.length < 2) {
    return false;
  }

  for (let firstIndex = 0; firstIndex < concepts.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < concepts.length; secondIndex += 1) {
      const first = concepts[firstIndex];
      const second = concepts[secondIndex];
      const pairKey = [first, second].sort().join("|");

      if (ALLOWED_CROSS_GROUP_PAIRS.has(pairKey)) {
        return false;
      }

      if (CONCEPT_GROUPS[first] !== CONCEPT_GROUPS[second]) {
        return true;
      }
    }
  }

  return false;
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

    const source = typeof question.source === "string" ? question.source.toLowerCase() : "";
    const syntheticComparison =
      source === "full_interview_questions_dataset" &&
      (/difference between/i.test(text) || /\bwhen would you use\b.+\bover\b/i.test(text));

    const hasBadPattern = BAD_QUESTION_PATTERNS.some((pattern) =>
      text.toLowerCase().includes(pattern),
    );

    if (hasBadPattern || syntheticComparison || isBadComparisonQuestion(text)) {
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

  for (const fallback of FALLBACK_SOFTWARE_QUESTIONS) {
    if (deduped.length >= 4) {
      break;
    }

    const fallbackText = fallback.text || "";
    const normalized = normalizeQuestionText(fallbackText);
    const signature = getQuestionSignature(fallbackText);

    if (!seenText.has(normalized) && !seenSignatures.has(signature)) {
      seenText.add(normalized);
      seenSignatures.add(signature);
      deduped.push(fallback);
    }
  }

  return deduped.slice(0, 4);
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
