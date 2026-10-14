export const ERROR_CODES = [
  "validation",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "duplicate",
  "rate_limited",
  "internal",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class AppError extends Error {
  code: ErrorCode;
  details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; details?: unknown } };

export function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) {
      return { ok: false, error: { code: error.code, message: error.message, details: error.details } };
    }
    console.error(error);
    return { ok: false, error: { code: "internal", message: "Something went wrong. Try again." } };
  }
}
