import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import type { Resource } from "@/lib/resources";

export function ResourcesList({ resources }: { resources: Resource[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {resources.map((r) => (
        <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="block">
          <Card className="h-full">
            <CardContent className="flex h-full flex-col gap-1.5 pt-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{r.title}</h3>
                <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                {r.author} · {r.format}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  );
}
