import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createRawToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function tokensMatch(rawToken: string, storedHash: string) {
  const actual = Buffer.from(hashToken(rawToken));
  const expected = Buffer.from(storedHash);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export type InvitationState = "valid" | "invalid" | "expired" | "used" | "revoked";

export function assessInvitation(
  invite: { status: string; expiresAt: Date | string } | null,
  now = new Date(),
): InvitationState {
  if (!invite) return "invalid";
  if (invite.status === "revoked") return "revoked";
  if (invite.status === "accepted") return "used";
  if (invite.status !== "pending") return "invalid";
  const expires = invite.expiresAt instanceof Date ? invite.expiresAt : new Date(invite.expiresAt);
  if (Number.isNaN(expires.getTime()) || expires.getTime() <= now.getTime()) return "expired";
  return "valid";
}
