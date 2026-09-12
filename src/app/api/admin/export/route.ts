import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth/session";
import { DEMOGRAPHICS, LIKERT_MODULES } from "@/lib/survey/schema";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const users = await db.listUsers();
  const responses = await db.listAllResponses();
  const responseByUserId = new Map(responses.map((r) => [r.userId, r]));

  const itemCodes = LIKERT_MODULES.flatMap((m) => m.items.map((i) => i.code));
  const demographicCodes = DEMOGRAPHICS.fields.map((f) => f.code);

  const header = [
    "participant_id",
    "email",
    "registered_at",
    "consented_at",
    "completed_at",
    ...demographicCodes,
    ...itemCodes,
  ];

  const rows = users.map((user) => {
    const record = responseByUserId.get(user.id);
    const cells = [
      user.id,
      user.email,
      user.createdAt,
      user.consentAt ?? "",
      record?.completedAt ?? "",
      ...demographicCodes.map((code) => record?.demographics[code] ?? ""),
      ...itemCodes.map((code) => {
        const value = record?.answers[code];
        return typeof value === "number" ? String(value) : "";
      }),
    ];
    return cells.map((c) => csvEscape(String(c))).join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cognitiverhythm-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
