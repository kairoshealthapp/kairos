// Pattern 8 → COORDINATION-shaped (skeleton; multi-party referral status thread)
// Source: docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md Pattern 8

const fixture = {
  id: "vrabel-referral",
  slug: "vrabel-referral",
  patternId: 8,
  patternName: "COORDINATION THREAD (referral status)",
  tab: "other",
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
    name: "Vrabel, Octavia",
    displayName: "Octavia Vrabel",
    age: 56,
    sex: "F",
    dob: "1969-10-25",
    mrn: "37029184",
    proxyName: null,
    primary: "Beckweldon NP, Heart and Vascular Clinic",
    coverage: "BCBS PPO",
  },
  sourceArtifact: {
    type: "MyChart message thread",
    author: "Patient + outside clinician (Wash U scheduling)",
    timestamp: "2026-04-28 12:12",
    body:
      "Patient: hadn't heard from Wash U about HCM scheduling with Dr. Tregarthen.\nBeckweldon reply: confirmed 4/18 telephone encounter, no appointment date, asked nurse to call Wash U.\nNurse called Wash U: \"Milly will call patient in ~2 weeks.\" Messaged patient back; patient replied \"Thanks Brandon!\"",
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
      "Patient checking Wash U HCM scheduling status. Confirmed with Wash U scheduling — patient will be contacted in ~2 weeks. Patient updated. Thread closed by patient.",
    mychartMessage:
      "Hi Ms Vrabel — I called Wash U scheduling. Their team (Milly) will reach out to you in about 2 weeks. Let us know if you have not heard from them by then.",
    orders: [],
    dxAssociated: ["Hypertrophic cardiomyopathy"],
  },
};

export default fixture;
