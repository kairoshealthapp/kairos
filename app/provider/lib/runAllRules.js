// Cross-clinic rule runner. Imports every committed rule from the
// clinical-engine public barrel and runs it against a PatientBundle,
// returning a flat Finding[]. New rules added by Session A become
// available by adding one line below once they are exported from
// @/lib/clinical-engine.

import {
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
