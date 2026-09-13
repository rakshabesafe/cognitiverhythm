import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/api/withErrorHandling";

export const POST = withErrorHandling(async (request: Request) => {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const userIds: unknown = body?.userIds;
  if (!Array.isArray(userIds) || userIds.length === 0 || !userIds.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "userIds must be a non-empty array of strings." }, { status: 400 });
  }

  await Promise.all(userIds.map((id) => db.deleteUser(id)));

  return NextResponse.json({ deleted: userIds.length });
});
