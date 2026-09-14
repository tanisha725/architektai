import { z } from "zod";

const RequirementItemSchema = z.object({
  text: z.string().describe("A single, concise requirement statement."),
  source: z
    .enum(["user-stated", "assumed"])
    .describe(
      "'user-stated' if this was explicitly said in the description, 'assumed' if you inferred it."
    ),
});

export const AnalyzedRequirementsSchema = z.object({
  functional: z
    .array(RequirementItemSchema)
    .describe("Concrete features/actions the system must support."),
  nonFunctional: z
    .array(RequirementItemSchema)
    .describe("Quality attributes: availability, scalability, latency, security, etc."),
  assumptions: z
    .array(RequirementItemSchema)
    .describe("Scale facts from the text, plus reasonable inferred assumptions."),
});

// Single source of truth: the TypeScript type is derived from the schema,
// not maintained separately (replaces the old src/types/requirements.ts).
export type AnalyzedRequirements = z.infer<typeof AnalyzedRequirementsSchema>;
export type RequirementItem = z.infer<typeof RequirementItemSchema>;
