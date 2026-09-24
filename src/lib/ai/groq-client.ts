import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";

// Groq hosts open models behind an OpenAI-compatible API with a genuinely
// free tier (no billing required, unlike OpenAI's own API) - reusing the
// `openai` SDK pointed at Groq's base URL avoids a second SDK dependency.
// gpt-oss-120b is one of Groq's models with strict structured-output support
// (constrained decoding guarantees schema-matching JSON), matching the
// reliability of Gemini's responseSchema and OpenAI's zodResponseFormat.
const MODEL = "openai/gpt-oss-120b";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export function hasGroqKey(): boolean {
  return !!process.env.GROQ_API_KEY;
}

export async function generateJsonWithGroq<T>(
  schema: ZodType<T>,
  schemaName: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs = 20_000
): Promise<T> {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: GROQ_BASE_URL,
    timeout: timeoutMs,
    maxRetries: 1,
  });

  const completion = await client.chat.completions.parse({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: zodResponseFormat(schema, schemaName),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("Groq returned no parsed content.");
  return parsed;
}
