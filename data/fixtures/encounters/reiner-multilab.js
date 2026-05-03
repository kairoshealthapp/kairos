// Pattern 2 — SYNTHESIS + NEW ORDER (skeleton; multi-lab consolidation)
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 17 (originally Reiner; renamed to Wallace)

const fixture = {
  id: "reiner-multilab",
  slug: "reiner-multilab",
  patternId: 2,
  patternName: "SYNTHESIS + NEW ORDER (multi-lab consolidation)",
  tab: "resultsfu",
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
    name: "Wallace, Sandra",
    displayName: "Sandra Wallace",
    age: 64,
    sex: "F",
    dob: "1962-09-10",
    mrn: "55738201",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "BCBS PPO",
  },
  sourceArtifact: {
    type: "Result Note (3 sub-notes batched)",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-29 10:08",
    body:
      "Three sub-notes:\n  1. Chem-8 unremarkable.\n  2. Magnesium 1.6 (low). Recommend OTC Mg supplement.\n  3. H&H mildly elevated, similar to elevation noted 7/2025. Refer to hematology.",
  },
  // v3.0 — conditional panel declaration. Auto-inferred from
  // actionScripts / finalSignedState; override here if needed.
  panels: ["rnNote", "myChart", "orderPad"],
  panelContent: {
    orderPad: {
      orders: [
        {
          type: "Referral",
          codeVariant: "Hematology — outpatient consult",
          reason: "H&H mildly elevated, similar to 7/2025 — evaluate for polycythemia",
          associatedDx: ["Polycythemia, unspecified (D75.1)"],
          priority: "Routine",
          status: "Pending coordinator scheduling",
        },
        {
          type: "Patient education / OTC counseling",
          codeVariant: "Magnesium oxide 400mg PO daily (OTC)",
          reason: "Magnesium 1.6 — mild hypomagnesemia",
          associatedDx: ["Hypomagnesemia (E83.42)"],
          priority: "Routine",
          status: "Patient-purchased OTC; counseling note documented",
        },
        {
          type: "Lab — repeat",
          codeVariant: "Basic Metabolic Panel + Magnesium",
          reason: "Recheck after 30 days of supplementation",
          associatedDx: ["Hypomagnesemia (E83.42)"],
          priority: "Routine",
          status: "Recheck in 30 days",
        },
      ],
      hasUnansweredQuestions: false,
    },
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
      "Dr. Pendrelle reviewed Chem-8 (unremarkable), Magnesium 1.6 (low — start OTC supplement), H&H mildly elevated (similar to 7/2025) — refer to hematology. Hematology referral placed. Patient notified via MyChart with OTC supplement guidance + repeat lab plan.",
    mychartMessage:
      "Mrs. Wallace,\n\nYour recent lab results are in. Three things to share:\n\n1. Basic chemistry (sodium, potassium, kidney function): all normal.\n\n2. Magnesium: 1.6, which is just below the normal range. This is mild and is usually corrected with an over-the-counter supplement. Please pick up Magnesium oxide 400 mg at any pharmacy and take one tablet daily with food. We'll recheck this lab in about 30 days to make sure it's coming up.\n\n3. Red-blood-cell count: slightly elevated, similar to what we saw in July 2025. We'd like a hematology specialist to take a look. Your provider has placed the referral and the hematology office will call you to schedule.\n\nWhat to do:\n- Pick up Magnesium oxide 400 mg (OTC) and start it tomorrow\n- Watch for the hematology office to call within the next week or two\n- We'll send you a reminder when it's time for the repeat magnesium check\n\nWhat to watch for: Magnesium supplements can sometimes loosen the stool the first few days. If that happens, you can take it every other day instead. If you don't hear from hematology within 2 weeks, let us know.\n\nReply here or call the clinic with any questions.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
    orders: ["Hematology referral", "Mg supplement OTC counseling", "Repeat BMP + Mg in 30 days"],
    dxAssociated: ["Polycythemia, unspecified", "Hypomagnesemia"],
  },
};

export default fixture;
