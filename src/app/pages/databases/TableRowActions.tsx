"use client";

import { useState, useTransition } from "react";
import { deleteTableRow, updateTableRow } from "./actions";

type Props = {
  connectionId: string;
  schemaName: string;
  tableName: string;
  row: Record<string, unknown>;
  primaryKeyValues: Record<string, unknown> | null;
  disabledReason?: string;
};

export function TableRowActions({
  connectionId,
  schemaName,
  tableName,
  row,
  primaryKeyValues,
  disabledReason,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const disabled = pending || !primaryKeyValues || Boolean(disabledReason);

  const onEdit = () => {
    if (!primaryKeyValues) return;
    const edited = window.prompt("Edit row JSON", JSON.stringify(row, null, 2));
    if (edited === null) return;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(edited) as Record<string, unknown>;
    } catch {
      setError("Invalid JSON for update payload.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateTableRow({
        connectionId,
        schemaName,
        tableName,
        primaryKeyValues,
        values: parsed,
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
    if (!window.confirm("Delete this row permanently?")) return;

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
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="px-3 py-1.5 rounded-lg border border-[var(--c-border-input)] bg-[var(--c-bg-control)] text-[var(--c-text-secondary)] text-xs font-semibold cursor-pointer disabled:opacity-60"
          title={disabledReason ?? "Edit this row"}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="px-3 py-1.5 rounded-lg border border-[var(--c-danger-border)] bg-[var(--c-danger-bg)] text-[var(--c-danger-text)] text-xs font-semibold cursor-pointer disabled:opacity-60"
          title={disabledReason ?? "Delete this row"}
        >
          Delete
        </button>
      </div>
      {error && <span className="text-[0.75rem] text-[var(--c-danger-text)]">{error}</span>}
    </div>
  );
}
