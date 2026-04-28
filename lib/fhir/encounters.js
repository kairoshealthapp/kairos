// Encounter metadata registry for the dashboard inbox view.
//
// In production this is a query against the work-queue layer (Epic In Basket
// for the In Basket-derived buckets, plus Kairos's own encounter table for
// Kairos-initiated workflows). For Phase 1 it's an in-memory list of demo
// encounters with their status, origin, and "received N ago" offset.
//
// `receivedAtMsAgo` is interpreted relative to the moment listEncounters()
// is called, so the demo always reads as "fresh" — Whitfield was 2 hours ago,
// Marbury was 25 minutes ago, regardless of when you load the page.

const ENCOUNTERS = [
  {
    id: "whitfield_encounter_001",
    patientId: "whitfield_sample_001",
    patientName: "Whitfield, Synthetic",
    patientAge: 76,
    patientGender: "male",
    type: "phone_triage",
    origin: "outside_clinician",
    callerContext: "outside_clinician",
    callerName: "Renee (VA RN)",
    reason:
      "SOB worse than baseline, weight up 1.5 lb. Renee (VA RN) calling for guidance — Lasix d/c 3/1.",
    status: "in_progress",
    channel: "phone",
    receivedAtMsAgo: 1000 * 60 * 60 * 2,
  },
  {
    id: "marbury_encounter_001",
    patientId: "marbury_sample_001",
    patientName: "Marbury, Synthetic",
    patientAge: 68,
    patientGender: "female",
    type: "patient_call",
    origin: "patient",
    callerContext: "patient",
    callerName: "Patient (in person)",
    reason:
      "Brought paper home BP log to clinic. Concerned BP still high despite new med (labetalol started 2 weeks ago).",
    status: "new",
    channel: "in_person",
    receivedAtMsAgo: 1000 * 60 * 25,
  },
  {
    id: "linnehan_encounter_001",
    patientId: "linnehan_sample_001",
    patientName: "Linnehan, Synthetic",
    patientAge: 71,
    patientGender: "male",
    type: "results_followup",
    origin: "system",
    callerContext: "system",
    callerName: "Lab result auto-routed",
    reason: "Subtherapeutic INR 1.6 (goal 2-3) — initial nurse triage",
    status: "complete",
    channel: "epic_inbox",
    receivedAtMsAgo: 1000 * 60 * 60 * 24 * 5,
    investigationId: "investigation_linnehan_001",
  },
  {
    id: "linnehan_encounter_002",
    patientId: "linnehan_sample_001",
    patientName: "Linnehan, Synthetic",
    patientAge: 71,
    patientGender: "male",
    type: "patient_call",
    origin: "nurse",
    callerContext: "patient",
    callerName: "Outbound to patient",
    reason: "Adherence follow-up — confirm missed doses Tue–Wed, plan recheck",
    status: "complete",
    channel: "phone",
    receivedAtMsAgo: 1000 * 60 * 60 * 24 * 3,
    investigationId: "investigation_linnehan_001",
  },
  {
    id: "linnehan_encounter_003",
    patientId: "linnehan_sample_001",
    patientName: "Linnehan, Synthetic",
    patientAge: 71,
    patientGender: "male",
    type: "patient_call",
    origin: "nurse",
    callerContext: "patient",
    callerName: "Outbound to patient",
    reason: "Recheck call queued — confirm INR draw and dose since last contact",
    status: "in_progress",
    channel: "phone",
    receivedAtMsAgo: 1000 * 60 * 30,
    investigationId: "investigation_linnehan_001",
  },
  {
    id: "hartwell_encounter_001",
    patientId: "hartwell_sample_001",
    patientName: "Hartwell, Synthetic",
    patientAge: 58,
    patientGender: "female",
    type: "results_followup",
    origin: "provider",
    callerContext: "provider",
    callerName: "Dr. Ballinger Result Note",
    reason: "Statin follow-up — LDL response + AST 42 mildly elevated. Draft MyChart + Nurse Note.",
    status: "in_progress",
    channel: "epic_inbox",
    receivedAtMsAgo: 1000 * 60 * 60 * 13 + 1000 * 60 * 9,
    investigationId: "investigation_hartwell_001",
  },
  {
    id: "halberg_encounter_001",
    patientId: "halberg_sample_001",
    patientName: "Halberg, Synthetic",
    patientAge: 64,
    patientGender: "female",
    type: "pre_procedure_inquiry",
    origin: "patient",
    callerContext: "patient",
    callerName: "Patient (phone)",
    reason: "Stress test scheduled in 7 days. Pt called asking which meds to hold and when.",
    status: "new",
    channel: "phone",
    receivedAtMsAgo: 1000 * 60 * 60 * 2,
    procedureContext: {
      type: "exercise_stress_test",
      protocolId: "pre_stress_test_med_management",
      scheduledDateMsFromNow: 1000 * 60 * 60 * 24 * 7,
      orderingProvider: "Dr. Eftheriou",
    },
  },
];

function resolveProcedureContext(e, now) {
  if (!e.procedureContext) return undefined;
  const pc = { ...e.procedureContext };
  if (pc.scheduledDateMsFromNow !== undefined) {
    pc.scheduledDate = new Date(now + pc.scheduledDateMsFromNow).toISOString();
    delete pc.scheduledDateMsFromNow;
  }
  return pc;
}

export function listEncounters() {
  const now = Date.now();
  return ENCOUNTERS.map((e) => ({
    ...e,
    receivedAt: new Date(now - e.receivedAtMsAgo).toISOString(),
    procedureContext: resolveProcedureContext(e, now),
  }));
}

export function getEncounterMeta(id) {
  const e = ENCOUNTERS.find((x) => x.id === id);
  if (!e) return null;
  const now = Date.now();
  return {
    ...e,
    receivedAt: new Date(now - e.receivedAtMsAgo).toISOString(),
    procedureContext: resolveProcedureContext(e, now),
  };
}
