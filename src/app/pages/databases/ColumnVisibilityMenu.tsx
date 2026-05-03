"use client";

import { useState, useRef, useEffect } from "react";

type ColumnEntry = {
  name: string;
  visible: boolean;
  toggleUrl: string;
};

type Props = {
  columns: ColumnEntry[];
};

export function ColumnVisibilityMenu({ columns }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const visibleCount = columns.filter((c) => c.visible).length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-4 py-2.5 border border-[var(--c-border-input)] rounded-xl bg-[var(--c-bg-control)] text-[var(--c-text-secondary)] text-sm cursor-pointer transition-colors hover:bg-[var(--c-accent-bg)] hover:text-accent-strong hover:border-[var(--c-accent-border)]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>Columns</span>
        {visibleCount < columns.length && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--c-accent-bg)] text-accent-strong text-[0.65rem] font-bold border border-[var(--c-accent-border)]">
            {visibleCount}/{columns.length}
          </span>
        )}
        <span className="text-[0.7rem] opacity-60">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label="Toggle column visibility"
          className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[180px] max-h-[320px] overflow-y-auto rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-card)] shadow-[0_8px_28px_var(--c-shadow-hover)] py-1.5"
        >
          {columns.map(({ name, visible, toggleUrl }) => (
            <a
              key={name}
              href={toggleUrl}
              role="option"
              aria-selected={visible}
              className="flex items-center gap-2 w-full px-3.5 py-2 text-left text-sm text-[var(--c-text)] cursor-pointer no-underline bg-transparent transition-colors hover:bg-[var(--c-accent-bg)] hover:text-accent-strong"
            >
              <span className="w-4 shrink-0 text-accent-strong font-bold text-base leading-none">
                {visible ? "✓" : ""}
              </span>
              <span className="truncate">{name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
