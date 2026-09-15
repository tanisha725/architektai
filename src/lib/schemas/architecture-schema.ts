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

export const AIArchitectureSchema = z.object({
  domain: z.string().describe("One short phrase identifying the product domain, e.g. 'food delivery marketplace' or 'photo/video social network'."),
  components: z.array(AIComponentSchema).min(3).max(16),
  connections: z.array(AIConnectionSchema),
  designRationale: z
    .array(z.string())
    .min(3)
    .max(8)
    .describe("The 'why this architecture' story as short bullet points, each tied to a concrete requirement, workload characteristic, or scale number - not generic statements."),
});

export type AIArchitecture = z.infer<typeof AIArchitectureSchema>;
export type AIComponent = z.infer<typeof AIComponentSchema>;
