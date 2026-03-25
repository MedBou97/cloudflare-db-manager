"use client";

import { useState, useTransition } from "react";
import { testSavedDatabaseConnection } from "./actions";

type Props = {
  connectionId: string;
};

export function TestConnectionButton({ connectionId }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const onClick = () => {
    setMessage(null);
    setIsError(false);

    startTransition(async () => {
      const result = await testSavedDatabaseConnection(connectionId);
      if ("error" in result && result.error) {
        setIsError(true);
        setMessage(result.error);
        return;
      }
      setIsError(false);
      setMessage("Connection succeeded");
      window.setTimeout(() => {
        window.location.reload();
      }, 500);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="px-4 py-2.5 border border-[var(--c-border-input)] rounded-xl bg-[var(--c-bg-control)] text-[var(--c-text-secondary)] text-sm cursor-pointer transition-colors hover:bg-[var(--c-accent-bg)] hover:text-accent-strong hover:border-[var(--c-accent-border)] disabled:opacity-70"
      >
        {pending ? "Testing..." : "Test connection"}
      </button>
      {message && (
        <span className={`text-xs ${isError ? "text-[var(--c-danger-text)]" : "text-[var(--c-success-text)]"}`}>
          {message}
        </span>
      )}
    </div>
  );
}
