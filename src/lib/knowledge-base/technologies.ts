export interface Technology {
  id: string;
  name: string;
  category: "database" | "cache" | "queue" | "storage" | "networking" | "search";
  description: string;
  strengths: string[];
  weaknesses: string[];
  typicalUseCases: string[];
  scalingCharacteristics: string;
  consistencyCharacteristics: string;
  latencyCharacteristics: string;
  costConsiderations: string;
  alternatives: string[]; // other technology ids
}

export const TECHNOLOGIES: Technology[] = [
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "database",
    description: "A relational database that stores structured data in tables with defined relationships.",
    strengths: ["Strong consistency (ACID transactions)", "Rich querying with joins", "Mature tooling and ecosystem"],
    weaknesses: ["Harder to scale horizontally than NoSQL stores", "Schema changes require migrations"],
    typicalUseCases: ["User accounts", "Relational data (follows, orders, posts)", "Anything needing transactions"],
    scalingCharacteristics: "Scales vertically well; horizontal scaling (sharding, read replicas) requires deliberate design.",
    consistencyCharacteristics: "Strong consistency by default.",
    latencyCharacteristics: "Low latency for indexed queries; slower for complex joins at scale.",
    costConsiderations: "Predictable cost; efficient for moderate to large relational workloads.",
    alternatives: ["mongodb", "dynamodb"],
  },
  {
    id: "mongodb",
    name: "MongoDB",
    category: "database",
    description: "A document database that stores flexible, JSON-like records without a fixed schema.",
    strengths: ["Flexible schema", "Natural fit for nested/unstructured data", "Easy horizontal scaling via sharding"],
    weaknesses: ["Weaker support for multi-record transactions historically", "Joins across collections are awkward"],
    typicalUseCases: ["Content with varying shapes", "Rapid-iteration products", "Catalogs"],
    scalingCharacteristics: "Scales horizontally via built-in sharding.",
    consistencyCharacteristics: "Tunable; defaults to eventual consistency across replicas.",
    latencyCharacteristics: "Low latency for document lookups by key.",
    costConsiderations: "Can grow costly at very large scale due to storage overhead of denormalized data.",
    alternatives: ["postgresql", "dynamodb"],
  },
  {
    id: "dynamodb",
    name: "DynamoDB",
    category: "database",
    description: "A fully managed key-value/document database built for massive, predictable-latency scale.",
    strengths: ["Near-unlimited horizontal scalability", "Consistent single-digit-millisecond latency", "No server management"],
    weaknesses: ["Limited query flexibility (design around access patterns upfront)", "Vendor lock-in (AWS)"],
    typicalUseCases: ["Very high-scale key-value lookups", "Session stores", "Systems with well-known access patterns"],
    scalingCharacteristics: "Scales horizontally and automatically; effectively no practical ceiling.",
    consistencyCharacteristics: "Eventually consistent reads by default; strongly consistent reads available at extra cost.",
    latencyCharacteristics: "Very low, predictable latency regardless of scale.",
    costConsiderations: "Pay-per-request or provisioned throughput; can be expensive for complex query patterns.",
    alternatives: ["mongodb", "postgresql"],
  },
  {
    id: "redis",
    name: "Redis",
    category: "cache",
    description: "An in-memory key-value store used to cache frequently-read data and reduce database load.",
    strengths: ["Extremely low latency (in-memory)", "Simple data structures (strings, lists, sets, sorted sets)", "Widely supported"],
    weaknesses: ["Data is volatile unless persistence is configured", "Adds an extra moving part to operate"],
    typicalUseCases: ["Caching hot reads (feeds, sessions)", "Rate limiting", "Leaderboards"],
    scalingCharacteristics: "Scales via clustering/sharding; memory-bound per node.",
    consistencyCharacteristics: "Not a system of record - cached data can be briefly stale.",
    latencyCharacteristics: "Sub-millisecond reads/writes.",
    costConsiderations: "Memory is more expensive than disk-based storage; cost scales with cache size.",
    alternatives: [],
  },
  {
    id: "object-storage",
    name: "Object Storage (e.g. S3)",
    category: "storage",
    description: "Storage designed for large binary files (images, videos) referenced by a URL, not stored in a database.",
    strengths: ["Extremely cheap at scale", "Effectively unlimited capacity", "Offloads large files from the database"],
    weaknesses: ["Not queryable like a database", "Higher latency than in-memory or block storage"],
    typicalUseCases: ["User-uploaded photos/videos", "Static assets", "Backups"],
    scalingCharacteristics: "Scales automatically and near-infinitely; no capacity planning needed.",
    consistencyCharacteristics: "Typically strong read-after-write consistency for new objects.",
    latencyCharacteristics: "Higher than in-memory or SSD-backed storage; fine for media delivery, not for hot-path queries.",
    costConsiderations: "Very cheap per GB compared to storing binary blobs in a relational database.",
    alternatives: [],
  },
  {
    id: "cdn",
    name: "CDN (Content Delivery Network)",
    category: "networking",
    description: "A globally distributed network of caching servers that serve static content from a location near the user.",
    strengths: ["Dramatically reduces latency for users far from origin servers", "Reduces load on origin/object storage"],
    weaknesses: ["Cache invalidation can be tricky", "Adds a layer of configuration"],
    typicalUseCases: ["Serving images/videos/media", "Static site assets", "Any globally-distributed audience"],
    scalingCharacteristics: "Scales automatically with provider infrastructure.",
    consistencyCharacteristics: "Eventually consistent - cached content can be briefly stale after updates.",
    latencyCharacteristics: "Very low latency - served from an edge location near the user.",
    costConsiderations: "Priced per GB transferred; usually cheaper than serving the same traffic from origin.",
    alternatives: [],
  },
  {
    id: "load-balancer",
    name: "Load Balancer",
    category: "networking",
    description: "Distributes incoming traffic across multiple backend server instances.",
    strengths: ["Enables horizontal scaling of backend servers", "Improves availability (routes around unhealthy instances)"],
    weaknesses: ["A single load balancer can itself be a bottleneck/failure point without redundancy"],
    typicalUseCases: ["Any system running more than one backend instance"],
    scalingCharacteristics: "Managed load balancers (cloud provider) scale automatically.",
    consistencyCharacteristics: "Not applicable - a routing layer, not a data store.",
    latencyCharacteristics: "Adds minimal latency (single extra network hop).",
    costConsiderations: "Low cost relative to the availability/scaling benefit it provides.",
    alternatives: [],
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    category: "networking",
    description: "A single entry point for client requests that can handle routing, auth, and rate limiting before requests reach backend services.",
    strengths: ["Centralizes cross-cutting concerns (auth, rate limiting, logging)", "Simplifies client-facing API surface"],
    weaknesses: ["Another component to operate and monitor", "Can become a bottleneck if not scaled"],
    typicalUseCases: ["Systems with multiple backend services", "Public APIs needing rate limiting/auth"],
    scalingCharacteristics: "Managed API gateways scale automatically with traffic.",
    consistencyCharacteristics: "Not applicable - a routing/policy layer.",
    latencyCharacteristics: "Adds a small amount of latency per request for its processing.",
    costConsiderations: "Usually priced per request; low relative to the operational simplicity it provides.",
    alternatives: [],
  },
  {
    id: "message-queue",
    name: "Message Queue (e.g. Kafka/RabbitMQ)",
    category: "queue",
    description: "A system that lets services send work to each other asynchronously instead of processing it immediately inline.",
    strengths: ["Decouples slow/unreliable work from the request path", "Absorbs traffic spikes", "Enables retries without blocking users"],
    weaknesses: ["Adds operational complexity", "Introduces eventual consistency for queued work"],
    typicalUseCases: ["Sending notifications", "Processing uploaded media (resizing, transcoding)", "Any non-blocking background work"],
    scalingCharacteristics: "Scales horizontally by adding brokers/partitions and consumers.",
    consistencyCharacteristics: "Eventually consistent - queued work is processed after the fact, not instantly.",
    latencyCharacteristics: "Adds delay proportional to queue depth and consumer throughput; not for synchronous request paths.",
    costConsiderations: "Operational cost (running brokers) but avoids the cost of blocking requests on slow work.",
    alternatives: [],
  },
  {
    id: "elasticsearch",
    name: "Elasticsearch",
    category: "search",
    description: "A search engine optimized for full-text search and complex filtering across large datasets.",
    strengths: ["Fast full-text search", "Flexible filtering/ranking", "Scales horizontally"],
    weaknesses: ["Not a system of record - typically synced from a primary database", "Operational overhead of another data store"],
    typicalUseCases: ["Search bars over posts/products/users", "Log analytics"],
    scalingCharacteristics: "Scales horizontally via sharding across nodes.",
    consistencyCharacteristics: "Eventually consistent with the source database it's synced from.",
    latencyCharacteristics: "Low latency for search queries, even across large datasets.",
    costConsiderations: "Additional infrastructure cost; only justified when simple database queries (e.g. SQL LIKE) aren't sufficient.",
    alternatives: [],
  },
];

export function getTechnology(id: string): Technology {
  const tech = TECHNOLOGIES.find((t) => t.id === id);
  if (!tech) throw new Error(`Unknown technology id: ${id}`);
  return tech;
}
