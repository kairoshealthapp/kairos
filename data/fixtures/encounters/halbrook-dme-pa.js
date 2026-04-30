// Pattern 10 — COORDINATION (DME prior auth, dual-eligible)
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 16

const fixture = {
  id: "halbrook-dme-pa",
  slug: "halbrook-dme-pa",
  patternId: 10,
  patternName: "COORDINATION",
  tab: "other",
  urgency: "calm",
  sourceChannel: "secure-chat",
  sourceBox: "secure-chat",
  mychartStatus: "active",
  receivedAt: "2026-04-29T15:08:00Z",
  card: {
    subject: "DME prior auth — dual-eligible Medicare/MO HealthNet, missed routing",
    kicker: "COORDINATION · OTHER",
    severity: "amber",
  },
  patient: {
    name: "Halbrook, Theadora",
    displayName: "Theadora Halbrook",
    age: 72,
    sex: "F",
    dob: "1954-02-19",
    mrn: "61204911",
    proxyName: null,
    primary: "Beckweldon NP, Heart and Vascular Clinic",
    coverage: "Medicare A+B + MO HealthNet (dual-eligible)",
  },
  sourceArtifact: {
    type: "Secure Chat Thread",
    author: "Front desk routing note (initially mis-routed; retraced as cardiology-owned)",
    timestamp: "2026-04-29 10:08",
    body:
      "Patient awaiting CPAP DME order placed 3/2026. Apria reports no MO HealthNet PA on file. PA path is a phone call (NOT a form), requires 3 data points: ICD-10, AHI, NPI. Approval # = patient's MO HealthNet ID. Workflow not in any nurse playbook here — figured out under pressure today.\n\n[~45 minutes of workflow discovery to execute ~5 minutes of actual work.]",
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
      { type: "banner", kind: "yellow", text: "Workflow Playbook Library: NEW playbook \"DME PA — dual-eligible Medicare/MO HealthNet\" being captured…", durationMs: 1800 },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 500,
        content:
          "DME prior auth — Apria CPAP for Halbrook (dual-eligible Medicare A+B + MO HealthNet). Per Apria, PA path is a phone call to MO HealthNet (NOT a form). Three data points needed: ICD-10 (G47.33 OSA), AHI (from sleep study report 1/2026: 22.4), NPI (Beckweldon 1234567890). Called MO HealthNet PA line, approval # = patient's MO HealthNet member ID. Faxed approval back to Apria for processing. Patient outreach below.\n\nPlaybook captured in Workflow Playbook Library — auto-attaches to next dual-eligible DME PA card for any nurse.",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Ms Halbrook,\n\nI wanted to update you on your CPAP machine. There was a small holdup with the second-layer authorization (MO HealthNet, in addition to Medicare). I called the authorization line for you today, gave them the details from your sleep study, and the approval has been sent over to the DME company (Apria). They should be reaching out to you in the next several days to schedule delivery.\n\nLet us know if you have not heard from them by next Wednesday.\n\nBrandon Sterne, RN BSN / Heart and Vascular Clinic",
      },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote: "[As drafted above]",
    mychartMessage: "[As drafted above]",
    orders: [],
    dxAssociated: ["Obstructive sleep apnea (G47.33)"],
  },
};

export default fixture;
