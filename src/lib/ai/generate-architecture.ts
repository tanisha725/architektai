import { GoogleGenAI, Type } from "@google/genai";
import { getTechnology, TECHNOLOGIES } from "@/lib/knowledge-base/technologies";
import { AIArchitectureSchema, type AIArchitecture, type AIComponent } from "@/lib/schemas/architecture-schema";
import type { AnalyzedRequirements } from "@/lib/schemas/requirements-schema";
import type { ScaleEstimates } from "@/types/scale";
import type { Architecture, ArchitectureComponent } from "@/types/architecture";

// This call now generates far more structured output than when this timeout
// was first tuned (Phase A) - architecture + domain entities + failure
// scenarios + bottlenecks + 10x-scale analysis, all in one response. 15s was
// too short and caused genuine DEADLINE_EXCEEDED errors even at 30s, not just
// quota issues. Verified Vercel's Fluid Compute default (300s on Hobby) isn't
// the binding constraint here, so there's room to give this real generation
// time rather than fail fast. A single longer attempt (no retry) still bounds
// worst-case latency better than two attempts that both fail the same way -
// if it still fails, the user has an explicit "Regenerate" button.
const HTTP_OPTIONS = { timeout: 45_000, retryOptions: { attempts: 1 } };

const KNOWLEDGE_BASE_TEXT = TECHNOLOGIES.map(
  (t) =>
    `- id: "${t.id}" | ${t.name} (${t.category})\n  What it's for: ${t.description}\n  Strengths: ${t.strengths.join("; ")}\n  Weaknesses: ${t.weaknesses.join("; ")}\n  Typical use cases: ${t.typicalUseCases.join("; ")}`
).join("\n");

const SYSTEM_PROMPT = `You are a senior system design engineer reasoning through an architecture from first principles.

Process (follow this order, don't skip to technology first):
1. Identify the product's DOMAIN and its core entities/workflows (e.g. a food-delivery product has restaurants, menus, orders, an order state machine, delivery assignment - NOT the same entities as a photo-sharing app).
2. Identify the PROBLEMS this domain creates: which operations are read-heavy vs write-heavy, which need low latency, which need strong consistency, which are naturally asynchronous, which need geospatial/search capability.
3. ONLY THEN choose components and technologies that solve those specific problems.

Rules:
- Business-logic services (kind: "client", "gateway", "service") should reflect the actual domain - name them for what they do in THIS product (e.g. "Order Service", "Delivery Matching Service"), not generic names like "Backend".
- Every infrastructure component (database/cache/queue/storage/search/cdn/geospatial/external/compute) MUST use a technologyId from the knowledge base below - you cannot invent a technology outside this list. If nothing in the list fits, omit that component rather than inventing one.
- Never claim knowledge of a real company's actual private architecture (e.g. never say "Zomato uses Kafka for X"). Instead frame recommendations as "for a system like this, X could be appropriate because...".
- Every "reason" must reference the actual domain, a specific requirement, or a specific scale number - never a generic justification that could apply to any product.
- Keep the architecture as simple as the requirements and scale actually justify - do not add a component "to look complete." A simple, well-justified architecture is better than a complex one with unjustified pieces.
- designRationale should read as the "why this architecture" story a candidate would tell in an interview.
- Also identify the domain's data ENTITIES (e.g. for food delivery: orders, restaurants, menu_items, delivery_partners - NOT generic entities like "posts" unless the product actually has posts). For any entity with a multi-step lifecycle (an order, a trip, a video upload), include a status/state field of type ENUM with the actual state values in sequence (e.g. CREATED, PAYMENT_PENDING, PAID, DELIVERED) - this is how a domain-specific state machine gets represented. Express foreign keys as a field on the entity plus a matching entry in that entity's relationships array.
- Identify realistic FAILURE SCENARIOS specific to this domain and architecture - not "the database goes down" for every product. A food-delivery payment failure and a video platform's transcoding failure are different scenarios with different impacts; write the one that's actually relevant here.
- Identify the most likely BOTTLENECKS given this specific workload and scale - reference the actual component and the actual scale number that makes it a concern.
- Provide a 10X SCALE analysis: what would need to change if user count grew 10x, and specifically why - tie each change to a concrete new problem at that scale, not a generic "add more servers."

Known technologies (the ONLY technologies you may reference by id for infrastructure components):
${KNOWLEDGE_BASE_TEXT}`;

const componentSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    kind: {
      type: Type.STRING,
      enum: ["client", "gateway", "service", "database", "cache", "queue", "storage", "search", "cdn", "geospatial", "external", "compute"],
    },
    technologyId: {
      type: Type.STRING,
      enum: [...TECHNOLOGIES.map((t) => t.id), "null"],
      nullable: true,
    },
    purpose: { type: Type.STRING },
    reason: { type: Type.STRING },
    scalingStrategy: { type: Type.STRING },
    failureBehavior: { type: Type.STRING },
  },
  required: ["id", "name", "kind", "purpose", "reason", "scalingStrategy", "failureBehavior"],
};

const fieldSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["UUID", "VARCHAR", "TEXT", "INTEGER", "DECIMAL", "BOOLEAN", "TIMESTAMP", "ENUM"] },
    enumValues: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["name", "type"],
};

const relationshipSchema = {
  type: Type.OBJECT,
  properties: {
    fromField: { type: Type.STRING },
    targetEntity: { type: Type.STRING },
    description: { type: Type.STRING },
  },
  required: ["fromField", "targetEntity", "description"],
};

const entitySchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    purpose: { type: Type.STRING },
    fields: { type: Type.ARRAY, items: fieldSchema },
    relationships: { type: Type.ARRAY, items: relationshipSchema },
  },
  required: ["name", "purpose", "fields", "relationships"],
};

const failureScenarioSchema = {
  type: Type.OBJECT,
  properties: {
    scenario: { type: Type.STRING },
    impact: { type: Type.STRING },
    mitigation: { type: Type.STRING },
    recovery: { type: Type.STRING },
  },
  required: ["scenario", "impact", "mitigation", "recovery"],
};

const bottleneckSchema = {
  type: Type.OBJECT,
  properties: {
    component: { type: Type.STRING },
    reason: { type: Type.STRING },
    howToDetect: { type: Type.STRING },
    mitigation: { type: Type.STRING },
  },
  required: ["component", "reason", "howToDetect", "mitigation"],
};

const tenXScaleSchema = {
  type: Type.OBJECT,
  properties: {
    fromScale: { type: Type.STRING },
    toScale: { type: Type.STRING },
    changes: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["fromScale", "toScale", "changes"],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    domain: { type: Type.STRING },
    components: { type: Type.ARRAY, items: componentSchema },
    connections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          from: { type: Type.STRING },
          to: { type: Type.STRING },
          label: { type: Type.STRING },
        },
        required: ["from", "to", "label"],
      },
    },
    designRationale: { type: Type.ARRAY, items: { type: Type.STRING } },
    entities: { type: Type.ARRAY, items: entitySchema },
    failureScenarios: { type: Type.ARRAY, items: failureScenarioSchema },
    bottlenecks: { type: Type.ARRAY, items: bottleneckSchema },
    tenXScale: tenXScaleSchema,
  },
  required: [
    "domain",
    "components",
    "connections",
    "designRationale",
    "entities",
    "failureScenarios",
    "bottlenecks",
    "tenXScale",
  ],
};

export async function generateArchitectureWithAI(
  description: string,
  requirements: AnalyzedRequirements,
  scale: ScaleEstimates
): Promise<AIArchitecture> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const requirementsText = [
    `Functional: ${requirements.functional.map((r) => r.text).join("; ")}`,
    `Non-functional: ${requirements.nonFunctional.map((r) => r.text).join("; ")}`,
    `Assumptions: ${requirements.assumptions.map((r) => r.text).join("; ")}`,
  ].join("\n");

  const scaleText = `${scale.dau.toLocaleString()} daily active users, ~${Math.round(scale.averageQps).toLocaleString()} average req/s, ~${Math.round(scale.peakQps).toLocaleString()} peak req/s.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: `Product description: ${description}\n\nRequirements:\n${requirementsText}\n\nScale: ${scaleText}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema,
      httpOptions: HTTP_OPTIONS,
    },
  });

  if (!response.text) throw new Error("Gemini returned an empty response.");

  const parsed = JSON.parse(response.text);
  // The model sometimes writes the literal string "null" instead of JSON null
  // for technologyId (a known quirk of enum+nullable together) - normalize it
  // before validation rather than let Zod reject an otherwise-correct response.
  for (const component of parsed.components ?? []) {
    if (component.technologyId === "null") component.technologyId = null;
  }

  return AIArchitectureSchema.parse(parsed);
}

// Converts the AI's domain reasoning into our existing Architecture type.
// Split deliberately: FACTS about a named technology (what it is, its real
// alternatives, its strengths/weaknesses) come from our verified knowledge
// base, never the model's free text. ANALYSIS specific to this product (why
// it's needed here, how it scales in this workflow, what breaks here if it
// fails) comes from the AI, since that's exactly the domain-specific
// reasoning a fixed knowledge base can't provide.
function toComponent(ai: AIComponent): ArchitectureComponent {
  if (ai.technologyId) {
    const tech = getTechnology(ai.technologyId);
    return {
      id: ai.id,
      technologyId: ai.technologyId,
      name: tech.name,
      purpose: tech.description,
      reason: ai.reason,
      alternatives: tech.alternatives.map((id) => getTechnology(id).name),
      tradeoffs: `Strengths: ${tech.strengths.join("; ")}. Weaknesses: ${tech.weaknesses.join("; ")}.`,
      failureBehavior: ai.failureBehavior,
      scalingStrategy: ai.scalingStrategy,
      kind: ai.kind,
    };
  }

  return {
    id: ai.id,
    technologyId: ai.kind,
    name: ai.name,
    purpose: ai.purpose,
    reason: ai.reason,
    alternatives: [],
    tradeoffs: "Business-logic component - trade-offs here are architectural (e.g. separate service vs. part of a monolith), not a specific technology choice.",
    failureBehavior: ai.failureBehavior,
    scalingStrategy: ai.scalingStrategy,
    kind: ai.kind,
  };
}

export function toArchitecture(ai: AIArchitecture): Architecture {
  return {
    components: ai.components.map(toComponent),
    connections: ai.connections,
    domain: ai.domain,
    designRationale: ai.designRationale,
    failureScenarios: ai.failureScenarios,
    bottlenecks: ai.bottlenecks,
    tenXScale: ai.tenXScale,
  };
}
