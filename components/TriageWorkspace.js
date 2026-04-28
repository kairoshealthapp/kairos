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

const WHITFIELD_ENCOUNTER_ID = "whitfield_encounter_001";
const MARBURY_ENCOUNTER_ID = "marbury_encounter_001";
const HARTWELL_ENCOUNTER_ID = "hartwell_encounter_001";

function buildWhitfieldSeedEvidence() {
  const now = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      questionId: "seed_001",
      questionText: 'Confirm current symptoms — what specifically is "worse"?',
      answer:
        "Spouse reports increasing SOB over past 3 days, worse with exertion. Sleeping in recliner since Tuesday. No chest pain. Cough productive of clear sputum.",
      source: "family",
      sourceDetail: "Wife (spouse on phone)",
      capturedAt: new Date(now - 1000 * 60 * 5).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      questionId: "seed_002",
      questionText: "Has he weighed himself? Trend?",
      answer: "Up 6 lbs since last Friday per home scale. Current weight 198.",
      source: "family",
      sourceDetail: "Wife",
      capturedAt: new Date(now - 1000 * 60 * 4).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      questionId: "seed_003",
      questionText: "Reason Lasix was discontinued on 3/1?",
      answer:
        "Per Renee (VA RN): pre-renal AKI on 2/28 labs (Cr 1.8, baseline 1.2). Plan was to hold and recheck in 2 weeks. Has not been restarted. No labs since.",
      source: "outside_clinician",
      sourceDetail: "Renee, VA cardiology RN",
      capturedAt: new Date(now - 1000 * 60 * 3).toISOString(),
    },
  ];
}

function buildMarburySeedEvidence() {
  const now = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      questionId: "seed_h001",
      questionText: "How is patient taking the labetalol — any missed doses?",
      answer:
        "Reports taking morning dose consistently. Has missed evening dose 3-4 times in past 2 weeks because she \"forgets after dinner.\" Going to set phone alarm.",
      source: "patient",
      sourceDetail: "",
      capturedAt: new Date(now - 1000 * 60 * 8).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      questionId: "seed_h002",
      questionText: "Any symptoms with the higher readings?",
      answer:
        "Headache on 4/25 morning when SBP 156. No chest pain, no vision changes, no shortness of breath. Headaches resolve with Tylenol.",
      source: "patient",
      sourceDetail: "",
      capturedAt: new Date(now - 1000 * 60 * 7).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      questionId: "seed_h003",
      questionText: "Sodium intake / dietary changes?",
      answer:
        "Says she has been more careful — switched from regular to low-sodium soup, stopped adding salt at table. Husband says she still eats out for lunch 3-4x/week.",
      source: "patient",
      sourceDetail: "",
      capturedAt: new Date(now - 1000 * 60 * 6).toISOString(),
    },
  ];
}

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
}) {
  const [questions, setQuestions] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [seeded, setSeeded] = useState(false);
  const [dualDraft, setDualDraft] = useState(null);
  const [protocolSchedule, setProtocolSchedule] = useState(null);

  useEffect(() => {
    if (seeded) return;
    if (evidence.length === 0) {
      if (encounterId === WHITFIELD_ENCOUNTER_ID) {
        setEvidence(buildWhitfieldSeedEvidence());
      } else if (encounterId === MARBURY_ENCOUNTER_ID) {
        setEvidence(buildMarburySeedEvidence());
      }
    }
    setSeeded(true);
  }, [encounterId, evidence.length, seeded]);

  function addEvidence(item) {
    setEvidence((prev) => [...prev, item]);
  }

  function removeEvidence(id) {
    setEvidence((prev) => prev.filter((e) => e.id !== id));
  }

  const encounterContext = {
    type: chartContext?.encounter?.type,
    reason: chartContext?.encounter?.reason,
    callerContext,
  };

  const isResultsFollowupWithNote = !!resultNote;
  const isPreProcedure = encounterType === "pre_procedure_inquiry";

  return (
    <div className="space-y-6">
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

      {!isResultsFollowupWithNote && !isPreProcedure && (
        <TriageQuestions
          patientId={patientId}
          encounterId={encounterId}
          callerContext={callerContext}
          onQuestionsGenerated={setQuestions}
        />
      )}
      <EvidenceCapture
        questions={questions}
        evidence={evidence}
        defaultSource={defaultSourceFor(callerContext)}
        onAddEvidence={addEvidence}
        onRemoveEvidence={removeEvidence}
      />
      <SBARDraft
        encounterContext={encounterContext}
        chartContext={chartContext}
        evidence={evidence}
      />
    </div>
  );
}
