import "server-only";
import mongoose from "mongoose";
import { getEnv } from "@/config/env";

const globalForMongoose = globalThis as unknown as { scholarConnection?: Promise<typeof mongoose> };

export async function connectDB() {
  if (!globalForMongoose.scholarConnection) {
    const env = getEnv();
    mongoose.set("strictQuery", true);
    globalForMongoose.scholarConnection = mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB,
      autoIndex: true,
    });
  }
  return globalForMongoose.scholarConnection;
}

export async function withOptionalTransaction<T>(work: (session: mongoose.ClientSession | null) => Promise<T>) {
  const env = getEnv();
  if (env.MONGO_TRANSACTIONS !== "true") return work(null);
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
