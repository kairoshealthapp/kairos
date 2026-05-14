# 0016 — T2DM statin rule: convergent-evidence pattern

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Eleventh rule shipped. Architecturally adjacent to the existing statin-initiation rule ([ADR 0009](0009-statin-initiation-rule.md)) whose diabetes-age path already fires on T2DM patients age 40–75 not on a statin. The new rule shares the same clinical scenario but cites a different guideline — ADA Standards of Care 2026 — and produces a Finding with the ADA citation.

The architectural question: separate rule vs. extension of rule #5?

The recommendation in ADA Standards 2026 §10 (paraphrased from authoritative summaries; primary text behind Diabetes Care subscription):

> "In patients aged 40–75 years with diabetes and hyperlipidaemia, high-intensity statin therapy should be used to lower LDL cholesterol by ≥50% of baseline and reach a target LDL cholesterol level of <70 mg/dL."

ADA grade A (highest ADA evidence grade).

This is the same end-state recommendation as the 2026 ACC/AHA Dyslipidemia Guideline's diabetes-age path (cited by statin-initiation rule #5). Two societies, two evidence framings, identical clinical action.

## Decision

Ship as a **separate rule**, not as an extension of statin-initiation. Both rules fire on qualifying patients; no deduplication.

### Why separate

1. **Different guideline citations.** The clinician sees ADA AND ACC/AHA independently arriving at the same recommendation. That's stronger evidence than one source. Deduplicating would erase the convergence signal.
2. **Evidence pedigrees diverge.** ADA's statin recommendation predates the 2026 Dyslipidemia Guideline by years and has its own RCT evidence base. Treating them as one rule conflates two distinct evidence chains.
3. **Specialty distinction.** ADA targets endocrinologists; ACC/AHA Dyslipidemia targets cardiologists. The two communities sometimes phrase the same recommendation with different nuance (e.g., intensity recommendations, LDL targets). Separate rules let those distinctions surface.
4. **Rule-set growth pattern.** As Kairos adds more endocrine rules, the ADA Standards becomes the dominant source for the endocrine surface. A "T2DM patient is missing a guideline-recommended therapy" pattern will recur (GLP-1 RAs in T2DM with ASCVD, semaglutide for obesity, etc.). Establishing the separate-rule convention now avoids retrofitting later.

### Fire-both, do-not-deduplicate convention

A T2DM patient age 40–75 not on a statin fires BOTH `statin-initiation` (diabetes-age path) and `t2dm-statin`. The combined output is two Findings with distinct `ruleId` values. The clinician sees both citations.

This is the **convergent-evidence pattern** — first instance in the engine. Not a new rule shape: structurally each rule is a standard threshold or conditional-population gap. The pattern is at the **engine-output level**: multiple rules legitimately fire on the same clinical scenario because their evidence pedigrees differ.

Future v2 candidates if clinical noise becomes an issue:
- A Finding-deduplication layer that groups findings by clinical action ("start a statin") and surfaces the highest-evidence citation while preserving the others as supporting refs.
- A UI affordance that visually clusters convergent findings into a single "this patient should be on a statin (×2 evidence sources)" chip.

Both are explicitly out of scope for v1.

### Scope decisions

- **T2DM only (E11.x).** ADA's statin recommendation in T1DM has additional age + risk-factor stratification that would expand rule complexity beyond v1. T1DM-inclusion is a v2 candidate.
- **Age band 40–75 inclusive.** Matches ADA wording.
- **Active-statin suppression** reuses `STATIN_RXCUI_SET` and `STATIN_GENERIC_NAMES` from rule #5.
- **Contraindications NOT handled** — mirrors rule #5 pattern.

## Consequences

**Positive.** The convergent-evidence pattern is now documented and exemplified. Future rules sourced from converging guidelines can follow this convention rather than improvise. The dual-rule output is clinically honest: the clinician sees the convergence rather than a single homogenized recommendation.

The reuse of `STATIN_RXCUI_SET` from rule #5 demonstrates that the engine's named exports continue to compose cleanly across rules without forcing a deeper shared-state refactor.

**Negative.** Combined output for a T2DM age-40–75 no-statin patient is now two Findings. In the absence of a deduplication layer, this is real clinical noise — the same recommendation appears twice in the UI. The test suite includes a dedicated convergent-evidence test block on fixture-17 documenting the dual-firing as intentional. The risk is acknowledged; the choice is to surface the convergence rather than hide it.

The "do not deduplicate" decision sets a precedent that could be wrong long-term. If by Phase 3 the engine has 30+ rules and three convergent rules fire on the same patient, clinical noise compounds. The deduplication-layer v2 candidate is the safety valve.

**Operational.** Three new fixtures (40–42). Five intentional co-trigger tests verifying that T2DM patients across earlier rule fixtures (11, 14, 17, 36, 37, 38, 39) fire this rule alongside their original rule. Eight rules' worth of fixtures sweep cleanly.

## References

- ADA Standards of Care in Diabetes — 2026: [Section 10 Cardiovascular Disease and Risk Management](https://diabetesjournals.org/care/article/49/Supplement_1/S216/163933) (subscription).
- [2026 ACC/AHA Dyslipidemia Guideline](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423) (the other half of the convergent evidence).
- Related ADRs: [0009](0009-statin-initiation-rule.md) (sibling rule, ACC/AHA citation), [0015](0015-t2dm-sglt2i-ckd-rule.md) (sibling ADA-sourced rule).
- Source: [`lib/clinical-engine/rules/t2dm-statin.ts`](../../lib/clinical-engine/rules/t2dm-statin.ts)
- Tests: [`lib/clinical-engine/__tests__/t2dm-statin.test.ts`](../../lib/clinical-engine/__tests__/t2dm-statin.test.ts)
