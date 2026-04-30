// Pattern 1 — SYNTHESIS only (skeleton; BNP normal, no change)
// Source: docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md Pattern 1 (Besemer)

const fixture = {
  id: "besemer-bnp",
  slug: "besemer-bnp",
  patternId: 1,
  patternName: "SYNTHESIS only",
  tab: "notify",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "active",
  receivedAt: "2026-04-28T13:48:00Z",
  card: {
    subject: "BNP 386 — normal, no change",
    kicker: "RESULTS F/U · NOTIFY",
    severity: "green",
  },
  patient: {
    name: "Besemer, Octavian",
    displayName: "Octavian Besemer",
    age: 68,
    sex: "M",
    dob: "1958-08-19",
    mrn: "44512983",
    proxyName: null,
    primary: "Loxley NP, Heart and Vascular Clinic",
    coverage: "Medicare A+B + United supplement",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Loxley, Cardiology",
    timestamp: "2026-04-28 08:48",
    body:
      "BNP 386 today, in patient's typical range. No change in treatment. Doppler + cardiac MRI pending — no medication adjustment until those return.",
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
      "Dr. Loxley reviewed BNP 386, in patient's typical range. No medication change. Doppler + cardiac MRI pending.",
    mychartMessage:
      "Your BNP came back at 386, which is your usual range. No medication changes. Your scheduled Doppler and cardiac MRI are still pending.",
    orders: [],
    dxAssociated: ["Heart failure, stable"],
  },
};

export default fixture;
