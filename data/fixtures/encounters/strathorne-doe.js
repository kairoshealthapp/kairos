// Pattern 7b — ASYNC PRE-CALL STRUCTURED INQUIRY (skeleton)
// Source: docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md Pattern 7
// Strathorne DOE 4 stents 2025 — 20 chart-aware questions, MRSA discovery via Q16.

const fixture = {
  id: "strathorne-doe",
  slug: "strathorne-doe",
  patternId: "7b",
  patternName: "ASYNC PRE-CALL STRUCTURED INQUIRY",
  tab: "triage",
  urgency: "calm",
  sourceChannel: "phone",
  sourceBox: "patient-call",
  mychartStatus: "active",
  receivedAt: "2026-04-28T16:24:00Z",
  card: {
    subject: "Patient Call: DOE despite 4 stents 2025",
    kicker: "PATIENT CALL · TRIAGE",
    severity: "amber",
  },
  patient: {
    name: "Strathorne, Calliope",
    displayName: "Calliope Strathorne",
    age: 78,
    sex: "M",
    dob: "1948-04-01",
    mrn: "82091736",
    proxyName: null,
    primary: "Beckweldon NP, Heart and Vascular Clinic",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "Patient Call",
    author: "Patient (via clinic phone)",
    timestamp: "2026-04-28 11:24",
    body:
      "Patient called stating he had 4 stents placed in 2025 but is still experiencing DOE walking across the room. Reports lightheadedness intermittently. Requests nurse callback.",
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
      "Patient reports DOE despite 4 stents 2025. 20 chart-aware questions deployed (canonical pattern-7 implementation). Surprise data: active MRSA infection from elbow surgery (caught via medication-list cross-check), decreased appetite, weight loss. SBAR forwarded to Beckweldon urgent.",
    phoneScript: "[20-question chart-aware inquiry script]",
    orders: [],
    dxAssociated: ["Heart failure, unspecified", "MRSA infection of skin"],
  },
};

export default fixture;
