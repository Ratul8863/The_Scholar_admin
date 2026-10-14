import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  neutral: "bg-canvas text-ink",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  teal: "bg-teal-soft text-teal",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function statusTone(value: string) {
  if (["verified", "published", "checked", "active"].includes(value)) return "success" as const;
  if (["closing_soon", "high", "needs_correction", "correction_required", "ready_to_publish"].includes(value)) return "warning" as const;
  if (["closed", "emergency", "rejected", "revoked"].includes(value)) return "danger" as const;
  if (["upcoming", "researching", "draft", "designing"].includes(value)) return "info" as const;
  return "neutral" as const;
}
