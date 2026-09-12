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

export interface DataStore {
  createUser(email: string, passwordHash: string): Promise<UserRecord>;
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
