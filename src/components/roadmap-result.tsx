import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoadmapPhase } from "@/types/roadmap";

export function RoadmapResult({ phases }: { phases: RoadmapPhase[] }) {
  return (
    <div className="flex flex-col gap-4">
      {phases.map((phase) => (
        <Card key={phase.phaseNumber}>
          <CardHeader>
            <CardTitle className="text-base">
              Phase {phase.phaseNumber}: {phase.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <DetailRow label="What to build" value={phase.whatToBuild} />
            <DetailRow label="Concept to learn" value={phase.conceptToLearn} />
            <DetailRow label="Why this phase, here" value={phase.why} />
            <DetailRow label="Prerequisites" value={phase.prerequisites} />
            <DetailRow label="Expected outcome" value={phase.expectedOutcome} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}
