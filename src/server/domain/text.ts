export function normalizeText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return normalizeText(trimmed);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const path = decodeURIComponent(url.pathname).replace(/\/+$/, "").toLowerCase();
    const search = url.searchParams.toString();
    return `${host}${path}${search ? `?${search}` : ""}`;
  } catch {
    return normalizeText(trimmed);
  }
}

export function safeHttpUrl(value: string | null | undefined) {
  if (!value || !value.trim()) return undefined;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return { error: "Enter a valid http or https URL." } as const;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { error: "Only http and https links are allowed." } as const;
  }
  return { url: url.toString() } as const;
}

export function calendarDay(date: Date, timeZone = "UTC") {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
}

export function daysUntil(target: Date, now: Date, timeZone = "UTC") {
  const start = Date.parse(`${calendarDay(now, timeZone)}T00:00:00Z`);
  const end = Date.parse(`${calendarDay(target, timeZone)}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

export function passwordIssues(password: string) {
  const issues: string[] = [];
  if (password.length < 12) issues.push("Use at least 12 characters.");
  if (!/[A-Za-z]/.test(password)) issues.push("Include a letter.");
  if (!/[0-9]/.test(password)) issues.push("Include a number.");
  return issues;
}

export function readPath(record: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, record);
}
