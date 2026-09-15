import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import type { EvolutionStage } from "@/types/evolution";

export function ArchitectureEvolutionResult({ stages }: { stages: EvolutionStage[] }) {
  return (
    <div className="flex flex-col gap-8">
      {stages.map((stage, index) => (
        <div key={stage.label} className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <h3 className="text-base font-semibold">{stage.label}</h3>
            <span className="text-xs text-muted-foreground">
              {stage.scale.dau.toLocaleString()} DAU · ~{Math.round(stage.scale.peakQps).toLocaleString()} peak req/s
            </span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {index === 0 ? "Baseline architecture" : "What changed and why"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {stage.addedComponents.length > 0 && (
                <p className="mb-2 font-medium">
                  {index === 0 ? "Starting components: " : "Added: "}
                  {stage.addedComponents.join(", ")}
                </p>
              )}
              <p className="text-muted-foreground">{stage.triggerReason}</p>
            </CardContent>
          </Card>

          <ArchitectureDiagram architecture={stage.architecture} />
        </div>
      ))}
    </div>
  );
}
