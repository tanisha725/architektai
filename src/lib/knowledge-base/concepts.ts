// Abstract system-design PATTERNS, as opposed to TECHNOLOGIES (technologies.ts).
// A technology is a specific product you'd install (Redis, PostgreSQL); a
// concept is a general strategy that could be implemented with several
// different technologies (e.g. "sharding" applies to Postgres, MongoDB,
// Elasticsearch alike). Kept deliberately small (8 entries) - same "10-15
// items, stay maintainable" discipline as the technology knowledge base.
export interface Concept {
  id: string;
  name: string;
  simpleExplanation: string; // plain-language, no jargon, an everyday analogy
  what: string;
  why: string;
  when: string;
  example: string;
  tradeoffs: string;
  relatedTechnologyIds: string[]; // ids from technologies.ts this concept commonly uses
}

export const CONCEPTS: Concept[] = [
  {
    id: "sharding",
    name: "Sharding",
    simpleExplanation:
      "Instead of one giant filing cabinet holding every record, you use several smaller cabinets, and each record has a fixed cabinet it always goes into - so no single cabinet has to hold everything.",
    what: "Splitting one database's data across multiple separate database instances (shards), each holding a subset of the data - usually based on a key like user ID or region.",
    why: "A single database instance has a ceiling on how much data and write throughput it can handle. Sharding lets you scale writes and storage horizontally by adding more shards, instead of buying a bigger single machine forever.",
    when: "When a single database instance is genuinely the bottleneck for writes or storage - not before. Sharding adds real complexity (queries that span shards become hard, resharding later is painful), so it's a scale-driven decision, not a default.",
    example: "A food-delivery app shards its orders table by city, so Mumbai's order volume never competes with Delhi's on the same database instance.",
    tradeoffs:
      "Gains: near-linear write/storage scaling. Costs: cross-shard queries and transactions become much harder; choosing the wrong shard key can create 'hot shards' that defeat the purpose; resharding after the fact is a major migration.",
    relatedTechnologyIds: ["postgresql", "mongodb", "dynamodb"],
  },
  {
    id: "replication",
    name: "Replication",
    simpleExplanation:
      "Keeping one or more up-to-date copies of your data on separate machines, so if the main copy's machine dies, a copy is already there ready to take over.",
    what: "Continuously copying a database's data to one or more additional servers (replicas), which can serve reads and/or stand ready to take over if the primary fails.",
    why: "A single database server is a single point of failure, and it has a limit on how many simultaneous readers it can serve. Replication addresses both: replicas serve read traffic, and one can be promoted if the primary dies.",
    when: "Almost always worth having at least one replica for anything beyond a small side project - it's relatively cheap insurance against both hardware failure and read-traffic bottlenecks.",
    example: "An Instagram-like app sends all profile-writes to the primary database but routes the much higher volume of feed-reads to read replicas.",
    tradeoffs:
      "Gains: read scalability and failure resilience. Costs: replicas usually lag the primary by a small amount (replication lag), so a read immediately after a write can return stale data unless you specifically read from the primary for that case.",
    relatedTechnologyIds: ["postgresql", "mongodb", "redis"],
  },
  {
    id: "sql-vs-nosql",
    name: "SQL vs. NoSQL",
    simpleExplanation:
      "SQL databases are like a spreadsheet with strict, predefined columns everyone has to follow. NoSQL databases are like a box where each item can have a totally different shape.",
    what: "SQL (relational) databases store data in fixed-schema tables with strong relationships and transactions (e.g. PostgreSQL, MySQL). NoSQL databases relax that structure for flexibility or scale, in different ways: document stores (MongoDB), key-value stores (DynamoDB), wide-column, or graph databases.",
    why: "This is one of the first, most consequential choices in a data model - it affects how easy it is to change your schema later, how you scale, and what consistency guarantees you get for free.",
    when: "Reach for SQL when your data is genuinely relational and you need transactions (orders, payments, anything with strict consistency needs). Reach for NoSQL when your data's shape varies a lot, you need to scale writes horizontally with minimal operational effort, or your access patterns are simple key lookups at massive scale.",
    example: "An e-commerce order/payment system uses PostgreSQL (needs transactions); a product catalog with wildly different attributes per category might use MongoDB instead.",
    tradeoffs:
      "SQL gains: strong consistency, rich queries, mature tooling. SQL costs: harder to scale writes horizontally, rigid schema. NoSQL gains: flexible schema, easier horizontal scaling. NoSQL costs: weaker consistency guarantees (historically), awkward multi-record joins.",
    relatedTechnologyIds: ["postgresql", "mongodb", "dynamodb"],
  },
  {
    id: "microservices-vs-monolith",
    name: "Microservices vs. Monolith",
    simpleExplanation:
      "A monolith is one big restaurant kitchen where every chef works in the same room. Microservices is many small kitchens, each responsible for one dish, passing plates to each other.",
    what: "A monolith is a single deployable application containing all business logic. Microservices split that logic into multiple independently deployable services that communicate over a network.",
    why: "As a team and codebase grow, a monolith can become hard to change safely (everyone touches the same code) and hard to scale selectively (you scale the whole app even if only one part is under load). Microservices let teams deploy independently and scale only the parts that need it.",
    when: "Start with a monolith almost always - it's simpler to build, test, and deploy, and most products never reach the team size or scale where a monolith's downsides outweigh microservices' operational cost (network calls, distributed debugging, service discovery). Split out a service only when a specific, real pain point justifies it.",
    example: "A startup begins with one Next.js app handling everything. Years later, its video transcoding workload is split into its own service because it has wildly different scaling needs (CPU-bound, spiky) than the rest of the app.",
    tradeoffs:
      "Monolith gains: simplicity, easy local development, one deployment. Monolith costs: the whole app scales together, one team's bug can affect everyone. Microservices gains: independent scaling and deployment. Microservices costs: network calls replace function calls (latency, partial failure), operational complexity multiplies.",
    relatedTechnologyIds: ["api-gateway", "load-balancer", "message-queue"],
  },
  {
    id: "caching-strategy",
    name: "Caching",
    simpleExplanation:
      "Keeping a quick-access copy of something you looked up recently, so next time you don't have to go all the way back to get it again.",
    what: "Storing a copy of frequently-accessed or expensive-to-compute data somewhere faster than its original source (usually in-memory), so repeat requests can be served from the fast copy instead.",
    why: "Databases and expensive computations are often far slower than reading from memory. Caching trades a small amount of staleness risk for a large latency and load reduction on the original source.",
    when: "When you have read-heavy access patterns and can tolerate the data being briefly stale (seconds to minutes, usually) - never for data that must always be perfectly fresh and consistent (e.g. an account balance right before a withdrawal).",
    example: "A social feed caches each user's computed feed for 30 seconds, since a feed doesn't need to reflect a like that happened half a second ago.",
    tradeoffs:
      "Gains: dramatically lower latency and database load for hot reads. Costs: cache invalidation (knowing when to update/clear a cached value) is a genuinely hard problem; a cache adds a component that can itself fail or get out of sync.",
    relatedTechnologyIds: ["redis", "cdn"],
  },
  {
    id: "cap-theorem",
    name: "CAP Theorem",
    simpleExplanation:
      "If part of your system loses contact with the rest (a network hiccup), you can't have both 'everyone sees the exact same data' and 'everyone gets an instant answer' at the same time - you have to pick one to sacrifice, temporarily.",
    what: "A distributed system can only guarantee two of three properties at once during a network partition: Consistency (everyone sees the same data), Availability (every request gets a response), and Partition tolerance (the system keeps working despite network failures between nodes).",
    why: "Network partitions are a fact of distributed systems - links between servers do fail. CAP theorem forces an explicit, conscious choice about what happens when that occurs, rather than leaving it as an accident of implementation.",
    when: "This is a lens for evaluating any distributed data store, not a decision you make directly - when picking a database, ask 'what does this system do during a network partition' and match that to what your product actually needs.",
    example: "DynamoDB defaults to prioritizing availability (you'll get an answer, possibly slightly stale) over strict consistency; a banking ledger typically prioritizes consistency (it'll refuse a request rather than risk two different balances).",
    tradeoffs:
      "This isn't a choice with a 'better' side - it's about which failure mode a specific feature can tolerate. A social media like-count can tolerate brief inconsistency; a payment cannot.",
    relatedTechnologyIds: ["postgresql", "dynamodb", "mongodb"],
  },
  {
    id: "rate-limiting",
    name: "Rate Limiting",
    simpleExplanation:
      "A bouncer at the door who only lets in a certain number of people per minute, no matter how many show up at once.",
    what: "Restricting how many requests a client (a user, an IP, an API key) can make in a given time window, rejecting or delaying requests beyond that limit.",
    why: "Without it, a single misbehaving client (buggy retry loop, scraper, or deliberate abuse) can consume resources meant for everyone else, or overwhelm the system entirely.",
    when: "On any public-facing API, essentially always - it's cheap insurance. Also used internally between services to prevent one overloaded service from cascading failure into another.",
    example: "An API Gateway rejects a client's requests with a 429 status code once they exceed 100 requests/minute, protecting the backend services behind it.",
    tradeoffs:
      "Gains: protects system stability and fairness across clients. Costs: legitimate bursty usage can get incorrectly throttled if limits are tuned too aggressively; adds a bit of latency/complexity to every request path.",
    relatedTechnologyIds: ["api-gateway", "redis"],
  },
  {
    id: "async-processing",
    name: "Asynchronous Processing",
    simpleExplanation:
      "Instead of making someone wait at the counter while you finish a slow task, you hand them a ticket and call them later when it's done.",
    what: "Handling work outside the request/response cycle - the user's request returns quickly (often with a 'processing' state), while the actual work happens afterward, usually via a message queue and background workers.",
    why: "Some work is inherently slow (video transcoding, sending a batch of emails, complex calculations) and doesn't need to block the user's request - doing it synchronously just makes the user wait for no benefit to them.",
    when: "When the work doesn't need to complete before you can respond to the user, and especially when it's slow, unreliable (needs retries), or bursty (needs to absorb spikes without failing).",
    example: "Uploading a video returns immediately with 'processing'; a background worker picks up the transcoding job from a queue and notifies the user once it's done.",
    tradeoffs:
      "Gains: fast, responsive user-facing requests; the system can absorb traffic spikes by queueing work instead of failing. Costs: the result isn't immediately available, so the UI has to handle a 'pending' state; failures need explicit retry/dead-letter handling since there's no caller waiting to see an error.",
    relatedTechnologyIds: ["message-queue", "video-transcoding"],
  },
];

export function getConcept(id: string): Concept {
  const concept = CONCEPTS.find((c) => c.id === id);
  if (!concept) throw new Error(`Unknown concept id: ${id}`);
  return concept;
}
