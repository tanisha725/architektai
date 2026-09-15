import type { Architecture } from "@/types/architecture";
import type { RoadmapPhase } from "@/types/roadmap";

// Each conditional phase is keyed to a specific component id from the
// generated architecture - same "traceable to a concrete trigger" discipline
// as every other generator in this app. The roadmap is a direct consequence
// of what was actually generated, not a generic checklist.
export function generateRoadmap(architecture: Architecture): RoadmapPhase[] {
  const componentIds = new Set(architecture.components.map((c) => c.id));
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

  if (componentIds.has("cache")) {
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

  if (componentIds.has("object-storage")) {
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

  if (componentIds.has("message-queue")) {
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

  if (componentIds.has("search")) {
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

  if (componentIds.has("load-balancer") || componentIds.has("api-gateway")) {
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
