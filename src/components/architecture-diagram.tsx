"use client";

import { useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import { ComponentDetail } from "@/components/component-detail";
import { layoutArchitecture } from "@/lib/architecture-layout";
import { getComponentGroup, GROUP_COLORS } from "@/lib/component-groups";
import type { Architecture } from "@/types/architecture";

export function ArchitectureDiagram({ architecture }: { architecture: Architecture }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = architecture.components.find((c) => c.id === selectedId) ?? null;
  const instanceRef = useRef<ReactFlowInstance | null>(null);

  // The `fitView` prop alone can mis-measure when this diagram mounts inside
  // a hidden tab panel or stacked with several other diagrams (Evolution tab)
  // - the container's layout hasn't necessarily settled yet at mount time.
  // Re-running fitView from onInit, after a tick, forces a correct refit.
  function handleInit(instance: ReactFlowInstance) {
    instanceRef.current = instance;
    requestAnimationFrame(() => instance.fitView());
  }

  const positions = useMemo(() => layoutArchitecture(architecture), [architecture]);

  const nodes: Node[] = useMemo(
    () =>
      architecture.components.map((component) => {
        const group = getComponentGroup(component);
        const colors = GROUP_COLORS[group];
        const isSelected = component.id === selectedId;
        return {
          id: component.id,
          position: positions[component.id] ?? { x: 0, y: 0 },
          data: { label: component.name },
          selected: isSelected,
          style: {
            border: `${isSelected ? 2 : 1}px solid ${colors.border}`,
            borderRadius: 8,
            padding: 10,
            fontSize: 13,
            fontWeight: isSelected ? 600 : 500,
            background: colors.background,
            color: "#1f2937",
            width: 180,
            boxShadow: isSelected ? "0 0 0 3px rgba(0,0,0,0.06)" : undefined,
          },
        };
      }),
    [architecture, positions, selectedId]
  );

  const groupsPresent = useMemo(() => {
    const set = new Set<ReturnType<typeof getComponentGroup>>();
    for (const c of architecture.components) set.add(getComponentGroup(c));
    return Array.from(set);
  }, [architecture]);

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
          onInit={handleInit}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {groupsPresent.map((group) => {
          const colors = GROUP_COLORS[group];
          return (
            <span key={group} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ background: colors.background, border: `1.5px solid ${colors.border}` }}
              />
              {colors.label}
            </span>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Click a component in the diagram to see why it was chosen, alternatives, and trade-offs.
      </p>

      {selected && <ComponentDetail component={selected} />}
    </div>
  );
}
