import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { connectDB } from "@/server/db/mongoose";
import { Role, User } from "@/models/identity";
import { hasAnyPermission, hasPermission } from "@/server/permissions/catalog";
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
const USER_TTL_MS = 20_000;

export function forgetCachedUsers() {
  userCache.clear();
}

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const key = `${session.user.id}:${session.user.sessionVersion}`;
  const hit = userCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  await connectDB();
  const user = await User.findById(session.user.id).select("name email active sessionVersion roleId").lean();
  if (!user?.active || user.sessionVersion !== session.user.sessionVersion) {
    userCache.delete(key);
    redirect("/login");
  }
  const role = await Role.findById(user.roleId).select("key name permissions").lean();
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
});

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
