import Link from "next/link";
import { Inbox, Link2, Users, ArrowUpRight } from "lucide-react";
import { listEncounters } from "@/lib/fhir/encounters";
import { getInvestigations } from "@/lib/state/investigations";
import {
  findInvestigationForEncounter,
  summarizeInvestigation,
} from "@/lib/types/investigation";
import {
  getCohortDefinitions,
  getCohortSnapshot,
} from "@/lib/state/cohorts";
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
  if (e.type === "results_followup") {
    return e.callerContext === "provider"
      ? { label: "Result Note · Provider", tone: "clinician" }
      : { label: "Results Follow-Up", tone: "neutral" };
  }
  if (e.type === "pre_procedure_inquiry") {
    return { label: "Pre-Procedure", tone: "neutral" };
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

function relativeReviewedAt(snapshot) {
  if (!snapshot) return "never";
  const reviewed = snapshot.members
    .map((m) => m.lastReviewedAt)
    .filter(Boolean)
    .sort()
    .pop();
  if (!reviewed) return "never";
  const ms = Date.now() - new Date(reviewed).getTime();
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.round(hr / 24);
  return `${days} d ago`;
}

export default function DashboardPage() {
  const allEncounters = listEncounters();
  const investigations = getInvestigations();
  const cohortDefinitions = getCohortDefinitions();
  const cohortCards = cohortDefinitions
    .map((def) => ({ def, snapshot: getCohortSnapshot(def.id) }))
    .filter((c) => c.snapshot);

  // Inbox shows only encounters that still need attention. Completed encounters
  // remain reachable via the investigation timeline they belong to.
  const encounters = allEncounters.filter((e) => e.status !== "complete");

  const sorted = [...encounters].sort((a, b) => {
    const sr = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (sr !== 0) return sr;
    return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
  });

  const counts = {
    total: encounters.length,
    activeInvestigations: investigations.filter((i) => i.status !== "closed").length,
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Active encounters" value={counts.total} />
        <Stat label="Active investigations" value={counts.activeInvestigations} />
        <Stat label="Awaiting nurse review" value={counts.new} />
        <Stat label="In progress" value={counts.in_progress} />
      </div>

      {cohortCards.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
            Cohort surveillance
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cohortCards.map(({ def, snapshot }) => (
              <li key={def.id}>
                <Link
                  href={`/cohort/${def.id}`}
                  className="group flex items-start gap-4 rounded-card border border-line-faint bg-surface p-5 transition-all duration-150 hover:border-line hover:shadow-sm"
                >
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-source-clinician-soft)] text-[color:var(--color-source-clinician)]">
                    <Users size={13} strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[15px] font-medium text-fg">{def.name}</span>
                      <ArrowUpRight
                        size={14}
                        strokeWidth={1.75}
                        className="text-fg-faint transition-colors duration-100 group-hover:text-fg-muted"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
                      {snapshot.summary.overdueCount > 0 && (
                        <span className="text-[color:var(--color-flag-low)]">
                          {snapshot.summary.overdueCount} overdue
                        </span>
                      )}
                      {snapshot.summary.driftCount > 0 && (
                        <>
                          {snapshot.summary.overdueCount > 0 && (
                            <span className="text-fg-faint/60">·</span>
                          )}
                          <span className="text-[color:var(--color-flag-low)]">
                            {snapshot.summary.driftCount} drift
                          </span>
                        </>
                      )}
                      {snapshot.summary.unseenCount > 0 && (
                        <>
                          <span className="text-fg-faint/60">·</span>
                          <span className="text-[color:var(--color-flag-high)]">
                            {snapshot.summary.unseenCount} unseen
                          </span>
                        </>
                      )}
                      <span className="text-fg-faint/60">·</span>
                      <span className="text-fg-muted">
                        {snapshot.summary.totalCount} total
                      </span>
                    </div>
                    <div className="text-[11px] text-fg-faint">
                      Last reviewed: {relativeReviewedAt(snapshot)}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
          Inbox
        </h2>
        <ul className="space-y-3">
          {sorted.map((e) => {
            const pill = encounterPill(e);
            const investigation = findInvestigationForEncounter(investigations, e.id);
            const summary = investigation ? summarizeInvestigation(investigation) : null;
            return (
              <li key={e.id} className="relative">
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
                {investigation && summary && (
                  <Link
                    href={`/investigation/${investigation.id}`}
                    className="absolute bottom-4 right-5 inline-flex items-center gap-1.5 rounded-pill bg-[color:var(--color-source-clinician-soft)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-source-clinician)] transition-opacity duration-100 hover:opacity-80"
                  >
                    <Link2 size={11} strokeWidth={1.75} />
                    Part of {summary.touchpointCount}-event investigation
                    {summary.bucketsTouched.length > 1 && (
                      <span className="opacity-80">
                        {" "}
                        · spans {summary.bucketsTouched.length} buckets
                      </span>
                    )}
                  </Link>
                )}
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
