import { DEFAULT_SCALE_INPUTS } from "@/types/scale";
import { estimateScale } from "@/lib/scale-estimator";
import { planArchitecture } from "@/lib/architecture-planner";
import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { EvolutionStage } from "@/types/evolution";

// Fixed comparison tiers, independent of whatever the user has edited in the
// Scale tab - this keeps the evolution view a consistent, reproducible
// baseline rather than drifting with live-edited assumptions.
const TIERS = [
  { label: "10K users", totalUsers: 10_000 },
  { label: "1M users", totalUsers: 1_000_000 },
  { label: "10M+ users", totalUsers: 10_000_000 },
];

export function generateArchitectureEvolution(requirements: AnalyzedRequirements): EvolutionStage[] {
  let previousIds = new Set<string>();

  return TIERS.map((tier) => {
    const scale = estimateScale({ ...DEFAULT_SCALE_INPUTS, totalUsers: tier.totalUsers });
    const architecture = planArchitecture(requirements, scale);

    const added = architecture.components.filter((c) => !previousIds.has(c.id));
    previousIds = new Set(architecture.components.map((c) => c.id));

    return {
      label: tier.label,
      scale,
      architecture,
      addedComponents: added.map((c) => c.name),
      triggerReason:
        added.length > 0
          ? added.map((c) => c.reason).join(" ")
          : "No new components needed at this scale - the previous tier's architecture already handles this load.",
    };
  });
}
