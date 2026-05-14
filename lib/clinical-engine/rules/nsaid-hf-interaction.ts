// ============================================================
// NSAID-HFrEF INTERACTION — DO NOT MODIFY WITHOUT CLINICAL REVIEW
//
// Source: 2022 AHA/ACC/HFSA Guideline for the Management of Heart
//         Failure. Heidenreich PA, et al.
//         Circulation. 2022;145:e895–e1032. Published 2022-05-03.
//         DOI: 10.1161/CIR.0000000000001063
//         URL: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063
//
// Section 7.3.2 — Medications of Unproven Value or That May Worsen
// HF — Recommendation 7 (verbatim from primary text):
//   "In patients with HFrEF, NSAIDs worsen HF symptoms and should
//    be avoided or withdrawn whenever possible."
//
// Class of Recommendation: 3: Harm.
// Level of Evidence: B-NR (non-randomized).
//
// Supportive text (verbatim): "Several observational cohort studies
// have revealed increased morbidity and mortality in patients with
// HF using either nonselective or selective NSAIDs." → COX-2
// selective inhibitors (celecoxib) are explicitly in scope.
// Mechanism: prostaglandin inhibition → renal sodium/water retention,
// blunted diuretic response, increased systemic vascular resistance.
//
// Scope decisions (see docs/decisions/0007-nsaid-hf-interaction-rule.md):
//   - HFrEF only. The recommendation text is "In patients with HFrEF",
//     and it lives in Section 7.3.2 of the HFrEF chapter. Broader-HF
//     pharmacology is plausible but not Class 3 in the 2022 guideline.
//     Reuses HFREF_CONDITION_CODES from gdmt-hfref.ts.
//   - Aspirin is EXCLUDED from detection. Cardioprotective low-dose
//     aspirin is the dominant outpatient use case; the recommendation
//     text says "NSAIDs", not "aspirin or NSAIDs". Including aspirin
//     would generate massive false-positive load and contradict the
//     clinical intent of the recommendation.
//   - Topical NSAIDs are SUPPRESSED when the route field clearly
//     indicates topical/transdermal/cutaneous administration (low
//     systemic absorption; not the pharmacology the recommendation
//     targets). If route is missing or ambiguous, the finding fires
//     (safer default).
//   - Status 'interaction' is introduced here as a new FindingStatus
//     value. Distinct from 'contraindicated' (which the GDMT rule
//     uses for "patient missing this drug AND we shouldn't start
//     it"). 'interaction' means "patient IS on a drug that should
//     be withdrawn." Different clinical action.
//
// lastReviewed: 2026-05-13
// reviewedBy:   Brandon Sterne, RN BSN
// nextReviewDue: 2027-05-13
// ============================================================

import type {
  Finding,
  PatientBundle,
  PatientMedication,
  RuleFunction,
} from '../types';
import { HFREF_CONDITION_CODES } from './gdmt-hfref';

// NSAID ingredient RxCUIs (verified against the live RxNorm REST API
// at rxnav.nlm.nih.gov on 2026-05-13). Match by ingredient — RxNorm
// product-level codes (oral tablet, gel, etc.) roll up to these.
// Aspirin (RxCUI 1191) is DELIBERATELY OMITTED; see header.
export const NSAID_RXCUIS: Record<string, string> = {
  ibuprofen: '5640',
  naproxen: '7258',
  diclofenac: '3355',
  meloxicam: '41493',
  celecoxib: '140587',
  indomethacin: '5781',
  ketorolac: '35827',
  nabumetone: '31448',
  piroxicam: '8356',
  etodolac: '24605',
  sulindac: '10237',
};

export const NSAID_RXCUI_SET: ReadonlySet<string> = new Set(
  Object.values(NSAID_RXCUIS)
);

// Generic-name fallbacks when rxnormCode is missing from the
// medication record. Lowercase substring match — same pattern as
// the GDMT rule's medMatchesPillar.
export const NSAID_GENERIC_NAMES: readonly string[] = Object.freeze(
  Object.keys(NSAID_RXCUIS)
);

// Route keywords that suppress the finding (topical NSAIDs out of
// scope). Case-insensitive substring match against medication.route.
const TOPICAL_ROUTE_KEYWORDS: readonly string[] = [
  'topical',
  'transdermal',
  'cutaneous',
];

const RULE_ID = 'nsaid-hf-interaction';
const RULE_NAME = 'NSAID prescribed in HFrEF (Class 3: Harm)';

function isActive(med: PatientMedication): boolean {
  return med.status === 'active';
}

function isTopicalRoute(route: string | undefined): boolean {
  if (!route) return false;
  const r = route.toLowerCase();
  return TOPICAL_ROUTE_KEYWORDS.some((kw) => r.includes(kw));
}

function nsaidIngredientMatch(med: PatientMedication): string | undefined {
  if (med.rxnormCode && NSAID_RXCUI_SET.has(med.rxnormCode)) {
    // Reverse-lookup the ingredient name for the Finding summary.
    for (const [name, cui] of Object.entries(NSAID_RXCUIS)) {
      if (cui === med.rxnormCode) return name;
    }
  }
  const haystacks = [med.genericName, med.name]
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.toLowerCase());
  if (haystacks.length === 0) return undefined;
  for (const generic of NSAID_GENERIC_NAMES) {
    if (haystacks.some((h) => h.includes(generic))) return generic;
  }
  return undefined;
}

export const nsaidHfInteractionRule: RuleFunction = (
  bundle: PatientBundle
): Finding[] => {
  // Gate 1: HFrEF only. Reuses the established condition set.
  const hasHfref = bundle.conditions.some((c) =>
    HFREF_CONDITION_CODES.includes(c.code)
  );
  if (!hasHfref) return [];

  const now = new Date().toISOString();
  const findings: Finding[] = [];
  const conditionCodes = bundle.conditions.map((c) => c.code);

  for (const med of bundle.medications) {
    if (!isActive(med)) continue;
    if (isTopicalRoute(med.route)) continue;

    const ingredient = nsaidIngredientMatch(med);
    if (!ingredient) continue;

    findings.push({
      ruleId: RULE_ID,
      ruleName: RULE_NAME,
      severity: 'critical',
      category: 'nsaid-hf-interaction',
      subcategory: ingredient,
      status: 'interaction',
      summary: `${med.name}: NSAID active in HFrEF — Class 3 (Harm), 2022 AHA/ACC/HFSA HF Guideline. NSAIDs blunt diuretic response and worsen HF.`,
      recommendation: `Discontinue ${ingredient} or substitute a non-NSAID analgesic (e.g., acetaminophen). If pain requires anti-inflammatory therapy, consult cardiology.`,
      evidence: {
        conditionsExamined: conditionCodes,
        medicationsExamined: [med.name],
      },
      timestamp: now,
    });
  }

  return findings;
};
