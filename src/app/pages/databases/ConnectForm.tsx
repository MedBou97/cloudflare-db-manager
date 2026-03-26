"use client";

import { useState, useTransition } from "react";
import { createDatabaseConnection } from "./actions";

const fieldLabelClass = "text-[0.72rem] font-bold tracking-[0.1em] uppercase text-[var(--c-text-muted)]";
const fieldInputClass =
  "w-full px-3.5 py-3 border border-[var(--c-border-input)] rounded-xl bg-[var(--c-bg-input)] text-[var(--c-text)] text-sm outline-none transition-[border-color,box-shadow] focus:border-[var(--c-accent-focus)] focus:shadow-[0_0_0_3px_var(--c-accent-ring)]";

export function ConnectForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createDatabaseConnection(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      window.location.href = `/databases/connections/${result.connectionId}`;
    });
  };

  return (
    <div className="max-w-[760px]">
      <form
        onSubmit={handleSubmit}
        className="p-7 border border-[var(--c-border)] rounded-3xl bg-[var(--c-bg-card)] shadow-[0_4px_16px_var(--c-shadow-sm)] flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabelClass} htmlFor="connection-name">
            Connection Name *
          </label>
          <input id="connection-name" name="name" className={fieldInputClass} required placeholder="e.g. Production Postgres" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={fieldLabelClass} htmlFor="connection-string">
            PostgreSQL Connection String
          </label>
          <textarea
            id="connection-string"
            name="connectionString"
            className="w-full px-3.5 py-3 border border-[var(--c-border-input)] rounded-xl bg-[var(--c-bg-input)] text-[var(--c-text)] font-mono text-sm outline-none resize-y min-h-[100px] transition-[border-color,box-shadow] focus:border-[var(--c-accent-focus)] focus:shadow-[0_0_0_3px_var(--c-accent-ring)]"
            placeholder="postgresql://user:password@host:5432/database?sslmode=require"
          />
          <p className="m-0 text-[0.8rem] text-[var(--c-text-muted)]">
            Provide either the full connection string above, or fill host/database/credentials below.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabelClass} htmlFor="host">Host</label>
            <input id="host" name="host" className={fieldInputClass} placeholder="db.example.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabelClass} htmlFor="port">Port</label>
            <input id="port" name="port" className={fieldInputClass} type="number" defaultValue={5432} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabelClass} htmlFor="database-name">Database</label>
            <input id="database-name" name="databaseName" className={fieldInputClass} placeholder="app_db" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabelClass} htmlFor="username">Username</label>
            <input id="username" name="username" className={fieldInputClass} placeholder="postgres" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabelClass} htmlFor="password">Password</label>
            <input id="password" name="password" className={fieldInputClass} type="password" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabelClass} htmlFor="ssl-mode">SSL Mode</label>
            <select id="ssl-mode" name="sslMode" className={fieldInputClass} defaultValue="require">
              <option value="disable">disable</option>
              <option value="allow">allow</option>
              <option value="prefer">prefer</option>
              <option value="require">require</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="px-4 py-3 rounded-xl bg-[var(--c-danger-bg)] border border-[var(--c-danger-border)] text-[var(--c-danger-text)] text-sm m-0">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-7 py-3 rounded-xl border-0 bg-gradient-to-br from-accent to-accent-strong text-[var(--c-text-on-accent)] text-sm font-bold cursor-pointer transition-opacity disabled:opacity-70 disabled:cursor-wait"
          >
            {pending ? "Connecting..." : "Save & Connect"}
          </button>
          <a
            href="/databases"
            className="px-7 py-3 rounded-xl border border-[var(--c-dashed)] bg-transparent text-[var(--c-text-secondary)] text-sm font-bold no-underline transition-colors hover:bg-[var(--c-bg-code)] hover:border-[var(--c-border-input-hover)]"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
