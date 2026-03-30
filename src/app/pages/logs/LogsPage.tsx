import { RequestInfo } from "rwsdk/worker";
import { db } from "@/db";
import { AppShell } from "@/app/shared/AppShell";
import { LOGS_PER_PAGE, AUDIT_ACTIONS } from "@/app/shared/constants";
import { logAction } from "@/app/pages/records/actions";

function getActionBadgeClass(action: string): string {
  if (action === AUDIT_ACTIONS.CREATE_RECORD)
    return "bg-[var(--c-success-bg)] text-[var(--c-success-text)]";
  if (action === AUDIT_ACTIONS.EDIT_RECORD)
    return "bg-[var(--c-warning-bg)] text-[var(--c-warning-text)]";
  if (action === AUDIT_ACTIONS.DELETE_RECORD)
    return "bg-[var(--c-danger-bg)] text-[var(--c-danger-text)]";
  return "bg-[var(--c-info-bg)] text-[var(--c-info-text)]";
}

function formatTimestamp(d: Date | string) {
  return new Date(d).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function LogsPage({ ctx, request }: RequestInfo) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * LOGS_PER_PAGE,
      take: LOGS_PER_PAGE,
    }),
    db.auditLog.count(),
  ]);

  const totalPages = Math.ceil(total / LOGS_PER_PAGE);

// might not need it for now but can always add later if needed
//   if (ctx.user) {
//     await logAction(
//       ctx.user.id,
//       ctx.user.username,
//       AUDIT_ACTIONS.VIEW_LOGS,
//       null,
//       `${ctx.user.username} viewed the audit log (page ${page})`,
//     );
//   }

  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/logs${qs ? `?${qs}` : ""}`;
  };

  const paginationLinkClass = (disabled: boolean) =>
    `px-[18px] py-2 rounded-xl border border-[var(--c-border-input)] bg-[var(--c-bg-card)] text-[var(--c-text-secondary)] text-sm font-semibold no-underline inline-flex items-center gap-1.5 transition-colors hover:bg-[var(--c-accent-bg)] hover:border-[var(--c-accent-border)] hover:text-accent-strong${disabled ? " opacity-40 cursor-not-allowed pointer-events-none" : ""}`;

  return (
    <AppShell user={ctx.user} currentPath="/logs">
      <div className="mb-7">
        <h1 className="m-0 mb-1.5 font-serif text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.03em]">
          Audit Logs
        </h1>
        <p className="m-0 text-[var(--c-text-secondary)] text-[0.95rem]">
          {total.toLocaleString()} operation{total !== 1 ? "s" : ""} recorded
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="py-[60px] px-6 text-center text-[var(--c-text-muted)] text-[0.95rem] border border-dashed border-[var(--c-border)] rounded-[20px]">
          No log entries yet. Actions taken in the workspace will appear here.
        </div>
      ) : (
        <div
          className="flex flex-col gap-px border border-[var(--c-border)] rounded-[20px] overflow-hidden bg-[var(--c-border)]"
          role="list"
        >
          {logs.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 bg-[var(--c-bg-card)] transition-colors hover:bg-[rgba(255,252,247,0.95)]" role="listitem">
              <span className="text-[0.78rem] text-[var(--c-text-muted)] font-mono whitespace-nowrap shrink-0">
                {formatTimestamp(entry.createdAt)}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold tracking-[0.08em] uppercase shrink-0 ${getActionBadgeClass(entry.action)}`}
              >
                {entry.action.replace(/_/g, " ")}
              </span>
              <span className="flex-1 text-sm text-[var(--c-text-secondary)] min-w-[160px]">{entry.details}</span>
              {entry.resourceId && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--c-bg-code)] font-mono text-[0.7rem] text-[var(--c-text-muted)] shrink-0"
                  title={entry.resourceId}
                >
                  #{entry.resourceId.slice(0, 8)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-[var(--c-border)]"
          aria-label="Logs pagination"
        >
          <a
            href={buildUrl(page - 1)}
            className={paginationLinkClass(page <= 1)}
            aria-disabled={page <= 1}
          >
            ← Previous
          </a>
          <span className="text-sm text-[var(--c-text-muted)]">
            Page {page} of {totalPages}
          </span>
          <a
            href={buildUrl(page + 1)}
            className={paginationLinkClass(page >= totalPages)}
            aria-disabled={page >= totalPages}
          >
            Next →
          </a>
        </nav>
      )}
    </AppShell>
  );
}

