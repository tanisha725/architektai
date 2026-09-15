import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { Architecture } from "@/types/architecture";
import type { DatabaseSchema } from "@/types/database";
import type { ScaleEstimates } from "@/types/scale";

// A compact plain-text description of the specific design that was generated -
// this is what grounds interview questions/evaluations in the user's actual
// design instead of generic system-design trivia.
export function buildDesignSummary(
  requirements: AnalyzedRequirements,
  architecture: Architecture,
  databaseSchema: DatabaseSchema,
  scale: ScaleEstimates
): string {
  const functional = requirements.functional.map((r) => r.text).join("; ");
  const components = architecture.components.map((c) => c.name).join(", ");
  const tables = databaseSchema.tables.map((t) => t.name).join(", ");

  return [
    `Functional requirements: ${functional}`,
    `Scale: ${scale.dau.toLocaleString()} daily active users, ~${Math.round(scale.peakQps).toLocaleString()} peak requests/sec.`,
    `Architecture components: ${components}`,
    `Database tables: ${tables}`,
  ].join("\n");
}
