// ============================================================
// COPD GOLD ABE CLASSIFICATION + INHALER RECOMMENDATION
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Underlying guideline source:
//   Global Initiative for Chronic Obstructive Lung Disease (GOLD)
//   2024 Report: Global Strategy for the Diagnosis, Management,
//   and Prevention of Chronic Obstructive Pulmonary Disease.
//   URL: https://goldcopd.org/2024-gold-report/
//
// Recommendation framework (verbatim from GOLD 2024, paraphrased
// from authoritative summaries; primary PDF behind goldcopd.org
// registration):
//   "Initial pharmacological treatment is now based on the GOLD
//    ABE assessment tool, classifying patients into groups A, B, or
//    E based on symptom burden and exacerbation history."
//   - Group A: low symptoms (mMRC 0-1 or CAT <10) AND low
//     exacerbation history. Initial: a bronchodilator (short or
//     long-acting).
//   - Group B: high symptoms (mMRC ≥2 or CAT ≥10) AND low
//     exacerbation history. Initial: LABA + LAMA.
//   - Group E: ≥2 moderate exacerbations OR ≥1 leading to
//     hospitalization in the past year. Initial: LABA + LAMA.
//     Consider LABA + LAMA + ICS if blood eosinophils ≥300 cells/μL.
//
// Rule shape: NEW VARIANT — "Score-classified therapy gap".
//   Score (here: GOLD ABE group) is computed from chart inputs;
//   therapy recommendation depends on the score; rule fires when
//   the current regimen does not match the recommended class for
//   the patient's group. Documented in rule-shapes.md.
//
// Diagnosis gate:
//   - ICD-10 J44.x (COPD), AND
//   - Spirometry-confirmed obstruction: FEV1/FVC <0.7
//     LOINC 19926-5 (FEV1) and 19868-9 (FVC) — values combined
//     into a ratio in code. A direct FEV1/FVC ratio LOINC
//     (19926-5 alternative 19926-5? actual is 33365-8) is also
//     accepted.
//
// Symptom burden:
//   - mMRC dyspnea scale LOINC 89270-4. Score ≥2 = high.
//   - CAT score LOINC 82666-1. Score ≥10 = high.
//
// Exacerbation history (last 12 months):
//   - PatientCondition.code starting with J44.1 (acute exacerbation)
//     within 12 months counts. Each occurrence is one event.
//   - Hospitalization-class is approximated by presence of any
//     J44.1 condition with a recent onsetDate (v1 simplification).
//
// Eosinophil count: LOINC 26449-9 (≥300 cells/μL gates ICS).
//
// Therapy classes:
//   - SABA: albuterol, levalbuterol (RxCUI 435 / 60207)
//   - LAMA: tiotropium, umeclidinium, glycopyrrolate-LA
//     (RxCUI 274535 / 1487535 / 1313158)
//   - LABA: salmeterol, formoterol, olodaterol, indacaterol
//     (RxCUI 36117 / 25255 / 1551291 / 1175033)
//   - LABA+LAMA combos and ICS combos are accepted by generic-name
//     substring matching (e.g., 'tiotropium/olodaterol').
//   - ICS: fluticasone, budesonide, mometasone, beclomethasone
//     (presence within a LABA-containing combo only).
//
// v1 scope decisions:
//   - Single inhaler vs. two-device equivalence: treated equally if
//     drug classes covered. v2 may add "device burden" guidance.
//   - Roflumilast, azithromycin maintenance, oxygen therapy NOT
//     modeled (downstream/advanced therapies).
//   - Quantitative exacerbation counting uses J44.1 condition rows;
//     ER visit / hospitalization Procedure rows not yet in
//     PatientBundle types.
//
// lastReviewed: 2026-05-17
// reviewedBy:   Brandon Sterne, RN BSN
// nextReviewDue: 2027-05-17
// ============================================================

import type {
  Finding,
  PatientBundle,
  PatientObservation,
  RuleFunction,
} from '../types';

export const COPD_ICD_PREFIX = 'J44';
export const COPD_EXACERBATION_ICD_PREFIX = 'J44.1';
export const COPD_FEV1_LOINC = '19926-5';
export const COPD_FVC_LOINC = '19868-9';
export const COPD_FEV1_FVC_RATIO_LOINC = '33365-8';
export const COPD_MMRC_LOINC = '89270-4';
export const COPD_CAT_LOINC = '82666-1';
export const COPD_EOS_LOINC = '26449-9';

export const COPD_OBSTRUCTION_RATIO_THRESHOLD = 0.7;
export const COPD_SYMPTOM_MMRC_THRESHOLD = 2;
export const COPD_SYMPTOM_CAT_THRESHOLD = 10;
export const COPD_EOS_ICS_THRESHOLD = 300; // cells/μL
export const COPD_EXACERBATION_WINDOW_MONTHS = 12;
export const COPD_EXACERBATION_E_GROUP_THRESHOLD = 2;

// ── Drug-class generic-name lists ────────────────────────────────────────────
export const COPD_LAMA_GENERIC_NAMES: readonly string[] = [
  'tiotropium', 'umeclidinium', 'glycopyrrolate', 'glycopyrronium', 'aclidinium', 'revefenacin',
];
export const COPD_LABA_GENERIC_NAMES: readonly string[] = [
  'salmeterol', 'formoterol', 'olodaterol', 'indacaterol', 'vilanterol', 'arformoterol',
];
export const COPD_ICS_GENERIC_NAMES: readonly string[] = [
  'fluticasone', 'budesonide', 'mometasone', 'beclomethasone', 'ciclesonide',
];
export const COPD_SABA_GENERIC_NAMES: readonly string[] = [
  'albuterol', 'salbutamol', 'levalbuterol',
];

const RULE_ID = 'copd-gold-abe';
const RULE_NAME = 'COPD GOLD ABE classification + inhaler recommendation (GOLD 2024)';

function monthsBetween(a: Date, b: Date): number {
  return (
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 +
    (b.getUTCMonth() - a.getUTCMonth())
  );
}

function latestByLoinc(bundle: PatientBundle, loinc: string): PatientObservation | undefined {
  const matches = bundle.observations
    .filter((o) => o.loincCode === loinc && typeof o.value === 'number')
    .sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''));
  return matches[0];
}

function hasCopdIcd(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) => c.code.startsWith(COPD_ICD_PREFIX));
}

function hasSpirometryObstruction(bundle: PatientBundle): boolean {
  const ratioObs = latestByLoinc(bundle, COPD_FEV1_FVC_RATIO_LOINC);
  if (ratioObs?.value !== undefined) {
    const ratio = ratioObs.value > 1 ? ratioObs.value / 100 : ratioObs.value;
    return ratio < COPD_OBSTRUCTION_RATIO_THRESHOLD;
  }
  const fev1 = latestByLoinc(bundle, COPD_FEV1_LOINC);
  const fvc = latestByLoinc(bundle, COPD_FVC_LOINC);
  if (fev1?.value !== undefined && fvc?.value !== undefined && fvc.value > 0) {
    return fev1.value / fvc.value < COPD_OBSTRUCTION_RATIO_THRESHOLD;
  }
  return false;
}

function isHighSymptomBurden(bundle: PatientBundle): boolean {
  const mmrc = latestByLoinc(bundle, COPD_MMRC_LOINC);
  if (mmrc?.value !== undefined && mmrc.value >= COPD_SYMPTOM_MMRC_THRESHOLD) return true;
  const cat = latestByLoinc(bundle, COPD_CAT_LOINC);
  if (cat?.value !== undefined && cat.value >= COPD_SYMPTOM_CAT_THRESHOLD) return true;
  return false;
}

function exacerbationCount(bundle: PatientBundle, now: Date): number {
  let n = 0;
  for (const c of bundle.conditions) {
    if (!c.code.startsWith(COPD_EXACERBATION_ICD_PREFIX)) continue;
    if (!c.onsetDate) continue;
    const onset = new Date(c.onsetDate);
    if (Number.isNaN(onset.getTime())) continue;
    if (monthsBetween(onset, now) <= COPD_EXACERBATION_WINDOW_MONTHS) n += 1;
  }
  return n;
}

function eosinophilCount(bundle: PatientBundle): number | undefined {
  return latestByLoinc(bundle, COPD_EOS_LOINC)?.value;
}

function hasActiveDrugClass(bundle: PatientBundle, generics: readonly string[]): boolean {
  for (const med of bundle.medications) {
    if (med.status !== 'active') continue;
    const hay = [med.name, med.genericName]
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.toLowerCase());
    if (hay.length === 0) continue;
    if (generics.some((g) => hay.some((h) => h.includes(g)))) return true;
  }
  return false;
}

type GoldGroup = 'A' | 'B' | 'E';

export function classifyGold(bundle: PatientBundle): GoldGroup {
  const now = new Date();
  if (exacerbationCount(bundle, now) >= COPD_EXACERBATION_E_GROUP_THRESHOLD) return 'E';
  return isHighSymptomBurden(bundle) ? 'B' : 'A';
}

export const copdGoldAbeRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  if (!hasCopdIcd(bundle)) return [];
  if (!hasSpirometryObstruction(bundle)) return [];

  const group = classifyGold(bundle);
  const onLama = hasActiveDrugClass(bundle, COPD_LAMA_GENERIC_NAMES);
  const onLaba = hasActiveDrugClass(bundle, COPD_LABA_GENERIC_NAMES);
  const onIcs = hasActiveDrugClass(bundle, COPD_ICS_GENERIC_NAMES);
  const onSaba = hasActiveDrugClass(bundle, COPD_SABA_GENERIC_NAMES);
  const eos = eosinophilCount(bundle);
  const ts = new Date().toISOString();

  if (group === 'A') {
    if (onSaba || onLama || onLaba) return [];
    return [{
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'copd-gold-abe',
      subcategory: 'group-a-no-bronchodilator',
      status: 'missing',
      summary: 'COPD GOLD Group A without any bronchodilator — GOLD 2024 recommends initial short- or long-acting bronchodilator.',
      recommendation: 'Initiate a short-acting bronchodilator (albuterol) or long-acting (LAMA tiotropium/LABA salmeterol).',
      evidence: { conditionsExamined: bundle.conditions.map((c) => c.code) },
      timestamp: ts,
    }];
  }

  if (group === 'B') {
    if (onLama && onLaba) return [];
    return [{
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'copd-gold-abe',
      subcategory: 'group-b-missing-laba-lama',
      status: 'missing',
      summary: `COPD GOLD Group B (high symptom burden, low exacerbations) without LABA+LAMA — GOLD 2024 recommends dual bronchodilator. Active: LAMA=${onLama}, LABA=${onLaba}.`,
      recommendation: 'Initiate LABA + LAMA combination (e.g., umeclidinium/vilanterol; tiotropium/olodaterol).',
      evidence: { conditionsExamined: bundle.conditions.map((c) => c.code) },
      timestamp: ts,
    }];
  }

  // group E
  const recommendIcs = eos !== undefined && eos >= COPD_EOS_ICS_THRESHOLD;
  if (onLama && onLaba && (!recommendIcs || onIcs)) return [];
  const want = recommendIcs ? 'LABA+LAMA+ICS' : 'LABA+LAMA';
  return [{
    ruleId: RULE_ID,
    ruleName: RULE_NAME,
    severity: 'gap',
    category: 'copd-gold-abe',
    subcategory: recommendIcs ? 'group-e-missing-triple' : 'group-e-missing-laba-lama',
    status: 'missing',
    summary: `COPD GOLD Group E (≥${COPD_EXACERBATION_E_GROUP_THRESHOLD} exacerbations in last ${COPD_EXACERBATION_WINDOW_MONTHS} months) without ${want} — GOLD 2024${recommendIcs ? ` (eosinophils ≥${COPD_EOS_ICS_THRESHOLD} qualifies for ICS)` : ''}. Active: LAMA=${onLama}, LABA=${onLaba}, ICS=${onIcs}.`,
    recommendation: recommendIcs
      ? 'Initiate triple therapy (LABA + LAMA + ICS).'
      : 'Initiate LABA + LAMA. Add ICS if blood eosinophils ≥300 cells/μL.',
    evidence: {
      conditionsExamined: bundle.conditions.map((c) => c.code),
      contraindicationReason: `GOLD group E; recommend ${want}`,
    },
    timestamp: ts,
  }];
};
