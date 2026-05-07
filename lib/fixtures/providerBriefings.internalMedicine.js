// Provider surface — internal medicine briefings keyed by briefingId.
// Schema is the universal 12-section structure. Whitestone (8:40 AM
// CHF exacerbation) is the fully-authored deep card; remaining cards
// have sections 1-8 mapped from prior fixture content where possible
// and sections 9-12 carry scaffolding text indicating specialty
// authoring is pending. All names and findings are fictional. NO PHI.

const SCAFFOLD_PATTERNS =
  "Specialty clinical authorship pending for this visit type. Pattern surfacing requires internal-medicine reasoning authored by your specialty team.";
const SCAFFOLD_RISK =
  "Risk context not yet authored for this visit type. Internal-medicine risk framing requires specialty input.";
const SCAFFOLD_GAPS =
  "Care gaps not yet authored for this visit type. Internal-medicine gap detection requires specialty input.";
const SCAFFOLD_FLAGS = [
  "Specialty authoring pending — no items flagged for this visit type yet.",
];
const ALLERGY_DEFAULT = "NKDA. Allergy reconciliation not yet authored for this visit type.";

const INTERNAL_MEDICINE_BRIEFINGS = {
  // ─── DEEP CARD · 8:40 AM — Howard Whitestone, CHF exacerbation ─────
  "im-chf-exac": {
    kind: "postHospital",

    whoThisIs:
      "Howard Whitestone, 71-year-old male. Lives with spouse Eleanor (primary support, healthcare decision-maker). Retired teacher. Medicare + supplemental. English. No documented social barriers. Independent ADLs.",

    whyHereToday:
      "Post-Hospital Visit. Follow-up after 5-day admission for acute decompensated heart failure. First HF hospitalization. Patient has multiple chronic conditions managed in primary care — HFrEF newly added.",

    activeProblems: [
      "HFrEF, EF 35% (newly diagnosed at admission)",
      "Type 2 diabetes mellitus (A1c 7.6 most recent)",
      "Hypertension (controlled)",
      "Stage 3a CKD (eGFR 52, baseline)",
      "Hyperlipidemia (on statin)",
      "Osteoarthritis (chronic NSAID use prior to admission — now stopped)",
    ],

    currentMedications: {
      preamble: "Discharge meds (per pharmacy fill data):",
      items: [
        { med: "Furosemide 40mg daily", rationale: "new" },
        { med: "Carvedilol 12.5mg BID", rationale: "new, beta blocker" },
        { med: "Lisinopril 10mg daily", rationale: "continued" },
        { med: "Atorvastatin 40mg daily", rationale: "continued" },
        { med: "Metformin 1000mg BID", rationale: "continued" },
        { med: "Spironolactone 25mg daily", rationale: "new" },
        {
          med: "Acetaminophen 650mg PRN pain",
          rationale: "new — replacing chronic NSAID",
        },
      ],
      note: "SGLT2 inhibitor not started. ARNI not initiated. Pre-admission: lisinopril, atorvastatin, metformin, ibuprofen 600mg TID PRN (chronic, daily use). Pharmacy data confirms all discharge meds filled. Ibuprofen prescription discontinued and not refilled.",
    },

    longitudinalStory: {
      lastVisit:
        "Last visit with us (3 months ago, primary care): Routine chronic disease management. BP 138/84. Diabetes stable. Patient mentioned increasing knee pain managing with ibuprofen. Plan: continue current regimen, recheck in 3 months.",
      activitySince: [
        "4/24/2026 — Phelps Health admission (acute decompensated heart failure, 5-day stay)",
        "5/1/2026 — Discharge to home",
        "5/2/2026 — All discharge meds filled",
        "4/15/2026 — Outside cardiology consult arranged by ED 9 days before admission, per Care Everywhere — note in Media tab",
      ],
      didTheyDoWhatWeAsked:
        "Diabetes management compliant. NSAID use was self-directed for OA pain management — patient was not previously aware of HF risk.",
      pendingFromInpatient:
        "Outpatient cardiology referral. Daily weight monitoring started. Echocardiogram repeat at 3 months. BMP in 1 week (post-diuresis renal recheck).",
    },

    trendedData: {
      "EF": "First documented at 35% (this admission). No prior echo on file.",
      "BNP at admission": "1840 (peak), 620 at discharge",
      "Creatinine": "1.3 baseline → 1.6 admission peak → 1.4 discharge. eGFR 52 baseline.",
      "A1c": "7.4 (1 year ago) → 7.6 (recent)",
      "Lipids 6 months ago": "LDL 88 on atorvastatin 40mg",
      "BP at discharge": "118/72 on combined antihypertensive regimen",
      "Weight": "198 lbs at discharge, baseline 192 lbs (6 lbs over baseline)",
    },

    hospitalCourse: {
      summary:
        "5-day admission for acute decompensated heart failure. IV diuresis, net negative 7L. No ICU.",
      procedures: [
        { name: "CXR", rationale: "pulmonary edema" },
        {
          name: "Echocardiogram",
          rationale: "EF 35%, mild LVH",
        },
        { name: "Serial BNP", rationale: "diuresis response" },
        { name: "Comprehensive metabolic panels", rationale: "renal trending" },
      ],
      medChanges: {
        added: [
          { med: "furosemide 40mg" },
          { med: "carvedilol 12.5mg BID" },
          { med: "spironolactone 25mg" },
          { med: "acetaminophen PRN" },
        ],
        stopped: [
          {
            med: "ibuprofen",
            rationale: "chronic use, identified as HF precipitant",
          },
        ],
        adjusted: [
          { med: "lisinopril continued at 10mg" },
        ],
      },
      significantFindings:
        "BNP peaked 1840, discharged at 620. EF 35% (no prior echo). Creatinine bumped to 1.6 with diuresis, recovering. NSAIDs identified as likely contributor to decompensation.",
      consultRecommendations: [
        "Outpatient cardiology referral.",
        "SGLT2i initiation outpatient (insurance auth pending).",
        "ARNI consideration if symptoms persist on optimized therapy.",
        "NSAIDs avoidance counseled.",
      ],
      pendingAtDischarge: [
        "BMP in 1 week",
        "follow-up echo at 3 months",
        "SGLT2i prior auth",
        "outpatient cardiology appointment",
        "weight log",
      ],
      outsideData:
        "4/15/2026 outside cardiology consult note in Media tab — scanned PDF, requires App Orchard for full extraction.",
    },

    allergies: "NKDA. NSAID intolerance now documented (HF precipitant).",

    patternsKairosSurfaces:
      "Newly diagnosed HFrEF, EF 35%. Patient on three of four GDMT pillars: ACE inhibitor (lisinopril), beta blocker (carvedilol), MRA (spironolactone). SGLT2 inhibitor not started — fourth pillar of guideline-directed therapy for HFrEF regardless of diabetes status. Patient has T2DM, which strengthens SGLT2i indication for both HF and glycemic benefit. ARNI (sacubitril/valsartan) consideration in place of ACE inhibitor is part of current heart failure guidelines for symptomatic HFrEF when ACE inhibitor is tolerated. Worth discussing at follow-up. Chronic NSAID use prior to admission is a recognized HF precipitant. Counseling completed during admission. Acetaminophen substituted for OA pain management. Furosemide 40mg starting dose with renal function monitoring is appropriate. Post-discharge BMP in 1 week is standard.",

    riskContext:
      "First HF hospitalization is a vulnerable period. 30-day readmission risk after first HF admission is substantial. Multiple comorbidities (T2DM, CKD, HTN, OA) increase 30-day readmission risk. Stage 3a CKD will shape SGLT2i and MRA dosing decisions; current eGFR 52 supports both. OA pain management without NSAIDs requires planning. Acetaminophen alone may be insufficient for chronic management — referral to PT, intra-articular options, or pain specialist may be needed.",

    careGaps: [
      "SGLT2 inhibitor not started — fourth pillar of HFrEF therapy with dual indication given diabetes.",
      "Outpatient cardiology appointment confirmation worth checking today.",
      "Daily weight log compliance worth confirming. Sodium restriction counseling reinforcement.",
      "Pneumococcal and influenza vaccination status not documented.",
      "Diabetic eye exam status — last documented 18 months ago.",
      "Long-term OA pain management plan needs development beyond acetaminophen.",
    ],

    kairosFlags: [
      "SGLT2 inhibitor not started despite HFrEF + T2DM (dual indication).",
      "NSAID use prior to admission identified as HF precipitant — counseling reinforcement worth doing today.",
      "First HF hospitalization — 30-day readmission risk elevated.",
      "ARNI consideration if symptomatic on current GDMT.",
      "OA pain management plan beyond acetaminophen needs development.",
      "Outside cardiology note in Media tab worth reviewing for prior workup details.",
    ],
  },

  // ─── 9:00 AM — Beauchamp DM2 + CKD 3mo ─────────────────────────────
  "im-dm2-ckd-3mo": {
    kind: "routine",
    whoThisIs: "Sandra Beauchamp, 64F.",
    whyHereToday: "Follow Up · DM2 + CKD 3mo. Type 2 DM with CKD stage 3a.",
    activeProblems: ["Type 2 DM", "CKD stage 3a", "HTN"],
    currentMedications: ["metformin 1000mg BID", "empagliflozin 10mg daily", "lisinopril 10mg daily"],
    longitudinalStory:
      "Type 2 DM with CKD stage 3a. Last A1c 7.6.",
    trendedData: "Cr 1.3 (eGFR 48). A1c 7.6.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 9:20 AM — Polchinski Annual Physical ──────────────────────────
  "im-annual-physical": {
    kind: "routine",
    whoThisIs: "Anthony Polchinski, 52M.",
    whyHereToday: "Annual Physical. No active chronic conditions.",
    activeProblems: ["No active chronic conditions on chart"],
    currentMedications: ["—"],
    longitudinalStory: "No active chronic conditions. Annual physical visit type.",
    trendedData:
      "Last lipid panel 4 years ago. Colonoscopy due (last 10 years ago). Tdap booster due.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext:
      "Family history of premature CAD (father MI at 54). " + SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 9:40 AM — Peltier HTN 6mo ─────────────────────────────────────
  "im-htn-6mo": {
    kind: "routine",
    whoThisIs: "Janet Peltier, 58F.",
    whyHereToday: "Follow Up · HTN 6mo. On lisinopril + amlodipine, well controlled.",
    activeProblems: ["Essential HTN"],
    currentMedications: ["lisinopril 20mg daily", "amlodipine 5mg daily"],
    longitudinalStory:
      "Hypertension on lisinopril + amlodipine, well controlled. Home BP averaging 124/76.",
    trendedData: "BMP normal, K 4.2.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 10:00 AM — Wojciechowski multichronic 1mo ────────────────────
  "im-multichronic-1mo": {
    kind: "routine",
    whoThisIs: "Stanley Wojciechowski, 79M.",
    whyHereToday: "Follow Up · multiple chronic 1mo. DM2, HTN, HFpEF, CKD, AFib.",
    activeProblems: ["Type 2 DM", "HTN", "HFpEF", "CKD stage 3", "AFib"],
    currentMedications: [
      "metformin 1000mg BID",
      "apixaban 5mg BID",
      "metoprolol 50mg daily",
      "lisinopril 10mg daily",
      "atorvastatin 40mg daily",
      "furosemide 20mg daily",
    ],
    longitudinalStory:
      "Multiple chronic conditions — DM2, HTN, HFpEF, CKD, AFib. Last visit 1 month ago.",
    trendedData: "BMP, A1c, BNP all stable.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 10:20 AM — Sundgren transfer of care ──────────────────────────
  "im-new-transfer": {
    kind: "routine",
    whoThisIs:
      "Caroline Sundgren, 45F. New patient. History of migraine, anxiety, prior cholecystectomy. Smoker, 5 pack-years.",
    whyHereToday: "New Patient · transfer of care. Establish primary care.",
    activeProblems: ["Migraine", "Generalized anxiety disorder", "S/p cholecystectomy"],
    currentMedications: ["—"],
    longitudinalStory:
      "Care Everywhere pulled FHIR data: medication list, problem list, last 3 visit notes. Imaging and labs partial — older studies in scanned PDF format, Media tab callout, requires App Orchard for full extraction.",
    trendedData: "Recent normal mammogram at outside system. Most recent A1c not on transferred records. Pap smear status unclear.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 10:40 AM — Ostrowski UTI + sepsis + AKI ───────────────────────
  "im-uti-sepsis-aki": {
    kind: "postHospital",
    whoThisIs: "Lillian Ostrowski, 68F.",
    whyHereToday:
      "Post-Hospital Visit. Follow-up after 4-day admission for urosepsis with stage 2 AKI.",
    activeProblems: [
      "Urosepsis (resolved)",
      "Stage 2 AKI (resolving — discharge Cr 1.3, baseline 1.0)",
      "Recurrent UTI pattern (4 in 12 months)",
    ],
    currentMedications: {
      items: [
        {
          med: "ciprofloxacin completed (10-day, sensitivities-driven)",
        },
        {
          med: "lisinopril restarted at HALF dose",
          rationale: "renal recovery, monitoring plan",
        },
        {
          med: "metformin restarted",
          rationale: "contingent on renal recovery",
        },
      ],
      note: "NSAIDs counseled to avoid post-AKI.",
    },
    longitudinalStory:
      "4-day admission for urosepsis with stage 2 AKI. Peak Cr 2.8 from baseline 1.0. IV antibiotics, IV fluids.",
    trendedData: {
      "Urine culture": "E. coli, cipro-sensitive",
      "Renal US": "no obstruction",
      "Cr": "baseline 1.0 → peak 2.8 → discharge 1.3 (not yet baseline)",
    },
    hospitalCourse: {
      summary:
        "4-day admission for urosepsis with stage 2 AKI. Peak Cr 2.8 from baseline 1.0. IV antibiotics, IV fluids.",
      procedures: [
        { name: "Blood cultures", rationale: "sepsis workup" },
        { name: "Urine cultures", rationale: "organism + sensitivities" },
        { name: "Renal ultrasound", rationale: "no obstruction" },
        { name: "CT abdomen/pelvis", rationale: "rule out abscess" },
      ],
      medChanges: {
        added: [
          {
            med: "completed 10-day ciprofloxacin (sensitivities-driven), transitioned to oral",
            rationale: "treatment course completion",
          },
        ],
        stopped: [
          { med: "NSAIDs counseled", rationale: "AKI prevention" },
        ],
        adjusted: [
          {
            med: "lisinopril held during admission, restarted at HALF dose at discharge with monitoring plan",
            rationale: "renal recovery",
          },
          {
            med: "metformin held during AKI, restarted at discharge contingent on renal recovery",
            rationale: "AKI safety",
          },
        ],
      },
      significantFindings:
        "Urine culture grew E. coli, cipro-sensitive. Renal US no obstruction. Discharge Cr 1.3 (not yet baseline).",
      consultRecommendations: [
        "Nephrology recommended outpatient follow-up if Cr doesn't return to baseline within 4 weeks.",
      ],
      pendingAtDischarge: [
        "BMP in 1 week (renal recovery check)",
        "urinalysis",
        "recurrent UTI workup if pattern continues",
      ],
      outsideData:
        "3 prior UTI visits at outside urgent care over past 12 months — Media tab callout for outside records.",
    },
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: [
      "4 UTIs in 12 months — recurrent UTI workup indicated.",
      "AKI not fully resolved at discharge.",
      "Lisinopril restart at half dose needs titration.",
      "Metformin restart contingent on renal recovery — monitor.",
    ],
  },

  // ─── 11:00 AM — Threlkeld Medicare Wellness Visit ──────────────────
  "im-medicare-wellness": {
    kind: "routine",
    whoThisIs: "Edgar Threlkeld, 73M.",
    whyHereToday: "Medicare Wellness Visit. Annual AWV.",
    activeProblems: ["Hypertension (controlled)", "Hyperlipidemia (at goal)"],
    currentMedications: ["—"],
    longitudinalStory:
      "Hypertension well controlled, hyperlipidemia at goal.",
    trendedData:
      "Lipid panel and BMP within last 6 months. Pneumococcal vaccine due (PCV20 indicated). Cognitive assessment for AWV. Advance directive update.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext:
      "Falls risk screen due. Depression PHQ-2 due. " + SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 11:20 AM — Bayfield DM2 3mo ───────────────────────────────────
  "im-dm2-3mo": {
    kind: "routine",
    whoThisIs: "Curtis Bayfield, 56M.",
    whyHereToday: "Follow Up · DM2 3mo. On metformin + GLP-1.",
    activeProblems: ["Type 2 DM", "Obesity"],
    currentMedications: ["metformin 1000mg BID", "semaglutide 1mg weekly"],
    longitudinalStory:
      "Type 2 DM, A1c 7.2 last visit. Down 12 lbs since starting GLP-1.",
    trendedData: "A1c due today.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 1:00 PM — Krzyzanowski routine 1mo ────────────────────────────
  "im-routine-1mo-krzyzanowski": {
    kind: "routine",
    whoThisIs: "Helen Krzyzanowski, 81F.",
    whyHereToday: "Follow Up · 1mo. HTN, HLD, MCI.",
    activeProblems: ["HTN", "HLD", "MCI"],
    currentMedications: [
      "amlodipine 5mg daily",
      "atorvastatin 20mg daily",
      "donepezil 5mg daily",
    ],
    longitudinalStory:
      "81F with HTN, hyperlipidemia, mild cognitive impairment. Daughter reports stable cognition.",
    trendedData: "BMP and CBC normal.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 1:20 PM — Eldridge DKA ────────────────────────────────────────
  "im-dka": {
    kind: "postHospital",
    whoThisIs: "Marcus Eldridge, 60M.",
    whyHereToday:
      "Post-Hospital Visit. Follow-up after 3-day admission for diabetic ketoacidosis.",
    activeProblems: [
      "Type 2 DM (post-DKA)",
      "Recurrent DKA (2nd in 18 months)",
    ],
    currentMedications: {
      items: [
        { med: "insulin glargine 30 units qHS", rationale: "basal coverage" },
        {
          med: "insulin lispro sliding scale with meals",
          rationale: "prandial coverage",
        },
        { med: "metformin continued", rationale: "tolerated through admission" },
      ],
    },
    longitudinalStory:
      "3-day admission for diabetic ketoacidosis. ICU x1 day for insulin drip. Triggered by missed insulin doses + viral illness.",
    trendedData: {
      "A1c": "11.4 (up from 8.2 six months ago)",
      "Anion gap": "closed by hospital day 2",
      "Discharge glucose": "180s",
    },
    hospitalCourse: {
      summary:
        "3-day admission for diabetic ketoacidosis. ICU x1 day for insulin drip. Triggered by missed insulin doses + viral illness.",
      procedures: [
        {
          name: "Comprehensive metabolic panels q4h initially",
          rationale: "anion gap closure tracking",
        },
        { name: "ABG", rationale: "acidosis severity" },
        { name: "Urine ketones", rationale: "DKA confirmation" },
      ],
      medChanges: {
        added: [
          { med: "insulin glargine 30 units qHS", rationale: "basal coverage" },
          {
            med: "insulin lispro sliding scale with meals",
            rationale: "prandial coverage",
          },
        ],
        stopped: [],
        adjusted: [
          {
            med: "metformin continued, dose unchanged",
            rationale: "tolerated through admission",
          },
        ],
      },
      significantFindings:
        "A1c 11.4 (up from 8.2 six months ago). Anion gap closed by hospital day 2. Discharge glucose 180s.",
      consultRecommendations: [
        "Endocrinology recommended diabetes education, GLP-1 agonist consideration, CGM evaluation.",
      ],
      pendingAtDischarge: [
        "A1c recheck in 3 months",
        "diabetes education referral",
        "CGM insurance auth",
      ],
      outsideData:
        "Prior endocrinology visits at outside system 4 years ago — Media tab callout.",
    },
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: [
      "A1c trajectory rising (8.2 → 11.4 in 6 months).",
      "2nd DKA admission in 18 months.",
      "Social barriers to insulin adherence not yet addressed (cost, refrigeration, education).",
      "No behavioral health screening.",
    ],
  },

  // ─── 1:40 PM — Henneberry osteoporosis 6mo ─────────────────────────
  "im-osteo-6mo": {
    kind: "routine",
    whoThisIs: "Patricia Henneberry, 67F.",
    whyHereToday: "Follow Up · osteoporosis 6mo. On alendronate.",
    activeProblems: ["Osteoporosis"],
    currentMedications: ["alendronate 70mg weekly", "vitamin D 2000 IU daily"],
    longitudinalStory:
      "Osteoporosis on alendronate. T-score improving on last DEXA. No fractures since last visit.",
    trendedData: "Calcium and vitamin D within range.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 2:00 PM — Lavalliere hyperlipidemia 6mo ───────────────────────
  "im-hld-6mo": {
    kind: "routine",
    whoThisIs: "Brendan Lavalliere, 49M.",
    whyHereToday: "Follow Up · hyperlipidemia 6mo. On rosuvastatin.",
    activeProblems: ["HLD"],
    currentMedications: ["rosuvastatin 20mg daily"],
    longitudinalStory:
      "Primary prevention hyperlipidemia on rosuvastatin.",
    trendedData: "LDL 78, well at goal.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 2:20 PM — Strothers dementia + multi 3mo ──────────────────────
  "im-dementia-3mo": {
    kind: "routine",
    whoThisIs: "Mabel Strothers, 84F.",
    whyHereToday: "Follow Up · dementia + multi 3mo. Moderate Alzheimer dementia + HTN + DM2.",
    activeProblems: ["Alzheimer dementia", "Type 2 DM", "HTN"],
    currentMedications: [
      "donepezil 10mg daily",
      "memantine 10mg BID",
      "metformin 500mg BID",
      "lisinopril 10mg daily",
    ],
    longitudinalStory:
      "Moderate Alzheimer dementia + HTN + DM2. Caregiver reports increased agitation in evenings.",
    trendedData: "BMP and A1c stable.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 2:40 PM — Cromartie hypothyroidism 6mo ────────────────────────
  "im-hypothyroid-6mo": {
    kind: "routine",
    whoThisIs: "Yvette Cromartie, 55F.",
    whyHereToday: "Follow Up · hypothyroidism 6mo. Hashimoto thyroiditis on stable levothyroxine.",
    activeProblems: ["Primary hypothyroidism"],
    currentMedications: ["levothyroxine 88 mcg daily"],
    longitudinalStory:
      "Hashimoto thyroiditis, on stable levothyroxine dose.",
    trendedData: "TSH 1.8, in range.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },
};

export default INTERNAL_MEDICINE_BRIEFINGS;
