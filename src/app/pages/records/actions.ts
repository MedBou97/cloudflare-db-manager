"use server";

import { db } from "@/db";
import { requestInfo } from "rwsdk/worker";
import { ROLES, AUDIT_ACTIONS, RECORDS_PER_PAGE } from "@/app/shared/constants";

// ─── Internal audit helper ───────────────────────────────────────────────────

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

// ─── Read ─────────────────────────────────────────────────────────────────────

export type GetRecordsParams = {
  page?: number;
  search?: string;
  category?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
};

export async function getRecords(params: GetRecordsParams = {}) {
  const { ctx } = requestInfo;
  if (!ctx.user?.verified) {
    return { error: "Unauthorized" as const, records: [], total: 0, page: 1 };
  }

  const page = Math.max(1, params.page ?? 1);
  const search = params.search?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const allowedSortFields = ["createdAt", "updatedAt", "label", "numericValue", "confidence", "category"] as const;
  type SortField = (typeof allowedSortFields)[number];
  const sort: SortField = allowedSortFields.includes(params.sort as SortField)
    ? (params.sort as SortField)
    : "createdAt";
  const order = params.order === "asc" ? "asc" : "desc";

  const where = {
    AND: [
      search
        ? {
            OR: [
              { label: { contains: search } },
              { description: { contains: search } },
              { category: { contains: search } },
              { source: { contains: search } },
            ],
          }
        : {},
      category ? { category: { equals: category } } : {},
      status ? { status: { equals: status } } : {},
    ],
  };

  const [records, total] = await Promise.all([
    db.vectorRecord.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * RECORDS_PER_PAGE,
      take: RECORDS_PER_PAGE,
      include: { createdBy: { select: { username: true } } },
    }),
    db.vectorRecord.count({ where }),
  ]);

  /*
    might not need to log record views since not much important and might generate a lot of logs,
	but can always add later if needed
  */
  // await logAction(
  //   ctx.user.id,
  //   ctx.user.username,
  //   AUDIT_ACTIONS.VIEW_RECORDS,
  //   null,
  //   `${ctx.user.username} browsed records (page ${page}${search ? `, search: "${search}"` : ""}${category ? `, category: "${category}"` : ""}${status ? `, status: "${status}"` : ""})`,
  // );

  return { records, total, page, error: null };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createRecord(formData: FormData) {
  const { ctx } = requestInfo;
  if (!ctx.user?.verified || ctx.user.role !== ROLES.ADMIN) {
    return { error: "Forbidden" };
  }

  const label = (formData.get("label") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const source = (formData.get("source") as string)?.trim();
  const tagsRaw = (formData.get("tags") as string)?.trim();
  const numericValueRaw = formData.get("numericValue") as string;
  const confidenceRaw = formData.get("confidence") as string;
  const vectorRaw = (formData.get("vector") as string)?.trim();
  const metadataRaw = (formData.get("metadata") as string)?.trim() || "{}";
  const status = (formData.get("status") as string)?.trim() || "active";
  const datasetId = (formData.get("datasetId") as string)?.trim() || null;

  if (!label || !description || !category || !source) {
    return { error: "Label, description, category, and source are required." };
  }

  const numericValue = parseFloat(numericValueRaw);
  const confidence = parseFloat(confidenceRaw);
  if (isNaN(numericValue) || isNaN(confidence)) {
    return { error: "Numeric value and confidence must be valid numbers." };
  }
  if (confidence < 0 || confidence > 1) {
    return { error: "Confidence must be between 0 and 1." };
  }

  let parsedVector: number[];
  try {
    parsedVector = JSON.parse(vectorRaw);
    if (!Array.isArray(parsedVector) || !parsedVector.every((v) => typeof v === "number")) {
      throw new Error("Not a number array");
    }
  } catch {
    return { error: "Vector must be a valid JSON array of numbers." };
  }

  try {
    JSON.parse(metadataRaw);
  } catch {
    return { error: "Metadata must be valid JSON." };
  }

  let tagsJson = "[]";
  if (tagsRaw) {
    try {
      const parsed = JSON.parse(tagsRaw);
      tagsJson = JSON.stringify(parsed);
    } catch {
      tagsJson = JSON.stringify(tagsRaw.split(",").map((t) => t.trim()).filter(Boolean));
    }
  }

  const id = crypto.randomUUID();

  try {
    await db.vectorRecord.create({
      data: {
        id,
        label,
        description,
        category,
        source,
        tags: tagsJson,
        numericValue,
        confidence,
        vector: JSON.stringify(parsedVector),
        dimension: parsedVector.length,
        metadata: metadataRaw,
        status,
        version: 1,
        createdById: ctx.user.id,
        datasetId,
      },
    });
  } catch (e) {
    console.error("createRecord db error", e);
    return { error: "Failed to save record. Check that metadata/vector values are valid." };
  }

  await logAction(
    ctx.user.id,
    ctx.user.username,
    AUDIT_ACTIONS.CREATE_RECORD,
    id,
    `${ctx.user.username} created record "${label}" (id: ${id})`,
  );

  return { success: true, id };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateRecord(id: string, formData: FormData) {
  const { ctx } = requestInfo;
  if (!ctx.user?.verified || ctx.user.role !== ROLES.ADMIN) {
    return { error: "Forbidden" };
  }

  const existing = await db.vectorRecord.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Record not found." };
  }

  const label = (formData.get("label") as string)?.trim() || existing.label;
  const description = (formData.get("description") as string)?.trim() || existing.description;
  const category = (formData.get("category") as string)?.trim() || existing.category;
  const source = (formData.get("source") as string)?.trim() || existing.source;
  const tagsRaw = (formData.get("tags") as string)?.trim();
  const numericValueRaw = formData.get("numericValue") as string;
  const confidenceRaw = formData.get("confidence") as string;
  const vectorRaw = (formData.get("vector") as string)?.trim();
  const metadataRaw = (formData.get("metadata") as string)?.trim() || existing.metadata;
  const status = (formData.get("status") as string)?.trim() || existing.status;

  const numericValue = numericValueRaw !== null && numericValueRaw !== ""
    ? parseFloat(numericValueRaw)
    : existing.numericValue;
  const confidence = confidenceRaw !== null && confidenceRaw !== ""
    ? parseFloat(confidenceRaw)
    : existing.confidence;

  if (isNaN(numericValue) || isNaN(confidence)) {
    return { error: "Numeric value and confidence must be valid numbers." };
  }
  if (confidence < 0 || confidence > 1) {
    return { error: "Confidence must be between 0 and 1." };
  }

  let vectorJson = existing.vector;
  let dimension = existing.dimension;
  if (vectorRaw) {
    try {
      const parsed = JSON.parse(vectorRaw);
      if (!Array.isArray(parsed) || !parsed.every((v) => typeof v === "number")) {
        throw new Error();
      }
      vectorJson = JSON.stringify(parsed);
      dimension = parsed.length;
    } catch {
      return { error: "Vector must be a valid JSON array of numbers." };
    }
  }

  try {
    JSON.parse(metadataRaw);
  } catch {
    return { error: "Metadata must be valid JSON." };
  }

  let tagsJson = existing.tags;
  if (tagsRaw !== null && tagsRaw !== undefined) {
    try {
      const parsed = JSON.parse(tagsRaw);
      tagsJson = JSON.stringify(parsed);
    } catch {
      tagsJson = JSON.stringify(tagsRaw.split(",").map((t) => t.trim()).filter(Boolean));
    }
  }

  try {
    await db.vectorRecord.update({
      where: { id },
      data: {
        label,
        description,
        category,
        source,
        tags: tagsJson,
        numericValue,
        confidence,
        vector: vectorJson,
        dimension,
        metadata: metadataRaw,
        status,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  } catch (e) {
    console.error("updateRecord db error", e);
    return { error: "Failed to update record. Check that metadata/vector values are valid." };
  }

  await logAction(
    ctx.user.id,
    ctx.user.username,
    AUDIT_ACTIONS.EDIT_RECORD,
    id,
    `${ctx.user.username} edited record "${label}" (id: ${id})`,
  );

  return { success: true };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteRecord(id: string) {
  const { ctx } = requestInfo;
  if (!ctx.user?.verified || ctx.user.role !== ROLES.ADMIN) {
    return { error: "Forbidden" };
  }

  const existing = await db.vectorRecord.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Record not found." };
  }

  await db.vectorRecord.delete({ where: { id } });

  await logAction(
    ctx.user.id,
    ctx.user.username,
    AUDIT_ACTIONS.DELETE_RECORD,
    id,
    `${ctx.user.username} deleted record "${existing.label}" (id: ${id})`,
  );

  return { success: true };
}

// ─── Get distinct categories for filter dropdown ─────────────────────────────

export async function getCategories() {
  const results = await db.vectorRecord.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return results.map((r) => r.category);
}
