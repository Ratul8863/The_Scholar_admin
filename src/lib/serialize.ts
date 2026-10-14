export function serialize(value: unknown): unknown {
  if (value == null) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("toHexString" in value && typeof value.toHexString === "function") return value.toHexString();
    if (Array.isArray(value)) return value.map((item) => serialize(item));
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (key === "__v" || key === "passwordHash" || key === "tokenHash") continue;
      output[key === "_id" ? "id" : key] = serialize(item);
    }
    return output;
  }
  return value;
}

export function asRecord(value: unknown) {
  return serialize(value) as Record<string, unknown>;
}
