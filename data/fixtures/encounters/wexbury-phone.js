// Pattern 14 — PHONE-CHANNEL SYNTHESIS
// Source: docs/KAIROS-SESSION-2026-04-29-EVENING.md CASE 27 (Ramey/Tikhonova)

const fixture = {
  id: "wexbury-phone",
  slug: "wexbury-phone",
  patternId: 14,
  patternName: "PHONE-CHANNEL SYNTHESIS",
  tab: "resultsfu",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "pending",
  receivedAt: "2026-04-29T16:18:00Z",
  card: {
    subject: "TTE result — MyChart Pending → phone-only",
    kicker: "RESULTS F/U · NOTIFY",
    severity: "green",
  },
  patient: {
    name: "Tikhonova, Hesper",
    displayName: "Hesper Tikhonova",
    age: 83,
    sex: "F",
    dob: "1943-04-02",
    mrn: "30816401",
    proxyName: null,
    primary: "Voronova NP, Heart and Vascular Clinic",
    coverage: "Humana Medicare Advantage",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Voronova, Cardiology",
    timestamp: "2026-04-29 11:18",
    body:
      "TTE Complete read by Donovan Morrison MD on 4/29:\n  1. Echocardiogram\n  2. Ejection fraction normal at 55-60%\n  3. Normal right ventricular size and function\n  4. Normal left and right atrial size\n  5. Trivial aortic insufficiency\n  6. Mild mitral insufficiency\n  7. No change in treatment based on echocardiogram\n\nMyChart Pending — phone-only contact.",
  },
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  actionScripts: {
    "generate-phone-script": [
      { type: "state-transition", target: "card", newState: "drafting", delayMsBefore: 100 },
      { type: "banner", kind: "green", text: "Channel: phone (MyChart Pending). Drafting in spoken register.", durationMs: 900 },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 500,
        content:
          "Echocardiogram reviewed. EF 55-60% (normal). Normal RV size and function. Normal left and right atrial size. Trivial aortic insufficiency. Mild mitral insufficiency. No changes to current treatment.\n\nPatient contacted via phone.",
      },
      {
        type: "pane-update",
        target: "phone-script",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "We're calling with the results of your recent echocardiogram, which is an ultrasound of your heart.\n\nThe good news is that your heart's pumping function is normal. Your ejection fraction, which measures how well your heart squeezes with each beat, is 55 to 60 percent, which is within normal range.\n\nThe size of your heart chambers on both the right and left sides also looks normal.\n\nWe did see two minor valve findings. There is a trivial, meaning very slight, amount of leakage through your aortic valve, and a mild amount of leakage through your mitral valve. Dr. Voronova has reviewed these findings and is not making any changes to your current treatment based on this echo.\n\nDo you have any questions about these results?",
      },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
    "generate-voicemail": [
      { type: "banner", kind: "green", text: "Drafting voicemail variant (~30-45s spoken)…", durationMs: 700 },
      {
        type: "pane-update",
        target: "phone-script",
        mode: "append",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "\n\n— VOICEMAIL VARIANT —\n\nHi Mrs. Tikhonova, this is Brandon from the Heart and Vascular Clinic, calling about the results of your recent echocardiogram. Dr. Voronova has reviewed the test and the news is reassuring — your heart's pumping function is normal and there are no medication changes. Please give us a call back at the clinic number when you have a moment so we can review the details with you. Thank you.",
      },
    ],
  },
  finalSignedState: {
    nurseNote: "[As drafted above]",
    phoneScript: "[As drafted above]",
    orders: [],
    dxAssociated: [],
  },
};

export default fixture;
