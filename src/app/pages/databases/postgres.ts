import { neon } from "@neondatabase/serverless";

export type PostgresTableInfo = {
  schema: string;
  name: string;
};

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
