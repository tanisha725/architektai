"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { DesignWorkspace } from "@/components/design-workspace";
import { extractApproxUserCount } from "@/lib/scale-estimator";
import { generateDatabaseSchema } from "@/lib/schema-generator";
import { generateApiEndpoints } from "@/lib/api-generator";
import { generateRoadmap } from "@/lib/roadmap-generator";
import { buildDesignSummary } from "@/lib/design-summary";
import { generateArchitectureEvolution } from "@/lib/architecture-evolution";
import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { Architecture } from "@/types/architecture";
import type { DatabaseSchema } from "@/types/database";
import type { ApiEndpoint } from "@/types/api";
import { DEFAULT_SCALE_INPUTS, type ScaleEstimates } from "@/types/scale";

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
  const [isSaving, setIsSaving] = useState(false);
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [architecture, setArchitecture] = useState<Architecture | null>(null);
  const [architectureSource, setArchitectureSource] = useState<"ai" | "rule-based" | null>(null);
  const [isGeneratingArchitecture, setIsGeneratingArchitecture] = useState(false);
  const [architectureError, setArchitectureError] = useState<string | null>(null);
  // Domain-derived schema/API from the AI's entities - only set when
  // architecture generation succeeds via AI. Null otherwise, in which case
  // the useMemo below falls back to the requirement-text-based generators.
  const [aiDatabaseSchema, setAiDatabaseSchema] = useState<DatabaseSchema | null>(null);
  const [aiApiEndpoints, setAiApiEndpoints] = useState<ApiEndpoint[] | null>(null);
  // Guards against re-fetching on every scale edit - not itself rendered, so a
  // ref (not state) is correct here and avoids a setState-in-effect warning.
  const hasRequestedArchitectureRef = useRef(false);

  const handleEstimatesChange = useCallback((estimates: ScaleEstimates) => {
    setScaleEstimates(estimates);
  }, []);

  const generateArchitecture = useCallback(
    async (currentScale: ScaleEstimates) => {
      if (!requirements) return;
      setIsGeneratingArchitecture(true);
      setArchitectureError(null);
      try {
        const response = await fetch("/api/architecture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description, requirements, scale: currentScale }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "Failed to generate architecture.");
        setArchitecture(data.architecture);
        setArchitectureSource(data.source ?? null);
        setAiDatabaseSchema(data.databaseSchema ?? null);
        setAiApiEndpoints(data.apiEndpoints ?? null);
      } catch (err) {
        setArchitectureError(err instanceof Error ? err.message : "Unexpected error.");
      } finally {
        setIsGeneratingArchitecture(false);
      }
    },
    [description, requirements]
  );

  // Architecture generation calls an LLM (real cost/latency), so unlike scale
  // estimates it doesn't auto-recompute on every edit - it runs once
  // automatically when estimates first arrive, then only again if the user
  // explicitly clicks "Regenerate."
  useEffect(() => {
    if (requirements && scaleEstimates && !hasRequestedArchitectureRef.current) {
      hasRequestedArchitectureRef.current = true;
      generateArchitecture(scaleEstimates);
    }
  }, [requirements, scaleEstimates, generateArchitecture]);

  const databaseSchema = useMemo(() => {
    if (aiDatabaseSchema) return aiDatabaseSchema;
    if (!requirements) return null;
    return generateDatabaseSchema(requirements);
  }, [requirements, aiDatabaseSchema]);

  const apiEndpoints = useMemo(() => {
    if (aiApiEndpoints) return aiApiEndpoints;
    if (!requirements || !databaseSchema) return null;
    return generateApiEndpoints(requirements, databaseSchema);
  }, [requirements, databaseSchema, aiApiEndpoints]);

  const roadmap = useMemo(() => {
    if (!architecture) return null;
    return generateRoadmap(architecture);
  }, [architecture]);

  const designSummary = useMemo(() => {
    if (!requirements || !architecture || !databaseSchema || !scaleEstimates) return null;
    return buildDesignSummary(requirements, architecture, databaseSchema, scaleEstimates);
  }, [requirements, architecture, databaseSchema, scaleEstimates]);

  const evolutionStages = useMemo(() => {
    if (!requirements) return null;
    return generateArchitectureEvolution(requirements);
  }, [requirements]);

  async function handleSave() {
    if (!requirements || !architecture || !databaseSchema || !apiEndpoints || !roadmap) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          analysisSource,
          // Reconstructs the scale assumptions used, rather than tracking live
          // edits made in the Scale tab - a known simplification (see learning.md).
          scaleInputs: { ...DEFAULT_SCALE_INPUTS, totalUsers: approxUserCount ?? DEFAULT_SCALE_INPUTS.totalUsers },
          requirements,
          architecture,
          databaseSchema,
          apiEndpoints,
          roadmap,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Failed to save design.");
      setSavedDesignId(data.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleRegenerateArchitecture() {
    if (scaleEstimates) generateArchitecture(scaleEstimates);
  }

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
    setSavedDesignId(null);
    setSaveError(null);
    setArchitecture(null);
    setArchitectureSource(null);
    setArchitectureError(null);
    setAiDatabaseSchema(null);
    setAiApiEndpoints(null);
    hasRequestedArchitectureRef.current = false;

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
      <div className="rounded-2xl border border-border bg-card p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] transition-shadow focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_28px_rgba(0,0,0,0.08)]">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the product you want to design, e.g. 'Design Instagram for 10 million users...'"
          className="min-h-40 resize-none border-none text-base shadow-none focus-visible:ring-0"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => handleExampleClick(example)}
            className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:bg-muted hover:text-foreground"
          >
            {example.slice(0, 40)}...
          </button>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        size="lg"
        className="self-start shadow-sm"
      >
        {isSubmitting ? <Spinner className="size-4" /> : <Sparkles className="size-4" />}
        {isSubmitting ? "Analyzing..." : "Generate Design"}
      </Button>

      {requirements && (
        <>
          <DesignWorkspace
            requirements={requirements}
            analysisSource={analysisSource}
            approxUserCount={approxUserCount}
            onEstimatesChange={handleEstimatesChange}
            scaleEstimates={scaleEstimates}
            architecture={architecture}
            databaseSchema={databaseSchema}
            apiEndpoints={apiEndpoints}
            roadmap={roadmap}
            designSummary={designSummary}
            evolutionStages={evolutionStages}
            architectureSource={architectureSource}
            isGeneratingArchitecture={isGeneratingArchitecture}
            architectureError={architectureError}
            onRegenerateArchitecture={handleRegenerateArchitecture}
          />

          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || !architecture || !databaseSchema}
            >
              {isSaving && <Spinner className="size-4" />}
              {isSaving ? "Saving..." : "Save Design"}
            </Button>
            {savedDesignId && (
              <Link href={`/design/${savedDesignId}`} className="text-sm text-primary underline">
                View saved design →
              </Link>
            )}
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
        </>
      )}
    </div>
  );
}
