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
];

export function listEncounters() {
  const now = Date.now();
  return ENCOUNTERS.map((e) => ({
    ...e,
    receivedAt: new Date(now - e.receivedAtMsAgo).toISOString(),
  }));
}

export function getEncounterMeta(id) {
  const e = ENCOUNTERS.find((x) => x.id === id);
  if (!e) return null;
  return {
    ...e,
    receivedAt: new Date(Date.now() - e.receivedAtMsAgo).toISOString(),
  };
}
