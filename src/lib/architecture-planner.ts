import { getTechnology, type Technology } from "@/lib/knowledge-base/technologies";
import type { Architecture, ArchitectureComponent, ArchitectureConnection } from "@/types/architecture";
import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { ScaleEstimates } from "@/types/scale";

function techNames(ids: string[]): string[] {
  return ids.map((id) => getTechnology(id).name);
}

function buildComponent(
  id: string,
  technologyId: string,
  reason: string,
  scalingStrategyOverride?: string
): ArchitectureComponent {
  const tech: Technology = getTechnology(technologyId);
  return {
    id,
    technologyId,
    name: tech.name,
    purpose: tech.description,
    reason,
    alternatives: techNames(tech.alternatives),
    tradeoffs: `Strengths: ${tech.strengths.join("; ")}. Weaknesses: ${tech.weaknesses.join("; ")}.`,
    failureBehavior: `If ${tech.name} becomes unavailable: ${describeFailure(tech)}`,
    scalingStrategy: scalingStrategyOverride ?? tech.scalingCharacteristics,
  };
}

function describeFailure(tech: Technology): string {
  switch (tech.category) {
    case "database":
      return "reads/writes relying on it fail or serve stale data from any cache in front of it; the system should return errors gracefully rather than hang.";
    case "cache":
      return "requests fall back to hitting the primary database directly - correct but slower, and the database must be able to absorb that load.";
    case "storage":
      return "media uploads/downloads fail, but core app functionality (posts, likes, auth) can continue unaffected.";
    case "queue":
      return "asynchronous work (notifications, background processing) is delayed or paused until it recovers, rather than lost, if the queue persists messages durably.";
    case "search":
      return "search functionality degrades or fails, but the system can fall back to simpler database queries for critical paths.";
    case "networking":
      return "requests may fail to reach backend servers entirely - this is why redundancy (multiple instances/zones) matters for this layer specifically.";
    default:
      return "the dependent functionality degrades; the rest of the system should stay operational if this component is properly isolated.";
  }
}

export function planArchitecture(
  requirements: AnalyzedRequirements,
  scale: ScaleEstimates
): Architecture {
  const allText = [...requirements.functional, ...requirements.nonFunctional, ...requirements.assumptions]
    .map((r) => r.text.toLowerCase())
    .join(" | ");

  const hasMedia = /photo|video|media|upload/.test(allText);
  const needsLowLatency = /real-time|low latency/.test(allText);
  const isReadHeavy = /read-heavy/.test(allText);
  const needsSearch = /search/.test(allText);
  const needsAsyncWork = /notif|message/.test(allText);
  const isLargeScale = scale.dau > 500_000 || scale.peakQps > 1_000;

  const components: ArchitectureComponent[] = [];
  const connections: ArchitectureConnection[] = [];

  // Always present: client and backend are conceptual, not tied to a specific technology.
  components.push({
    id: "client",
    technologyId: "client",
    name: "Client",
    purpose: "The web or mobile app the user directly interacts with.",
    reason: "Every system needs an entry point for users.",
    alternatives: [],
    tradeoffs: "N/A - this is the user-facing layer, not a technology choice.",
    failureBehavior: "N/A - represents the user's device, not server infrastructure.",
    scalingStrategy: "N/A - scales with user adoption, not server provisioning.",
  });

  components.push({
    id: "backend",
    technologyId: "backend",
    name: "Backend Service",
    purpose: "Handles business logic: processes requests, talks to the database and other components.",
    reason: "Every system needs a layer to implement its actual behavior beyond raw data storage.",
    alternatives: ["Monolith vs. microservices (kept as a single service here given current scope)"],
    tradeoffs: "A single backend service is simpler to build and deploy, at the cost of scaling and deploying everything together.",
    failureBehavior: "If an instance crashes, requests to it fail until a load balancer (if present) routes around it or it restarts.",
    scalingStrategy: isLargeScale
      ? "Run multiple stateless instances behind a load balancer, scaling horizontally with traffic."
      : "A single instance is sufficient at this scale; revisit if traffic grows.",
  });

  // Build the "front door" chain (client -> [gateway] -> [load balancer] -> backend)
  // as an explicit ordered list, then connect each consecutive pair - avoids
  // fragile array-splicing when gateway/load-balancer are conditionally present.
  const frontChain = ["client"];

  if (isLargeScale) {
    components.push(
      buildComponent(
        "api-gateway",
        "api-gateway",
        "Traffic and user count are large enough to justify centralizing auth, rate limiting, and routing in front of the backend."
      )
    );
    frontChain.push("api-gateway");
  }

  if (isLargeScale) {
    components.push(
      buildComponent(
        "load-balancer",
        "load-balancer",
        `Peak load is estimated at ~${Math.round(scale.peakQps).toLocaleString()} requests/sec, which requires multiple backend instances - a load balancer is needed to distribute traffic across them.`
      )
    );
    frontChain.push("load-balancer");
  }

  frontChain.push("backend");
  for (let i = 0; i < frontChain.length - 1; i++) {
    connections.push({ from: frontChain[i], to: frontChain[i + 1], label: "requests" });
  }

  // Primary database - always present; every one of our functional requirements implies persisted, related data.
  components.push(
    buildComponent(
      "primary-db",
      "postgresql",
      "The requirements describe structured, related data (users, posts, relationships) that benefits from relational integrity and transactions."
    )
  );
  connections.push({ from: "backend", to: "primary-db", label: "reads/writes" });

  // Cache - justified by explicit low-latency needs or a read-heavy workload assumption.
  if (needsLowLatency || isReadHeavy) {
    components.push(
      buildComponent(
        "cache",
        "redis",
        needsLowLatency
          ? "The description implies real-time interactions, which need latency lower than a database round-trip alone can reliably provide."
          : "The workload is assumed to be read-heavy (e.g. viewing feeds) - caching hot reads reduces load on the primary database."
      )
    );
    connections.push({ from: "backend", to: "cache", label: "cache reads/writes" });
  }

  // Object storage + CDN - justified by media upload requirements.
  if (hasMedia) {
    components.push(
      buildComponent(
        "object-storage",
        "object-storage",
        "The requirements include uploading photos/videos - large binary files are expensive and inefficient to store directly in a relational database."
      )
    );
    connections.push({ from: "backend", to: "object-storage", label: "media upload/download" });

    if (isLargeScale) {
      components.push(
        buildComponent(
          "cdn",
          "cdn",
          "At this user scale, media is likely accessed by geographically distributed users - a CDN caches it near them instead of serving every request from origin storage."
        )
      );
      connections.push({ from: "object-storage", to: "cdn", label: "cached delivery" });
    }
  }

  // Message queue - justified by async-friendly features (notifications, messaging) at meaningful scale.
  if (needsAsyncWork && isLargeScale) {
    components.push(
      buildComponent(
        "message-queue",
        "message-queue",
        "Notifications/messaging don't need to block the user's request - a queue lets the backend hand off this work and respond immediately, absorbing spikes."
      )
    );
    connections.push({ from: "backend", to: "message-queue", label: "async jobs" });
  }

  // Search - justified only if a search feature is explicitly present.
  if (needsSearch) {
    components.push(
      buildComponent(
        "search",
        "elasticsearch",
        "The requirements include a search feature - full-text/flexible search is impractical to build efficiently on the primary relational database alone at scale."
      )
    );
    connections.push({ from: "backend", to: "search", label: "search queries" });
  }

  return { components, connections };
}
