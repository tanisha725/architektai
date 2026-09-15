import type { AIEntity } from "@/lib/schemas/architecture-schema";
import type { Column, DatabaseSchema, Relationship, Table } from "@/types/database";
import type { ApiEndpoint } from "@/types/api";

// Converts the AI's domain entities (e.g. "orders", "restaurants" for a food
// delivery system) into our DatabaseSchema shape - deterministic code, no
// further AI call. This is what makes the schema domain-aware "for free"
// once the architecture generator already reasoned about the domain.
export function generateDatabaseSchemaFromEntities(entities: AIEntity[]): DatabaseSchema {
  const tables: Table[] = entities.map((entity) => {
    const fkFields = new Set(entity.relationships.map((r) => r.fromField));

    const columns: Column[] = [
      { name: "id", type: "UUID", isPrimaryKey: true },
      ...entity.fields
        .filter((f) => f.name !== "id")
        .map((f): Column => ({
          name: f.name,
          type: f.type === "ENUM" && f.enumValues ? `ENUM(${f.enumValues.join(", ")})` : f.type,
          isForeignKey: fkFields.has(f.name),
          references: fkFields.has(f.name)
            ? `${entity.relationships.find((r) => r.fromField === f.name)?.targetEntity}.id`
            : undefined,
        })),
      { name: "created_at", type: "TIMESTAMP" },
    ];

    return { name: entity.name, columns, reason: entity.purpose };
  });

  const relationships: Relationship[] = entities.flatMap((entity) =>
    entity.relationships.map(
      (rel): Relationship => ({
        description: rel.description,
        from: `${entity.name}.${rel.fromField}`,
        to: `${rel.targetEntity}.id`,
      })
    )
  );

  return { tables, relationships };
}

function singularize(name: string): string {
  return name.endsWith("ies") ? `${name.slice(0, -3)}y` : name.endsWith("s") ? name.slice(0, -1) : name;
}

export function generateApiEndpointsFromEntities(entities: AIEntity[]): ApiEndpoint[] {
  return entities.flatMap((entity): ApiEndpoint[] => {
    const singular = singularize(entity.name);
    const fieldNames = entity.fields.filter((f) => f.name !== "id").map((f) => f.name);
    const shape = `{ ${fieldNames.join(", ")} }`;

    return [
      {
        method: "POST",
        path: `/api/${entity.name}`,
        purpose: `Create a new ${singular}.`,
        requestBody: shape,
        response: `201 { id, ${fieldNames.join(", ")}, createdAt }`,
        requiresAuth: true,
        possibleErrors: ["400 invalid input", "401 not authenticated"],
      },
      {
        method: "GET",
        path: `/api/${entity.name}/:id`,
        purpose: `Fetch a single ${singular}.`,
        response: `200 { id, ${fieldNames.join(", ")}, createdAt }`,
        requiresAuth: false,
        possibleErrors: [`404 ${singular} not found`],
      },
      {
        method: "GET",
        path: `/api/${entity.name}`,
        purpose: `List ${entity.name}.`,
        response: `200 [ { id, ${fieldNames.join(", ")} } ]`,
        requiresAuth: false,
        possibleErrors: ["400 invalid query parameters"],
      },
      {
        method: "DELETE",
        path: `/api/${entity.name}/:id`,
        purpose: `Delete a ${singular}.`,
        response: "204 no content",
        requiresAuth: true,
        possibleErrors: ["401 not authenticated", "403 not authorized", `404 ${singular} not found`],
      },
    ];
  });
}
