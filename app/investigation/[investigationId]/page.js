import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fhirClient } from "@/lib/fhir/client";
import { assembleChartContext } from "@/lib/fhir/chartContext";
import { getInvestigation } from "@/lib/state/investigations";
import { summarizeInvestigation } from "@/lib/types/investigation";
import ChartContext from "@/components/ChartContext";
import InvestigationTimeline from "@/components/InvestigationTimeline";

export const dynamic = "force-dynamic";

const STATUS_META = {
  open: {
    label: "Open",
    bg: "bg-[color:var(--color-accent-soft)]",
    fg: "text-[color:var(--color-accent)]",
  },
  pending_patient: {
    label: "Pending patient",
    bg: "bg-[color:var(--color-flag-low-soft)]",
    fg: "text-[color:var(--color-flag-low)]",
  },
  pending_provider: {
    label: "Pending provider",
    bg: "bg-[color:var(--color-flag-low-soft)]",
    fg: "text-[color:var(--color-flag-low)]",
  },
  closed: {
    label: "Closed",
    bg: "bg-[color:var(--color-flag-success-soft)]",
    fg: "text-[color:var(--color-flag-success)]",
  },
};

const BUCKET_LABEL = {
  results_followup: "Results Follow-Up",
  patient_call: "Patient Call",
  pt_advice_request: "Pt Advice Request",
  secure_chat: "Secure Chat",
  coumadin: "Coumadin",
};

export default async function InvestigationPage({ params }) {
  const { investigationId } = await params;
  const investigation = getInvestigation(investigationId);

  if (!investigation) {
    return (
      <div className="space-y-3">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-fg">
          Investigation not found
        </h1>
        <p className="text-[13px] text-fg-muted">
          No investigation with id <code className="font-mono text-fg">{investigationId}</code>{" "}
          exists.
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

  const chartContext = await assembleChartContext(investigation.patientId, null);
  const summary = summarizeInvestigation(investigation);
  const status = STATUS_META[investigation.status] || STATUS_META.open;

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="space-y-1">
            <h1 className="text-[24px] font-medium tracking-[-0.01em] text-fg">
              {chartContext?.patient?.name || investigation.patientId}
              {chartContext?.patient && (
                <span className="ml-3 text-[15px] font-normal text-fg-muted">
                  {chartContext.patient.gender} · {chartContext.patient.age}y
                </span>
              )}
            </h1>
            <p className="text-[16px] text-fg-muted">{investigation.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[12px] font-medium ${status.bg} ${status.fg}`}
            >
              {status.label}
            </span>
            <span className="text-[12px] text-fg-faint">
              {summary.touchpointCount} touchpoint{summary.touchpointCount === 1 ? "" : "s"}
              <span className="mx-1.5 text-fg-faint/60">·</span>
              {summary.bucketsTouched.length} bucket
              {summary.bucketsTouched.length === 1 ? "" : "s"}
              <span className="mx-1.5 text-fg-faint/60">·</span>
              {summary.daySpan} day{summary.daySpan === 1 ? "" : "s"}
              <span className="mx-1.5 text-fg-faint/60">·</span>
              {summary.sourcesTouched.length} source
              {summary.sourcesTouched.length === 1 ? "" : "s"}
            </span>
          </div>
          {investigation.clinicalConcern && (
            <p className="max-w-2xl text-[13px] leading-relaxed text-fg-muted">
              {investigation.clinicalConcern}
            </p>
          )}
        </div>
        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-button px-2 py-1 text-[13px] text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Dashboard
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
            Timeline
          </h2>
          <InvestigationTimeline touchpoints={investigation.touchpoints} />

          {summary.bucketsTouched.length > 1 && (
            <div className="mt-6 rounded-card border border-line-faint bg-muted/40 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
                Spans buckets
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {summary.bucketsTouched.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center rounded-pill bg-surface px-2 py-0.5 text-[12px] font-medium text-fg-muted"
                  >
                    {BUCKET_LABEL[b] || b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
            Patient chart
          </h2>
          <ChartContext chartContext={chartContext} />
        </aside>
      </div>
    </div>
  );
}
