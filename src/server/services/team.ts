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
import { writeAudit } from "@/server/services/audit";
import { assertRateLimit } from "@/server/services/rate-limit";
import { oid, ready } from "@/server/services/query";
import { withOptionalTransaction } from "@/server/db/mongoose";

export async function teamOverview() {
  await ready();
  const [users, invitations, roles, workload] = await Promise.all([
    User.find().sort({ name: 1 }).lean(),
    Invitation.find().sort({ createdAt: -1 }).limit(50).lean(),
    Role.find().lean(),
    Assignment.aggregate([{ $match: { status: "active" } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
  ]);
  const roleName = new Map(roles.map((role) => [String(role._id), role.name]));
  const load = new Map(workload.map((row) => [String(row._id), row.count as number]));
  return {
    members: users.map((user) => ({
      ...asRecord(user),
      roleName: roleName.get(String(user.roleId)) ?? "Unassigned",
      assignments: load.get(String(user._id)) ?? 0,
    })) as Array<Record<string, unknown>>,
    invitations: invitations.map((invite) => ({ ...asRecord(invite), state: assessInvitation(invite) })) as Array<Record<string, unknown>>,
    roles: roles.map((role) => asRecord(role)),
  };
}

export async function inviteMember(actor: CurrentUser, input: { email: string; name?: string; roleId: string }) {
  await ready();
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError("validation", "Enter a valid email.");
  const role = await Role.findById(oid(input.roleId, "role")).lean();
  if (!role) throw new AppError("validation", "Choose a role.");
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
  const link = `${getEnv().APP_URL}/invite/${raw}`;
  await sendEmail({
    to: email,
    subject: "You are invited to Scholar",
    text: `Accept your Scholar invitation: ${link}\nThis link expires in 7 days and can be used once.`,
    html: `<p>You have been invited to Scholar as ${role.name}.</p><p><a href="${link}">Accept invitation</a></p><p>This link expires in 7 days and works once.</p>`,
  });
  await writeAudit({ actorUserId: actor.id, action: "create", entityType: "invitation", entityId: email, metadata: { role: role.key } });
  return { email, expiresAt: expiresAt.toISOString() };
}

export async function revokeInvitation(actor: CurrentUser, id: string) {
  await Invitation.updateOne({ _id: oid(id), status: "pending" }, { $set: { status: "revoked" } });
  await writeAudit({ actorUserId: actor.id, action: "edit", entityType: "invitation", entityId: id, metadata: { status: "revoked" } });
}

export async function setUserActive(actor: CurrentUser, id: string, active: boolean) {
  if (id === actor.id && !active) throw new AppError("validation", "You cannot deactivate your own account.");
  const user = await User.findById(oid(id));
  if (!user) throw new AppError("not_found", "Team member was not found.");
  user.active = active;
  user.sessionVersion += 1;
  await user.save();
  forgetCachedUsers();
  await writeAudit({ actorUserId: actor.id, action: "edit", entityType: "user", entityId: id, changes: [{ field: "active", oldValue: !active, newValue: active }] });
}

export async function changeUserRole(actor: CurrentUser, id: string, roleId: string) {
  const role = await Role.findById(oid(roleId)).lean();
  if (!role) throw new AppError("validation", "Choose a role.");
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
