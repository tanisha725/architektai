import type { DiagramSpec } from "./diagram-types";

const clientAppDb = (dbLabel: string, dbNote?: string): DiagramSpec => ({
  nodes: [
    { id: "client", label: "Client", x: 50, y: 110, w: 85 },
    { id: "app", label: "App Server", x: 230, y: 110, w: 115 },
    { id: "db", label: dbLabel, x: 400, y: 110, w: 130, variant: "accent" },
  ],
  edges: [
    { from: "client", to: "app", label: "request" },
    { from: "app", to: "db", label: dbNote ?? "query" },
  ],
});

export const TECHNOLOGY_DIAGRAMS: Record<string, DiagramSpec> = {
  postgresql: clientAppDb("PostgreSQL\ntables, ACID", "SQL query"),
  mongodb: clientAppDb("MongoDB\ndocuments", "find/insert"),
  dynamodb: clientAppDb("DynamoDB\nkey-value, managed", "get/put item"),

  redis: {
    nodes: [
      { id: "client", label: "Client", x: 50, y: 110, w: 85 },
      { id: "app", label: "App Server", x: 230, y: 110, w: 115 },
      { id: "redis", label: "Redis\nin-memory", x: 400, y: 110, w: 120, variant: "accent" },
    ],
    edges: [
      { from: "client", to: "app" },
      { from: "app", to: "redis", label: "sub-ms read" },
    ],
    steps: ["Data lives in memory, not on disk - reads and writes are extremely fast.", "Used as a cache in front of a slower database, or for short-lived data like sessions."],
  },

  "object-storage": {
    nodes: [
      { id: "app", label: "App Server", x: 130, y: 110, w: 130 },
      { id: "store", label: "Object Storage\n(S3-style)", x: 380, y: 110, w: 160, variant: "accent" },
    ],
    edges: [{ from: "app", to: "store", label: "upload/download" }],
    steps: ["Stores whole files (images, videos, backups) as objects, not rows in a table.", "Built for huge volumes of infrequently-queried data at low cost."],
    height: 180,
  },

  cdn: {
    nodes: [
      { id: "client", label: "Client", x: 45, y: 110, w: 80 },
      { id: "cdn", label: "CDN Edge\n(nearby)", x: 220, y: 110, w: 130, variant: "accent" },
      { id: "origin", label: "Origin Server", x: 400, y: 110, w: 130 },
    ],
    edges: [
      { from: "client", to: "cdn" },
      { from: "cdn", to: "origin", dashed: true, label: "on miss" },
    ],
    steps: ["The CDN edge node closest to the user answers most requests directly.", "The origin server is only contacted when the edge doesn't already have the content cached."],
  },

  "load-balancer": {
    nodes: [
      { id: "client", label: "Client", x: 50, y: 110, w: 85 },
      { id: "lb", label: "Load Balancer", x: 225, y: 110, w: 130, variant: "accent" },
      { id: "s1", label: "Server 1", x: 410, y: 40, w: 100 },
      { id: "s2", label: "Server 2", x: 410, y: 110, w: 100 },
      { id: "s3", label: "Server 3", x: 410, y: 180, w: 100 },
    ],
    edges: [
      { from: "client", to: "lb" },
      { from: "lb", to: "s1" },
      { from: "lb", to: "s2" },
      { from: "lb", to: "s3" },
    ],
    steps: ["Spreads incoming requests across many identical servers.", "If one server goes down, traffic is routed to the healthy ones instead."],
  },

  "api-gateway": {
    nodes: [
      { id: "client", label: "Client", x: 50, y: 110, w: 85 },
      { id: "gw", label: "API Gateway\nauth, routing", x: 235, y: 110, w: 140, variant: "accent" },
      { id: "a", label: "Service A", x: 420, y: 40, w: 100 },
      { id: "b", label: "Service B", x: 420, y: 110, w: 100 },
      { id: "c", label: "Service C", x: 420, y: 180, w: 100 },
    ],
    edges: [
      { from: "client", to: "gw" },
      { from: "gw", to: "a" },
      { from: "gw", to: "b" },
      { from: "gw", to: "c" },
    ],
    steps: ["One front door for clients - it authenticates the request, then routes it to the right backend service."],
  },

  "message-queue": {
    nodes: [
      { id: "producer", label: "Producer\n(e.g. order API)", x: 80, y: 110, w: 140 },
      { id: "queue", label: "Message Queue", x: 255, y: 110, w: 110, variant: "accent" },
      { id: "consumer", label: "Consumer\n(e.g. email worker)", x: 410, y: 110, w: 130 },
    ],
    edges: [
      { from: "producer", to: "queue", label: "send" },
      { from: "queue", to: "consumer", label: "handle" },
    ],
    steps: ["The producer drops a message and moves on - it doesn't wait for the consumer.", "Decouples the two sides: either can be slow, down, or scaled independently."],
    height: 180,
  },

  elasticsearch: {
    nodes: [
      { id: "app", label: "App Server", x: 130, y: 110, w: 130 },
      { id: "es", label: "Elasticsearch\ninverted index", x: 380, y: 110, w: 160, variant: "accent" },
    ],
    edges: [{ from: "app", to: "es", label: "search query" }],
    steps: ["Pre-builds an index mapping words → documents, so free-text search is fast even across millions of records."],
    height: 180,
  },

  "geospatial-index": {
    nodes: [
      { id: "app", label: "App Server", x: 130, y: 110, w: 130 },
      { id: "geo", label: "Geospatial Index", x: 390, y: 110, w: 170, variant: "accent" },
    ],
    edges: [{ from: "app", to: "geo", label: "nearby search" }],
    steps: ["\"Find every restaurant within 2km\" - indexes locations so this is fast instead of scanning every row."],
    height: 180,
  },

  "external-payment-provider": {
    nodes: [
      { id: "app", label: "App Server", x: 65, y: 110, w: 110 },
      { id: "provider", label: "Payment Provider\n(e.g. Stripe)", x: 250, y: 110, w: 150, variant: "accent" },
      { id: "bank", label: "Card Networks\n/ Banks", x: 415, y: 110, w: 120 },
    ],
    edges: [
      { from: "app", to: "provider", label: "charge" },
      { from: "provider", to: "bank" },
      { from: "provider", to: "app", dashed: true, label: "webhook" },
    ],
    steps: ["Your app never touches raw card details - the provider handles that and talks to the banks directly.", "The provider notifies your app asynchronously (via webhook) once the charge succeeds or fails."],
    height: 180,
  },

  "video-transcoding": {
    nodes: [
      { id: "upload", label: "Upload", x: 45, y: 110, w: 75 },
      { id: "store", label: "Storage\n(raw file)", x: 165, y: 110, w: 100 },
      { id: "worker", label: "Transcoding\nWorker", x: 290, y: 110, w: 100, variant: "accent" },
      { id: "cdn", label: "CDN\n(multiple\nresolutions)", x: 420, y: 110, w: 115 },
    ],
    edges: [
      { from: "upload", to: "store" },
      { from: "store", to: "worker" },
      { from: "worker", to: "cdn" },
    ],
    steps: ["The worker processes the raw upload into multiple resolutions (480p/720p/1080p).", "Each version is served from the CDN, matched to the viewer's connection speed."],
    height: 180,
  },
};
