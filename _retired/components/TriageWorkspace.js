"use client";

import { useEffect, useState } from "react";
import TriageQuestions from "./TriageQuestions";
import EvidenceCapture from "./EvidenceCapture";
import SBARDraft from "./SBARDraft";
import ResultNoteCard from "./ResultNoteCard";
import DualOutputDraft from "./DualOutputDraft";
import MyChartThread from "./MyChartThread";
import ProcedureContextCard from "./ProcedureContextCard";
import ProtocolApplier from "./ProtocolApplier";
import MedRecPanel from "./MedRecPanel";
import PriorAuthTracker from "./PriorAuthTracker";

function defaultSourceFor(callerContext) {
  if (callerContext?.callerType === "outside_clinician") return "outside_clinician";
  if (callerContext?.callerType === "patient") return "patient";
  if (callerContext?.callerType === "family") return "family";
  return "patient";
}

export default function TriageWorkspace({
  patientId,
  encounterId,
  chartContext,
  callerContext,
  encounterType = null,
  procedureContext = null,
  resultNote = null,
  resultNoteSourceDetail = "",
  resultNoteOccurredAt = "",
  mychartMessages = null,
  medRecBundle = null,
  priorAuth = null,
}) {
  const [questions, setQuestions] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [sbarVersions, setSBARVersions] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [dualDraft, setDualDraft] = useState(null);
  const [protocolSchedule, setProtocolSchedule] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    Promise.all([
      fetch(`/api/encounters/${encounterId}/evidence`).then((r) => r.json()),
      fetch(`/api/encounters/${encounterId}/sbar`).then((r) => r.json()),
    ])
      .then(([ev, sb]) => {
        if (cancelled) return;
        setEvidence(Array.isArray(ev) ? ev : []);
        setSBARVersions(Array.isArray(sb) ? sb : []);
        setHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [encounterId]);

  async function addEvidence(item) {
    const optimistic = { ...item };
    setEvidence((prev) => [...prev, optimistic]);
    try {
      const res = await fetch(`/api/encounters/${encounterId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = await res.json();
      setEvidence((prev) => prev.map((e) => (e.id === optimistic.id ? saved : e)));
    } catch {
      setEvidence((prev) => prev.filter((e) => e.id !== optimistic.id));
    }
  }

  async function removeEvidence(id) {
    const prevSnapshot = evidence;
    setEvidence((prev) => prev.filter((e) => e.id !== id));
    try {
      const res = await fetch(
        `/api/encounters/${encounterId}/evidence/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setEvidence(prevSnapshot);
    }
  }

  function handleSBARGenerated(next) {
    setSBARVersions((prev) => [...prev, next]);
  }

  const encounterContext = {
    type: chartContext?.encounter?.type,
    reason: chartContext?.encounter?.reason,
    callerContext,
  };

  const isResultsFollowupWithNote = !!resultNote;
  const isPreProcedure = encounterType === "pre_procedure_inquiry";
  const isPreVisitMedRec = encounterType === "pre_visit_med_rec";
  const isPriorAuthInquiry = encounterType === "prior_auth_inquiry" && !!priorAuth;

  return (
    <div className="space-y-6">
      {isPriorAuthInquiry && (
        <>
          <PriorAuthTracker priorAuth={priorAuth} chartContext={chartContext} />
          {priorAuth.latestPatientCommunication && (
            <MyChartThread
              messages={[
                {
                  id: "pa_latest",
                  direction: priorAuth.latestPatientCommunication.direction,
                  body: priorAuth.latestPatientCommunication.body,
                  sentAt: priorAuth.latestPatientCommunication.receivedAt,
                  from: chartContext?.patient?.name || "Patient",
                  subject: "Repatha — status update",
                },
              ]}
            />
          )}
        </>
      )}

      {isPreVisitMedRec && medRecBundle && (
        <MedRecPanel
          task={medRecBundle.task}
          encounterId={encounterId}
          patientId={patientId}
          patientName={chartContext?.patient?.name || ""}
          epicMeds={medRecBundle.epicMeds}
          initialDiscrepancies={medRecBundle.discrepancies}
          initialResolutions={medRecBundle.task?.discrepancyResolutions || {}}
        />
      )}

      {isPreProcedure && (
        <>
          <ProcedureContextCard procedureContext={procedureContext} />
          <ProtocolApplier
            patient={chartContext?.patient}
            procedureContext={procedureContext}
            scheduleResult={protocolSchedule}
            onScheduleGenerated={setProtocolSchedule}
          />
        </>
      )}

      {isResultsFollowupWithNote && (
        <>
          <ResultNoteCard
            resultNote={resultNote}
            occurredAt={resultNoteOccurredAt}
            sourceDetail={resultNoteSourceDetail}
          />
          <DualOutputDraft
            chartContext={chartContext}
            resultNote={resultNote}
            evidence={evidence}
            draft={dualDraft}
            onDraftGenerated={setDualDraft}
          />
          {mychartMessages && mychartMessages.length > 0 && (
            <MyChartThread messages={mychartMessages} />
          )}
        </>
      )}

      {!isResultsFollowupWithNote && !isPreProcedure && !isPreVisitMedRec && !isPriorAuthInquiry && (
        <TriageQuestions
          patientId={patientId}
          encounterId={encounterId}
          callerContext={callerContext}
          onQuestionsGenerated={setQuestions}
        />
      )}
      <EvidenceCapture
        questions={isPreVisitMedRec || isPriorAuthInquiry ? [] : questions}
        evidence={evidence}
        defaultSource={defaultSourceFor(callerContext)}
        onAddEvidence={addEvidence}
        onRemoveEvidence={removeEvidence}
      />
      <SBARDraft
        encounterId={encounterId}
        encounterContext={encounterContext}
        chartContext={chartContext}
        evidence={evidence}
        initialVersions={sbarVersions}
        onSBARGenerated={handleSBARGenerated}
      />
    </div>
  );
}
