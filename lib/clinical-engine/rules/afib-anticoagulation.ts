// ============================================================
// AFIB STROKE-PREVENTION ANTICOAGULATION — CALCULATED-SCORE-GATE
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Source: 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and
//         Management of Atrial Fibrillation. Joglar JA, et al.
//         Circulation. 2024;149:e1–e156. Published 2023-11-30.
//         DOI: 10.1161/CIR.0000000000001193
//         URL: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001193
//
// Section 6.3.1 — Antithrombotic Therapy — Recommendation 1
// (verbatim from primary PDF, pinned via pdftotext 2026-05-13):
//   "For patients with AF and an estimated annual thromboembolic
//    risk of ≥2% per year (eg, CHA2DS2-VASc score of 2 in men and
//    3 in women), anticoagulation is recommended to prevent stroke
//    and systemic thromboembolism."
//
// Class of Recommendation: 1. Level of Evidence: A.
//
// Section 6.3.1 Recommendation 4 (verbatim, related):
//   "In patients with AF who are candidates for anticoagulation and
//    without an indication for antiplatelet therapy, aspirin either
//    alone or in combination [with another antiplatelet] is..."
//   Class 3: Harm. LOE B-R.
//
// Aspirin-only therefore does NOT satisfy this rule's anticoagulation
// requirement and is itself a Class 3: Harm recommendation in this
// population. Patients with AFib + qualifying CHA₂DS₂-VASc on aspirin
// only therefore fire a gap. A separate "aspirin-only in AFib is
// harmful" rule could be added in Phase 3.
//
// Section 6.3.1 Recommendation 2 (verbatim, related):
//   "In patients with AF who do not have a history of moderate to
//    severe rheumatic mitral stenosis or a mechanical heart valve,
//    and who are candidates for anticoagulation, DOACs are recommended
//    over warfarin..." — Class 1, LOE A.
//
// v1 of this rule treats ANY active oral anticoagulant (DOAC or
// warfarin) as satisfying the requirement. A second "valvular AFib
// requires warfarin" rule and a "non-valvular AFib on warfarin
// → consider DOAC switch" rule are future Phase 3 candidates.
//
// CHA₂DS₂-VASc components and point values (verbatim from Table 10):
//   C  +1 — Heart failure (HFrEF, HFmrEF, HFpEF: signs/symptoms
//           of right or left HF confirmed objectively)
//   H  +1 — Hypertension (BP >140/90 on 2 occasions OR on
//           antihypertensive treatment)
//   A2 +2 — Age ≥75
//   D  +1 — Diabetes (FBS ≥126 mg/dL OR treatment with hypoglycemic
//           agent and/or insulin)
//   S2 +2 — Prior stroke, TIA, peripheral embolism, or pulmonary
//           embolism
//   V  +1 — Vascular disease (CAD: prior MI, angina, PCI, CABG; or
//           peripheral vascular disease)
//   A  +1 — Age 65–74
//   Sc +1 — Female sex
//
// Atrial flutter (I48.3, I48.4, I48.92) is managed identically to
// AFib for thromboembolic risk per the 2023 guideline; included.
//
// Suppression: any active oral anticoagulant prescription (RxCUI
// match against ANTICOAGULANT_RXCUI_SET or generic-name fallback).
// Inactive prescriptions (status !== 'active') do NOT suppress.
//
// Unknown sex: rule emits NO finding. Sex modifies the threshold
// (≥2 vs ≥3) so applying the wrong threshold risks misclassification
// in either direction. Safer to defer than to guess. Documented in
// ADR 0010.
//
// Contraindications to anticoagulation (high bleed risk, HAS-BLED
// scoring, recent intracranial hemorrhage, etc.) are NOT modeled in
// v1. The clinician adjudicates contraindications at the bedside.
// A HAS-BLED scoring rule is a Phase 3 candidate.
//
// lastReviewed: 2026-05-13
// reviewedBy:   Brandon Sterne, RN BSN
// nextReviewDue: 2027-05-13
// ============================================================

import type {
  Finding,
  PatientBundle,
  RuleFunction,
} from '../types';

// ── AFib + AFlutter ICD-10 codes ─────────────────────────────────────────────
// Verified against ICD-10-CM 2026 (icd10data.com).
export const AFIB_ICD_CODES: readonly string[] = [
  'I48.0',   // Paroxysmal AF
  'I48.1',   // Persistent AF (parent)
  'I48.11',  // Longstanding persistent AF
  'I48.19',  // Other persistent AF
  'I48.2',   // Chronic AF (parent)
  'I48.20',  // Chronic AF unspecified
  'I48.21',  // Permanent AF
  'I48.9',   // AF unspecified (parent)
  'I48.91',  // Unspecified AF
  'I48.3',   // Typical atrial flutter
  'I48.4',   // Atypical atrial flutter
  'I48.92',  // Unspecified atrial flutter
];

// ── Oral anticoagulant RxCUIs ────────────────────────────────────────────────
// Verified live against rxnav.nlm.nih.gov on 2026-05-13.
export const ANTICOAGULANT_RXCUIS: Record<string, string> = {
  warfarin: '11289',
  apixaban: '1364430',
  rivaroxaban: '1114195',
  dabigatran: '1546356',
  edoxaban: '1599538',
};

export const ANTICOAGULANT_RXCUI_SET: ReadonlySet<string> = new Set(
  Object.values(ANTICOAGULANT_RXCUIS)
);

export const ANTICOAGULANT_GENERIC_NAMES: readonly string[] = Object.freeze(
  Object.keys(ANTICOAGULANT_RXCUIS)
);

// ── CHA₂DS₂-VASc component code sets ─────────────────────────────────────────
// HF: full I50.x family (covers HFrEF, HFmrEF, HFpEF) plus I11.0
//     (hypertensive heart disease with HF).
export const CHADSVASC_HF_CODES: readonly string[] = [
  // HFrEF (systolic + combined)
  'I50.20', 'I50.21', 'I50.22', 'I50.23',
  'I50.40', 'I50.41', 'I50.42', 'I50.43',
  // HFmrEF
  'I50.810', 'I50.811', 'I50.812', 'I50.813', 'I50.814',
  // HFpEF (diastolic)
  'I50.30', 'I50.31', 'I50.32', 'I50.33',
  // Unspecified HF
  'I50.9', 'I50.1',
  // HHD with HF
  'I11.0',
  // SNOMED HF codes (mirror gdmt-hfref.ts)
  '84114007', '703272007',
];

// Hypertension: essential + hypertensive heart disease + hypertensive
// CKD + hypertensive heart-and-CKD + secondary hypertension.
function isChadsvascHtnCode(code: string): boolean {
  if (code === 'I10') return true;
  for (const prefix of ['I11', 'I12', 'I13', 'I15']) {
    if (code.startsWith(prefix)) return true;
  }
  return false;
}

// Diabetes (T1DM + T2DM).
function isChadsvascDmCode(code: string): boolean {
  return code.startsWith('E10') || code.startsWith('E11');
}

// Stroke / TIA / peripheral embolism / pulmonary embolism.
function isChadsvascStrokeCode(code: string): boolean {
  if (code.startsWith('I63')) return true;  // Cerebral infarction
  if (code.startsWith('G45')) return true;  // TIA
  if (code.startsWith('I74')) return true;  // Arterial embolism/thrombosis
  if (code.startsWith('I26')) return true;  // Pulmonary embolism
  return false;
}

// Vascular disease: CAD (I20-I25) or peripheral vascular disease
// (I70.x atherosclerosis, I73.9 PVD unspecified).
function isChadsvascVascularCode(code: string): boolean {
  if (code.startsWith('I70')) return true;
  if (code === 'I73.9' || code.startsWith('I73')) return true;
  for (const prefix of ['I20', 'I21', 'I22', 'I23', 'I24', 'I25']) {
    if (code.startsWith(prefix)) return true;
  }
  return false;
}

// ── Thresholds ───────────────────────────────────────────────────────────────
export const CHADSVASC_MALE_THRESHOLD = 2;
export const CHADSVASC_FEMALE_THRESHOLD = 3;
export const AGE_BAND_LOW_MIN = 65;
export const AGE_BAND_LOW_MAX = 74;
export const AGE_HIGH_MIN = 75;

const RULE_ID = 'afib-anticoagulation';
const RULE_NAME = 'AFib stroke-prevention anticoagulation (2023 ACC/AHA/ACCP/HRS)';

// ── Helpers ──────────────────────────────────────────────────────────────────
function ageInYears(dob: string | undefined, asOf: Date): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return undefined;
  let years = asOf.getUTCFullYear() - birth.getUTCFullYear();
  const m = asOf.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && asOf.getUTCDate() < birth.getUTCDate())) {
    years -= 1;
  }
  return years;
}

function hasAfib(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) => AFIB_ICD_CODES.includes(c.code));
}

function onActiveAnticoagulant(bundle: PatientBundle): boolean {
  for (const med of bundle.medications) {
    if (med.status !== 'active') continue;
    if (med.rxnormCode && ANTICOAGULANT_RXCUI_SET.has(med.rxnormCode)) return true;
    const haystacks = [med.genericName, med.name]
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.toLowerCase());
    if (haystacks.length === 0) continue;
    if (ANTICOAGULANT_GENERIC_NAMES.some((g) => haystacks.some((h) => h.includes(g)))) {
      return true;
    }
  }
  return false;
}

export interface ChadsvascResult {
  score: number;
  components: string[];
}

export function calculateChaDsVasc(
  bundle: PatientBundle,
  asOf: Date = new Date()
): ChadsvascResult {
  const components: string[] = [];
  let score = 0;

  const codes = bundle.conditions.map((c) => c.code);

  if (codes.some((c) => CHADSVASC_HF_CODES.includes(c))) {
    score += 1;
    components.push('CHF (+1)');
  }
  if (codes.some(isChadsvascHtnCode)) {
    score += 1;
    components.push('hypertension (+1)');
  }

  const age = ageInYears(bundle.patient.dob, asOf);
  if (age !== undefined && age >= AGE_HIGH_MIN) {
    score += 2;
    components.push(`age ≥${AGE_HIGH_MIN} (+2)`);
  } else if (age !== undefined && age >= AGE_BAND_LOW_MIN && age <= AGE_BAND_LOW_MAX) {
    score += 1;
    components.push(`age ${AGE_BAND_LOW_MIN}–${AGE_BAND_LOW_MAX} (+1)`);
  }

  if (codes.some(isChadsvascDmCode)) {
    score += 1;
    components.push('diabetes (+1)');
  }
  if (codes.some(isChadsvascStrokeCode)) {
    score += 2;
    components.push('prior stroke/TIA/thromboembolism (+2)');
  }
  if (codes.some(isChadsvascVascularCode)) {
    score += 1;
    components.push('vascular disease (+1)');
  }

  const sex = (bundle.patient.sex ?? '').toLowerCase();
  if (sex === 'female') {
    score += 1;
    components.push('female sex (+1)');
  }

  return { score, components };
}

// ── Rule ─────────────────────────────────────────────────────────────────────
export const afibAnticoagulationRule: RuleFunction = (
  bundle: PatientBundle
): Finding[] => {
  if (!hasAfib(bundle)) return [];
  if (onActiveAnticoagulant(bundle)) return [];

  // Unknown-sex safer default: do not fire.
  const sex = (bundle.patient.sex ?? '').toLowerCase();
  if (sex !== 'male' && sex !== 'female') return [];

  const nowDate = new Date();
  const { score, components } = calculateChaDsVasc(bundle, nowDate);

  const threshold =
    sex === 'female' ? CHADSVASC_FEMALE_THRESHOLD : CHADSVASC_MALE_THRESHOLD;
  if (score < threshold) return [];

  const now = nowDate.toISOString();
  const sexLabel = sex === 'female' ? 'female' : 'male';

  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'afib-anticoagulation',
      status: 'missing',
      summary: `AFib with CHA₂DS₂-VASc ${score} (${sexLabel} threshold ≥${threshold}) — anticoagulation recommended (Class 1, LOE A). Components: ${components.join(', ')}.`,
      recommendation:
        'Initiate oral anticoagulation. DOAC preferred over warfarin in non-valvular AFib. Review bleeding risk and contraindications before prescribing.',
      evidence: {
        conditionsExamined: bundle.conditions.map((c) => c.code),
        medicationsExamined: bundle.medications
          .filter((m) => m.status === 'active')
          .map((m) => m.name),
        // Repurpose contraindicationReason to carry the score/components
        // payload for machine-readable downstream consumers (pending the
        // future evidence.qualifyingPaths field — see ADR 0009).
        contraindicationReason: `CHA₂DS₂-VASc ${score} (${sexLabel} threshold ≥${threshold}): ${components.join(', ')}`,
      },
      timestamp: now,
    },
  ];
};
