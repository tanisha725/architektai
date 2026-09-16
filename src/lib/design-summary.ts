import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { Architecture } from "@/types/architecture";
import type { DatabaseSchema } from "@/types/database";
import type { ScaleEstimates } from "@/types/scale";

// A compact plain-text description of the specific design that was generated -
// this is what grounds interview questions/evaluations in the user's actual
// design instead of generic system-design trivia.
//
// When the architecture came from the AI path, this also includes the
// domain, bottlenecks, failure scenarios, and 10x-scale analysis already
// generated for the Analysis tab - deliberately reusing those facts rather
// than letting the interview prompt re-derive its own independent answers to
// "what's the bottleneck here" or "what happens at 10x scale," which could
// otherwise drift from what the app already told the user on those tabs.
export function buildDesignSummary(
  requirements: AnalyzedRequirements,
  architecture: Architecture,
  databaseSchema: DatabaseSchema,
  scale: ScaleEstimates
): string {
  const functional = requirements.functional.map((r) => r.text).join("; ");
  const components = architecture.components.map((c) => c.name).join(", ");
  const tables = databaseSchema.tables.map((t) => t.name).join(", ");

  const lines = [
    architecture.domain ? `Domain: ${architecture.domain}` : null,
    `Functional requirements: ${functional}`,
    `Scale: ${scale.dau.toLocaleString()} daily active users, ~${Math.round(scale.peakQps).toLocaleString()} peak requests/sec.`,
    `Architecture components: ${components}`,
    `Database tables: ${tables}`,
  ];

  if (architecture.designRationale?.length) {
    lines.push(`Key design decisions: ${architecture.designRationale.join(" ")}`);
  }

  if (architecture.bottlenecks?.length) {
    lines.push(
      `Known bottlenecks: ${architecture.bottlenecks.map((b) => `${b.component} (${b.reason})`).join(" | ")}`
    );
  }

  if (architecture.failureScenarios?.length) {
    lines.push(`Known failure scenarios: ${architecture.failureScenarios.map((f) => f.scenario).join("; ")}`);
  }

  if (architecture.tenXScale) {
    lines.push(
      `10x scale (${architecture.tenXScale.fromScale} -> ${architecture.tenXScale.toScale}): ${architecture.tenXScale.changes.join(" ")}`
    );
  }

  return lines.filter(Boolean).join("\n");
}
