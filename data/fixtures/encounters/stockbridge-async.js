// Pattern 7b — ASYNC PRE-CALL STRUCTURED INQUIRY (calm tier — skeleton)
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 19 (Sharp/Park)

const fixture = {
  id: "stockbridge-async",
  slug: "stockbridge-async",
  patternId: "7b",
  patternName: "ASYNC PRE-CALL STRUCTURED INQUIRY (calm tier)",
  tab: "patientadvice",
  urgency: "calm",
  sourceChannel: "mychart",
  sourceBox: "results-followup",
  mychartStatus: "active",
  receivedAt: "2026-04-29T14:48:00Z",
  card: {
    subject: "BNP drift monitoring — provider questions for patient",
    kicker: "ASYNC PRE-CALL · TRIAGE",
    severity: "green",
  },
  patient: {
    name: "Park, Gerald",
    displayName: "Gerald Park",
    age: 76,
    sex: "M",
    dob: "1949-11-08",
    mrn: "26819073",
    proxyName: null,
    primary: "Davis NP, Cardiology Associates",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "Result Note + provider clinical questions",
    author: "Davis, Cardiology",
    timestamp: "2026-04-29 09:48",
    body:
      "BNP drifting up over last 3 months. Asymptomatic per last visit. Send patient short MyChart inquiry: how is breathing, swelling, weight? If any concerning answer, escalate to URGENT phone callback with full HF triage.",
  },
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  actionScripts: {},
  finalSignedState: {
    nurseNote: "BNP drift detected. Sent 3-question MyChart inquiry. Will reclassify card based on patient reply.",
    mychartMessage:
      "Dr. Davis wanted me to check in on a few things since your last visit:\n  1. How is your breathing on your usual walks?\n  2. Any new swelling in legs or ankles?\n  3. Any weight gain in the last week?",
    orders: [],
    dxAssociated: ["Heart failure, unspecified"],
  },
};

export default fixture;
