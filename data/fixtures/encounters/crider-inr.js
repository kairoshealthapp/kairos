// Phase-3.5 canonical RESULTS fixture — routine INR within range.
// Source: real Hayes INR review (2026-04-30, Lakeside Lab). Demonstrates
// the clean dose-management pattern without contradiction overlay — trend
// is the clinical signal.

const fixture = {
  id: "crider-inr",
  slug: "crider-inr",
  patternId: 12,
  patternName: "INR ROUTINE",
  tab: "results",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results",
  mychartStatus: "active",
  receivedAt: "2026-04-30T13:32:00Z",
  card: {
    subject: "PROTIME-INR 2.0 — within range, no dose change",
    kicker: "RESULTS",
    severity: "green",
  },
  patient: {
    name: "Hayes, Patricia J.",
    displayName: "Patricia J. Hayes",
    age: 72,
    sex: "F",
    dob: "1953-07-04",
    mrn: "M000060536",
    proxyName: null,
    primary: "Mateus Brindlewain, MD (PCP)",
    cardiologyCoverage: "Rashid Lambridge, MD",
    coverage: "Medicare/Medicaid",
  },
  indication: "Atrial fibrillation with RVR",
  targetRange: "2.0 – 3.0 (conventional anticoagulation)",
  sourceArtifact: {
    type: "Result Note",
    test: "PROTIME-INR",
    resultedAt: "2026-04-30 13:32",
    specimenCollected: "2026-04-30 11:57",
    resultingAgency: "Lakeside Lab",
    body: "Result: INR 2.0 (Prothrombin Time 23.0s). Final result, test seen.",
  },
  inrTrend: [
    { date: "2025-12-26", value: 1.7 },
    { date: "2026-01-02", value: 2.2 },
    { date: "2026-01-09", value: 2.3 },
    { date: "2026-02-06", value: 2.5 },
    { date: "2026-03-06", value: 2.7 },
    { date: "2026-04-03", value: 2.5 },
    { date: "2026-04-23", value: 2.3 },
    { date: "2026-04-30", value: 2.0 },
  ],
  pendedOrders: false,
  nextAppt: "Cardiology with Rashid Lambridge, MD — 5/4/2026 4:00 PM",
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  actionScripts: {},
  finalSignedState: {
    nurseNote:
      "PROTIME-INR 2.0 (PT 23.0s, Lakeside Lab, drawn 11:57, resulted 13:32). Within target 2.0–3.0 for atrial fibrillation with RVR on conventional anticoagulation. Trend over four months: 2.5 → 2.7 → 2.5 → 2.3 → 2.0 — drift toward lower bound but still in range. No dose change indicated. Continue current warfarin regimen. Next cardiology visit Dr. Lambridge 5/4/2026 16:00.",
    phoneScript: "",
    orders: [],
    dxAssociated: ["Atrial fibrillation with RVR"],
  },
};

export default fixture;
