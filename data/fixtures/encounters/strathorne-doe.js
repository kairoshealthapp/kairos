// Pattern 7b — ASYNC PRE-CALL STRUCTURED INQUIRY (skeleton)
// Source: docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md Pattern 7
// Bryant DOE 4 stents 2025 — 20 chart-aware questions, MRSA discovery via Q16.

const fixture = {
  id: "strathorne-doe",
  slug: "strathorne-doe",
  patternId: "7b",
  patternName: "ASYNC PRE-CALL STRUCTURED INQUIRY",
  tab: "patientcall",
  urgency: "calm",
  sourceChannel: "phone",
  sourceBox: "patient-call",
  mychartStatus: "Active",
  receivedAt: "2026-04-28T16:24:00Z",
  card: {
    subject: "Patient Call: DOE despite 4 stents 2025",
    kicker: "PATIENT CALL · TRIAGE",
    severity: "amber",
  },
  patient: {
    name: "Bryant, Harold",
    displayName: "Harold Bryant",
    age: 78,
    sex: "M",
    dob: "1948-04-01",
    mrn: "82091736",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "Patient Call",
    author: "Patient (via clinic phone)",
    timestamp: "2026-04-28 11:24",
    body:
      "Patient called stating he had 4 stents placed in 2025 but is still experiencing DOE walking across the room. Reports lightheadedness intermittently. Requests nurse callback.",
  },
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  chartContext: {
    problemList: [
      "CAD s/p PCI x4 stents 2025",
      "HFmrEF (LVEF 42%)",
      "HTN",
      "T2DM",
    ],
    meds: [
      "Aspirin 81mg daily",
      "Clopidogrel 75mg daily",
      "Metoprolol succinate 50mg daily",
      "Atorvastatin 80mg daily",
      "Lisinopril 10mg daily",
      "Empagliflozin 10mg daily",
    ],
    allergies: ["NKDA"],
    recentLabs: [
      { date: "2026-04-15", name: "BMP", value: "Cr 1.1, K 4.2, BUN 18" },
      { date: "2026-04-15", name: "BNP", value: "BNP 412 (baseline)" },
      { date: "2026-03-08", name: "Lipid", value: "LDL 68" },
    ],
    recentProcedures: [
      {
        date: "2025-08-22",
        name: "PCI x4 stents (LAD, LCx, RCA distal, RCA mid)",
        provider: "Pendrelle NP / interventional team",
      },
    ],
    recentNotes: [
      {
        date: "2026-04-01",
        author: "Pendrelle NP",
        summary:
          "Routine follow-up post-PCI. DAPT continued. No new symptoms reported. Lipids at goal.",
      },
      {
        date: "2026-02-12",
        author: "Pendrelle NP",
        summary:
          "Cardiology follow-up. Stable. DOE only with significant exertion. Medication review unchanged.",
      },
    ],
  },
  assessment: [
    {
      id: "q1",
      inputType: "number_unit",
      unit: "feet",
      text: "How many feet can you walk before getting short of breath?",
    },
    {
      id: "q2",
      inputType: "single_select",
      text: "When you feel lightheaded, is it standing up, constant, or with exertion?",
      options: ["Standing up", "Constant", "With exertion"],
    },
    {
      id: "q3",
      inputType: "single_select",
      text: "Have you taken your DAPT (aspirin and clopidogrel) every day this week?",
      options: ["Yes", "No", "Some missed"],
      followUp: {
        condition: ["No", "Some missed"],
        inputType: "free_text",
        text: "Which medication and how many doses?",
      },
    },
    {
      id: "q4",
      inputType: "yesno",
      text: "Any chest pain, pressure, or tightness?",
      followUp: { condition: ["Yes"], inputType: "free_text", text: "Describe" },
    },
    {
      id: "q5",
      inputType: "yesno",
      text: "Any leg swelling, especially at end of day?",
      followUp: {
        condition: ["Yes"],
        inputType: "single_select",
        text: "Severity?",
        options: ["Mild", "Moderate", "Severe"],
      },
    },
    {
      id: "q6",
      inputType: "yesno",
      text: "Any changes in medications since your last visit?",
      followUp: { condition: ["Yes"], inputType: "free_text", text: "Describe" },
    },
  ],
  mockResponses: {
    q1: { value: "20", unit: "feet" },
    q2: { value: "With exertion" },
    q3: { value: "Yes" },
    q4: { value: "No" },
    q5: { value: "Yes", followUp: "Mild" },
    q6: { value: "No" },
    notes:
      "Patient also mentions occasional palpitations; resolves with rest. Has been pacing himself more this week.",
  },
  sbar: {
    s:
      "63 y/o male s/p PCI x4 stents 8/2025 calls with new DOE walking across the room and intermittent lightheadedness with exertion x 1 week.",
    b:
      "CAD s/p PCI x4 stents 2025, HFmrEF LVEF 42%, HTN, T2DM. DAPT (aspirin/clopidogrel) confirmed continued. Most recent BNP 412 (baseline). Cr 1.1. Last cardiology visit 4/1 stable.",
    a:
      "New-onset DOE at low exertion threshold (~20 feet) post-PCI patient. Lightheadedness exertional. Mild peripheral edema. No chest pain. Concerning for HF decompensation vs in-stent restenosis vs anemia/other. Patient adherent to meds. Reports occasional palpitations.",
    r:
      "Recommend prompt cardiology evaluation. Considerations: repeat BNP and BMP, ECG, echo for LVEF reassessment, consider stress imaging vs cath given symptom pattern. Awaiting your direction on next steps.",
  },
  routing: {
    recipient: "Pendrelle NP",
    pool: "Lakeside Cardiology Support Pool",
    comment: "DOE workup post-PCI. SBAR attached. Awaiting your clinical direction.",
    priority: "Normal",
  },
  actionScripts: {},
  finalSignedState: {
    nurseNote:
      "Patient reports DOE despite 4 stents 2025. 20 chart-aware questions deployed (canonical pattern-7 implementation). Surprise data: active MRSA infection from elbow surgery (caught via medication-list cross-check), decreased appetite, weight loss. SBAR forwarded to Pendrelle urgent.",
    phoneScript: "[20-question chart-aware inquiry script]",
    orders: [],
    dxAssociated: ["Heart failure, unspecified", "MRSA infection of skin"],
  },
};

export default fixture;
