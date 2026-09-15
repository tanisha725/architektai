import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { RequirementsResult } from "@/components/requirements-result";
import { ScaleEstimator } from "@/components/scale-estimator";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { DatabaseSchemaResult } from "@/components/database-schema-result";
import { ApiResult } from "@/components/api-result";
import { RoadmapResult } from "@/components/roadmap-result";
import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
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

        <TabsContent value="requirements" keepMounted>
          <RequirementsResult requirements={requirements} />
        </TabsContent>

        <TabsContent value="scale" keepMounted>
          <ScaleEstimator
            key={approxUserCount ?? "default"}
            initialTotalUsers={approxUserCount}
            onEstimatesChange={onEstimatesChange}
          />
        </TabsContent>

        <TabsContent value="architecture" keepMounted>
          {architecture ? (
            <ArchitectureDiagram architecture={architecture} />
          ) : (
            <EmptyTabState />
          )}
        </TabsContent>

        <TabsContent value="database" keepMounted>
          {databaseSchema ? <DatabaseSchemaResult schema={databaseSchema} /> : <EmptyTabState />}
        </TabsContent>

        <TabsContent value="api" keepMounted>
          {apiEndpoints ? <ApiResult endpoints={apiEndpoints} /> : <EmptyTabState />}
        </TabsContent>

        <TabsContent value="roadmap" keepMounted>
          {roadmap ? <RoadmapResult phases={roadmap} /> : <EmptyTabState />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyTabState() {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      Still computing...
    </p>
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
    { label: "Functional requirements", value: requirements.functional.length },
    { label: "Daily active users", value: scaleEstimates ? scaleEstimates.dau.toLocaleString() : "—" },
    { label: "Peak QPS", value: scaleEstimates ? Math.round(scaleEstimates.peakQps).toLocaleString() : "—" },
    { label: "Architecture components", value: architecture?.components.length ?? "—" },
    { label: "Database tables", value: databaseSchema?.tables.length ?? "—" },
    { label: "API endpoints", value: apiEndpoints?.length ?? "—" },
    { label: "Roadmap phases", value: roadmap?.length ?? "—" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="py-4">
            <p className="font-mono text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
