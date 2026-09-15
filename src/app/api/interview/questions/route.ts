import { NextResponse } from "next/server";
import { generateInterviewQuestions } from "@/lib/ai/interview";

const FALLBACK_QUESTIONS = [
  "Why did you choose your primary database over the alternatives listed?",
  "How would you handle 10x the current traffic?",
  "What happens if your caching layer goes down?",
  "Where is the bottleneck in this architecture?",
  "What would you change if the user base grew 10x?",
];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const designSummary = (body as { designSummary?: unknown })?.designSummary;
  if (typeof designSummary !== "string" || designSummary.trim().length < 10) {
    return NextResponse.json({ error: "`designSummary` must be a non-empty string." }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ questions: FALLBACK_QUESTIONS, source: "fallback" });
  }

  try {
    const result = await generateInterviewQuestions(designSummary);
    return NextResponse.json({ questions: result.questions, source: "ai" });
  } catch (err) {
    console.error("Interview question generation failed, using fallback questions:", err);
    return NextResponse.json({ questions: FALLBACK_QUESTIONS, source: "fallback" });
  }
}
