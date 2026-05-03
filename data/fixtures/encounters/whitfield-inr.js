// Pattern 1 — SYNTHESIS only
// Pass E §2 — new tour Card 9. Routine INR result on Coumadin Clinic
// protocol. Demonstrates the "living document" pattern: every
// anticoagulation note carries the full patient trajectory forward,
// updated each encounter. RN-protocol-driven — no provider in the loop
// for routine therapeutic dosing.

const fixture = {
  id: "whitfield-inr",
  slug: "whitfield-inr",
  patternId: 1,
  patternName: "SYNTHESIS only",
  tab: "results",
  authorizeActions: ["Send MyChart", "Sign Anticoagulation Note", "Done"],
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results",
  mychartStatus: "active",
  receivedAt: "2026-05-03T08:42:00Z",
  card: {
    subject: "PROTIME-INR 2.3 — therapeutic, no dose change",
    kicker: "RESULTS · COUMADIN CLINIC",
    severity: "green",
  },
  patient: {
    name: "Whitfield, Margaret",
    displayName: "Margaret Whitfield",
    age: 74,
    sex: "F",
    dob: "1952-08-22",
    mrn: "M000071094",
    proxyName: null,
    primary: "Coumadin Clinic — Lakeside Cardiology Associates",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Lakeside Lab",
    timestamp: "2026-05-03 08:42",
    body: "PROTIME-INR\nValue: INR 2.3\nReference range: n/a (therapeutic range maintained in Anticoagulation note)\nSpecimen collected: 2026-05-03 07:14\nResulted: 2026-05-03 08:42\nPerforming lab: Lakeside Lab",
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
  actionScripts: {
    "generate-note-mychart": [
      {
        type: "state-transition",
        target: "card",
        newState: "drafting",
        delayMsBefore: 100,
      },
      {
        type: "banner",
        kind: "green",
        text: "Pulling prior Coumadin note + INR trend…",
        durationMs: 800,
        delayMsBefore: 0,
      },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 600,
        content:
          "Coumadin clinic. INR 2.3, goal 2.0-3.0, therapeutic.\n\nTrend: 1.7 → 2.2 → 2.3 → 2.5 → 2.7 → 2.5 → 2.3 → 2.3\n\nDose: warfarin 5mg daily (TWD 35mg). Continue current dose per clinic anticoagulation dosing guidelines.\n\nStable on current dose. Last hospitalization 11/2025 for AFib with RVR, anticoagulation resumed at discharge. No bleeding events. Takes warfarin at 6 PM daily per patient.\n\nPatient notified via MyChart.\n\nNext INR 4 weeks.",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Mrs. Whitfield,\n\nYour INR blood test came back at 2.3. This is right in your target range of 2.0 to 3.0, which means your warfarin is working exactly the way we want.\n\nWhat to do:\n- No change to your dose. Continue warfarin 5 mg every evening as you've been taking it.\n- Continue your other medications as prescribed.\n\nWhat to watch for: While on warfarin, watch for unusual bleeding or bruising — bleeding gums, nosebleeds that won't stop, blood in urine or stool, dark or tarry stools, severe headache after a bump to the head, or any cut that doesn't stop bleeding within 10-15 minutes. If any of these happen, call the clinic right away. For severe bleeding or any head injury, go to the ER.\n\nWhat's next: Your next INR blood draw is in 4 weeks. You'll get an automatic reminder through MyChart a few days before. Please use the same lab so we can keep your trend consistent.\n\nReply to this message or call the clinic with any questions.\n\nBrandon Sterne, RN BSN / Lakeside Cardiology Associates",
      },
      {
        type: "state-transition",
        target: "card",
        newState: "drafted",
        delayMsBefore: 200,
      },
    ],
  },
  finalSignedState: {
    nurseNote: "[As drafted above]",
    mychartMessage: "[As drafted above]",
    orders: [],
    dxAssociated: ["Atrial fibrillation, chronic"],
  },
};

export default fixture;
