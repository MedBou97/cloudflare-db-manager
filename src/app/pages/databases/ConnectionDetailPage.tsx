import type { RequestInfo } from "rwsdk/worker";
import { db } from "@/db";
import { ROLES, AUDIT_ACTIONS } from "@/app/shared/constants";
import { AppShell } from "@/app/shared/AppShell";
import { decryptSecretPayload } from "./crypto";
import {
  getDatabaseConnectionEncryptionKey,
  MISSING_DB_CONNECTION_ENCRYPTION_KEY_ERROR,
} from "./encryptionKey";
import { listPostgresTables } from "./postgres";
import { logAction } from "@/app/pages/records/actions";
import { TestConnectionButton } from "./TestConnectionButton";

export async function ConnectionDetailPage({ ctx, request }: RequestInfo) {
  if (!ctx.user?.verified) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const connectionId = pathParts[pathParts.length - 1];

  const connection = await db.databaseConnection.findUnique({
    where: { id: connectionId },
    include: { createdBy: { select: { username: true } } },
  });

  if (!connection) {
    return new Response("Connection not found", { status: 404 });
  }

  if (ctx.user.role !== ROLES.ADMIN && connection.createdById !== ctx.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const encryptionSecret = getDatabaseConnectionEncryptionKey();
  if (!encryptionSecret) {
    return new Response(MISSING_DB_CONNECTION_ENCRYPTION_KEY_ERROR, { status: 500 });
  }

  let tables: { schema: string; name: string }[] = [];
  let loadError: string | null = null;

  try {
    const payload = await decryptSecretPayload(connection.encryptedConfig, encryptionSecret);
    const connectionString = (JSON.parse(payload) as { connectionString: string }).connectionString;
    tables = await listPostgresTables(connectionString);

    // currently this is causing a lot of log entries, can check it later
    // await logAction(
    //   ctx.user.id,
    //   ctx.user.username,
    //   AUDIT_ACTIONS.VIEW_DB_TABLES,
    //   connection.id,
    //   `${ctx.user.username} viewed tables for PostgreSQL profile "${connection.name}"`,
    // );
  } catch {
    loadError = "Could not load tables from this connection.";
  }

  return (
    <AppShell user={ctx.user} currentPath="/databases">
      <div className="mb-7">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
          <a
            href="/databases"
            className="text-sm text-[var(--c-text-muted)] no-underline hover:text-accent-strong"
          >
            ← Back to Databases
          </a>
          <div className="flex items-center gap-2">
            <a
              href={`/databases/connections/${connection.id}/sql`}
              className="px-4 py-2.5 border border-[var(--c-border-input)] rounded-xl bg-[var(--c-bg-control)] text-[var(--c-text-secondary)] text-sm no-underline"
            >
              SQL Editor
            </a>
            <TestConnectionButton connectionId={connection.id} />
          </div>
        </div>

        <h1 className="m-0 mb-1.5 font-serif text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.03em]">
          {connection.name}
        </h1>

        <p className="m-0 text-[var(--c-text-secondary)] text-[0.95rem]">
          {connection.username}@{connection.host}:{connection.port}/{connection.databaseName}
        </p>

        <p className="m-0 mt-1 text-[var(--c-text-muted)] text-[0.82rem]">
          Last test: {connection.lastTestedAt ? new Date(connection.lastTestedAt).toLocaleString() : "never"}
          {connection.lastError ? ` · Last error: ${connection.lastError}` : ""}
        </p>
      </div>

      {loadError ? (
        <p className="px-4 py-3 rounded-xl bg-[var(--c-danger-bg)] border border-[var(--c-danger-border)] text-[var(--c-danger-text)] text-sm m-0">
          {loadError}
        </p>
      ) : tables.length === 0 ? (
        <p className="py-[60px] px-6 text-center text-[var(--c-text-muted)] text-[0.95rem] border border-dashed border-[var(--c-border)] rounded-[20px]">
          No tables found in this database.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {tables.map((table) => (
            <a
              key={`${table.schema}.${table.name}`}
              href={`/databases/connections/${connection.id}/tables/${encodeURIComponent(table.schema)}/${encodeURIComponent(table.name)}`}
              className="p-5 border border-[var(--c-border)] rounded-2xl bg-[var(--c-bg-card)]"
            >
              <p className="m-0 text-xs uppercase tracking-[0.08em] text-[var(--c-text-muted)]">{table.schema}</p>
              <h2 className="m-0 mt-1 text-[1rem] text-[var(--c-text)]">{table.name}</h2>
            </a>
          ))}
        </div>
      )}
    </AppShell>
  );
}
