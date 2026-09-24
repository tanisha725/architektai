"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { Technology } from "@/lib/knowledge-base/technologies";
import type { Concept } from "@/lib/knowledge-base/concepts";
import { SimpleDiagram } from "@/components/diagrams/simple-diagram";
import { CONCEPT_DIAGRAMS } from "@/components/diagrams/concept-diagrams";
import { TECHNOLOGY_DIAGRAMS } from "@/components/diagrams/technology-diagrams";

type Selected = { kind: "technology"; id: string } | { kind: "concept"; id: string } | null;

const CATEGORY_COLORS: Record<string, string> = {
  database: "#059669",
  cache: "#d97706",
  queue: "#7c3aed",
  storage: "#0891b2",
  networking: "#64748b",
  search: "#db2777",
  geospatial: "#db2777",
  external: "#6b7280",
  compute: "#7c3aed",
};

export function GlossaryExplorer({ technologies, concepts }: { technologies: Technology[]; concepts: Concept[] }) {
  const [selected, setSelected] = useState<Selected>(null);

  const selectedTechnology = selected?.kind === "technology" ? technologies.find((t) => t.id === selected.id) : null;
  const selectedConcept = selected?.kind === "concept" ? concepts.find((c) => c.id === selected.id) : null;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Concepts & Patterns</h2>
          <p className="text-sm text-muted-foreground">
            The strategies behind system design - these ideas apply across many different technologies.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {concepts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected({ kind: "concept", id: c.id })}
              className={
                "rounded-lg border px-3.5 py-2 text-sm transition-colors " +
                (selected?.kind === "concept" && selected.id === c.id
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border bg-card hover:bg-muted")
              }
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Technologies</h2>
          <p className="text-sm text-muted-foreground">The concrete tools that implement those strategies.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {technologies.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected({ kind: "technology", id: t.id })}
              className={
                "flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm transition-colors " +
                (selected?.kind === "technology" && selected.id === t.id
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border bg-card hover:bg-muted")
              }
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: CATEGORY_COLORS[t.category] ?? "#64748b" }}
              />
              {t.name}
            </button>
          ))}
        </div>
      </section>

      {selectedConcept && <ConceptDetail concept={selectedConcept} onSelectTechnology={(id) => setSelected({ kind: "technology", id })} technologies={technologies} />}
      {selectedTechnology && <TechnologyDetail technology={selectedTechnology} />}

      {!selected && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Click a concept or technology above to see a plain-language explanation.
        </p>
      )}
    </div>
  );
}

function SimpleExplanationBox({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-primary">In plain words</p>
      <p className="mt-1 text-base leading-relaxed">{text}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function ConceptDetail({
  concept,
  technologies,
  onSelectTechnology,
}: {
  concept: Concept;
  technologies: Technology[];
  onSelectTechnology: (id: string) => void;
}) {
  const related = concept.relatedTechnologyIds
    .map((id) => technologies.find((t) => t.id === id))
    .filter((t): t is Technology => !!t);
  const diagram = CONCEPT_DIAGRAMS[concept.id];

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-4">
        <h3 className="text-xl font-semibold">{concept.name}</h3>
        <SimpleExplanationBox text={concept.simpleExplanation} />
        {diagram && <SimpleDiagram spec={diagram} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="What it is" value={concept.what} />
          <DetailRow label="Why it exists" value={concept.why} />
          <DetailRow label="When to use it" value={concept.when} />
          <DetailRow label="Example" value={concept.example} />
        </div>
        <DetailRow label="Trade-offs" value={concept.tradeoffs} />
        {related.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Related technologies</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {related.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTechnology(t.id)}
                  className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/70"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TechnologyDetail({ technology }: { technology: Technology }) {
  const diagram = TECHNOLOGY_DIAGRAMS[technology.id];
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-4">
        <h3 className="text-xl font-semibold">{technology.name}</h3>
        <SimpleExplanationBox text={technology.simpleExplanation} />
        {diagram && <SimpleDiagram spec={diagram} />}
        <DetailRow label="What it is" value={technology.description} />
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Strengths" value={technology.strengths.join("; ")} />
          <DetailRow label="Weaknesses" value={technology.weaknesses.join("; ")} />
          <DetailRow label="Typical use cases" value={technology.typicalUseCases.join("; ")} />
          <DetailRow
            label="Alternatives"
            value={technology.alternatives.length > 0 ? technology.alternatives.join(", ") : "None commonly compared."}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <DetailRow label="Scaling" value={technology.scalingCharacteristics} />
          <DetailRow label="Consistency" value={technology.consistencyCharacteristics} />
          <DetailRow label="Latency" value={technology.latencyCharacteristics} />
        </div>
        <DetailRow label="Cost" value={technology.costConsiderations} />
      </CardContent>
    </Card>
  );
}
