"use client";

import { useState, useTransition } from "react";
import { createRecord } from "./actions";
import { ROLES } from "@/app/shared/constants";

type FiltersProps = {
  search: string;
  category: string;
  status: string;
  sort: string;
  order: string;
  categories: string[];
  userRole: string;
};

type CreateCardProps = {
  onCreated: () => void;
  onCancel: () => void;
};

const fieldLabelClass = "text-[0.72rem] font-bold tracking-[0.1em] uppercase text-[#8a7767]";
const fieldInputClass =
  "w-full px-2.5 py-1.5 border border-[rgba(92,73,56,0.16)] rounded-lg bg-[rgba(255,255,255,0.8)] text-[#1f1811] text-sm outline-none transition-[border-color,box-shadow] focus:border-[rgba(31,106,82,0.4)] focus:shadow-[0_0_0_3px_rgba(31,106,82,0.35)]";
const fieldTextareaClass =
  "w-full px-2.5 py-2 border border-[rgba(92,73,56,0.16)] rounded-lg bg-[rgba(255,255,255,0.8)] text-[#1f1811] font-mono text-[0.8rem] outline-none resize-y min-h-[80px] transition-[border-color,box-shadow] focus:border-[rgba(31,106,82,0.4)] focus:shadow-[0_0_0_3px_rgba(31,106,82,0.35)]";
const fieldSelectClass =
  "w-full px-2.5 py-1.5 border border-[rgba(92,73,56,0.16)] rounded-lg bg-[rgba(255,255,255,0.8)] text-[#1f1811] text-sm cursor-pointer outline-none";
const filterControlClass =
  "px-4 py-2.5 border border-[rgba(92,73,56,0.16)] rounded-xl bg-[rgba(255,255,255,0.7)] text-[#5f5044] text-sm cursor-pointer outline-none";

function CreateRecordCard({ onCreated, onCancel }: CreateCardProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createRecord(fd);
      if (result.error) {
        setError(result.error);
      } else {
        onCreated();
      }
    });
  };

  return (
    <article
      className="border border-[rgba(31,106,82,0.35)] shadow-[0_0_0_3px_rgba(31,106,82,0.12)] rounded-[20px] bg-[rgba(255,252,247,0.82)] overflow-hidden mb-4"
    >
      <form className="p-5 px-6" onSubmit={handleSubmit}>
        <div className="flex items-start gap-3 mb-4 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[rgba(92,73,56,0.08)] font-mono text-[0.72rem] text-[#8a7767] shrink-0">
            New record
          </span>
          <h3 className="flex-1 m-0 text-[1.05rem] font-bold text-[#8a7767] italic leading-[1.35]">
            Creating…
          </h3>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          <div className="flex flex-col gap-1">
            <span className={fieldLabelClass}>Label *</span>
            <input className={fieldInputClass} name="label" required placeholder="e.g. Sample embedding" />
          </div>

          <div className="flex flex-col gap-1">
            <span className={fieldLabelClass}>Category *</span>
            <input className={fieldInputClass} name="category" required placeholder="e.g. NLP" />
          </div>

          <div className="flex flex-col gap-1">
            <span className={fieldLabelClass}>Source *</span>
            <input className={fieldInputClass} name="source" required placeholder="e.g. OpenAI Ada-002" />
          </div>

          <div className="flex flex-col gap-1">
            <span className={fieldLabelClass}>Status</span>
            <select className={fieldSelectClass} name="status" defaultValue="active">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className={fieldLabelClass}>Numeric Value *</span>
            <input className={fieldInputClass} name="numericValue" type="number" step="any" required placeholder="0.0" />
          </div>

          <div className="flex flex-col gap-1">
            <span className={fieldLabelClass}>Confidence (0–1) *</span>
            <input className={fieldInputClass} name="confidence" type="number" step="0.001" min="0" max="1" required placeholder="0.95" />
          </div>

          <div className="flex flex-col gap-1 col-span-full">
            <span className={fieldLabelClass}>Description *</span>
            <textarea className={fieldTextareaClass} name="description" required rows={2} placeholder="Brief description of what this record represents" />
          </div>

          <div className="flex flex-col gap-1 col-span-full">
            <span className={fieldLabelClass}>Tags (comma-separated)</span>
            <input className={fieldInputClass} name="tags" placeholder="nlp, sentence, english" />
          </div>

          <div className="flex flex-col gap-1 col-span-full">
            <span className={fieldLabelClass}>Vector (JSON array of numbers) *</span>
            <textarea
              className={fieldTextareaClass}
              name="vector"
              required
              rows={4}
              placeholder='[0.0231, -0.1542, 0.7821, ...]'
            />
          </div>

          <div className="flex flex-col gap-1 col-span-full">
            <span className={fieldLabelClass}>Metadata (JSON object)</span>
            <textarea className={fieldTextareaClass} name="metadata" rows={3} defaultValue="{}" />
          </div>
        </div>

        {error && (
          <p className="px-3.5 py-2.5 rounded-[10px] bg-[rgba(159,54,38,0.1)] border border-[rgba(159,54,38,0.2)] text-[#7c271b] text-sm mt-3">
            {error}
          </p>
        )}

        <div className="flex gap-2.5 mt-5 pt-4 border-t border-[rgba(86,67,48,0.12)]">
          <button
            className="px-5 py-2.5 rounded-xl border-0 bg-gradient-to-br from-accent to-accent-strong text-[#f7f8f6] text-sm font-bold cursor-pointer transition-opacity disabled:opacity-70 disabled:cursor-wait"
            type="submit"
            disabled={pending}
          >
            {pending ? "Creating…" : "Create record"}
          </button>
          <button
            className="px-5 py-2.5 rounded-xl border border-[rgba(92,73,56,0.16)] bg-[rgba(255,255,255,0.6)] text-[#5f5044] text-sm font-semibold cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.9)]"
            type="button"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
        </div>
      </form>
    </article>
  );
}

export function RecordFilters({
  search,
  category,
  status,
  sort,
  order,
  categories,
  userRole,
}: FiltersProps) {
  const [showCreate, setShowCreate] = useState(false);
  const isAdmin = userRole === ROLES.ADMIN;

  const navigate = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    const current: Record<string, string> = { search, category, status, sort, order };
    Object.assign(current, updates);
    Object.entries(current).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    params.delete("page");
    window.location.href = `/records?${params.toString()}`;
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    navigate({ search: (fd.get("search") as string) ?? "" });
  };

  return (
    <>
      <div
        className="flex flex-wrap gap-2.5 items-center mb-6 px-5 py-4 border border-[rgba(86,67,48,0.12)] rounded-[20px] bg-[rgba(255,252,247,0.82)]"
        role="search"
      >
        <form onSubmit={handleSearch} className="flex gap-2 flex-[1_1_200px] min-w-0">
          <input
            className="flex-1 min-w-[150px] px-3.5 py-2.5 border border-[rgba(92,73,56,0.16)] rounded-xl bg-[rgba(255,255,255,0.7)] text-[#1f1811] text-sm outline-none transition-[border-color,box-shadow] focus:border-[rgba(31,106,82,0.4)] focus:shadow-[0_0_0_3px_rgba(31,106,82,0.35)]"
            name="search"
            defaultValue={search}
            placeholder="Search label, description, category…"
            aria-label="Search records"
          />
          <button
            className="px-4 py-2.5 border border-[rgba(92,73,56,0.16)] rounded-xl bg-[rgba(255,255,255,0.7)] text-[#5f5044] text-sm cursor-pointer transition-colors hover:bg-[rgba(31,106,82,0.08)] hover:text-accent-strong hover:border-[rgba(31,106,82,0.25)]"
            type="submit"
          >
            Search
          </button>
        </form>

        <select
          className={filterControlClass}
          value={category}
          onChange={(e) => navigate({ category: e.target.value })}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className={filterControlClass}
          value={status}
          onChange={(e) => navigate({ status: e.target.value })}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>

        <select
          className={filterControlClass}
          value={sort}
          onChange={(e) => navigate({ sort: e.target.value })}
          aria-label="Sort by"
        >
          <option value="createdAt">Created</option>
          <option value="updatedAt">Updated</option>
          <option value="label">Label</option>
          <option value="numericValue">Numeric Value</option>
          <option value="confidence">Confidence</option>
          <option value="category">Category</option>
        </select>

        <button
          className="px-4 py-2.5 border border-[rgba(92,73,56,0.16)] rounded-xl bg-[rgba(255,255,255,0.7)] text-[#5f5044] text-sm cursor-pointer transition-colors hover:bg-[rgba(31,106,82,0.08)] hover:text-accent-strong hover:border-[rgba(31,106,82,0.25)]"
          onClick={() => navigate({ order: order === "asc" ? "desc" : "asc" })}
          title={`Currently: ${order === "asc" ? "ascending" : "descending"}`}
        >
          {order === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>

        {(search || category || status) ? (
          <button
            className="px-4 py-2.5 border border-[rgba(92,73,56,0.16)] rounded-xl bg-[rgba(255,255,255,0.7)] text-[#5f5044] text-sm cursor-pointer transition-colors hover:bg-[rgba(31,106,82,0.08)] hover:text-accent-strong hover:border-[rgba(31,106,82,0.25)]"
            onClick={() => navigate({ search: "", category: "", status: "" })}
          >
            Clear filters
          </button>
        ) : null}

        <span className="flex-1" />

        {isAdmin && (
          <button
            className="px-4 py-2.5 rounded-xl border-0 bg-gradient-to-br from-accent to-accent-strong text-[#f7f8f6] text-sm font-bold cursor-pointer"
            onClick={() => setShowCreate((p) => !p)}
          >
            {showCreate ? "✕ Cancel" : "+ New Record"}
          </button>
        )}
      </div>

      {showCreate && isAdmin && (
        <CreateRecordCard
          onCreated={() => {
            setShowCreate(false);
            window.location.reload();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </>
  );
}

