import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";

// gpt-5-mini: cheap and fast enough to act as a same-latency-budget fallback
// when Gemini is unavailable (quota, rate limit, transient upstream error),
// while still supporting strict structured outputs via zodResponseFormat.
const MODEL = "gpt-5-mini";

export function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function generateJsonWithOpenAI<T>(
  schema: ZodType<T>,
  schemaName: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs = 20_000
): Promise<T> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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
  if (!parsed) throw new Error("OpenAI returned no parsed content.");
  return parsed;
}
