import { GoogleGenAI, Type } from "@google/genai";
import {
  InterviewQuestionsSchema,
  InterviewEvaluationSchema,
  type InterviewQuestions,
  type InterviewEvaluation,
} from "@/lib/schemas/interview-schema";

// Same bounded timeout/retry lesson from the requirement analyzer - a slow or
// failing AI call should fail fast, not leave the user waiting on 5 retries.
const HTTP_OPTIONS = { timeout: 10_000, retryOptions: { attempts: 2 } };

function client() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export async function generateInterviewQuestions(designSummary: string): Promise<InterviewQuestions> {
  const response = await client().models.generateContent({
    model: "gemini-3.6-flash",
    contents: `Here is a system design a candidate just produced:\n\n${designSummary}\n\nGenerate 5 system design interview questions that probe this specific design's decisions (not generic trivia). Cover: a "why did you choose X over Y" question, a scaling question tied to their actual numbers, a failure scenario question, and a trade-off question.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["questions"],
      },
      httpOptions: HTTP_OPTIONS,
    },
  });

  if (!response.text) throw new Error("Gemini returned an empty response.");
  return InterviewQuestionsSchema.parse(JSON.parse(response.text));
}

export async function evaluateInterviewAnswer(
  designSummary: string,
  question: string,
  answer: string
): Promise<InterviewEvaluation> {
  const response = await client().models.generateContent({
    model: "gemini-3.6-flash",
    contents: `Design context:\n${designSummary}\n\nInterview question: ${question}\n\nCandidate's answer: ${answer}\n\nEvaluate this answer as a system design interviewer would. Be specific about what's missing, not just what's right. Score out of 100.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          correctness: { type: Type.STRING },
          depth: { type: Type.STRING },
          tradeoffAwareness: { type: Type.STRING },
          communication: { type: Type.STRING },
          overallFeedback: { type: Type.STRING },
        },
        required: ["score", "correctness", "depth", "tradeoffAwareness", "communication", "overallFeedback"],
      },
      httpOptions: HTTP_OPTIONS,
    },
  });

  if (!response.text) throw new Error("Gemini returned an empty response.");
  return InterviewEvaluationSchema.parse(JSON.parse(response.text));
}
