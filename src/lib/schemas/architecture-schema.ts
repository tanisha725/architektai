import { z } from "zod";
import { TECHNOLOGIES } from "@/lib/knowledge-base/technologies";

// Built from the knowledge base's actual ids, not hand-typed - if a technology
// is added to/removed from the KB, this enum (and therefore what the AI is
// allowed to say) updates automatically, with no risk of drift between them.
const KNOWN_TECHNOLOGY_IDS = TECHNOLOGIES.map((t) => t.id) as [string, ...string[]];

export const AIComponentSchema = z.object({
  id: z.string().describe("Short kebab-case unique id, e.g. 'order-service' or 'primary-db'."),
  name: z.string().describe("Display name, e.g. 'Order Service' or 'PostgreSQL'."),
  kind: z
    .enum(["client", "gateway", "service", "database", "cache", "queue", "storage", "search", "cdn", "geospatial", "external", "compute"])
    .describe("What category this component is - used to group the diagram visually."),
  technologyId: z
    .enum(KNOWN_TECHNOLOGY_IDS)
    .nullable()
    .describe(
      "REQUIRED to be one of the exact known technology ids for infrastructure components (database/cache/queue/storage/search/cdn/geospatial/external/compute kinds). Use null ONLY for 'client', 'gateway', or 'service' kind components - these are business-logic services, not a specific infrastructure technology."
    ),
  purpose: z.string().describe("What this component does, in this specific system."),
  reason: z
    .string()
    .describe("Why THIS component is needed for THIS specific product - reference the actual domain, workflow, or scale number that justifies it. Never a generic reason that could apply to any product."),
  scalingStrategy: z
    .string()
    .describe("How this component scales as load grows. For infrastructure technologies this may be overridden by verified knowledge-base facts - still fill it in."),
  failureBehavior: z
    .string()
    .describe("What happens, specifically in this product's workflow, if this component becomes unavailable."),
});

export const AIConnectionSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().describe("Short label describing what flows over this connection, e.g. 'order events' or 'location updates'."),
});

export const AIFieldSchema = z.object({
  name: z.string().describe("Column name in snake_case, e.g. 'delivery_status'."),
  type: z.enum(["UUID", "VARCHAR", "TEXT", "INTEGER", "DECIMAL", "BOOLEAN", "TIMESTAMP", "ENUM"]),
  enumValues: z
    .array(z.string())
    .optional()
    .describe("Only for type ENUM - the allowed values, e.g. a state machine like ['CREATED','PAID','DELIVERED']."),
});

export const AIRelationshipSchema = z.object({
  fromField: z.string().describe("The foreign key column name on this entity - must also appear in this entity's fields."),
  targetEntity: z.string().describe("The name of the entity this foreign key references."),
  description: z.string().describe("Plain-language relationship description, e.g. 'Each order belongs to one restaurant.'"),
});

export const AIEntitySchema = z.object({
  name: z.string().describe("Table name in snake_case plural, e.g. 'orders' or 'delivery_partners'."),
  purpose: z.string().describe("What this entity represents and why it's needed in this specific domain."),
  fields: z.array(AIFieldSchema).min(1).max(12),
  relationships: z.array(AIRelationshipSchema),
});

export const AIFailureScenarioSchema = z.object({
  scenario: z.string().describe("A specific failure, e.g. 'Payment provider is unreachable' or 'Primary database fails over'."),
  impact: z.string().describe("What breaks for the user, specific to this product's workflow - not a generic statement."),
  mitigation: z.string().describe("How the design already limits the damage (e.g. queued retries, graceful degradation)."),
  recovery: z.string().describe("What has to happen for the system to return to normal."),
});

export const AIBottleneckSchema = z.object({
  component: z.string().describe("The component name this bottleneck applies to (must match a component's name)."),
  reason: z.string().describe("Why THIS component, at THIS scale, is the likely constraint - reference an actual scale number."),
  howToDetect: z.string().describe("A concrete signal that this bottleneck is actually happening (a metric, a symptom)."),
  mitigation: z.string().describe("What to do about it, and importantly, at what point it's actually worth doing (don't over-engineer early)."),
});

export const AITenXScaleSchema = z.object({
  fromScale: z.string().describe("Current scale in one short phrase, e.g. '5M users'."),
  toScale: z.string().describe("10x scale in one short phrase, e.g. '50M users'."),
  changes: z
    .array(z.string())
    .min(2)
    .max(6)
    .describe("What would need to change and why, each tied to a specific new problem 10x scale introduces - not a generic 'add more servers'."),
});

export const AIArchitectureSchema = z.object({
  domain: z.string().describe("One short phrase identifying the product domain, e.g. 'food delivery marketplace' or 'photo/video social network'."),
  components: z.array(AIComponentSchema).min(3).max(16),
  connections: z.array(AIConnectionSchema),
  designRationale: z
    .array(z.string())
    .min(3)
    .max(8)
    .describe("The 'why this architecture' story as short bullet points, each tied to a concrete requirement, workload characteristic, or scale number - not generic statements."),
  entities: z
    .array(AIEntitySchema)
    .min(1)
    .max(10)
    .describe("The domain's data entities (e.g. for food delivery: orders, restaurants, menu_items - NOT generic entities from a different domain)."),
  failureScenarios: z
    .array(AIFailureScenarioSchema)
    .min(3)
    .max(6)
    .describe("Realistic failure scenarios specific to this product's domain and architecture - not generic 'the database goes down' for every product."),
  bottlenecks: z
    .array(AIBottleneckSchema)
    .min(2)
    .max(5)
    .describe("The most likely bottlenecks given this specific workload, scale, and architecture."),
  tenXScale: AITenXScaleSchema,
});

export type AIArchitecture = z.infer<typeof AIArchitectureSchema>;
export type AIComponent = z.infer<typeof AIComponentSchema>;
export type AIEntity = z.infer<typeof AIEntitySchema>;
export type AIFailureScenario = z.infer<typeof AIFailureScenarioSchema>;
export type AIBottleneck = z.infer<typeof AIBottleneckSchema>;
export type AITenXScale = z.infer<typeof AITenXScaleSchema>;
