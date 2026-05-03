import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

    const response = await fetch(`${mlServiceUrl.replace(/\/$/, "")}/evaluate-challenge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: body.question,
        expected_answer: body.expected_answer,
        user_answer: body.user_answer,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "ML service failed." },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Could not connect to ML service." },
      { status: 500 }
    );
  }
}
