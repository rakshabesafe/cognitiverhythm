// Single swap point: participant/response data is persisted exclusively in MongoDB
// (see .env.local.example for MONGODB_URI / MONGODB_DB_NAME). The app has no local
// filesystem storage fallback — this matters because serverless hosts like Vercel
// don't provide a writable, persistent filesystem, so a file-based store would
// silently lose data in production. mongoStore itself throws a clear error the
// first time it's used if MONGODB_URI isn't set.
import { mongoStore } from "./mongoStore";
import type { DataStore } from "./types";

export const db: DataStore = mongoStore;
export type { DataStore, ResponseRecord, UserRecord } from "./types";
