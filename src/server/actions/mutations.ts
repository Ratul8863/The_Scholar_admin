"use server";

import { revalidatePath } from "next/cache";
import { isNextRedirect, runAction, type ActionResult } from "@/lib/errors";
import { signIn, signOut } from "@/server/auth";
import { assertPermission, getCurrentUser } from "@/server/auth/current-user";
import { SavedView } from "@/models/platform";
import { oid } from "@/server/services/query";
import { addNote, addSource, assignUser } from "@/server/services/relations";
import { archiveScholarship, createScholarship, updateScholarship, type ScholarshipInput } from "@/server/services/scholarships";
import { archiveUniversity, createUniversity, saveIntake, saveProgram, saveRanking, updateUniversity } from "@/server/services/universities";
import { addPublication, archiveProfessor, bulkProfessorAction, createDepartment, createProfessor, createProfessorUniversity, updateProfessor } from "@/server/services/professors";
import { archiveEmergency, archiveOpportunity, saveEmergency, saveOpportunity } from "@/server/services/opportunities";
import { saveContent, transitionContent } from "@/server/services/content";
import { saveVerification } from "@/server/services/verification";
import { addDailyEntry } from "@/server/services/daily";
import { acceptInvitation, changeUserRole, inviteMember, revokeInvitation, setUserActive } from "@/server/services/team";
import { commitImport, parseImport } from "@/server/services/imports";
import { markNotificationsRead } from "@/server/services/notify";
import {
  saveCatalogItem,
  saveCountry,
  saveCustomField,
  saveStatus,
  saveTemplate,
  updateRolePermissions,
  updateSettings,
  type catalogs,
} from "@/server/services/settings";

function text(formData: FormData) {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
    if (code.includes("rate")) return { ok: false as const, message: "Too many attempts. Wait a few minutes and try again." };
    return { ok: false as const, message: "Email or password is incorrect." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

async function voidAction<T>(result: Promise<ActionResult<T>>) {
  const resolved = await result;
  if (!resolved.ok) throw new Error(resolved.error.message);
}

export async function acceptInviteAction(formData: FormData) {
  await voidAction(runAction(async () => {
    await acceptInvitation({
      token: String(formData.get("token") ?? ""),
      name: String(formData.get("name") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/dashboard",
    });
    return { id: "ok" };
  }));
}

async function gate(permission: string) {
  const user = await getCurrentUser();
  assertPermission(user, permission);
  return user;
}

export async function saveScholarshipAction(input: ScholarshipInput) {
  const result = await runAction(async () => {
    const user = await gate(input.version ? "scholarship.update" : "scholarship.create");
    const id = input.version ? await updateScholarship(user, String(input.id), input) : await createScholarship(user, input);
    revalidatePath("/scholarships");
    return { id };
  });
  return result;
}

export async function archiveScholarshipAction(id: string) {
  const result = await runAction(async () => {
    const user = await gate("record.archive");
    await archiveScholarship(user, id);
    revalidatePath("/scholarships");
    return { id };
  });
  return result;
}

export async function saveUniversityAction(input: Record<string, unknown>) {
  return runAction(async () => {
    const user = await gate(input.id ? "university.update" : "university.create");
    const id = input.id ? (await updateUniversity(user, String(input.id), input), String(input.id)) : await createUniversity(user, input);
    revalidatePath("/universities");
    return { id };
  });
}

export async function archiveUniversityAction(id: string) {
  return runAction(async () => {
    const user = await gate("record.archive");
    await archiveUniversity(user, id);
    revalidatePath("/universities");
    return { id };
  });
}

export async function saveProgramAction(input: Record<string, unknown>) {
  return runAction(async () => {
    const user = await gate("university.update");
    const id = await saveProgram(user, input);
    revalidatePath("/universities");
    return { id };
  });
}

export async function saveIntakeAction(input: Record<string, unknown>) {
  return runAction(async () => {
    const user = await gate("university.update");
    return { id: await saveIntake(user, input) };
  });
}

export async function saveRankingAction(input: Record<string, unknown>) {
  return runAction(async () => {
    const user = await gate("university.update");
    return { id: await saveRanking(user, input) };
  });
}

export async function saveProfessorUniversityAction(input: Record<string, unknown>) {
  return runAction(async () => {
    const user = await gate("professor.create");
    return { id: await createProfessorUniversity(user, input) };
  });
}

export async function saveDepartmentAction(input: Record<string, unknown>) {
  return runAction(async () => {
    const user = await gate("professor.create");
    return { id: await createDepartment(user, input) };
  });
}

export async function saveProfessorAction(input: Record<string, unknown>) {
  return runAction(async () => {
    const user = await gate(input.id ? "professor.update" : "professor.create");
    const id = input.id ? (await updateProfessor(user, String(input.id), input), String(input.id)) : await createProfessor(user, input);
    revalidatePath("/professors/table");
    return { id };
  });
}

export async function archiveProfessorAction(id: string) {
  return runAction(async () => {
    const user = await gate("record.archive");
    await archiveProfessor(user, id);
    return { id };
  });
}

export async function bulkArchiveProfessorsAction(ids: string[]) {
  return runAction(async () => {
    const user = await gate("record.archive");
    await bulkProfessorAction(user, ids, "archive");
    revalidatePath("/professors/table");
    return { id: "ok" };
  });
}

export async function savePublicationAction(input: Record<string, unknown>) {
  return runAction(async () => {
    const user = await gate("professor.update");
    return { id: await addPublication(user, input) };
  });
}

export async function saveOpportunityAction(input: Record<string, unknown>) {
  return runAction(async () => {
    const user = await gate(input.id ? "opportunity.update" : "opportunity.create");
    const id = await saveOpportunity(user, input);
    revalidatePath("/opportunities");
    return { id };
  });
}

export async function archiveOpportunityAction(id: string) {
  return runAction(async () => {
    const user = await gate("record.archive");
    await archiveOpportunity(user, id);
    return { id };
  });
}

export async function saveEmergencyAction(input: Record<string, unknown>) {
  return runAction(async () => {
    const user = await gate(input.id ? "emergency.update" : "emergency.create");
    const id = await saveEmergency(user, input);
    revalidatePath("/content");
    revalidatePath("/emergency");
    return { id };
  });
}

export async function archiveEmergencyAction(id: string) {
  return runAction(async () => {
    const user = await gate("record.archive");
    await archiveEmergency(user, id);
    return { id };
  });
}

export async function saveContentAction(input: Record<string, unknown>) {
  return runAction(async () => {
    const user = await gate(input.id ? "content.update" : "content.create");
    return { id: await saveContent(user, input) };
  });
}

export async function transitionContentAction(id: string, to: string, version: number) {
  return runAction(async () => {
    const user = await getCurrentUser();
    await transitionContent(user, id, to, version);
    revalidatePath("/content");
    return { id };
  });
}

export async function saveVerificationAction(input: Record<string, unknown>) {
  return runAction(async () => {
    const user = await gate("verification.update");
    const progress = await saveVerification(user, input);
    revalidatePath("/verification");
    return { id: "ok", progress };
  });
}

export async function addNoteAction(formData: FormData) {
  await voidAction(runAction(async () => {
    const user = await getCurrentUser();
    await addNote(user, String(formData.get("entityType")), String(formData.get("entityId")), String(formData.get("category") ?? "general"), String(formData.get("body") ?? ""));
    return { id: "ok" };
  }));
}

export async function addSourceAction(formData: FormData) {
  await voidAction(runAction(async () => {
    const user = await getCurrentUser();
    await addSource(user, {
      entityType: String(formData.get("entityType")),
      entityId: String(formData.get("entityId")),
      sourceName: String(formData.get("sourceName") ?? ""),
      sourceType: String(formData.get("sourceType") ?? "official"),
      url: String(formData.get("url") ?? ""),
      description: String(formData.get("description") ?? ""),
    });
    return { id: "ok" };
  }));
}

export async function assignAction(formData: FormData) {
  return runAction(async () => {
    const user = await getCurrentUser();
    await assignUser(user, {
      entityType: String(formData.get("entityType")),
      entityId: String(formData.get("entityId")),
      assignmentType: String(formData.get("assignmentType")),
      userId: String(formData.get("userId")),
      href: String(formData.get("href") ?? "/dashboard"),
      label: String(formData.get("label") ?? "Record"),
    });
    return { id: "ok" };
  });
}

export async function dailyEntryAction(formData: FormData) {
  await voidAction(runAction(async () => {
    const user = await gate("daily_work.manage");
    return { id: await addDailyEntry(user, text(formData)) };
  }));
}

export async function inviteAction(formData: FormData) {
  await voidAction(runAction(async () => {
    const user = await gate("team.manage");
    await inviteMember(user, { email: String(formData.get("email") ?? ""), name: String(formData.get("name") ?? ""), roleId: String(formData.get("roleId") ?? "") });
    revalidatePath("/team");
    return { id: "ok" };
  }));
}

export async function revokeInviteAction(id: string) {
  return runAction(async () => {
    const user = await gate("team.manage");
    await revokeInvitation(user, id);
    revalidatePath("/team");
    return { id };
  });
}

export async function setActiveAction(id: string, active: boolean) {
  return runAction(async () => {
    const user = await gate("team.manage");
    await setUserActive(user, id, active);
    revalidatePath("/team");
    return { id };
  });
}

export async function changeRoleAction(id: string, roleId: string) {
  return runAction(async () => {
    const user = await gate("team.manage");
    await changeUserRole(user, id, roleId);
    revalidatePath("/team");
    return { id };
  });
}

export async function saveCountryAction(formData: FormData) {
  await voidAction(runAction(async () => {
    const user = await gate("settings.manage");
    const id = await saveCountry(user, text(formData));
    revalidatePath("/settings");
    return { id };
  }));
}

export async function saveCatalogAction(kind: keyof typeof catalogs, formData: FormData) {
  await voidAction(runAction(async () => {
    const user = await gate("settings.manage");
    return { id: await saveCatalogItem(user, kind, text(formData)) };
  }));
}

export async function saveStatusAction(formData: FormData) {
  await voidAction(runAction(async () => {
    const user = await gate("settings.manage");
    await saveStatus(user, text(formData));
    return { id: "ok" };
  }));
}

export async function saveCustomFieldAction(formData: FormData) {
  await voidAction(runAction(async () => {
    const user = await gate("custom_fields.manage");
    await saveCustomField(user, text(formData));
    revalidatePath("/settings");
    return { id: "ok" };
  }));
}

export async function saveRolePermissionsAction(roleId: string, permissions: string[]) {
  return runAction(async () => {
    const user = await gate("settings.manage");
    await updateRolePermissions(user, roleId, permissions);
    return { id: roleId };
  });
}

export async function saveTemplateAction(formData: FormData) {
  await voidAction(runAction(async () => {
    const user = await gate("settings.manage");
    return { id: await saveTemplate(user, text(formData)) };
  }));
}

export async function saveSettingsAction(formData: FormData) {
  await voidAction(runAction(async () => {
    const user = await gate("settings.manage");
    await updateSettings(user, text(formData));
    return { id: "ok" };
  }));
}

export async function importAction(entityType: string, csv: string, acknowledgeDuplicate: boolean) {
  return runAction(async () => {
    const user = await gate("import.run");
    const rows = parseImport(csv);
    return commitImport(user, entityType, rows, acknowledgeDuplicate);
  });
}

export async function saveViewAction(input: { entityType: string; name: string; query: Record<string, string> }) {
  return runAction(async () => {
    const user = await getCurrentUser();
    const doc = await SavedView.create({ ...input, ownerId: oid(user.id), shared: false });
    return { id: String(doc._id) };
  });
}

export async function markReadAction(id?: string) {
  const user = await getCurrentUser();
  await markNotificationsRead(user.id, id);
  revalidatePath("/dashboard");
}
