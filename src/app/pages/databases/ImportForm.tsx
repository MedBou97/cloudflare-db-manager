"use client";

import { useState, useTransition, useRef } from "react";
import { importDataset } from "./actions";

const fieldLabelClass = "text-[0.72rem] font-bold tracking-[0.1em] uppercase text-[#8a7767]";
const fieldInputClass =
  "w-full px-3.5 py-3 border border-[rgba(92,73,56,0.16)] rounded-xl bg-[rgba(255,255,255,0.8)] text-[#1f1811] text-sm outline-none transition-[border-color,box-shadow] focus:border-[rgba(31,106,82,0.4)] focus:shadow-[0_0_0_3px_rgba(31,106,82,0.35)]";

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
        className="p-7 border border-[rgba(86,67,48,0.12)] rounded-3xl bg-[rgba(255,252,247,0.82)] shadow-[0_4px_16px_rgba(76,56,34,0.07)] flex flex-col gap-5"
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
            className="w-full px-3.5 py-3 border border-[rgba(92,73,56,0.16)] rounded-xl bg-[rgba(255,255,255,0.8)] text-[#1f1811] text-sm outline-none resize-y min-h-[80px] transition-[border-color,box-shadow] focus:border-[rgba(31,106,82,0.4)] focus:shadow-[0_0_0_3px_rgba(31,106,82,0.35)]"
            name="description"
            placeholder="Optional description of this dataset"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabelClass}>JSON File *</span>
          <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-[rgba(92,73,56,0.2)] rounded-xl cursor-pointer transition-colors hover:border-[rgba(31,106,82,0.35)] hover:bg-[rgba(31,106,82,0.04)]">
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={handleFileChange}
            />
            <span className="text-xl">📂</span>
            <span className="text-sm text-[#5f5044]">
              {fileName ?? "Choose a .json file…"}
            </span>
          </label>
          <p className="m-0 text-[0.78rem] text-[#8a7767]">
            Expected format:{" "}
            <code className="font-mono bg-[rgba(92,73,56,0.06)] px-1 rounded">
              {"{ \"records\": [{ label, description, category, source, numericValue, confidence, vector, … }] }"}
            </code>
          </p>
        </div>

        {error && (
          <p className="px-4 py-3 rounded-xl bg-[rgba(159,54,38,0.1)] border border-[rgba(159,54,38,0.2)] text-[#7c271b] text-sm m-0">
            {error}
          </p>
        )}

        {validationErrors.length > 0 && (
          <div className="px-4 py-3 rounded-xl bg-[rgba(159,54,38,0.08)] border border-[rgba(159,54,38,0.16)]">
            <p className="m-0 mb-2 text-[#7c271b] text-sm font-semibold">
              {validationErrors.length} validation error{validationErrors.length !== 1 ? "s" : ""} — fix before importing:
            </p>
            <ul className="m-0 pl-4 flex flex-col gap-1">
              {validationErrors.slice(0, 20).map((err, i) => (
                <li key={i} className="text-[0.8rem] text-[#7c271b]">
                  Row {err.row} ·{" "}
                  <span className="font-mono">{err.field}</span>: {err.message}
                </li>
              ))}
              {validationErrors.length > 20 && (
                <li className="text-[0.8rem] text-[#8a7767] italic">
                  …and {validationErrors.length - 20} more
                </li>
              )}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="self-start px-7 py-3 rounded-xl border-0 bg-gradient-to-br from-accent to-accent-strong text-[#f7f8f6] text-sm font-bold cursor-pointer transition-opacity disabled:opacity-70 disabled:cursor-wait"
        >
          {pending ? "Importing…" : "Import Dataset"}
        </button>
      </form>
    </div>
  );
}
