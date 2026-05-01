// Pattern 7 — URGENT (skeleton)
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 5 CASE 5 (Walter/Ramirez)

const fixture = {
  id: "esselbach-urgent",
  slug: "esselbach-urgent",
  patternId: 7,
  patternName: "URGENT",
  tab: "resultsfu",
  urgency: "high",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "pending",
  receivedAt: "2026-04-29T11:48:00Z",
  card: {
    subject: "BNP 1024 — pre-op surgery 5/14, call patient",
    kicker: "URGENT · NOTIFY",
    severity: "red",
  },
  patient: {
    name: "Ramirez, Dorothy",
    displayName: "Dorothy Ramirez",
    age: 87,
    sex: "F",
    dob: "1939-11-30",
    mrn: "29483017",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-29 06:48",
    body:
      "BNP 1024 today, significantly elevated from baseline. Patient is scheduled for elective surgery 5/14. Please call patient to assess for symptoms (SOB, weight gain, edema, orthopnea), confirm current diuretic dose, and discuss whether pre-op cardiology clearance needs revisiting. MyChart status Pending — phone call only.",
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
      "URGENT — BNP 1024 elevated. Pre-op surgery 5/14. Phone call to assess HF symptoms, diuretic compliance, pre-op clearance. MyChart Pending.",
    phoneScript:
      "Mrs. Ramirez, this is Brandon from the Cardiology Associates. Dr. Pendrelle reviewed a recent lab and wants me to check in with you before your May 14th surgery…",
    orders: [],
    dxAssociated: ["Heart failure, unspecified"],
  },
};

export default fixture;
