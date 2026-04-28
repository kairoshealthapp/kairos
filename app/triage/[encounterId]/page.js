import Link from "next/link";
import { ArrowLeft, Link2 } from "lucide-react";
import { fhirClient } from "@/lib/fhir/client";
import { assembleChartContext } from "@/lib/fhir/chartContext";
import { getEncounterMeta } from "@/lib/fhir/encounters";
import { getInvestigations } from "@/lib/state/investigations";
import {
  findInvestigationForEncounter,
  summarizeInvestigation,
} from "@/lib/types/investigation";
import ChartContext from "@/components/ChartContext";
import BPLogTable from "@/components/BPLogTable";
import TriageWorkspace from "@/components/TriageWorkspace";

export const dynamic = "force-dynamic";

export default async function TriagePage({ params }) {
  const { encounterId } = await params;

  const encounter = await fhirClient.getEncounter(encounterId);
  if (!encounter) {
    return (
      <div className="space-y-3">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-fg">
          Encounter not found
        </h1>
        <p className="text-[13px] text-fg-muted">
          No encounter with id <code className="font-mono text-fg">{encounterId}</code> exists in
          the mock dataset.
        </p>
      </div>
    );
  }

  const patientId = encounter.subject?.reference?.replace(/^Patient\//, "");
  const chartContext = await assembleChartContext(patientId, encounterId);
  const meta = getEncounterMeta(encounterId);

  const callerContext = meta
    ? {
        callerType: meta.callerContext,
        callerName: meta.callerName,
        callerRelationship:
          meta.callerContext === "outside_clinician"
            ? "outside facility clinician calling about shared patient"
            : meta.callerContext === "patient"
            ? "patient (or family on behalf of patient)"
            : "",
      }
    : {
        callerType: "patient",
        callerName: "Patient",
        callerRelationship: "",
      };

  const patientName = chartContext?.patient?.name;
  const investigation = findInvestigationForEncounter(getInvestigations(), encounterId);
  const investigationSummary = investigation ? summarizeInvestigation(investigation) : null;

  // For results_followup encounters that have a Result Note touchpoint linked
  // to this specific encounter, pull the note and any MyChart messages from
  // the investigation so the triage page can render the Hartwell-style
  // dual-output workflow.
  let resultNote = null;
  let resultNoteSourceDetail = "";
  let resultNoteOccurredAt = "";
  let mychartMessages = [];
  if (investigation) {
    for (const tp of investigation.touchpoints || []) {
      if (
        tp.kind === "result_note" &&
        tp.data?.encounterId === encounterId
      ) {
        resultNote = {
          subject: tp.data.subject,
          body: tp.data.body,
          author: tp.sourceDetail,
        };
        resultNoteSourceDetail = tp.sourceDetail || "";
        resultNoteOccurredAt = tp.occurredAt;
      }
      if (tp.kind === "mychart_outbound" || tp.kind === "mychart_inbound") {
        mychartMessages.push({
          id: tp.data?.messageId || tp.id,
          direction: tp.kind === "mychart_outbound" ? "outbound" : "inbound",
          subject: tp.data?.subject,
          body: tp.data?.body,
          sentAt: tp.occurredAt,
          readAt: tp.data?.readAt,
          from: tp.sourceDetail,
        });
      }
    }
    mychartMessages.sort((a, b) =>
      String(a.sentAt).localeCompare(String(b.sentAt))
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-[15px] font-medium text-fg">
            {patientName || `Encounter ${encounter.id}`}
          </h1>
          <p className="text-[13px] text-fg-faint">
            <span className="font-mono">{encounter.id}</span>
            <span className="mx-2 text-fg-faint/60">·</span>
            Caller: {callerContext.callerName}
            <span className="mx-2 text-fg-faint/60">·</span>
            {callerContext.callerType.replace("_", " ")}
          </p>
          {investigation && investigationSummary && (
            <Link
              href={`/investigation/${investigation.id}`}
              className="inline-flex items-center gap-1.5 rounded-pill bg-[color:var(--color-source-clinician-soft)] px-2 py-0.5 text-[12px] font-medium text-[color:var(--color-source-clinician)] transition-opacity duration-100 hover:opacity-80"
            >
              <Link2 size={12} strokeWidth={1.75} />
              Part of {investigationSummary.touchpointCount}-event investigation
              {investigationSummary.bucketsTouched.length > 1 && (
                <span className="opacity-80">
                  {" "}
                  · spans {investigationSummary.bucketsTouched.length} buckets
                </span>
              )}
              <span className="opacity-80"> →</span>
            </Link>
          )}
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-button px-2 py-1 text-[13px] text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Dashboard
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[520px_minmax(0,1fr)]">
        <div className="space-y-6">
          <ChartContext chartContext={chartContext} />
          {chartContext?.bpLog?.readings && (
            <BPLogTable
              readings={chartContext.bpLog.readings}
              summary={chartContext.bpLog.summary}
              capturedFrom={chartContext.bpLog.capturedFrom}
              capturedAt={chartContext.bpLog.capturedAt}
            />
          )}
        </div>
        <TriageWorkspace
          patientId={patientId}
          encounterId={encounterId}
          chartContext={chartContext}
          callerContext={callerContext}
          encounterType={meta?.type || null}
          procedureContext={meta?.procedureContext || null}
          resultNote={resultNote}
          resultNoteSourceDetail={resultNoteSourceDetail}
          resultNoteOccurredAt={resultNoteOccurredAt}
          mychartMessages={mychartMessages}
        />
      </div>
    </div>
  );
}
