import "server-only";
import dns from "node:dns";
import mongoose from "mongoose";
import { getEnv } from "@/config/env";

dns.setDefaultResultOrder("ipv4first");

const globalForMongoose = globalThis as unknown as {
  scholarConnection?: Promise<typeof mongoose>;
  scholarIndexes?: Promise<void>;
};

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    scheduleIndexSync();
    return mongoose;
  }
  if (mongoose.connection.readyState !== 2) globalForMongoose.scholarConnection = undefined;
  if (!globalForMongoose.scholarConnection) {
    const env = getEnv();
    mongoose.set("strictQuery", true);
    mongoose.set("bufferTimeoutMS", 10_000);
    const connecting = mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB,
      autoIndex: false,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30_000,
      serverSelectionTimeoutMS: 8_000,
      connectTimeoutMS: 8_000,
      socketTimeoutMS: 45_000,
      compressors: ["zlib"],
    });
    globalForMongoose.scholarConnection = connecting.then(
      () => {
        scheduleIndexSync();
        return mongoose;
      },
      (error: unknown) => {
        globalForMongoose.scholarConnection = undefined;
        throw error;
      },
    );
  }
  return globalForMongoose.scholarConnection;
}

function scheduleIndexSync() {
  if (globalForMongoose.scholarIndexes) return;
  globalForMongoose.scholarIndexes = (async () => {
    await import("@/models");
    await Promise.all(
      mongoose.modelNames().map(async (name) => {
        try {
          await mongoose.model(name).createIndexes();
        } catch {
          // Conflicting legacy indexes must not block requests.
        }
      }),
    );
  })().catch(() => {
    globalForMongoose.scholarIndexes = undefined;
  });
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
