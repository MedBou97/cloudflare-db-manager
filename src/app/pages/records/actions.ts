"use server";

import { db } from "@/db";

// ─── Internal audit helper ────────────────────────────────────────────────────

export async function logAction(
  userId: string,
  username: string,
  action: string,
  resourceId: string | null,
  details: string,
) {
  await db.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      username,
      action,
      resourceId,
      details,
    },
  });
}
