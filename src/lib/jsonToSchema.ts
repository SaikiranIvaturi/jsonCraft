type Schema = Record<string, unknown>;

function inferSchema(value: unknown): Schema {
  if (value === null) return { type: "null" };
  if (typeof value === "boolean") return { type: "boolean" };
  if (typeof value === "number")
    return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
  if (typeof value === "string") return { type: "string" };

  if (Array.isArray(value)) {
    if (!value.length) return { type: "array", items: {} };
    const itemSchemas = value.map(inferSchema);
    return { type: "array", items: mergeSchemas(itemSchemas) };
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const properties: Record<string, Schema> = {};
    const required: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      properties[key] = inferSchema(val);
      required.push(key);
    }
    const schema: Schema = { type: "object", properties };
    if (required.length) schema.required = required;
    return schema;
  }

  return {};
}

function mergeSchemas(schemas: Schema[]): Schema {
  if (!schemas.length) return {};
  if (schemas.length === 1) return schemas[0];

  const types = [...new Set(schemas.map((s) => s.type as string).filter(Boolean))];
  if (types.length > 1) {
    const deduped = [...new Map(schemas.map((s) => [JSON.stringify(s), s])).values()];
    return { anyOf: deduped };
  }

  const type = types[0];
  if (type === "object") return mergeObjectSchemas(schemas);
  if (type === "array") {
    const allItems = schemas.map((s) => s.items as Schema).filter(Boolean);
    return { type: "array", items: mergeSchemas(allItems) };
  }
  return schemas[0];
}

function mergeObjectSchemas(schemas: Schema[]): Schema {
  const allKeys = [
    ...new Set(
      schemas.flatMap((s) => Object.keys((s.properties ?? {}) as Record<string, Schema>)),
    ),
  ];
  const properties: Record<string, Schema> = {};
  const requiredInAll: string[] = [];

  for (const key of allKeys) {
    const keySchemas = schemas
      .filter((s) => (s.properties as Record<string, Schema> | undefined)?.[key])
      .map((s) => (s.properties as Record<string, Schema>)[key]);
    properties[key] = mergeSchemas(keySchemas);
    const allRequired = schemas.every((s) => ((s.required ?? []) as string[]).includes(key));
    if (allRequired) requiredInAll.push(key);
  }

  const merged: Schema = { type: "object", properties };
  if (requiredInAll.length) merged.required = requiredInAll;
  return merged;
}

export function jsonToSchema(jsonStr: string): string {
  const parsed: unknown = JSON.parse(jsonStr);
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    ...inferSchema(parsed),
  };
  return JSON.stringify(schema, null, 2);
}
