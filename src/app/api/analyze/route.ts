import { NextResponse } from "next/server";
import { analyzeRequirements } from "@/lib/requirement-analyzer";
import { analyzeWithAI } from "@/lib/ai/analyze-with-ai";
import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";

async function getRequirements(description: string): Promise<{
  requirements: AnalyzedRequirements;
  source: "ai" | "rule-based";
  fallbackReason?: "no-api-key" | "ai-unavailable";
}> {
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    return { requirements: analyzeRequirements(description), source: "rule-based", fallbackReason: "no-api-key" };
  }

  try {
    const requirements = await analyzeWithAI(description);
    return { requirements, source: "ai" };
  } catch (err) {
    console.error("AI analysis failed, falling back to rule-based analyzer:", err);
    return { requirements: analyzeRequirements(description), source: "rule-based", fallbackReason: "ai-unavailable" };
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const description = (body as { description?: unknown })?.description;

  if (typeof description !== "string" || description.trim().length < 10) {
    return NextResponse.json(
      { error: "`description` must be a string of at least 10 characters." },
      { status: 400 }
    );
  }

  const { requirements, source, fallbackReason } = await getRequirements(description);
  return NextResponse.json({ requirements, source, fallbackReason });
}
