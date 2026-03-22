"use client";

import { useState } from "react";
import { RecordCard } from "./RecordCard";

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

type RecordListProps = {
  initialRecords: VectorRecordWithUser[];
  isAdmin: boolean;
};

export function RecordList({ initialRecords, isAdmin }: RecordListProps) {
  const [records, setRecords] = useState(initialRecords);

  const handleDeleted = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdated = (id: string, updated: Partial<VectorRecordWithUser>) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated } : r)),
    );
  };

  if (records.length === 0) {
    return (
      <div className="py-[60px] px-6 text-center text-[var(--c-text-muted)] text-[0.95rem] border border-dashed border-[var(--c-border)] rounded-[20px]">
        No records found. {isAdmin ? 'Use "New Record" above to create one.' : ""}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          isAdmin={isAdmin}
          onDeleted={handleDeleted}
          onUpdated={handleUpdated}
        />
      ))}
    </div>
  );
}
