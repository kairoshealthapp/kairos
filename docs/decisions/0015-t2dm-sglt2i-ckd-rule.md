# 0015 — T2DM-CKD SGLT2i: dual-guideline citation and conditional-population therapy-gap

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Tenth rule shipped. Three firsts in one rule:

1. **First rule sourced from two converging guidelines.** ADA Standards of Care 2026 (US clinical convention) and KDIGO 2022 (renal society convention) converge on SGLT2i for T2DM with CKD. Different writing committees, different evidence framing, same end-state recommendation. The rule banner cites both.

2. **Third entry in the rule shape vocabulary's "conditional-population" family** — first such rule for *therapy* (not measurement). The shape generalizes the ApoB pattern ([ADR 0008](0008-apob-measurement-rule.md)) to drug-class recommendations: fire only when the patient meets ≥1 clinical qualifier (here: any of three CKD-detection modes).

3. **First rule to open a new specialty** — endocrine. Previous rules clustered in Cardiology (HFrEF, HFpEF, AFib, post-MI) and Dyslipidemia. T2DM is the entry point for a broader endocrinology rule portfolio.

### Primary text pinned

ADA Standards of Care in Diabetes — 2026, §11.11a (paraphrased from authoritative summaries; primary text behind Diabetes Care subscription):

> "In adults with type 2 diabetes who have chronic kidney disease (with confirmed eGFR 20–60 mL/min/1.73 m² and/or albuminuria), an SGLT2 inhibitor or GLP-1 RA with demonstrated benefit in this population should be used for both glycemic management and for slowing progression of CKD and reduction in cardiovascular events (irrespective of A1C)."

KDIGO 2022 Clinical Practice Guideline for Diabetes Management in CKD, §1.3.1 (verbatim from public PDF):

> "We recommend treating patients with type 2 diabetes, CKD, and eGFR ≥20 mL/min/1.73 m² with a sodium-glucose cotransporter 2 inhibitor (SGLT2i)."

KDIGO assigns this **1A** — strong recommendation, high quality of evidence.

### Mid-implementation correction

Initial v1 used CKD-by-eGFR range 25–89 mL/min/1.73m², which over-fired on a HFpEF fixture (eGFR 65, no albuminuria) that should not have qualified as CKD per KDIGO. KDIGO defines CKD as eGFR <60 for ≥3 months OR markers of kidney damage (albuminuria) for ≥3 months. Tightened to eGFR 25–59 for the eGFR-only detection mode. Albuminuric CKD with preserved eGFR is captured by the UACR mode (≥30 mg/g). This is the cleanest mapping of the KDIGO definition into PatientBundle inputs.

## Decision

The tenth rule ships at [`lib/clinical-engine/rules/t2dm-sglt2i-ckd.ts`](../../lib/clinical-engine/rules/t2dm-sglt2i-ckd.ts).

### Multi-modal CKD detection

`detectCkd(bundle)` returns `{ detected: boolean, reasons: string[] }`. CKD is detected by any one of:

1. ICD-10 `N18.x` (any CKD stage code).
2. Most recent eGFR observation in range `[25, 59]` mL/min/1.73m². Multi-code via `EGFR_LOINC_CODES` from gdmt-hfref.
3. Most recent UACR observation ≥ 30 mg/g. Multi-code: 9318-7 (Albumin/Creatinine in Urine) or 14959-1 (Microalbumin/Creatinine in Urine).

This generalizes to other disease-detection rules where the disease can be coded explicitly OR derived from observations.

### Agent list differs from HFpEF SGLT2i rule

| Rule | Agent set | Rationale |
|---|---|---|
| `hfpef-sglt2i` ([ADR 0011](0011-hfpef-sglt2i-rule.md)) | empagliflozin, dapagliflozin, canagliflozin, ertugliflozin | empag and dapag have HF trials (EMPEROR-Preserved, DELIVER); cana/ertu suppress by pharmacologic equivalence |
| `t2dm-sglt2i-ckd` (this rule) | canagliflozin, dapagliflozin, empagliflozin, ertugliflozin | canagliflozin has the foundational CKD trial (CREDENCE) plus dapag (DAPA-CKD) and empag (EMPA-KIDNEY) |

The two rules' agent sets overlap entirely but the **clinical priority** differs. The recommendation field cites the three trial-validated agents for CKD: canagliflozin, dapagliflozin, empagliflozin.

### eGFR contraindication floor

The rule suppresses when most recent eGFR < 25 mL/min/1.73m². KDIGO permits SGLT2i initiation down to eGFR ≥ 20; DAPA-CKD's initiation floor is 25. Using the more conservative initiation floor (25) avoids firing recommendations for patients near the dialysis margin where contraindication is more likely. v2 could relax to eGFR ≥ 20 once chart-narrative DKA-precipitant screening is feasible.

### T1DM exclusion supremacy

T1DM (E10.x) suppresses regardless of other findings. Mirrors HFpEF SGLT2i rule.

### Dual-citation pattern

The rule's `summary` cites both ADA and KDIGO inline: "ADA 2026 §11.11a + KDIGO 2022 §1.3.1 (Class 1A)". This is a deliberate choice — the clinician sees both societies converging on the same recommendation, which strengthens confidence. The `ruleName` similarly cites both.

## Consequences

**Positive.** Engine domain footprint now spans Cardiology, Dyslipidemia, and Endocrinology. The conditional-population-therapy-gap shape is named and exemplified. The dual-guideline citation pattern is now precedent — future rules sourced from converging guidelines (e.g., 2026 ESC HF Update + 2022 AHA HF Guideline alignment) can follow this banner structure. `detectCkd` is exported as a standalone for future kidney-related rules.

**Negative.** The mid-implementation CKD-eGFR threshold correction is a reminder that even pre-approved adjudications require primary-text discipline. The cross-rule isolation test against fixture-24 caught the over-fire before merge; this is exactly the regression-control purpose codified in [ADR 0012](0012-cross-rule-isolation-test-pattern.md).

The dual-guideline citation pattern creates a new maintenance dimension: if either guideline updates independently, both banner sources need re-review. Tracked in guideline-watch.md as separate rows (one per guideline, both pointing at this rule).

**Operational.** Four new fixtures (36–39) — firing case (ICD + eGFR + UACR triple-mode), canagliflozin suppression, no-CKD-no-fire, eGFR-contraindication suppression. Cross-rule isolation against fixtures 01–35, with documented co-triggers where T2DM patients with CKD evidence coincide with other rules' firing populations.

## References

- ADA Standards of Care in Diabetes — 2026: [Section 11 (Chronic Kidney Disease and Risk Management)](https://diabetesjournals.org/care/article/49/Supplement_1/S239/163938) (subscription).
- [KDIGO 2022 Clinical Practice Guideline for Diabetes Management in CKD](https://kdigo.org/wp-content/uploads/2022/10/KDIGO-2022-Clinical-Practice-Guideline-for-Diabetes-Management-in-CKD.pdf), §1.3.1, Class 1A.
- Trials: [CREDENCE (canagliflozin)](https://pubmed.ncbi.nlm.nih.gov/30990260/), [DAPA-CKD (dapagliflozin)](https://pubmed.ncbi.nlm.nih.gov/32970396/), [EMPA-KIDNEY (empagliflozin)](https://pubmed.ncbi.nlm.nih.gov/36331190/).
- Related ADRs: [0008](0008-apob-measurement-rule.md) (conditional-population shape origin), [0011](0011-hfpef-sglt2i-rule.md) (SGLT2i RxCUIs origin), [0012](0012-cross-rule-isolation-test-pattern.md) (caught the eGFR threshold bug).
- Source: [`lib/clinical-engine/rules/t2dm-sglt2i-ckd.ts`](../../lib/clinical-engine/rules/t2dm-sglt2i-ckd.ts)
- Tests: [`lib/clinical-engine/__tests__/t2dm-sglt2i-ckd.test.ts`](../../lib/clinical-engine/__tests__/t2dm-sglt2i-ckd.test.ts)
