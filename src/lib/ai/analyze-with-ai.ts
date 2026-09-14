import { GoogleGenAI, Type } from "@google/genai";
import { AnalyzedRequirementsSchema, type AnalyzedRequirements } from "@/lib/schemas/requirements-schema";

const SYSTEM_PROMPT = `You are a system design assistant that turns a product description into structured requirements.

Rules:
- "functional" requirements are concrete features/actions the system must support (e.g. "Users can upload photos"). Mark them "user-stated" if directly described, "assumed" only if you reasonably inferred a feature that wasn't explicit.
- "nonFunctional" requirements are quality attributes (availability, scalability, latency, security, durability). These are almost always "assumed" unless the user explicitly asked for one (e.g. "must be real-time").
- "assumptions" captures scale facts mentioned in the text (e.g. "10 million users" -> source "user-stated") plus any other reasonable inferred assumptions about usage patterns, marked "assumed".
- Be concise. Do not invent requirements unrelated to the description.
- Every item must be tagged with the correct "source" - this distinction is critical, never guess it loosely.`;

// Gemini's structured output uses a JSON-schema-like object with a `Type` enum,
// not a Zod schema directly - this mirrors AnalyzedRequirementsSchema by hand.
const requirementItemSchema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING },
    source: { type: Type.STRING, enum: ["user-stated", "assumed"] },
  },
  required: ["text", "source"],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    functional: { type: Type.ARRAY, items: requirementItemSchema },
    nonFunctional: { type: Type.ARRAY, items: requirementItemSchema },
    assumptions: { type: Type.ARRAY, items: requirementItemSchema },
  },
  required: ["functional", "nonFunctional", "assumptions"],
};

export async function analyzeWithAI(description: string): Promise<AnalyzedRequirements> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: description,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response.");
  }

  // Gemini's schema constrains the JSON shape, but we still validate with Zod -
  // the schema above can't express our exact source-field business rules the
  // way a hand-checked parse can, and it's cheap insurance against drift.
  return AnalyzedRequirementsSchema.parse(JSON.parse(response.text));
}
