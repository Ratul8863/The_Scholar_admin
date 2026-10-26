import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { connectDB } from "@/server/db/mongoose";
import { Role, User } from "@/models/identity";
import { hasAnyPermission, hasPermission, ROLE_LABELS } from "@/server/permissions/catalog";
import { AppError } from "@/lib/errors";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  roleKey: string;
  roleName: string;
  permissions: string[];
};

const userCache = new Map<string, { expires: number; value: CurrentUser }>();
const USER_TTL_MS = 60_000;

export function forgetCachedUsers() {
  userCache.clear();
}

function fromSession(session: {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    roleKey: string;
    roleName?: string;
    permissions: string[];
  };
}): CurrentUser {
  return {
    id: session.user.id,
    name: session.user.name ?? "Member",
    email: session.user.email ?? "",
    roleKey: session.user.roleKey,
    roleName: session.user.roleName || ROLE_LABELS[session.user.roleKey] || "Member",
    permissions: session.user.permissions,
  };
}

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.permissions) return fromSession(session);
  return loadVerifiedUser(session.user.id, session.user.sessionVersion);
});

export const getVerifiedUser = cache(async (): Promise<CurrentUser> => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return loadVerifiedUser(session.user.id, session.user.sessionVersion);
});

async function loadVerifiedUser(userId: string, sessionVersion: number) {
  const key = `${userId}:${sessionVersion}`;
  const hit = userCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  await connectDB();
  const user = await User.findById(userId).select("name email active sessionVersion roleId").populate({ path: "roleId", model: Role, select: "key name permissions" }).lean();
  if (!user?.active || user.sessionVersion !== sessionVersion) {
    userCache.delete(key);
    redirect("/login");
  }
  const role = user.roleId && typeof user.roleId === "object" && "permissions" in user.roleId
    ? (user.roleId as { key?: string; name?: string; permissions?: string[] })
    : null;
  const current: CurrentUser = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    roleKey: role?.key ?? "",
    roleName: role?.name ?? "Member",
    permissions: role?.permissions ?? [],
  };
  userCache.set(key, { expires: Date.now() + USER_TTL_MS, value: current });
  return current;
}

export function assertPermission(user: CurrentUser, permission: string) {
  if (!hasPermission(user.permissions, permission)) {
    throw new AppError("forbidden", "You do not have permission to do that.");
  }
}

export function assertAnyPermission(user: CurrentUser, permissions: string[]) {
  if (!hasAnyPermission(user.permissions, permissions)) {
    throw new AppError("forbidden", "You do not have permission to do that.");
  }
}

export function can(user: CurrentUser, permission: string) {
  return hasPermission(user.permissions, permission);
}
