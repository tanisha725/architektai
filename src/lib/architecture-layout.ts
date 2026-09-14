import type { Architecture } from "@/types/architecture";

const LEVEL_HEIGHT = 140;
const NODE_WIDTH = 200;

// Assigns each component a "level" = its distance (in hops) from the client
// node, via breadth-first search over the connection graph. Nodes at the same
// level are laid out side by side; levels stack top to bottom.
export function layoutArchitecture(architecture: Architecture): Record<string, { x: number; y: number }> {
  const adjacency = new Map<string, string[]>();
  for (const conn of architecture.connections) {
    if (!adjacency.has(conn.from)) adjacency.set(conn.from, []);
    adjacency.get(conn.from)!.push(conn.to);
  }

  const levels = new Map<string, number>();
  const rootId = architecture.components[0]?.id;
  if (!rootId) return {};

  levels.set(rootId, 0);
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current)!;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (!levels.has(neighbor)) {
        levels.set(neighbor, currentLevel + 1);
        queue.push(neighbor);
      }
    }
  }

  // Any component unreachable from the root (shouldn't normally happen) still
  // gets placed, at level 0, so nothing silently disappears from the diagram.
  for (const component of architecture.components) {
    if (!levels.has(component.id)) levels.set(component.id, 0);
  }

  const componentsByLevel = new Map<number, string[]>();
  for (const [id, level] of levels) {
    if (!componentsByLevel.has(level)) componentsByLevel.set(level, []);
    componentsByLevel.get(level)!.push(id);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  for (const [level, ids] of componentsByLevel) {
    const totalWidth = ids.length * NODE_WIDTH;
    ids.forEach((id, index) => {
      positions[id] = {
        x: index * NODE_WIDTH - totalWidth / 2,
        y: level * LEVEL_HEIGHT,
      };
    });
  }

  return positions;
}
