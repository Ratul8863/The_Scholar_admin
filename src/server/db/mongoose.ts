import "server-only";
import dns from "node:dns";
import mongoose from "mongoose";
import { getEnv } from "@/config/env";

dns.setDefaultResultOrder("ipv4first");

const globalForMongoose = globalThis as unknown as { scholarConnection?: Promise<typeof mongoose> };

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (mongoose.connection.readyState !== 2) globalForMongoose.scholarConnection = undefined;
  if (!globalForMongoose.scholarConnection) {
    const env = getEnv();
    mongoose.set("strictQuery", true);
    mongoose.set("bufferTimeoutMS", 5_000);
    const connecting = mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB,
      autoIndex: false,
      family: 4,
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 8_000,
      connectTimeoutMS: 8_000,
      socketTimeoutMS: 20_000,
    });
    globalForMongoose.scholarConnection = connecting.then(
      () => mongoose,
      (error: unknown) => {
        globalForMongoose.scholarConnection = undefined;
        throw error;
      },
    );
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
