// Single swap point: participant/response data is persisted in MongoDB when
// MONGODB_URI is set (see .env.local.example), and falls back to local JSON files
// under ./data otherwise so `npm run dev` still works with zero setup. Both
// implementations satisfy the same DataStore interface — nothing else in the app
// needs to know which one is active.
import { jsonStore } from "./jsonStore";
import { mongoStore } from "./mongoStore";
import type { DataStore } from "./types";

const useMongo = Boolean(process.env.MONGODB_URI?.trim());

if (!useMongo) {
  console.warn(
    "[db] MONGODB_URI is not set — using local JSON file storage under ./data. " +
      "Set MONGODB_URI (and optionally MONGODB_DB_NAME) in .env.local to persist data in MongoDB instead."
  );
}

export const db: DataStore = useMongo ? mongoStore : jsonStore;
export type { DataStore, ResponseRecord, UserRecord } from "./types";
