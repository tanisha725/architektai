"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Architecture, ArchitectureComponent } from "@/types/architecture";

export function ArchitectureResult({ architecture }: { architecture: Architecture }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = architecture.components.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {architecture.components.map((component) => (
          <button
            key={component.id}
            type="button"
            onClick={() => setSelectedId(component.id === selectedId ? null : component.id)}
            className={
              "rounded-lg border px-4 py-2 text-sm transition-colors " +
              (component.id === selectedId
                ? "border-primary bg-primary/10 font-medium"
                : "border-border bg-card hover:bg-muted")
            }
          >
            {component.name}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Click a component to see why it was chosen, alternatives, and trade-offs.
      </p>

      {selected && <ComponentDetail component={selected} />}
    </div>
  );
}

function ComponentDetail({ component }: { component: ArchitectureComponent }) {
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
