import { NextResponse } from "next/server";
import { planArchitecture } from "@/lib/architecture-planner";
import { generateArchitectureWithAI, toArchitecture } from "@/lib/ai/generate-architecture";
import { generateDatabaseSchemaFromEntities, generateApiEndpointsFromEntities } from "@/lib/domain-schema-generator";
import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { Architecture } from "@/types/architecture";
import type { ScaleEstimates } from "@/types/scale";
import type { DatabaseSchema } from "@/types/database";
import type { ApiEndpoint } from "@/types/api";

interface ArchitectureResult {
  architecture: Architecture;
  source: "ai" | "rule-based";
  provider?: "gemini" | "groq";
  // Only present when source is "ai" - derived from the AI's domain entities.
  // When null, the caller should fall back to the requirement-text-based
  // rule-based schema/API generators instead.
  databaseSchema: DatabaseSchema | null;
  apiEndpoints: ApiEndpoint[] | null;
}

async function getArchitecture(
  description: string,
  requirements: AnalyzedRequirements,
  scale: ScaleEstimates
): Promise<ArchitectureResult> {
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return {
      architecture: planArchitecture(requirements, scale),
      source: "rule-based",
      databaseSchema: null,
      apiEndpoints: null,
    };
  }

  try {
    const { architecture: aiArchitecture, provider } = await generateArchitectureWithAI(description, requirements, scale);
    return {
      architecture: toArchitecture(aiArchitecture),
      source: "ai",
      provider,
      databaseSchema: generateDatabaseSchemaFromEntities(aiArchitecture.entities),
      apiEndpoints: generateApiEndpointsFromEntities(aiArchitecture.entities),
    };
  } catch (err) {
    console.error("AI architecture generation failed, falling back to rule-based planner:", err);
    return {
      architecture: planArchitecture(requirements, scale),
      source: "rule-based",
      databaseSchema: null,
      apiEndpoints: null,
    };
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

  const result = await getArchitecture(description, requirements as AnalyzedRequirements, scale as ScaleEstimates);
  return NextResponse.json(result);
}
