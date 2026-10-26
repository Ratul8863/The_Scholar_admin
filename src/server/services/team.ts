import "server-only";
import { hash } from "bcryptjs";
import { Invitation, Role, User } from "@/models";
import { Assignment } from "@/models/platform";
import { AppError } from "@/lib/errors";
import { asRecord } from "@/lib/serialize";
import { getEnv } from "@/config/env";
import { forgetCachedUsers, type CurrentUser } from "@/server/auth/current-user";
import { assessInvitation, createRawToken, hashToken } from "@/server/domain/invitations";
import { passwordIssues } from "@/server/domain/text";
import { sendEmail } from "@/server/notifications/email";
import { canAssignRole, DEFAULT_ROLE_PERMISSIONS, isSuperAdmin, ROLE_LABELS } from "@/server/permissions/catalog";
import { writeAudit } from "@/server/services/audit";
import { assertRateLimit } from "@/server/services/rate-limit";
import { oid, ready } from "@/server/services/query";
import { withOptionalTransaction } from "@/server/db/mongoose";

export async function ensureSystemRoles() {
  await ready();
  for (const [key, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const existing = await Role.findOne({ key }).select("_id").lean();
    if (existing) continue;
    await Role.create({
      key,
      name: ROLE_LABELS[key] ?? key,
      permissions,
      system: true,
      description: `${ROLE_LABELS[key] ?? key} default access`,
    });
  }
  const superRole = await Role.findOne({ key: "super_admin" }).select("_id").lean();
  if (!superRole) return;
  const hasSuper = await User.exists({ roleId: superRole._id, active: true });
  if (hasSuper) return;
  const adminRole = await Role.findOne({ key: "admin" }).select("_id").lean();
  if (!adminRole) return;
  const firstAdmin = await User.findOne({ roleId: adminRole._id, active: true }).sort({ createdAt: 1 }).select("_id").lean();
  if (!firstAdmin) return;
  await User.updateOne({ _id: firstAdmin._id }, { $set: { roleId: superRole._id } });
}

export async function teamOverview() {
  await ensureSystemRoles();
  const [users, invitations, roles, workload] = await Promise.all([
    User.find().sort({ name: 1 }).select("name email active roleId sessionVersion createdAt").lean(),
    Invitation.find().sort({ createdAt: -1 }).limit(50).select("email name roleId status expiresAt createdAt").lean(),
    Role.find().select("key name description permissions system").lean(),
    Assignment.aggregate([{ $match: { status: "active" } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
  ]);
  const roleById = new Map(roles.map((role) => [String(role._id), role]));
  const load = new Map(workload.map((row) => [String(row._id), row.count as number]));
  return {
    members: users.map((user) => {
      const role = roleById.get(String(user.roleId));
      return {
        ...asRecord(user),
        roleName: role?.name ?? "Unassigned",
        roleKey: role?.key ?? "",
        assignments: load.get(String(user._id)) ?? 0,
      };
    }) as Array<Record<string, unknown>>,
    invitations: invitations.map((invite) => ({
      ...asRecord(invite),
      state: assessInvitation(invite),
      roleName: roleById.get(String(invite.roleId))?.name ?? "",
    })) as Array<Record<string, unknown>>,
    roles: roles.map((role) => asRecord(role)),
  };
}

export async function inviteMember(actor: CurrentUser, input: { email: string; name?: string; roleId: string }) {
  await ensureSystemRoles();
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError("validation", "Enter a valid email.");
  const role = await Role.findById(oid(input.roleId, "role")).lean();
  if (!role) throw new AppError("validation", "Choose a role.");
  if (!canAssignRole(actor.roleKey, role.key)) {
    throw new AppError("forbidden", role.key === "admin" ? "Only a Super Admin can create admin accounts." : "That role cannot be assigned.");
  }
  const existing = await User.findOne({ email }).lean();
  if (existing) throw new AppError("duplicate", "That email already belongs to a team member.");
  await Invitation.updateMany({ email, status: "pending" }, { $set: { status: "revoked" } });
  const raw = createRawToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await Invitation.create({
    email,
    name: input.name?.trim() ?? "",
    roleId: role._id,
    tokenHash: hashToken(raw),
    status: "pending",
    expiresAt,
    invitedBy: oid(actor.id),
  });
  const inviteUrl = `${getEnv().APP_URL}/invite/${raw}`;
  try {
    await sendEmail({
      to: email,
      subject: "You are invited to The Scholar",
      text: `Accept your Scholar invitation: ${inviteUrl}\nThis link expires in 7 days and can be used once.`,
      html: `<p>You have been invited to The Scholar as ${role.name}.</p><p><a href="${inviteUrl}">Accept invitation</a></p><p>This link expires in 7 days and works once.</p>`,
    });
  } catch (error) {
    console.error(error);
  }
  await writeAudit({ actorUserId: actor.id, action: "create", entityType: "invitation", entityId: email, metadata: { role: role.key } });
  return { email, expiresAt: expiresAt.toISOString(), inviteUrl, roleName: role.name };
}

export async function inviteAdmin(actor: CurrentUser, input: { email: string; name?: string }) {
  if (!isSuperAdmin(actor.roleKey)) throw new AppError("forbidden", "Only a Super Admin can create admin accounts.");
  await ensureSystemRoles();
  const role = await Role.findOne({ key: "admin" }).lean();
  if (!role) throw new AppError("validation", "The Admin role is missing. Run seed or reload Team.");
  return inviteMember(actor, { email: input.email, name: input.name, roleId: String(role._id) });
}

export async function revokeInvitation(actor: CurrentUser, id: string) {
  await Invitation.updateOne({ _id: oid(id), status: "pending" }, { $set: { status: "revoked" } });
  await writeAudit({ actorUserId: actor.id, action: "edit", entityType: "invitation", entityId: id, metadata: { status: "revoked" } });
}

export async function setUserActive(actor: CurrentUser, id: string, active: boolean) {
  if (id === actor.id && !active) throw new AppError("validation", "You cannot deactivate your own account.");
  const user = await User.findById(oid(id));
  if (!user) throw new AppError("not_found", "Team member was not found.");
  const role = await Role.findById(user.roleId).select("key").lean();
  if (role?.key === "super_admin" && !isSuperAdmin(actor.roleKey)) {
    throw new AppError("forbidden", "Only a Super Admin can change another Super Admin.");
  }
  if (role?.key === "super_admin" && !active) {
    const superCount = await User.countDocuments({ roleId: user.roleId, active: true, _id: { $ne: user._id } });
    if (superCount === 0) throw new AppError("validation", "Keep at least one active Super Admin.");
  }
  user.active = active;
  user.sessionVersion += 1;
  await user.save();
  forgetCachedUsers();
  await writeAudit({ actorUserId: actor.id, action: "edit", entityType: "user", entityId: id, changes: [{ field: "active", oldValue: !active, newValue: active }] });
}

export async function changeUserRole(actor: CurrentUser, id: string, roleId: string) {
  const role = await Role.findById(oid(roleId)).lean();
  if (!role) throw new AppError("validation", "Choose a role.");
  if (!canAssignRole(actor.roleKey, role.key)) {
    throw new AppError("forbidden", "You cannot assign that role.");
  }
  const current = await User.findById(oid(id)).select("roleId").lean();
  if (!current) throw new AppError("not_found", "Team member was not found.");
  const currentRole = await Role.findById(current.roleId).select("key").lean();
  if (currentRole?.key === "super_admin") {
    throw new AppError("forbidden", "A Super Admin account cannot be reassigned from Team.");
  }
  await User.updateOne({ _id: oid(id) }, { $set: { roleId: role._id }, $inc: { sessionVersion: 1 } });
  forgetCachedUsers();
  await writeAudit({ actorUserId: actor.id, action: "edit", entityType: "user", entityId: id, changes: [{ field: "role", oldValue: null, newValue: role.key }] });
}

export async function previewInvitation(token: string) {
  await ready();
  const invite = await Invitation.findOne({ tokenHash: hashToken(token) }).lean();
  const state = assessInvitation(invite);
  if (!invite || state !== "valid") return { state, email: invite?.email ?? "" };
  const role = await Role.findById(invite.roleId).lean();
  return { state, email: invite.email, roleName: role?.name ?? "Member" };
}

export async function acceptInvitation(input: { token: string; name: string; password: string }) {
  await assertRateLimit(`invite:${hashToken(input.token).slice(0, 12)}`, 8, 15 * 60 * 1000);
  const issues = passwordIssues(input.password);
  if (!input.name.trim()) issues.push("Enter your name.");
  if (issues.length) throw new AppError("validation", issues[0] ?? "Check the form.");
  await ready();
  const passwordHash = await hash(input.password, 12);
  const userId = await withOptionalTransaction(async () => {
    const invite = await Invitation.findOne({ tokenHash: hashToken(input.token) });
    const state = assessInvitation(invite);
    if (!invite || state !== "valid") throw new AppError("validation", invitationMessage(state));
    const existing = await User.findOne({ email: invite.email }).lean();
    if (existing) throw new AppError("duplicate", "An account already exists for this email.");
    const user = await User.create({
      name: input.name.trim(),
      email: invite.email,
      passwordHash,
      roleId: invite.roleId,
      active: true,
      emailVerifiedAt: new Date(),
    });
    invite.status = "accepted";
    invite.acceptedAt = new Date();
    await invite.save();
    return String(user._id);
  });
  await writeAudit({ actorUserId: userId, action: "create", entityType: "user", entityId: userId, metadata: { via: "invitation" } });
  return userId;
}

function invitationMessage(state: string) {
  if (state === "expired") return "This invitation has expired. Ask an admin to send a new one.";
  if (state === "used") return "This invitation was already used.";
  if (state === "revoked") return "This invitation was revoked.";
  return "This invitation is not valid.";
}
