// Pattern 12 — SCOPE-CONSTRAINED PATIENT QUESTION (skeleton)
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 23+24 (Reiner-redux/Quennell)
// Note: same patient as reiner-multilab — follow-up on the H&H elevation.

const fixture = {
  id: "quennell-scope",
  slug: "quennell-scope",
  patternId: 12,
  patternName: "SCOPE-CONSTRAINED PATIENT QUESTION",
  tab: "advice",
  urgency: "calm",
  sourceChannel: "mychart",
  sourceBox: "pt-advice",
  mychartStatus: "active",
  receivedAt: "2026-04-29T15:44:00Z",
  card: {
    subject: "Vague follow-up: \"Could this cause low blood pressure?\"",
    kicker: "ADVICE · SCOPE",
    severity: "green",
  },
  patient: {
    name: "Quennell, Cordelia",
    displayName: "Cordelia Quennell",
    age: 64,
    sex: "F",
    dob: "1962-09-10",
    mrn: "55738201",
    proxyName: null,
    primary: "Beckweldon NP, Heart and Vascular Clinic",
    coverage: "BCBS PPO",
  },
  sourceArtifact: {
    type: "MyChart Reply (vague reference; clarification round-trip)",
    author: "Patient",
    timestamp: "2026-04-29 10:44",
    body:
      "Original message: \"Could this cause low blood pressure?\"\n\nClarification (after nurse asked what \"this\" referred to): \"I meant the elevated H&H you mentioned in your message about my labs from earlier. Sorry I wasn't clear.\"",
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
      "Vague-reference classifier triggered clarification subroutine; patient confirmed reference is to H&H elevation. Scope-respecting answer drafted: cardiology RN scope is the cardiology workup, not interpreting hematologic effects on BP. Reply directs patient to bring this question to the hematology referral visit.",
    mychartMessage:
      "Thanks for clarifying — that question is best answered by hematology, who Dr. Beckweldon referred you to.",
    orders: [],
    dxAssociated: [],
  },
};

export default fixture;
