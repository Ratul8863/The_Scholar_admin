import "server-only";
import { RateLimit } from "@/models/identity";
import { AppError } from "@/lib/errors";
import { connectDB } from "@/server/db/mongoose";

export async function assertRateLimit(key: string, limit: number, windowMs: number) {
  await connectDB();
  const now = new Date();
  const current = await RateLimit.findOne({ key }).lean();
  if (!current || now.getTime() - new Date(current.windowStart).getTime() > windowMs) {
    await RateLimit.updateOne({ key }, { $set: { count: 1, windowStart: now } }, { upsert: true });
    return;
  }
  if (current.count >= limit) {
    throw new AppError("rate_limited", "Too many attempts. Wait a few minutes and try again.");
  }
  await RateLimit.updateOne({ key }, { $inc: { count: 1 } });
}
