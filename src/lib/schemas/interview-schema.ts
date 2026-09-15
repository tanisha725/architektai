import { z } from "zod";

export const InterviewQuestionsSchema = z.object({
  questions: z
    .array(z.string())
    .describe("System design interview questions, grounded in the specific design provided."),
});
export type InterviewQuestions = z.infer<typeof InterviewQuestionsSchema>;

export const InterviewEvaluationSchema = z.object({
  score: z.number().min(0).max(100).describe("Overall score out of 100."),
  correctness: z.string().describe("Is the technical claim in the answer actually accurate?"),
  depth: z.string().describe("Does the answer go beyond a surface-level statement?"),
  tradeoffAwareness: z.string().describe("Does the answer acknowledge what's given up, not just what's gained?"),
  communication: z.string().describe("Is the answer clear and well-structured?"),
  overallFeedback: z.string().describe("A concise summary of what to improve."),
});
export type InterviewEvaluation = z.infer<typeof InterviewEvaluationSchema>;
