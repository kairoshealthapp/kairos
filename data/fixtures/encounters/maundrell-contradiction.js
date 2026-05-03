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
  authorizeActions: ["Send MyChart Reply", "Done"],
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
  // v3.0 — conditional panel declaration. Auto-inferred from
  // actionScripts / finalSignedState; override here if needed.
  panels: ["rnNote", "myChart"],
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
          "Patient replied to outbound INR overdue MyChart template (sent 4/24). Patient states Dr. H (Reynolds) discontinued warfarin and INR monitoring.\n\nChart review: Last provider note (Dr. Reynolds, 4/21/2026) states \"Continue warfarin 6mg daily, therapeutic on current dose.\" No discontinuation order found. Warfarin 6mg daily remains ACTIVE on medication list.\n\nPatient statement contradicts chart. Forwarded to Dr. Reynolds for verification before any patient-facing reply. No MyChart message drafted. No order changes.",
      },
      { type: "banner", kind: "red", text: "Forwarded to Reynolds — awaiting provider confirmation", durationMs: 1200, delayMsBefore: 300 },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote:
      "Patient replied to outbound INR overdue MyChart template (sent 4/24). Patient states Dr. H (Reynolds) discontinued warfarin and INR monitoring.\n\nChart review: Last provider note (Dr. Reynolds, 4/21/2026) states \"Continue warfarin 6mg daily, therapeutic on current dose.\" No discontinuation order found. Warfarin 6mg daily remains ACTIVE on medication list.\n\nPatient statement contradicts chart. AI flagged contradiction; nurse to decide whether to reply directly (chart is clear) or forward to Dr. Reynolds for verification.",
    mychartMessage:
      "Mr. Foster,\n\nThank you for your message. We checked your chart and your current medication list shows warfarin 6mg daily as an active prescription. Your most recent provider visit on 4/21/2026 confirmed you should continue taking warfarin as prescribed.\n\nIf Dr. Reynolds made a change to your medications that hasn't been updated in our system yet, we'll look into that and follow up with you. In the meantime, please continue taking your warfarin as directed unless you hear otherwise from us directly.\n\nIf you have any questions, reply to this message or call the clinic.\n\nBrandon Sterne, RN BSN / Lakeside Cardiology Associates",
    orders: [],
    dxAssociated: [],
  },
};

export default fixture;
