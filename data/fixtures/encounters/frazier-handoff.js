// Pattern 5 — SYNTHESIS + HANDOFF (device nurse handoff — skeleton)
// Source: docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md Pattern 5

const fixture = {
  id: "frazier-handoff",
  slug: "frazier-handoff",
  patternId: 5,
  patternName: "SYNTHESIS WITH OPERATIONAL HANDOFF",
  tab: "resultsfu",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "active",
  receivedAt: "2026-04-28T15:18:00Z",
  card: {
    subject: "BNP + Heart Logic Index — repeat in 1 week, forward device nurse",
    kicker: "RESULTS F/U · NOTIFY",
    severity: "amber",
  },
  patient: {
    name: "Coleman, Frank",
    displayName: "Frank Coleman",
    age: 81,
    sex: "M",
    dob: "1944-09-12",
    mrn: "39127845",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-28 10:18",
    body:
      "BNP 538 mild elevation. Elevated Heart Logic Index. Repeat BNP next draw May 2026, repeat Heart Logic Index in 1 week. Patient asymptomatic per most recent contact. Forward Heart Logic follow-up to device nurse Nicole.",
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
      "BNP lab order entered for next draw, May 2026. Heart Logic index forwarded to device nurse Nicole for repeat in 1 week. Patient notified via MyChart (device nurse kept generic).",
    mychartMessage:
      "Dr. Pendrelle reviewed your recent BNP and the Heart Logic reading from your device. Both will be rechecked — BNP at your next draw in May, and the Heart Logic in 1 week by our device nurse.",
    orders: ["BNP — Future May draw", "Heart Logic Index follow-up — device nurse"],
    dxAssociated: ["HFrEF", "ICD/CRT-D"],
  },
};

export default fixture;
