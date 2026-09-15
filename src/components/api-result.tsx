import { Card, CardContent } from "@/components/ui/card";
import type { ApiEndpoint, HttpMethod } from "@/types/api";

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  POST: "bg-green-500/10 text-green-600 dark:text-green-400",
  PUT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PATCH: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function ApiResult({ endpoints }: { endpoints: ApiEndpoint[] }) {
  return (
    <div className="flex flex-col gap-3">
      {endpoints.map((endpoint) => (
        <Card key={`${endpoint.method}-${endpoint.path}`}>
          <CardContent className="flex flex-col gap-2 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 font-mono text-xs font-semibold ${METHOD_COLORS[endpoint.method]}`}>
                {endpoint.method}
              </span>
              <span className="font-mono text-sm">{endpoint.path}</span>
              {endpoint.requiresAuth && (
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">auth required</span>
              )}
            </div>
            <p className="text-sm">{endpoint.purpose}</p>
            <div className="flex flex-col gap-1 font-mono text-xs text-muted-foreground">
              {endpoint.requestBody && <p>Request: {endpoint.requestBody}</p>}
              <p>Response: {endpoint.response}</p>
              <p>Errors: {endpoint.possibleErrors.join(", ")}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
