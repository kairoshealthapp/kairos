// Pattern 5 — SYNTHESIS + CHOICE
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 5 CASE 2 (Daech/Yamashiro)
// Notable: simulates the phiGuard placeholder bug (Nexlizet → [Patient Name])
// then the corrected draft after the cross-output consistency banner fires.

const fixture = {
  id: "brexley-statin",
  slug: "brexley-statin",
  patternId: 5,
  patternName: "SYNTHESIS + CHOICE",
  tab: "resultsfu",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "active-recent",
  receivedAt: "2026-04-29T13:32:00Z",
  card: {
    subject: "Lipid panel — discuss combination statin alternative",
    kicker: "RESULTS F/U · NOTIFY",
    severity: "green",
  },
  patient: {
    name: "Yamashiro, Wynne",
    displayName: "Wynne Yamashiro",
    age: 63,
    sex: "F",
    dob: "1963-02-08",
    mrn: "55129770",
    proxyName: null,
    primary: "Voronova NP, Heart and Vascular Clinic",
    coverage: "Aetna PPO",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Voronova, Cardiology",
    timestamp: "2026-04-29 08:32",
    body:
      "Lipid panel today: LDL 138 on Zetia 10mg + atorvastatin 40mg (LDL goal <100). Two options: (A) increase atorvastatin to 80mg daily, continue Zetia; or (B) switch from Zetia + atorvastatin to a single combination tablet — Nexlizet (bempedoic acid 180mg / ezetimibe 10mg) once daily. Ask patient preference.",
  },
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  actionScripts: {
    "generate-note-mychart": [
      { type: "state-transition", target: "card", newState: "drafting", delayMsBefore: 100 },
      { type: "banner", kind: "green", text: "Drafting nurse note + MyChart message…", durationMs: 700 },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 500,
        content:
          "Dr. Voronova reviewed lipid panel: LDL 138 on Zetia 10mg + atorvastatin 40mg, above goal of <100. Two options offered:\n  Option A — increase atorvastatin to 80mg daily, continue Zetia.\n  Option B — switch Zetia + atorvastatin to Nexlizet (bempedoic acid 180mg / ezetimibe 10mg) once daily.\n\nAwaiting patient preference via MyChart reply.",
      },
      // FIRST DRAFT — phiGuard misfires on the brand name "Nexlizet"
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Ms Yamashiro,\n\nDr. Voronova has reviewed your recent lipid panel. Your LDL (bad cholesterol) is 138, still above your goal of less than 100.\n\nThere are two options, and Dr. Voronova would like your input:\n\n1. Increase your atorvastatin from 40 mg to 80 mg once daily and continue Zetia.\n\n2. Switch your Zetia and atorvastatin to a combination medication called [Patient Name] (180/10 mg daily). This consolidates two pills into one.\n\nPlease reply with your preference.\n\nBrandon Sterne, RN BSN / Heart and Vascular Clinic",
      },
      // CONSISTENCY CHECK CATCHES THE LEAK
      {
        type: "banner",
        kind: "red",
        text: "PHI placeholder leak detected — phiGuard misfired on brand name. Regenerating with RxNorm cross-reference.",
        durationMs: 2200,
        delayMsBefore: 600,
      },
      // CORRECTED DRAFT
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 85,
        delayMsBefore: 800,
        content:
          "Ms Yamashiro,\n\nDr. Voronova has reviewed your recent lipid panel. Your LDL (bad cholesterol) is 138, still above your goal of less than 100 even with your current Zetia plus atorvastatin combination.\n\nThere are two reasonable options, and Dr. Voronova would like your input:\n\n1. Increase your atorvastatin from 40 mg to 80 mg once daily and continue Zetia.\n\n2. Switch your Zetia and atorvastatin to a combination medication called Nexlizet (180/10 mg daily). This consolidates two pills into one, and bempedoic acid does not affect muscles the way some statins can.\n\nPlease reply with your preference and we will set it up. Either option is reasonable.\n\nBrandon Sterne, RN BSN / Heart and Vascular Clinic",
      },
      { type: "banner", kind: "green", text: "Cross-output consistency: drug names + doses match across both panes.", durationMs: 1500, delayMsBefore: 300 },
      {
        type: "pane-update",
        target: "order-pad",
        mode: "instant",
        delayMsBefore: 300,
        content: {
          orders: [
            {
              type: "Atorvastatin 80mg daily — staged Option A",
              reason: "uptitration option pending patient choice",
              associatedDx: ["Other hyperlipidemia"],
              priority: "Routine",
              class: "Medication change",
              status: "Pended (Option A)",
              clinicalQuestions: [],
              cosign: "Voronova",
              choiceGroup: "lipid-uptitrate",
            },
            {
              type: "Nexlizet 180/10mg daily — staged Option B",
              reason: "combination switch option pending patient choice",
              associatedDx: ["Other hyperlipidemia"],
              priority: "Routine",
              class: "Medication change",
              status: "Pended (Option B)",
              clinicalQuestions: [],
              cosign: "Voronova",
              choiceGroup: "lipid-uptitrate",
            },
          ],
          hasUnansweredQuestions: false,
        },
      },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote: "[As drafted above]",
    mychartMessage: "[As drafted — corrected version after phiGuard regen]",
    orders: ["Atorvastatin 80mg — Pended Option A", "Nexlizet 180/10mg — Pended Option B"],
    dxAssociated: ["Other hyperlipidemia"],
  },
};

export default fixture;
