# 0014 — Post-MI ACEi/ARB rule (high-risk siblings of ADR 0013)

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Ninth rule shipped. Same source guideline as [ADR 0013](0013-post-mi-beta-blocker-rule.md). Same rule shape (time-bounded therapy-gap). Same time window (12 months). The new ground covered here is **multi-criterion high-risk gating** — the recommendation fires only when the patient meets ≥1 of four explicit high-risk criteria.

2025 ACC/AHA ACS Guideline §4.7 Recommendation 1, verbatim from primary PDF:

> "In high-risk patients with ACS (LVEF ≤40%, hypertension, diabetes mellitus, or STEMI with anterior location), an oral angiotensin-converting enzyme inhibitor (ACEi) or an angiotensin receptor blocker (ARB) is indicated to reduce all-cause death and MACE." — Class 1, LOE A.

Section 4.7 also contains Recommendation 3, Class 2a LOE A: ACEi/ARB is "reasonable" in non-high-risk ACS. v1 fires only on Class 1 criteria. Class 2a path deferred to v2.

## Decision

The ninth rule ships at [`lib/clinical-engine/rules/post-mi-acei-arb.ts`](../../lib/clinical-engine/rules/post-mi-acei-arb.ts) reusing the time-bounded shape, the MI-detection helpers from [ADR 0013](0013-post-mi-beta-blocker-rule.md), and the GDMT pillar-1 RxCUI set (`GDMT_PILLAR_1_RXCUIS`) for suppression.

### High-risk criteria (any one suffices)

1. **LVEF ≤ 40%** (`POST_MI_ACEI_LVEF_HIGH_RISK_THRESHOLD = 40`). Multi-code LVEF scan via `LVEF_LOINC_CODES` from the HFpEF rule.
2. **LVEF not documented** — safer-default high-risk treatment. A post-MI patient without a documented LVEF should be considered candidate for ACEi until proven otherwise. Better to over-fire than to silently miss the LVEF≤40 cases hiding behind missing data.
3. **Hypertension** — ICD-10 prefix `I10`, `I11`, `I12`, `I13`, or `I15`.
4. **Diabetes mellitus** — ICD-10 prefix `E10` or `E11`.
5. **Anterior STEMI** — ICD-10 prefix `I21.0` (covers I21.0, I21.01, I21.02, I21.09).

The four criteria are encoded as `highRiskReasons: string[]`. When ≥1 reason is present, the Finding's `summary` lists every criterion that contributed — clinician sees not just "high-risk" but specifically which criteria qualified.

### Suppression by ARNi as well as ACEi/ARB

`GDMT_PILLAR_1_RXCUIS` includes sacubitril/valsartan. The 2025 ACS guideline's supportive text notes that in patients with symptomatic HF and reduced LVEF post-MI, sacubitril-valsartan has been demonstrated superior to enalapril (PARADISE-MI). Treating ARNi as suppression honors the pharmacologic substitute relationship. Tested explicitly.

### LVEF-asymmetric scope deliberately encoded

The pre-approval narrowed v1 to "LVEF ≤40% OR LVEF unknown". Reading the primary text, the guideline allows ACEi for ANY of: LVEF≤40, HTN, DM, anterior STEMI. The rule encodes the full guideline criteria — broader than the pre-approval but defensible because the primary text is unambiguous. The "preserved LVEF, no other risk modifiers" patient simply does not trigger any of the four criteria and emits no finding. Tested in fixture-34.

## Consequences

**Positive.** Time-bounded therapy-gap shape is now exercised by two rules; the helpers (`getMostRecentMi`, `isWithinPostMiWindow`) prove their reusability. The high-risk-criteria pattern (multiple ICD/Observation conditions that each independently trigger) is a useful sub-pattern under the time-bounded shape; future rules with similar multi-criterion gates (e.g., DAPT duration extension in high-thrombotic-risk patients) can inherit it.

**Negative.** Intentional cross-rule co-triggers emerged with fixtures 29 and 30 (post-MI patients without ACEi where the BB rule and ACEi rule both correctly fire). Documented in the test file's cross-rule isolation block as expected behavior. This is the convergent-evidence pattern in action: two rules from the same guideline both flagging the same patient. Future Finding-deduplication logic would have to decide whether to surface both gaps or roll them into one ("multiple ACS-era pillars missing"); v1 surfaces both.

The "LVEF not documented = safer default high-risk" choice can over-fire if a recent echo just hasn't been scanned into the bundle. The conservative direction is correct (don't silently miss low-EF patients) but the false-positive rate will need real-chart calibration. Tracked.

**Operational.** Four new fixtures (32–35). Cross-rule isolation against fixtures 01–31, with two documented intentional co-triggers (fixtures 29 and 30) where the ACEi rule fires alongside the BB rule.

## References

- [2025 ACC/AHA/ACEP/NAEMSP/SCAI ACS Guideline (Rao et al, Circulation)](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001309), §4.7 Rec. 1 — Class 1 LOE A
- Related ADRs: [0013](0013-post-mi-beta-blocker-rule.md) (sibling, same guideline, same shape), [0011](0011-hfpef-sglt2i-rule.md) (LVEF_LOINC_CODES origin)
- Source: [`lib/clinical-engine/rules/post-mi-acei-arb.ts`](../../lib/clinical-engine/rules/post-mi-acei-arb.ts)
- Tests: [`lib/clinical-engine/__tests__/post-mi-acei-arb.test.ts`](../../lib/clinical-engine/__tests__/post-mi-acei-arb.test.ts)
