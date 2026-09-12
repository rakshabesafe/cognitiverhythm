import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { computeCompletion } from "./completion";
import type { DataStore, ResponseRecord, UserRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const RESPONSES_DIR = path.join(DATA_DIR, "responses");

// Serializes reads/writes per file so concurrent auto-saves from the same user
// (or the users.json file) can't race and corrupt the JSON. A real DB makes
// this unnecessary, which is the point of hiding it behind DataStore.
const locks = new Map<string, Promise<unknown>>();
function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prior = locks.get(key) ?? Promise.resolve();
  const run = prior.then(fn, fn);
  locks.set(
    key,
    run.catch(() => undefined)
  );
  return run;
}

async function ensureDirs() {
  await mkdir(RESPONSES_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return fallback;
    }
    throw err;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDirs();
  await writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

function responseFile(userId: string): string {
  return path.join(RESPONSES_DIR, `${userId}.json`);
}

function emptyResponses(userId: string): ResponseRecord {
  return {
    userId,
    demographics: {},
    answers: {},
    completedModules: [],
    updatedAt: new Date().toISOString(),
  };
}

function recomputeCompletion(record: ResponseRecord): ResponseRecord {
  return { ...record, ...computeCompletion(record.demographics, record.answers, record.completedAt) };
}

export const jsonStore: DataStore = {
  async createUser(email, passwordHash) {
    return withLock(USERS_FILE, async () => {
      const users = await readJson<UserRecord[]>(USERS_FILE, []);
      const now = new Date().toISOString();
      const user: UserRecord = {
        id: randomUUID(),
        email: email.toLowerCase(),
        passwordHash,
        createdAt: now,
        lastLoginAt: now,
      };
      users.push(user);
      await writeJson(USERS_FILE, users);
      await writeJson(responseFile(user.id), emptyResponses(user.id));
      return user;
    });
  },

  async getUserByEmail(email) {
    const users = await readJson<UserRecord[]>(USERS_FILE, []);
    return users.find((u) => u.email === email.toLowerCase()) ?? null;
  },

  async getUserById(id) {
    const users = await readJson<UserRecord[]>(USERS_FILE, []);
    return users.find((u) => u.id === id) ?? null;
  },

  async touchLogin(id) {
    await withLock(USERS_FILE, async () => {
      const users = await readJson<UserRecord[]>(USERS_FILE, []);
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) return;
      users[idx] = { ...users[idx], lastLoginAt: new Date().toISOString() };
      await writeJson(USERS_FILE, users);
    });
  },

  async setConsent(id) {
    return withLock(USERS_FILE, async () => {
      const users = await readJson<UserRecord[]>(USERS_FILE, []);
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error("User not found");
      users[idx] = { ...users[idx], consentAt: new Date().toISOString() };
      await writeJson(USERS_FILE, users);
      return users[idx];
    });
  },

  async getResponses(userId) {
    return readJson<ResponseRecord>(responseFile(userId), emptyResponses(userId));
  },

  async saveDemographics(userId, fields) {
    return withLock(responseFile(userId), async () => {
      const record = await readJson<ResponseRecord>(responseFile(userId), emptyResponses(userId));
      const updated = recomputeCompletion({
        ...record,
        demographics: { ...record.demographics, ...fields },
        updatedAt: new Date().toISOString(),
      });
      await writeJson(responseFile(userId), updated);
      return updated;
    });
  },

  async saveAnswer(userId, itemCode, value) {
    return withLock(responseFile(userId), async () => {
      const record = await readJson<ResponseRecord>(responseFile(userId), emptyResponses(userId));
      const updated = recomputeCompletion({
        ...record,
        answers: { ...record.answers, [itemCode]: value },
        updatedAt: new Date().toISOString(),
      });
      await writeJson(responseFile(userId), updated);
      return updated;
    });
  },

  async listUsers() {
    return readJson<UserRecord[]>(USERS_FILE, []);
  },

  async listAllResponses() {
    const users = await readJson<UserRecord[]>(USERS_FILE, []);
    const records = await Promise.all(
      users.map((u) => readJson<ResponseRecord>(responseFile(u.id), emptyResponses(u.id)))
    );
    return records;
  },

  async deleteUser(id) {
    await withLock(USERS_FILE, async () => {
      const users = await readJson<UserRecord[]>(USERS_FILE, []);
      await writeJson(USERS_FILE, users.filter((u) => u.id !== id));
    });
    await withLock(responseFile(id), async () => {
      try {
        await unlink(responseFile(id));
      } catch (err: unknown) {
        if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") return;
        throw err;
      }
    });
  },
};
