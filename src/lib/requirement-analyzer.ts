import type { AnalyzedRequirements, RequirementItem } from "@/lib/schemas/requirements-schema";

// Verbs that signal "the user described an action the system must support."
// This is a heuristic, not NLP - it's why Phase 6 replaces this with an LLM.
const ACTION_VERBS = [
  "create", "register", "sign up", "login", "log in", "upload", "download",
  "follow", "unfollow", "view", "browse", "search", "like", "unlike",
  "comment", "post", "share", "message", "chat", "notify", "receive",
  "send", "delete", "edit", "update", "rate", "review", "book", "reserve",
  "purchase", "pay", "checkout", "track", "match", "recommend", "stream",
  "watch", "subscribe", "unsubscribe",
];

const actionVerbPattern = new RegExp(`\\b(${ACTION_VERBS.join("|")})\\b`, "i");

function splitIntoClauses(description: string): string[] {
  return description
    .split(/[,.]|\band\b/i)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 3);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function extractFunctionalRequirements(description: string): RequirementItem[] {
  const clauses = splitIntoClauses(description);
  const seen = new Set<string>();
  const requirements: RequirementItem[] = [];

  for (const clause of clauses) {
    if (!actionVerbPattern.test(clause)) continue;
    const text = capitalize(clause);
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    requirements.push({ text, source: "user-stated" });
  }

  return requirements;
}

// Matches things like "10 million users", "2M daily active users", "50 requests/day"
const SCALE_FACT_PATTERN =
  /\b\d[\d,]*\.?\d*\s*(million|thousand|billion|k|m|b)?\s*(registered users|daily active users|dau|users|requests(\/day|\/second)?|posts(\/day)?|photos|videos)\b/gi;

function extractScaleFacts(description: string): RequirementItem[] {
  const matches = description.match(SCALE_FACT_PATTERN) ?? [];
  const seen = new Set<string>();
  const facts: RequirementItem[] = [];

  for (const match of matches) {
    const key = match.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    facts.push({ text: capitalize(match.trim()), source: "user-stated" });
  }

  return facts;
}

function buildNonFunctionalRequirements(description: string): RequirementItem[] {
  const lower = description.toLowerCase();
  const requirements: RequirementItem[] = [
    { text: "High availability", source: "assumed" },
    { text: "Scalability under growing load", source: "assumed" },
    { text: "Data durability (no data loss)", source: "assumed" },
    { text: "Security of user data and access", source: "assumed" },
  ];

  if (/real.?time|chat|message|notif/.test(lower)) {
    requirements.push({ text: "Low latency for real-time interactions", source: "assumed" });
  }

  if (/photo|video|image|media/.test(lower)) {
    requirements.push({ text: "Efficient storage and delivery of large media files", source: "assumed" });
  }

  if (/million|billion/.test(lower)) {
    requirements.push({ text: "Horizontal scalability to handle large user base", source: "assumed" });
  }

  return requirements;
}

function buildDerivedAssumptions(description: string): RequirementItem[] {
  const lower = description.toLowerCase();
  const assumptions: RequirementItem[] = [];

  if (/feed|browse|view/.test(lower)) {
    assumptions.push({
      text: "Read-heavy workload assumed (more reads than writes)",
      source: "assumed",
    });
  }

  if (/upload|photo|video|media/.test(lower)) {
    assumptions.push({
      text: "Media storage is assumed to grow proportionally with user and post growth",
      source: "assumed",
    });
  }

  if (/million|billion/.test(lower) && !/daily active|dau/.test(lower)) {
    assumptions.push({
      text: "Daily active users assumed to be roughly 20% of total registered users",
      source: "assumed",
    });
  }

  return assumptions;
}

export function analyzeRequirements(description: string): AnalyzedRequirements {
  const functional = extractFunctionalRequirements(description);
  const scaleFacts = extractScaleFacts(description);
  const derivedAssumptions = buildDerivedAssumptions(description);
  const nonFunctional = buildNonFunctionalRequirements(description);

  return {
    functional,
    nonFunctional,
    assumptions: [...scaleFacts, ...derivedAssumptions],
  };
}
