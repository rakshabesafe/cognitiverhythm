// Parsing and validation for the admin CSV import, kept free of any database access so
// the tricky parts (quoted fields, generated addresses, out-of-range answers) stay
// directly testable. The expected format is exactly what /api/admin/export produces.
import { DEMOGRAPHICS, LIKERT_MODULES, SCALES } from "@/lib/survey/schema";

/** Domain used for participants whose `email` cell is blank — addresses are `1@…`, `2@…`, and so on. */
export const GENERATED_EMAIL_DOMAIN = "cognitiverhythm";

const ANSWER_MAX: Record<string, number> = Object.fromEntries(
  LIKERT_MODULES.flatMap((m) => m.items.map((i) => [i.code, SCALES[m.scale].labels.length] as const))
);

const ITEM_CODES = new Set(Object.keys(ANSWER_MAX));

/**
 * An export always carries an `email` column and the instrument's item codes. Demographic
 * codes alone aren't proof of one — `name` is a demographic field, and also the most
 * common column name in every unrelated spreadsheet — so they don't count here.
 */
function looksLikeExport(header: string[]): boolean {
  return header.includes("email") || header.some((h) => ITEM_CODES.has(h));
}

/**
 * RFC 4180-style parse: quoted fields, "" escapes inside them, CRLF or LF line endings,
 * and a leading UTF-8 BOM. A plain split on commas would corrupt any exported cell that
 * contains a comma — free-text names and several demographic option labels do.
 */
export function parseCsv(text: string): string[][] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export interface ParsedParticipant {
  /** 1-based line number as a spreadsheet shows it, header included — so issues are findable. */
  row: number;
  email: string;
  /** True when the address was generated because the file left `email` blank. */
  generated: boolean;
  createdAt?: string;
  consentAt?: string;
  demographics: Record<string, string>;
  answers: Record<string, number>;
}

export interface ImportIssue {
  row: number;
  message: string;
}

export interface ImportPlan {
  participants: ParsedParticipant[];
  /** Rows whose email already belongs to a participant, or repeats earlier in the same file. */
  skippedExisting: number;
  issues: ImportIssue[];
  /** Set when the file can't be read as an export at all — nothing is imported in that case. */
  fatal?: string;
}

function toIsoDate(raw: string): string | undefined {
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
}

/**
 * Lowest unused `<n>@cognitiverhythm`, counting both addresses already in the database and
 * ones handed out earlier in this same file. `counter` carries the search forward so a
 * large import doesn't rescan from 1 for every blank row.
 */
function nextGeneratedEmail(taken: Set<string>, counter: { next: number }): string {
  let candidate = `${counter.next}@${GENERATED_EMAIL_DOMAIN}`;
  while (taken.has(candidate)) {
    counter.next++;
    candidate = `${counter.next}@${GENERATED_EMAIL_DOMAIN}`;
  }
  counter.next++;
  return candidate;
}

/**
 * Turns an exported CSV into the set of participants to create. `existingEmails` are the
 * addresses already registered: a row matching one of them is skipped rather than
 * overwritten, so re-importing the same file is a no-op instead of a data loss.
 */
export function parseParticipantCsv(text: string, existingEmails: Iterable<string>): ImportPlan {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { participants: [], skippedExisting: 0, issues: [], fatal: "The file is empty." };
  }

  const header = rows[0].map((h) => h.trim());
  if (!looksLikeExport(header)) {
    return {
      participants: [],
      skippedExisting: 0,
      issues: [],
      fatal: "No recognizable columns found. Expected the header row from the CSV export (email, demographics, item codes).",
    };
  }

  const columnIndex = new Map(header.map((h, i) => [h, i]));
  const taken = new Set<string>();
  for (const email of existingEmails) taken.add(email.trim().toLowerCase());

  const participants: ParsedParticipant[] = [];
  const issues: ImportIssue[] = [];
  const counter = { next: 1 };
  let skippedExisting = 0;

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.every((c) => c.trim() === "")) continue;
    const row = r + 1;

    const cell = (name: string): string => {
      const i = columnIndex.get(name);
      return i === undefined ? "" : (cells[i] ?? "").trim();
    };

    const rawEmail = cell("email").toLowerCase();
    let email: string;
    let generated = false;
    if (rawEmail) {
      if (!/^[^\s@]+@[^\s@]+$/.test(rawEmail)) {
        issues.push({ row, message: `"${rawEmail}" is not a valid email address — row skipped.` });
        continue;
      }
      if (taken.has(rawEmail)) {
        skippedExisting++;
        continue;
      }
      email = rawEmail;
    } else {
      email = nextGeneratedEmail(taken, counter);
      generated = true;
    }
    taken.add(email);

    const demographics: Record<string, string> = {};
    for (const field of DEMOGRAPHICS.fields) {
      const value = cell(field.code);
      if (!value) continue;
      if (field.type === "select" && !field.options.includes(value)) {
        issues.push({ row, message: `${field.code}: "${value}" is not one of the current options — imported as-is.` });
      }
      demographics[field.code] = value;
    }

    const answers: Record<string, number> = {};
    for (const [code, max] of Object.entries(ANSWER_MAX)) {
      const raw = cell(code);
      if (!raw) continue;
      const value = Number(raw);
      if (!Number.isInteger(value) || value < 1 || value > max) {
        issues.push({ row, message: `${code}: "${raw}" is not a whole number from 1 to ${max} — left unanswered.` });
        continue;
      }
      answers[code] = value;
    }

    const registeredAt = cell("registered_at");
    const consentedAt = cell("consented_at");
    const createdAt = registeredAt ? toIsoDate(registeredAt) : undefined;
    const consentAt = consentedAt ? toIsoDate(consentedAt) : undefined;
    if (registeredAt && !createdAt) {
      issues.push({ row, message: `registered_at: "${registeredAt}" isn't a readable date — using the import time instead.` });
    }
    if (consentedAt && !consentAt) {
      issues.push({ row, message: `consented_at: "${consentedAt}" isn't a readable date — imported without consent.` });
    }

    participants.push({ row, email, generated, createdAt, consentAt, demographics, answers });
  }

  return { participants, skippedExisting, issues };
}
