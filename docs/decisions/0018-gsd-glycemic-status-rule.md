# 0018 — GSD rule: control-gap shape applied to A1C

- **Status:** Accepted
- **Date:** 2026-05-17
- **Index:** [← back to docs index](../INDEX.md)

## Context

Thirteenth rule shipped. Second family-practice rule. Second instance of the conditional-population control-gap shape introduced in ADR 0017 (CBP).

HEDIS GSD ("Glycemic Status Assessment for Diabetes") supersedes the older HBD measure starting MY 2026. It captures both A1C testing cadence and A1C control on the same diabetic-adult population. Underlying authority is ADA Standards of Care in Diabetes 2026, §6.4 (testing frequency: at least twice yearly) and §6.5a (A1C goal <7% for most nonpregnant adults, Grade A).

HEDIS reports poor control at A1C >9%. The 7-9% band is clinically suboptimal but not flagged by HEDIS; this rule encodes the HEDIS threshold to match measure reporting and surfaces the 7-9% gap as a future rule candidate.

## Decision

Ship as `gsd-glycemic-status` using shape #10 (conditional-population control-gap). Two emission paths sharing one ruleId:

- `subcategory: 'missing-measurement'` — diabetes patient with no A1C in the last 6 months. Recommendation: order A1C.
- `subcategory: 'uncontrolled'` — diabetes patient with most recent A1C >9% within the 6-month window. Recommendation: intensify regimen.

A patient with an A1C in the 7-9% band emits zero findings; this is intentional and consistent with HEDIS scope.

### Scope decisions

- **Population: E10.x (T1DM) OR E11.x (T2DM).** Gestational diabetes (O24.x) NOT included.
- **Adult age gate ≥18.** Excludes pediatric T1DM where targets differ.
- **A1C LOINC 4548-4 only.** Dominant US lab code. Future addition of 17856-6 / 17855-8 deferred.
- **Recency window 6 months.** ADA §6.4 says "at least twice yearly", which implies a 6-month cadence; using 6 months as the window matches the looser end of the spec while staying actionable.
- **Pregnancy NOT excluded** (HEDIS spec excludes; deferred for clinical review).
- **Hospice/palliative-care exclusions NOT modeled.**

### Cross-rule co-triggers

Every existing fixture with E10/E11 ICD lacks a 4548-4 A1C observation. Fourteen co-triggers (fixtures 11, 14, 17, 19, 22, 24, 27, 36, 37, 38, 39, 40, 41, 42) all fire `missing-measurement` as expected. Documented in the rule's test block as part of the cross-rule isolation pattern.

## Consequences

**Positive.** Validates shape #10 as a reusable template — CBP and GSD now share structural DNA, and the next process-control measure (e.g., depression PHQ-9 followup, BPD-A) can follow the same template without re-litigating shape decisions. The dual-emission pattern keeps the engine's `ruleId` count linear with measures rather than doubling per gap-vs-control split.

**Negative.** Co-trigger volume is high — every diabetic patient in the existing fixture set will now fire two findings instead of one (their original diabetes-related finding + the new missing-A1C finding). For real charts this is the correct signal (the chart genuinely lacks A1C documentation), but for demo scenarios it inflates the visible finding count. Demo fixtures may need to add A1C observations to control the rendered count.

**Operational.** Fixtures 46-48. 58 tests including 14 explicit co-triggers and full sweep of non-diabetic fixtures.

## References

- HEDIS GSD measure: https://www.ncqa.org/hedis/measures/hemoglobin-a1c-control-for-patients-with-diabetes/
- ADA Standards of Care in Diabetes — 2026 [§6](https://diabetesjournals.org/care/issue/49/Supplement_1)
- LOINC: [4548-4 Hemoglobin A1c](https://loinc.org/4548-4)
- Related ADRs: [0017 — CBP and the control-gap shape](0017-cbp-hypertension-control-rule.md)
- Source: [`lib/clinical-engine/rules/gsd-glycemic-status.ts`](../../lib/clinical-engine/rules/gsd-glycemic-status.ts)
- Tests: [`lib/clinical-engine/__tests__/gsd-glycemic-status.test.ts`](../../lib/clinical-engine/__tests__/gsd-glycemic-status.test.ts)
