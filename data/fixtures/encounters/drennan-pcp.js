// Pattern 6 — SYNTHESIS + HANDOFF (skeleton, actionScripts not yet written)
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 5 CASE 4 (McGuirk/Drennan)

const fixture = {
  id: "drennan-pcp",
  slug: "drennan-pcp",
  patternId: 6,
  patternName: "SYNTHESIS + HANDOFF",
  tab: "notify",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "active-recent",
  receivedAt: "2026-04-29T13:01:00Z",
  card: {
    subject: "CTA abdomen — incidental pancreatic cyst → forward to PCP",
    kicker: "RESULTS F/U · NOTIFY",
    severity: "green",
  },
  patient: {
    name: "Drennan, Catriona",
    displayName: "Catriona Drennan",
    age: 28,
    sex: "F",
    dob: "1998-07-14",
    mrn: "60017802",
    proxyName: null,
    primary: "Loxley NP, Heart and Vascular Clinic",
    coverage: "BCBS HMO",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Loxley, Cardiology",
    timestamp: "2026-04-29 08:01",
    body:
      "CTA abdomen reviewed. Cardiac findings unremarkable. Incidental 1.4 cm simple-appearing pancreatic cyst noted; below standard threshold for cardiology workup. Please forward results to her PCP (Felicity Ashbrook MD) for further follow-up.",
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
      "Dr. Loxley reviewed CTA abdomen. Cardiac findings unremarkable. Incidental 1.4 cm pancreatic cyst — forwarded to PCP (Felicity Ashbrook MD). Patient notified via MyChart.",
    mychartMessage:
      "Dr. Loxley reviewed your scan — heart side unremarkable. Incidental small pancreatic cyst forwarded to your PCP (Dr. Ashbrook).",
    orders: ["Route imaging study to PCP — Felicity Ashbrook MD"],
    dxAssociated: ["Other specified disorders of pancreas"],
  },
};

export default fixture;
