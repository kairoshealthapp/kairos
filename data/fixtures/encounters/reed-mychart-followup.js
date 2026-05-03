// v3.0 Fix 1d — child card for Reed (underwell-full-lifecycle) MyChart
// triage path. After the nurse sends the assessment questions via
// MyChart, the patient replies. This fixture represents what lands in
// the inbox when their answers come back: source pane shows the
// patient's responses, RN Note panel is already drafted as a full
// SBAR, MyChart panel has a pre-drafted follow-up message.
//
// In production, this would be auto-spawned by the platform when the
// patient's MyChart reply is received. For the demo, it's a static
// fixture that lives next to the parent in the same patientcall basket.

const fixture = {
  id: "reed-mychart-followup",
  slug: "reed-mychart-followup",
  patternId: "1",
  patternName: "SYNTHESIS only (triage follow-up — child card)",
  tab: "patientcall",
  urgency: "amber",
  sourceChannel: "mychart-reply",
  sourceBox: "patient-call",
  mychartStatus: "Active",
  receivedAt: "2026-05-03T14:38:00Z",
  card: {
    subject: "Patient reply — assessment responses received",
    kicker: "PATIENT CALL · TRIAGE FOLLOW-UP",
    severity: "amber",
  },
  patient: {
    name: "Reed, Barbara",
    displayName: "Barbara Reed",
    age: 81,
    sex: "F",
    dob: "1944-11-12",
    mrn: "M000071205",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B + BCBS supplement",
  },
  // The child-card breadcrumb the source pane surfaces — points back
  // at the parent triage card so the nurse can see where this came
  // from.
  parentCardRef: {
    fixtureId: "underwell-full-lifecycle",
    sentAt: "2026-05-03 09:14",
    summary: "Triage assessment sent via MyChart 5/3 09:14 — patient replied 14:38",
  },
  sourceArtifact: {
    type: "MyChart Reply",
    author: "Barbara Reed (patient)",
    timestamp: "2026-05-03 14:38",
    body:
      "Follow-up from triage assessment sent 5/3 at 09:14.\n\nPatient's replies:\n\n1. Highest home BP this week: \"158 over 92, that was Tuesday morning.\"\n\n2. Are you taking your BP at consistent times: \"Mostly mornings, but I skipped a few afternoons. I forget when the afternoon gets busy.\"\n\n3. Have you taken your eliquis, carvedilol, spironolactone every day this week: \"I missed two doses of the carvedilol — the small white one. The other two I have been good about.\"\n\n4. Is the swelling in your feet and ankles new or worse since the dose change: \"It's about the same — both ankles, not better, not worse.\"\n\n5. Any chest pain, palpitations, or shortness of breath: \"No chest pain. No racing. Maybe a little more winded going up the stairs but nothing scary.\"\n\n6. When does the fuzzy thinking happen most, and have you fallen or come close to falling: \"It's worst in the afternoons. I had to grab the counter once on Wednesday but didn't fall.\"",
  },
  // v3.0 — conditional panel declaration. The AI has already
  // synthesized the SBAR from the patient's replies + chart context;
  // the nurse reviews and forwards.
  panels: ["rnNote", "myChart"],
  panelContent: {
    rnNote:
      "S — Situation\n81 y/o female with HTN/AFib/CAD/MR/CKD replied to MyChart triage assessment 5/3 14:38 (assessment sent 5/3 09:14). Reports BP 158/92 highest this week, persistent bilateral foot/ankle swelling, two missed carvedilol doses, and afternoon fuzzy thinking with one near-fall on Wednesday.\n\nB — Background\nAmlodipine 5mg daily (reduced 3/2026 from 10mg for peripheral edema). Also on carvedilol, spironolactone, eliquis, Jardiance. BNP 4/1 normal at 200. Cr 1.4, eGFR 42. Last echo LVEF 50% with moderate MR.\n\nA — Assessment\nWorst home BP 158/92. Persistent bilateral peripheral edema (feet + ankles) — unchanged since amlodipine reduction. Partial adherence: 2 missed carvedilol doses this week. Afternoon fuzzy thinking with one near-fall (caught herself on counter Wednesday afternoon) — concerning for orthostasis vs medication-timing side effect. No CP, palpitations, or significant SOB. Patient inconsistent on afternoon BP checks.\n\nR — Recommendation\nForward to provider for review. Considerations: (1) discontinue vs further reduce amlodipine given persistent edema, (2) reinforce carvedilol adherence (perhaps a fill-the-pillbox conversation or app reminder), (3) repeat orthostatic vitals at next visit given near-fall, (4) consider Holter for AFib monitoring, (5) ask patient to log afternoon BP for the next 7 days. No urgent symptoms requiring same-day phone callback.",
    myChart:
      "Mrs. Reed,\n\nThank you for the detailed answers — that's exactly what we needed.\n\nA few things stood out and I've sent everything over to your provider for review:\n- Your highest BP this week (158/92) is a bit above goal\n- The swelling hasn't improved with the dose change\n- The afternoon fuzzy thinking and the near-fall on Wednesday are worth a closer look — those can sometimes be related to how medication doses line up with the time of day\n- The two missed carvedilol doses are good to know — we'll talk through ways to make that easier\n\nWhat to do for now:\n- Continue all your current medications exactly as prescribed (don't stop anything on your own)\n- Try to get an afternoon BP reading each day for the next week if you can — that will help us see the full picture\n- If the fuzzy thinking gets worse, or if you fall or come close to falling again, call the clinic the same day\n\nWhat's next: Your provider will review everything today or tomorrow and decide on any medication changes. We'll send you a follow-up message with the plan, usually within 1-2 business days.\n\nFor severe chest pain, severe shortness of breath, fainting, or any fall with injury — call 911 right away, don't wait for our reply.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
  },
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  actionScripts: {},
  finalSignedState: {
    nurseNote: "[As drafted above]",
    mychartMessage: "[As drafted above]",
    orders: [],
    dxAssociated: ["Essential hypertension", "Heart failure with preserved ejection fraction"],
  },
};

export default fixture;
