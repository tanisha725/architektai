import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArchitectureComponent } from "@/types/architecture";

export function ComponentDetail({ component }: { component: ArchitectureComponent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{component.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <DetailRow label="What it does" value={component.purpose} />
        <DetailRow label="Why it was chosen here" value={component.reason} />
        <DetailRow
          label="Alternatives"
          value={component.alternatives.length > 0 ? component.alternatives.join(", ") : "None considered for this role."}
        />
        <DetailRow label="Trade-offs" value={component.tradeoffs} />
        <DetailRow label="If it fails" value={component.failureBehavior} />
        <DetailRow label="Scaling strategy" value={component.scalingStrategy} />
      </CardContent>
    </Card>
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
