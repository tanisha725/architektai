import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AnalyzedRequirementsSchema, type AnalyzedRequirements } from "@/lib/schemas/requirements-schema";

const SYSTEM_PROMPT = `You are a system design assistant that turns a product description into structured requirements.

Rules:
- "functional" requirements are concrete features/actions the system must support (e.g. "Users can upload photos"). Mark them "user-stated" if directly described, "assumed" only if you reasonably inferred a feature that wasn't explicit.
- "nonFunctional" requirements are quality attributes (availability, scalability, latency, security, durability). These are almost always "assumed" unless the user explicitly asked for one (e.g. "must be real-time").
- "assumptions" captures scale facts mentioned in the text (e.g. "10 million users" -> source "user-stated") plus any other reasonable inferred assumptions about usage patterns, marked "assumed".
- Be concise. Do not invent requirements unrelated to the description.
- Every item must be tagged with the correct "source" - this distinction is critical, never guess it loosely.`;

export async function analyzeWithAI(description: string): Promise<AnalyzedRequirements> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: description }],
    output_config: {
      format: zodOutputFormat(AnalyzedRequirementsSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("AI response did not match the expected schema.");
  }

  return response.parsed_output;
}
