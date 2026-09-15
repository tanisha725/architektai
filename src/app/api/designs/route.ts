import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const {
    description,
    analysisSource,
    scaleInputs,
    requirements,
    architecture,
    databaseSchema,
    apiEndpoints,
    roadmap,
  } = (body ?? {}) as Record<string, unknown>;

  if (typeof description !== "string" || description.trim().length < 10) {
    return NextResponse.json({ error: "`description` must be a non-empty string." }, { status: 400 });
  }

  try {
    const design = await prisma.design.create({
      data: {
        description,
        analysisSource: typeof analysisSource === "string" ? analysisSource : "rule-based",
        scaleInputs: scaleInputs as object,
        requirements: requirements as object,
        architecture: architecture as object,
        databaseSchema: databaseSchema as object,
        apiEndpoints: apiEndpoints as object,
        roadmap: roadmap as object,
      },
    });
    return NextResponse.json({ id: design.id });
  } catch (err) {
    console.error("Failed to save design:", err);
    return NextResponse.json({ error: "Failed to save design. Try again." }, { status: 500 });
  }
}
