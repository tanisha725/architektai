import { NextResponse } from "next/server";
import { evaluateInterviewAnswer } from "@/lib/ai/interview";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { designSummary, question, answer } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof designSummary !== "string" ||
    typeof question !== "string" ||
    typeof answer !== "string" ||
    answer.trim().length < 5
  ) {
    return NextResponse.json(
      { error: "`designSummary`, `question`, and a non-trivial `answer` are required." },
      { status: 400 }
    );
  }

  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return NextResponse.json({
      evaluation: null,
      error: "AI evaluation is unavailable (no API key configured). Self-assess: does your answer address correctness, trade-offs, and how this scales?",
    });
  }

  try {
    const evaluation = await evaluateInterviewAnswer(designSummary, question, answer);
    return NextResponse.json({ evaluation });
  } catch (err) {
    console.error("Interview answer evaluation failed:", err);
    return NextResponse.json({
      evaluation: null,
      error: "AI evaluation failed for this answer. Try again, or self-assess: does your answer address correctness, trade-offs, and how this scales?",
    });
  }
}
