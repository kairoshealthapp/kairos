// Cross-clinic rule runner. Imports every committed rule from the
// clinical-engine public barrel and runs it against a PatientBundle,
// returning a flat Finding[].
//
// Rules 1-11 are Phase 1+2 (cardiology + early multi-specialty).
// Rules 12-23 are Phase 3 / Session 53 (family practice, internal
// medicine, pulmonology HEDIS-aligned measures).
//
// NOTE: aisAdultImmunizationRule (#17) and tscTobaccoCessationRule
// (#23) emit multiple Findings per rule (one per missing vaccine /
// one per cessation gap). Downstream UI must handle findings.length
// from a single ruleId being > 1.

import {
  // Phase 1+2
  gdmtHfrefRule,
  lpaScreeningRule,
  nsaidHfInteractionRule,
  apoBMeasurementRule,
  statinInitiationRule,
  afibAnticoagulationRule,
  postMiBetaBlockerRule,
  postMiAceiArbRule,
  t2dmSglt2iCkdRule,
  t2dmStatinRule,
  hfpefSglt2iRule,
  // Phase 3 — family practice (HEDIS)
  cbpHypertensionControlRule,
  gsdGlycemicStatusRule,
  colColorectalScreeningRule,
  bcsBreastScreeningRule,
  // Phase 3 — internal medicine
  ckdAceiArbRule,
  aisAdultImmunizationRule,
  osteoporosisScreeningRule,
  depressionScreeningRule,
  // Phase 3 — pulmonology
  copdGoldAbeRule,
  asthmaControllerRule,
  lscLungCancerScreeningRule,
  tscTobaccoCessationRule,
} from "@/lib/clinical-engine";

// Order matters only for stable display; rules are independent.
const RULES = [
  gdmtHfrefRule,
  hfpefSglt2iRule,
  postMiBetaBlockerRule,
  postMiAceiArbRule,
  afibAnticoagulationRule,
  nsaidHfInteractionRule,
  statinInitiationRule,
  t2dmStatinRule,
  t2dmSglt2iCkdRule,
  apoBMeasurementRule,
  lpaScreeningRule,
  cbpHypertensionControlRule,
  gsdGlycemicStatusRule,
  colColorectalScreeningRule,
  bcsBreastScreeningRule,
  ckdAceiArbRule,
  aisAdultImmunizationRule,
  osteoporosisScreeningRule,
  depressionScreeningRule,
  copdGoldAbeRule,
  asthmaControllerRule,
  lscLungCancerScreeningRule,
  tscTobaccoCessationRule,
];

export default function runAllRules(bundle) {
  if (!bundle) return [];
  const findings = [];
  for (const rule of RULES) {
    try {
      const out = rule(bundle);
      if (Array.isArray(out)) {
        for (const f of out) findings.push(f);
      }
    } catch (e) {
      if (typeof console !== "undefined") {
        // eslint-disable-next-line no-console
        console.warn("[runAllRules] rule threw", e && e.message);
      }
    }
  }
  return findings;
}
