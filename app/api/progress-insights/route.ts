import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch("http://127.0.0.1:8000/predict-progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        interviews: body.interviews || [],
        challenges: body.challenges || [],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Progress ML service failed." },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Could not connect to progress ML service." },
      { status: 500 }
    );
  }
}
