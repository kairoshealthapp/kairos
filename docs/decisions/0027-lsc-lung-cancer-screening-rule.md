# 0027 — LSC lung cancer screening rule (LDCT, USPSTF 2021)

- **Status:** Accepted
- **Date:** 2026-05-17
- **Index:** [← back to docs index](../INDEX.md)

## Context

Twenty-second rule shipped. Third pulmonology rule. HEDIS LSC backs on USPSTF 2021 lung cancer screening: annual LDCT for adults 50-80 with ≥20 pack-year history who currently smoke or quit within 15 years. Grade B.

This is the engine's most input-rich screening rule — eligibility requires four bundle inputs (age, smoking status, pack-years, quit-date) plus modality history. Shape #4 (conditional-population screening-gap) with derived eligibility.

## Decision

Ship as `lscLungCancerScreeningRule`. Eligibility chain (all must hold):

1. Age 50-80.
2. No prior lung cancer (C34.x suppression).
3. Smoking status is current or former (LOINC 72166-2 display match).
4. Pack-years ≥20 (LOINC 88029-4).
5. If former, quit-date is within 15 years (LOINC 74010-0 effectiveDate as proxy).
6. No LDCT (display substring 'ldct'/'low-dose ct lung'/'71271') in last 12 months.

### Scope decisions

- **Smoking-status display tokens are coarse.** Matches 'current' or 'former' as substrings; "Heavy smoker" or "Smokes occasionally" without those tokens will not classify. Real-chart calibration needed.
- **Quit-date observation absent for a former smoker → conservatively still fires.** The recommendation accepts the LDCT order even when the quit clock can't be verified; the clinician confirms before ordering.
- **Pack-years observation absent → does NOT fire.** Without pack-years data the eligibility check fails closed — under-detection is preferred over false-positive imaging recommendations.
- **Family history / occupational exposure NOT used.** USPSTF 2021 does not condition on these.

## Consequences

**Positive.** Engine now has a worked example of a four-input eligibility rule. The derived quit-window math is the template for future "quit X within Y years" rules (e.g., post-pregnancy contraception counseling, post-surgery follow-up).

**Negative.** Smoking-status tokenization is brittle. Health-system free-text variations like "former, 8/2018" or "ex-smoker" will fail to match. The LOINC 72166-2 display field is supposed to use a small controlled vocabulary, but real-world charts diverge. The `lastReviewed/nextReviewDue` cycle is the catch.

**Operational.** Fixtures 74-76. 87 tests.

## References

- HEDIS LSC: https://www.ncqa.org/hedis/measures/lung-cancer-screening/
- [USPSTF 2021 Lung Cancer Screening (Krist et al, JAMA)](https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/lung-cancer-screening)
- LOINC: [72166-2 Tobacco smoking status](https://loinc.org/72166-2), [88029-4 Pack years](https://loinc.org/88029-4), [74010-0 Date quit](https://loinc.org/74010-0)
- Source: [`lib/clinical-engine/rules/lsc-lung-cancer-screening.ts`](../../lib/clinical-engine/rules/lsc-lung-cancer-screening.ts)
- Tests: [`lib/clinical-engine/__tests__/lsc-lung-cancer-screening.test.ts`](../../lib/clinical-engine/__tests__/lsc-lung-cancer-screening.test.ts)
