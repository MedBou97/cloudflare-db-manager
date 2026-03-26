"use client";

import { useState, useTransition } from "react";
import { insertTableRow } from "./actions";

type Props = {
  connectionId: string;
  schemaName: string;
  tableName: string;
  canMutate: boolean;
};

export function InsertRowButton({ connectionId, schemaName, tableName, canMutate }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!canMutate) return null;

  const onInsert = () => {
    const payload = window.prompt("Insert row as JSON", "{}");
    if (payload === null) return;

    let values: Record<string, unknown>;
    try {
      values = JSON.parse(payload) as Record<string, unknown>;
    } catch {
      setError("Invalid JSON payload for insert.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await insertTableRow({
        connectionId,
        schemaName,
        tableName,
        values,
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
      <button
        type="button"
        onClick={onInsert}
        disabled={pending}
        className="px-4 py-2.5 rounded-xl border-0 bg-gradient-to-br from-accent to-accent-strong text-[var(--c-text-on-accent)] text-sm font-bold cursor-pointer disabled:opacity-70"
      >
        {pending ? "Inserting..." : "+ Insert Row"}
      </button>
      {error && <span className="text-[0.75rem] text-[var(--c-danger-text)]">{error}</span>}
    </div>
  );
}
