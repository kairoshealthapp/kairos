"use client";

import { CalendarClock } from "lucide-react";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function relativeDays(iso) {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  const d = Math.round(ms / (1000 * 60 * 60 * 24));
  if (d <= 0) return "today";
  if (d === 1) return "tomorrow";
  return `in ${d} days`;
}

export default function ProcedureContextCard({ procedureContext }) {
  if (!procedureContext) return null;
  return (
    <article className="rounded-card border border-line-faint bg-surface">
      <header className="flex items-baseline justify-between gap-4 border-b border-line-faint p-5">
        <div className="flex items-center gap-1.5">
          <CalendarClock size={14} strokeWidth={1.75} className="text-fg-muted" />
          <h2 className="text-[15px] font-medium text-fg">Procedure</h2>
        </div>
        {procedureContext.scheduledDate && (
          <span className="text-[12px] text-fg-faint">{relativeDays(procedureContext.scheduledDate)}</span>
        )}
      </header>
      <div className="space-y-1 p-5 text-[13px] text-fg">
        <div>
          <span className="font-medium">Type:</span>{" "}
          {procedureContext.type?.replace(/_/g, " ") || "unspecified"}
        </div>
        {procedureContext.scheduledDate && (
          <div>
            <span className="font-medium">Scheduled:</span> {formatDate(procedureContext.scheduledDate)}
          </div>
        )}
        {procedureContext.orderingProvider && (
          <div className="text-fg-muted">Ordering: {procedureContext.orderingProvider}</div>
        )}
      </div>
    </article>
  );
}
