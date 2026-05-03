// Pattern 5 — SYNTHESIS + HANDOFF (device nurse handoff — skeleton)
// Source: docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md Pattern 5

const fixture = {
  id: "frazier-handoff",
  slug: "frazier-handoff",
  patternId: 5,
  patternName: "SYNTHESIS WITH OPERATIONAL HANDOFF",
  tab: "resultsfu",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "active",
  receivedAt: "2026-04-28T15:18:00Z",
  card: {
    subject: "BNP + Heart Logic Index — repeat in 1 week, forward device nurse",
    kicker: "RESULTS F/U · NOTIFY",
    severity: "amber",
  },
  patient: {
    name: "Coleman, Frank",
    displayName: "Frank Coleman",
    age: 81,
    sex: "M",
    dob: "1944-09-12",
    mrn: "39127845",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-28 10:18",
    body:
      "BNP 538 mild elevation. Elevated Heart Logic Index. Repeat BNP next draw May 2026, repeat Heart Logic Index in 1 week. Patient asymptomatic per most recent contact. Forward Heart Logic follow-up to device nurse Nicole.",
  },
  // v3.0 — conditional panel declaration. Auto-inferred from
  // actionScripts / finalSignedState; override here if needed.
  panels: ["rnNote", "myChart", "orderPad"],
  panelContent: {
    orderPad: {
      orders: [
        {
          type: "Lab — future draw",
          codeVariant: "BNP — Brain Natriuretic Peptide",
          reason: "Trend monitoring for HFrEF",
          associatedDx: ["Heart failure, reduced ejection fraction (I50.21)"],
          priority: "Routine",
          status: "Scheduled for May 2026 draw",
        },
        {
          type: "Device monitoring — handoff",
          codeVariant: "Heart Logic Index follow-up",
          reason: "Trend monitoring via ICD/CRT-D",
          associatedDx: ["ICD/CRT-D in situ"],
          priority: "Routine",
          status: "Forwarded to device nurse for 1-week recheck",
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
      "BNP lab order entered for next draw, May 2026. Heart Logic index forwarded to device nurse Nicole for repeat in 1 week. Patient notified via MyChart (device nurse kept generic).",
    mychartMessage:
      "Mr. Coleman,\n\nYour recent BNP came back at 538, which is mildly elevated for you, and your device sent over an elevated Heart Logic Index reading. Neither value is alarming on its own — and you've been feeling fine — but the two readings together are worth keeping a close eye on.\n\nWhat we're doing:\n- Your provider has scheduled a repeat BNP at your next routine draw in May, so we can see if the number is trending up, down, or steady\n- Our device nurse, Maria Santos, will check your Heart Logic readings again in 1 week and reach out if anything stands out\n\nWhat to do:\n- Continue all your current medications exactly as prescribed\n- Keep your usual activity level — no need to slow down based on these numbers\n- Plan to come in for the May lab draw on schedule\n\nWhat to watch for: New or worsening shortness of breath (especially with activities that didn't bother you before), swelling in your ankles or legs, weight gain of more than 3 pounds in a week, new fatigue, or feeling like you can't sleep flat. If any of those happen, call the clinic the same day. For severe shortness of breath or chest pain, call 911.\n\nReply here or call the clinic with any questions.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
    orders: ["BNP — Future May draw", "Heart Logic Index follow-up — device nurse"],
    dxAssociated: ["HFrEF", "ICD/CRT-D"],
  },
};

export default fixture;
