// Pattern 12 — SCOPE-CONSTRAINED PATIENT QUESTION
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 23+24 (Reiner-redux/Skarsgård)
// Vague reference → clarification subroutine → scope-respecting reply.
// Same patient as reiner-multilab — follow-up on the H&H elevation.

const fixture = {
  id: "quennell-scope",
  slug: "quennell-scope",
  patternId: 12,
  patternName: "SCOPE-CONSTRAINED PATIENT QUESTION",
  tab: "resultsfu",
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
    name: "Skarsgård, Coralie",
    displayName: "Coralie Skarsgård",
    age: 64,
    sex: "F",
    dob: "1962-09-10",
    mrn: "55738201",
    proxyName: null,
    primary: "Voronova NP, Heart and Vascular Clinic",
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
  actionScripts: {
    "generate-scope-respecting-reply": [
      { type: "state-transition", target: "card", newState: "drafting", delayMsBefore: 100 },
      { type: "banner", kind: "green", text: "Vague reference resolved → H&H elevation. Scope check: cardiology RN vs hematology…", durationMs: 1000 },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 500,
        content:
          "Vague-reference classifier triggered clarification subroutine yesterday; patient confirmed reference is to H&H elevation noted in 4/27 multi-lab Result Note. Scope-of-practice rail flagged: cardiology RN scope is the cardiology workup, not interpreting hematologic effects on BP.\n\nReply drafted in scope: directs patient to bring this question to the hematology referral visit Dr. Voronova placed 4/27. No autonomous interpretation of H&H ↔ BP relationship.",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Ms Skarsgård,\n\nThanks for clarifying — that's a great question, and the best person to answer it is the hematology team Dr. Voronova referred you to on 4/27. They'll have the full picture of why the H&H is elevated and what it means for things like blood pressure.\n\nIf you haven't heard from their scheduling team in the next few days, let us know and we'll follow up on the referral.\n\nBrandon Sterne, RN BSN / Heart and Vascular Clinic",
      },
      { type: "banner", kind: "green", text: "Scope-respecting reply drafted — no out-of-scope interpretation", durationMs: 1000, delayMsBefore: 200 },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote:
      "Vague-reference classifier triggered clarification subroutine; patient confirmed reference is to H&H elevation. Scope-respecting answer drafted: cardiology RN scope is the cardiology workup, not interpreting hematologic effects on BP. Reply directs patient to bring this question to the hematology referral visit.",
    mychartMessage: "[As drafted above]",
    orders: [],
    dxAssociated: [],
  },
};

export default fixture;
