import type { RequestInfo } from "rwsdk/worker";
import { AppShell } from "@/app/shared/AppShell";
import { ConnectForm } from "./ConnectForm";

export function ConnectPage({ ctx }: RequestInfo) {
  return (
    <AppShell user={ctx.user} currentPath="/databases">
      <div className="mb-7">
        <a
          href="/databases"
          className="text-sm text-[var(--c-text-muted)] no-underline hover:text-accent-strong mb-3 inline-block"
        >
          ← Back to Databases
        </a>
        <h1 className="m-0 mb-1.5 font-serif text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.03em]">
          Connect PostgreSQL
        </h1>
        <p className="m-0 text-[var(--c-text-secondary)] text-[0.95rem]">
          Save a PostgreSQL connection profile, test it, then explore tables.
        </p>
      </div>

      <ConnectForm />
    </AppShell>
  );
}
