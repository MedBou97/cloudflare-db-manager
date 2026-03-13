"use client";

import { useState } from "react";
import { updateRecord, deleteRecord } from "./actions";
import { VECTOR_PREVIEW_LENGTH } from "@/app/shared/constants";

type VectorRecordWithUser = {
  id: string;
  label: string;
  description: string;
  category: string;
  source: string;
  tags: string;
  numericValue: number;
  confidence: number;
  vector: string;
  dimension: number;
  metadata: string;
  status: string;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdById: string;
  createdBy: { username: string };
};

type RecordCardProps = {
  record: VectorRecordWithUser;
  isAdmin: boolean;
  onDeleted: (id: string) => void;
  onUpdated: (id: string, updated: Partial<VectorRecordWithUser>) => void;
};

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseVector(raw: string): number[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusBadgeClass(status: string): string {
  if (status === "active") return "bg-[rgba(31,106,82,0.12)] text-[#15523f]";
  if (status === "inactive") return "bg-[rgba(92,73,56,0.1)] text-[#8a7767]";
  return "bg-[rgba(160,100,30,0.12)] text-[#7a4e10]";
}

const fieldLabelClass = "text-[0.72rem] font-bold tracking-[0.1em] uppercase text-[#8a7767]";
const fieldInputClass =
  "w-full px-2.5 py-1.5 border border-[rgba(92,73,56,0.16)] rounded-lg bg-[rgba(255,255,255,0.8)] text-[#1f1811] text-sm outline-none transition-[border-color,box-shadow] focus:border-[rgba(31,106,82,0.4)] focus:shadow-[0_0_0_3px_rgba(31,106,82,0.35)]";
const fieldTextareaClass =
  "w-full px-2.5 py-2 border border-[rgba(92,73,56,0.16)] rounded-lg bg-[rgba(255,255,255,0.8)] text-[#1f1811] font-mono text-[0.8rem] outline-none resize-y min-h-[80px] transition-[border-color,box-shadow] focus:border-[rgba(31,106,82,0.4)] focus:shadow-[0_0_0_3px_rgba(31,106,82,0.35)]";
const fieldSelectClass =
  "w-full px-2.5 py-1.5 border border-[rgba(92,73,56,0.16)] rounded-lg bg-[rgba(255,255,255,0.8)] text-[#1f1811] text-sm cursor-pointer outline-none";
const cancelBtnClass =
  "px-5 py-2.5 rounded-xl border border-[rgba(92,73,56,0.16)] bg-[rgba(255,255,255,0.6)] text-[#5f5044] text-sm font-semibold cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.9)]";

export function RecordCard({ record, isAdmin, onDeleted, onUpdated }: RecordCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editLabel, setEditLabel] = useState(record.label);
  const [editDescription, setEditDescription] = useState(record.description);
  const [editCategory, setEditCategory] = useState(record.category);
  const [editSource, setEditSource] = useState(record.source);
  const [editTags, setEditTags] = useState(() => {
    try { return JSON.parse(record.tags).join(", "); } catch { return ""; }
  });
  const [editNumericValue, setEditNumericValue] = useState(String(record.numericValue));
  const [editConfidence, setEditConfidence] = useState(String(record.confidence));
  const [editVector, setEditVector] = useState(record.vector);
  const [editMetadata, setEditMetadata] = useState(record.metadata);
  const [editStatus, setEditStatus] = useState(record.status);

  const tags = parseTags(record.tags);
  const vectorValues = parseVector(record.vector);
  const preview = vectorValues.slice(0, VECTOR_PREVIEW_LENGTH);

  const handleEdit = () => {
    setEditing(true);
    setExpanded(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setError(null);
    setEditLabel(record.label);
    setEditDescription(record.description);
    setEditCategory(record.category);
    setEditSource(record.source);
    setEditTags(parseTags(record.tags).join(", "));
    setEditNumericValue(String(record.numericValue));
    setEditConfidence(String(record.confidence));
    setEditVector(record.vector);
    setEditMetadata(record.metadata);
    setEditStatus(record.status);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("label", editLabel);
    fd.set("description", editDescription);
    fd.set("category", editCategory);
    fd.set("source", editSource);
    fd.set("tags", editTags);
    fd.set("numericValue", editNumericValue);
    fd.set("confidence", editConfidence);
    fd.set("vector", editVector);
    fd.set("metadata", editMetadata);
    fd.set("status", editStatus);
    const result = await updateRecord(record.id, fd);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setEditing(false);
      onUpdated(record.id, {
        label: editLabel,
        description: editDescription,
        category: editCategory,
        source: editSource,
        tags: JSON.stringify(editTags.split(",").map((t: string) => t.trim()).filter(Boolean)),
        numericValue: parseFloat(editNumericValue),
        confidence: parseFloat(editConfidence),
        vector: editVector,
        metadata: editMetadata,
        status: editStatus,
        version: record.version + 1,
        updatedAt: new Date(),
      });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteRecord(record.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      setShowConfirm(false);
    } else {
      onDeleted(record.id);
    }
  };

  return (
    <>
      <article
        className={`border rounded-[20px] bg-[rgba(255,252,247,0.82)] overflow-hidden transition-shadow ${
          editing
            ? "border-[rgba(31,106,82,0.35)] shadow-[0_0_0_3px_rgba(31,106,82,0.12),0_8px_28px_rgba(76,56,34,0.12)]"
            : "border-[rgba(86,67,48,0.12)] shadow-[0_4px_16px_rgba(76,56,34,0.07)] hover:shadow-[0_8px_28px_rgba(76,56,34,0.12)]"
        }`}
      >
        {/* ── Summary ── */}
        <div className="p-5 px-6">
          <div className="flex items-start gap-3 mb-4 flex-wrap">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[rgba(92,73,56,0.08)] font-mono text-[0.72rem] text-[#8a7767] shrink-0"
              title={record.id}
            >
              #{record.id.slice(0, 8)}
            </span>
            {editing ? (
              <input
                className={`${fieldInputClass} flex-1`}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Label"
              />
            ) : (
              <h3 className="flex-1 m-0 text-[1.05rem] font-bold text-[#1f1811] leading-[1.35]">
                {record.label}
              </h3>
            )}
            {isAdmin && (
              <div className="flex gap-1.5 shrink-0">
                <button
                  className={`flex items-center justify-center w-8 h-8 rounded-lg border cursor-pointer text-sm transition-[background,border-color,color] ${
                    editing
                      ? "bg-[rgba(31,106,82,0.12)] border-[rgba(31,106,82,0.3)] text-accent-strong"
                      : "border-[rgba(92,73,56,0.16)] bg-[rgba(255,255,255,0.6)] text-[#8a7767] hover:bg-[rgba(31,106,82,0.08)] hover:border-[rgba(31,106,82,0.25)] hover:text-accent-strong"
                  }`}
                  title="Edit record"
                  onClick={handleEdit}
                  disabled={editing}
                  aria-label="Edit record"
                >
                  ✏️
                </button>
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-[rgba(92,73,56,0.16)] bg-[rgba(255,255,255,0.6)] cursor-pointer text-sm transition-[background,border-color,color] text-[#8a7767] hover:bg-[rgba(159,54,38,0.1)] hover:border-[rgba(159,54,38,0.2)] hover:text-[#7c271b]"
                  title="Delete record"
                  onClick={() => setShowConfirm(true)}
                  aria-label="Delete record"
                >
                  🗑
                </button>
              </div>
            )}
          </div>

          {/* ── Key fields grid ── */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            <div className="flex flex-col gap-1">
              <span className={fieldLabelClass}>Category</span>
              {editing ? (
                <input className={fieldInputClass} value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
              ) : (
                <span className="text-[0.9rem] text-[#1f1811] break-words">{record.category}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className={fieldLabelClass}>Status</span>
              {editing ? (
                <select className={fieldSelectClass} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              ) : (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.72rem] font-bold tracking-[0.06em] uppercase ${getStatusBadgeClass(record.status)}`}>
                  {record.status}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className={fieldLabelClass}>Numeric Value</span>
              {editing ? (
                <input className={fieldInputClass} type="number" step="any" value={editNumericValue} onChange={(e) => setEditNumericValue(e.target.value)} />
              ) : (
                <span className="text-[0.9rem] text-[#1f1811] break-words">{record.numericValue.toFixed(4)}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className={fieldLabelClass}>Confidence</span>
              {editing ? (
                <input className={fieldInputClass} type="number" step="0.01" min="0" max="1" value={editConfidence} onChange={(e) => setEditConfidence(e.target.value)} />
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 rounded-full bg-[rgba(92,73,56,0.1)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-strong"
                      style={{ width: `${Math.min(100, record.confidence * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <span className="text-[0.8rem] text-[#5f5044]">{(record.confidence * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className={fieldLabelClass}>Dimensions</span>
              <span className="text-[0.9rem] text-[#1f1811] break-words">{record.dimension.toLocaleString()}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className={fieldLabelClass}>Version</span>
              <span className="text-[0.9rem] text-[#1f1811] break-words">v{record.version}</span>
            </div>

            <div className="flex flex-col gap-1 col-span-full">
              <span className={fieldLabelClass}>Vector Preview</span>
              <div className="flex flex-wrap gap-[5px] items-center">
                {preview.map((v, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-[rgba(31,106,82,0.07)] font-mono text-[0.72rem] text-accent-strong">
                    {v.toFixed(4)}
                  </span>
                ))}
                {vectorValues.length > VECTOR_PREVIEW_LENGTH && (
                  <span className="text-[0.78rem] text-[#8a7767] italic">
                    … [{record.dimension.toLocaleString()} dims]
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Expand toggle ── */}
          <button
            className="flex items-center gap-1.5 mt-4 pt-2 w-full text-left bg-transparent text-[#8a7767] text-[0.8rem] font-semibold cursor-pointer transition-colors hover:text-accent-strong"
            style={{ border: "none", borderTop: "1px solid rgba(86,67,48,0.12)" }}
            onClick={() => setExpanded((p) => !p)}
            aria-expanded={expanded}
          >
            {expanded ? "▲ Hide details" : "▼ Show full details"}
          </button>
        </div>

        {/* ── Expanded detail section ── */}
        {expanded && (
          <div className="border-t border-[rgba(86,67,48,0.12)] p-5 px-6 bg-[rgba(255,255,255,0.3)]">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
              <div className="flex flex-col gap-1 col-span-full">
                <span className={fieldLabelClass}>Description</span>
                {editing ? (
                  <textarea className={fieldTextareaClass} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
                ) : (
                  <p className="text-sm text-[#5f5044] break-words leading-[1.55] m-0">{record.description}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className={fieldLabelClass}>Source</span>
                {editing ? (
                  <input className={fieldInputClass} value={editSource} onChange={(e) => setEditSource(e.target.value)} />
                ) : (
                  <span className="text-sm text-[#5f5044] break-words leading-[1.55]">{record.source}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className={fieldLabelClass}>Tags</span>
                {editing ? (
                  <input
                    className={fieldInputClass}
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                ) : (
                  <div className="flex flex-wrap gap-[5px]">
                    {tags.length > 0 ? tags.map((t) => (
                      <span key={t} className="px-2.5 py-0.5 rounded-full bg-[rgba(92,73,56,0.08)] text-[0.75rem] text-[#5f5044]">{t}</span>
                    )) : <span className="text-sm text-[#5f5044] leading-[1.55]">—</span>}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className={fieldLabelClass}>Created by</span>
                <span className="text-sm text-[#5f5044] leading-[1.55]">{record.createdBy.username}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className={fieldLabelClass}>Created at</span>
                <span className="text-sm text-[#5f5044] leading-[1.55]">{formatDate(record.createdAt)}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className={fieldLabelClass}>Updated at</span>
                <span className="text-sm text-[#5f5044] leading-[1.55]">{formatDate(record.updatedAt)}</span>
              </div>

              <div className="flex flex-col gap-1 col-span-full">
                <span className={fieldLabelClass}>Metadata (JSON)</span>
                {editing ? (
                  <textarea className={fieldTextareaClass} value={editMetadata} onChange={(e) => setEditMetadata(e.target.value)} rows={4} />
                ) : (
                  <pre className="font-mono text-[0.78rem] bg-[rgba(92,73,56,0.06)] p-2.5 rounded-lg whitespace-pre-wrap break-all max-h-[180px] overflow-y-auto m-0">
                    {JSON.stringify(JSON.parse(record.metadata), null, 2)}
                  </pre>
                )}
              </div>

              <div className="flex flex-col gap-1 col-span-full">
                <span className={fieldLabelClass}>Full Vector ({record.dimension.toLocaleString()} floats)</span>
                {editing ? (
                  <textarea className={fieldTextareaClass} value={editVector} onChange={(e) => setEditVector(e.target.value)} rows={6} />
                ) : (
                  <pre className="font-mono text-[0.78rem] bg-[rgba(92,73,56,0.06)] p-2.5 rounded-lg whitespace-pre-wrap break-all max-h-[180px] overflow-y-auto m-0">
                    {record.vector}
                  </pre>
                )}
              </div>
            </div>

            {/* ── Edit action row ── */}
            {editing && (
              <>
                {error && (
                  <p className="px-3.5 py-2.5 rounded-[10px] bg-[rgba(159,54,38,0.1)] border border-[rgba(159,54,38,0.2)] text-[#7c271b] text-sm mt-3">
                    {error}
                  </p>
                )}
                <div className="flex gap-2.5 mt-5 pt-4 border-t border-[rgba(86,67,48,0.12)]">
                  <button
                    className="px-5 py-2.5 rounded-xl border-0 bg-gradient-to-br from-accent to-accent-strong text-[#f7f8f6] text-sm font-bold cursor-pointer transition-opacity disabled:opacity-70 disabled:cursor-wait"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button className={cancelBtnClass} onClick={handleCancelEdit} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </article>

      {/* ── Delete confirmation overlay ── */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-[rgba(31,24,17,0.5)] flex items-center justify-center z-[200] p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="max-w-sm w-full p-7 rounded-3xl bg-[rgba(255,252,247,0.82)] border border-[rgba(86,67,48,0.12)] shadow-[0_40px_80px_rgba(31,24,17,0.3)] backdrop-blur-[18px]">
            <h3 id="confirm-title" className="m-0 mb-2.5 text-[1.15rem] font-bold">
              Delete record?
            </h3>
            <p className="mt-0 mb-5 text-[#5f5044] text-[0.9rem] leading-[1.6]">
              Are you sure you want to delete <strong>{record.label}</strong>? This action cannot be
              undone.
            </p>
            {error && (
              <p className="px-3.5 py-2.5 rounded-[10px] bg-[rgba(159,54,38,0.1)] border border-[rgba(159,54,38,0.2)] text-[#7c271b] text-sm mt-3">
                {error}
              </p>
            )}
            <div className="flex gap-2.5">
              <button
                className="px-5 py-2.5 rounded-xl border-0 bg-[#9f3626] text-white text-sm font-bold cursor-pointer disabled:opacity-70 disabled:cursor-wait"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                className={cancelBtnClass}
                onClick={() => { setShowConfirm(false); setError(null); }}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

