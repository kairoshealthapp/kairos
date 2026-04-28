import Link from "next/link";
import { Inbox } from "lucide-react";
import { listEncounters } from "@/lib/fhir/encounters";
import DashboardClock from "@/components/DashboardClock";

export const dynamic = "force-dynamic";

const STATUS_RANK = { new: 0, in_progress: 1, complete: 2 };
const STATUS_DOT = {
  new: "bg-[color:var(--color-accent)]",
  in_progress: "bg-[color:var(--color-flag-low)]",
  complete: "bg-[color:var(--color-flag-success)]",
};
const STATUS_LABEL = {
  new: "New",
  in_progress: "In progress",
  complete: "Complete",
};

function encounterPill(e) {
  const isOutsideRN = e.callerContext === "outside_clinician";
  if (e.type === "phone_triage") {
    return isOutsideRN
      ? { label: "Phone · Outside RN", tone: "clinician" }
      : { label: "Phone · Patient", tone: "patient" };
  }
  if (e.type === "patient_call") {
    return isOutsideRN
      ? { label: "Outside Clinician", tone: "clinician" }
      : { label: "Patient Call", tone: "patient" };
  }
  return { label: e.type, tone: "neutral" };
}

const PILL_TONES = {
  patient:
    "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]",
  clinician:
    "bg-[color:var(--color-source-clinician-soft)] text-[color:var(--color-source-clinician)]",
  family:
    "bg-[color:var(--color-source-family-soft)] text-[color:var(--color-source-family)]",
  neutral: "bg-muted text-fg-muted",
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

export default function DashboardPage() {
  const encounters = listEncounters();
  const sorted = [...encounters].sort((a, b) => {
    const sr = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (sr !== 0) return sr;
    return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
  });

  const counts = {
    total: encounters.length,
    new: encounters.filter((e) => e.status === "new").length,
    in_progress: encounters.filter((e) => e.status === "in_progress").length,
  };

  if (encounters.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Inbox size={32} strokeWidth={1.5} className="text-fg-faint" />
        <p className="text-[15px] text-fg-muted">No active encounters</p>
        <p className="text-[13px] text-fg-faint">New encounters will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[32px] font-semibold tracking-[-0.01em] leading-[1.3] text-fg">
            Dashboard
          </h1>
          <p className="text-[15px] text-fg-muted">Active encounters</p>
        </div>
        <DashboardClock />
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Active encounters" value={counts.total} />
        <Stat label="Awaiting nurse review" value={counts.new} />
        <Stat label="In progress" value={counts.in_progress} />
      </div>

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
          Inbox
        </h2>
        <ul className="space-y-3">
          {sorted.map((e) => {
            const pill = encounterPill(e);
            return (
              <li key={e.id}>
                <Link
                  href={`/triage/${e.id}`}
                  className="group flex items-start gap-4 rounded-card border border-line-faint bg-surface p-5 transition-all duration-150 hover:border-line hover:shadow-sm"
                >
                  <span
                    aria-label={STATUS_LABEL[e.status]}
                    title={STATUS_LABEL[e.status]}
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[e.status]}`}
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-[16px] font-medium text-fg">
                        {e.patientName}
                      </span>
                      <span className="text-[13px] text-fg-faint">
                        {e.patientGender} · {e.patientAge}y
                      </span>
                      <span
                        className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[12px] font-medium ${PILL_TONES[pill.tone] || PILL_TONES.neutral}`}
                      >
                        {pill.label}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[14px] text-fg-muted">
                      {e.reason}
                    </p>
                    <div className="text-[12px] text-fg-faint">
                      <span className="font-mono">{e.id}</span>
                      {e.callerName && (
                        <>
                          <span className="mx-1.5 text-fg-faint/60">·</span>
                          {e.callerName}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-[12px] text-fg-faint">
                    {relativeTime(e.receivedAt)}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-card border border-line-faint bg-surface p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
        {label}
      </div>
      <div className="mt-1 text-[32px] font-semibold tracking-[-0.01em] leading-none text-fg">
        {value}
      </div>
    </div>
  );
}
