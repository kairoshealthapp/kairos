// Pattern 12 — SCOPE-CONSTRAINED PATIENT QUESTION
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 23+24 (Reiner-redux/Nguyen)
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
    name: "Nguyen, Karen",
    displayName: "Karen Nguyen",
    age: 64,
    sex: "F",
    dob: "1962-09-10",
    mrn: "55738201",
    proxyName: null,
    primary: "Davis NP, Cardiology Associates",
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
          "Patient sent vague follow-up message yesterday (\"Could this cause low blood pressure?\"); on clarification, confirmed she was asking about the elevated H&H noted in her 4/27 multi-lab Result Note.\n\nThe relationship between elevated H&H and blood pressure regulation is a hematology question — outside cardiology RN scope. Replied to patient redirecting her to the hematology team Dr. Davis referred her to on 4/27, who will be best positioned to answer. Offered to follow up if she hasn't heard from hematology scheduling in the next several days. No interpretation of H&H or BP provided.",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Ms Nguyen,\n\nThanks for clarifying — that's a great question, and the best person to answer it is the hematology team Dr. Davis referred you to on 4/27. They'll have the full picture of why the H&H is elevated and what it means for things like blood pressure.\n\nIf you haven't heard from their scheduling team in the next few days, let us know and we'll follow up on the referral.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
      },
      { type: "banner", kind: "green", text: "Scope-respecting reply drafted — no out-of-scope interpretation", durationMs: 1000, delayMsBefore: 200 },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote:
      "Patient sent vague follow-up message; on clarification, confirmed she was asking about the elevated H&H noted in her 4/27 labs. The relationship between elevated H&H and blood pressure regulation is a hematology question — outside cardiology RN scope. Replied to patient redirecting her to the hematology team Dr. Davis referred her to on 4/27. Offered to follow up if she hasn't heard from hematology scheduling. No interpretation of H&H or BP provided.",
    mychartMessage: "[As drafted above]",
    orders: [],
    dxAssociated: [],
  },
};

export default fixture;
