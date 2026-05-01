// Pattern 1 — SYNTHESIS only (skeleton; BP log review, no change)
// Source: docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md Pattern 1 (Russo)

const fixture = {
  id: "czeschin-bp",
  slug: "czeschin-bp",
  patternId: 1,
  patternName: "SYNTHESIS only",
  tab: "resultsfu",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "active",
  receivedAt: "2026-04-28T14:01:00Z",
  card: {
    subject: "BP log review — at goal, no change",
    kicker: "RESULTS F/U · NOTIFY",
    severity: "green",
  },
  patient: {
    name: "Russo, Thomas",
    displayName: "Thomas Russo",
    age: 73,
    sex: "M",
    dob: "1953-03-21",
    mrn: "60417239",
    proxyName: null,
    primary: "Davis NP, Cardiology Associates",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Davis, Cardiology",
    timestamp: "2026-04-28 09:01",
    body:
      "Home BP log reviewed: avg SBP 128, DBP 78 over 14 days on losartan 50mg + amlodipine 5mg. HR 62-72. Good control, no change. Ensure continued lab follow-up at 6-month visit.",
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
      "Dr. Davis reviewed home BP log over 14 days. Average 128/78, HR 62-72 on losartan 50mg + amlodipine 5mg. Good control, no medication change. Continue current regimen.",
    mychartMessage:
      "Your home blood pressure readings look good — averaging 128 over 78. Continue your current losartan and amlodipine.",
    orders: [],
    dxAssociated: ["Essential hypertension"],
  },
};

export default fixture;
