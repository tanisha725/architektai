import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ListChecks, Users, Zap, Boxes, Database, Webhook, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingRow } from "@/components/ui/spinner";
import { RequirementsResult } from "@/components/requirements-result";
import { ScaleEstimator } from "@/components/scale-estimator";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { DatabaseSchemaResult } from "@/components/database-schema-result";
import { ApiResult } from "@/components/api-result";
import { RoadmapResult } from "@/components/roadmap-result";
import { InterviewTab } from "@/components/interview-tab";
import { ArchitectureEvolutionResult } from "@/components/architecture-evolution-result";
import { AnalysisResult } from "@/components/analysis-result";
import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { EvolutionStage } from "@/types/evolution";
import type { ScaleEstimates } from "@/types/scale";
import type { Architecture } from "@/types/architecture";
import type { DatabaseSchema } from "@/types/database";
import type { ApiEndpoint } from "@/types/api";
import type { RoadmapPhase } from "@/types/roadmap";

interface DesignWorkspaceProps {
  requirements: AnalyzedRequirements;
  analysisSource: "ai" | "rule-based" | null;
  approxUserCount: number | undefined;
  onEstimatesChange: (estimates: ScaleEstimates) => void;
  scaleEstimates: ScaleEstimates | null;
  architecture: Architecture | null;
  databaseSchema: DatabaseSchema | null;
  apiEndpoints: ApiEndpoint[] | null;
  roadmap: RoadmapPhase[] | null;
  designSummary: string | null;
  evolutionStages: EvolutionStage[] | null;
  architectureSource: "ai" | "rule-based" | null;
  isGeneratingArchitecture: boolean;
  architectureError: string | null;
  onRegenerateArchitecture: () => void;
}

export function DesignWorkspace({
  requirements,
  analysisSource,
  approxUserCount,
  onEstimatesChange,
  scaleEstimates,
  architecture,
  databaseSchema,
  apiEndpoints,
  roadmap,
  designSummary,
  evolutionStages,
  architectureSource,
  isGeneratingArchitecture,
  architectureError,
  onRegenerateArchitecture,
}: DesignWorkspaceProps) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Analyzed by: {analysisSource === "ai" ? "Gemini (AI)" : "rule-based analyzer (no API key configured)"}
      </p>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="scale">Scale</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="evolution">Evolution</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" keepMounted>
          <OverviewTab
            requirements={requirements}
            scaleEstimates={scaleEstimates}
            architecture={architecture}
            databaseSchema={databaseSchema}
            apiEndpoints={apiEndpoints}
            roadmap={roadmap}
          />
        </TabsContent>

        <TabsContent value="requirements">
          <RequirementsResult requirements={requirements} />
        </TabsContent>

        <TabsContent value="scale" keepMounted>
          <ScaleEstimator
            key={approxUserCount ?? "default"}
            initialTotalUsers={approxUserCount}
            onEstimatesChange={onEstimatesChange}
          />
        </TabsContent>

        <TabsContent value="architecture">
          <ArchitectureTab
            architecture={architecture}
            source={architectureSource}
            isGenerating={isGeneratingArchitecture}
            error={architectureError}
            onRegenerate={onRegenerateArchitecture}
          />
        </TabsContent>

        <TabsContent value="database">
          {databaseSchema ? <DatabaseSchemaResult schema={databaseSchema} /> : <EmptyTabState />}
        </TabsContent>

        <TabsContent value="api">
          {apiEndpoints ? <ApiResult endpoints={apiEndpoints} /> : <EmptyTabState />}
        </TabsContent>

        <TabsContent value="roadmap">
          {roadmap ? <RoadmapResult phases={roadmap} /> : <EmptyTabState />}
        </TabsContent>

        <TabsContent value="interview" keepMounted>
          {designSummary ? <InterviewTab designSummary={designSummary} /> : <EmptyTabState />}
        </TabsContent>

        <TabsContent value="evolution">
          {evolutionStages ? <ArchitectureEvolutionResult stages={evolutionStages} /> : <EmptyTabState />}
        </TabsContent>

        <TabsContent value="analysis">
          {isGeneratingArchitecture ? (
            <LoadingRow label="Reasoning through the architecture..." />
          ) : (
            <AnalysisResult
              failureScenarios={architecture?.failureScenarios}
              bottlenecks={architecture?.bottlenecks}
              tenXScale={architecture?.tenXScale}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ArchitectureTab({
  architecture,
  source,
  isGenerating,
  error,
  onRegenerate,
}: {
  architecture: Architecture | null;
  source: "ai" | "rule-based" | null;
  isGenerating: boolean;
  error: string | null;
  onRegenerate: () => void;
}) {
  if (isGenerating) {
    return <LoadingRow label="Reasoning through the architecture..." />;
  }

  if (!architecture) {
    return <EmptyTabState />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {architecture.domain && <span className="font-medium text-foreground">{architecture.domain}</span>}
          {architecture.domain && " · "}
          Generated by: {source === "ai" ? "Gemini (AI)" : "rule-based fallback"}
        </p>
        <Button variant="outline" size="sm" onClick={onRegenerate} disabled={isGenerating}>
          Regenerate
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {architecture.designRationale && architecture.designRationale.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Why this architecture?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-sm">
              {architecture.designRationale.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <ArchitectureDiagram architecture={architecture} />
    </div>
  );
}

function EmptyTabState() {
  return (
    <LoadingRow label="Still computing..." />
  );
}

function OverviewTab({
  requirements,
  scaleEstimates,
  architecture,
  databaseSchema,
  apiEndpoints,
  roadmap,
}: {
  requirements: AnalyzedRequirements;
  scaleEstimates: ScaleEstimates | null;
  architecture: Architecture | null;
  databaseSchema: DatabaseSchema | null;
  apiEndpoints: ApiEndpoint[] | null;
  roadmap: RoadmapPhase[] | null;
}) {
  const stats = [
    { label: "Functional requirements", value: requirements.functional.length, icon: ListChecks, color: "#2563eb" },
    { label: "Daily active users", value: scaleEstimates ? scaleEstimates.dau.toLocaleString() : "—", icon: Users, color: "#059669" },
    { label: "Peak QPS", value: scaleEstimates ? Math.round(scaleEstimates.peakQps).toLocaleString() : "—", icon: Zap, color: "#d97706" },
    { label: "Architecture components", value: architecture?.components.length ?? "—", icon: Boxes, color: "#7c3aed" },
    { label: "Database tables", value: databaseSchema?.tables.length ?? "—", icon: Database, color: "#0891b2" },
    { label: "API endpoints", value: apiEndpoints?.length ?? "—", icon: Webhook, color: "#db2777" },
    { label: "Roadmap phases", value: roadmap?.length ?? "—", icon: Map, color: "#64748b" },
  ];

  // "Key decisions" - the infrastructure choices (KB-grounded components have
  // real alternatives; conceptual services don't), one line each.
  const keyDecisions = architecture?.components.filter((c) => c.alternatives.length > 0) ?? [];

  return (
    <div className="flex flex-col gap-6">
      {architecture?.domain && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Product</p>
          <p className="text-lg font-semibold">{architecture.domain}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-start justify-between py-4">
              <div>
                <p className="font-mono text-2xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${stat.color}1a`, color: stat.color }}
              >
                <stat.icon className="size-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {architecture?.designRationale && architecture.designRationale.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Why this architecture?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-sm">
              {architecture.designRationale.slice(0, 3).map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ol>
            {architecture.designRationale.length > 3 && (
              <p className="mt-2 text-xs text-muted-foreground">See the Architecture tab for the full rationale.</p>
            )}
          </CardContent>
        </Card>
      )}

      {keyDecisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {keyDecisions.map((c) => (
                <li key={c.id}>
                  <span className="font-medium">{c.name}</span> — {c.reason}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
