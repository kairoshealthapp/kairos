"use client";

import { FileText } from "lucide-react";

function formatStamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export default function ResultNoteCard({ resultNote, occurredAt, sourceDetail }) {
  if (!resultNote?.body) return null;
  return (
    <article className="rounded-card border border-line-faint bg-surface">
      <header className="flex items-baseline justify-between gap-4 border-b border-line-faint p-5">
        <div className="flex items-center gap-1.5">
          <FileText size={14} strokeWidth={1.75} className="text-fg-muted" />
          <h2 className="text-[15px] font-medium text-fg">Provider Result Note</h2>
        </div>
        <div className="text-[12px] text-fg-faint">
          {sourceDetail && <span>{sourceDetail}</span>}
          {sourceDetail && occurredAt && (
            <span className="mx-1.5 text-fg-faint/60">·</span>
          )}
          {occurredAt && <span>{formatStamp(occurredAt)}</span>}
        </div>
      </header>
      <div className="p-5">
        {resultNote.subject && (
          <div className="mb-2 text-[14px] font-medium text-fg">
            {resultNote.subject}
          </div>
        )}
        <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-fg">
          {resultNote.body}
        </div>
      </div>
    </article>
  );
}
