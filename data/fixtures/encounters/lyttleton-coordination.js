// Pattern 10 — COORDINATION (skeleton)
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 6 (Patton/Tanaka)

const fixture = {
  id: "lyttleton-coordination",
  slug: "lyttleton-coordination",
  patternId: 10,
  patternName: "COORDINATION",
  tab: "patientcall",
  urgency: "calm",
  sourceChannel: "phone",
  sourceBox: "patient-call",
  mychartStatus: "active",
  receivedAt: "2026-04-29T13:28:00Z",
  card: {
    subject: "Scheduling escalation: Williams booked September, patient asking earlier",
    kicker: "PATIENT CALL · TRIAGE",
    severity: "amber",
  },
  patient: {
    name: "Tanaka, Mark",
    displayName: "Mark Tanaka",
    age: 66,
    sex: "M",
    dob: "1960-01-15",
    mrn: "29014731",
    proxyName: null,
    primary: "Davis NP, Cardiology Associates",
    coverage: "Medicare A+B + AARP supplement",
  },
  sourceArtifact: {
    type: "Patient Call",
    author: "Patient (via clinic phone, routed by front desk Maria Lopez)",
    timestamp: "2026-04-29 08:28",
    body:
      "Two sub-tasks routed by front desk:\n1. Patient says EP referral to Williams has scheduled out to September; he is asking for an earlier alternate.\n2. Albuterol refill requested.",
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
      "Patient called re: (1) earlier EP appointment alternative; (2) albuterol refill. HVC referral directory queried — alternates Cole + Cohen same Wash U group. Forwarded scheduling preferences to Dr. Davis.",
    phoneScript:
      "Mr. Tanaka, returning your call — alternates available at the same Wash U group; will follow up by end of day. Refill sent.",
    orders: ["Albuterol HFA refill — 90 days"],
    dxAssociated: ["Asthma"],
  },
  routing: {
    recipient: "LAKESIDE CARDIOLOGY SCHEDULING POOL",
    pool: "Lakeside Cardiology Support Pool",
    comment:
      "Patient requesting earlier appointment than EP referral availability (current first available September). Please advise.",
    priority: "Normal",
  },
};

export default fixture;
