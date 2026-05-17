# 0026 — Asthma ICS-containing controller rule

- **Status:** Accepted
- **Date:** 2026-05-17
- **Index:** [← back to docs index](../INDEX.md)

## Context

Twenty-first rule. Second pulmonology rule. GINA 2024 and NAEPP 2020 both unambiguously recommend ICS-containing therapy for all adults/adolescents with asthma. SABA-only treatment is no longer guideline-recommended; the SABA-monotherapy patient is the canonical "Step 1 underuse" failure mode this rule targets.

Structurally this is shape #9 (conditional-population therapy-gap) with two qualifying-condition paths: active SABA prescription OR recent exacerbation.

## Decision

Ship as `asthmaControllerRule`. Reuse `COPD_ICS_GENERIC_NAMES` and `COPD_SABA_GENERIC_NAMES` from `copd-gold-abe` — the drug classes are identical, just used differently.

### Uncontrolled signal (v1)

- Active SABA prescription, OR
- Asthma exacerbation ICD (J45.x with suffix `.901`, `.21`, `.31`, `.41`, `.51`, `.22`, `.32`, `.42`, `.52`) onset in last 12 months.

The "≥2 SABA canisters in 12 months" formal threshold from GINA cannot be evaluated without dispensing-event data — approximated here by "any active SABA prescription" with the understanding that a v2 dispensing-cadence rule is the proper fix.

### Scope decisions

- **Severity stratification (GINA Step 1-5) NOT modeled.** Rule fires once on ICS absence; titration is clinician-driven.
- **Biologics for severe eosinophilic asthma NOT modeled.**
- **AERD suppression NOT modeled.**
- **Pediatric (under 18) NOT excluded** — NAEPP 2020 explicitly includes children ≥5. The rule's emission applies regardless of age.

## Consequences

**Positive.** Reuses drug-class exports from a sibling pulmonology rule — first instance of intra-specialty composition. Sets a pattern that future asthma/COPD overlap rules (asthma-COPD overlap syndrome, biologic-eligibility) can extend.

**Negative.** The active-SABA-as-uncontrolled-proxy is a generous threshold. Many controlled asthmatics retain an albuterol prescription as backup; this rule will fire on them. Recommendation surfaces ICS initiation, which is the correct clinical action even for the borderline case — but the noise floor is high. Dispensing-cadence enhancement is the principal v2 follow-up.

**Operational.** Fixtures 71-73. 83 tests.

## References

- [GINA 2024 Strategy Report](https://ginasthma.org/2024-gina-main-report/)
- [NAEPP 2020 Focused Updates (NHLBI, JACI)](https://www.nhlbi.nih.gov/health-topics/asthma-management-guidelines-2020-updates)
- Related ADRs: [0025 — COPD GOLD ABE (sibling, shared drug-class exports)](0025-copd-gold-abe-rule.md)
- Source: [`lib/clinical-engine/rules/asthma-controller.ts`](../../lib/clinical-engine/rules/asthma-controller.ts)
- Tests: [`lib/clinical-engine/__tests__/asthma-controller.test.ts`](../../lib/clinical-engine/__tests__/asthma-controller.test.ts)
