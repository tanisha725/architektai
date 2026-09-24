import type { DiagramSpec } from "./diagram-types";

export const CONCEPT_DIAGRAMS: Record<string, DiagramSpec> = {
  sharding: {
    nodes: [
      { id: "client", label: "Client", x: 45, y: 110, w: 80 },
      { id: "router", label: "Shard Router\n(by shard key)", x: 200, y: 110, w: 130 },
      { id: "s1", label: "Shard A\nusers 1-1M", x: 400, y: 40, variant: "accent" },
      { id: "s2", label: "Shard B\nusers 1M-2M", x: 400, y: 110, variant: "accent" },
      { id: "s3", label: "Shard C\nusers 2M-3M", x: 400, y: 180, variant: "accent" },
    ],
    edges: [
      { from: "client", to: "router" },
      { from: "router", to: "s1" },
      { from: "router", to: "s2" },
      { from: "router", to: "s3" },
    ],
    steps: ["Each shard holds a slice of the data, not all of it.", "The router sends each request only to the shard that owns that data."],
  },

  replication: {
    nodes: [
      { id: "client", label: "Client", x: 45, y: 110, w: 80 },
      { id: "primary", label: "Primary\n(handles writes)", x: 210, y: 110, w: 130, variant: "accent" },
      { id: "r1", label: "Replica\n(reads)", x: 400, y: 40 },
      { id: "r2", label: "Replica\n(reads)", x: 400, y: 110 },
      { id: "r3", label: "Replica\n(reads)", x: 400, y: 180 },
    ],
    edges: [
      { from: "client", to: "primary", label: "write" },
      { from: "primary", to: "r1", dashed: true, label: "copy" },
      { from: "primary", to: "r2", dashed: true },
      { from: "primary", to: "r3", dashed: true },
    ],
    steps: ["Writes go to the primary; the primary copies every change to its replicas.", "Read traffic can be spread across the replicas instead of hitting one machine."],
  },

  "sql-vs-nosql": {
    nodes: [
      { id: "sql", label: "SQL\nTables + rows\nfixed schema", x: 140, y: 110, w: 180, h: 70, variant: "accent" },
      { id: "nosql", label: "NoSQL\nDocuments / key-value\nflexible schema", x: 360, y: 110, w: 180, h: 70, variant: "muted" },
    ],
    edges: [{ from: "sql", to: "nosql", undirected: true, dashed: true }],
    steps: ["Neither is strictly better - they make different trade-offs for different access patterns."],
    height: 180,
  },

  "microservices-vs-monolith": {
    nodes: [
      { id: "mono", label: "Monolith\nall features,\none deployable unit", x: 90, y: 110, w: 140, h: 90, variant: "muted" },
      { id: "gw", label: "API Gateway", x: 285, y: 110, w: 105 },
      { id: "a", label: "Service A", x: 420, y: 40, w: 100, variant: "accent" },
      { id: "b", label: "Service B", x: 420, y: 110, w: 100, variant: "accent" },
      { id: "c", label: "Service C", x: 420, y: 180, w: 100, variant: "accent" },
    ],
    edges: [
      { from: "gw", to: "a" },
      { from: "gw", to: "b" },
      { from: "gw", to: "c" },
    ],
    steps: ["Left: a monolith ships and scales as one unit.", "Right: microservices ship and scale independently, coordinated through a gateway."],
  },

  "caching-strategy": {
    nodes: [
      { id: "client", label: "Client", x: 45, y: 110, w: 80 },
      { id: "cache", label: "Cache\n(Redis)", x: 230, y: 60, variant: "accent" },
      { id: "db", label: "Database", x: 230, y: 180 },
    ],
    edges: [
      { from: "client", to: "cache", label: "check" },
      { from: "cache", to: "db", dashed: true, label: "on miss" },
    ],
    steps: ["Most requests are answered straight from the fast cache.", "Only on a cache miss does the request fall through to the slower database."],
  },

  "cap-theorem": {
    nodes: [
      { id: "c", label: "Consistency", x: 240, y: 45, w: 130 },
      { id: "a", label: "Availability", x: 100, y: 185, w: 130 },
      { id: "p", label: "Partition\nTolerance", x: 380, y: 185, w: 130 },
    ],
    edges: [
      { from: "c", to: "a", undirected: true },
      { from: "a", to: "p", undirected: true },
      { from: "c", to: "p", undirected: true },
    ],
    steps: ["Networks fail (partitions happen), so partition tolerance isn't really optional.", "That leaves a real choice during a network split: stay consistent, or stay available."],
  },

  "rate-limiting": {
    nodes: [
      { id: "client", label: "Client\n(bursts of requests)", x: 70, y: 110, w: 110 },
      { id: "limiter", label: "Rate Limiter\n100 req/min", x: 250, y: 110, w: 130, variant: "accent" },
      { id: "service", label: "Service", x: 410, y: 45, w: 100 },
      { id: "rejected", label: "429 Too Many\nRequests", x: 410, y: 180, w: 110, variant: "danger" },
    ],
    edges: [
      { from: "client", to: "limiter" },
      { from: "limiter", to: "service", label: "allowed" },
      { from: "limiter", to: "rejected", dashed: true, label: "blocked" },
    ],
  },

  "async-processing": {
    nodes: [
      { id: "client", label: "Client", x: 40, y: 110, w: 75 },
      { id: "api", label: "API", x: 155, y: 110, w: 85 },
      { id: "queue", label: "Queue", x: 275, y: 110, w: 95, variant: "accent" },
      { id: "worker", label: "Worker", x: 400, y: 55, w: 100 },
      { id: "db", label: "Database", x: 400, y: 165, w: 100 },
    ],
    edges: [
      { from: "client", to: "api" },
      { from: "api", to: "queue", label: "enqueue" },
      { from: "queue", to: "worker", label: "process" },
      { from: "worker", to: "db" },
    ],
    steps: ["The API responds immediately after placing the job on the queue - it doesn't wait for the work to finish.", "A worker picks up the job separately, on its own time."],
  },
};
