// Pattern 8 — CONTRADICTION
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 1 Surface 4 (Sturges/Foster)
// Patient statement contradicts active chart — clinical safety hold; forward to provider; NO autonomous reply.

const fixture = {
  id: "maundrell-contradiction",
  slug: "maundrell-contradiction",
  patternId: 8,
  patternName: "CONTRADICTION",
  // Pass D Phase 5 — Brandon's smoke-test: this card lives in PATIENT
  // ADVICE REQUEST, not Results. The patient sent a MyChart reply to
  // the INR-overdue template; the inbound is a patient-advice query
  // (with contradiction), not a fresh result.
  tab: "patientadvice",
  urgency: "calm",
  sourceChannel: "mychart",
  sourceBox: "pt-advice",
  mychartStatus: "active",
  receivedAt: "2026-04-29T13:52:00Z",
  card: {
    subject: "Pt Advice: \"Dr. H told me to stop warfarin\" — chart shows active",
    kicker: "ADVICE · CONTRADICTION",
    severity: "red",
  },
  patient: {
    name: "Foster, Richard",
    displayName: "Richard Foster",
    age: 74,
    sex: "M",
    dob: "1951-12-04",
    mrn: "82110649",
    proxyName: null,
    primary: "Reynolds, Cardiology (Coumadin Clinic)",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "MyChart Reply (re: outbound INR overdue template 4/24)",
    author: "Patient",
    timestamp: "2026-04-29 08:52",
    resultingAgency: "Lakeside Lab",
    body:
      "\"Dr. H told me to be taking only the other two medications and also said I don't have to take the blood test anymore.\"",
  },
  indication: "Atrial fibrillation, chronic — warfarin anticoagulation",
  targetRange: "2.0 – 3.0",
  inrTrend: [
    { date: "2025-12-01", value: 2.4 },
    { date: "2026-01-05", value: 2.6 },
    { date: "2026-02-02", value: 2.8 },
    { date: "2026-02-23", value: 2.9 },
    { date: "2026-03-09", value: 3.2 },
    { date: "2026-03-23", value: 3.5 },
  ],
  mychartReply: {
    timestamp: "2026-04-26 09:14",
    patientText:
      "Dr. H told me to be taking only the other two medications and also said I don't have to take the blood test anymore.",
  },
  contradictionHold: true,
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  actionScripts: {
    "forward-to-provider": [
      { type: "state-transition", target: "card", newState: "drafting", delayMsBefore: 100 },
      { type: "banner", kind: "red", text: "Contradiction detected: patient statement vs active medication list. Holding all autonomous action.", durationMs: 1400 },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 75,
        delayMsBefore: 500,
        content:
          "Patient replied to outbound INR overdue MyChart template (sent 4/24). Patient states Dr. H (Reynolds) discontinued warfarin and INR monitoring.\n\nChart state at time of message:\n  - Med list: warfarin 6mg daily ACTIVE\n  - Last provider note: 4/21/2026 — no documentation of discontinuation\n  - Last INR: 4/19, therapeutic\n  - Coumadin Clinic still scheduled\n\nForwarded to Reynolds for verification before any patient-facing reply. No MyChart message drafted. No order changes.",
      },
      { type: "banner", kind: "red", text: "Forwarded to Reynolds — awaiting provider confirmation", durationMs: 1200, delayMsBefore: 300 },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote:
      "Patient replied to outbound INR overdue MyChart template (4/24). Patient states Dr. H discontinued warfarin + INR monitoring. CHART CONTRADICTION: med list still shows active warfarin, no recent provider note documenting discontinuation. Forwarded to Reynolds for verification — NO autonomous action.",
    mychartMessage: "[Held until provider confirms]",
    orders: [],
    dxAssociated: [],
  },
};

export default fixture;
