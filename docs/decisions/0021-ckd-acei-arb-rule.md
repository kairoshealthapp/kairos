# 0021 — CKD ACEi/ARB rule: dual-guideline conditional-population therapy-gap

- **Status:** Accepted
- **Date:** 2026-05-17
- **Index:** [← back to docs index](../INDEX.md)

## Context

Sixteenth rule shipped. First internal-medicine rule. Structurally identical to t2dm-sglt2i-ckd (ADR 0015) — conditional-population therapy-gap with multi-modal disease detection — but the therapy is ACEi/ARB and the qualifier expands beyond T2DM to include any CKD patient with either HTN or albuminuria.

Dual-guideline citation: KDIGO 2024 CKD Guideline §3.6.1 (Grade 1B) and 2017 ACC/AHA HTN Guideline §9.5. Both societies arrive at "ACEi or ARB for CKD with HTN or albuminuria." Different specialties, same recommendation.

## Decision

Ship as `ckdAceiArbRule` reusing:

- `detectCkd` from `t2dm-sglt2i-ckd` — multi-modal CKD detection (ICD N18, eGFR 25-59, UACR ≥30).
- `GDMT_PILLAR_1_RXCUIS` and `GDMT_PILLAR_1_GENERIC_NAMES` from `gdmt-hfref` — ACEi/ARB/ARNi drug class.
- `UACR_LOINC_CODES` and `T2DM_CKD_UACR_ELEVATED_THRESHOLD` from `t2dm-sglt2i-ckd`.

Fires when: CKD-detected AND (HTN ICD I10-I15 OR UACR ≥30 mg/g) AND no active ACEi/ARB/ARNi on med list.

### Scope decisions

- **ARNi (sacubitril/valsartan) counts as suppression.** Active ARB component satisfies the recommendation.
- **eGFR floor does NOT suppress.** KDIGO permits ACEi/ARB at any eGFR for albuminuria reduction in advanced CKD; v1 mirrors KDIGO permissiveness.
- **Contraindications NOT modeled in v1.** Bilateral renal artery stenosis, K >5.5, pregnancy — recommendation reminds clinician to assess.
- **Adult only (≥18).** Pediatric CKD is out of scope.

### Reuse pattern

This rule is the first to compose THREE prior rules' exports:
- `gdmt-hfref` (drug class)
- `t2dm-sglt2i-ckd` (CKD detection + UACR)
- (its own qualifier logic for HTN ICD set)

The composition pattern validates the engine's named-exports design — adding a new rule that recombines existing predicates required only 130 lines of rule code plus a banner.

## Consequences

**Positive.** First example of three-way export composition. Future rules can confidently lean on prior rules' exported predicates rather than duplicating disease-detection logic. Reduces drift risk: if CKD detection thresholds change, both T2DM-SGLT2i-CKD and this rule update via the single `detectCkd` source.

**Negative.** The dependency graph between rules is now non-trivial. A change to `detectCkd` in t2dm-sglt2i-ckd silently affects this rule. Tests in both rules continue to anchor against the same fixtures, providing coverage, but a future "extract shared detectors" refactor may be warranted as the engine grows.

**Operational.** Fixtures 56-58. 68 tests. Cross-rule isolation uses a "does not throw" guard for existing fixtures rather than per-fixture finding-count assertions — qualifier logic is well-covered in the unit-test block.

## References

- [KDIGO 2024 CKD Guideline](https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf)
- [2017 ACC/AHA HTN Guideline](https://www.ahajournals.org/doi/10.1161/CIR.0000000000000596) §9.5
- Related ADRs: [0015 — T2DM-SGLT2i-CKD (shape sibling)](0015-t2dm-sglt2i-ckd-rule.md), [0004 — pure rule signature](0004-rule-signature-pure-function.md)
- Source: [`lib/clinical-engine/rules/ckd-acei-arb.ts`](../../lib/clinical-engine/rules/ckd-acei-arb.ts)
- Tests: [`lib/clinical-engine/__tests__/ckd-acei-arb.test.ts`](../../lib/clinical-engine/__tests__/ckd-acei-arb.test.ts)
