// Pattern 7b — ASYNC PRE-CALL STRUCTURED INQUIRY (full lifecycle)
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 21+22
//       + docs/KAIROS-SESSION-2026-04-29-EVENING.md CASE 28
// Klausen (Davis) BP/amlodipine — call → 16-question chart-aware
// inquiry → SBAR → provider plan + addendum → callback note synthesis.

const fixture = {
  id: "underwell-full-lifecycle",
  slug: "underwell-full-lifecycle",
  patternId: "7b",
  patternName: "ASYNC PRE-CALL STRUCTURED INQUIRY",
  tab: "patientcall",
  urgency: "calm",
  sourceChannel: "phone",
  sourceBox: "patient-call",
  mychartStatus: "Active",
  receivedAt: "2026-04-29T19:02:00Z",
  card: {
    subject: "Patient Call: amlodipine — BP \"still high\", side effects",
    kicker: "PATIENT CALL · TRIAGE",
    severity: "amber",
  },
  patient: {
    name: "Klausen, Esperanza",
    displayName: "Esperanza Klausen",
    age: 81,
    sex: "F",
    dob: "1945-08-21",
    mrn: "37614902",
    proxyName: null,
    primary: "Voronova NP, Heart and Vascular Clinic",
    coverage: "Medicare A+B",
  },
  sourceArtifact: {
    type: "Patient Call",
    author: "Patient (via clinic phone, routed by front desk)",
    timestamp: "2026-04-29 14:02",
    body:
      "Patient called clinic stating BP \"still high\" despite recent amlodipine dose reduction. Reports fuzzy thinking and feet swelling. Requests nurse callback. PMH: HTN, AFib, CAD, MR, CKD, peripheral edema. Last visit 3/2026 with amlodipine reduced from 10mg to 5mg due to peripheral edema.",
  },
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  chartContext: {
    problemList: [
      "HTN",
      "AFib (on eliquis)",
      "CAD",
      "Mitral regurgitation",
      "CKD stage 3",
      "Peripheral edema",
    ],
    meds: [
      "Amlodipine 5mg daily (reduced from 10mg 3/2026)",
      "Carvedilol 12.5mg BID",
      "Spironolactone 25mg daily",
      "Eliquis 5mg BID",
      "Jardiance 10mg daily",
      "Atorvastatin 40mg daily",
    ],
    allergies: ["Sulfa — rash"],
    recentLabs: [
      { date: "2026-04-01", name: "BNP", value: "200 (normal)" },
      { date: "2026-04-01", name: "BMP", value: "Cr 1.4, K 4.0, eGFR 42" },
      { date: "2026-03-15", name: "INR", value: "N/A — on DOAC" },
    ],
    recentProcedures: [
      {
        date: "2025-11-04",
        name: "Echocardiogram (LVEF 50%, moderate MR)",
        provider: "Voronova NP",
      },
    ],
    recentNotes: [
      {
        date: "2026-03-12",
        author: "Voronova NP",
        summary:
          "Cardiology follow-up. Amlodipine reduced 10mg → 5mg due to peripheral edema. Continue carvedilol, spironolactone, eliquis, Jardiance. Recheck home BPs.",
      },
      {
        date: "2026-02-08",
        author: "Voronova NP",
        summary:
          "Routine cardiology visit. AFib well-controlled. Edema noted in lower extremities — counseled on leg elevation and compression.",
      },
    ],
  },
  assessment: [
    {
      id: "q1",
      inputType: "number_unit",
      unit: "mmHg systolic",
      text: "What was your highest home blood pressure reading this week?",
    },
    {
      id: "q2",
      inputType: "single_select",
      text: "Have you been taking your blood pressure at consistent times of day?",
      options: ["Yes — morning", "Yes — evening", "Yes — both", "Inconsistent"],
      followUp: {
        condition: ["Inconsistent"],
        inputType: "free_text",
        text: "Roughly when have you been checking?",
      },
    },
    {
      id: "q3",
      inputType: "single_select",
      text: "Have you taken your eliquis, carvedilol, and spironolactone every day this week?",
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
      text: "Is the swelling in your feet and ankles new or worse since the dose change?",
      followUp: {
        condition: ["Yes"],
        inputType: "single_select",
        text: "Where is the swelling?",
        options: ["Feet only", "Ankles only", "Both feet and ankles", "Up to calves"],
      },
    },
    {
      id: "q5",
      inputType: "yesno",
      text: "Any chest pain, palpitations, or shortness of breath?",
      followUp: { condition: ["Yes"], inputType: "free_text", text: "Describe" },
    },
    {
      id: "q6",
      inputType: "yesno",
      text: "When does the fuzzy thinking happen most? Have you fallen or come close to falling?",
      followUp: {
        condition: ["Yes"],
        inputType: "free_text",
        text: "Tell us more — when, how often, what triggers it",
      },
    },
  ],
  mockResponses: {
    q1: { value: "158", unit: "mmHg systolic" },
    q2: { value: "Inconsistent", followUp: "Mostly mornings, but skipped a few afternoons." },
    q3: { value: "Some missed", followUp: "Missed 2 doses of carvedilol earlier this week." },
    q4: { value: "Yes", followUp: "Both feet and ankles" },
    q5: { value: "No" },
    q6: {
      value: "Yes",
      followUp:
        "Fuzzy thinking mostly in the afternoon. Hasn't fallen but felt unsteady standing up twice this week.",
    },
    notes:
      "Worst BP this week 158/92. Patient says she's trying to be more consistent with timing. No new OTC meds.",
  },
  sbar: {
    s:
      "81 y/o female with HTN/AFib/CAD/MR/CKD calls reporting BP \"still high\" with bilateral foot/ankle swelling and fuzzy thinking after amlodipine reduced 10→5mg in 3/2026.",
    b:
      "Amlodipine 5mg daily (reduced 3/2026 for peripheral edema). Also on carvedilol, spironolactone, eliquis, Jardiance. BNP 4/1 normal at 200. Cr 1.4, eGFR 42. Last echo LVEF 50% with moderate MR. Patient missed 2 doses of carvedilol this week.",
    a:
      "Worst home BP 158/92. Persistent peripheral edema (bilateral feet + ankles) despite amlodipine dose reduction. New-onset afternoon fuzzy thinking and unsteadiness on standing — concerning for orthostasis vs medication side effect. Partial adherence (carvedilol). No CP/SOB/palpitations.",
    r:
      "Recommend cardiology evaluation. Considerations: discontinue vs further reduce amlodipine given persistent edema, reinforce carvedilol adherence, repeat orthostatic vitals, consider Holter for AFib monitoring. Awaiting your direction on med changes.",
  },
  routing: {
    recipient: "Voronova NP",
    pool: "P Phs Mob Cardiology Support Staff Pool",
    comment:
      "BP/edema/fuzzy thinking after amlodipine taper. SBAR attached. Awaiting your clinical direction.",
    priority: "Normal",
  },
  actionScripts: {
    // STAGE 1 — Generate Inquiry (chart-aware questions for Patient Call #1)
    "generate-inquiry": [
      { type: "state-transition", target: "card", newState: "drafting", delayMsBefore: 100 },
      { type: "banner", kind: "green", text: "Pulling chart context (.triage) — meds, BP trend, edema history…", durationMs: 1100 },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 500,
        content:
          "Patient called requesting callback re: amlodipine. Reports BP \"still high\" plus side effects (fuzzy thinking, feet swelling). PMH HTN/AFib/CAD/MR/CKD/peripheral edema, amlodipine reduced 3/2026 from 10mg to 5mg. Planning chart-aware triage prior to callback.",
      },
      {
        type: "pane-update",
        target: "phone-script",
        mode: "replace",
        typingSpeedCps: 75,
        delayMsBefore: 400,
        content:
          "Mrs. Klausen, this is Brandon from the Heart and Vascular Clinic. Thanks for calling earlier — Dr. Voronova asked me to gather some information from you before we make any decisions about your blood pressure medication.\n\n1. What times of day are you taking your home blood pressure?\n2. What were your last few readings? Highest and lowest, if you remember.\n3. Tell me about the swelling in your feet — is it new since the dose change, or has it always been there?\n4. The fuzzy thinking — when do you notice it most? Morning, evening, after standing?\n5. Any new chest pain, palpitations, shortness of breath?\n6. Any episodes where you felt like you might pass out, or actually did?\n7. Are you still taking your eliquis and metoprolol every day?\n8. How is your appetite and your fluid intake?\n9. Any new medications since your March visit, even over the counter?\n10. Have you fallen or come close to falling since the dose change?\n11. Any new numbness, tingling, or weakness?\n12. How are you sleeping?\n13. Any change in how often you are urinating?\n14. Any new pain anywhere?\n15. Anything else that has been bothering you that we have not talked about?\n16. Is there a phone number where Dr. Voronova should reach you back today?",
      },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
    // STAGE 2 — Process Reply (after Patient Call #1)
    "process-reply": [
      { type: "state-transition", target: "card", newState: "drafting", delayMsBefore: 100 },
      { type: "banner", kind: "green", text: "Folding patient answers + chart context into SBAR…", durationMs: 900 },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 500,
        content:
          "S: 81F with HTN/AFib/CAD/MR/CKD called concerned BP \"still high\" with fuzzy thinking + bilateral foot swelling, after amlodipine reduction 10→5mg in 3/2026.\n\nB: Home BPs reported 140/73, 124/71, 118/66 with inconsistent timing. Persistent peripheral edema despite dose reduction. NEW bilateral hand paresthesias not previously documented. Denies CP, SOB, palpitations. Positional dizziness longstanding. Compliant with eliquis + metoprolol. No new meds since 3/2026 visit. No falls.\n\nA: (1) Home BP readings largely at goal with one elevated reading; timing inconsistency limits interpretation. (2) Persistent peripheral edema despite amlodipine dose reduction. (3) New bilateral hand paresthesias not previously documented. (4) Patient expressing medication aversion which may impact long-term adherence.\n\nR: Forwarded to Dr. Voronova for review. Patient reachable today.",
      },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
    // STAGE 3 — Synthesize Callback Note (cross-note synthesis: primary + addendum)
    "synthesize-callback": [
      { type: "state-transition", target: "card", newState: "drafting", delayMsBefore: 100 },
      { type: "banner", kind: "green", text: "Cross-note synthesis: primary plan (3:25) + addendum (3:27) → unified callback…", durationMs: 1400 },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 600,
        content:
          "Spoke with patient by phone to relay plan per Voronova.\n\n1. Amlodipine discontinued.\n2. Continue carvedilol, spironolactone, and Jardiance as prescribed.\n3. BNP from 4/1/2026 normal at 200.\n4. Holter monitor pending for AFib follow-up with recent carvedilol increase.\n5. Patient instructed to keep home BP log x 1 week following amlodipine discontinuation and report swelling status in 1 week.\n6. Patient advised that alternative antihypertensive may be considered based on BP readings off amlodipine.\n\nPatient contacted via phone.",
      },
      {
        type: "pane-update",
        target: "phone-script",
        mode: "replace",
        typingSpeedCps: 75,
        delayMsBefore: 400,
        content:
          "Mrs. Klausen, this is Brandon from the Heart and Vascular Clinic, calling back with what Dr. Voronova wants to do next.\n\nFirst, the plan: stop amlodipine completely. Continue carvedilol, spironolactone, and Jardiance exactly as you have been taking them.\n\nA few things for context. Your BNP from April 1st was normal at 200, which is reassuring on the heart-failure side. Dr. Voronova has a Holter monitor lined up for you to keep an eye on your heart rhythm now that the carvedilol is at the new dose.\n\nWhat I will need from you: keep your home blood pressure log for one more week after stopping amlodipine, and let us know if the swelling gets better or worse over the same week.\n\nIf the readings come back uncontrolled, Dr. Voronova may swap to a different blood pressure medication. We will not be making that decision today — we want to see what your numbers do without amlodipine first.\n\nDo you have any questions?",
      },
      { type: "banner", kind: "yellow", text: "Cross-note: addendum overrides primary on 0 items. Plan items 3+4 sourced from addendum.", durationMs: 1600, delayMsBefore: 200 },
      {
        type: "pane-update",
        target: "order-pad",
        mode: "instant",
        delayMsBefore: 300,
        content: {
          orders: [
            {
              type: "Discontinue amlodipine 5mg daily",
              reason: "Persistent peripheral edema; BP variable",
              associatedDx: ["Essential hypertension", "Peripheral edema"],
              priority: "Routine",
              class: "Medication change",
              status: "Active",
              expectedDate: "2026-04-29",
              cosign: "Voronova",
              auditTrail: "discontinuing per Voronova after Pattern 7b SBAR review",
            },
            {
              type: "Continue carvedilol, spironolactone, Jardiance — no change",
              reason: "established regimen, recent carvedilol uptitration",
              associatedDx: ["Atrial fibrillation", "HFrEF"],
              priority: "Routine",
              class: "Medication continuation",
              status: "Active",
              cosign: "Voronova",
            },
            {
              type: "Holter monitor (24h ambulatory ECG)",
              codeVariant: "HOLTER STERNE BR",
              reason: "AFib monitoring after carvedilol increase",
              associatedDx: ["Atrial fibrillation"],
              priority: "Routine",
              class: "Ancillary Performed",
              status: "Future",
              expectedDate: "2026-05-06 First Available",
              clinicalQuestions: [],
              cosign: "Voronova",
            },
          ],
          hasUnansweredQuestions: false,
        },
      },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote: "[As drafted in synthesize-callback]",
    phoneScript: "[As drafted in synthesize-callback]",
    orders: [
      "DC amlodipine 5mg",
      "Continue carvedilol/spironolactone/Jardiance",
      "Holter monitor — Future 5/6",
    ],
    dxAssociated: ["Essential hypertension", "Atrial fibrillation", "HFrEF"],
  },
};

export default fixture;
