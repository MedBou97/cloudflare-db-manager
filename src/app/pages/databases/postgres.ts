import { neon } from "@neondatabase/serverless";

export type PostgresTableInfo = {
  schema: string;
  name: string;
};

export type TableColumnInfo = {
  name: string;
  dataType: string;
  udtName: string;
  isNullable: boolean;
  defaultValue: string | null;
  /** 'ALWAYS' | 'BY DEFAULT' when the column is a GENERATED … AS IDENTITY column, otherwise null */
  identityGeneration: string | null;
  isPrimaryKey: boolean;
};

export type TableRowsQuery = {
  schema: string;
  table: string;
  page: number;
  pageSize: number;
  search?: string;
  searchColumn?: string;
  sortColumn?: string;
  sortOrder?: "asc" | "desc";
};

export type TableRowsResult = {
  schema: string;
  table: string;
  columns: TableColumnInfo[];
  rows: Array<Record<string, unknown>>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrimaryKey: boolean;
  primaryKeyColumns: string[];
};

export type ExecuteSqlInput = {
  query: string;
  confirmed: boolean;
  timeoutMs?: number;
  maxRows?: number;
};

export type ExecuteSqlResult = {
  error: string | null;
  requiresConfirmation?: boolean;
  columns?: string[];
  rows?: Array<Record<string, unknown>>;
  rowCount?: number;
  durationMs?: number;
  limited?: boolean;
};

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 15000;
const DEFAULT_MAX_ROWS = 250;
const MAX_MAX_ROWS = 1000;

function quoteIdentifier(identifier: string): string {
  if (!identifier || identifier.includes("\0")) {
    throw new Error("Invalid SQL identifier");
  }
  return `"${identifier.replace(/"/g, '""')}"`;
}

function buildQualifiedTableName(schema: string, table: string) {
  return `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
}

function clampPageSize(pageSize: number) {
  if (!Number.isFinite(pageSize)) return 25;
  return Math.max(1, Math.min(100, Math.floor(pageSize)));
}

function clampPage(page: number) {
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.floor(page));
}

function makePlaceholder(params: unknown[], value: unknown) {
  params.push(value);
  return `$${params.length}`;
}

function stripTrailingSemicolon(query: string) {
  return query.trim().replace(/;+\s*$/, "");
}

function isPotentiallyDestructiveSql(query: string) {
  const normalized = query.toLowerCase();
  if (/(^|\s)(drop|truncate|alter|create|grant|revoke|comment|vacuum|reindex|cluster)\b/.test(normalized)) {
    return true;
  }
  if (/(^|\s)(update|delete)\b/.test(normalized)) {
    return true;
  }
  return false;
}

function isReadQuery(query: string) {
  const normalized = query.trim().toLowerCase();
  return normalized.startsWith("select") || normalized.startsWith("with") || normalized.startsWith("show") || normalized.startsWith("explain");
}

function hasMultipleStatements(query: string) {
  return query.split(";").map((chunk) => chunk.trim()).filter(Boolean).length > 1;
}

async function queryWithTimeout(
  connectionString: string,
  queryText: string,
  params: unknown[] = [],
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  const sql = neon(connectionString);
  const effectiveTimeout = Math.max(500, Math.min(timeoutMs, MAX_TIMEOUT_MS));
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

  try {
    return await sql.query(queryText, params, { fetchOptions: { signal: controller.signal } });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function testPostgresConnection(connectionString: string) {
  const sql = neon(connectionString);
  await sql`SELECT 1 AS ok`;
}

export async function listPostgresTables(connectionString: string): Promise<PostgresTableInfo[]> {
  const sql = neon(connectionString);
  const rows = (await sql`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema ASC, table_name ASC
  `) as Array<{ table_schema: string; table_name: string }>;

  return rows.map((row) => ({ schema: row.table_schema, name: row.table_name }));
}

export async function getTableSchema(connectionString: string, schema: string, table: string): Promise<TableColumnInfo[]> {
  const sql = neon(connectionString);

  const pkRows = (await sql.query(
    `
      SELECT a.attname AS column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      JOIN pg_class c ON c.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE i.indisprimary = true
        AND n.nspname = $1
        AND c.relname = $2
      ORDER BY array_position(i.indkey, a.attnum)
    `,
    [schema, table],
  )) as Array<{ column_name: string }>;

  const pkSet = new Set(pkRows.map((row) => row.column_name));
  const rows = (await sql.query(
    `
      SELECT column_name, data_type, udt_name, is_nullable, column_default, identity_generation
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position ASC
    `,
    [schema, table],
  )) as Array<{
    column_name: string;
    data_type: string;
    udt_name: string;
    is_nullable: "YES" | "NO";
    column_default: string | null;
    identity_generation: string | null;
  }>;

  return rows.map((row) => ({
    name: row.column_name,
    dataType: row.data_type,
    udtName: row.udt_name,
    isNullable: row.is_nullable === "YES",
    defaultValue: row.column_default,
    identityGeneration: row.identity_generation ?? null,
    isPrimaryKey: pkSet.has(row.column_name),
  }));
}

export async function getTableRows(connectionString: string, input: TableRowsQuery): Promise<TableRowsResult> {
  const page = clampPage(input.page);
  const pageSize = clampPageSize(input.pageSize);
  const schema = input.schema;
  const table = input.table;
  const search = input.search?.trim() ?? "";

  const columns = await getTableSchema(connectionString, schema, table);
  if (columns.length === 0) {
    throw new Error("Table not found or has no columns");
  }

  const primaryKeyColumns = columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
  const hasPrimaryKey = primaryKeyColumns.length > 0;
  const validColumns = new Set(columns.map((c) => c.name));

  const sortColumn = input.sortColumn && validColumns.has(input.sortColumn)
    ? input.sortColumn
    : primaryKeyColumns[0] ?? columns[0].name;
  const sortOrder = input.sortOrder === "asc" ? "asc" : "desc";

  const params: unknown[] = [];
  const whereParts: string[] = [];

  if (search) {
    const searchColumn = input.searchColumn && validColumns.has(input.searchColumn)
      ? input.searchColumn
      : null;
    const term = `%${search}%`;
    if (searchColumn) {
      const p = makePlaceholder(params, term);
      whereParts.push(`CAST(${quoteIdentifier(searchColumn)} AS TEXT) ILIKE ${p}`);
    } else {
      const textColumns = columns.map((col) => `CAST(${quoteIdentifier(col.name)} AS TEXT) ILIKE ${makePlaceholder(params, term)}`);
      whereParts.push(`(${textColumns.join(" OR ")})`);
    }
  }

  const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
  const qualifiedTable = buildQualifiedTableName(schema, table);

  const totalRows = (await queryWithTimeout(
    connectionString,
    `SELECT COUNT(*)::int AS total FROM ${qualifiedTable} ${whereSql}`,
    params,
  )) as Array<{ total: number | string }>;

  const total = Number(totalRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;
  const rowParams = [...params, pageSize, offset];

  const rows = (await queryWithTimeout(
    connectionString,
    `
      SELECT *
      FROM ${qualifiedTable}
      ${whereSql}
      ORDER BY ${quoteIdentifier(sortColumn)} ${sortOrder.toUpperCase()}
      LIMIT $${rowParams.length - 1}
      OFFSET $${rowParams.length}
    `,
    rowParams,
  )) as Array<Record<string, unknown>>;

  return {
    schema,
    table,
    columns,
    rows,
    page,
    pageSize,
    total,
    totalPages,
    hasPrimaryKey,
    primaryKeyColumns,
  };
}

export async function insertTableRow(
  connectionString: string,
  schema: string,
  table: string,
  values: Record<string, unknown>,
) {
  const columns = await getTableSchema(connectionString, schema, table);
  const allowed = new Set(columns.map((col) => col.name));

  const entries = Object.entries(values).filter(([key, value]) => allowed.has(key) && value !== undefined);
  if (entries.length === 0) {
    throw new Error("No valid values were provided for insert");
  }

  const colsSql = entries.map(([key]) => quoteIdentifier(key)).join(", ");
  const placeholders = entries.map((_, i) => `$${i + 1}`).join(", ");
  const params = entries.map(([, value]) => value);
  const qualifiedTable = buildQualifiedTableName(schema, table);

  const rows = (await queryWithTimeout(
    connectionString,
    `INSERT INTO ${qualifiedTable} (${colsSql}) VALUES (${placeholders}) RETURNING *`,
    params,
  )) as Array<Record<string, unknown>>;

  return rows[0] ?? null;
}

export async function updateTableRow(
  connectionString: string,
  schema: string,
  table: string,
  primaryKeyValues: Record<string, unknown>,
  values: Record<string, unknown>,
) {
  const columns = await getTableSchema(connectionString, schema, table);
  const pkColumns = columns.filter((col) => col.isPrimaryKey).map((col) => col.name);
  if (pkColumns.length === 0) {
    throw new Error("Table has no primary key");
  }

  const allowed = new Set(columns.map((col) => col.name));
  const updates = Object.entries(values)
    .filter(([key, value]) => allowed.has(key) && !pkColumns.includes(key) && value !== undefined);
  if (updates.length === 0) {
    throw new Error("No updatable values were provided");
  }

  const params: unknown[] = [];
  const setSql = updates
    .map(([key, value]) => `${quoteIdentifier(key)} = ${makePlaceholder(params, value)}`)
    .join(", ");

  const whereParts: string[] = [];
  for (const pk of pkColumns) {
    if (!(pk in primaryKeyValues)) {
      throw new Error(`Missing primary key value for ${pk}`);
    }
    whereParts.push(`${quoteIdentifier(pk)} = ${makePlaceholder(params, primaryKeyValues[pk])}`);
  }

  const qualifiedTable = buildQualifiedTableName(schema, table);
  const rows = (await queryWithTimeout(
    connectionString,
    `UPDATE ${qualifiedTable} SET ${setSql} WHERE ${whereParts.join(" AND ")} RETURNING *`,
    params,
  )) as Array<Record<string, unknown>>;

  return rows[0] ?? null;
}

export async function deleteTableRow(
  connectionString: string,
  schema: string,
  table: string,
  primaryKeyValues: Record<string, unknown>,
) {
  const columns = await getTableSchema(connectionString, schema, table);
  const pkColumns = columns.filter((col) => col.isPrimaryKey).map((col) => col.name);
  if (pkColumns.length === 0) {
    throw new Error("Table has no primary key");
  }

  const params: unknown[] = [];
  const whereParts: string[] = [];
  for (const pk of pkColumns) {
    if (!(pk in primaryKeyValues)) {
      throw new Error(`Missing primary key value for ${pk}`);
    }
    whereParts.push(`${quoteIdentifier(pk)} = ${makePlaceholder(params, primaryKeyValues[pk])}`);
  }

  const qualifiedTable = buildQualifiedTableName(schema, table);
  const rows = (await queryWithTimeout(
    connectionString,
    `DELETE FROM ${qualifiedTable} WHERE ${whereParts.join(" AND ")} RETURNING *`,
    params,
  )) as Array<Record<string, unknown>>;

  return { deleted: rows.length > 0, row: rows[0] ?? null };
}

export async function executeSqlWithGuardrails(connectionString: string, input: ExecuteSqlInput): Promise<ExecuteSqlResult> {
  const rawQuery = input.query?.trim() ?? "";
  if (!rawQuery) {
    return { error: "SQL query is required." };
  }

  if (hasMultipleStatements(rawQuery)) {
    return { error: "Only a single SQL statement can be executed at a time." };
  }

  const strippedQuery = stripTrailingSemicolon(rawQuery);
  const destructive = isPotentiallyDestructiveSql(strippedQuery);
  if (destructive && !input.confirmed) {
    return {
      error: "This query is potentially destructive and requires confirmation.",
      requiresConfirmation: true,
    };
  }

  const timeoutMs = Math.max(500, Math.min(input.timeoutMs ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS));
  const maxRows = Math.max(1, Math.min(input.maxRows ?? DEFAULT_MAX_ROWS, MAX_MAX_ROWS));
  const startedAt = Date.now();

  try {
    if (isReadQuery(strippedQuery)) {
      const boundedQuery = `SELECT * FROM (${strippedQuery}) AS rw_result LIMIT ${maxRows + 1}`;
      const allRows = (await queryWithTimeout(connectionString, boundedQuery, [], timeoutMs)) as Array<Record<string, unknown>>;
      const limited = allRows.length > maxRows;
      const rows = limited ? allRows.slice(0, maxRows) : allRows;
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      return {
        error: null,
        columns,
        rows,
        rowCount: rows.length,
        limited,
        durationMs: Date.now() - startedAt,
      };
    }

    const rows = (await queryWithTimeout(connectionString, strippedQuery, [], timeoutMs)) as Array<Record<string, unknown>>;
    return {
      error: null,
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      rows,
      rowCount: rows.length,
      limited: false,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute SQL query.";
    if (/abort/i.test(message) || /timed out/i.test(message)) {
      return { error: `Query exceeded timeout (${timeoutMs}ms).` };
    }
    return { error: message };
  }
}
