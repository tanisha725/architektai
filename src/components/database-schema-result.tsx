import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DatabaseSchema } from "@/types/database";

export function DatabaseSchemaResult({ schema }: { schema: DatabaseSchema }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schema.tables.map((table) => (
          <Card key={table.name}>
            <CardHeader>
              <CardTitle className="font-mono text-sm">{table.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <ul className="flex flex-col gap-1 font-mono text-xs">
                {table.columns.map((col) => (
                  <li key={col.name} className="flex items-center gap-1.5">
                    {col.isPrimaryKey && (
                      <span className="rounded bg-primary/10 px-1 text-primary">PK</span>
                    )}
                    {col.isForeignKey && (
                      <span className="rounded bg-muted px-1 text-muted-foreground">FK</span>
                    )}
                    <span>{col.name}</span>
                    <span className="text-muted-foreground">{col.type}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-muted-foreground">{table.reason}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {schema.relationships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Relationships</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {schema.relationships.map((rel, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{rel.from}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{rel.to}</span>
                  <span className="text-muted-foreground">— {rel.description}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
