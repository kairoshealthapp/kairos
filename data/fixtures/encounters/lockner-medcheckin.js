// Phase-3.5 canonical PATIENT CALL fixture — transactional forward.
// Source: real Patton-shift call (2026-04-30), front-desk-routed Zetia
// tolerance check-in. The simplest "no clinical question, just forward to
// ordering provider" pattern.

const fixture = {
  id: "lockner-medcheckin",
  slug: "lockner-medcheckin",
  patternId: 11,
  patternName: "TRANSACTIONAL FORWARD",
  tab: "patientcall",
  urgency: "calm",
  sourceChannel: "phone",
  sourceBox: "patient-call",
  mychartStatus: "active",
  receivedAt: "2026-04-30T13:37:00Z",
  card: {
    subject: "Zetia tolerating well — FYI to Peterson",
    kicker: "PATIENT CALL",
    severity: "green",
  },
  patient: {
    name: "Webb, Donna",
    displayName: "Donna Webb",
    age: 63,
    sex: "F",
    dob: "1962-10-31",
    mrn: "M000631353",
    proxyName: null,
    primary: "Stellan R Peterson, NP",
    coverage: "Lakeside Medicare Advantage",
  },
  sourceArtifact: {
    type: "Patient Call",
    author: "Ashley Watson (front desk)",
    timestamp: "2026-04-30 13:37",
    body:
      "Patient was calling into let Peterson know that the ezetimibe (Zetia) 10 mg tablet that was subscribed at her last appointment she says is working well and she is feeling good",
  },
  recommendedAction: "Forward to ordering provider with brief routing comment",
  routing: {
    recipient: "Stellan R Peterson, NP",
    pool: "Lakeside Cardiology Support Pool",
    comment:
      "Patient reporting Zetia tolerance and subjective benefit. No clinical question. FYI.",
    priority: "Normal",
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
      "Patient call routed by front desk: patient reports tolerating Zetia 10 mg well and feeling good. No clinical question raised. Forwarded to ordering provider (Peterson, NP) for awareness; coverage pool Lakeside Cardiology Support Pool, Normal priority.",
    phoneScript: "",
    orders: [],
    dxAssociated: [],
  },
};

export default fixture;
