// Pattern 9 — TRANSACTIONAL REPLY (skeleton)
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 1 Surface 4 (Forshey/Norreys)

const fixture = {
  id: "norreys-transactional",
  slug: "norreys-transactional",
  patternId: 9,
  patternName: "TRANSACTIONAL REPLY",
  tab: "advice",
  urgency: "calm",
  sourceChannel: "mychart",
  sourceBox: "pt-advice",
  mychartStatus: "active",
  receivedAt: "2026-04-29T14:11:00Z",
  card: {
    subject: "Refill confirmation: warfarin 6mg (after 6.5→6mg adjustment)",
    kicker: "ADVICE · TRANSACTIONAL",
    severity: "green",
  },
  patient: {
    name: "Norreys, Wendell",
    displayName: "Wendell Norreys",
    age: 65,
    sex: "M",
    dob: "1961-07-22",
    mrn: "47281065",
    proxyName: null,
    primary: "Skarsdale, Cardiology (Coumadin Clinic)",
    coverage: "United HMO",
  },
  sourceArtifact: {
    type: "MyChart Reply (re: warfarin dose decrease 6.5→6mg sent 4/21)",
    author: "Patient",
    timestamp: "2026-04-29 09:11",
    body: "\"Need refill 6mg warfrin\"",
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
      "Patient confirms new warfarin 6mg dose (decreased from 6.5mg on 4/21 for INR 3.9 hold). Refill placed. Encounter closed.",
    mychartMessage: "Got it — your warfarin 6 mg refill has been sent.",
    orders: ["Warfarin 6mg daily — refill 90 days"],
    dxAssociated: ["Atrial fibrillation"],
  },
};

export default fixture;
