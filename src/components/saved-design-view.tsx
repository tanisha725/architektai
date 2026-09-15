"use client";

import { useCallback, useMemo, useState } from "react";
import { DesignWorkspace } from "@/components/design-workspace";
import { buildDesignSummary } from "@/lib/design-summary";
import { generateArchitectureEvolution } from "@/lib/architecture-evolution";
import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { Architecture } from "@/types/architecture";
import type { DatabaseSchema } from "@/types/database";
import type { ApiEndpoint } from "@/types/api";
import type { RoadmapPhase } from "@/types/roadmap";
import type { ScaleEstimates, ScaleInputs } from "@/types/scale";

interface SavedDesignViewProps {
  description: string;
  analysisSource: "ai" | "rule-based";
  scaleInputs: ScaleInputs;
  requirements: AnalyzedRequirements;
  architecture: Architecture;
  databaseSchema: DatabaseSchema;
  apiEndpoints: ApiEndpoint[];
  roadmap: RoadmapPhase[];
}

export function SavedDesignView({
  description,
  analysisSource,
  scaleInputs,
  requirements,
  architecture,
  databaseSchema,
  apiEndpoints,
  roadmap,
}: SavedDesignViewProps) {
  const [scaleEstimates, setScaleEstimates] = useState<ScaleEstimates | null>(null);

  const handleEstimatesChange = useCallback((estimates: ScaleEstimates) => {
    setScaleEstimates(estimates);
  }, []);

  const designSummary = useMemo(() => {
    if (!scaleEstimates) return null;
    return buildDesignSummary(requirements, architecture, databaseSchema, scaleEstimates);
  }, [requirements, architecture, databaseSchema, scaleEstimates]);

  const evolutionStages = useMemo(() => generateArchitectureEvolution(requirements), [requirements]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">{description}</div>

      <DesignWorkspace
        requirements={requirements}
        analysisSource={analysisSource}
        approxUserCount={scaleInputs.totalUsers}
        onEstimatesChange={handleEstimatesChange}
        scaleEstimates={scaleEstimates}
        architecture={architecture}
        databaseSchema={databaseSchema}
        apiEndpoints={apiEndpoints}
        roadmap={roadmap}
        designSummary={designSummary}
        evolutionStages={evolutionStages}
      />
    </div>
  );
}
