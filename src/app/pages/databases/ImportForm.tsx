"use client";

import { useState, useTransition, useRef } from "react";
import { importDataset } from "./actions";

const fieldLabelClass = "text-[0.72rem] font-bold tracking-[0.1em] uppercase text-[var(--c-text-muted)]";
const fieldInputClass =
  "w-full px-3.5 py-3 border border-[var(--c-border-input)] rounded-xl bg-[var(--c-bg-input)] text-[var(--c-text)] text-sm outline-none transition-[border-color,box-shadow] focus:border-[var(--c-accent-focus)] focus:shadow-[0_0_0_3px_var(--c-accent-ring)]";

export function ImportForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    { row: number; field: string; message: string }[]
  >([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileContentRef = useRef<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      fileContentRef.current = null;
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      fileContentRef.current = ev.target?.result as string;
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);

    if (!fileContentRef.current) {
      setError("Please select a JSON file.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set("file", fileContentRef.current);

    startTransition(async () => {
      const result = await importDataset(fd);
      if (result.validationErrors) {
        setValidationErrors(result.validationErrors);
      } else if (result.error) {
        setError(result.error);
      } else if (result.datasetId) {
        window.location.href = `/databases/${result.datasetId}`;
      }
    });
  };

  return (
    <div className="max-w-[640px]">
      <form
        onSubmit={handleSubmit}
        className="p-7 border border-[var(--c-border)] rounded-3xl bg-[var(--c-bg-card)] shadow-[0_4px_16px_var(--c-shadow-sm)] flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabelClass} htmlFor="import-name">
            Dataset Name *
          </label>
          <input
            id="import-name"
            className={fieldInputClass}
            name="name"
            required
            placeholder="e.g. OpenAI Embeddings v2"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={fieldLabelClass} htmlFor="import-desc">
            Description
          </label>
          <textarea
            id="import-desc"
            className="w-full px-3.5 py-3 border border-[var(--c-border-input)] rounded-xl bg-[var(--c-bg-input)] text-[var(--c-text)] text-sm outline-none resize-y min-h-[80px] transition-[border-color,box-shadow] focus:border-[var(--c-accent-focus)] focus:shadow-[0_0_0_3px_var(--c-accent-ring)]"
            name="description"
            placeholder="Optional description of this dataset"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabelClass}>JSON File *</span>
          <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-[var(--c-dashed)] rounded-xl cursor-pointer transition-colors hover:border-[var(--c-accent-ring)] hover:bg-[var(--c-accent-bg)]">
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={handleFileChange}
            />
            <span className="text-xl">📂</span>
            <span className="text-sm text-[var(--c-text-secondary)]">
              {fileName ?? "Choose a .json file…"}
            </span>
          </label>
          <p className="m-0 text-[0.78rem] text-[var(--c-text-muted)]">
            Expected format:{" "}
            <code className="font-mono bg-[var(--c-bg-code)] px-1 rounded">
              {"{ \"records\": [{ label, description, category, source, numericValue, confidence, vector, … }] }"}
            </code>
          </p>
        </div>

        {error && (
          <p className="px-4 py-3 rounded-xl bg-[var(--c-danger-bg)] border border-[var(--c-danger-border)] text-[var(--c-danger-text)] text-sm m-0">
            {error}
          </p>
        )}

        {validationErrors.length > 0 && (
          <div className="px-4 py-3 rounded-xl bg-[var(--c-danger-bg)] border border-[var(--c-danger-border)]">
            <p className="m-0 mb-2 text-[var(--c-danger-text)] text-sm font-semibold">
              {validationErrors.length} validation error{validationErrors.length !== 1 ? "s" : ""} — fix before importing:
            </p>
            <ul className="m-0 pl-4 flex flex-col gap-1">
              {validationErrors.slice(0, 20).map((err, i) => (
                <li key={i} className="text-[0.8rem] text-[var(--c-danger-text)]">
                  Row {err.row} ·{" "}
                  <span className="font-mono">{err.field}</span>: {err.message}
                </li>
              ))}
              {validationErrors.length > 20 && (
                <li className="text-[0.8rem] text-[var(--c-text-muted)] italic">
                  …and {validationErrors.length - 20} more
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-7 py-3 rounded-xl border-0 bg-gradient-to-br from-accent to-accent-strong text-[var(--c-text-on-accent)] text-sm font-bold cursor-pointer transition-opacity disabled:opacity-70 disabled:cursor-wait"
          >
            {pending ? "Importing…" : "Import Dataset"}
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
