// Pattern 1 — SYNTHESIS only (skeleton; BNP normal, no change)
// Source: docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md Pattern 1 (Mitchell)

const fixture = {
  id: "besemer-bnp",
  slug: "besemer-bnp",
  patternId: 1,
  patternName: "SYNTHESIS only",
  tab: "resultsfu",
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
    name: "Mitchell, James",
    displayName: "James Mitchell",
    age: 68,
    sex: "M",
    dob: "1958-08-19",
    mrn: "44512983",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B + United supplement",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-28 08:48",
    body:
      "BNP 386 today, in patient's typical range. No change in treatment. Doppler + cardiac MRI pending — no medication adjustment until those return.",
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
      "Dr. Pendrelle reviewed BNP 386, in patient's typical range. No medication change. Doppler + cardiac MRI pending.",
    mychartMessage:
      "Mr. Mitchell,\n\nYour BNP blood test came back at 386. This is right in line with your usual range — nothing has changed compared to your previous values, which is good news.\n\nWhat to do: No medication changes. Continue all your current medications exactly as prescribed.\n\nWhat's next: Your Doppler ultrasound and cardiac MRI are still on the schedule. Once those results come back, your provider will look at the full picture (BNP + imaging) and decide if any adjustments are needed. We'll send you a separate message when those are reviewed.\n\nWhat to watch for in the meantime: New or worsening shortness of breath, swelling in your ankles or legs, weight gain of more than 3 pounds in a week, or feeling more tired than usual on your normal activities. If any of those happen, call the clinic — don't wait for the next appointment.\n\nReply here or call the clinic with any questions.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
    orders: [],
    dxAssociated: ["Heart failure, stable"],
  },
};

export default fixture;
