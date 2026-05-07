// Provider surface — pulmonology briefings keyed by briefingId. Schema
// is the universal 12-section structure. Okafor (8:40 AM COPD
// exacerbation) is the fully-authored deep card; remaining cards have
// sections 1-8 mapped from prior fixture content where possible and
// sections 9-12 carry scaffolding text indicating specialty authoring
// is pending. All names and findings are fictional. NO PHI.

const SCAFFOLD_PATTERNS =
  "Specialty clinical authorship pending for this visit type. Pattern surfacing requires pulmonology-specific reasoning authored by your specialty team.";
const SCAFFOLD_RISK =
  "Risk context not yet authored for this visit type. Pulmonology-specific risk framing requires specialty input.";
const SCAFFOLD_GAPS =
  "Care gaps not yet authored for this visit type. Pulmonology-specific gap detection requires specialty input.";
const SCAFFOLD_FLAGS = [
  "Specialty authoring pending — no items flagged for this visit type yet.",
];
const ALLERGY_DEFAULT = "NKDA. Allergy reconciliation not yet authored for this visit type.";

const PULMONOLOGY_BRIEFINGS = {
  // ─── DEEP CARD · 8:40 AM — Lawrence Okafor, COPD exacerbation ──────
  "pulm-copd-exac": {
    kind: "postHospital",

    whoThisIs:
      "Lawrence Okafor, 67-year-old male. Lives alone. Daughter (Ngozi) is emergency contact and primary support, lives 20 minutes away. Retired auto mechanic. Medicare + Medicaid dual eligible. English (Igbo first language, fluent English). Documented transportation barrier — no driving since last admission.",

    whyHereToday:
      "Post-Hospital Visit. Follow-up after 4-day admission for acute COPD exacerbation requiring BiPAP. Third hospitalization this year for COPD exacerbation.",

    activeProblems: [
      "COPD, severe (most recent FEV1 42% predicted, 18 months ago)",
      "Acute COPD exacerbation status post hospitalization (4/22/2026) — recent",
      "Tobacco use — current, 45 pack-years",
      "Hypertension, controlled",
      "Type 2 diabetes mellitus, A1c 7.4 most recent",
    ],

    currentMedications: {
      preamble: "Discharge meds (per pharmacy fill data):",
      items: [
        {
          med: "Umeclidinium/vilanterol (LAMA/LABA) inhaler daily",
          rationale: "filled",
        },
        { med: "Albuterol HFA rescue PRN", rationale: "filled" },
        {
          med: "Prednisone 40mg taper over 14 days",
          rationale: "filled",
        },
        {
          med: "Azithromycin 250mg daily x5 days",
          rationale: "completed",
        },
        { med: "Lisinopril 20mg daily", rationale: "continued" },
        { med: "Metformin 1000mg BID", rationale: "continued" },
      ],
      note: "Pre-admission: tiotropium monotherapy only. No LABA component. No rescue inhaler refill in past 6 months per pharmacy data.",
    },

    longitudinalStory: {
      lastVisit:
        "Last visit with us (12 weeks ago): Tiotropium continued. Spirometry deferred. Patient reported \"doing okay.\" Plan: 6-month follow-up, smoking cessation discussion (declined).",
      activitySince: [
        "1/14/2026 — Phelps Health admission (1st COPD exacerbation, 3-day stay)",
        "2/28/2026 — Phelps Health admission (2nd COPD exacerbation, 5-day stay)",
        "4/22/2026 — Phelps Health admission (3rd COPD exacerbation, 4-day stay, BiPAP)",
        "3 PCP visits between admissions",
        "ED visit 3/15/2026 for SOB, sent home",
      ],
      didTheyDoWhatWeAsked:
        "Smoking cessation declined. Tiotropium adherence intermittent per pharmacy data. No pulmonary rehab referral placed despite repeated admissions.",
      pendingFromInpatient:
        "Outpatient PFTs in 6 weeks. Pulmonary rehab referral. Smoking cessation counseling.",
    },

    trendedData: {
      "Spirometry (FEV1 % predicted)": [
        "18 months ago: 42%",
        "No interim spirometry on file",
        "New PFTs scheduled in 6 weeks",
      ],
      "Eosinophil count": "180 cells/µL (admission CBC)",
      "ABG admission": "pH 7.36, pCO2 52 (compensated respiratory acidosis)",
      "SpO2 at discharge": "88% on room air",
      "Admissions for COPD exacerbation in past 12 months": "3",
      "A1c": "7.1 → 7.4 (recent)",
    },

    hospitalCourse: {
      summary:
        "4-day admission for acute COPD exacerbation. Required BiPAP for 36 hours. Sputum cultures grew H. influenzae.",
      procedures: [
        {
          name: "CXR",
          rationale: "hyperinflation, no infiltrate",
        },
        { name: "ABG x3", rationale: "respiratory acidosis trending" },
        { name: "Sputum culture", rationale: "organism identification" },
      ],
      medChanges: {
        added: [
          {
            med: "prednisone 40mg taper x14 days",
            rationale: "exacerbation steroid course",
          },
          {
            med: "azithromycin 250mg x5 days",
            rationale: "exacerbation antibiotic",
          },
          {
            med: "umeclidinium/vilanterol (LABA/LAMA)",
            rationale: "GOLD step-up",
          },
        ],
        adjusted: [
          {
            med: "tiotropium discontinued (replaced by combo inhaler)",
            rationale: "consolidation onto LAMA/LABA",
          },
          {
            med: "albuterol nebulizer transitioned to MDI rescue",
            rationale: "outpatient regimen simplification",
          },
        ],
        stopped: [
          { med: "tiotropium monotherapy", rationale: "replaced by LAMA/LABA" },
        ],
      },
      significantFindings:
        "ABG compensated respiratory acidosis. WBC peaked 14.2. Discharge SpO2 88% RA.",
      consultRecommendations: [
        "Outpatient PFTs 6 weeks.",
        "Pulmonary rehab referral.",
        "Smoking cessation counseling.",
      ],
      pendingAtDischarge: [
        "PFT scheduling",
        "pulmonary rehab insurance auth",
        "pneumococcal vaccine status review",
      ],
      outsideData:
        "Prior PFTs from outside facility 18 months ago (FEV1 42% predicted) — scanned report in Media tab, requires App Orchard for full extraction.",
    },

    allergies: "NKDA. No documented adverse drug reactions.",

    patternsKairosSurfaces:
      "Frequent exacerbator phenotype: 3 hospitalizations in 12 months. Per current GOLD strategy, this places the patient in the high-exacerbation-risk group where LABA/LAMA combination is the appropriate maintenance therapy. The discharge regimen reflects this escalation from prior tiotropium monotherapy. Eosinophil count 180 cells/µL at admission. Per current GOLD recommendations, blood eosinophils ≥100 cells/µL in patients with continued exacerbations on LABA/LAMA may support escalation to triple therapy (LABA/LAMA/ICS). Worth tracking the eosinophil trend and exacerbation frequency on the new combination inhaler. Pulmonary rehabilitation post-exacerbation has strong evidence for reducing readmission. Referral has not yet been placed despite three hospitalizations. Discharge SpO2 88% on room air may meet criteria for ambulatory oxygen evaluation if persistent.",

    riskContext:
      "Three COPD admissions in past 12 months places this patient in the highest-risk readmission group. 30-day readmission risk after AECOPD is substantial. Active 45 pack-year smoking history. Smoking cessation is the only intervention shown to alter the natural history of COPD. Compensated respiratory acidosis with pCO2 52 raises concern for chronic CO2 retention. Worth understanding baseline ventilatory status. Patient lives alone with transportation barriers — reduces access to follow-up care and pulmonary rehabilitation.",

    careGaps: [
      "Pulmonary rehabilitation referral not placed despite three hospitalizations.",
      "Pneumococcal vaccine status not documented. Influenza vaccine status not documented in past 12 months. Both recommended in COPD.",
      "Smoking cessation referral has not been placed. Patient previously declined; post-hospitalization is a window where cessation success rates increase.",
      "Home oxygen evaluation worth considering given discharge SpO2 88%. Formal qualifying study (resting and with ambulation) may be needed.",
      "Inhaler technique not documented in chart. Common issue — worth observing today.",
    ],

    kairosFlags: [
      "3rd admission this year — high readmission risk pattern.",
      "Pulmonary rehab not yet referred despite repeated exacerbations.",
      "Discharge SpO2 88% on room air — home oxygen evaluation worth considering.",
      "No pneumococcal or flu vaccine documented in past 12 months.",
      "Smoking cessation referral not placed (patient previously declined; post-hospitalization is the window).",
      "Eosinophil count 180 — worth tracking with future exacerbations on LABA/LAMA.",
    ],
  },

  // ─── 9:00 AM — Brockton asthma 3mo ─────────────────────────────────
  "pulm-asthma-3mo": {
    kind: "routine",
    whoThisIs: "Stephanie Brockton, 54F.",
    whyHereToday: "Follow Up · asthma 3mo. Moderate persistent asthma surveillance.",
    activeProblems: ["Moderate persistent asthma"],
    currentMedications: ["fluticasone-salmeterol 250/50 BID", "albuterol PRN"],
    longitudinalStory:
      "Moderate persistent asthma, well controlled on ICS-LABA. ACT score 22, no exacerbations since last visit.",
    trendedData: "Eosinophils 280.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 9:20 AM — Kovacic ILD 6mo ─────────────────────────────────────
  "pulm-ild-6mo": {
    kind: "routine",
    whoThisIs: "Edmund Kovacic, 72M.",
    whyHereToday: "Follow Up · ILD 6mo. IPF on antifibrotic therapy.",
    activeProblems: ["IPF"],
    currentMedications: ["nintedanib 150mg BID"],
    longitudinalStory:
      "Idiopathic pulmonary fibrosis on antifibrotic therapy.",
    trendedData: "FVC 78% predicted, slight decline from 82% baseline. LFTs stable, GI tolerance good.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 9:40 AM — Skarsdale new patient ───────────────────────────────
  "pulm-new-ct-chest": {
    kind: "routine",
    whoThisIs: "Bridget Skarsdale, 48F. New patient.",
    whyHereToday:
      "New Patient · outside CT chest. Outside CT chest with 8mm spiculated nodule LUL, referred for evaluation.",
    activeProblems: ["LUL pulmonary nodule, 8mm spiculated — workup pending"],
    currentMedications: ["—"],
    longitudinalStory:
      "Former smoker, 20 pack-year history, quit 8 years ago. No prior imaging in our system.",
    trendedData:
      "Outside CT chest report received via Care Everywhere — Media tab scanned PDF, requires App Orchard for full extraction. Prior CT chest 2 years ago at outside hospital — not in our system. No PFTs on record.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 10:00 AM — Whitlock GOLD 4 routine ────────────────────────────
  "pulm-routine-1mo-whitlock": {
    kind: "routine",
    whoThisIs: "Cornelius Whitlock, 81M.",
    whyHereToday: "Follow Up · 1mo. Severe COPD on home O2.",
    activeProblems: ["GOLD 4 COPD", "Chronic respiratory failure"],
    currentMedications: [
      "umeclidinium-vilanterol-fluticasone (Trelegy) daily",
      "home O2 2L NC",
    ],
    longitudinalStory: "Severe COPD, GOLD 4. On home O2.",
    trendedData: "ABG on chart 4 weeks ago, compensated. No exacerbations since last visit.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 10:20 AM — Steadman OSA CPAP titration ────────────────────────
  "pulm-osa-titration": {
    kind: "routine",
    whoThisIs: "Yvonne Steadman, 35F.",
    whyHereToday: "Follow Up · OSA CPAP titration. Severe OSA, AHI 38.",
    activeProblems: ["Severe OSA"],
    currentMedications: ["none pulmonary"],
    longitudinalStory:
      "Severe OSA, AHI 38 on diagnostic study. CPAP titration today.",
    trendedData: "TSH normal. CPAP compliance 92% over past 30 nights at trial pressure 8.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 10:40 AM — Faulkner pneumonia + sepsis ────────────────────────
  "pulm-pna-sepsis": {
    kind: "postHospital",
    whoThisIs: "Reginald Faulkner, 69M.",
    whyHereToday:
      "Post-Hospital Visit. Follow-up after 6-day admission for community-acquired pneumonia with sepsis.",
    activeProblems: [
      "CAP with sepsis, post-hospitalization",
      "Stage 2 AKI (resolving)",
    ],
    currentMedications: {
      items: [
        {
          med: "cefdinir oral, completing 14-day total course",
          rationale: "after IV ceftriaxone + azithromycin",
        },
        {
          med: "lisinopril restarted at discharge",
          rationale: "held during AKI",
        },
      ],
    },
    longitudinalStory:
      "6-day admission for community-acquired pneumonia with sepsis. ICU x2 days. HFNC, no intubation.",
    trendedData: {
      "Blood cultures": "grew Strep pneumoniae",
      "Lactate": "peaked 4.2, normalized",
      "AKI": "peak Cr 1.6, baseline 1.0, discharge Cr 1.2",
    },
    hospitalCourse: {
      summary:
        "6-day admission for community-acquired pneumonia with sepsis. ICU x2 days. HFNC, no intubation.",
      procedures: [
        {
          name: "CT chest",
          rationale: "RLL consolidation with small parapneumonic effusion",
        },
        { name: "Blood cultures x2", rationale: "sepsis workup" },
        { name: "Sputum culture", rationale: "organism identification" },
        { name: "Lactate trending", rationale: "sepsis resolution" },
      ],
      medChanges: {
        added: [
          {
            med: "completed 7-day IV ceftriaxone + azithromycin, transitioned to oral cefdinir to complete 14-day course",
            rationale: "CAP treatment completion",
          },
        ],
        stopped: [],
        adjusted: [
          {
            med: "outpatient lisinopril held during admission for AKI, restarted at discharge",
            rationale: "renal recovery",
          },
        ],
      },
      significantFindings:
        "Blood cultures grew Strep pneumoniae. Lactate peaked 4.2, normalized. AKI peak Cr 1.6, baseline 1.0, discharge Cr 1.2.",
      consultRecommendations: [
        "Infectious disease recommended completion of 14-day total antibiotic course.",
        "HIV/TB workup negative.",
      ],
      pendingAtDischarge: [
        "Follow-up CXR in 6 weeks (resolution confirmation)",
        "repeat BMP for renal recovery",
        "pneumococcal vaccine",
      ],
      outsideData: "No significant outside data.",
    },
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: [
      "Parapneumonic effusion not fully resolved on discharge imaging.",
      "ACE inhibitor restart timing in patient with prior AKI — needs monitoring.",
      "No pneumococcal vaccine history documented.",
      "Smoking history not in current chart.",
    ],
  },

  // ─── 11:00 AM — Brindelhart nodule surveillance ───────────────────────
  "pulm-nodule-surv": {
    kind: "routine",
    whoThisIs: "Margaret Brindelhart, 58F.",
    whyHereToday: "Follow Up · pulmonary nodule surveillance. 6mm RUL nodule, low risk.",
    activeProblems: ["Pulmonary nodule, low risk"],
    currentMedications: ["none pulmonary"],
    longitudinalStory:
      "6mm RUL nodule under Fleischner surveillance.",
    trendedData: "Last surveillance CT showed no interval change.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 11:20 AM — Saracino oxygen reassessment ───────────────────────
  "pulm-oxygen-reassess": {
    kind: "routine",
    whoThisIs: "Aldo Saracino, 76M.",
    whyHereToday: "Follow Up · oxygen reassessment. Annual Medicare requalification.",
    activeProblems: ["GOLD 3 COPD", "Chronic hypoxic respiratory failure"],
    currentMedications: ["Trelegy", "home O2 2L"],
    longitudinalStory:
      "Severe COPD on home O2 2L. Annual reassessment for Medicare requalification.",
    trendedData: "Walking SpO2 testing scheduled today. Documenting qualifying SpO2.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 1:00 PM — Vassilakis routine 6mo ──────────────────────────────
  "pulm-routine-6mo-vassilakis": {
    kind: "routine",
    whoThisIs: "Hector Vassilakis, 62M.",
    whyHereToday: "Follow Up · 6mo. OSA on CPAP, HTN well controlled.",
    activeProblems: ["OSA on CPAP", "HTN"],
    currentMedications: ["amlodipine 5mg daily", "CPAP nightly"],
    longitudinalStory:
      "Sleep apnea on CPAP, stable. Hypertension well controlled.",
    trendedData: "BMP unremarkable.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 1:20 PM — Whitford PE on anticoagulation ──────────────────────
  "pulm-pe-anticoag": {
    kind: "postHospital",
    whoThisIs: "Beatrice Whitford, 70F.",
    whyHereToday:
      "Post-Hospital Visit. Follow-up after 3-day admission for unprovoked submassive bilateral PE.",
    activeProblems: [
      "Unprovoked bilateral submassive PE on anticoagulation",
    ],
    currentMedications: {
      items: [
        {
          med: "apixaban 10mg BID x7 days then 5mg BID",
          rationale: "PE treatment dose",
        },
      ],
    },
    longitudinalStory:
      "3-day admission for unprovoked submassive bilateral PE. Hemodynamically stable. Anticoagulation initiated.",
    trendedData: {
      "CTPA": "bilateral segmental PEs",
      "LE Doppler": "negative",
      "Troponin": "mildly elevated, normalized",
      "Echo": "RV strain on initial echo, resolved by discharge",
    },
    hospitalCourse: {
      summary:
        "3-day admission for unprovoked submassive bilateral PE. Hemodynamically stable. Anticoagulation initiated.",
      procedures: [
        {
          name: "CT pulmonary angiogram",
          rationale: "bilateral segmental PEs",
        },
        { name: "Lower extremity Doppler", rationale: "negative" },
        {
          name: "Echocardiogram",
          rationale: "RV dilation, normalized by discharge",
        },
      ],
      medChanges: {
        added: [
          {
            med: "apixaban 10mg BID x7 days then 5mg BID",
            rationale: "PE treatment dose",
          },
        ],
        stopped: [],
        adjusted: [],
      },
      significantFindings:
        "Bilateral segmental PEs on CTPA. Negative LE Doppler. Troponin mildly elevated, normalized. RV strain on initial echo, resolved.",
      consultRecommendations: [
        "Hematology recommended outpatient thrombophilia workup.",
        "Age-appropriate cancer screening.",
      ],
      pendingAtDischarge: [
        "Hypercoagulable workup",
        "mammogram",
        "colonoscopy status review",
        "anticoagulation duration decision at this visit",
      ],
      outsideData:
        "Prior CT abdomen at outside facility 2 years ago — Media tab scanned report, requires App Orchard.",
    },
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: [
      "Unprovoked PE in 70F warrants malignancy workup.",
      "Mammogram and colonoscopy status unclear in current chart.",
      "No family history of clotting disorders documented.",
      "Anticoagulation duration to be determined — provoked vs unprovoked classification matters.",
    ],
  },

  // ─── 1:40 PM — Thackeray sarcoidosis ───────────────────────────────
  "pulm-sarc-3mo": {
    kind: "routine",
    whoThisIs: "Donovan Thackeray, 55M.",
    whyHereToday: "Follow Up · sarcoidosis 3mo. Pulmonary sarcoidosis on prednisone taper.",
    activeProblems: ["Pulmonary sarcoidosis"],
    currentMedications: ["prednisone 10mg daily (tapering)"],
    longitudinalStory:
      "Pulmonary sarcoidosis, on prednisone taper. Symptomatically improving.",
    trendedData: "ACE level trending down.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 2:00 PM — Pemberton chronic cough ─────────────────────────────
  "pulm-new-cough": {
    kind: "routine",
    whoThisIs: "Heloise Pemberton, 44F. New patient.",
    whyHereToday: "New Patient · chronic cough. Chronic cough x6 months, normal CXR, no clear etiology.",
    activeProblems: ["Chronic cough — workup pending"],
    currentMedications: ["—"],
    longitudinalStory:
      "Non-smoker. No reflux, no allergic rhinitis on history. Empiric PPI trial without benefit.",
    trendedData:
      "Outside PCP records received — chest X-ray and CMP forwarded. PFTs not yet performed. Methacholine challenge being considered.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 2:20 PM — Asante lung cancer post-treatment ───────────────────
  "pulm-lung-ca-followup": {
    kind: "routine",
    whoThisIs: "Frederick Asante, 68M.",
    whyHereToday:
      "Follow Up · lung cancer post-treatment. Stage IIIA NSCLC s/p chemoradiation 18 months ago, NED on surveillance.",
    activeProblems: ["Lung cancer in surveillance"],
    currentMedications: ["none active oncology"],
    longitudinalStory:
      "Stage IIIA NSCLC s/p chemoradiation 18 months ago, NED on surveillance.",
    trendedData: "Most recent surveillance CT no recurrence.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },

  // ─── 2:40 PM — Dunmore severe asthma biologic ──────────────────────
  "pulm-severe-asthma-bio": {
    kind: "routine",
    whoThisIs: "Florence Dunmore, 82F.",
    whyHereToday:
      "Follow Up · severe asthma biologic. Severe eosinophilic asthma on dupilumab.",
    activeProblems: ["Severe eosinophilic asthma"],
    currentMedications: ["dupilumab 300mg q2 weeks", "ICS-LABA"],
    longitudinalStory:
      "Severe eosinophilic asthma on dupilumab, dramatic improvement.",
    trendedData: "Eosinophils 80, down from 580 baseline. ACT 24. No exacerbations on biologic.",
    allergies: ALLERGY_DEFAULT,
    patternsKairosSurfaces: SCAFFOLD_PATTERNS,
    riskContext: SCAFFOLD_RISK,
    careGaps: SCAFFOLD_GAPS,
    kairosFlags: SCAFFOLD_FLAGS,
  },
};

export default PULMONOLOGY_BRIEFINGS;
