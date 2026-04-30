// Pattern 8 — CONTRADICTION (skeleton)
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 1 Surface 4 (Sturges/Maundrell)

const fixture = {
  id: "maundrell-contradiction",
  slug: "maundrell-contradiction",
  patternId: 8,
  patternName: "CONTRADICTION",
  tab: "advice",
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
  actionScripts: {},
  finalSignedState: {
    nurseNote:
      "Patient replied to outbound INR overdue MyChart template (4/24). Patient states Dr. M discontinued warfarin + INR monitoring. CHART CONTRADICTION: med list still shows active warfarin, no recent provider note documenting discontinuation. Forwarded to Skarsdale for verification — NO autonomous action.",
    mychartMessage: "[Held until provider confirms]",
    orders: [],
    dxAssociated: [],
  },
};

export default fixture;
