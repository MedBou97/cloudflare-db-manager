"use server";

import { db } from "@/db";
import { requestInfo } from "rwsdk/worker";
import { ROLES, AUDIT_ACTIONS } from "@/app/shared/constants";
import { logAction } from "@/app/pages/records/actions";
import { env } from "cloudflare:workers";
import { canMutateDatabaseRows, isAdminUser } from "@/app/shared/accessControl";
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

// ─────────────────────────────────────────────────────────────────────────────


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
        canMutate: canMutateDatabaseRows(resolved.ctx.user),
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
  return isAdminUser(ctx.user);
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


