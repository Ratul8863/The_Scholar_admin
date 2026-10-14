export const CHECK_STATES = ["checked", "not_checked", "needs_correction", "not_applicable"] as const;
export type CheckState = (typeof CHECK_STATES)[number];

export type ChecklistItem = {
  key: string;
  label?: string;
  required: boolean;
  state: CheckState;
};

export function verificationProgress(items: ChecklistItem[]) {
  const applicable = items.filter((item) => item.state !== "not_applicable");
  const checked = applicable.filter((item) => item.state === "checked").length;
  const missing = items.filter((item) => item.required && item.state !== "checked" && item.state !== "not_applicable");
  const corrections = items.filter((item) => item.state === "needs_correction");
  const percent = applicable.length === 0 ? 100 : Math.round((checked / applicable.length) * 100);
  return {
    percent,
    checked,
    applicable: applicable.length,
    missingRequired: missing.map((item) => item.label || item.key),
    corrections: corrections.map((item) => item.label || item.key),
  };
}
