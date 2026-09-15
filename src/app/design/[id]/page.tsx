import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SavedDesignView } from "@/components/saved-design-view";
import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { Architecture } from "@/types/architecture";
import type { DatabaseSchema } from "@/types/database";
import type { ApiEndpoint } from "@/types/api";
import type { RoadmapPhase } from "@/types/roadmap";
import type { ScaleInputs } from "@/types/scale";

export default async function SavedDesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = await prisma.design.findUnique({ where: { id } });

  if (!design) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 py-16">
      <div className="flex w-full max-w-4xl flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">ArchitektAI</h1>
        <p className="text-xs text-muted-foreground">
          Saved design &middot; {design.createdAt.toLocaleDateString()}
        </p>
      </div>

      <div className="mt-8 w-full max-w-4xl">
        <SavedDesignView
          description={design.description}
          analysisSource={design.analysisSource === "ai" ? "ai" : "rule-based"}
          scaleInputs={design.scaleInputs as unknown as ScaleInputs}
          requirements={design.requirements as unknown as AnalyzedRequirements}
          architecture={design.architecture as unknown as Architecture}
          databaseSchema={design.databaseSchema as unknown as DatabaseSchema}
          apiEndpoints={design.apiEndpoints as unknown as ApiEndpoint[]}
          roadmap={design.roadmap as unknown as RoadmapPhase[]}
        />
      </div>
    </div>
  );
}
