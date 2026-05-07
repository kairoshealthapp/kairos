// Provider surface — cardiology briefings keyed by briefingId on each
// schedule fixture. Schema is the universal 12-section structure (see
// BriefingDrawer.js). Trentham (8:40 AM cardiac arrest workup) is the
// fully-authored deep card; remaining cards have sections 1-8 mapped
// from prior fixture content where possible and sections 9-12 carry
// scaffolding text indicating specialty authoring is pending.
// All names and findings are fictional. NO PHI.

const SCAFFOLD_PATTERNS =
  "Specialty clinical authorship pending for this visit type. Pattern surfacing requires cardiology-specific reasoning authored by your specialty team.";
const SCAFFOLD_RISK =
  "Risk context not yet authored for this visit type. Cardiology-specific risk framing requires specialty input.";
const SCAFFOLD_GAPS =
  "Care gaps not yet authored for this visit type. Cardiology-specific gap detection requires specialty input.";
const SCAFFOLD_FLAGS = [
  "Specialty authoring pending — no items flagged for this visit type yet.",
];
const ALLERGY_DEFAULT = "NKDA. Allergy reconciliation not yet authored for this visit type.";

const CARDIOLOGY_BRIEFINGS = {
  // ─── DEEP CARD · 8:40 AM — Robert Trentham, cardiac arrest workup ──
  "card-cardiac-arrest": {
    kind: "postHospital",

    whoThisIs:
      "Robert Trentham, 66-year-old male. Lives with spouse Linda (emergency contact, healthcare decision-maker). Retired postal worker. Medicare + supplemental. English. No documented social barriers.",

    whyHereToday:
      "Post-Hospital Visit. First follow-up after 7-day admission for out-of-hospital cardiac arrest with anterior STEMI, LAD stenting, EF 35% at discharge. Last cardiology visit prior to admission: routine annual 11 months ago, asymptomatic.",

    activeProblems: [
      "Status post out-of-hospital cardiac arrest with ROSC (4/21/2026) — new",
      "Anterior STEMI status post LAD drug-eluting stent (4/21/2026) — new",
      "HFrEF, EF 35% (new at this admission)",
      "Hyperlipidemia (escalated to high-intensity statin)",
      "Essential hypertension (controlled on lisinopril)",
    ],

    currentMedications: {
      preamble: "Discharge meds (all filled per pharmacy data):",
      items: [
        { med: "Aspirin 81mg daily" },
        { med: "Clopidogrel 75mg daily", rationale: "DAPT planned 12 months" },
        { med: "Atorvastatin 80mg daily", rationale: "escalated from 20mg" },
        { med: "Metoprolol succinate 50mg daily", rationale: "new" },
        { med: "Lisinopril 5mg daily", rationale: "new" },
      ],
      note: "Pre-admission: atorvastatin 20mg + lisinopril 5mg only. No missed fills since discharge.",
    },

    longitudinalStory: {
      lastVisit:
        "Last visit with us (5/12/2025): Annual cardiology evaluation. EKG normal. LDL 118. Atorvastatin 20mg continued. No symptoms. Plan: annual follow-up.",
      activitySince: [
        "4/21/2026 — Phelps Health admission (cardiac arrest, 7-day stay)",
        "4/29/2026 — Discharge to home with LifeVest",
        "5/1/2026 — All 5 discharge meds filled",
        "No urgent care, ED, or outside visits since discharge",
      ],
      didTheyDoWhatWeAsked:
        "Pre-admission plan was annual follow-up only. Discharge medication compliance complete per pharmacy data.",
      pendingFromInpatient:
        "Cardiac rehab referral (not yet placed). EP eval at 90 days post-revascularization for ICD candidacy. Lipid panel at 4-12 weeks. LifeVest 30-day data download.",
    },

    trendedData: {
      "Lipid panel": [
        "5/12/2025 (on atorvastatin 20mg): LDL 118, HDL 42, TG 165",
        "4/21/2026 (admission): LDL 142, HDL 38, TG 198",
        "Discharge lipid panel pending — planned 4-12 weeks",
      ],
      "Cardiac biomarkers (admission)": "Troponin peak 18.4 ng/mL.",
      "Echocardiogram": "4/22/2026 EF 35%, anterior wall hypokinesis.",
      "Cardiac MRI 4/25/2026": "anterior wall scar, EF 35%.",
      "BMP discharge (4/29/2026)": "Cr 1.0, K 4.2, eGFR 78.",
    },

    hospitalCourse: {
      summary:
        "7-day admission for OOH cardiac arrest, ROSC achieved field. Cath: 95% LAD stenosis, drug-eluting stent placed. Targeted temperature management completed in ICU. EF 35% on discharge echo. Cardiac MRI confirmed anterior wall scar.",
      procedures: [
        {
          name: "Cardiac cath with LAD DES (4/21)",
          rationale: "95% LAD stenosis",
        },
        {
          name: "Targeted temperature management",
          rationale: "post-arrest neuroprotection",
        },
        { name: "Cardiac MRI", rationale: "scar pattern characterization" },
        { name: "Continuous telemetry x5 days", rationale: "arrhythmia surveillance" },
      ],
      medChanges: {
        added: [
          { med: "aspirin 81mg" },
          { med: "clopidogrel 75mg" },
          { med: "metoprolol succinate 50mg" },
          { med: "lisinopril 5mg" },
        ],
        adjusted: [
          {
            med: "atorvastatin 20mg → 80mg",
            rationale: "high-intensity",
          },
        ],
        stopped: [],
      },
      significantFindings:
        "Peak troponin 18.4. EF 35%. Cardiac MRI anterior wall scar.",
      consultRecommendations: [
        "EP for ICD eval at 90 days post-revascularization.",
        "Cardiac rehab referral.",
        "DAPT 12 months minimum.",
      ],
      pendingAtDischarge: [
        "30-day LifeVest data",
        "lipid panel 4-12 weeks",
        "repeat echo 90 days",
        "cardiac rehab referral placement",
      ],
      outsideData: "No outside-system records. All care within Phelps Health.",
    },

    allergies: "NKDA. No documented adverse drug reactions.",

    patternsKairosSurfaces:
      "Post-MI patient on appropriate secondary prevention foundation: aspirin + P2Y12 inhibitor (DAPT), high-intensity statin, beta blocker, ACE inhibitor. EF 35% with anterior wall scar on cardiac MRI. If EF remains ≤40% on optimized therapy, this patient meets HFrEF criteria where four-pillar guideline-directed medical therapy includes ACE inhibitor (or ARB/ARNI), beta blocker, MRA, and SGLT2 inhibitor. Both MRA and SGLT2i have post-MI evidence in patients with reduced ejection fraction. Lisinopril 5mg is a starting dose. Titration toward target dose is part of standard heart failure therapy as blood pressure and renal function allow. DAPT for at least 12 months after drug-eluting stent is the default per current ACS guidelines.",

    riskContext:
      "First documented MI at age 66 presenting as out-of-hospital cardiac arrest. Family history of premature coronary disease not documented in current chart — worth obtaining. EF 35% places this patient in the population where ICD evaluation at least 90 days post-revascularization is standard practice if EF remains ≤35% on optimized therapy. LifeVest in place during the wait period. Patient on DAPT and would have additional antithrombotic decisions if AFib develops post-MI. Bleeding risk factors not formally assessed.",

    careGaps: [
      "Cardiac rehabilitation referral not yet placed. Class I recommendation post-MI; insurance typically supports.",
      "Pneumococcal and influenza vaccination status not documented in current chart.",
      "Smoking history not documented in current chart.",
      "Lipid panel at 4-12 weeks is standard to confirm statin response.",
      "Depression screening after MI is part of cardiac rehab intake but worth surfacing as a gap if rehab referral is delayed.",
    ],

    kairosFlags: [
      "SGLT2 inhibitor and MRA both reasonable considerations if EF remains ≤40% at follow-up echo.",
      "Lisinopril at starting dose — titration plan worth establishing today.",
      "Cardiac rehab not yet referred (Class I post-MI).",
      "LifeVest compliance not documented since discharge.",
      "Family history of premature CAD missing from chart.",
      "Smoking status missing from chart.",
    ],
  },

  // ─── 9:00 AM — EKG Afib follow-up ──────────────────────────────────
  "card-ekg-afib": {
    kind: "routine",
    whoThisIs:
      "Daniel Voorhees, 58M. Established cardiology patient. Demographics not yet authored for routine visit types.",
    whyHereToday: "Follow Up · EKG Afib. Recent EKG showed persistent AFib — review rate strategy.",
    activeProblems: ["Atrial fibrillation", "Hypertension"],
    currentMedications: ["apixaban 5mg BID", "metoprolol succinate 50mg daily"],
    longitudinalStory:
      "Last visit 3 months ago — known paroxysmal AFib on apixaban, well rate-controlled.",
    trendedData: "BMP and CBC stable on chart 6 weeks ago. Recent EKG: persistent AFib.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 9:20 AM — Halpern routine 1mo ─────────────────────────────────
  "card-routine-1mo-halpern": {
    kind: "routine",
    whoThisIs: "Marcus Halpern, 29M.",
    whyHereToday: "Follow Up · 1mo. Symptomatic PVCs surveillance.",
    activeProblems: ["Symptomatic PVCs"],
    currentMedications: ["metoprolol tartrate 25mg BID PRN"],
    longitudinalStory:
      "Last visit 1 month ago — premature ventricular contractions, low burden on Holter.",
    trendedData: "TSH normal. BMP unremarkable.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 9:40 AM — Castellanos routine 1mo ─────────────────────────────
  "card-routine-1mo-castellanos": {
    kind: "routine",
    whoThisIs: "Eleanor Castellanos, 53F.",
    whyHereToday: "Follow Up · 1mo. Hypertension reassessment after ACEi-cough switch.",
    activeProblems: ["Hypertension", "Hyperlipidemia"],
    currentMedications: ["losartan 50mg daily", "atorvastatin 20mg daily"],
    longitudinalStory:
      "Last visit 1 month ago — hypertension, started losartan after lisinopril cough.",
    trendedData: "BMP normal. Lipid panel improving. BP averaging 128/78 at home.",
    allergies: "Lisinopril — cough.",
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 10:00 AM — Lindstrom routine 6mo ──────────────────────────────
  "card-routine-6mo-lindstrom": {
    kind: "routine",
    whoThisIs: "Patricia Lindstrom, 61F.",
    whyHereToday: "Follow Up · 6mo. Stable HFpEF surveillance.",
    activeProblems: ["HFpEF", "Hypertension", "Type 2 DM"],
    currentMedications: ["metoprolol succinate 25mg daily", "furosemide 20mg PRN"],
    longitudinalStory: "Stable HFpEF, EF 60%. Last visit 6 months ago.",
    trendedData: "Recent BNP 180, baseline.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 10:20 AM — Aoki routine 1mo ───────────────────────────────────
  "card-routine-1mo-aoki": {
    kind: "routine",
    whoThisIs: "Mildred Aoki, 86F.",
    whyHereToday: "Follow Up · 1mo. AFib + CKD2 surveillance on apixaban.",
    activeProblems: ["Atrial fibrillation", "CKD stage 2"],
    currentMedications: ["apixaban 2.5mg BID", "metoprolol 12.5mg BID"],
    longitudinalStory:
      "86F with AFib, last visit 1 month ago — anticoagulation tolerated.",
    trendedData: "Cr 1.1, stable.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 10:40 AM — Beaumont routine 6mo ───────────────────────────────
  "card-routine-6mo-beaumont": {
    kind: "routine",
    whoThisIs: "Geraldine Beaumont, 78F.",
    whyHereToday: "Follow Up · 6mo. Post-CABG 4 years, stable.",
    activeProblems: ["CAD s/p CABG", "HTN"],
    currentMedications: ["aspirin 81mg", "atorvastatin 40mg", "metoprolol 50mg"],
    longitudinalStory:
      "Coronary disease, post-CABG 4 years ago. Last visit 6 months ago.",
    trendedData: "Lipid panel at goal. A1c 6.4.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 11:00 AM — Moskowitz routine 3mo HFrEF ────────────────────────
  "card-routine-3mo-moskowitz": {
    kind: "routine",
    whoThisIs: "Walter Moskowitz, 74M.",
    whyHereToday: "Follow Up · 3mo. HFrEF on full GDMT.",
    activeProblems: ["HFrEF EF 38%", "Type 2 DM", "HTN"],
    currentMedications: [
      "carvedilol 25mg BID",
      "sacubitril-valsartan 49/51mg BID",
      "spironolactone 25mg daily",
      "dapagliflozin 10mg daily",
    ],
    longitudinalStory: "HFrEF on full GDMT. EF 38% on last echo.",
    trendedData: "BMP stable, K 4.4.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 11:20 AM — Calabrese palpitations ─────────────────────────────
  "card-palpitations": {
    kind: "routine",
    whoThisIs: "Renee Calabrese, 46F.",
    whyHereToday: "Follow Up · palpitations workup. Awaiting Zio patch results.",
    activeProblems: ["Palpitations under workup"],
    currentMedications: ["none"],
    longitudinalStory:
      "First-time palpitations workup. 30-day monitor pending.",
    trendedData: "TSH normal. Electrolytes normal.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 1:00 PM — Whitfield-Hayes routine ─────────────────────────────
  "card-routine-whitfield": {
    kind: "routine",
    whoThisIs: "Doris Whitfield-Hayes, 73F.",
    whyHereToday: "Follow Up. Routine cardiology follow-up.",
    activeProblems: ["Hypertension (controlled)"],
    currentMedications: ["aspirin 81mg daily"],
    longitudinalStory: "Routine cardiology follow-up. No active cardiac issues.",
    trendedData: "Lipids at goal.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 1:20 PM — Brennan CHF exacerbation ────────────────────────────
  "card-chf-exac": {
    kind: "postHospital",
    whoThisIs: "Thomas Brennan, 66M. Established cardiology patient.",
    whyHereToday:
      "Post-Hospital Visit. Follow-up after 5-day admission for acute decompensated heart failure.",
    activeProblems: [
      "HFrEF EF 30% (down from 40%)",
      "Hypertension",
      "Type 2 DM",
    ],
    currentMedications: {
      preamble: "Discharge meds:",
      items: [
        { med: "spironolactone 25mg daily", rationale: "GDMT for HFrEF (added)" },
        {
          med: "furosemide 80mg daily",
          rationale: "increased from 40mg",
        },
        {
          med: "metoprolol succinate 50mg daily",
          rationale: "increased from 25mg, GDMT optimization",
        },
      ],
    },
    longitudinalStory:
      "5-day admission for acute decompensated heart failure. IV diuresis, net negative 8L. No ICU.",
    trendedData: {
      "BNP": "peaked 1840, discharge 620",
      "Creatinine": "bumped 1.4 → 1.8 → 1.5",
      "EF": "dropped 10 points in 12 months (40 → 30)",
    },
    hospitalCourse: {
      summary:
        "5-day admission for acute decompensated heart failure. IV diuresis, net negative 8L. No ICU.",
      procedures: [
        { name: "Chest X-ray", rationale: "pulmonary edema" },
        {
          name: "Echocardiogram",
          rationale: "EF 30%, down from 40% one year ago",
        },
        { name: "Serial BNP", rationale: "diuresis response" },
      ],
      medChanges: {
        added: [
          { med: "spironolactone 25mg daily", rationale: "GDMT for HFrEF" },
          {
            med: "furosemide increased 40 → 80mg daily",
            rationale: "ongoing diuretic need",
          },
        ],
        stopped: [],
        adjusted: [
          {
            med: "metoprolol succinate 25 → 50mg daily",
            rationale: "GDMT optimization",
          },
        ],
      },
      significantFindings:
        "BNP peaked 1840, discharge 620. Creatinine bumped 1.4 to 1.8 then back to 1.5. EF dropped 10 points in 12 months.",
      consultRecommendations: [
        "Cardiology recommended SGLT2 inhibitor addition outpatient.",
        "ICD evaluation if EF remains <35% at 90 days.",
        "GDMT optimization.",
      ],
      pendingAtDischarge: [
        "BMP in 1 week (post-diuresis renal recheck)",
        "repeat echo at 90 days",
        "SGLT2i prior auth",
      ],
      outsideData:
        "Outside cardiology echo report from 2 years ago in Media tab — scanned PDF, requires App Orchard for full extraction.",
    },
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: [
      "EF declining trajectory (40→30 in 12 months).",
      "NSAID use prior to admission.",
      "Weight gain pattern preceded admission by 10 days.",
      "SGLT2 inhibitor not yet started despite indication. 30-day readmission risk: HIGH.",
    ],
  },

  // ─── 1:40 PM — Petrosyan AFib RVR ──────────────────────────────────
  "card-afib-rvr": {
    kind: "postHospital",
    whoThisIs: "Roland Petrosyan, 58M.",
    whyHereToday:
      "Post-Hospital Visit. Follow-up after 3-day admission for new-onset AFib with RVR.",
    activeProblems: [
      "New-onset atrial fibrillation",
      "CHA2DS2-VASc score 3",
    ],
    currentMedications: {
      items: [
        { med: "apixaban 5mg BID", rationale: "anticoagulation, CHA2DS2-VASc 3" },
        { med: "metoprolol succinate 50mg daily", rationale: "rate control" },
      ],
    },
    longitudinalStory:
      "3-day admission for new-onset AFib with rapid ventricular response. Heart rate to 160s on admission. Rate controlled, anticoagulation initiated.",
    trendedData: {
      "TSH": "normal",
      "EF": "55% (preserved)",
      "Echo": "no clot",
    },
    hospitalCourse: {
      summary:
        "3-day admission for new-onset atrial fibrillation with rapid ventricular response. Heart rate to 160s on admission. Rate controlled, anticoagulation initiated.",
      procedures: [
        { name: "ECG", rationale: "AFib RVR" },
        {
          name: "Echocardiogram",
          rationale: "no structural heart disease, EF preserved",
        },
        { name: "TSH", rationale: "rule out hyperthyroid trigger" },
      ],
      medChanges: {
        added: [
          { med: "apixaban 5mg BID" },
          { med: "metoprolol succinate 50mg daily" },
        ],
        stopped: [],
        adjusted: [],
      },
      significantFindings: "TSH normal. EF 55%. No clot on echo.",
      consultRecommendations: [
        "Electrophysiology referral for rate vs rhythm strategy discussion.",
        "Sleep study to evaluate for OSA (common AFib trigger).",
      ],
      pendingAtDischarge: [
        "EP referral appointment",
        "sleep study scheduling",
        "BMP in 2 weeks",
      ],
      outsideData: "No outside data available.",
    },
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: [
      "New-onset AFib at 58 — OSA workup pending and underdiagnosed.",
      "Anticoagulation bleeding risk not formally documented (HAS-BLED).",
      "EP referral not yet scheduled.",
      "Alcohol use history not in current chart.",
    ],
  },

  // ─── 2:00 PM — Sandborn routine 1mo ────────────────────────────────
  "card-routine-1mo-sandborn": {
    kind: "routine",
    whoThisIs: "Harold Sandborn, 83M.",
    whyHereToday: "Follow Up · 1mo. Aortic stenosis surveillance.",
    activeProblems: ["Moderate AS", "HTN"],
    currentMedications: ["amlodipine 5mg daily"],
    longitudinalStory:
      "Aortic stenosis moderate, surveillance.",
    trendedData: "BMP unremarkable. Echo due in 6 months.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 2:20 PM — Murchison device check ──────────────────────────────
  "card-device-check": {
    kind: "routine",
    whoThisIs: "Adelaide Murchison, 91F. Dual-chamber pacemaker (Medtronic Azure), implanted 2019-04-12.",
    whyHereToday: "Device Check · 6mo. Pacemaker interrogation.",
    activeProblems: ["Pacemaker — sick sinus syndrome"],
    currentMedications: ["—"],
    longitudinalStory:
      "Last interrogation 6 months ago — appropriate pacing, no mode switches, lead impedance stable.",
    trendedData: {
      "Battery": "6.2 years remaining",
      "Leads": "stable",
      "Arrhythmia episodes": "no high-rate episodes since last interrogation",
    },
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 2:40 PM — Halloran routine 6mo post-MI ────────────────────────
  "card-routine-6mo-halloran": {
    kind: "routine",
    whoThisIs: "Vincent Halloran, 75M.",
    whyHereToday: "Follow Up · 6mo. Post-MI 5 years, stable on GDMT.",
    activeProblems: ["CAD post-MI", "HTN", "HLD"],
    currentMedications: [
      "aspirin 81mg",
      "atorvastatin 80mg",
      "metoprolol succinate 50mg",
      "lisinopril 10mg",
    ],
    longitudinalStory:
      "Post-MI 5 years, stable on guideline-directed therapy.",
    trendedData: "Lipid panel at goal. A1c 5.9.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },
};

export default CARDIOLOGY_BRIEFINGS;
