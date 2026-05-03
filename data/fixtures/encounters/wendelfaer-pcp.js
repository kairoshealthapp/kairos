// Pattern 6 — SYNTHESIS + HANDOFF (skeleton, actionScripts not yet written)
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 5 CASE 4 (McGuirk/Reilly)

const fixture = {
  id: "wendelfaer-pcp",
  slug: "wendelfaer-pcp",
  patternId: 6,
  patternName: "SYNTHESIS + HANDOFF",
  tab: "resultsfu",
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
    name: "Reilly, Megan",
    displayName: "Megan Reilly",
    age: 28,
    sex: "F",
    dob: "1998-07-14",
    mrn: "60017802",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "BCBS HMO",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-29 08:01",
    body:
      "CTA abdomen reviewed. Cardiac findings unremarkable. Incidental 1.4 cm simple-appearing pancreatic cyst noted; below standard threshold for cardiology workup. Please forward results to her PCP (Fenella Olson MD) for further follow-up.",
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
      "Dr. Pendrelle reviewed CTA abdomen. Cardiac findings unremarkable. Incidental 1.4 cm pancreatic cyst — forwarded to PCP (Fenella Olson MD). Patient notified via MyChart.",
    mychartMessage:
      "Hi,\n\nYour CTA abdomen results are in. Two things to share:\n\n1. Heart and major blood vessels: unremarkable. The cardiology question that prompted this scan has a clean answer — nothing concerning on the heart side.\n\n2. Incidental finding: The radiologist noted a small (1.4 cm) simple-appearing cyst on the pancreas. This is below the size threshold where cardiology would do anything about it, but it's worth having your primary-care provider track it. Cysts of this size are very common and usually nothing to worry about, but the right team to follow it is your PCP, Dr. Fenella Olson.\n\nWhat to do:\n- No changes to your medications\n- We've forwarded the imaging report to Dr. Olson's office so she has it on file\n- At your next visit with Dr. Olson, ask her how she'd like to handle follow-up on the cyst — most providers either repeat the scan in 12 months or recommend no further action depending on your overall health picture\n\nWhat to watch for: Persistent or new abdominal pain, jaundice (yellowing of skin or eyes), unintentional weight loss, or new digestive issues. If any of those come up, contact Dr. Olson.\n\nIf you have questions about the cardiology side, reply here. For questions about the pancreatic finding or follow-up plan, please reach out to Dr. Olson's office.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
    orders: ["Route imaging study to PCP — Fenella Olson MD"],
    dxAssociated: ["Other specified disorders of pancreas"],
  },
};

export default fixture;
