import { daysUntil } from "@/server/domain/text";

export type DeadlineState = "upcoming" | "closing_soon" | "closed" | "unknown";

export type DeadlineInput = {
  openingDate?: Date | string | null;
  closingDate?: Date | string | null;
  now?: Date;
  warningDays?: number;
  timeZone?: string;
};

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function deadlineState(input: DeadlineInput): DeadlineState {
  const now = input.now ?? new Date();
  const zone = input.timeZone || "UTC";
  const warningDays = input.warningDays ?? 14;
  const closing = asDate(input.closingDate);
  const opening = asDate(input.openingDate);
  if (!closing && !opening) return "unknown";
  if (!closing) return "upcoming";
  const remaining = daysUntil(closing, now, zone);
  if (remaining < 0) return "closed";
  if (remaining <= warningDays) return "closing_soon";
  return "upcoming";
}

export function daysRemaining(input: DeadlineInput) {
  const closing = asDate(input.closingDate);
  if (!closing) return null;
  return daysUntil(closing, input.now ?? new Date(), input.timeZone || "UTC");
}

export function daysUntilOpening(input: DeadlineInput) {
  const opening = asDate(input.openingDate);
  if (!opening) return null;
  return daysUntil(opening, input.now ?? new Date(), input.timeZone || "UTC");
}

export function deadlineLabel(state: DeadlineState) {
  switch (state) {
    case "upcoming":
      return "Upcoming";
    case "closing_soon":
      return "Closing soon";
    case "closed":
      return "Closed";
    default:
      return "Unknown";
  }
}
