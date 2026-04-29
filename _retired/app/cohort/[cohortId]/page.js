import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import {
  getCohortDefinition,
  getCohortSnapshot,
} from "@/lib/state/cohorts";
import CohortMemberList from "@/components/CohortMemberList";

export const dynamic = "force-dynamic";

function relativeTime(iso) {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "now";
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.round(hr / 24);
  return `${days} d ago`;
}

function Stat({ label, value, valueClass = "text-fg" }) {
  return (
    <div className="rounded-card border border-line-faint bg-surface p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
        {label}
      </div>
      <div
        className={`mt-1 text-[28px] font-semibold tracking-[-0.01em] leading-none ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

export default async function CohortPage({ params }) {
  const { cohortId } = await params;
  const definition = getCohortDefinition(cohortId);
  const snapshot = getCohortSnapshot(cohortId);

  if (!definition || !snapshot) {
    return (
      <div className="space-y-3">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-fg">
          Cohort not found
        </h1>
        <p className="text-[13px] text-fg-muted">
          No cohort with id <code className="font-mono text-fg">{cohortId}</code> exists.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-button px-2 py-1 text-[13px] text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Dashboard
        </Link>
      </div>
    );
  }

  const { summary, members, computedAt } = snapshot;

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] font-medium tracking-[-0.01em] leading-tight text-fg">
            {definition.name}
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-fg-muted">
            {definition.clinicalRationale}
          </p>
          <p className="text-[12px] text-fg-faint">
            {definition.criteriaDescription}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-button px-2 py-1 text-[13px] text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
          >
            <ArrowLeft size={14} strokeWidth={1.75} />
            Dashboard
          </Link>
          <div className="text-[12px] text-fg-faint">
            Last computed: {relativeTime(computedAt)}
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-button border border-line-faint bg-surface px-2.5 py-1 text-[12px] font-medium text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
          >
            <RefreshCw size={12} strokeWidth={1.75} />
            Recompute
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total" value={summary.totalCount} />
        <Stat
          label="Overdue"
          value={summary.overdueCount}
          valueClass={
            summary.overdueCount > 0
              ? "text-[color:var(--color-flag-low)]"
              : "text-fg"
          }
        />
        <Stat
          label="Drift"
          value={summary.driftCount}
          valueClass={
            summary.driftCount > 0
              ? "text-[color:var(--color-flag-low)]"
              : "text-fg"
          }
        />
        <Stat
          label="Unseen"
          value={summary.unseenCount}
          valueClass={
            summary.unseenCount > 0
              ? "text-[color:var(--color-flag-high)]"
              : "text-fg"
          }
        />
      </div>

      <CohortMemberList cohortId={cohortId} members={members} />
    </div>
  );
}
