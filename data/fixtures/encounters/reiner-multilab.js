// Pattern 2 — SYNTHESIS + NEW ORDER (skeleton; multi-lab consolidation)
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 17 (Reiner/Quennell)

const fixture = {
  id: "reiner-multilab",
  slug: "reiner-multilab",
  patternId: 2,
  patternName: "SYNTHESIS + NEW ORDER (multi-lab consolidation)",
  tab: "notify",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "active",
  receivedAt: "2026-04-29T15:08:00Z",
  card: {
    subject: "Multi-lab Result Note: Chem-8, Magnesium, H&H — hematology referral",
    kicker: "RESULTS F/U · NOTIFY",
    severity: "amber",
  },
  patient: {
    name: "Quennell, Cordelia",
    displayName: "Cordelia Quennell",
    age: 64,
    sex: "F",
    dob: "1962-09-10",
    mrn: "55738201",
    proxyName: null,
    primary: "Loxley NP, Heart and Vascular Clinic",
    coverage: "BCBS PPO",
  },
  sourceArtifact: {
    type: "Result Note (3 sub-notes batched)",
    author: "Loxley, Cardiology",
    timestamp: "2026-04-29 10:08",
    body:
      "Three sub-notes:\n  1. Chem-8 unremarkable.\n  2. Magnesium 1.6 (low). Recommend OTC Mg supplement.\n  3. H&H mildly elevated, similar to elevation noted 7/2025. Refer to hematology.",
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
      "Dr. Loxley reviewed Chem-8 (unremarkable), Magnesium 1.6 (low — start OTC supplement), H&H mildly elevated (similar to 7/2025) — refer to hematology. Patient notified via MyChart.",
    mychartMessage:
      "Three labs reviewed — basic chemistry normal, magnesium slightly low (over-the-counter supplement recommended), and a count slightly elevated that we want hematology to take a look at.",
    orders: ["Hematology referral", "Mg supplement OTC counseling note"],
    dxAssociated: ["Polycythemia, unspecified", "Hypomagnesemia"],
  },
};

export default fixture;
