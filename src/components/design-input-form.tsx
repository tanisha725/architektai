"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DesignWorkspace } from "@/components/design-workspace";
import { extractApproxUserCount } from "@/lib/scale-estimator";
import { planArchitecture } from "@/lib/architecture-planner";
import { generateDatabaseSchema } from "@/lib/schema-generator";
import { generateApiEndpoints } from "@/lib/api-generator";
import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { ScaleEstimates } from "@/types/scale";

const EXAMPLE_PROMPTS = [
  "Design Instagram for 10 million users. Users can create accounts, upload photos and videos, follow other users, view a feed, like and comment on posts, receive notifications, and send messages.",
  "Design a URL shortener that handles 100 million links with custom aliases and click analytics.",
  "Design a ride-sharing app like Uber for a city of 5 million people, with real-time driver matching and trip tracking.",
];

export function DesignInputForm() {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<AnalyzedRequirements | null>(null);
  const [analysisSource, setAnalysisSource] = useState<"ai" | "rule-based" | null>(null);
  const [approxUserCount, setApproxUserCount] = useState<number | undefined>(undefined);
  const [scaleEstimates, setScaleEstimates] = useState<ScaleEstimates | null>(null);

  const handleEstimatesChange = useCallback((estimates: ScaleEstimates) => {
    setScaleEstimates(estimates);
  }, []);

  const architecture = useMemo(() => {
    if (!requirements || !scaleEstimates) return null;
    return planArchitecture(requirements, scaleEstimates);
  }, [requirements, scaleEstimates]);

  const databaseSchema = useMemo(() => {
    if (!requirements) return null;
    return generateDatabaseSchema(requirements);
  }, [requirements]);

  const apiEndpoints = useMemo(() => {
    if (!requirements || !databaseSchema) return null;
    return generateApiEndpoints(requirements, databaseSchema);
  }, [requirements, databaseSchema]);

  function handleExampleClick(example: string) {
    setDescription(example);
    setError(null);
  }

  async function handleSubmit() {
    if (description.trim().length < 10) {
      setError("Describe your idea in a bit more detail first.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setRequirements(null);
    setScaleEstimates(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong analyzing your description.");
      }

      const data = await response.json();
      setRequirements(data.requirements);
      setAnalysisSource(data.source ?? null);
      setApproxUserCount(extractApproxUserCount(description) ?? undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the product you want to design, e.g. 'Design Instagram for 10 million users...'"
        className="min-h-40 resize-none text-base"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => handleExampleClick(example)}
            className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/70"
          >
            {example.slice(0, 40)}...
          </button>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        size="lg"
        className="self-start"
      >
        {isSubmitting ? "Analyzing..." : "Generate Design"}
      </Button>

      {requirements && (
        <DesignWorkspace
          requirements={requirements}
          analysisSource={analysisSource}
          approxUserCount={approxUserCount}
          onEstimatesChange={handleEstimatesChange}
          scaleEstimates={scaleEstimates}
          architecture={architecture}
          databaseSchema={databaseSchema}
          apiEndpoints={apiEndpoints}
        />
      )}
    </div>
  );
}
