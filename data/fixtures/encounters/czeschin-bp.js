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
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-28 09:01",
    body:
      "Home BP log reviewed: avg SBP 128, DBP 78 over 14 days on losartan 50mg + amlodipine 5mg. HR 62-72. Good control, no change. Ensure continued lab follow-up at 6-month visit.",
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
    nurseNote:
      "Dr. Pendrelle reviewed home BP log over 14 days. Average 128/78, HR 62-72 on losartan 50mg + amlodipine 5mg. Good control, no medication change. Continue current regimen.",
    mychartMessage:
      "Mr. Russo,\n\nYour home blood pressure readings over the last two weeks look great — averaging 128/78 with a heart rate in the 60s and low 70s. That's right where we want you.\n\nWhat to do: No medication changes. Continue your losartan 50 mg and amlodipine 5 mg once daily, exactly as prescribed.\n\nWhat's next: Keep up the home BP log if it's not too much trouble — your readings help us catch trends early. We'll review your blood pressure again at your next routine 6-month visit, and we'll repeat your basic labs at that time.\n\nWhat to watch for: New or unusual symptoms — light-headedness on standing, swelling in your ankles, persistent headache, or readings consistently above 140/90 or below 100/60 for several days in a row. If any of those come up, reply to this message or call the clinic.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
    orders: [],
    dxAssociated: ["Essential hypertension"],
  },
};

export default fixture;
