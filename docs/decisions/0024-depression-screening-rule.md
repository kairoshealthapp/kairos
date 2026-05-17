# 0024 — Depression screening (PHQ-2/PHQ-9) two-stage rule

- **Status:** Accepted
- **Date:** 2026-05-17
- **Index:** [← back to docs index](../INDEX.md)

## Context

Nineteenth rule shipped. Fourth and final internal-medicine rule. USPSTF 2023 depression screening (Grade B for all adults including pregnant/postpartum/older adults). HEDIS DSF-E formalizes this into a measure that tracks both the initial screen and the positive-screen follow-up.

The clinical workflow is two-stage:

1. Initial PHQ-2 (a 2-item screener, LOINC 55758-7).
2. If PHQ-2 ≥3, follow with PHQ-9 (a 9-item severity tool, LOINC 44249-1).

A single rule fires on either of two gap paths:

- No PHQ-2 in the last 12 months → `missing-screen`.
- PHQ-2 ≥3 within 12 months but no PHQ-9 follow-up afterward → `missing-followup`.

## Decision

Ship as `depressionScreeningRule` with a new shape variant — **#13 Two-stage screening with conditional follow-up** — documented in `rule-shapes.md`.

### Scope decisions

- **Adult only (≥18).** Adolescent depression screening (USPSTF 2022 Grade B for 12-18) is a separate rule; deferred.
- **Active depression diagnosis (F32.x/F33.x) does NOT suppress.** Patients in active treatment still warrant cadenced screening per HEDIS measure design.
- **Suicide risk screening OUT OF SCOPE.** USPSTF 2023 pairs depression and suicide-risk recommendations; suicide-risk tools have less consensus.
- **PHQ-2 positivity threshold = 3.** Standard validated cutoff.
- **PHQ-9 must postdate the positive PHQ-2** to count as follow-up — an earlier PHQ-9 does not resolve the followup gap.

## Consequences

**Positive.** First two-stage rule in the engine. Template applies to other cadenced screen+followup pairs (e.g., alcohol use AUDIT-C → AUDIT, cervical cancer cytology → colposcopy follow-up).

**Negative.** The `effectiveDate < phq2.effectiveDate` follow-up check uses string comparison, which works for ISO 8601 dates but is fragile against non-ISO date formats. Acceptable here because PatientObservation.effectiveDate is documented as ISO-format throughout the engine.

**Operational.** Fixtures 65-67. 75 tests.

## References

- HEDIS DSF-E: https://www.ncqa.org/hedis/measures/depression-screening-and-follow-up-for-adolescents-and-adults/
- [USPSTF 2023 Depression and Suicide Risk Screening (Barry et al, JAMA)](https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/screening-depression-suicide-risk-adults)
- LOINC: [55758-7 PHQ-2](https://loinc.org/55758-7), [44249-1 PHQ-9](https://loinc.org/44249-1)
- Related ADRs: [0017 — control-gap subcategory pattern](0017-cbp-hypertension-control-rule.md)
- Source: [`lib/clinical-engine/rules/depression-screening.ts`](../../lib/clinical-engine/rules/depression-screening.ts)
- Tests: [`lib/clinical-engine/__tests__/depression-screening.test.ts`](../../lib/clinical-engine/__tests__/depression-screening.test.ts)
