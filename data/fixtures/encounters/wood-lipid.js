// Pattern 1 — SYNTHESIS only (PROMOTED from skeleton for tour mode)
// Source: docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md Pattern 1 (Henderson lipid panel)

const fixture = {
  id: "wood-lipid",
  slug: "wood-lipid",
  patternId: 1,
  patternName: "SYNTHESIS only",
  tab: "resultsfu",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "active",
  receivedAt: "2026-04-28T14:32:00Z",
  card: {
    subject: "Lipid panel — LDL at goal, HDL low, TG high",
    kicker: "RESULTS F/U · NOTIFY",
    severity: "green",
  },
  patient: {
    name: "Henderson, Carol",
    displayName: "Carol Henderson",
    age: 70,
    sex: "F",
    dob: "1955-12-03",
    mrn: "10381274",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-28 09:32",
    body:
      "Lipid panel: LDL 67 (at goal), HDL 41 (slightly below goal), triglycerides 182 (slightly above goal), total 139 (at goal). No medication change. Lifestyle counseling for HDL/triglyceride pattern (exercise, diet, alcohol moderation).",
  },
  // v3.0 — conditional panel declaration. Auto-inferred from
  // actionScripts / finalSignedState; override here if needed.
  panels: ["rnNote", "myChart"],
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false },
  },
  actionScripts: {
    "generate-note-mychart": [
      { type: "state-transition", target: "card", newState: "drafting", delayMsBefore: 100 },
      { type: "banner", kind: "green", text: "Pulling chart context — lipid trend, current statin regimen…", durationMs: 800 },
      {
        type: "pane-update",
        target: "nurse-name",
        mode: "instant",
        delayMsBefore: 0,
        content: "",
      },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 500,
        content:
          "Dr. Pendrelle reviewed lipid panel today. LDL 67 (at goal), HDL 41 (slightly below goal), triglycerides 182 (slightly above goal), total cholesterol 139 (at goal). No medication change. Continue current statin. Lifestyle counseling provided in patient message.\n\nPatient notified via MyChart.",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Ms Henderson,\n\nDr. Pendrelle has reviewed your recent cholesterol panel:\n\n  • LDL (bad cholesterol) 67 — at goal\n  • HDL (good cholesterol) 41 — slightly below where we'd like\n  • Triglycerides (a type of fat in the blood) 182 — slightly above\n  • Total cholesterol 139 — at goal\n\nNo medication change is needed. Continue your current statin as prescribed.\n\nA few small things tend to help the HDL and triglyceride pattern: 30 minutes of brisk walking most days of the week, swapping refined carbs for whole grains and lean protein, and keeping alcohol to one drink or fewer per day. None of this is urgent — these are low-and-slow improvements over months, not weeks.\n\nWe'll recheck at your next routine visit. Reach out if anything changes.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
      },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote: "[As drafted above]",
    mychartMessage: "[As drafted above]",
    orders: [],
    dxAssociated: ["Hyperlipidemia"],
  },
};

export default fixture;
