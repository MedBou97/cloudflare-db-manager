import type { RequestInfo } from "rwsdk/worker";
import { db } from "@/db";
import { AppShell } from "@/app/shared/AppShell";
import { ROLES } from "@/app/shared/constants";

export async function DatabasesPage({ ctx }: RequestInfo) {
  const where = ctx.user?.role === ROLES.ADMIN ? {} : { createdById: ctx.user?.id ?? "" };

  const connections = await db.databaseConnection.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { username: true } },
    },
  });

  return (
    <AppShell user={ctx.user} currentPath="/databases">
      <div className="mb-7 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="m-0 mb-1.5 font-serif text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.03em]">
            Databases
          </h1>
          <p className="m-0 text-[var(--c-text-secondary)] text-[0.95rem]">
            {connections.length} connection{connections.length !== 1 ? "s" : ""}
          </p>
        </div>

        <a
          href="/databases/connect"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-accent to-accent-strong text-[var(--c-text-on-accent)] text-sm font-bold no-underline"
        >
          + Connect Database
        </a>
      </div>

      {connections.length === 0 ? (
        <p className="py-[60px] px-6 text-center text-[var(--c-text-muted)] text-[0.95rem] border border-dashed border-[var(--c-border)] rounded-[20px]">
          No database connections yet. Add a PostgreSQL connection to start exploring tables.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {connections.map((connection) => (
            <a
              key={connection.id}
              href={`/databases/connections/${connection.id}`}
              className="flex flex-col p-7 border border-[var(--c-border)] rounded-3xl bg-[var(--c-bg-card)] shadow-[0_4px_16px_var(--c-shadow-sm)] no-underline text-inherit transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_var(--c-shadow-hover)]"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-2xl">🐘</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--c-accent-badge)] text-[var(--c-success-text)] text-[0.72rem] font-bold tracking-[0.06em] uppercase">
                  {connection.engine}
                </span>
              </div>

              <h2 className="m-0 mb-2 text-[1.1rem] font-bold text-[var(--c-text)] leading-[1.3]">
                {connection.name}
              </h2>

              <p className="m-0 mb-3 text-[0.875rem] text-[var(--c-text-secondary)] leading-[1.6] line-clamp-2">
                {connection.username}@{connection.host}:{connection.port}/{connection.databaseName}
              </p>

              <div className="mt-auto pt-3 border-t border-[var(--c-border-light)] flex flex-col gap-1">
                <span className="text-[0.75rem] text-[var(--c-text-muted)]">
                  Last test {connection.lastTestedAt
                    ? new Date(connection.lastTestedAt).toLocaleDateString("en-US", { dateStyle: "medium" })
                    : "never"}
                </span>
                {connection.createdBy && (
                  <span className="text-[0.75rem] text-[var(--c-text-muted)]">owner {connection.createdBy.username}</span>
                )}
                {connection.lastError && (
                  <span className="text-[0.75rem] text-[var(--c-danger-text)]">error: {connection.lastError}</span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </AppShell>
  );
}
