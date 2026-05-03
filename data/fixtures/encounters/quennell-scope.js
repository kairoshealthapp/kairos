// Pattern 12 — SCOPE-CONSTRAINED PATIENT QUESTION
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 23+24 (Reiner-redux/Nguyen)
// Vague reference → clarification subroutine → scope-respecting reply.
// Same patient as reiner-multilab — follow-up on the H&H elevation.

const fixture = {
  id: "quennell-scope",
  slug: "quennell-scope",
  patternId: 12,
  patternName: "SCOPE-CONSTRAINED PATIENT QUESTION",
  // Pass D Phase 5 — Brandon's smoke-test: this card lives in PATIENT
  // ADVICE REQUEST, not Results F/U. The patient sent a MyChart message
  // asking about H+H and low blood pressure — a patient-advice query,
  // not a result followup.
  tab: "patientadvice",
  authorizeActions: ["Send MyChart Reply", "Done"],
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
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "BCBS PPO",
  },
  sourceArtifact: {
    type: "MyChart Reply (vague reference; clarification round-trip)",
    author: "Patient",
    timestamp: "2026-04-29 10:44",
    body:
      "Original message: \"Could this cause low blood pressure?\"\n\nClarification (after nurse asked what \"this\" referred to): \"I meant the elevated H&H you mentioned in your message about my labs from earlier. Sorry I wasn't clear.\"",
  },
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
          "Patient sent vague follow-up message yesterday (\"Could this cause low blood pressure?\"); on clarification, confirmed she was asking about the elevated H&H noted in her 4/27 multi-lab Result Note.\n\nThe relationship between elevated H&H and blood pressure regulation is a hematology question — outside cardiology RN scope. Replied to patient redirecting her to the hematology team Dr. Pendrelle referred her to on 4/27, who will be best positioned to answer. Offered to follow up if she hasn't heard from hematology scheduling in the next several days. No interpretation of H&H or BP provided.",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Ms. Nguyen,\n\nThanks for clarifying — that helps a lot. You're asking whether the slightly elevated H&H (the red-blood-cell count we discussed in your earlier message about your labs) could be causing low blood pressure.\n\nThe honest answer is: probably not directly. An elevated H&H usually means thicker blood, which would more often raise blood pressure than lower it. But there are several things that can cause low blood pressure, and the hematology team your provider referred you to on 4/27 will have the full picture of why the H&H is elevated and how it might fit with what you're feeling.\n\nWhat to do:\n- Continue your current medications as prescribed\n- Keep your hematology appointment when their scheduling team calls\n- Bring up the low blood pressure question at that visit — they're the right team to answer it in detail\n\nWhat to watch for: If you have severe dizziness on standing, fainting or near-fainting, chest pain, or shortness of breath, call the clinic right away (or 911 for severe symptoms). For mild light-headedness on standing, getting up slowly and drinking more water during the day usually helps until you can be evaluated.\n\nIf you haven't heard from hematology scheduling within a few more days, reply to this message and we'll follow up on the referral.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
      },
      { type: "banner", kind: "green", text: "Scope-respecting reply drafted — no out-of-scope interpretation", durationMs: 1000, delayMsBefore: 200 },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote:
      "Patient sent vague follow-up message; on clarification, confirmed she was asking about the elevated H&H noted in her 4/27 labs. The relationship between elevated H&H and blood pressure regulation is a hematology question — outside cardiology RN scope. Replied to patient redirecting her to the hematology team Dr. Pendrelle referred her to on 4/27. Offered to follow up if she hasn't heard from hematology scheduling. No interpretation of H&H or BP provided.",
    mychartMessage: "[As drafted above]",
    orders: [],
    dxAssociated: [],
  },
};

export default fixture;
