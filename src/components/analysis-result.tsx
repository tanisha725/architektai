import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Bottleneck, FailureScenario, TenXScaleAnalysis } from "@/types/architecture";

export function AnalysisResult({
  failureScenarios,
  bottlenecks,
  tenXScale,
}: {
  failureScenarios?: FailureScenario[];
  bottlenecks?: Bottleneck[];
  tenXScale?: TenXScaleAnalysis;
}) {
  const hasAnything = (failureScenarios?.length ?? 0) > 0 || (bottlenecks?.length ?? 0) > 0 || tenXScale;

  if (!hasAnything) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Failure/bottleneck/10x-scale analysis requires the AI-generated architecture (unavailable right now - the
        rule-based fallback doesn&apos;t produce this). Try &ldquo;Regenerate&rdquo; on the Architecture tab once AI
        is available.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {failureScenarios && failureScenarios.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Failure Scenarios</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {failureScenarios.map((f, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-sm">{f.scenario}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <Row label="Impact" value={f.impact} />
                  <Row label="Mitigation" value={f.mitigation} />
                  <Row label="Recovery" value={f.recovery} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {bottlenecks && bottlenecks.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Likely Bottlenecks</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {bottlenecks.map((b, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-sm">{b.component}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <Row label="Why" value={b.reason} />
                  <Row label="How to detect" value={b.howToDetect} />
                  <Row label="Mitigation" value={b.mitigation} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {tenXScale && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">
            What happens at 10x scale? ({tenXScale.fromScale} → {tenXScale.toScale})
          </h3>
          <Card>
            <CardContent className="pt-4">
              <ul className="flex list-disc flex-col gap-2 pl-4 text-sm">
                {tenXScale.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}
