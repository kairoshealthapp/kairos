import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fhirClient } from "@/lib/fhir/client";
import { assembleChartContext } from "@/lib/fhir/chartContext";
import { getEncounterMeta } from "@/lib/fhir/encounters";
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

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
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
        />
      </div>
    </div>
  );
}
