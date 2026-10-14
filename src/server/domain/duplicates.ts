import { normalizeText, normalizeUrl } from "@/server/domain/text";

type Kind = "text" | "url" | "exact";

export type DuplicateSignal = {
  key: string;
  weight: number;
  kind: Kind;
  left?: string | null;
  right?: string | null;
  strong?: boolean;
};

function normalize(kind: Kind, value: string) {
  if (kind === "url") return normalizeUrl(value);
  if (kind === "exact") return value.trim().toLowerCase();
  return normalizeText(value);
}

export function duplicateAssessment(signals: DuplicateSignal[]) {
  let total = 0;
  let matched = 0;
  const reasons: string[] = [];
  let strongMatch = false;

  for (const signal of signals) {
    const left = signal.left?.trim();
    if (!left) continue;
    total += signal.weight;
    const right = signal.right?.trim();
    if (!right) continue;
    if (normalize(signal.kind, left) === normalize(signal.kind, right) && normalize(signal.kind, left)) {
      matched += signal.weight;
      reasons.push(signal.key);
      if (signal.strong) strongMatch = true;
    }
  }

  const score = total === 0 ? 0 : matched / total;
  return {
    score,
    reasons,
    possible: strongMatch && score >= 0.45,
  };
}
