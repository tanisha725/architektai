// Data-only diagram specs. Kept separate from the renderer so each concept/
// technology just describes its boxes and arrows - the renderer (simple-diagram.tsx)
// handles all the SVG geometry (edge clipping, arrowheads, theme colors) once.
export interface DiagramNode {
  id: string;
  label: string;
  x: number; // center x, in viewBox units (viewBox width is fixed at 480)
  y: number; // center y
  w?: number;
  h?: number;
  variant?: "default" | "accent" | "muted" | "danger";
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  undirected?: boolean;
}

export interface DiagramSpec {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  height?: number; // viewBox height, default 220
  steps?: string[]; // optional numbered caption under the diagram
}
