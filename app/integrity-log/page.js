import Link from "next/link";
import { ArrowLeft, ShieldCheck, ShieldAlert, CheckCircle2 } from "lucide-react";
import { getAttestationLog } from "@/lib/state/preVisitTasks";

export const dynamic = "force-dynamic";

const CLICK_LABEL = {
  medications_reviewed: "Medications reviewed",
  allergies_reviewed: "Allergies reviewed",
  history_reviewed: "History reviewed",
};

function relativeTime(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "now";
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.round(hr / 24);
  return `${days} d ago`;
}

function formatExact(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function IntegrityLogPage({ searchParams }) {
  const sp = searchParams || {};
  const filter = sp.filter || "all";
  const all = getAttestationLog();
  const sorted = [...all].sort(
    (a, b) => new Date(b.clickedAt).getTime() - new Date(a.clickedAt).getTime()
  );
  const filtered = filter === "unearned" ? sorted.filter((e) => !e.earned) : sorted;

  const earnedCount = sorted.filter((e) => e.earned).length;
  const unearnedCount = sorted.filter((e) => !e.earned).length;

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] font-medium tracking-[-0.01em] leading-[1.3] text-fg">
            Your Attestation Log
          </h1>
          <p className="text-[14px] text-fg-muted">
            Personal review history. Visible only to you. Not aggregated, not reported.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-button px-2 py-1 text-[13px] text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Dashboard
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-line-faint bg-surface p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
            Total this session
          </div>
          <div className="mt-1 text-[28px] font-semibold leading-none text-fg">
            {sorted.length}
          </div>
        </div>
        <div className="rounded-card border border-line-faint bg-surface p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
            Earned
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold leading-none text-fg">
              {earnedCount}
            </span>
            <CheckCircle2
              size={14}
              strokeWidth={1.75}
              className="text-[color:var(--color-flag-success)]"
            />
          </div>
        </div>
        <div className="rounded-card border border-line-faint bg-surface p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
            Unearned
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold leading-none text-fg">
              {unearnedCount}
            </span>
            <ShieldAlert
              size={14}
              strokeWidth={1.75}
              className="text-[color:var(--color-flag-low)]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/integrity-log"
          className={`rounded-button px-3 py-1 text-[13px] transition-colors ${filter === "all" ? "bg-muted text-fg" : "text-fg-muted hover:bg-muted hover:text-fg"}`}
        >
          All
        </Link>
        <Link
          href="/integrity-log?filter=unearned"
          className={`rounded-button px-3 py-1 text-[13px] transition-colors ${filter === "unearned" ? "bg-muted text-fg" : "text-fg-muted hover:bg-muted hover:text-fg"}`}
        >
          Unearned only
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 text-center">
          <ShieldCheck size={28} strokeWidth={1.5} className="text-fg-faint" />
          <p className="text-[14px] text-fg-muted">
            {filter === "unearned"
              ? "No unearned attestations recorded."
              : "No attestations recorded yet."}
          </p>
          <p className="text-[12px] text-fg-faint">
            Mark medications as reviewed from a pre-visit med rec encounter to populate this log.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="flex items-start gap-4 rounded-card border border-line-faint bg-surface p-5"
            >
              {e.earned ? (
                <CheckCircle2
                  size={16}
                  strokeWidth={1.75}
                  className="mt-1 shrink-0 text-[color:var(--color-flag-success)]"
                />
              ) : (
                <ShieldAlert
                  size={16}
                  strokeWidth={1.75}
                  className="mt-1 shrink-0 text-[color:var(--color-flag-low)]"
                />
              )}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[15px] font-medium text-fg">
                    {e.patientName || "Unknown patient"}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-medium ${e.earned ? "bg-[color:var(--color-flag-success-soft)] text-[color:var(--color-flag-success)]" : "bg-[color:var(--color-flag-low-soft)] text-[color:var(--color-flag-low)]"}`}
                  >
                    {e.earned ? "Earned" : "Unearned"}
                  </span>
                  <span className="text-[12px] text-fg-faint">
                    {CLICK_LABEL[e.clickType] || e.clickType}
                  </span>
                </div>
                <div className="text-[13px] text-fg-muted">
                  {e.discrepancyCount} discrepanc
                  {e.discrepancyCount === 1 ? "y" : "ies"} at click time
                  {e.unresolvedCount > 0 && (
                    <span className="text-[color:var(--color-flag-low)]">
                      {" "}
                      · {e.unresolvedCount} unresolved
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-fg-faint">
                  {formatExact(e.clickedAt)} · {relativeTime(e.clickedAt)}
                  {e.encounterId && (
                    <>
                      <span className="mx-1.5 text-fg-faint/60">·</span>
                      <Link
                        href={`/triage/${e.encounterId}`}
                        className="text-[color:var(--color-accent)] hover:underline"
                      >
                        view encounter
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
