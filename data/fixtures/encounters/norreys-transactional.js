// Pattern 9 — TRANSACTIONAL REPLY
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 1 Surface 4 (Forshey/Stewart)
// Refill confirmation round-trip — last visit + future appointment + active dx → Rx Request rule
// pre-stages 90 days, 3 refills, standard documentation. The "boring case."

const fixture = {
  id: "norreys-transactional",
  slug: "norreys-transactional",
  patternId: 9,
  patternName: "TRANSACTIONAL REPLY",
  tab: "rxrequest",
  authorizeActions: ["Sign Note", "Sign Refill"],
  urgency: "calm",
  sourceChannel: "mychart",
  sourceBox: "pt-advice",
  mychartStatus: "active",
  receivedAt: "2026-04-29T14:11:00Z",
  card: {
    subject: "Refill confirmation: warfarin 6mg (after 6.5→6mg adjustment)",
    kicker: "ADVICE · TRANSACTIONAL",
    severity: "green",
  },
  patient: {
    name: "Stewart, Daniel",
    displayName: "Daniel Stewart",
    age: 65,
    sex: "M",
    dob: "1961-07-22",
    mrn: "47281065",
    proxyName: null,
    primary: "Reynolds, Cardiology (Coumadin Clinic)",
    coverage: "United HMO",
  },
  sourceArtifact: {
    type: "MyChart Reply (re: warfarin dose decrease 6.5→6mg sent 4/21)",
    author: "Patient",
    timestamp: "2026-04-29 09:11",
    body: "\"Need refill 6mg warfrin\"",
  },
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  actionScripts: {
    "generate-reply": [
      { type: "state-transition", target: "card", newState: "drafting", delayMsBefore: 100 },
      { type: "banner", kind: "green", text: "Rx Request rule check: last visit 4/21, future appointment booked, dx active…", durationMs: 900 },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 500,
        content:
          "Patient confirms new warfarin 6mg daily dose (decreased from 6.5mg on 4/21 for INR 3.9 hold). Last clinic visit 4/21/2026, next follow-up scheduled 7/22/2026. Dx atrial fibrillation active. Refill placed per Coumadin Clinic Rx Request rule: 90 days, 3 refills.\n\nEncounter closed.",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Mr Stewart,\n\nGot it — your warfarin 6 mg refill has been sent to your pharmacy. Please continue taking 6 mg once daily as discussed on 4/21.\n\nYour next INR check is on the schedule. Reach out if anything changes.\n\nBrandon Sterne, RN BSN / Cardiology Associates (Coumadin Clinic)",
      },
      { type: "banner", kind: "green", text: "Rx Request rule satisfied — refill auto-staged", durationMs: 1000, delayMsBefore: 200 },
      {
        type: "pane-update",
        target: "order-pad",
        mode: "instant",
        delayMsBefore: 300,
        content: {
          orders: [
            {
              type: "Warfarin 6mg daily (PO)",
              codeVariant: "WARF STERNE BR",
              reason: "Refill — dose-decrease confirmation per 4/21 visit",
              associatedDx: ["Atrial fibrillation"],
              priority: "Routine",
              class: "Medication refill",
              status: "Active",
              expectedDate: "2026-04-29",
              expires: "2026-07-29",
              clinicalQuestions: [],
              releaseToPatient: false,
              ccResults: [],
              cosign: "Reynolds",
              auditTrail: "Rx Request rule auto-stage — 90 days, 3 refills",
            },
          ],
          hasUnansweredQuestions: false,
        },
      },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote:
      "Patient confirms new warfarin 6mg dose (decreased from 6.5mg on 4/21 for INR 3.9 hold). Refill placed per Rx Request rule. Encounter closed.",
    mychartMessage: "[As drafted above]",
    orders: ["Warfarin 6mg daily — refill 90 days, 3 refills — Reynolds cosign"],
    dxAssociated: ["Atrial fibrillation"],
  },
};

export default fixture;
