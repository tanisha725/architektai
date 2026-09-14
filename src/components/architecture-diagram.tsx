"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import { ComponentDetail } from "@/components/component-detail";
import { layoutArchitecture } from "@/lib/architecture-layout";
import type { Architecture } from "@/types/architecture";

export function ArchitectureDiagram({ architecture }: { architecture: Architecture }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = architecture.components.find((c) => c.id === selectedId) ?? null;

  const positions = useMemo(() => layoutArchitecture(architecture), [architecture]);

  const nodes: Node[] = useMemo(
    () =>
      architecture.components.map((component) => ({
        id: component.id,
        position: positions[component.id] ?? { x: 0, y: 0 },
        data: { label: component.name },
        selected: component.id === selectedId,
        style: {
          border: component.id === selectedId ? "2px solid #171717" : "1px solid #e5e5e5",
          borderRadius: 8,
          padding: 10,
          fontSize: 13,
          background: "white",
          width: 180,
        },
      })),
    [architecture, positions, selectedId]
  );

  const edges: Edge[] = useMemo(
    () =>
      architecture.connections.map((conn, index) => ({
        id: `${conn.from}-${conn.to}-${index}`,
        source: conn.from,
        target: conn.to,
        label: conn.label,
        animated: false,
      })),
    [architecture]
  );

  return (
    <div className="flex flex-col gap-4">
      <div style={{ height: 420 }} className="w-full rounded-lg border border-border">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={(_, node) => setSelectedId(node.id === selectedId ? null : node.id)}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <p className="text-xs text-muted-foreground">
        Click a component in the diagram to see why it was chosen, alternatives, and trade-offs.
      </p>

      {selected && <ComponentDetail component={selected} />}
    </div>
  );
}
