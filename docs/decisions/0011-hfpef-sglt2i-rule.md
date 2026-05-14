# 0011 — HFpEF SGLT2i as the single-pillar therapy-gap shape

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Seventh rule shipped. The engine's domain coverage now spans HFrEF (GDMT, NSAID interaction), AFib (anticoagulation), Dyslipidemia (Lp(a), ApoB, statin), and HFpEF (this rule). Three distinct cardiovascular disease states; six rules; six shapes.

The HFpEF SGLT2i recommendation was prioritized because it closes an obvious portfolio gap: the engine was visibly opinionated about HFrEF (the four-pillar GDMT rule) but silent on the other major HF phenotype. HFpEF is at least 50% of HF prevalence per the 2022 guideline. Shipping this rule lets the engine's coverage story span "HF, all forms" rather than "HFrEF only."

Primary text pinned from the cached 2022 AHA/ACC/HFSA HF Guideline PDF (Heidenreich PA, et al, *Circulation* 2022;145:e895–e1032, DOI [10.1161/CIR.0000000000001063](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063)) Section 7.7 Recommendation 2, via pdftotext:

> "In patients with HFpEF, SGLT2i can be beneficial in decreasing HF hospitalizations and cardiovascular mortality." — Class 2a, LOE B-R.

Evidence base: EMPEROR-Preserved (empagliflozin) and DELIVER (dapagliflozin). The verbiage "can be beneficial" matches Class 2a strength.

The rule is structurally the simplest version of the four-pillar GDMT shape: one drug class, one HF phenotype, one gap. This is the **single-pillar therapy-gap** shape — useful for any future recommendation that says "in disease X, drug class Y is indicated."

## Decision

The seventh rule ships at [`lib/clinical-engine/rules/hfpef-sglt2i.ts`](../../lib/clinical-engine/rules/hfpef-sglt2i.ts).

### Single-pillar therapy-gap shape

Same structural template as GDMT HFrEF, with the pillar count reduced to one. Detect HFpEF → check active SGLT2i → emit gap if missing. Reuses the medication-matching pattern (RxCUI set + generic-name fallback) established in GDMT, NSAID-HF, statin, and AFib rules.

### HFpEF detection: two-path

Path A: explicit HFpEF ICD-10 (I50.30–I50.33).
Path B: any HF code + most recent LVEF ≥ 50%.

Path B exists because ICD-coded HFpEF under-reports vs. the clinical/echo-derived definition. A patient with I50.9 "unspecified HF" + echo LVEF 60% is a HFpEF patient even if their problem list doesn't carry the specific I50.32 code. The LVEF multi-code scan covers `10230-1` (echo) and `8806-2` (alternate) — multi-code is now the engine's default for lab matching.

### HFmrEF (LVEF 40–49%) deferred

The 2022 guideline's HFmrEF recommendations have a different shape (weaker class, separate trials, mixed evidence interpretation). Shipping a HFmrEF rule belongs in a separate ADR with its own evidence pass. v1 fires only for LVEF ≥ 50% or explicit HFpEF ICD codes. Tested explicitly: I50.811 + LVEF 45% emits zero findings.

### Contraindication-aware suppression at the rule level

This rule **departs from the engine's standard "surface, clinician adjudicates" pattern** for contraindications. Three suppression paths are encoded in-rule:

1. **Active SGLT2i (any agent, any indication)** — pharmacologic equivalence.
2. **eGFR < 20 mL/min/1.73m²** — empagliflozin's HF label permits eGFR ≥ 20; dapagliflozin's permits ≥ 25. The rule uses the more permissive floor (20) so a patient with eGFR 22 still fires (the clinician can choose empag specifically). Multi-code eGFR scan via `EGFR_LOINC_CODES`.
3. **Type 1 diabetes (E10.x)** — SGLT2i carry meaningful DKA risk in T1DM; the agents are off-label for T1DM and rarely prescribed for HF in this population.

The departure is justified because these three thresholds are sharp, deterministic, and computable from PatientBundle. The false-positive cost of firing "start empagliflozin" in a patient with eGFR 15 or T1DM is much higher than the false-negative cost of suppressing a marginal case — eGFR drops can be transient, and a clinician seeing "no recommendation" can still consider SGLT2i themselves. Compare this to the statin rule, where the contraindications (rhabdo, active liver disease, pregnancy) require chart-narrative or pharmacy-history checks not derivable from PatientBundle; for those the engine correctly surfaces and the clinician adjudicates.

### Non-evidence-base SGLT2i still suppress

The 2022 HFpEF recommendation names empagliflozin and dapagliflozin specifically (EMPEROR-Preserved, DELIVER). Canagliflozin and ertugliflozin were not studied in HFpEF trials. The rule, however, treats ANY SGLT2i on the active medication list as suppression. The clinical reasoning: pharmacologic equivalence at the class level is plausible, and the clinician will see the canagliflozin script and decide whether a switch to empag/dapag is warranted — separate decision from initiation. Firing "start an SGLT2i" against a patient already on canagliflozin would clutter the UI for a marginal mechanistic distinction.

### Live-RxCUI vs cached-RxCUI divergence

Live RxNorm API on 2026-05-13 returned `empagliflozin = 1545653` and `dapagliflozin = 1488564`. The older GDMT HFrEF rule caches `empagliflozin = 1545664` and `dapagliflozin = 1545653` — flagged in Session 36's RxNorm verification as part of the 8-mismatch backlog awaiting clinical review. This HFpEF rule uses the live-verified values; the GDMT rule remains unmodified per the active follow-up flag. Generic-name fallback in both rules ensures chart records using either RxCUI generation match correctly. The discrepancy is tracked in [guideline-watch.md](../guideline-watch.md).

## Consequences

**Positive.** The engine now visibly spans both HF phenotypes. Single-pillar therapy-gap is now in the rule-shape vocabulary as a simpler sibling of the multi-pillar GDMT shape. The decision to encode three sharp contraindications at the rule level is documented and bounded; it does not generalize as a license to encode soft contraindications elsewhere.

**Negative.** The contraindication-aware suppression is a real departure from the "engine surfaces" pattern. Future rule authors will be tempted to encode more contraindications inline. The ADR explicitly bounds the justification: sharp, deterministic, computable from PatientBundle, high false-positive cost. Soft contraindications (active liver disease without an LFT value, "history of rhabdo" without a coded entry) belong in the clinician-adjudicates pattern.

The HFmrEF deferral leaves a real population unaddressed. Once a HFmrEF rule lands, the cross-rule isolation tests for this rule will need a HFmrEF-specific assertion to verify the boundary holds (LVEF 45% should not fire HFpEF SGLT2i, and HFmrEF should not fire HFrEF GDMT — both directions matter).

**Operational.** Four new fixtures (24–27): firing case, SGLT2i-on-board suppression, eGFR-contraindication suppression, T1DM-contraindication suppression. Cross-rule isolation now spans 23 fixtures × 7 rules and explicitly verifies the HFrEF (I50.2x) → HFpEF (I50.3x) boundary in both directions — neither rule fires on the other's fixtures.

## References

- [2022 AHA/ACC/HFSA Heart Failure Guideline (Circulation, DOI 10.1161/CIR.0000000000001063)](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063), §7.7 Recommendation 2
- EMPEROR-Preserved trial (Anker et al, NEJM 2021); DELIVER trial (Solomon et al, NEJM 2022) — the underlying RCTs cited by the recommendation
- LOINC: [10230-1 (LVEF echo)](https://loinc.org/10230-1), [8806-2 (LVEF alternate)](https://loinc.org/8806-2)
- RxNorm: SGLT2i RxCUIs verified live at [rxnav.nlm.nih.gov](https://rxnav.nlm.nih.gov) on 2026-05-13
- Related ADRs: [0003](0003-metoprolol-succinate-vs-tartrate-distinction.md), [0004](0004-rule-signature-pure-function.md), [0009](0009-statin-initiation-rule.md), [0010](0010-afib-anticoagulation-rule.md)
- Source: [`lib/clinical-engine/rules/hfpef-sglt2i.ts`](../../lib/clinical-engine/rules/hfpef-sglt2i.ts)
- Tests: [`lib/clinical-engine/__tests__/hfpef-sglt2i.test.ts`](../../lib/clinical-engine/__tests__/hfpef-sglt2i.test.ts)
