"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowUpDown } from "lucide-react";
import { priorityComparator } from "@/lib/types/cohort";

const FLAG_META = {
  overdue: {
    label: "overdue",
    bg: "bg-[color:var(--color-flag-low-soft)]",
    fg: "text-[color:var(--color-flag-low)]",
  },
  drift: {
    label: "drift",
    bg: "bg-[color:var(--color-flag-low-soft)]",
    fg: "text-[color:var(--color-flag-low)]",
  },
  unseen: {
    label: "unseen",
    bg: "bg-[color:var(--color-flag-high-soft)]",
    fg: "text-[color:var(--color-flag-high)]",
  },
  stable: {
    label: "stable",
    bg: "bg-muted",
    fg: "text-fg-muted",
  },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "drift", label: "Drift" },
  { id: "unseen", label: "Unseen" },
  { id: "stable", label: "Stable" },
];

const SORTS = [
  { id: "priority", label: "Priority (default)" },
  { id: "daysOverdue", label: "Days overdue" },
  { id: "lastINR", label: "Last INR" },
  { id: "name", label: "Patient name" },
];

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

function PriorityBadge({ score }) {
  const tone =
    score >= 80
      ? "bg-[color:var(--color-flag-high-soft)] text-[color:var(--color-flag-high)]"
      : score >= 60
      ? "bg-[color:var(--color-flag-low-soft)] text-[color:var(--color-flag-low)]"
      : "bg-muted text-fg-muted";
  return (
    <span
      className={`inline-flex h-7 min-w-[2.25rem] items-center justify-center rounded-pill px-2 font-mono text-[12px] font-semibold ${tone}`}
      title={`Priority score ${score}`}
    >
      {score}
    </span>
  );
}

export default function CohortMemberList({ cohortId, members }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("priority");

  const filtered = useMemo(() => {
    if (filter === "all") return members;
    return members.filter((m) => (m.flags || []).includes(filter));
  }, [members, filter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === "priority") list.sort(priorityComparator);
    else if (sort === "daysOverdue")
      list.sort(
        (a, b) => (b.keyData?.daysOverdue ?? -1) - (a.keyData?.daysOverdue ?? -1)
      );
    else if (sort === "lastINR")
      list.sort((a, b) => (a.keyData?.lastINR ?? 0) - (b.keyData?.lastINR ?? 0));
    else if (sort === "name")
      list.sort((a, b) =>
        String(a.patientName || "").localeCompare(String(b.patientName || ""))
      );
    return list;
  }, [filtered, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={`inline-flex items-center rounded-pill px-2.5 py-1 text-[12px] font-medium transition-colors duration-100 ${
                  active
                    ? "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                    : "bg-transparent text-fg-faint hover:bg-muted hover:text-fg-muted"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 text-[12px] text-fg-muted">
          <ArrowUpDown size={12} strokeWidth={1.75} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-button border border-line-faint bg-surface px-2 py-1 text-[12px] text-fg"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="space-y-2">
        {sorted.map((m) => (
          <li key={m.patientId}>
            <Link
              href={`/cohort/${cohortId}/${m.patientId}`}
              className="group flex items-center gap-4 rounded-card border border-line-faint bg-surface px-4 py-3 transition-all duration-150 hover:border-line hover:shadow-sm"
            >
              <PriorityBadge score={m.priorityScore} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-[15px] font-medium text-fg">
                    {m.patientName}
                  </span>
                  <span className="text-[12px] text-fg-faint">{m.ageSex}</span>
                  <span className="text-[12px] text-fg-muted">
                    INR {m.keyData?.lastINR}
                    <span className="mx-1 text-fg-faint/60">·</span>
                    {formatDate(m.keyData?.lastINRDate)}
                    {m.keyData?.daysOverdue > 0 && (
                      <>
                        <span className="mx-1 text-fg-faint/60">·</span>
                        <span className="text-[color:var(--color-flag-low)]">
                          {m.keyData.daysOverdue}d overdue
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {(m.flags || []).map((f) => {
                    const meta = FLAG_META[f] || FLAG_META.stable;
                    return (
                      <span
                        key={f}
                        className={`inline-flex items-center rounded-pill px-1.5 py-0.5 font-medium ${meta.bg} ${meta.fg}`}
                      >
                        {meta.label}
                      </span>
                    );
                  })}
                  <span className="text-fg-faint">
                    {m.keyData?.indication}
                  </span>
                </div>
              </div>

              <ArrowUpRight
                size={14}
                strokeWidth={1.75}
                className="shrink-0 text-fg-faint transition-colors duration-100 group-hover:text-fg-muted"
              />
            </Link>
          </li>
        ))}
        {sorted.length === 0 && (
          <li className="rounded-card border border-line-faint bg-surface p-5 text-[13px] text-fg-muted">
            No members in this filter.
          </li>
        )}
      </ul>
    </div>
  );
}
