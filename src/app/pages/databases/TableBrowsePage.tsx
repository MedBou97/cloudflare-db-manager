import type { RequestInfo } from "rwsdk/worker";
import { AppShell } from "@/app/shared/AppShell";
import { getTableRows } from "./actions";
import { InsertRowButton } from "./InsertRowButton";
import { TableRowActions } from "./TableRowActions";

function stringifyCell(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export async function TableBrowsePage({ ctx, request }: RequestInfo) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const connectionIdx = pathParts.indexOf("connections");
  const tablesIdx = pathParts.indexOf("tables");

  const connectionId = connectionIdx >= 0 ? pathParts[connectionIdx + 1] : "";
  const schemaName = tablesIdx >= 0 ? decodeURIComponent(pathParts[tablesIdx + 1] ?? "") : "";
  const tableName = tablesIdx >= 0 ? decodeURIComponent(pathParts[tablesIdx + 2] ?? "") : "";

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const search = url.searchParams.get("search") ?? "";
  const searchColumn = url.searchParams.get("searchColumn") ?? "";
  const sortColumn = url.searchParams.get("sortColumn") ?? "";
  const sortOrder = url.searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const result = await getTableRows({
    connectionId,
    schemaName,
    tableName,
    page,
    pageSize: 25,
    search,
    searchColumn,
    sortColumn,
    sortOrder,
  });

  if (result.error || !result.data) {
    return new Response(result.error ?? "Failed to load rows", { status: 400 });
  }

  const data = result.data;
  const basePath = `/databases/connections/${connectionId}/tables/${encodeURIComponent(schemaName)}/${encodeURIComponent(tableName)}`;

  const buildUrl = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const current: Record<string, string> = {
      search,
      searchColumn,
      sortColumn,
      sortOrder,
      page: String(page),
    };
    Object.assign(current, Object.fromEntries(Object.entries(updates).map(([k, v]) => [k, String(v)])));
    Object.entries(current).forEach(([k, v]) => {
      if (v && !(k === "page" && v === "1")) params.set(k, v);
    });
    return `${basePath}?${params.toString()}`;
  };

  return (
    <AppShell user={ctx.user} currentPath="/databases">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <a href={`/databases/connections/${connectionId}`} className="text-sm text-[var(--c-text-muted)] no-underline hover:text-accent-strong">
            ← Back to Tables
          </a>
          <h1 className="m-0 mt-2 mb-1.5 font-serif text-[clamp(1.6rem,2.5vw,2.1rem)] leading-[1.1] tracking-[-0.03em]">
            {schemaName}.{tableName}
          </h1>
          <p className="m-0 text-[0.9rem] text-[var(--c-text-secondary)]">
            {data.total.toLocaleString()} row{data.total !== 1 ? "s" : ""} · Connection: {data.connectionName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/databases/connections/${connectionId}/sql`}
            className="px-4 py-2.5 rounded-xl border border-[var(--c-border-input)] bg-[var(--c-bg-control)] text-[var(--c-text-secondary)] text-sm no-underline"
          >
            Open SQL Editor
          </a>
          <InsertRowButton
            connectionId={connectionId}
            schemaName={schemaName}
            tableName={tableName}
            canMutate={data.canMutate}
          />
        </div>
      </div>

      {!data.hasPrimaryKey && (
        <p className="px-4 py-3 rounded-xl bg-[var(--c-accent-bg)] border border-[var(--c-accent-border)] text-[var(--c-text-secondary)] text-sm mb-4">
          This table has no primary key. Edit/delete is disabled to prevent unsafe mutations.
        </p>
      )}

      <form method="get" action={basePath} className="mb-5 p-4 border border-[var(--c-border)] rounded-2xl bg-[var(--c-bg-card)] flex flex-wrap gap-2 items-center">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search rows..."
          className="min-w-[220px] flex-1 px-3.5 py-2.5 border border-[var(--c-border-input)] rounded-xl bg-[var(--c-bg-input)] text-[var(--c-text)] text-sm"
        />

        <select name="searchColumn" defaultValue={searchColumn} className="px-3.5 py-2.5 border border-[var(--c-border-input)] rounded-xl bg-[var(--c-bg-control)] text-sm">
          <option value="">All columns</option>
          {data.columns.map((col) => (
            <option key={col.name} value={col.name}>{col.name}</option>
          ))}
        </select>

        <select name="sortColumn" defaultValue={sortColumn || data.columns[0]?.name || ""} className="px-3.5 py-2.5 border border-[var(--c-border-input)] rounded-xl bg-[var(--c-bg-control)] text-sm">
          {data.columns.map((col) => (
            <option key={col.name} value={col.name}>{col.name}</option>
          ))}
        </select>

        <select name="sortOrder" defaultValue={sortOrder} className="px-3.5 py-2.5 border border-[var(--c-border-input)] rounded-xl bg-[var(--c-bg-control)] text-sm">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>

        <button type="submit" className="px-4 py-2.5 rounded-xl border border-[var(--c-border-input)] bg-[var(--c-bg-control)] text-[var(--c-text-secondary)] text-sm font-semibold cursor-pointer">
          Apply
        </button>
      </form>

      <div className="overflow-auto border border-[var(--c-border)] rounded-2xl bg-[var(--c-bg-card)]">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[var(--c-bg-input)]">
            <tr>
              {data.columns.map((col) => (
                <th key={col.name} className="text-left px-3 py-2 border-b border-[var(--c-border)] font-semibold text-[var(--c-text-muted)] whitespace-nowrap">
                  {col.name}
                </th>
              ))}
              {data.canMutate && (
                <th className="text-right px-3 py-2 border-b border-[var(--c-border)] font-semibold text-[var(--c-text-muted)]">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => {
              const pkValues = data.hasPrimaryKey
                ? Object.fromEntries(data.primaryKeyColumns.map((pk) => [pk, row[pk]]))
                : null;
              const rowKey = data.hasPrimaryKey
                ? data.primaryKeyColumns.map((pk) => String(row[pk])).join("|")
                : String(rowIndex);

              return (
                <tr key={rowKey} className="border-b border-[var(--c-border)] align-top">
                  {data.columns.map((col) => (
                    <td key={`${rowKey}-${col.name}`} className="px-3 py-2 font-mono text-xs text-[var(--c-text)]">
                      {stringifyCell(row[col.name])}
                    </td>
                  ))}
                  {data.canMutate && (
                    <td className="px-3 py-2 text-right">
                      <TableRowActions
                        connectionId={connectionId}
                        schemaName={schemaName}
                        tableName={tableName}
                        row={row}
                        primaryKeyValues={pkValues}
                        disabledReason={!data.hasPrimaryKey ? "No primary key" : undefined}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3 mt-6" aria-label="Table rows pagination">
          <a
            href={buildUrl({ page: page - 1 })}
            className={`px-4 py-2 rounded-xl border border-[var(--c-border-input)] bg-[var(--c-bg-card)] text-sm no-underline ${page <= 1 ? "opacity-40 pointer-events-none" : ""}`}
          >
            ← Previous
          </a>
          <span className="text-sm text-[var(--c-text-muted)]">Page {page} of {data.totalPages}</span>
          <a
            href={buildUrl({ page: page + 1 })}
            className={`px-4 py-2 rounded-xl border border-[var(--c-border-input)] bg-[var(--c-bg-card)] text-sm no-underline ${page >= data.totalPages ? "opacity-40 pointer-events-none" : ""}`}
          >
            Next →
          </a>
        </nav>
      )}
    </AppShell>
  );
}
