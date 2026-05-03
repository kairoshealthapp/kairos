// Pattern 7b — ASYNC PRE-CALL STRUCTURED INQUIRY (calm tier — skeleton)
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 19 (Sharp/Park)

const fixture = {
  id: "quelthorne-async",
  slug: "quelthorne-async",
  patternId: "7b",
  patternName: "ASYNC PRE-CALL STRUCTURED INQUIRY (calm tier)",
  tab: "patientadvice",
  urgency: "calm",
  sourceChannel: "mychart",
  sourceBox: "results-followup",
  mychartStatus: "active",
  receivedAt: "2026-04-29T14:48:00Z",
  card: {
    subject: "BNP drift monitoring — provider questions for patient",
    kicker: "ASYNC PRE-CALL · TRIAGE",
    severity: "green",
  },
  patient: {
    name: "Park, Gerald",
    displayName: "Gerald Park",
    age: 76,
    sex: "M",
    dob: "1949-11-08",
    mrn: "26819073",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "Result Note + provider clinical questions",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-29 09:48",
    body:
      "BNP drifting up over last 3 months. Asymptomatic per last visit. Send patient short MyChart inquiry: how is breathing, swelling, weight? If any concerning answer, escalate to URGENT phone callback with full HF triage.",
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
  actionScripts: {},
  finalSignedState: {
    nurseNote: "BNP drift detected. Sent 3-question MyChart inquiry. Will reclassify card based on patient reply.",
    mychartMessage:
      "Hi,\n\nYour provider asked me to check in. Your most recent BNP blood test (a marker we use to track heart-failure trends) has been creeping up over the last 3 months. You felt fine at your last visit and there's nothing in your chart suggesting an urgent problem — but a slow upward drift is the kind of pattern we want to catch early, before symptoms show up.\n\nA few quick questions, please reply when you have a moment:\n  1. How is your breathing on your usual walks — same as before, or is anything more difficult?\n  2. Have you noticed any new swelling in your legs or ankles, especially at the end of the day?\n  3. Any weight gain over the last week (more than 2-3 pounds)?\n  4. Are you sleeping flat at night, or have you been propping yourself up with pillows to breathe more easily?\n  5. Any new fatigue or feeling more winded than usual?\n\nWhat to do for now:\n- Continue all your current medications as prescribed\n- Reply to this message with your answers — no wrong answers, and you can reply to one or all of them\n- A nurse will review your responses within one business day and follow up if anything needs attention\n\nWhat to watch for: If you have severe shortness of breath, can't sleep flat at all, sudden weight gain of 5+ pounds, or chest pain — don't wait for a reply, call the clinic right away or 911 for severe symptoms.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
    orders: [],
    dxAssociated: ["Heart failure, unspecified"],
  },
};

export default fixture;
