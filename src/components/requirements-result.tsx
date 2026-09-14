import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyzedRequirements, RequirementItem } from "@/lib/schemas/requirements-schema";

function RequirementList({ items }: { items: RequirementItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">None identified.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.text} className="flex items-start gap-2 text-sm">
          <span
            className={
              "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide " +
              (item.source === "user-stated"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground")
            }
          >
            {item.source === "user-stated" ? "stated" : "assumed"}
          </span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function RequirementsResult({ requirements }: { requirements: AnalyzedRequirements }) {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Functional Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <RequirementList items={requirements.functional} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Non-Functional Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <RequirementList items={requirements.nonFunctional} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <RequirementList items={requirements.assumptions} />
        </CardContent>
      </Card>
    </div>
  );
}
