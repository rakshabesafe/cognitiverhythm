export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
  consentAt?: string;
}

export interface ResponseRecord {
  userId: string;
  demographics: Record<string, string>;
  answers: Record<string, number>;
  completedModules: string[];
  completedAt?: string;
  updatedAt: string;
}

export interface ImportParticipantInput {
  email: string;
  passwordHash: string;
  /** Preserved from the export's `registered_at`; defaults to the import time when absent. */
  createdAt?: string;
  /** Preserved from the export's `consented_at`, so an imported participant isn't sent back through the consent gate. */
  consentAt?: string;
  demographics: Record<string, string>;
  answers: Record<string, number>;
}

export interface DataStore {
  createUser(email: string, passwordHash: string): Promise<UserRecord>;
  /**
   * Creates a participant and their responses in one step, for the admin CSV import.
   * Returns null — rather than throwing or overwriting — when the email is already taken,
   * which is the unique index enforcing the import's "never overwrite" rule even if two
   * imports run at once.
   */
  importParticipant(input: ImportParticipantInput): Promise<UserRecord | null>;
  getUserByEmail(email: string): Promise<UserRecord | null>;
  getUserById(id: string): Promise<UserRecord | null>;
  touchLogin(id: string): Promise<void>;
  setConsent(id: string): Promise<UserRecord>;

  getResponses(userId: string): Promise<ResponseRecord>;
  saveDemographics(userId: string, fields: Record<string, string>): Promise<ResponseRecord>;
  saveAnswer(userId: string, itemCode: string, value: number): Promise<ResponseRecord>;

  listUsers(): Promise<UserRecord[]>;
  listAllResponses(): Promise<ResponseRecord[]>;
  deleteUser(id: string): Promise<void>;
}
