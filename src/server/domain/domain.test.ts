import { describe, expect, it } from "vitest";
import { daysRemaining, daysUntilOpening, deadlineState } from "@/server/domain/deadlines";
import { completeness, isFilled } from "@/server/domain/completeness";
import { duplicateAssessment } from "@/server/domain/duplicates";
import { normalizeText, normalizeUrl, passwordIssues } from "@/server/domain/text";
import { canTransition, permissionsForTransition } from "@/server/domain/workflow";
import { verificationProgress } from "@/server/domain/verification";
import { validateCustomFields } from "@/server/domain/custom-fields";
import { assessInvitation, hashToken, tokensMatch } from "@/server/domain/invitations";
import { hasAnyPermission, hasPermission } from "@/server/permissions/catalog";

describe("permissions", () => {
  it("checks granted permissions without looking at role names", () => {
    const granted = ["scholarship.read", "content.publish"];
    expect(hasPermission(granted, "scholarship.read")).toBe(true);
    expect(hasPermission(granted, "scholarship.delete")).toBe(false);
    expect(hasAnyPermission(granted, ["content.design", "content.publish"])).toBe(true);
  });
});

describe("deadlines", () => {
  const now = new Date("2026-10-13T12:00:00Z");

  it("does not invent a state when dates are missing", () => {
    expect(deadlineState({ now })).toBe("unknown");
    expect(daysRemaining({ now })).toBeNull();
    expect(daysUntilOpening({ now })).toBeNull();
  });

  it("classifies closing windows from the calendar in the given timezone", () => {
    expect(deadlineState({ closingDate: "2026-10-20T00:00:00Z", now, warningDays: 14 })).toBe("closing_soon");
    expect(deadlineState({ closingDate: "2026-12-01T00:00:00Z", now, warningDays: 14 })).toBe("upcoming");
    expect(deadlineState({ closingDate: "2026-10-01T00:00:00Z", now })).toBe("closed");
    expect(daysRemaining({ closingDate: "2026-10-20T23:00:00Z", now, timeZone: "UTC" })).toBe(7);
  });

  it("keeps an opening date without a closing date upcoming", () => {
    expect(deadlineState({ openingDate: "2026-11-01T00:00:00Z", now })).toBe("upcoming");
    expect(daysUntilOpening({ openingDate: "2026-10-13T00:00:00Z", now, timeZone: "UTC" })).toBe(0);
  });
});

describe("completeness", () => {
  it("ignores optional blanks and accepts explicit unknown required facts", () => {
    expect(isFilled("", "unknown")).toBe(true);
    expect(isFilled("", "known")).toBe(false);
    const result = completeness(
      { name: "Example", provider: "Org", countryId: "abc", officialUrl: "" },
      ["name", "provider", "countryId", "officialUrl", "notes"],
      { officialUrl: "not_public" },
    );
    expect(result.missing).toEqual(["notes"]);
    expect(result.percent).toBe(80);
  });
});

describe("duplicates", () => {
  it("normalizes case, punctuation, and url host variants", () => {
    expect(normalizeText("  KAIST,  Daejeon ")).toBe("kaist daejeon");
    expect(normalizeUrl("HTTPS://WWW.Example.edu/apply/")).toBe("example.edu/apply");
  });

  it("flags a scholarship when the official url matches", () => {
    const result = duplicateAssessment([
      { key: "name", weight: 0.35, kind: "text", strong: true, left: "Global Grant", right: "Global Grant!" },
      { key: "provider", weight: 0.2, kind: "text", left: "Ministry", right: "Ministry" },
      { key: "country", weight: 0.1, kind: "exact", left: "kr", right: "kr" },
      { key: "url", weight: 0.35, kind: "url", strong: true, left: "https://www.ministry.go.kr/grant", right: "http://ministry.go.kr/grant/" },
    ]);
    expect(result.possible).toBe(true);
    expect(result.reasons).toContain("url");
  });

  it("does not flag records that only share a country", () => {
    const result = duplicateAssessment([
      { key: "name", weight: 0.5, kind: "text", strong: true, left: "Alpha Scholarship", right: "Beta Fellowship" },
      { key: "country", weight: 0.2, kind: "exact", left: "kr", right: "kr" },
    ]);
    expect(result.possible).toBe(false);
  });
});

describe("content workflow", () => {
  it("requires an explicit publish permission and blocks skipping to published", () => {
    expect(canTransition("ready_to_publish", "published")).toBe(true);
    expect(canTransition("draft", "published")).toBe(false);
    expect(permissionsForTransition("published")).toEqual(["content.publish"]);
    expect(permissionsForTransition("ready_to_publish")).toContain("content.review");
  });
});

describe("verification", () => {
  it("calculates progress, missing required items, and corrections", () => {
    const progress = verificationProgress([
      { key: "source", required: true, state: "checked" },
      { key: "dates", required: true, state: "not_checked" },
      { key: "fee", required: false, state: "not_applicable" },
      { key: "name", required: true, state: "needs_correction" },
    ]);
    expect(progress.percent).toBe(33);
    expect(progress.missingRequired).toEqual(["dates", "name"]);
    expect(progress.corrections).toEqual(["name"]);
  });
});

describe("custom fields", () => {
  it("validates types and rejects unknown keys", () => {
    const result = validateCustomFields(
      [
        { fieldKey: "award", label: "Award", type: "currency", required: true },
        { fieldKey: "track", label: "Track", type: "single_select", options: ["A", "B"] },
      ],
      { award: "1200", track: "C", extra: "nope" },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.track).toBeTruthy();
    expect(result.errors.extra).toBeTruthy();
    expect(result.normalized.award).toBe(1200);
  });
});

describe("invitations", () => {
  it("stores only a hash and rejects expired, used, and revoked tokens", () => {
    const hash = hashToken("secret-token");
    expect(hash).not.toContain("secret-token");
    expect(tokensMatch("secret-token", hash)).toBe(true);
    expect(tokensMatch("other-token", hash)).toBe(false);
    const now = new Date("2026-10-13T00:00:00Z");
    expect(assessInvitation({ status: "pending", expiresAt: "2026-10-20T00:00:00Z" }, now)).toBe("valid");
    expect(assessInvitation({ status: "pending", expiresAt: "2026-10-01T00:00:00Z" }, now)).toBe("expired");
    expect(assessInvitation({ status: "accepted", expiresAt: "2026-10-20T00:00:00Z" }, now)).toBe("used");
    expect(assessInvitation({ status: "revoked", expiresAt: "2026-10-20T00:00:00Z" }, now)).toBe("revoked");
    expect(assessInvitation(null, now)).toBe("invalid");
  });

  it("requires a long password with a letter and a number", () => {
    expect(passwordIssues("short")).toHaveLength(2);
    expect(passwordIssues("correct-horse-9")).toEqual([]);
  });
});
