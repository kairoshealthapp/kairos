// Pattern 10 — COORDINATION (skeleton)
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 6 (Patton/Kvalheim)

const fixture = {
  id: "kvalheim-coordination",
  slug: "kvalheim-coordination",
  patternId: 10,
  patternName: "COORDINATION",
  tab: "other",
  urgency: "calm",
  sourceChannel: "phone",
  sourceBox: "patient-call",
  mychartStatus: "active",
  receivedAt: "2026-04-29T13:28:00Z",
  card: {
    subject: "Scheduling escalation: Tregarthen booked September, patient asking earlier",
    kicker: "PATIENT CALL · TRIAGE",
    severity: "amber",
  },
  patient: {
    name: "Kvalheim, Augustus",
    displayName: "Augustus Kvalheim",
    age: 66,
    sex: "M",
    dob: "1960-01-15",
    mrn: "29014731",
    proxyName: null,
    primary: "Beckweldon NP, Heart and Vascular Clinic",
    coverage: "Medicare A+B + AARP supplement",
  },
  sourceArtifact: {
    type: "Patient Call",
    author: "Patient (via clinic phone, routed by front desk Adelaide Westkander)",
    timestamp: "2026-04-29 08:28",
    body:
      "Two sub-tasks routed by front desk:\n1. Patient says EP referral to Tregarthen has scheduled out to September; he is asking for an earlier alternate.\n2. Albuterol refill requested.\n\nRecent Patient Communication panel shows 4 cardiology touchpoints yesterday + procedure instructions 2d ago = active investigation.",
  },
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  actionScripts: {},
  finalSignedState: {
    nurseNote:
      "Patient called re: (1) earlier EP appointment alternative; (2) albuterol refill. HVC referral directory queried — alternates Vellacott + Birchington same Wash U group. Forwarded scheduling preferences to Dr. Beckweldon.",
    phoneScript:
      "Mr. Kvalheim, returning your call — alternates available at the same Wash U group; will follow up by end of day. Refill sent.",
    orders: ["Albuterol HFA refill — 90 days"],
    dxAssociated: ["Asthma"],
  },
};

export default fixture;
