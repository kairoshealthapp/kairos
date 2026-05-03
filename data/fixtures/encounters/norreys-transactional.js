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
  // v3.0 — conditional panel declaration. v3.0 Master Prompt 2 / Fix 2b
  // Bug 4 — refill workflow surfaces only the RN Note (no patient
  // message for a routine confirmation; orders auto-place per Rx Request
  // rule). Tour spec for Card 4 walks the RN Note alone.
  panels: ["rnNote"],
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  // v3.0 Master Prompt 2 / Fix 2b Bug 4 — explicit panelContent so the
  // skeleton fixture renders a populated RN Note in the static demo
  // view (and in the new tour where panels are pre-filled).
  panelContent: {
    rnNote:
      "Refill request received via Surescripts. Patient seen 4/21/2026 in Coumadin Clinic, follow-up appointment scheduled 7/22/2026. Atrial fibrillation dx active. Both Rx Request rule criteria met (recent visit + scheduled follow-up).\n\nApproved warfarin 6mg daily, 90-day supply, 3 refills. Routed to pharmacy via Surescripts.\n\nEncounter closed.",
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
          "Mr. Stewart,\n\nGot your refill request — your warfarin 6 mg prescription has been sent to your pharmacy. It should be ready for pickup today.\n\nWhat to do:\n- Pick up the refill and continue warfarin 6 mg once daily, exactly as we discussed at your 4/21 visit\n- Take it at the same time every evening\n- Don't stop or change the dose without checking with us\n\nWhat to watch for: While on warfarin, watch for unusual bleeding or bruising — bleeding gums, nosebleeds that won't stop, blood in urine or stool, dark or tarry stools, or any cut that doesn't stop bleeding within 10-15 minutes. If any of those happen, call the Coumadin Clinic. For severe bleeding or any head injury, go to the ER.\n\nWhat's next: Your next INR blood draw is already on the schedule — you'll get a reminder a few days before. Use the same lab so we can keep your trend consistent.\n\nReply here or call the Coumadin Clinic with any questions.\n\nBrandon Sterne, RN BSN / Cardiology Associates (Coumadin Clinic)",
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
