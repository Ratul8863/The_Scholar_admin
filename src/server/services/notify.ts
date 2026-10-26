import "server-only";
import { Notification } from "@/models/platform";
import { User } from "@/models/identity";
import { connectDB } from "@/server/db/mongoose";
import { getEnv } from "@/config/env";
import { sendEmail } from "@/server/notifications/email";

export async function listNotifications(userId: string) {
  await connectDB();
  const rows = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(30).lean();
  return rows.map((row) => ({
    id: String(row._id),
    title: row.title,
    body: row.body,
    href: row.href,
    category: row.category,
    createdAt: row.createdAt,
    read: Boolean(row.readAt),
  }));
}

export async function markNotificationsRead(userId: string, id?: string) {
  await connectDB();
  const filter = id ? { _id: id, userId } : { userId, readAt: null };
  await Notification.updateMany(filter, { $set: { readAt: new Date() } });
}

export async function notifyUser(input: {
  userId: string;
  category: string;
  title: string;
  body?: string;
  href?: string;
  notificationKey?: string;
}) {
  await connectDB();
  try {
    await Notification.create({
      userId: input.userId,
      category: input.category,
      title: input.title,
      body: input.body ?? "",
      href: input.href ?? "",
      notificationKey: input.notificationKey || undefined,
    });
  } catch (error) {
    if (input.notificationKey && typeof error === "object" && error && "code" in error && (error as { code?: number }).code === 11000) return;
    throw error;
  }

  const env = getEnv();
  if (env.EMAIL_NOTIFICATIONS !== "true") return;
  const user = await User.findById(input.userId).lean();
  if (!user?.email) return;
  await sendEmail({
    to: user.email,
    subject: input.title,
    text: `${input.body ?? ""}\n${input.href ? `${env.APP_URL}${input.href}` : ""}`,
    html: `<p>${input.body ?? ""}</p>${input.href ? `<p><a href="${env.APP_URL}${input.href}">Open in Scholar</a></p>` : ""}`,
  });
}
