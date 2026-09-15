import type { ArchitectureComponent } from "@/types/architecture";

// Visual grouping for the diagram - "organize into logical groups" rather
// than a flat list of same-looking boxes. AI-generated components carry an
// explicit `kind`; rule-based (fallback) components don't, so we infer a
// group from their technologyId instead.
export type ComponentGroup = "entry" | "service" | "data" | "cache" | "async" | "media" | "query" | "external";

export const GROUP_COLORS: Record<ComponentGroup, { border: string; background: string; label: string }> = {
  entry: { border: "#64748b", background: "#f8fafc", label: "Entry" },
  service: { border: "#2563eb", background: "#eff6ff", label: "Service" },
  data: { border: "#059669", background: "#ecfdf5", label: "Data" },
  cache: { border: "#d97706", background: "#fffbeb", label: "Cache" },
  async: { border: "#7c3aed", background: "#f5f3ff", label: "Async" },
  media: { border: "#0891b2", background: "#ecfeff", label: "Media/CDN" },
  query: { border: "#db2777", background: "#fdf2f8", label: "Search/Geo" },
  external: { border: "#6b7280", background: "#f9fafb", label: "External" },
};

const KIND_TO_GROUP: Record<string, ComponentGroup> = {
  client: "entry",
  gateway: "entry",
  service: "service",
  database: "data",
  cache: "cache",
  queue: "async",
  compute: "async",
  storage: "media",
  cdn: "media",
  search: "query",
  geospatial: "query",
  external: "external",
};

// Fallback mapping for rule-based (non-AI) components, which have no `kind`
// field - keyed by their technologyId instead.
const TECHNOLOGY_ID_TO_GROUP: Record<string, ComponentGroup> = {
  client: "entry",
  backend: "service",
  "load-balancer": "entry",
  "api-gateway": "entry",
  postgresql: "data",
  mongodb: "data",
  dynamodb: "data",
  redis: "cache",
  "object-storage": "media",
  cdn: "media",
  "message-queue": "async",
  "video-transcoding": "async",
  elasticsearch: "query",
  "geospatial-index": "query",
  "external-payment-provider": "external",
};

export function getComponentGroup(component: ArchitectureComponent): ComponentGroup {
  if (component.kind && KIND_TO_GROUP[component.kind]) return KIND_TO_GROUP[component.kind];
  return TECHNOLOGY_ID_TO_GROUP[component.technologyId] ?? "service";
}
