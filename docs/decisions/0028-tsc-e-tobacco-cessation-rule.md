# 0028 — TSC-E tobacco screening and cessation rule

- **Status:** Accepted
- **Date:** 2026-05-17
- **Index:** [← back to docs index](../INDEX.md)

## Context

Twenty-third rule shipped. Fourth and final pulmonology rule. TSC-E is a new HEDIS measure for MY 2026 combining USPSTF Grade A tobacco screening with cessation intervention follow-up. Structurally identical to the depression rule (ADR 0024) — two-stage screening with conditional follow-up — applied to a different clinical workflow.

## Decision

Ship as `tscTobaccoCessationRule`. Reuse shape #13 (two-stage screening with conditional follow-up). Two emission paths sharing one ruleId:

- `subcategory: 'missing-screen'` — no tobacco status documented in last 12 months.
- `subcategory: 'missing-cessation'` — current smoker without counseling or pharmacotherapy in last 12 months.

### Cessation intervention recognized

- **Counseling**: display token match on 'tobacco cessation counseling', 'smoking cessation counseling', or CPT 99406/99407 in observation display.
- **Pharmacotherapy**: active prescription for varenicline, bupropion, or nicotine (any formulation — patch/gum/lozenge/inhaler).

### Scope decisions

- **Pregnant patients NOT specifically routed.** USPSTF Grade A applies; v1 emits the same gap.
- **Smokeless tobacco / e-cigarettes** are conceptually included (LOINC 72166-2 is "tobacco smoking status NHIS" which covers nicotine exposure broadly); not explicitly stratified.
- **Brief vs intensive counseling distinction NOT modeled.**

## Consequences

**Positive.** Shape #13 (two-stage screening) is now reused, validating it as a reusable template not a one-off. Future cadenced screen-then-followup rules (AUDIT-C → AUDIT, fall-risk → intervention, dementia → MMSE/MoCA) can follow this pattern directly.

**Negative.** Display-token matching for counseling is fragile. A chart note labeled "smoking cessation discussion 5 min" will not match the configured tokens. Adding 'smoking cessation' as a softer token is a calibration choice deferred to v2.

The pharmacotherapy generic-name list 'nicotine' is intentionally broad — it matches any nicotine-containing product. False positives possible (e.g., a research nicotine product that isn't intended as cessation therapy). Acceptable trade-off given the clinical action (continue current cessation regimen) is benign.

**Operational.** Fixtures 77-79. 88 tests.

## References

- HEDIS TSC-E: https://www.ncqa.org/hedis/measures/tobacco-use-screening-and-cessation/
- [USPSTF 2021 Tobacco Smoking Cessation (Krist et al, JAMA)](https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/tobacco-use-in-adults-and-pregnant-women-counseling-and-interventions)
- Related ADRs: [0024 — two-stage shape (sibling)](0024-depression-screening-rule.md)
- Source: [`lib/clinical-engine/rules/tsc-e-tobacco-cessation.ts`](../../lib/clinical-engine/rules/tsc-e-tobacco-cessation.ts)
- Tests: [`lib/clinical-engine/__tests__/tsc-e-tobacco-cessation.test.ts`](../../lib/clinical-engine/__tests__/tsc-e-tobacco-cessation.test.ts)
