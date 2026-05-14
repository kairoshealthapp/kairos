# 0013 — Post-MI beta-blocker as the first time-bounded therapy-gap

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Eighth rule shipped. Until this rule the engine's therapy-gap rules (GDMT HFrEF, HFpEF SGLT2i) fired on **steady-state** disease — patient has chronic HF, patient is missing pillar X. None of the existing rules gated on a **time anchor** — "this finding fires only if the qualifying event happened within Y months."

Post-MI beta-blocker therapy is the canonical time-bounded recommendation. The 2025 ACC/AHA/ACEP/NAEMSP/SCAI ACS Guideline (Rao et al, *Circulation* 2025;151:e00–e00, DOI [10.1161/CIR.0000000000001309](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001309)) §4.6 Recommendation 1, verbatim from primary PDF via pdftotext:

> "In patients with ACS without contraindications, early (<24 hours) initiation of oral beta-blocker therapy is recommended to reduce risk of reinfarction and ventricular arrhythmias." — Class 1, LOE A.

The recommendation's explicit time anchor is **<24 hours of presentation**, focused on in-hospital initiation. For an outpatient-facing engine like Kairos, the practically useful question is different: "did this recent-MI patient ever get on BB therapy?" The 2025 guideline's supportive text reinforces ongoing benefit in LVEF <40%, while noting the optimal long-term duration in preserved-LVEF patients is unclear (referencing REDUCE-AMI).

This shape — time-bounded therapy-gap — generalizes to any post-event recommendation: post-stroke antiplatelet, post-procedure DAPT, post-transplant immunosuppression, post-TKA prophylactic anticoagulation, and so on. Worth a dedicated rule-shape entry.

## Decision

The eighth rule ships at [`lib/clinical-engine/rules/post-mi-beta-blocker.ts`](../../lib/clinical-engine/rules/post-mi-beta-blocker.ts) as the engine's first **time-bounded therapy-gap** rule.

### Time-bound encoding

The rule extracts the most recent MI condition (ICD-10 I21.x or I22.x), reads its `onsetDate`, and computes months elapsed against "today" via `monthsBetween`. `POST_MI_BB_TIMEFRAME_MONTHS = 12` is exported as a named constant. The 12-month window is a pragmatic v1 choice: the Class 1 evidence is strongest in the early post-MI period, and the 12-month framing captures the highest-yield outpatient surveillance window without committing to LVEF-stratified long-term logic.

Beyond 12 months — particularly in preserved-LVEF patients per REDUCE-AMI — the long-term benefit is no longer universally Class 1. v2 candidates: LVEF-stratified long-term BB rule, or a separate "BB withdrawal candidate" rule for preserved-LVEF patients past 12 months.

### Reuse of GDMT BB constants

The evidence-based BB set (metoprolol succinate, carvedilol, bisoprolol) is the same as in GDMT HFrEF ([ADR 0003](0003-metoprolol-succinate-vs-tartrate-distinction.md)). Rather than re-declare the RxCUI array in this rule, the GDMT rule was refactored this session to export `GDMT_BB_RXCUIS`, `GDMT_BB_GENERIC_NAMES`, and `GDMT_BB_NON_EVIDENCE_BASED` as named barrel exports. The post-MI BB rule imports from gdmt-hfref directly. This is the engine's first cross-rule constant import for clinical drug sets (prior cross-rule imports were limited to condition codes and LOINC sets).

### Metoprolol tartrate trap mirrored

Patient post-MI on metoprolol tartrate fires the rule with `status: 'non-evidence-based'` and `severity: 'warning'`, mirroring GDMT's tartrate-trap finding shape. The same clinical reasoning applies: tartrate is short-acting, dosing-unstable, and not the agent validated by the post-MI mortality trials. Reusing the pattern keeps the engine's drug-class semantics consistent.

### Atenolol/propranolol excluded from evidence-based set

The 2025 guideline does not name specific agents in the Class 1 recommendation. Kairos's evidence-based set is anchored to the agents validated in the HF mortality trials (which are also the dominant post-MI evidence base). Atenolol and propranolol are explicitly NOT in `GDMT_BB_RXCUIS`. A patient on atenolol post-MI will therefore fire the rule. This is conservative; the ADR documents the choice. v2 could broaden the post-MI BB set if real-chart calibration shows clinically-irrelevant false positives.

### Contraindications deferred

Severe bradycardia, high-degree AV block without pacer, decompensated HF, severe bronchospasm — all out of scope for v1. The rule's `recommendation` field explicitly reminds the clinician to review.

## Consequences

**Positive.** Time-bounded therapy-gap is now a named shape. The `getMostRecentMi` and `isWithinPostMiWindow` helpers are exported as standalone utilities — the post-MI ACEi/ARB rule ([ADR 0014](0014-post-mi-acei-arb-rule.md)) reuses them directly. Cross-rule constant imports proved cleaner than re-declaring drug RxCUI arrays per rule.

**Negative.** Fixtures with absolute `onsetDate` values become stale as real-world time advances. Fixture-28 ("3 months ago" at 2026-05-13 = onset 2026-02-13) will fall out of the 12-month window starting 2027-02-13. Tests against these fixtures will fail loudly when they go stale, which is the correct signal that the fixtures need refreshing — but it creates a maintenance cadence the engine didn't previously have. The time-boundary inline tests use dynamically computed dates (`isoDateMonthsAgo`) and remain stable.

**Operational.** Four new fixtures (28–31) covering the firing case, the tartrate-trap variant, the carvedilol suppression case, and the out-of-window boundary case. Cross-rule isolation block exercises fixtures 01–27 (all should emit zero post-MI BB findings).

## References

- [2025 ACC/AHA/ACEP/NAEMSP/SCAI ACS Guideline (Rao et al, Circulation)](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001309), §4.6 Rec. 1 — Class 1 LOE A
- Related ADRs: [0003](0003-metoprolol-succinate-vs-tartrate-distinction.md), [0004](0004-rule-signature-pure-function.md), [0014](0014-post-mi-acei-arb-rule.md) (immediate sibling)
- Source: [`lib/clinical-engine/rules/post-mi-beta-blocker.ts`](../../lib/clinical-engine/rules/post-mi-beta-blocker.ts)
- Tests: [`lib/clinical-engine/__tests__/post-mi-beta-blocker.test.ts`](../../lib/clinical-engine/__tests__/post-mi-beta-blocker.test.ts)
