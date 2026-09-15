import type { Architecture } from "@/types/architecture";
import type { RoadmapPhase } from "@/types/roadmap";

// Each conditional phase is keyed to a specific TECHNOLOGY id, not a
// component id - component ids are now freely chosen by the AI generator
// (e.g. "redis-cache" instead of "cache"), but technologyId is always one of
// our verified knowledge-base ids regardless of what the component is named,
// so it's the stable thing to match against.
export function generateRoadmap(architecture: Architecture): RoadmapPhase[] {
  const technologyIds = new Set(architecture.components.map((c) => c.technologyId));
  const phases: RoadmapPhase[] = [];
  let n = 1;

  phases.push({
    phaseNumber: n++,
    title: "Authentication & User Accounts",
    whatToBuild: "Registration, login, and session/token handling.",
    conceptToLearn: "Password hashing (bcrypt/argon2), sessions vs. JWTs, secure cookie handling.",
    why: "Almost every other feature depends on knowing who the current user is - this has to exist before anything user-specific can be built.",
    prerequisites: "None - this is the foundation.",
    expectedOutcome: "A user can register, log in, and stay authenticated across requests.",
  });

  phases.push({
    phaseNumber: n++,
    title: "Database Setup",
    whatToBuild: "Create the schema (tables, relationships, indexes) generated in the Database tab.",
    conceptToLearn: "Migrations, primary/foreign keys, indexing strategy.",
    why: "Every core feature needs somewhere to persist its data - building APIs before the schema exists means rework later.",
    prerequisites: "None - can be done in parallel with Phase 1.",
    expectedOutcome: "All tables exist in a real database, with migrations checked into version control.",
  });

  phases.push({
    phaseNumber: n++,
    title: "Core CRUD APIs",
    whatToBuild: "The primary create/read/update/delete endpoints from the API tab (posts, follows, etc.).",
    conceptToLearn: "REST conventions, input validation, authorization checks (is this user allowed to do this?).",
    why: "This is the actual business logic of the product - everything after this phase is about making it fast, reliable, and scalable, not adding new behavior.",
    prerequisites: "Phases 1-2 (auth + database).",
    expectedOutcome: "All endpoints from the API tab work end-to-end against the real database.",
  });

  phases.push({
    phaseNumber: n++,
    title: "Frontend",
    whatToBuild: "The UI that calls the APIs from Phase 3 - forms, feeds, profile pages.",
    conceptToLearn: "State management, calling authenticated APIs, handling loading/error states.",
    why: "The backend is now functionally complete - this phase makes it usable.",
    prerequisites: "Phase 3 (core APIs).",
    expectedOutcome: "A working end-to-end product a real user could use.",
  });

  if (technologyIds.has("redis")) {
    phases.push({
      phaseNumber: n++,
      title: "Caching Layer",
      whatToBuild: "Redis caching for the hottest reads (feed, session lookups) identified in the Architecture tab.",
      conceptToLearn: "Cache invalidation, cache-aside pattern, TTLs.",
      why: "Only worth doing once you have a working product to measure - caching too early optimizes a bottleneck you haven't confirmed exists yet.",
      prerequisites: "Phase 3-4 (a working feature to actually cache).",
      expectedOutcome: "Measurably lower latency on the endpoints identified as hot in the Architecture tab.",
    });
  }

  if (technologyIds.has("object-storage")) {
    phases.push({
      phaseNumber: n++,
      title: "Media Upload & Storage",
      whatToBuild: "Object storage integration for user-uploaded photos/videos, plus a CDN in front of it if present in the architecture.",
      conceptToLearn: "Pre-signed upload URLs, content-type validation, image/video processing pipelines.",
      why: "Media handling is a self-contained subsystem that can be built once the core product (Phase 3-4) already works without it.",
      prerequisites: "Phase 3 (posts must exist before they can have media attached).",
      expectedOutcome: "Users can upload media that's stored efficiently and served quickly.",
    });
  }

  if (technologyIds.has("message-queue")) {
    phases.push({
      phaseNumber: n++,
      title: "Async / Background Processing",
      whatToBuild: "Move notification sending (and any other non-blocking work) onto the message queue identified in the Architecture tab.",
      conceptToLearn: "Producer/consumer patterns, at-least-once delivery, idempotent job handling.",
      why: "This is a reliability and responsiveness improvement over synchronous processing, not new user-facing behavior - it belongs after the feature it's optimizing already exists.",
      prerequisites: "The feature being made asynchronous (e.g. notifications) must already work synchronously first.",
      expectedOutcome: "Slow operations no longer block the user's request; the system absorbs traffic spikes instead of failing under them.",
    });
  }

  if (technologyIds.has("elasticsearch")) {
    phases.push({
      phaseNumber: n++,
      title: "Search",
      whatToBuild: "Elasticsearch integration, synced from the primary database.",
      conceptToLearn: "Indexing strategy, keeping a search index in sync with a source of truth, ranking/relevance basics.",
      why: "Search is a genuinely separate subsystem from the core CRUD APIs - worth isolating as its own phase rather than bolting onto Phase 3.",
      prerequisites: "Phase 2-3 (the data being searched must already exist).",
      expectedOutcome: "Users can find content or other users via search, with results that stay reasonably in sync with the live data.",
    });
  }

  if (technologyIds.has("load-balancer") || technologyIds.has("api-gateway")) {
    phases.push({
      phaseNumber: n++,
      title: "Horizontal Scaling",
      whatToBuild: "Run multiple backend instances behind the load balancer/API gateway identified in the Architecture tab.",
      conceptToLearn: "Stateless service design, health checks, graceful shutdown/restart.",
      why: "This phase only makes sense once a single instance is a known bottleneck - scaling out before that is solving a problem you don't have yet.",
      prerequisites: "A working, stateless backend (Phase 3-4) and a way to measure it's actually under load.",
      expectedOutcome: "The system can handle the peak traffic estimated in the Scale tab without a single instance being a bottleneck.",
    });
  }

  if (technologyIds.has("geospatial-index")) {
    phases.push({
      phaseNumber: n++,
      title: "Geospatial Matching",
      whatToBuild: "Location indexing and proximity queries (e.g. matching drivers/delivery partners to nearby requests).",
      conceptToLearn: "Geospatial indexing (geohashing, R-trees), proximity search, trade-offs between accuracy and query speed.",
      why: "Location matching is a distinct subsystem with its own data access pattern - worth isolating once the core product (orders/trips) already works without it.",
      prerequisites: "Phase 3 (the entity being matched - an order, a ride request - must already exist).",
      expectedOutcome: "Users can be matched to nearby counterparts (drivers, delivery partners, restaurants) efficiently, not via a full table scan.",
    });
  }

  if (technologyIds.has("external-payment-provider")) {
    phases.push({
      phaseNumber: n++,
      title: "Payment Integration",
      whatToBuild: "Checkout flow integrated with an external payment provider, plus webhook handling for asynchronous payment confirmation.",
      conceptToLearn: "Webhooks, idempotency keys (to avoid double-charging on retry), handling payment failure/refund flows.",
      why: "Payment confirmation from a real provider arrives asynchronously (a webhook), not as the checkout request's direct response - this changes how the order flow must be built, and is worth understanding before building it.",
      prerequisites: "Phase 3 (an order/cart to actually charge for).",
      expectedOutcome: "A user can pay, and the system correctly reflects payment status even when the provider's confirmation arrives seconds later.",
    });
  }

  if (technologyIds.has("video-transcoding")) {
    phases.push({
      phaseNumber: n++,
      title: "Video Processing Pipeline",
      whatToBuild: "Asynchronous transcoding of uploaded video into multiple resolutions/bitrates after upload.",
      conceptToLearn: "Worker pools for CPU-intensive jobs, progress tracking for long-running async work, adaptive bitrate streaming basics.",
      why: "Transcoding takes real time (seconds to minutes) - it must run asynchronously after upload, never block the upload response, which is why it's a separate phase from basic media upload.",
      prerequisites: "Phase 6-equivalent media upload (video must be uploaded before it can be processed).",
      expectedOutcome: "Uploaded video becomes watchable in multiple qualities without the upload request itself waiting on processing.",
    });
  }

  phases.push({
    phaseNumber: n++,
    title: "Monitoring & Observability",
    whatToBuild: "Error tracking, request logging, and basic dashboards (latency, error rate, traffic).",
    conceptToLearn: "Structured logging, the difference between monitoring (is something wrong?) and observability (why is it wrong?).",
    why: "Every phase before this one was built without visibility into how it behaves in production - this phase is what lets you actually find out, and it's why it comes last, not first.",
    prerequisites: "A deployed system generating real traffic to observe.",
    expectedOutcome: "You can answer 'is the system healthy right now' and 'what broke' without guessing.",
  });

  return phases;
}
