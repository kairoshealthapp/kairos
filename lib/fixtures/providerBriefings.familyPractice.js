// Provider surface — family practice briefings.
// Daugherty (fp-t2dm-uncontrolled) is the FP tour anchor patient and
// carries a full 12-section briefing. The remaining 6 FP visits carry
// minimal briefings (who / why / problems / meds / care gaps) so the
// drawer renders cleanly when a viewer clicks any FP card. All
// demonstration data; all names fictional.

const FAMILY_PRACTICE_BRIEFINGS = {
  // ── Albert Ridgway — 67yo M, HTN + T2DM + tobacco ──
  "fp-htn-t2dm-tobacco": {
    kind: "routine",
    whoThisIs:
      "67yo M, established with this practice 8 years. Lives outside town with spouse; spouse drives him to appointments. Medicare + supplemental. Worked construction until retirement at 65. Active smoker, ~1 PPD since age 20.",
    whyHereToday:
      "Three-month follow-up for hypertension and type 2 diabetes. Last BP at home logs running 150s/90s. Reports inhaler use up over the winter (mild cough, no spirometry on file).",
    activeProblems: [
      "Essential hypertension",
      "Type 2 diabetes mellitus",
      "Nicotine dependence (cigarettes)",
      "Hyperlipidemia",
    ],
    currentMedications: [
      { med: "lisinopril 20 mg daily", rationale: "HTN since 2018" },
      { med: "metformin 1000 mg BID", rationale: "T2DM since 2019" },
      { med: "atorvastatin 40 mg daily", rationale: "HLD; ASCVD primary prevention in T2DM" },
    ],
    longitudinalStory:
      "Last office visit 3 months ago — BP 152/94, A1c 8.6%. Tobacco cessation discussed; declined NRT. No pulmonary referral placed despite winter cough.",
    trendedData: {
      "Blood pressure": [
        "May 2026: 158/96",
        "Feb 2026: 152/94",
        "Nov 2025: 148/90",
      ],
      "Hemoglobin A1c": ["May 2026: 8.9%", "Feb 2026: 8.6%", "Nov 2025: 8.2%"],
      "LDL cholesterol": ["May 2026: 145", "Nov 2025: 138"],
    },
    allergies: "NKDA",
    patternsKairosSurfaces:
      "Lp(a) never measured — guideline calls for one-time measurement in adults. Apo-B not measured despite T2DM with LDL above goal. BP trend rising across last three measurements.",
    riskContext:
      "Active smoker, T2DM, uncontrolled HTN, age 67 — high 10-year ASCVD risk. Pack-year history qualifies for LDCT lung cancer screening.",
    careGaps: [
      "Tobacco cessation — counsel + offer pharmacotherapy",
      "LDCT lung cancer screening — never ordered",
      "Lp(a) — one-time measurement (USPSTF / AHA)",
      "Apo-B — T2DM with LDL above goal",
    ],
    kairosFlags: [
      "BP trend rising over three visits — current 158/96 above HEDIS CBP threshold",
      "A1c trend rising — consider second-line agent",
      "Smoker without LDCT eligibility check",
    ],
  },

  // ── Marlene Tipton — 58yo F, annual physical ──
  "fp-annual-screening-58f": {
    kind: "routine",
    whoThisIs:
      "58yo F, lives in town. Family of three. Schoolteacher. Established 12 years.",
    whyHereToday: "Annual physical. Wants to make sure she's up to date on screenings.",
    activeProblems: ["Essential hypertension"],
    currentMedications: [
      { med: "hydrochlorothiazide 25 mg daily", rationale: "HTN since 2021" },
    ],
    allergies: "NKDA",
    careGaps: [
      "Mammogram — last 3 years ago, due",
      "Colonoscopy — never done at age 58",
      "Lp(a) — one-time measurement never obtained",
    ],
    kairosFlags: [
      "Two HEDIS screening gaps and one universal lipid gap on the same visit",
    ],
  },

  // ── Hollis McCray — 71yo M, uncontrolled HTN ──
  "fp-uncontrolled-htn-71m": {
    kind: "routine",
    whoThisIs:
      "71yo M, retired farmer. Spouse deceased; lives alone. Drives himself. Established 20+ years.",
    whyHereToday: "Follow-up for hypertension. Home BP logs in the 160s.",
    activeProblems: ["Essential hypertension", "Osteoarthritis"],
    currentMedications: [
      { med: "amlodipine 5 mg daily", rationale: "HTN since 2014" },
    ],
    allergies: "NKDA",
    careGaps: [
      "BP uncontrolled — intensify therapy",
      "Lp(a) — one-time measurement never obtained",
      "Pneumococcal vaccine status — review",
    ],
    kairosFlags: [
      "Most recent BP 162/98 — well above HEDIS CBP threshold",
      "Single-agent therapy at age 71 — likely under-treated",
    ],
  },

  // ── Karen Brushwood — 50yo F, newly 50 ──
  "fp-annual-newly-50": {
    kind: "routine",
    whoThisIs: "50yo F, marketing professional. Two kids in college. Established 5 years.",
    whyHereToday: "Annual physical. Recently turned 50 — wants to know what's new.",
    activeProblems: ["Essential hypertension"],
    currentMedications: [
      { med: "hydrochlorothiazide 12.5 mg daily", rationale: "Mild HTN since 2023" },
    ],
    allergies: "NKDA",
    careGaps: [
      "First mammogram at 50 — not yet ordered",
      "First colonoscopy at 50 — not yet ordered",
      "Lp(a) — one-time measurement never obtained",
    ],
    kairosFlags: [
      "Two age-triggered screenings due this visit",
    ],
  },

  // ── Trevor Hampshire — 45yo M, newly 45 ──
  "fp-annual-newly-45": {
    kind: "routine",
    whoThisIs: "45yo M, owns a small auto shop in town. Married, three kids. Established 7 years.",
    whyHereToday: "Annual physical. No active complaints.",
    activeProblems: [],
    currentMedications: [],
    allergies: "NKDA",
    careGaps: [
      "First colorectal cancer screening at 45 — USPSTF recommendation",
      "Lp(a) — one-time measurement never obtained",
    ],
    kairosFlags: [
      "New 2021 USPSTF age threshold for colorectal screening — first eligible visit",
    ],
  },

  // ── Yvette Daugherty — 62yo F, T2DM A1c 10.2 — FP TOUR ANCHOR ──
  "fp-t2dm-uncontrolled": {
    kind: "routine",
    whoThisIs:
      "62yo F, established 9 years. Lives in town with adult daughter. Medicare + supplemental. Worked as a nursing aide, now part-time at the senior center.",
    whyHereToday:
      "Three-month follow-up for type 2 diabetes. A1c trend has been worsening across the last year. Recent labs show A1c 10.2%. UACR newly elevated; eGFR drifting down from baseline.",
    activeProblems: [
      "Type 2 diabetes mellitus with diabetic chronic kidney disease",
      "Essential hypertension",
      "Hyperlipidemia",
    ],
    currentMedications: [
      { med: "metformin 1000 mg BID", rationale: "T2DM since 2017" },
      { med: "lisinopril 10 mg daily", rationale: "HTN + renoprotective with albuminuria" },
    ],
    longitudinalStory: {
      lastVisit:
        "3 months ago — A1c 9.4%, eGFR 58, UACR 42. Diabetes education referral placed; statin discussion deferred. No SGLT2i started.",
      activitySince: [
        "Did not complete diabetes education program (transportation barrier noted)",
        "No outside ED or admission",
        "Picked up metformin and lisinopril refills on schedule",
      ],
      didTheyDoWhatWeAsked:
        "Adherent to current meds but did not attend diabetes education. Reports she is willing to try a new pill if it doesn't cost much.",
    },
    trendedData: {
      "Hemoglobin A1c": [
        "May 2026: 10.2%",
        "Feb 2026: 9.4%",
        "Nov 2025: 8.6%",
        "May 2025: 7.9%",
      ],
      "eGFR (CKD-EPI 2021)": [
        "May 2026: 52",
        "Feb 2026: 58",
        "Nov 2025: 64",
      ],
      "Urine albumin/creatinine ratio": [
        "May 2026: 84 mg/g",
        "Feb 2026: 42 mg/g",
      ],
      "LDL cholesterol": [
        "May 2026: 168",
        "Feb 2026: 162",
      ],
      "Blood pressure": [
        "May 2026: 136/84",
        "Feb 2026: 138/86",
      ],
    },
    allergies: "NKDA",
    patternsKairosSurfaces:
      "Multiple rules fire on this chart: T2DM age 40-75 not on statin (ADA + ACC/AHA both fire — convergent evidence); T2DM with CKD stage 3a and albuminuria not on SGLT2i (ADA/KDIGO); apo-B not measured in T2DM with LDL above goal; Lp(a) never measured. CKD progression visible across the last three eGFR measurements.",
    riskContext:
      "Worsening glycemic control + early renal decline + albuminuria + uncontrolled lipids — high cardio-renal risk over the next 12 months. Transportation barrier noted as adherence risk.",
    careGaps: [
      "Start moderate-intensity statin (ADA grade A; convergent ACC/AHA Class I)",
      "Start SGLT2i (empagliflozin or dapagliflozin) — T2DM + CKD + albuminuria",
      "Apo-B measurement — T2DM with LDL above goal",
      "Lp(a) — one-time measurement never obtained",
      "Diabetes education referral — close the transportation barrier",
    ],
    kairosFlags: [
      "T2DM + CKD3a + albuminuria + no SGLT2i — cardio-renal protective gap",
      "Statin-eligible (ADA + ACC/AHA both fire) and currently untreated",
      "A1c trajectory rising for 4 consecutive quarters — second-line agent overdue",
      "Care-plan adherence risk: missed prior diabetes education referral, transportation cited",
    ],
  },

  // ── Loretta Birch — 56yo F, HLD + HTN ──
  "fp-hld-htn-6mo": {
    kind: "routine",
    whoThisIs: "56yo F, accountant. Two adult kids out of state. Established 10 years.",
    whyHereToday: "Six-month follow-up for HTN and hyperlipidemia. Reports she's been walking 30 minutes most days.",
    activeProblems: ["Essential hypertension", "Hyperlipidemia"],
    currentMedications: [
      { med: "lisinopril 10 mg daily", rationale: "HTN since 2017" },
      { med: "atorvastatin 20 mg daily", rationale: "Primary prevention HLD" },
    ],
    allergies: "NKDA",
    careGaps: [
      "BP borderline (142/88) — confirm with home log",
      "Lp(a) — one-time measurement never obtained",
      "Mammogram — review interval",
    ],
    kairosFlags: [
      "BP at HEDIS CBP threshold — confirm before intensifying",
    ],
  },
};

export default FAMILY_PRACTICE_BRIEFINGS;
