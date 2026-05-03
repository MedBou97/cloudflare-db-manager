"use client";

import { useState, useTransition } from "react";
import { deleteTableRow, updateTableRow } from "./actions";
import type { TableColumnInfo } from "./postgres";

type Props = {
  connectionId: string;
  schemaName: string;
  tableName: string;
  columns: TableColumnInfo[];
  row: Record<string, unknown>;
  primaryKeyValues: Record<string, unknown> | null;
  rowKey: string;
  showActions: boolean;
  disabledReason?: string;
  hiddenColumnNames?: Set<string>;
};

const fieldInputClass =
  "w-full px-2.5 py-1.5 border border-[var(--c-border-input)] rounded-lg bg-[var(--c-bg-input)] text-[var(--c-text)] text-xs outline-none transition-[border-color,box-shadow] focus:border-[var(--c-accent-focus)] focus:shadow-[0_0_0_3px_var(--c-accent-ring)]";
const fieldLabelClass = "text-[0.72rem] font-bold tracking-[0.1em] uppercase text-[var(--c-text-muted)]";
const fieldTextareaClass = `${fieldInputClass} min-h-[64px] resize-y font-mono`;
const cancelBtnClass =
  "px-5 py-2.5 rounded-xl border border-[var(--c-border-input)] bg-[var(--c-bg-cancel-btn)] text-[var(--c-text-secondary)] text-sm font-semibold cursor-pointer transition-colors hover:bg-[var(--c-bg-input)] disabled:opacity-60";

const numericTypes = new Set([
  "integer",
  "bigint",
  "smallint",
  "numeric",
  "real",
  "double precision",
  "float4",
  "float8",
]);

function isJsonLikeColumn(column: TableColumnInfo) {
  const type = column.dataType.toLowerCase();
  return type === "json" || type === "jsonb" || column.udtName.startsWith("_");
}

function isLongValue(value: unknown) {
  return typeof value === "string" && value.length > 120;
}

function isObjectValue(value: unknown) {
  return typeof value === "object" && value !== null;
}

function shouldExpandColumn(column: TableColumnInfo, value: unknown) {
  if (isObjectValue(value)) return true;
  if (isJsonLikeColumn(column)) return true;
  return isLongValue(value);
}

function inferInputKind(column: TableColumnInfo, value: unknown) {
  if (column.dataType === "boolean" || typeof value === "boolean") return "boolean" as const;
  if (isObjectValue(value) || isJsonLikeColumn(column)) return "json" as const;
  if (typeof value === "number" || numericTypes.has(column.dataType.toLowerCase())) return "number" as const;
  return "text" as const;
}

function toDraftValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function parseDraftValue(column: TableColumnInfo, raw: string, original: unknown) {
  const trimmed = raw.trim();
  const inputKind = inferInputKind(column, original);

  if (trimmed === "") {
    if (column.isNullable) return null;
    if (typeof original === "string") return "";
    throw new Error(`${column.name} cannot be empty.`);
  }

  if (inputKind === "number") {
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) throw new Error(`${column.name} must be a number.`);
    return parsed;
  }

  if (inputKind === "boolean") {
    return trimmed === "true";
  }

  if (inputKind === "json") {
    try {
      JSON.parse(trimmed);
      // Store as string, not parsed object, to avoid serialization issues
      return trimmed;
    } catch {
      throw new Error(`${column.name} must be valid JSON.`);
    }
  }

  return raw;
}

export function TableRowActions({
  connectionId,
  schemaName,
  tableName,
  columns,
  row,
  primaryKeyValues,
  rowKey,
  showActions,
  disabledReason,
  hiddenColumnNames,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const disabled = pending || !primaryKeyValues || Boolean(disabledReason);
  const canDelete = !disabled && !editing;

  const beginEdit = () => {
    if (disabled) return;
    const nextDraft: Record<string, string> = {};
    columns.forEach((column) => {
      if (column.isPrimaryKey) return;
      nextDraft[column.name] = toDraftValue(row[column.name]);
    });
    setDraftValues(nextDraft);
    setConfirmDelete(false);
    setError(null);
    setExpanded(true);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
    setDraftValues({});
  };

  const identityEntries = Object.entries(primaryKeyValues ?? {});
  const titleColumn = columns.find((column) => !column.isPrimaryKey) ?? columns[0];
  const titleValue = titleColumn ? toDraftValue(row[titleColumn.name]) : "Row";

  const visibleColumns = hiddenColumnNames && hiddenColumnNames.size > 0
    ? columns.filter((col) => !hiddenColumnNames.has(col.name))
    : columns;

  const summaryColumns = visibleColumns.filter((column) => !shouldExpandColumn(column, row[column.name]));
  const detailColumns = visibleColumns.filter((column) => shouldExpandColumn(column, row[column.name]));

  const onSave = () => {
    if (!primaryKeyValues) return;
    const updates: Record<string, unknown> = {};

    for (const column of columns) {
      if (column.isPrimaryKey) continue;
      const currentDraft = draftValues[column.name] ?? toDraftValue(row[column.name]);
      const originalDraft = toDraftValue(row[column.name]);
      if (currentDraft === originalDraft) continue;

      try {
        updates[column.name] = parseDraftValue(column, currentDraft, row[column.name]);
      } catch (parseError) {
        setError(parseError instanceof Error ? parseError.message : `Invalid value for ${column.name}.`);
        return;
      }
    }

    if (Object.keys(updates).length === 0) {
      setError("No changes to save.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateTableRow({
        connectionId,
        schemaName,
        tableName,
        primaryKeyValues,
        values: updates,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      window.location.reload();
    });
  };

  const onDelete = () => {
    if (!primaryKeyValues) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteTableRow({
        connectionId,
        schemaName,
        tableName,
        primaryKeyValues,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      window.location.reload();
    });
  };

  return (
    <article
      className={`border rounded-[20px] bg-[var(--c-bg-card)] overflow-hidden transition-shadow ${
        editing
          ? "border-[var(--c-accent-ring)] shadow-[0_0_0_3px_var(--c-accent-bg-active),0_8px_28px_var(--c-shadow-hover)]"
          : "border-[var(--c-border)] shadow-[0_4px_16px_var(--c-shadow-sm)] hover:shadow-[0_8px_28px_var(--c-shadow-hover)]"
      }`}
    >
      <div className="p-5 px-6">
        <div className="flex items-start gap-3 mb-4 flex-wrap">
          {identityEntries.length > 0 ? (
            identityEntries.map(([key, value]) => (
              <span
                key={`${rowKey}-${key}`}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[var(--c-tag-bg)] font-mono text-[0.72rem] text-[var(--c-text-muted)] shrink-0"
                title={`${key}: ${toDraftValue(value)}`}
              >
                {key}:{toDraftValue(value)}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[var(--c-tag-bg)] font-mono text-[0.72rem] text-[var(--c-text-muted)] shrink-0">
              row:{rowKey}
            </span>
          )}

          <h3 className="flex-1 m-0 text-[1.05rem] font-bold text-[var(--c-text)] leading-[1.35] break-words">
            {titleValue || "Untitled row"}
          </h3>

          {showActions && !editing && !confirmDelete && (
            <div className="flex gap-1.5 shrink-0">
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--c-border-input)] bg-[var(--c-bg-cancel-btn)] cursor-pointer text-sm transition-[background,border-color,color] text-[var(--c-text-muted)] hover:bg-[var(--c-accent-bg)] hover:border-[var(--c-accent-border)] hover:text-accent-strong disabled:opacity-60"
                title={disabledReason ?? "Edit this row"}
                onClick={beginEdit}
                disabled={disabled}
                aria-label="Edit row"
              >
                ✏️
              </button>
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--c-border-input)] bg-[var(--c-bg-cancel-btn)] cursor-pointer text-sm transition-[background,border-color,color] text-[var(--c-text-muted)] hover:bg-[var(--c-danger-bg)] hover:border-[var(--c-danger-border)] hover:text-[var(--c-danger-text)] disabled:opacity-60"
                title={disabledReason ?? "Delete this row"}
                onClick={() => setConfirmDelete(true)}
                disabled={!canDelete}
                aria-label="Delete row"
              >
                🗑
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {summaryColumns.map((column) => {
            const value = row[column.name];
            const editable = editing && !column.isPrimaryKey;
            const inputKind = inferInputKind(column, value);
            return (
              <div key={`${rowKey}-${column.name}`} className="flex flex-col gap-1">
                <span className={fieldLabelClass}>{column.name}</span>
                {editable ? (
                  inputKind === "boolean" ? (
                    <select
                      value={draftValues[column.name] ?? "false"}
                      onChange={(e) => setDraftValues((prev) => ({ ...prev, [column.name]: e.target.value }))}
                      className={fieldInputClass}
                    >
                      {column.isNullable && <option value="">NULL</option>}
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : inputKind === "json" ? (
                    <textarea
                      value={draftValues[column.name] ?? ""}
                      onChange={(e) => setDraftValues((prev) => ({ ...prev, [column.name]: e.target.value }))}
                      className={fieldTextareaClass}
                    />
                  ) : (
                    <input
                      value={draftValues[column.name] ?? ""}
                      onChange={(e) => setDraftValues((prev) => ({ ...prev, [column.name]: e.target.value }))}
                      className={fieldInputClass}
                      type={inputKind === "number" ? "number" : "text"}
                      step={inputKind === "number" ? "any" : undefined}
                    />
                  )
                ) : (
                  value === null || value === undefined || value === "" ? (
                    <span className="text-[0.8rem] text-[var(--c-text-muted)]">NULL</span>
                  ) : isObjectValue(value) ? (
                    <pre className="font-mono text-[0.78rem] bg-[var(--c-bg-code)] p-2.5 rounded-lg whitespace-pre-wrap break-all max-h-[180px] overflow-y-auto m-0">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : shouldExpandColumn(column, value) ? (
                    <pre className="font-mono text-[0.78rem] bg-[var(--c-bg-code)] p-2.5 rounded-lg whitespace-pre-wrap break-all max-h-[180px] overflow-y-auto m-0">
                      {String(value)}
                    </pre>
                  ) : (
                    <span className="text-[0.9rem] text-[var(--c-text)] break-words">{String(value)}</span>
                  )
                )}
              </div>
            );
          })}
        </div>

        {detailColumns.length > 0 && (
          <button
            type="button"
            className="flex items-center gap-1.5 mt-4 pt-2 w-full text-left bg-transparent text-[var(--c-text-muted)] text-[0.8rem] font-semibold cursor-pointer transition-colors hover:text-accent-strong"
            style={{ border: "none", borderTop: "1px solid var(--c-border)" }}
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            {expanded ? "▲ Hide details" : "▼ Show full details"}
          </button>
        )}

        {disabledReason && !editing && !confirmDelete && (
          <p className="m-0 mt-3 text-[0.72rem] text-[var(--c-text-muted)]">{disabledReason}</p>
        )}
      </div>

      {(expanded || editing || confirmDelete) && (
        <div className="border-t border-[var(--c-border)] p-5 px-6 bg-[var(--c-bg-expanded)]">
          {detailColumns.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
              {detailColumns.map((column) => {
                const value = row[column.name];
                const editable = editing && !column.isPrimaryKey;
                const inputKind = inferInputKind(column, value);
                return (
                  <div
                    key={`${rowKey}-detail-${column.name}`}
                    className={`flex flex-col gap-1 ${shouldExpandColumn(column, value) ? "col-span-full" : ""}`}
                  >
                    <span className={fieldLabelClass}>{column.name}</span>
                    {editable ? (
                      inputKind === "boolean" ? (
                        <select
                          value={draftValues[column.name] ?? "false"}
                          onChange={(e) => setDraftValues((prev) => ({ ...prev, [column.name]: e.target.value }))}
                          className={fieldInputClass}
                        >
                          {column.isNullable && <option value="">NULL</option>}
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : inputKind === "json" ? (
                        <textarea
                          value={draftValues[column.name] ?? ""}
                          onChange={(e) => setDraftValues((prev) => ({ ...prev, [column.name]: e.target.value }))}
                          className={fieldTextareaClass}
                        />
                      ) : (
                        <input
                          value={draftValues[column.name] ?? ""}
                          onChange={(e) => setDraftValues((prev) => ({ ...prev, [column.name]: e.target.value }))}
                          className={fieldInputClass}
                          type={inputKind === "number" ? "number" : "text"}
                          step={inputKind === "number" ? "any" : undefined}
                        />
                      )
                    ) : (
                      value === null || value === undefined || value === "" ? (
                        <span className="text-[0.8rem] text-[var(--c-text-muted)]">NULL</span>
                      ) : isObjectValue(value) ? (
                        <pre className="font-mono text-[0.78rem] bg-[var(--c-bg-code)] p-2.5 rounded-lg whitespace-pre-wrap break-all max-h-[180px] overflow-y-auto m-0">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : shouldExpandColumn(column, value) ? (
                        <pre className="font-mono text-[0.78rem] bg-[var(--c-bg-code)] p-2.5 rounded-lg whitespace-pre-wrap break-all max-h-[180px] overflow-y-auto m-0">
                          {String(value)}
                        </pre>
                      ) : (
                        <span className="text-[0.9rem] text-[var(--c-text)] break-words">{String(value)}</span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {editing && (
            <div className="flex gap-2.5 mt-5 pt-4 border-t border-[var(--c-border)]">
              <button
                type="button"
                onClick={onSave}
                disabled={disabled}
                className="px-5 py-2.5 rounded-xl border-0 bg-gradient-to-br from-accent to-accent-strong text-[var(--c-text-on-accent)] text-sm font-bold cursor-pointer transition-opacity disabled:opacity-70"
              >
                {pending ? "Saving..." : "Save changes"}
              </button>
              <button type="button" onClick={cancelEdit} disabled={pending} className={cancelBtnClass}>
                Cancel
              </button>
            </div>
          )}

          {!editing && confirmDelete && showActions && (
            <div className="mt-2 rounded-xl border border-[var(--c-danger-border)] bg-[var(--c-danger-bg)] px-4 py-3">
              <p className="m-0 text-sm text-[var(--c-danger-text)]">Delete this row permanently?</p>
              <div className="mt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={disabled}
                  className="px-4 py-2 rounded-lg border border-[var(--c-danger-border)] bg-[var(--c-danger-bg)] text-[var(--c-danger-text)] text-sm font-semibold cursor-pointer disabled:opacity-60"
                >
                  {pending ? "Deleting..." : "Confirm delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={pending}
                  className={cancelBtnClass}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && <p className="m-0 mt-3 text-sm text-[var(--c-danger-text)]">{error}</p>}
        </div>
      )}
    </article>
  );
}
