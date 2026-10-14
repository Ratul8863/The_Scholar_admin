import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { connectDB } from "@/server/db/mongoose";
import { Role, User } from "@/models";
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

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user?.active || user.sessionVersion !== session.user.sessionVersion) redirect("/login");
  const role = await Role.findById(user.roleId).lean();
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    roleKey: role?.key ?? "",
    roleName: role?.name ?? "Member",
    permissions: role?.permissions ?? [],
  };
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
