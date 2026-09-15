import { NextResponse } from "next/server";
import { planArchitecture } from "@/lib/architecture-planner";
import { generateArchitectureWithAI, toArchitecture } from "@/lib/ai/generate-architecture";
import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { Architecture } from "@/types/architecture";
import type { ScaleEstimates } from "@/types/scale";

async function getArchitecture(
  description: string,
  requirements: AnalyzedRequirements,
  scale: ScaleEstimates
): Promise<{ architecture: Architecture; source: "ai" | "rule-based" }> {
  if (!process.env.GEMINI_API_KEY) {
    return { architecture: planArchitecture(requirements, scale), source: "rule-based" };
  }

  try {
    const aiArchitecture = await generateArchitectureWithAI(description, requirements, scale);
    return { architecture: toArchitecture(aiArchitecture), source: "ai" };
  } catch (err) {
    console.error("AI architecture generation failed, falling back to rule-based planner:", err);
    return { architecture: planArchitecture(requirements, scale), source: "rule-based" };
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { description, requirements, scale } = (body ?? {}) as Record<string, unknown>;

  if (typeof description !== "string" || !requirements || !scale) {
    return NextResponse.json(
      { error: "`description`, `requirements`, and `scale` are required." },
      { status: 400 }
    );
  }

  const { architecture, source } = await getArchitecture(
    description,
    requirements as AnalyzedRequirements,
    scale as ScaleEstimates
  );
  return NextResponse.json({ architecture, source });
}
