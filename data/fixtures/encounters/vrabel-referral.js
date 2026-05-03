// Pattern 8 → COORDINATION-shaped (skeleton; multi-party referral status thread)
// Source: docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md Pattern 8

const fixture = {
  id: "vrabel-referral",
  slug: "vrabel-referral",
  patternId: 8,
  patternName: "COORDINATION THREAD (referral status)",
  tab: "securechat",
  urgency: "calm",
  sourceChannel: "mychart",
  sourceBox: "pt-advice",
  mychartStatus: "active",
  receivedAt: "2026-04-28T17:12:00Z",
  card: {
    subject: "Patient checking on Wash U HCM scheduling status",
    kicker: "ADVICE · COORDINATION",
    severity: "amber",
  },
  patient: {
    name: "Sullivan, Diane",
    displayName: "Diane Sullivan",
    age: 56,
    sex: "F",
    dob: "1969-10-25",
    mrn: "37029184",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "BCBS PPO",
  },
  sourceArtifact: {
    type: "MyChart message thread",
    author: "Patient + outside clinician (Wash U scheduling)",
    timestamp: "2026-04-28 12:12",
    body:
      "Patient: hadn't heard from Wash U about HCM scheduling with Dr. Williams.\nPendrelle reply: confirmed 4/18 telephone encounter, no appointment date, asked nurse to call Wash U.\nNurse called Wash U: \"Milly will call patient in ~2 weeks.\" Messaged patient back; patient replied \"Thanks Brandon!\"",
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
      "Patient checking Wash U HCM scheduling status. Confirmed with Wash U scheduling — patient will be contacted in ~2 weeks. Patient updated. Thread closed by patient.",
    mychartMessage:
      "Hi Ms. Sullivan,\n\nI heard you back about your Wash U HCM appointment — thanks for letting me know it hadn't been scheduled yet. I called their scheduling team this morning to track it down.\n\nWhat I learned: Their scheduler (Milly) confirmed they have your referral and your records. She told me she'll reach out to you directly to schedule, and to expect her call within about 2 weeks.\n\nWhat to do:\n- No action needed right now — just watch for a call from Wash U scheduling\n- Continue all your current medications as prescribed\n- Bring up any new symptoms with your primary care provider in the meantime if anything comes up\n\nWhat to watch for: New chest pain, fainting or near-fainting, severe shortness of breath, or palpitations that won't settle. If any of those happen, don't wait for the Wash U appointment — call our clinic the same day, or 911 for severe symptoms.\n\nIf you haven't heard from Wash U in 2 weeks, reply to this message and we'll follow up again.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
    orders: [],
    dxAssociated: ["Hypertrophic cardiomyopathy"],
  },
};

export default fixture;
