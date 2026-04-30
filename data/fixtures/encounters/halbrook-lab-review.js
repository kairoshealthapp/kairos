// Pattern 1 — SYNTHESIS only (skeleton; ADDENDUM Halbrook reference)
// Source: docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md Pattern 1 examples
// Different clinical issue than halbrook-dme-pa (same patient, different day).

const fixture = {
  id: "halbrook-lab-review",
  slug: "halbrook-lab-review",
  patternId: 1,
  patternName: "SYNTHESIS only",
  tab: "notify",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "active",
  receivedAt: "2026-04-28T15:42:00Z",
  card: {
    subject: "Chem-8 review — increase Toprol-XL to 100mg",
    kicker: "RESULTS F/U · NOTIFY",
    severity: "green",
  },
  patient: {
    name: "Halbrook, Theadora",
    displayName: "Theadora Halbrook",
    age: 72,
    sex: "F",
    dob: "1954-02-19",
    mrn: "61204911",
    proxyName: null,
    primary: "Loxley NP, Heart and Vascular Clinic",
    coverage: "Medicare A+B + MO HealthNet (dual-eligible)",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Loxley, Cardiology",
    timestamp: "2026-04-28 10:42",
    body:
      "Chem-8 reviewed, unremarkable. Home BP log average 148/89 on Toprol-XL 50mg + lisinopril 20mg. Increase Toprol-XL to 100mg daily, continue lisinopril. Recheck home BP log in 2 weeks. Order BP/HR log via patient portal.",
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
      "Dr. Loxley reviewed Chem-8 (unremarkable) and home BP log (avg 148/89 on Toprol-XL 50 + lisinopril 20). Plan: Toprol-XL 100mg daily, continue lisinopril, recheck BP log in 2 weeks. Patient notified via MyChart.",
    mychartMessage: "Increasing your Toprol-XL to 100 mg once daily…",
    orders: ["DC Toprol-XL 50mg", "Toprol-XL 100mg daily"],
    dxAssociated: ["Essential hypertension"],
  },
};

export default fixture;
