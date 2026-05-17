# 0017 — CBP rule: conditional-population control-gap shape

- **Status:** Accepted
- **Date:** 2026-05-17
- **Index:** [← back to docs index](../INDEX.md)

## Context

Twelfth rule shipped. Opens the family-practice surface of the engine. The HEDIS CBP measure ("Controlling High Blood Pressure") quantifies the percentage of HTN patients age 18-85 whose most recent BP is <140/90. Underlying clinical authority is the 2017 ACC/AHA HTN guideline (Whelton 2018, Circulation, DOI [10.1161/CIR.0000000000000596](https://www.ahajournals.org/doi/10.1161/CIR.0000000000000596)).

The structural question: this rule needs to fire under two distinct conditions — (a) HTN patient with no recent BP measurement, or (b) HTN patient with a recent BP measurement above the control threshold. Neither (a) nor (b) alone matches any of the nine shipped rule shapes.

- Shape #3 (universal screening) does not inspect values. CBP must inspect values.
- Shape #4 (conditional-population screening) fires only on missing measurements. CBP must also fire on uncontrolled measurements.
- Shape #6 (threshold, value-based) requires a value to exist. CBP must also fire when none exists.

The two clinical actions are different. Missing → "get a BP." Uncontrolled → "titrate the regimen." Surfacing them as separate `subcategory` values on the same `ruleId` keeps the rule-level abstraction honest while preserving the recipient's ability to triage.

## Decision

Ship CBP as a single rule that emits exactly one Finding per qualifying patient, with `subcategory: 'missing-measurement'` or `subcategory: 'uncontrolled'` selecting between the two clinical actions.

Introduce a new rule shape, **Conditional-population control-gap** (#10), in `rule-shapes.md`. The shape is defined by:

1. Condition gate (ICD-10 prefix family).
2. Demographic gate (age band) — optional but recommended.
3. Recency-windowed measurement lookup.
4. Two emission paths sharing one `ruleId`:
   - Missing in window → `subcategory: 'missing-measurement'`, `status: 'missing'`.
   - Present and over threshold → `subcategory: 'uncontrolled'`, `status: 'non-evidence-based'`.

Pairs naturally with HEDIS process-control measures (CBP, GSD, future BPD-A measures).

### Scope decisions

- **Age band 18–85 inclusive.** Matches HEDIS CBP measurement-eligible population.
- **HTN ICD-10 prefixes `I10`, `I11`, `I12`, `I13`, `I15`.** Covers essential, hypertensive heart, hypertensive kidney, combined, and secondary HTN.
- **Recency window 12 months.** Matches HEDIS measurement period anchor.
- **Threshold <140/90.** Uses HEDIS CBP's universal cutoff, not the 2017 guideline's <130/80 high-CV-risk target. Tighter target is deferred to a future rule (`cbp-strict-control` candidate) that would layer on additional risk stratification.
- **Pregnancy and ESRD NOT excluded in v1.** HEDIS spec excludes both; deferred for clinical review.
- **Frailty / age ≥65 individualized targets NOT modeled.**

### Cross-rule co-triggers

Existing AFib fixtures 19, 20, 21, 22 declare `I10` HTN ICD with no BP observations. These now fire CBP as `missing-measurement` co-triggers. Documented in the rule's isolation test block as expected.

## Consequences

**Positive.** The engine now has a structural template for HEDIS process-control measures that combine "screen for it" and "control it" in one ruleId. Future GSD (rule 13), and any HbA1c/lipid/depression-control measure can follow this shape directly without inventing structure.

**Negative.** Subcategory inspection now becomes load-bearing for downstream UI: a recipient cannot just count findings by `ruleId` to know the clinical action. UI work will need to read `subcategory` to render "Order BP" vs. "Adjust antihypertensives." This is a real complexity step for the renderer.

**Operational.** Fixtures 43–45 (uncontrolled, missing, controlled). 66 tests. 4 cross-rule co-triggers documented.

## References

- HEDIS CBP measure: https://www.ncqa.org/hedis/measures/controlling-high-blood-pressure/
- [2017 ACC/AHA HTN Guideline (Whelton et al, Circulation)](https://www.ahajournals.org/doi/10.1161/CIR.0000000000000596)
- LOINC: [85354-9 BP panel](https://loinc.org/85354-9), [8480-6 systolic](https://loinc.org/8480-6), [8462-4 diastolic](https://loinc.org/8462-4)
- Source: [`lib/clinical-engine/rules/cbp-hypertension-control.ts`](../../lib/clinical-engine/rules/cbp-hypertension-control.ts)
- Tests: [`lib/clinical-engine/__tests__/cbp-hypertension-control.test.ts`](../../lib/clinical-engine/__tests__/cbp-hypertension-control.test.ts)
