export const CUSTOM_FIELD_TYPES = [
  "text",
  "long_text",
  "number",
  "currency",
  "percentage",
  "date",
  "datetime",
  "checkbox",
  "single_select",
  "multi_select",
  "url",
  "email",
  "rating",
  "user",
  "status",
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export type CustomFieldDefinition = {
  fieldKey: string;
  label: string;
  type: CustomFieldType;
  required?: boolean;
  options?: string[];
  active?: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value: unknown) {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}

export function validateCustomValue(definition: CustomFieldDefinition, value: unknown) {
  if (definition.active === false) return { value: undefined as unknown, error: null as string | null };
  if (isBlank(value)) {
    return definition.required
      ? { value: undefined, error: `${definition.label} is required.` }
      : { value: value ?? null, error: null };
  }

  switch (definition.type) {
    case "text":
    case "long_text":
    case "status":
      return typeof value === "string" ? { value: value.trim(), error: null } : { value, error: `${definition.label} must be text.` };
    case "number":
    case "currency":
    case "percentage": {
      const number = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(number)) return { value, error: `${definition.label} must be a number.` };
      if (definition.type === "percentage" && (number < 0 || number > 100)) {
        return { value, error: `${definition.label} must be between 0 and 100.` };
      }
      return { value: number, error: null };
    }
    case "date":
    case "datetime": {
      const date = new Date(String(value));
      if (Number.isNaN(date.getTime())) return { value, error: `${definition.label} must be a valid date.` };
      return { value: date.toISOString(), error: null };
    }
    case "checkbox":
      return { value: value === true || value === "true" || value === "on", error: null };
    case "single_select": {
      const text = String(value);
      if (definition.options && !definition.options.includes(text)) return { value, error: `${definition.label} is not an allowed option.` };
      return { value: text, error: null };
    }
    case "multi_select": {
      const values = Array.isArray(value) ? value.map(String) : String(value).split(",").map((item) => item.trim()).filter(Boolean);
      if (definition.options && values.some((item) => !definition.options?.includes(item))) {
        return { value, error: `${definition.label} contains an unknown option.` };
      }
      return { value: values, error: null };
    }
    case "url": {
      try {
        const url = new URL(String(value));
        if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
        return { value: url.toString(), error: null };
      } catch {
        return { value, error: `${definition.label} must be an http or https URL.` };
      }
    }
    case "email":
      return emailPattern.test(String(value))
        ? { value: String(value).trim().toLowerCase(), error: null }
        : { value, error: `${definition.label} must be an email.` };
    case "rating": {
      const rating = Number(value);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { value, error: `${definition.label} must be a rating from 1 to 5.` };
      return { value: rating, error: null };
    }
    case "user":
      return /^[a-f\d]{24}$/i.test(String(value))
        ? { value: String(value), error: null }
        : { value, error: `${definition.label} must be a team member.` };
    default:
      return { value, error: `${definition.label} has an unsupported type.` };
  }
}

export function validateCustomFields(definitions: CustomFieldDefinition[], values: Record<string, unknown> | undefined) {
  const errors: Record<string, string> = {};
  const normalized: Record<string, unknown> = {};
  const incoming = values ?? {};
  const known = new Set(definitions.map((definition) => definition.fieldKey));

  for (const key of Object.keys(incoming)) {
    if (!known.has(key)) errors[key] = "Unknown custom field.";
  }

  for (const definition of definitions) {
    const result = validateCustomValue(definition, incoming[definition.fieldKey]);
    if (result.error) errors[definition.fieldKey] = result.error;
    else if (result.value !== undefined) normalized[definition.fieldKey] = result.value;
  }

  return { ok: Object.keys(errors).length === 0, errors, normalized };
}
