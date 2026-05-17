// ============================================================
// ASTHMA — ICS-CONTAINING CONTROLLER THERAPY GAP
//   DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Underlying guideline source:
//   Global Initiative for Asthma (GINA) 2024 Strategy Report.
//   URL: https://ginasthma.org/2024-gina-main-report/
//   AND
//   2020 Focused Updates to the Asthma Management Guidelines (NAEPP).
//   National Heart, Lung, and Blood Institute. JACI. 2020;146(6):1217-1270.
//   DOI: 10.1016/j.jaci.2020.10.003
//   URL: https://www.nhlbi.nih.gov/health-topics/asthma-management-guidelines-2020-updates
//
// Recommendation (paraphrased; verbatim text behind ginasthma.org
//   and nhlbi.nih.gov access pages):
//   - GINA 2024 Track 1 preferred controller: ICS-formoterol
//     (single inhaler maintenance and reliever, MART).
//   - All adults and adolescents with asthma should receive
//     ICS-containing therapy; SABA-only is no longer
//     guideline-recommended.
//
// Rule shape: #9 Conditional-population therapy-gap. Reuses the
//   shape from t2dm-sglt2i-ckd (ADR 0015) with a single qualifier
//   (active asthma diagnosis + uncontrolled-evidence) and a drug-
//   class gap (any ICS-containing controller).
//
// Uncontrolled evidence (any one suffices):
//   - SABA dispensing ≥2 canisters in last 12 months — approximated
//     here as ≥1 active SABA prescription, since canister-dispensing
//     events are not in PatientBundle. v2 enhancement.
//   - Asthma exacerbation ICD J45.901/J45.21/J45.31/J45.41/J45.51
//     onset in last 12 months.
//   - ER visit / hospital admission for asthma: NOT modeled (no
//     Encounter slot in PatientBundle).
//
// ICS-containing controllers (drug-class match):
//   - ICS monotherapy: fluticasone, budesonide, mometasone,
//     beclomethasone, ciclesonide.
//   - ICS-LABA: fluticasone/salmeterol, budesonide/formoterol,
//     mometasone/formoterol, fluticasone/vilanterol.
//   - ICS-LABA-LAMA: fluticasone/umeclidinium/vilanterol (Trelegy),
//     budesonide/glycopyrrolate/formoterol.
//   Generic-name substring match covers any inhaled steroid.
//
// v1 scope decisions:
//   - SABA-only count check is approximated by "any SABA + asthma
//     ICD + no ICS". Refill-cadence detection is v2.
//   - Severity stratification (Step 1-5) NOT modeled; rule fires
//     once when ICS is missing.
//   - Allergic component (allergy testing, biologics for severe
//     eos asthma) NOT modeled.
//   - Aspirin-exacerbated respiratory disease (AERD) suppression
//     NOT modeled.
//
// lastReviewed: 2026-05-17
// reviewedBy:   Brandon Sterne, RN BSN
// nextReviewDue: 2027-05-17
// ============================================================

import type {
  Finding,
  PatientBundle,
  RuleFunction,
} from '../types';
import { COPD_ICS_GENERIC_NAMES, COPD_SABA_GENERIC_NAMES } from './copd-gold-abe';

export const ASTHMA_ICD_PREFIX = 'J45';
export const ASTHMA_EXACERBATION_WINDOW_MONTHS = 12;

// Asthma exacerbation ICDs — J45.x01 acute exacerbation pattern.
export const ASTHMA_EXACERBATION_ICD_SUFFIXES: readonly string[] = ['.901', '.21', '.31', '.41', '.51', '.22', '.32', '.42', '.52'];

const RULE_ID = 'asthma-controller';
const RULE_NAME = 'Asthma ICS-containing controller (GINA 2024 / NAEPP 2020)';

function monthsBetween(a: Date, b: Date): number {
  return (
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 +
    (b.getUTCMonth() - a.getUTCMonth())
  );
}

function hasAsthma(bundle: PatientBundle): boolean {
  return bundle.conditions.some((c) => c.code.startsWith(ASTHMA_ICD_PREFIX));
}

function hasRecentExacerbation(bundle: PatientBundle, now: Date): boolean {
  for (const c of bundle.conditions) {
    if (!c.code.startsWith(ASTHMA_ICD_PREFIX)) continue;
    const isExac = ASTHMA_EXACERBATION_ICD_SUFFIXES.some((s) => c.code.endsWith(s));
    if (!isExac) continue;
    if (!c.onsetDate) continue;
    const onset = new Date(c.onsetDate);
    if (Number.isNaN(onset.getTime())) continue;
    if (monthsBetween(onset, now) <= ASTHMA_EXACERBATION_WINDOW_MONTHS) return true;
  }
  return false;
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

export const asthmaControllerRule: RuleFunction = (bundle: PatientBundle): Finding[] => {
  if (!hasAsthma(bundle)) return [];

  const onIcs = hasActiveDrugClass(bundle, COPD_ICS_GENERIC_NAMES);
  if (onIcs) return [];

  const onSaba = hasActiveDrugClass(bundle, COPD_SABA_GENERIC_NAMES);
  const now = new Date();
  const recentExac = hasRecentExacerbation(bundle, now);

  // Uncontrolled signal: active SABA prescription OR recent exacerbation.
  if (!onSaba && !recentExac) return [];

  const qualifiers: string[] = [];
  if (onSaba) qualifiers.push('active SABA');
  if (recentExac) qualifiers.push(`asthma exacerbation in last ${ASTHMA_EXACERBATION_WINDOW_MONTHS} months`);

  return [
    {
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'gap',
      category: 'asthma-controller',
      status: 'missing',
      summary: `Asthma with ${qualifiers.join(' + ')} but no ICS-containing controller — GINA 2024 / NAEPP 2020 recommend ICS-containing therapy for all adults/adolescents with asthma.`,
      recommendation:
        'Initiate ICS-containing controller. GINA Track 1 preferred: ICS-formoterol (e.g., budesonide-formoterol) for MART. Alternative: ICS-LABA fixed-dose with separate SABA.',
      evidence: {
        conditionsExamined: bundle.conditions.map((c) => c.code),
        medicationsExamined: bundle.medications.filter((m) => m.status === 'active').map((m) => m.name),
        contraindicationReason: qualifiers.join('; '),
      },
      timestamp: now.toISOString(),
    },
  ];
};
