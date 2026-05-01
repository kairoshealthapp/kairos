// Pattern 10 — COORDINATION (Secure Chat origin — skeleton)
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 20 (Bailey/Drozdov)

const fixture = {
  id: "heldenmark-securechat",
  slug: "heldenmark-securechat",
  patternId: 10,
  patternName: "COORDINATION (Secure Chat origin)",
  tab: "securechat",
  urgency: "calm",
  sourceChannel: "secure-chat",
  sourceBox: "secure-chat",
  mychartStatus: "active",
  receivedAt: "2026-04-29T13:24:00Z",
  card: {
    subject: "Secure Chat (11-participant): order-expiration check on stale referral",
    kicker: "SECURE CHAT · COORDINATION",
    severity: "amber",
  },
  patient: {
    name: "Drozdov, Werner",
    displayName: "Werner Drozdov",
    age: 69,
    sex: "M",
    dob: "1957-04-01",
    mrn: "73018241",
    proxyName: null,
    primary: "Voronova NP, Heart and Vascular Clinic",
    coverage: "Aetna Medicare Advantage",
  },
  sourceArtifact: {
    type: "Secure Chat (11-participant thread)",
    author: "Pomona Kishimoto (PHS scheduling, 9:20 AM)",
    timestamp: "2026-04-29 08:24",
    body:
      "Patient referral order placed 1/2026 still status=PEND with 2 missed appointments. Verify clinical relevance — should we cancel and re-place, or chase the patient?",
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
      "Stale referral identified. Voronova confirms still clinically relevant. Patient outreach scheduled. Thread-state synchronization will close the originating Secure Chat thread automatically once patient acknowledges.",
    mychartMessage: "Touching base on a referral that has been pending since January…",
    orders: [],
    dxAssociated: [],
  },
};

export default fixture;
