"use server";

import { db } from "@/db";
import { requestInfo } from "rwsdk/worker";
import { ROLES, AUDIT_ACTIONS } from "@/app/shared/constants";
import { logAction } from "@/app/pages/records/actions";
import { env } from "cloudflare:workers";
import { encryptSecretPayload, decryptSecretPayload } from "./crypto";
import {
  testPostgresConnection,
  getTableRows as fetchTableRows,
  insertTableRow as insertPgRow,
  updateTableRow as updatePgRow,
  deleteTableRow as deletePgRow,
  executeSqlWithGuardrails,
  type TableRowsResult,
} from "./postgres";

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidationError = { row: number; field: string; message: string };

type ImportRecordRow = {
  label: string;
  description: string;
  category: string;
  source: string;
  numericValue: number;
  confidence: number;
  vector: number[];
  tags?: unknown;
  metadata?: unknown;
  status?: string;
};

function validateImportRecord(row: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const rowNum = index + 1;

  if (typeof row !== "object" || row === null || Array.isArray(row)) {
    return [{ row: rowNum, field: "row", message: "Each item must be a JSON object" }];
  }

  const r = row as Record<string, unknown>;

  for (const field of ["label", "description", "category", "source"] as const) {
    if (!r[field] || typeof r[field] !== "string" || !(r[field] as string).trim()) {
      errors.push({ row: rowNum, field, message: `"${field}" is required and must be a non-empty string` });
    }
  }

  if (typeof r.numericValue !== "number" || isNaN(r.numericValue)) {
    errors.push({ row: rowNum, field: "numericValue", message: '"numericValue" must be a number' });
  }

  if (typeof r.confidence !== "number" || isNaN(r.confidence)) {
    errors.push({ row: rowNum, field: "confidence", message: '"confidence" must be a number' });
  } else if ((r.confidence as number) < 0 || (r.confidence as number) > 1) {
    errors.push({ row: rowNum, field: "confidence", message: '"confidence" must be between 0 and 1' });
  }

  if (
    !Array.isArray(r.vector) ||
    (r.vector as unknown[]).length === 0 ||
    !(r.vector as unknown[]).every((v) => typeof v === "number" && !isNaN(v as number))
  ) {
    errors.push({ row: rowNum, field: "vector", message: '"vector" must be a non-empty array of numbers' });
  }

  if (r.tags !== undefined && r.tags !== null && !Array.isArray(r.tags) && typeof r.tags !== "string") {
    errors.push({ row: rowNum, field: "tags", message: '"tags" must be an array of strings, or omitted' });
  }

  if (r.metadata !== undefined && r.metadata !== null && (typeof r.metadata !== "object" || Array.isArray(r.metadata))) {
    errors.push({ row: rowNum, field: "metadata", message: '"metadata" must be a JSON object, or omitted' });
  }

  return errors;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getDatasets() {
  const { ctx } = requestInfo;
  if (!ctx.user?.verified) return { error: "Unauthorized" as const, datasets: [] };

  const datasets = await db.dataset.findMany({
    orderBy: { importedAt: "desc" },
    include: {
      importedBy: { select: { username: true } },
      _count: { select: { records: true } },
    },
  });

  return { datasets, error: null };
}

export async function getDatasetById(id: string) {
  const { ctx } = requestInfo;
  if (!ctx.user?.verified) return { error: "Unauthorized" as const, dataset: null };

  const dataset = await db.dataset.findUnique({
    where: { id },
    include: {
      importedBy: { select: { username: true } },
      _count: { select: { records: true } },
    },
  });

  if (!dataset) return { error: "Dataset not found" as const, dataset: null };
  return { dataset, error: null };
}

export async function getDatabaseConnections() {
  const { ctx } = requestInfo;
  if (!ctx.user?.verified) {
    return { error: "Unauthorized" as const, connections: [] };
  }

  const where = ctx.user.role === ROLES.ADMIN ? {} : { createdById: ctx.user.id };
  const connections = await db.databaseConnection.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { username: true } },
    },
  });

  return { error: null, connections };
}

type CreateConnectionResult =
  | { error: null; connectionId: string }
  | { error: string; connectionId: null };

function parseHostAndPortFromUrl(url: URL) {
  const host = url.hostname;
  const port = url.port ? parseInt(url.port, 10) : 5432;
  return { host, port };
}

function buildConnectionString(formData: FormData) {
  const connectionStringInput = (formData.get("connectionString") as string | null)?.trim() ?? "";
  if (connectionStringInput) {
    return { connectionString: connectionStringInput, fromUrl: new URL(connectionStringInput) };
  }

  const host = (formData.get("host") as string | null)?.trim() ?? "";
  const portRaw = (formData.get("port") as string | null)?.trim() ?? "5432";
  const databaseName = (formData.get("databaseName") as string | null)?.trim() ?? "";
  const username = (formData.get("username") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const sslMode = (formData.get("sslMode") as string | null)?.trim() || "require";

  if (!host || !databaseName || !username || !password) {
    throw new Error("Host, database, username, and password are required when no connection string is provided.");
  }

  const port = parseInt(portRaw, 10);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error("Port must be a valid positive number.");
  }

  const dbPath = databaseName.startsWith("/") ? databaseName : `/${databaseName}`;
  const url = new URL(`postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}${dbPath}`);
  url.searchParams.set("sslmode", sslMode);

  return { connectionString: url.toString(), fromUrl: url };
}

export async function createDatabaseConnection(formData: FormData): Promise<CreateConnectionResult> {
  const { ctx } = requestInfo;
  if (!ctx.user?.verified) {
    return { error: "Unauthorized", connectionId: null };
  }

  const encryptionSecret = env.DB_CONNECTION_ENCRYPTION_KEY;
  if (!encryptionSecret) {
    return { error: "Server is missing DB_CONNECTION_ENCRYPTION_KEY.", connectionId: null };
  }

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (!name) {
    return { error: "Connection name is required.", connectionId: null };
  }

  let built: { connectionString: string; fromUrl: URL };
  try {
    built = buildConnectionString(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid connection details.",
      connectionId: null,
    };
  }

  if (built.fromUrl.protocol !== "postgres:" && built.fromUrl.protocol !== "postgresql:") {
    return { error: "Only PostgreSQL connection strings are supported.", connectionId: null };
  }

  const parsed = parseHostAndPortFromUrl(built.fromUrl);
  const dbName = decodeURIComponent((built.fromUrl.pathname || "").replace(/^\//, ""));
  const username = decodeURIComponent(built.fromUrl.username || "");
  const sslMode = built.fromUrl.searchParams.get("sslmode") ?? "require";

  if (!parsed.host || !dbName || !username) {
    return {
      error: "Connection string must include host, database name, and username.",
      connectionId: null,
    };
  }

  try {
    await testPostgresConnection(built.connectionString);
  } catch {
    return {
      error: "Could not connect to PostgreSQL. Check your credentials and host.",
      connectionId: null,
    };
  }

  const encryptedConfig = await encryptSecretPayload(
    JSON.stringify({ connectionString: built.connectionString }),
    encryptionSecret,
  );

  const connection = await db.databaseConnection.create({
    data: {
      id: crypto.randomUUID(),
      name,
      host: parsed.host,
      port: parsed.port,
      databaseName: dbName,
      username,
      sslMode,
      encryptedConfig,
      status: "active",
      lastTestedAt: new Date(),
      lastError: null,
      createdById: ctx.user.id,
    },
  });

  await logAction(
    ctx.user.id,
    ctx.user.username,
    AUDIT_ACTIONS.CREATE_DB_CONNECTION,
    connection.id,
    `${ctx.user.username} created PostgreSQL connection profile "${name}"`,
  );

  return { error: null, connectionId: connection.id };
}

export async function testSavedDatabaseConnection(connectionId: string) {
  const { ctx } = requestInfo;
  if (!ctx.user?.verified) {
    return { error: "Unauthorized" as const };
  }

  const encryptionSecret = env.DB_CONNECTION_ENCRYPTION_KEY;
  if (!encryptionSecret) {
    return { error: "Server is missing DB_CONNECTION_ENCRYPTION_KEY." as const };
  }

  const connection = await db.databaseConnection.findUnique({ where: { id: connectionId } });
  if (!connection) {
    return { error: "Connection not found." as const };
  }

  if (ctx.user.role !== ROLES.ADMIN && connection.createdById !== ctx.user.id) {
    return { error: "Forbidden" as const };
  }

  let connectionString = "";
  try {
    const payload = await decryptSecretPayload(connection.encryptedConfig, encryptionSecret);
    connectionString = (JSON.parse(payload) as { connectionString: string }).connectionString;
  } catch {
    await db.databaseConnection.update({
      where: { id: connectionId },
      data: { lastTestedAt: new Date(), lastError: "Failed to decrypt credentials" },
    });
    return { error: "Failed to decrypt saved credentials." as const };
  }

  try {
    await testPostgresConnection(connectionString);
    await db.databaseConnection.update({
      where: { id: connectionId },
      data: { lastTestedAt: new Date(), lastError: null },
    });
  } catch {
    await db.databaseConnection.update({
      where: { id: connectionId },
      data: { lastTestedAt: new Date(), lastError: "Connection test failed" },
    });
    return { error: "Connection test failed." as const };
  }

  await logAction(
    ctx.user.id,
    ctx.user.username,
    AUDIT_ACTIONS.TEST_DB_CONNECTION,
    connection.id,
    `${ctx.user.username} tested PostgreSQL connection profile "${connection.name}"`,
  );

  return { success: true as const };
}

type AccessResolved = {
  ctx: NonNullable<(typeof requestInfo)["ctx"]>;
  connection: NonNullable<Awaited<ReturnType<typeof db.databaseConnection.findUnique>>>;
  connectionString: string;
};

async function resolveDatabaseConnectionAccess(connectionId: string): Promise<AccessResolved | { error: string }> {
  const { ctx } = requestInfo;
  if (!ctx.user?.verified) {
    return { error: "Unauthorized" };
  }

  const encryptionSecret = env.DB_CONNECTION_ENCRYPTION_KEY;
  if (!encryptionSecret) {
    return { error: "Server is missing DB_CONNECTION_ENCRYPTION_KEY." };
  }

  const connection = await db.databaseConnection.findUnique({ where: { id: connectionId } });
  if (!connection) {
    return { error: "Connection not found." };
  }

  if (ctx.user.role !== ROLES.ADMIN && connection.createdById !== ctx.user.id) {
    return { error: "Forbidden" };
  }

  try {
    const payload = await decryptSecretPayload(connection.encryptedConfig, encryptionSecret);
    const connectionString = (JSON.parse(payload) as { connectionString: string }).connectionString;
    return { ctx, connection, connectionString };
  } catch {
    return { error: "Failed to decrypt saved credentials." };
  }
}

export type GetTableRowsInput = {
  connectionId: string;
  schemaName: string;
  tableName: string;
  page?: number;
  pageSize?: number;
  search?: string;
  searchColumn?: string;
  sortColumn?: string;
  sortOrder?: "asc" | "desc";
};

export type GetTableRowsOutput =
  | { error: string; data: null }
  | { error: null; data: TableRowsResult & { connectionName: string; canMutate: boolean } };

export async function getTableRows(input: GetTableRowsInput): Promise<GetTableRowsOutput> {
  const resolved = await resolveDatabaseConnectionAccess(input.connectionId);
  if ("error" in resolved) {
    return { error: resolved.error, data: null };
  }

  try {
    const data = await fetchTableRows(resolved.connectionString, {
      schema: input.schemaName,
      table: input.tableName,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 25,
      search: input.search,
      searchColumn: input.searchColumn,
      sortColumn: input.sortColumn,
      sortOrder: input.sortOrder,
    });

    return {
      error: null,
      data: {
        ...data,
        connectionName: resolved.connection.name,
        canMutate: resolved.ctx.user?.role === ROLES.ADMIN,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to load table rows.",
      data: null,
    };
  }
}

type RowMutationInput = {
  connectionId: string;
  schemaName: string;
  tableName: string;
  values?: Record<string, unknown>;
  primaryKeyValues?: Record<string, unknown>;
};

function isAdmin(ctx: AccessResolved["ctx"]) {
  return ctx.user?.role === ROLES.ADMIN;
}

export async function insertTableRow(input: RowMutationInput) {
  const resolved = await resolveDatabaseConnectionAccess(input.connectionId);
  if ("error" in resolved) {
    return { error: resolved.error };
  }
  if (!isAdmin(resolved.ctx)) {
    return { error: "Only admins can insert rows." };
  }
  if (!input.values || typeof input.values !== "object") {
    return { error: "Insert values are required." };
  }

  try {
    const row = await insertPgRow(
      resolved.connectionString,
      input.schemaName,
      input.tableName,
      input.values,
    );

    await logAction(
      resolved.ctx.user!.id,
      resolved.ctx.user!.username,
      AUDIT_ACTIONS.INSERT_TABLE_ROW,
      resolved.connection.id,
      `${resolved.ctx.user!.username} inserted a row into ${input.schemaName}.${input.tableName}`,
    );

    return { error: null, row };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to insert row." };
  }
}

export async function updateTableRow(input: RowMutationInput) {
  const resolved = await resolveDatabaseConnectionAccess(input.connectionId);
  if ("error" in resolved) {
    return { error: resolved.error };
  }
  if (!isAdmin(resolved.ctx)) {
    return { error: "Only admins can update rows." };
  }
  if (!input.values || typeof input.values !== "object") {
    return { error: "Update values are required." };
  }
  if (!input.primaryKeyValues || typeof input.primaryKeyValues !== "object") {
    return { error: "Primary key values are required for update." };
  }

  try {
    const row = await updatePgRow(
      resolved.connectionString,
      input.schemaName,
      input.tableName,
      input.primaryKeyValues,
      input.values,
    );

    if (!row) {
      return { error: "No row matched the provided primary key." };
    }

    await logAction(
      resolved.ctx.user!.id,
      resolved.ctx.user!.username,
      AUDIT_ACTIONS.UPDATE_TABLE_ROW,
      resolved.connection.id,
      `${resolved.ctx.user!.username} updated a row in ${input.schemaName}.${input.tableName}`,
    );

    return { error: null, row };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update row." };
  }
}

export async function deleteTableRow(input: RowMutationInput) {
  const resolved = await resolveDatabaseConnectionAccess(input.connectionId);
  if ("error" in resolved) {
    return { error: resolved.error };
  }
  if (!isAdmin(resolved.ctx)) {
    return { error: "Only admins can delete rows." };
  }
  if (!input.primaryKeyValues || typeof input.primaryKeyValues !== "object") {
    return { error: "Primary key values are required for delete." };
  }

  try {
    const result = await deletePgRow(
      resolved.connectionString,
      input.schemaName,
      input.tableName,
      input.primaryKeyValues,
    );

    if (!result.deleted) {
      return { error: "No row matched the provided primary key." };
    }

    await logAction(
      resolved.ctx.user!.id,
      resolved.ctx.user!.username,
      AUDIT_ACTIONS.DELETE_TABLE_ROW,
      resolved.connection.id,
      `${resolved.ctx.user!.username} deleted a row from ${input.schemaName}.${input.tableName}`,
    );

    return { error: null, deleted: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete row." };
  }
}

export type ExecuteSqlInput = {
  connectionId: string;
  query: string;
  confirmed?: boolean;
  timeoutMs?: number;
  maxRows?: number;
};

export async function executeSqlQuery(input: ExecuteSqlInput) {
  const resolved = await resolveDatabaseConnectionAccess(input.connectionId);
  if ("error" in resolved) {
    return { error: resolved.error };
  }
  if (!isAdmin(resolved.ctx)) {
    return { error: "Only admins can execute SQL queries." };
  }

  const result = await executeSqlWithGuardrails(resolved.connectionString, {
    query: input.query,
    confirmed: Boolean(input.confirmed),
    timeoutMs: input.timeoutMs,
    maxRows: input.maxRows,
  });

  if (!result.error && !result.requiresConfirmation) {
    await logAction(
      resolved.ctx.user!.id,
      resolved.ctx.user!.username,
      AUDIT_ACTIONS.EXECUTE_SQL_QUERY,
      resolved.connection.id,
      `${resolved.ctx.user!.username} executed SQL on connection "${resolved.connection.name}"`,
    );
  }

  return result;
}

// ─── Import ───────────────────────────────────────────────────────────────────

export type ImportResult =
  | { datasetId: string; error: null; validationErrors?: never }
  | { datasetId: null; error: string; validationErrors?: never }
  | { datasetId: null; error: null; validationErrors: ValidationError[] };

export async function importDataset(formData: FormData): Promise<ImportResult> {
  const { ctx } = requestInfo;
  if (!ctx.user?.verified || ctx.user.role !== ROLES.ADMIN) {
    return { datasetId: null, error: "Forbidden" };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const fileText = formData.get("file") as string;

  if (!name) return { datasetId: null, error: "Dataset name is required." };
  if (!fileText) return { datasetId: null, error: "No file content provided." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(fileText);
  } catch {
    return { datasetId: null, error: "File is not valid JSON." };
  }

  let records: unknown[];
  if (Array.isArray(parsed)) {
    records = parsed;
  } else if (typeof parsed === "object" && parsed !== null && "records" in parsed) {
    const wrapper = parsed as { records: unknown };
    if (!Array.isArray(wrapper.records)) {
      return { datasetId: null, error: 'The "records" field must be an array.' };
    }
    records = wrapper.records;
  } else {
    return { datasetId: null, error: 'JSON must be an array or an object with a "records" array.' };
  }

  if (records.length === 0) {
    return { datasetId: null, error: "The records array is empty." };
  }

  const allErrors: ValidationError[] = [];
  for (let i = 0; i < records.length; i++) {
    allErrors.push(...validateImportRecord(records[i], i));
  }
  if (allErrors.length > 0) {
    return { datasetId: null, error: null, validationErrors: allErrors };
  }

  const datasetId = crypto.randomUUID();
  const typedRecords = records as ImportRecordRow[];

  try {
    await db.dataset.create({
      data: { id: datasetId, name, description, importedById: ctx.user.id },
    });

    await db.vectorRecord.createMany({
      data: typedRecords.map((row) => {
        const tags = Array.isArray(row.tags)
          ? JSON.stringify(row.tags)
          : typeof row.tags === "string"
          ? JSON.stringify(row.tags.split(",").map((t) => t.trim()).filter(Boolean))
          : "[]";
        const metadata =
          row.metadata && typeof row.metadata === "object" ? JSON.stringify(row.metadata) : "{}";

        return {
          id: crypto.randomUUID(),
          label: row.label.trim(),
          description: row.description.trim(),
          category: row.category.trim(),
          source: row.source.trim(),
          tags,
          numericValue: row.numericValue,
          confidence: row.confidence,
          vector: JSON.stringify(row.vector),
          dimension: (row.vector as number[]).length,
          metadata,
          status: row.status ?? "active",
          version: 1,
          createdById: ctx.user!.id,
          datasetId,
        };
      }),
    });
  } catch (e) {
    console.error("importDataset error", e);
    await db.dataset.delete({ where: { id: datasetId } }).catch(() => {});
    return { datasetId: null, error: "Failed to save dataset to the database." };
  }

  await logAction(
    ctx.user.id,
    ctx.user.username,
    AUDIT_ACTIONS.IMPORT_DATASET,
    datasetId,
    `${ctx.user.username} imported dataset "${name}" with ${records.length} record${records.length !== 1 ? "s" : ""}`,
  );

  return { datasetId, error: null };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteDataset(id: string) {
  const { ctx } = requestInfo;
  if (!ctx.user?.verified || ctx.user.role !== ROLES.ADMIN) {
    return { error: "Forbidden" };
  }

  const dataset = await db.dataset.findUnique({ where: { id } });
  if (!dataset) return { error: "Dataset not found." };

  await db.vectorRecord.deleteMany({ where: { datasetId: id } });
  await db.dataset.delete({ where: { id } });

  await logAction(
    ctx.user.id,
    ctx.user.username,
    AUDIT_ACTIONS.DELETE_DATASET,
    id,
    `${ctx.user.username} deleted dataset "${dataset.name}"`,
  );

  return { success: true };
}
