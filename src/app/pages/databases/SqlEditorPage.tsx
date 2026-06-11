import type { RequestInfo } from "rwsdk/worker";
import { AppShell } from "@/app/shared/AppShell";
import { SqlEditor } from "./SqlEditor";

export function SqlEditorPage({ ctx, request }: RequestInfo) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  const connectionIdx = parts.indexOf("connections");
  const connectionId = connectionIdx >= 0 ? parts[connectionIdx + 1] : "";

  return (
    <AppShell user={ctx.user} currentPath="/databases">
      <div className="mb-6">
        <a
          href={`/databases/connections/${connectionId}`}
          className="text-sm text-[var(--c-text-muted)] no-underline hover:text-accent-strong"
        >
          ← Back to Tables
        </a>
        <h1 className="m-0 mt-2 mb-1.5 font-serif text-[clamp(1.7rem,2.6vw,2.2rem)] leading-[1.1] tracking-[-0.03em]">
          SQL Editor
        </h1>
        <p className="m-0 text-[0.92rem] text-[var(--c-text-secondary)]">
          Run SQL with guardrails: 5s timeout, 250-row cap, and destructive confirmation.
        </p>
        <p className="m-0 mt-2 text-[0.9rem] font-semibold">
          <span className="bg-[rgba(255,193,7,0.08)] px-3 py-2 rounded-md">
          ⚠️ Put table names between double quotes to avoid conflicts with reserved keywords.
          </span>
        </p>
      </div>

      <SqlEditor connectionId={connectionId} />
    </AppShell>
  );
}
