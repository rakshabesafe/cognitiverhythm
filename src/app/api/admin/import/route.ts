import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { parseParticipantCsv } from "@/lib/admin/csvImport";
import { withErrorHandling } from "@/lib/api/withErrorHandling";

/**
 * Every imported participant gets this same password. It is a known, shared credential by
 * design — imported accounts are expected to be handed out or reset, not treated as
 * private until someone changes them.
 */
const DEFAULT_IMPORT_PASSWORD = "passwd";

const MAX_CSV_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 2000;
/** Keep the response readable when a malformed file would otherwise report thousands of issues. */
const MAX_REPORTED_ISSUES = 50;
/** Small enough to stay inside the Mongo client's pool (maxPoolSize 5), large enough to avoid a slow serial crawl. */
const WRITE_CONCURRENCY = 5;

export const POST = withErrorHandling(async (request: Request) => {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const csv: unknown = body?.csv;
  if (typeof csv !== "string" || csv.trim() === "") {
    return NextResponse.json({ error: "Attach a CSV file to import." }, { status: 400 });
  }
  if (csv.length > MAX_CSV_BYTES) {
    return NextResponse.json({ error: "That file is too large to import (limit 5 MB)." }, { status: 400 });
  }

  const existingUsers = await db.listUsers();
  const plan = parseParticipantCsv(
    csv,
    existingUsers.map((u) => u.email)
  );

  if (plan.fatal) {
    return NextResponse.json({ error: plan.fatal }, { status: 400 });
  }
  if (plan.participants.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `That file has ${plan.participants.length} new participants; import at most ${MAX_ROWS} at a time.` },
      { status: 400 }
    );
  }

  // Hashed once and reused for every row: bcrypt is deliberately slow, and re-hashing the
  // same shared password per participant would turn a large import into a timeout.
  const passwordHash = await hashPassword(DEFAULT_IMPORT_PASSWORD);

  let created = 0;
  let skippedExisting = plan.skippedExisting;
  const createdEmails: string[] = [];

  for (let i = 0; i < plan.participants.length; i += WRITE_CONCURRENCY) {
    const chunk = plan.participants.slice(i, i + WRITE_CONCURRENCY);
    const results = await Promise.all(
      chunk.map((p) =>
        db.importParticipant({
          email: p.email,
          passwordHash,
          createdAt: p.createdAt,
          consentAt: p.consentAt,
          demographics: p.demographics,
          answers: p.answers,
        })
      )
    );
    for (const user of results) {
      if (user) {
        created++;
        createdEmails.push(user.email);
      } else {
        skippedExisting++;
      }
    }
  }

  return NextResponse.json({
    created,
    skippedExisting,
    generated: plan.participants.filter((p) => p.generated).length,
    createdEmails: createdEmails.slice(0, MAX_REPORTED_ISSUES),
    issues: plan.issues.slice(0, MAX_REPORTED_ISSUES),
    additionalIssues: Math.max(0, plan.issues.length - MAX_REPORTED_ISSUES),
  });
});
