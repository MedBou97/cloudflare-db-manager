"use client";

import { useMemo, useState, useTransition } from "react";
import { executeSqlQuery } from "./actions";

type Props = {
  connectionId: string;
};

type ResultState = {
  error: string | null;
  rows: Array<Record<string, unknown>>;
  columns: string[];
  rowCount: number;
  durationMs: number | null;
  limited: boolean;
  requiresConfirmation: boolean;
};

const DEFAULT_QUERY = "SELECT table_schema, table_name FROM information_schema.tables LIMIT 25";

export function SqlEditor({ connectionId }: Props) {
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<ResultState>({
    error: null,
    rows: [],
    columns: [],
    rowCount: 0,
    durationMs: null,
    limited: false,
    requiresConfirmation: false,
  });

  const canShowTable = result.columns.length > 0;

  const runQuery = (confirmed: boolean) => {
    startTransition(async () => {
      const response = await executeSqlQuery({
        connectionId,
        query,
        confirmed,
        timeoutMs: 5000,
        maxRows: 250,
      });

      if (response.requiresConfirmation) {
        setConfirming(true);
        setResult((prev) => ({ ...prev, requiresConfirmation: true, error: response.error ?? null }));
        return;
      }

      setConfirming(false);
      setResult({
        error: response.error ?? null,
        rows: response.rows ?? [],
        columns: response.columns ?? [],
        rowCount: response.rowCount ?? 0,
        durationMs: response.durationMs ?? null,
        limited: Boolean(response.limited),
        requiresConfirmation: false,
      });
    });
  };

  const rowsPreview = useMemo(() => result.rows.slice(0, 250), [result.rows]);

  return (
    <div className="flex flex-col gap-4">
      <div className="p-5 border border-[var(--c-border)] rounded-2xl bg-[var(--c-bg-card)] flex flex-col gap-3">
        <label className="text-[0.72rem] font-bold tracking-[0.1em] uppercase text-[var(--c-text-muted)]">
          SQL Query
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={8}
          className="w-full px-3.5 py-3 border border-[var(--c-border-input)] rounded-xl bg-[var(--c-bg-input)] text-[var(--c-text)] font-mono text-sm outline-none resize-y"
        />

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => runQuery(false)}
            disabled={pending}
            className="px-4 py-2.5 rounded-xl border-0 bg-gradient-to-br from-accent to-accent-strong text-[var(--c-text-on-accent)] text-sm font-bold cursor-pointer disabled:opacity-70"
          >
            {pending ? "Running..." : "Run Query"}
          </button>
          <span className="text-xs text-[var(--c-text-muted)]">Timeout: 5000ms · Max rows: 250</span>
        </div>

        {confirming && (
          <div className="px-4 py-3 rounded-xl bg-[var(--c-danger-bg)] border border-[var(--c-danger-border)] flex items-center justify-between gap-3 flex-wrap">
            <p className="m-0 text-sm text-[var(--c-danger-text)]">
              This query looks destructive. Confirm to execute.
            </p>
            <button
              type="button"
              onClick={() => runQuery(true)}
              disabled={pending}
              className="px-3 py-2 rounded-lg border border-[var(--c-danger-border)] bg-[var(--c-danger-bg)] text-[var(--c-danger-text)] text-xs font-bold cursor-pointer"
            >
              Confirm & Run
            </button>
          </div>
        )}

        {result.error && (
          <p className="px-3.5 py-2.5 rounded-[10px] bg-[var(--c-danger-bg)] border border-[var(--c-danger-border)] text-[var(--c-danger-text)] text-sm m-0">
            {result.error}
          </p>
        )}
      </div>

      {(result.durationMs !== null || canShowTable) && (
        <div className="p-5 border border-[var(--c-border)] rounded-2xl bg-[var(--c-bg-card)]">
          <p className="m-0 mb-3 text-sm text-[var(--c-text-muted)]">
            {result.rowCount} row{result.rowCount !== 1 ? "s" : ""}
            {result.durationMs !== null ? ` · ${result.durationMs}ms` : ""}
            {result.limited ? " · limited to 250 rows" : ""}
          </p>

          {canShowTable ? (
            <div className="overflow-auto rounded-xl border border-[var(--c-border)]">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[var(--c-bg-input)]">
                  <tr>
                    {result.columns.map((column) => (
                      <th key={column} className="text-left px-3 py-2 border-b border-[var(--c-border)] font-semibold text-[var(--c-text-muted)]">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsPreview.map((row, idx) => (
                    <tr key={idx} className="border-b border-[var(--c-border)]">
                      {result.columns.map((column) => {
                        const value = row[column];
                        const display = value === null || value === undefined
                          ? ""
                          : typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value);
                        return (
                          <td key={`${idx}-${column}`} className="px-3 py-2 align-top text-[var(--c-text)] font-mono text-xs">
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="m-0 text-sm text-[var(--c-text-muted)]">Query executed successfully.</p>
          )}
        </div>
      )}
    </div>
  );
}
