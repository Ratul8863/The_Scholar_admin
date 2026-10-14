export const CONTENT_STATUSES = [
  "idea",
  "researching",
  "draft",
  "ready_for_design",
  "designing",
  "ready_for_review",
  "correction_required",
  "ready_to_publish",
  "published",
  "archived",
  "unpublished",
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

const transitions: Record<ContentStatus, ContentStatus[]> = {
  idea: ["researching", "archived"],
  researching: ["draft", "idea", "archived"],
  draft: ["ready_for_design", "researching", "archived"],
  ready_for_design: ["designing", "draft", "archived"],
  designing: ["ready_for_review", "ready_for_design", "archived"],
  ready_for_review: ["correction_required", "ready_to_publish", "designing", "archived"],
  correction_required: ["draft", "designing", "archived"],
  ready_to_publish: ["published", "correction_required", "archived"],
  published: ["unpublished", "archived"],
  unpublished: ["draft", "ready_to_publish", "archived"],
  archived: ["idea"],
};

export function canTransition(from: string, to: string) {
  if (!(from in transitions)) return false;
  return transitions[from as ContentStatus].includes(to as ContentStatus);
}

export function permissionsForTransition(to: string) {
  if (to === "published" || to === "unpublished") return ["content.publish"];
  if (to === "designing" || to === "ready_for_design") return ["content.design", "content.update"];
  if (to === "ready_for_review" || to === "correction_required" || to === "ready_to_publish") {
    return ["content.review", "content.update"];
  }
  return ["content.update"];
}

export function assertTransition(from: string, to: string) {
  if (from === to) return;
  if (!canTransition(from, to)) {
    throw new Error(`Cannot move content from ${from} to ${to}.`);
  }
}
