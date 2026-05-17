// Pattern 1 — SYNTHESIS only (skeleton; ADDENDUM Halbrook reference)
// Source: docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md Pattern 1 examples
// Different clinical issue than halbrook-dme-pa (same patient, different day).

const fixture = {
  id: "halbrook-lab-review",
  slug: "halbrook-lab-review",
  patternId: 1,
  patternName: "SYNTHESIS only",
  tab: "resultsfu",
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
    name: "Halbrook, Kevin",
    displayName: "Kevin Halbrook",
    age: 72,
    sex: "M",
    dob: "1954-02-19",
    mrn: "61204911",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B + MO HealthNet (dual-eligible)",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-28 10:42",
    body:
      "Chem-8 reviewed, unremarkable. Home BP log average 148/89 on Toprol-XL 50mg + lisinopril 20mg. Increase Toprol-XL to 100mg daily, continue lisinopril. Recheck home BP log in 2 weeks. Order BP/HR log via patient portal.",
  },
  // v3.0 — conditional panel declaration. Auto-inferred from
  // actionScripts / finalSignedState; override here if needed.
  panels: ["rnNote", "myChart", "orderPad"],
  panelContent: {
    orderPad: {
      orders: [
        {
          type: "Medication change",
          codeVariant: "Toprol-XL (metoprolol succinate ER) 100mg PO daily",
          reason: "BP not at goal on current dose (avg 148/89)",
          associatedDx: ["Essential hypertension (I10)"],
          priority: "Routine",
          class: "Outpatient",
          status: "Discontinue prior 50mg + start 100mg",
        },
        {
          type: "Patient monitoring",
          codeVariant: "Home BP/HR log via patient portal",
          reason: "Reassess after dose increase",
          associatedDx: ["Essential hypertension (I10)"],
          priority: "Routine",
          status: "Recheck in 2 weeks",
        },
      ],
      hasUnansweredQuestions: false,
    },
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
      "Dr. Pendrelle reviewed Chem-8 (unremarkable) and home BP log (avg 148/89 on Toprol-XL 50 + lisinopril 20). Plan: Toprol-XL 100mg daily, continue lisinopril, recheck BP log in 2 weeks. Patient notified via MyChart.",
    mychartMessage:
      "Mr. Halbrook,\n\nYour blood work came back normal. Looking at your home blood pressure readings over the past two weeks, the average is running a little high (148/89) — your goal is closer to 130/80.\n\nYour provider is increasing your Toprol-XL from 50 mg to 100 mg once daily. The pharmacy has been notified — you can pick up the new prescription at your usual pharmacy. Take the new dose at the same time you've been taking the 50 mg.\n\nWhat to do:\n- Pick up the 100 mg prescription and start it as soon as you get home\n- Stop taking the 50 mg tablets — you can throw them out or return them to the pharmacy\n- Continue your lisinopril 20 mg once daily as before\n- Keep logging your home blood pressure each morning for the next 2 weeks\n\nWhat to watch for: You may feel a little more tired or lightheaded the first few days at the higher dose. This usually settles in a week. If you feel very dizzy on standing, your heart rate drops below 50, or your blood pressure stays above 160 systolic for several days in a row, call the clinic.\n\nNext step: I'll review your BP log in 2 weeks. If we're at goal, we hold steady. If not, we'll talk about the next adjustment.\n\nReply here or call the clinic with any questions.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
    orders: ["DC Toprol-XL 50mg", "Toprol-XL 100mg daily", "Home BP log recheck 2 weeks"],
    dxAssociated: ["Essential hypertension"],
  },
};

export default fixture;
