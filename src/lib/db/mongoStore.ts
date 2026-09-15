import { randomUUID } from "crypto";
import { MongoClient, MongoError, MongoServerError, type Db } from "mongodb";
import { computeCompletion } from "./completion";
import type { DataStore, ResponseRecord, UserRecord } from "./types";

// Everything here is lazy — reading env vars / opening a connection only happens the
// first time a DataStore method is actually called, never at import time.

function getUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Set it in .env.local for local dev (see .env.local.example), " +
        "or in your host's environment variables (e.g. Vercel Project Settings → Environment Variables) for deployment."
    );
  }
  return uri;
}

// Cache the connection across Next.js dev-mode module reloads (via `global`) so
// `next dev`'s Fast Refresh doesn't open a new connection on every request; in
// production the module-level variable alone is enough since nothing reloads it.
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// - maxPoolSize: the driver's default (100) assumes one long-lived server process; on
//   Vercel every concurrent function instance gets its own client and its own pool, so
//   the default multiplies out fast against a shared/free Atlas cluster's connection cap.
// - maxIdleTimeMS: proactively recycle sockets that have sat idle for a while, rather
//   than reusing one that may have gone stale — e.g. across a serverless platform
//   freezing and later thawing a function instance, which can leave a pooled TLS session
//   in a state Atlas no longer recognizes and rejects with a handshake-level error.
// - family: 4 forces IPv4; asymmetric/broken IPv6 routing from some serverless platforms
//   to Atlas is a documented cause of exactly this kind of garbled TLS handshake.
const CLIENT_OPTIONS = { maxPoolSize: 5, minPoolSize: 0, maxIdleTimeMS: 10_000, family: 4 as const };

let cachedClientPromise: Promise<MongoClient> | undefined;

function resetCachedClient() {
  cachedClientPromise = undefined;
  if (process.env.NODE_ENV === "development") {
    global._mongoClientPromise = undefined;
  }
}

function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(getUri(), CLIENT_OPTIONS).connect();
    }
    return global._mongoClientPromise;
  }
  if (!cachedClientPromise) {
    cachedClientPromise = new MongoClient(getUri(), CLIENT_OPTIONS).connect();
  }
  return cachedClientPromise;
}

let indexesReady: Promise<void> | undefined;

async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db(process.env.MONGODB_DB_NAME?.trim() || "cognitiverhythm");
  if (!indexesReady) {
    indexesReady = db
      .collection("users")
      .createIndex({ email: 1 }, { unique: true })
      .then(() => undefined);
  }
  await indexesReady;
  return db;
}

function isRetryable(error: unknown): boolean {
  // The driver itself labels transient, worth-retrying network/TLS failures this way —
  // exactly the class of error a stale pooled connection produces.
  return error instanceof MongoError && (error.hasErrorLabel("RetryableError") || error.hasErrorLabel("ResetPool"));
}

/**
 * Runs `fn` against a connected Db, and if it fails with a retryable network/TLS error
 * (e.g. a pooled connection gone stale after the serverless function was frozen and later
 * thawed), discards the cached client and retries exactly once against a fresh one —
 * rather than surfacing a transient blip as a hard failure, or letting this warm container
 * keep reusing the same wedged connection for every request until it recycles.
 */
async function withDb<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  try {
    return await fn(await getDb());
  } catch (error) {
    if (!isRetryable(error)) throw error;
    resetCachedClient();
    indexesReady = undefined;
    return fn(await getDb());
  }
}

interface UserDoc {
  _id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
  consentAt?: string;
}

interface ResponseDoc {
  _id: string; // = userId
  userId: string;
  demographics: Record<string, string>;
  answers: Record<string, number>;
  completedModules: string[];
  completedAt?: string;
  updatedAt: string;
}

function toUserRecord(doc: UserDoc): UserRecord {
  return {
    id: doc._id,
    email: doc.email,
    passwordHash: doc.passwordHash,
    createdAt: doc.createdAt,
    lastLoginAt: doc.lastLoginAt ?? undefined,
    consentAt: doc.consentAt ?? undefined,
  };
}

function toResponseRecord(doc: ResponseDoc): ResponseRecord {
  return {
    userId: doc.userId,
    demographics: doc.demographics,
    answers: doc.answers,
    completedModules: doc.completedModules,
    completedAt: doc.completedAt ?? undefined,
    updatedAt: doc.updatedAt,
  };
}

function emptyResponseDoc(userId: string): ResponseDoc {
  return {
    _id: userId,
    userId,
    demographics: {},
    answers: {},
    completedModules: [],
    updatedAt: new Date().toISOString(),
  };
}

/** Builds the $set/$unset pair for completedAt so it's genuinely absent (not null) when incomplete. */
function completionUpdateOps(completedModules: string[], completedAt: string | undefined) {
  const set: Record<string, unknown> = { completedModules };
  const unset: Record<string, ""> = {};
  if (completedAt) {
    set.completedAt = completedAt;
  } else {
    unset.completedAt = "";
  }
  return { set, unset };
}

export const mongoStore: DataStore = {
  async createUser(email, passwordHash) {
    return withDb(async (db) => {
      const now = new Date().toISOString();
      const doc: UserDoc = {
        _id: randomUUID(),
        email: email.toLowerCase(),
        passwordHash,
        createdAt: now,
        lastLoginAt: now,
      };
      await db.collection<UserDoc>("users").insertOne(doc);
      await db.collection<ResponseDoc>("responses").insertOne(emptyResponseDoc(doc._id));
      return toUserRecord(doc);
    });
  },

  async importParticipant(input) {
    return withDb(async (db) => {
      const now = new Date().toISOString();
      // No lastLoginAt: an imported participant has never signed in, and inventing one
      // would inflate the dashboard's "active in the last 7 days" count.
      const doc: UserDoc = {
        _id: randomUUID(),
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        createdAt: input.createdAt ?? now,
        ...(input.consentAt ? { consentAt: input.consentAt } : {}),
      };

      try {
        await db.collection<UserDoc>("users").insertOne(doc);
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) return null;
        throw error;
      }

      const { completedModules, completedAt } = computeCompletion(input.demographics, input.answers, undefined);
      await db.collection<ResponseDoc>("responses").insertOne({
        _id: doc._id,
        userId: doc._id,
        demographics: input.demographics,
        answers: input.answers,
        completedModules,
        ...(completedAt ? { completedAt } : {}),
        updatedAt: now,
      });

      return toUserRecord(doc);
    });
  },

  async getUserByEmail(email) {
    return withDb(async (db) => {
      const doc = await db.collection<UserDoc>("users").findOne({ email: email.toLowerCase() });
      return doc ? toUserRecord(doc) : null;
    });
  },

  async getUserById(id) {
    return withDb(async (db) => {
      const doc = await db.collection<UserDoc>("users").findOne({ _id: id });
      return doc ? toUserRecord(doc) : null;
    });
  },

  async touchLogin(id) {
    return withDb(async (db) => {
      await db
        .collection<UserDoc>("users")
        .updateOne({ _id: id }, { $set: { lastLoginAt: new Date().toISOString() } });
    });
  },

  async setConsent(id) {
    return withDb(async (db) => {
      const consentAt = new Date().toISOString();
      const result = await db
        .collection<UserDoc>("users")
        .findOneAndUpdate({ _id: id }, { $set: { consentAt } }, { returnDocument: "after" });
      if (!result) throw new Error("User not found");
      return toUserRecord(result);
    });
  },

  async getResponses(userId) {
    return withDb(async (db) => {
      const doc = await db.collection<ResponseDoc>("responses").findOne({ _id: userId });
      return doc ? toResponseRecord(doc) : toResponseRecord(emptyResponseDoc(userId));
    });
  },

  async saveDemographics(userId, fields) {
    return withDb(async (db) => {
      const collection = db.collection<ResponseDoc>("responses");
      const updatedAt = new Date().toISOString();
      // Dot-notation $set on individual fields (rather than read-modify-write the whole
      // `demographics` object) makes the actual data write atomic and race-free even if
      // two saves for the same user land close together.
      const setFields: Record<string, unknown> = { userId, updatedAt };
      for (const [code, value] of Object.entries(fields)) {
        setFields[`demographics.${code}`] = value;
      }
      const after = await collection.findOneAndUpdate(
        { _id: userId },
        { $set: setFields, $setOnInsert: { answers: {}, completedModules: [] } },
        { upsert: true, returnDocument: "after" }
      );
      const record = after ?? { ...emptyResponseDoc(userId), ...setFields };
      const { completedModules, completedAt } = computeCompletion(record.demographics, record.answers, record.completedAt);
      const { set, unset } = completionUpdateOps(completedModules, completedAt);
      await collection.updateOne(
        { _id: userId },
        { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }
      );
      return { userId, demographics: record.demographics, answers: record.answers, completedModules, completedAt, updatedAt };
    });
  },

  async saveAnswer(userId, itemCode, value) {
    return withDb(async (db) => {
      const collection = db.collection<ResponseDoc>("responses");
      const updatedAt = new Date().toISOString();
      const after = await collection.findOneAndUpdate(
        { _id: userId },
        {
          $set: { userId, [`answers.${itemCode}`]: value, updatedAt },
          $setOnInsert: { demographics: {}, completedModules: [] },
        },
        { upsert: true, returnDocument: "after" }
      );
      const record = after ?? emptyResponseDoc(userId);
      const { completedModules, completedAt } = computeCompletion(record.demographics, record.answers, record.completedAt);
      const { set, unset } = completionUpdateOps(completedModules, completedAt);
      await collection.updateOne(
        { _id: userId },
        { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }
      );
      return { userId, demographics: record.demographics, answers: record.answers, completedModules, completedAt, updatedAt };
    });
  },

  async listUsers() {
    return withDb(async (db) => {
      const docs = await db.collection<UserDoc>("users").find().toArray();
      return docs.map(toUserRecord);
    });
  },

  async listAllResponses() {
    return withDb(async (db) => {
      const docs = await db.collection<ResponseDoc>("responses").find().toArray();
      return docs.map(toResponseRecord);
    });
  },

  async deleteUser(id) {
    return withDb(async (db) => {
      await Promise.all([
        db.collection<UserDoc>("users").deleteOne({ _id: id }),
        db.collection<ResponseDoc>("responses").deleteOne({ _id: id }),
      ]);
    });
  },
};
