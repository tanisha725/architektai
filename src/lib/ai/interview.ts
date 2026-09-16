import { GoogleGenAI, Type } from "@google/genai";
import {
  InterviewQuestionsSchema,
  InterviewEvaluationSchema,
  type InterviewQuestions,
  type InterviewEvaluation,
} from "@/lib/schemas/interview-schema";

// Same bounded timeout/retry lesson from the requirement analyzer - a slow or
// failing AI call should fail fast, not leave the user waiting on 5 retries.
// Bumped from 10s to 15s since designSummary can now include bottlenecks/
// failure scenarios/10x-scale text (Phase C/D), making the input larger even
// though the output (5 short questions, or one evaluation) stays small - the
// same "revisit timeouts when a call's scope grows" lesson from Phase F.
const HTTP_OPTIONS = { timeout: 15_000, retryOptions: { attempts: 2 } };

function client() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export async function generateInterviewQuestions(designSummary: string): Promise<InterviewQuestions> {
  const response = await client().models.generateContent({
    model: "gemini-3.6-flash",
    contents: `Here is a system design a candidate just produced:\n\n${designSummary}\n\nGenerate 5 system design interview questions that probe this specific design's decisions (not generic trivia). Cover: a "why did you choose X over Y" question, a scaling question tied to their actual numbers, a failure scenario question, and a trade-off question. If the design summary includes "Known bottlenecks," "Known failure scenarios," or a "10x scale" analysis, base at least two questions directly on those specific facts (e.g. ask about the exact bottleneck named, not a generic one) rather than inventing unrelated ones - this keeps the interview consistent with what the app already told the candidate on the Analysis tab.`,
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
    contents: `Design context:\n${designSummary}\n\nInterview question: ${question}\n\nCandidate's answer: ${answer}\n\nEvaluate this answer as a system design interviewer would. Be specific about what's missing, not just what's right. If the design context lists a "Known bottleneck," "Known failure scenario," or "10x scale" fact directly relevant to this question, check whether the candidate's answer aligns with or contradicts it, and say so explicitly in the feedback. Score out of 100.`,
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
