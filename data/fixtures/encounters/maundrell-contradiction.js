// Pattern 8 — CONTRADICTION
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 1 Surface 4 (Sturges/Maundrell)
// Patient statement contradicts active chart — clinical safety hold; forward to provider; NO autonomous reply.

const fixture = {
  id: "maundrell-contradiction",
  slug: "maundrell-contradiction",
  patternId: 8,
  patternName: "CONTRADICTION",
  tab: "inr",
  urgency: "calm",
  sourceChannel: "mychart",
  sourceBox: "pt-advice",
  mychartStatus: "active",
  receivedAt: "2026-04-29T13:52:00Z",
  card: {
    subject: "Pt Advice: \"Dr. M told me to stop warfarin\" — chart shows active",
    kicker: "ADVICE · CONTRADICTION",
    severity: "red",
  },
  patient: {
    name: "Maundrell, Reginald",
    displayName: "Reginald Maundrell",
    age: 74,
    sex: "M",
    dob: "1951-12-04",
    mrn: "82110649",
    proxyName: null,
    primary: "Skarsdale, Cardiology (Coumadin Clinic)",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "MyChart Reply (re: outbound INR overdue template 4/24)",
    author: "Patient",
    timestamp: "2026-04-29 08:52",
    body:
      "\"Dr. M told me to be taking only the other two medications and also said I don't have to take the blood test anymore.\"",
  },
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
          "CHART CONTRADICTION FLAG — DO NOT REPLY AUTONOMOUSLY.\n\nPatient replied to outbound INR overdue MyChart template (sent 4/24). Patient states Dr. M (Skarsdale) discontinued warfarin and INR monitoring.\n\nChart state at time of message:\n  - Med list: warfarin 6mg daily ACTIVE\n  - Last provider note: 4/21/2026 — no documentation of discontinuation\n  - Last INR: 4/19, therapeutic\n  - Coumadin Clinic still scheduled\n\nForwarded to Skarsdale for verification before any patient-facing reply. No MyChart message drafted. No order changes.",
      },
      { type: "banner", kind: "red", text: "Forwarded to Skarsdale — awaiting provider confirmation", durationMs: 1200, delayMsBefore: 300 },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote:
      "Patient replied to outbound INR overdue MyChart template (4/24). Patient states Dr. M discontinued warfarin + INR monitoring. CHART CONTRADICTION: med list still shows active warfarin, no recent provider note documenting discontinuation. Forwarded to Skarsdale for verification — NO autonomous action.",
    mychartMessage: "[Held until provider confirms]",
    orders: [],
    dxAssociated: [],
  },
};

export default fixture;
