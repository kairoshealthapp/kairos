# 0023 — Osteoporosis screening rule

- **Status:** Accepted
- **Date:** 2026-05-17
- **Index:** [← back to docs index](../INDEX.md)

## Context

Eighteenth rule. Third internal-medicine rule. USPSTF 2018 osteoporosis screening: women ≥65 Grade B. Men have a Grade I (insufficient evidence) finding from USPSTF; consensus society practice (NOF, AACE, ACP) supports DEXA in men ≥70 with risk factors.

## Decision

Ship as `osteoporosisScreeningRule`, shape #4 (conditional-population screening-gap). Demographic gates:

- Women ≥65: USPSTF Grade B path.
- Men ≥70: consensus-society path. Surfaced as Finding with summary explicitly noting "USPSTF Grade I — clinical judgment" so the clinician sees the evidence-strength distinction.

Recency window: 5 years.

### Scope decisions

- **Postmenopausal <65 with risk factors NOT modeled.** Requires formal risk-tool integration (FRAX); deferred to v2.
- **Long-term glucocorticoid / low body weight risk paths NOT modeled.**
- **Known osteoporosis (M81.x) suppresses.** Screening question moot when patient is already diagnosed.

## Consequences

**Positive.** Engine now covers the canonical USPSTF-Grade-B preventive-screening trinity for older adults: CRC, breast, bone. The men-≥70 path is the engine's first example of a "consensus-society supplemental" path — surfacing a recommendation that lacks USPSTF endorsement but has broad professional-society support. Useful template for future rules where USPSTF is silent.

**Negative.** Risk-factor-driven early screening of postmenopausal women <65 is the dominant real-world use case in many practices and remains uncovered. Without FRAX integration, the rule under-detects.

**Operational.** Fixtures 62-64. 72 tests.

## References

- [USPSTF 2018 Osteoporosis Screening (Curry et al, JAMA)](https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/osteoporosis-screening)
- LOINC: [38269-7 DXA composite](https://loinc.org/38269-7)
- Source: [`lib/clinical-engine/rules/osteoporosis-screening.ts`](../../lib/clinical-engine/rules/osteoporosis-screening.ts)
- Tests: [`lib/clinical-engine/__tests__/osteoporosis-screening.test.ts`](../../lib/clinical-engine/__tests__/osteoporosis-screening.test.ts)
