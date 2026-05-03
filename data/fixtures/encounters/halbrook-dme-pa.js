// Pattern 10 — COORDINATION (DME prior auth, dual-eligible)
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 16

const fixture = {
  id: "halbrook-dme-pa",
  slug: "halbrook-dme-pa",
  patternId: 10,
  patternName: "COORDINATION",
  tab: "securechat",
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
    name: "Halbrook, Kevin",
    displayName: "Kevin Halbrook",
    age: 72,
    sex: "F",
    dob: "1954-02-19",
    mrn: "61204911",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B + MO HealthNet (dual-eligible)",
  },
  sourceArtifact: {
    type: "Secure Chat Thread",
    author: "Front desk routing note (initially mis-routed; retraced as cardiology-owned)",
    timestamp: "2026-04-29 10:08",
    body:
      "Patient awaiting CPAP DME order placed 3/2026. Apria reports no MO HealthNet PA on file. PA path is a phone call (NOT a form), requires 3 data points: ICD-10, AHI, NPI. Approval # = patient's MO HealthNet ID.",
  },
  // v3.0 — conditional panel declaration. Auto-inferred from
  // actionScripts / finalSignedState; override here if needed.
  // v3.0 Master Prompt 2 / Fix 2b — secure chat reply is the RN Note
  // itself (drafted from the thread, posted back via Done). MyChart
  // panel suppressed; the new tour Card 7 walks only the RN Note.
  panels: ["rnNote"],
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
          "DME prior authorization completed for CPAP setup. Patient is dual-eligible (Medicare A+B + MO HealthNet). Per Apria DME, PA pathway requires verbal authorization through MO HealthNet (no form). Required documentation provided: ICD-10 G47.33 (obstructive sleep apnea), AHI 22.4 per sleep study 1/2026, provider NPI on file. Called MO HealthNet PA line, obtained approval. Approval number documented. Approval faxed to Apria for CPAP processing. Patient notified via MyChart with setup timeline and expectations.",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Mr. Halbrook,\n\nQuick update on your CPAP machine. There was a small holdup with the second-layer insurance approval (MO HealthNet, on top of Medicare) — they needed a few specific details from your sleep study before they'd authorize the equipment.\n\nWhat happened: I called the MO HealthNet authorization line today, gave them everything they asked for (your diagnosis code, your AHI from the sleep study, and the prescribing provider's NPI), and got the authorization approved. The approval has been sent over to Apria (the company that supplies your CPAP).\n\nWhat to do:\n- Watch for a call from Apria within the next several days to schedule delivery and a fitting\n- Continue your other medications as prescribed\n- No action needed from you unless they don't call\n\nWhat to expect: When Apria calls, they'll ask about your sleeping setup and schedule a time to deliver and fit the mask. Most people are set up within 1-2 weeks of authorization.\n\nIf you haven't heard from Apria by next Wednesday, reply to this message and we'll follow up on the order.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
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
