"use client";

import { useState } from "react";
import { deleteDataset } from "./actions";

export function DeleteDatasetButton({ datasetId, datasetName }: { datasetId: string; datasetName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteDataset(datasetId);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      setConfirming(false);
    } else {
      window.location.href = "/databases";
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-[#7a3030]">
          Delete &ldquo;{datasetName}&rdquo; and all its records?
        </span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[#c0392b] text-white text-sm font-bold border-none cursor-pointer disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null); }}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-[rgba(92,73,56,0.2)] bg-transparent text-[#5f5044] text-sm font-semibold cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        {error && <span className="text-sm text-[#c0392b]">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-4 py-2 rounded-xl border border-[rgba(192,57,43,0.3)] bg-transparent text-[#c0392b] text-sm font-semibold cursor-pointer hover:bg-[rgba(192,57,43,0.06)] transition-colors"
    >
      🗑 Delete database
    </button>
  );
}
