import type { DiagramSpec, DiagramNode } from "./diagram-types";

const VIEW_W = 480;

const VARIANT_CLASSES: Record<NonNullable<DiagramNode["variant"]>, string> = {
  default: "fill-card stroke-border",
  accent: "fill-primary/10 stroke-primary",
  muted: "fill-muted stroke-border",
  danger: "fill-destructive/10 stroke-destructive/60",
};

function edgePoint(node: Required<Pick<DiagramNode, "x" | "y" | "w" | "h">>, dx: number, dy: number): [number, number] {
  const { x, y, w, h } = node;
  if (dx === 0 && dy === 0) return [x, y];
  const halfW = w / 2;
  const halfH = h / 2;
  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const t = Math.min(scaleX, scaleY);
  return [x + dx * t, y + dy * t];
}

export function SimpleDiagram({ spec }: { spec: DiagramSpec }) {
  const height = spec.height ?? 220;
  const nodes = new Map(
    spec.nodes.map((n) => [n.id, { ...n, w: n.w ?? 116, h: n.h ?? 46 }] as const)
  );

  // When two edges connect the same pair of nodes (e.g. a request out and a
  // reply back), drawing both on the exact same line makes them unreadable -
  // offset each parallel edge perpendicular to the line so they fan out.
  const pairCounts = new Map<string, number>();
  for (const e of spec.edges) {
    const key = [e.from, e.to].sort().join("|");
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
  }
  const pairSeen = new Map<string, number>();

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <svg viewBox={`0 0 ${VIEW_W} ${height}`} className="w-full text-foreground" role="img" aria-label="Diagram">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-muted-foreground" />
          </marker>
        </defs>

        {spec.edges.map((e, i) => {
          const from = nodes.get(e.from);
          const to = nodes.get(e.to);
          if (!from || !to) return null;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          let [x1, y1] = edgePoint(from, dx, dy);
          let [x2, y2] = edgePoint(to, -dx, -dy);

          const [idA, idB] = [e.from, e.to].sort();
          const key = `${idA}|${idB}`;
          const total = pairCounts.get(key) ?? 1;
          if (total > 1) {
            const seen = pairSeen.get(key) ?? 0;
            pairSeen.set(key, seen + 1);
            const offsetIndex = seen - (total - 1) / 2;
            // Use a canonical direction (independent of which node is "from")
            // so both edges in the pair offset to opposite sides, not the same one.
            const a = nodes.get(idA)!;
            const b = nodes.get(idB)!;
            const canonDx = b.x - a.x;
            const canonDy = b.y - a.y;
            const len = Math.hypot(canonDx, canonDy) || 1;
            const perpX = (-canonDy / len) * offsetIndex * 12;
            const perpY = (canonDx / len) * offsetIndex * 12;
            x1 += perpX;
            y1 += perpY;
            x2 += perpX;
            y2 += perpY;
          }

          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const segmentLength = Math.hypot(x2 - x1, y2 - y1);
          const labelWidth = e.label ? e.label.length * 5.4 + 8 : 0;
          const showLabel = !!e.label && segmentLength >= labelWidth + 12;
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className="stroke-muted-foreground"
                strokeWidth={1.5}
                strokeDasharray={e.dashed ? "5 4" : undefined}
                markerEnd={e.undirected ? undefined : "url(#arrow)"}
              />
              {showLabel && (
                <g>
                  <rect
                    x={midX - labelWidth / 2}
                    y={midY - 9}
                    width={labelWidth}
                    height={14}
                    className="fill-background stroke-border"
                    strokeWidth={0.5}
                    rx={3}
                  />
                  <text x={midX} y={midY + 2} textAnchor="middle" className="fill-muted-foreground text-[8.5px]">
                    {e.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {[...nodes.values()].map((n) => {
          const lines = n.label.split("\n");
          const cls = VARIANT_CLASSES[n.variant ?? "default"];
          return (
            <g key={n.id}>
              <rect
                x={n.x - n.w / 2}
                y={n.y - n.h / 2}
                width={n.w}
                height={n.h}
                rx={8}
                strokeWidth={1.5}
                className={cls}
              />
              <text x={n.x} y={n.y - ((lines.length - 1) * 11) / 2 + 4} textAnchor="middle" className="fill-foreground text-[10.5px] font-medium">
                {lines.map((line, i) => (
                  <tspan key={i} x={n.x} dy={i === 0 ? 0 : 12}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>

      {spec.steps && spec.steps.length > 0 && (
        <ol className="flex flex-col gap-0.5 pl-1 text-xs text-muted-foreground">
          {spec.steps.map((s, i) => (
            <li key={i}>
              <span className="font-medium text-foreground">{i + 1}.</span> {s}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
