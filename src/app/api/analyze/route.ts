import { NextResponse } from "next/server";
import { analyzeRequirements } from "@/lib/requirement-analyzer";

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

  const requirements = analyzeRequirements(description);
  return NextResponse.json({ requirements });
}
