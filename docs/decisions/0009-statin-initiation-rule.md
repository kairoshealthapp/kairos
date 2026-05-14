# 0009 — Statin initiation as the first threshold-shape rule

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Fifth rule shipped in the Kairos clinical engine. With this rule the engine spans five clinical-reasoning shapes:

1. Therapy gap — GDMT HFrEF ([ADR 0004](0004-rule-signature-pure-function.md))
2. Universal screening gap — Lp(a) ([ADR 0006](0006-lpa-screening-rule.md))
3. Drug-condition interaction — NSAID-HFrEF ([ADR 0007](0007-nsaid-hf-interaction-rule.md))
4. Conditional-population screening gap — ApoB ([ADR 0008](0008-apob-measurement-rule.md))
5. **Threshold gap** (this rule) — statin initiation indicated by one or more deterministic clinical thresholds.

Statins are the foundation of lipid-lowering therapy per the 2026 ACC/AHA Dyslipidemia Guideline (*Circulation*. 2026; DOI [10.1161/CIR.0000000000001423](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423)). The guideline issues several distinct initiation paths, each with its own age/lab/condition trigger:

- **Secondary prevention** (established ASCVD).
- **Severe hypercholesterolemia** (LDL-C ≥ 190 mg/dL).
- **Diabetes age 40–75** (primary prevention regardless of LDL-C).
- **CKD stage 3–4 age 40–75** (primary prevention regardless of LDL-C).
- **HIV age 40–75** (primary prevention regardless of LDL-C).
- **PREVENT-ASCVD risk** (10-year risk ≥ 5% or borderline 3–5% with risk-enhancing factors), using the new PREVENT equations that replaced the Pooled Cohort Equations in this guideline.

The rule shape "threshold gap" is distinguished from the screening shapes because the trigger is **value-based**, not absence-based, and from the interaction shape because the action is **initiation**, not withdrawal. The rule shipped here is the first in the engine to use this shape and the first to need suppression-by-active-prescription logic ("patient is already on therapy → no gap").

Three forces shaped the v1 scope.

**PREVENT-risk path requires inputs not in PatientBundle.** PREVENT-ASCVD equations need systolic BP, smoking status, cholesterol values, eGFR, diabetes, BMI, and several other fields. Several of these are not consistently present in the synthetic-fixture / Epic-sandbox bundles we work with today. Implementing a half-working PREVENT calculator inside the rule risks silent miscalculation — the worst possible failure mode for a clinical engine. Per the master prompt's pre-approval, PREVENT is deferred to a future rule version once a clean code path lands.

**Contraindication handling matches GDMT precedent.** The 2026 guideline mentions rhabdomyolysis history, active liver disease, pregnancy, and statin allergy as scenarios where alternative therapy or further evaluation is warranted before initiation. Encoding these in the rule would expand scope substantially. The GDMT HFrEF rule sets the precedent (cf. ADR 0004): the engine surfaces the recommendation; the clinician adjudicates contraindications at the bedside. The Finding's `recommendation` field explicitly reminds the clinician to review contraindications.

**Emit semantics for multi-path triggers.** A 65-year-old with prior MI, T2DM, and LDL-C 220 mg/dL who is not on a statin triggers all three deterministic paths simultaneously. The clinical action is identical regardless: start a statin. Emitting three Findings for one action would clutter the UI and conflate "three reasons to start" with "three things to do." We chose to emit **one Finding per patient**, listing every triggered path in the `summary` field and in `evidence.contraindicationReason` (repurposed semantically as a paths field — see Consequences).

## Decision

The fifth rule is shipped at [`lib/clinical-engine/rules/statin-initiation.ts`](../../lib/clinical-engine/rules/statin-initiation.ts) as a **threshold-shape gap** with the following structure.

### Suppression first
If the patient is on any active statin (RxNorm match against `STATIN_RXCUI_SET` or generic-name substring fallback), the rule emits nothing. Inactive prescriptions (status ≠ `'active'`) do not suppress — the rule is about current therapy, not history.

### v1 deterministic threshold paths

1. **Secondary prevention.** Any ICD-10 condition matching `I20`–`I25`, `I63`, or `I70` triggers the path. LDL-C is not checked here; the guideline goal is < 55 mg/dL in this group but a missing statin is the gap regardless of current value.
2. **Severe hypercholesterolemia.** Most recent LDL-C (LOINC `13457-7` calculated or `18262-6` direct) ≥ 190 mg/dL.
3. **Diabetes age 40–75.** ICD-10 prefix `E10` or `E11` plus computed patient age in `[40, 75]` inclusive on both ends. Boundaries verified in tests.

If any path triggers and the patient is not already on a statin, one Finding fires with severity `'gap'` and status `'missing'`. The `summary` lists every triggered path; `evidence.contraindicationReason` carries the same path string for machine-readable consumers.

### Deferred to v2
- PREVENT-ASCVD 10-year risk path (3–5% and 5–10% bands).
- CKD stage 3–4 (`N18.3`, `N18.4`) primary-prevention path.
- HIV (`B20`, `Z21`) primary-prevention path.
- Contraindication-aware finding suppression / downgrading (rhabdo, active liver disease, pregnancy, statin allergy).
- Statin **intensity** evaluation (e.g., flagging a patient with prior MI on low-intensity simvastatin 20 mg as under-treated). v1 treats any active statin as suppression — it does not check intensity vs. guideline target.

### Suppression semantics
Generic-name fallback (e.g., a chart record with `genericName: 'rosuvastatin'` but no RxCUI) suppresses the rule. This is consistent with the GDMT rule's `medMatchesPillar` pattern.

### Most-recent LDL semantics
Tests cover both directions: older high LDL + newer low LDL → no fire; older low LDL + newer high LDL → fire. The rule looks at the most-recent LDL only. This matches how clinicians read lab trends and reaffirms the same choice the ApoB rule makes for its LDL-at-goal qualifier.

### Pediatric LDL ≥ 190 fire — documented limitation
The severe-hypercholesterolemia path does not gate on age. A child with LDL ≥ 190 (suggestive of familial hypercholesterolemia) will trigger the rule. This is documented in the test suite as the **current behavior**. A future refinement could route pediatric severe hypercholesterolemia to a separate referral-to-pediatric-lipidology rule rather than a statin gap; tracked in guideline-watch follow-ups.

## Consequences

**Positive.** The threshold-rule shape is now in the engine vocabulary, and the suppression-by-active-prescription pattern is established. Both generalize to upcoming rules (e.g., aspirin-for-secondary-prevention initiation, PCSK9i for residual risk after max statin). The "one Finding per patient with multiple paths" choice matches the clinical-action model and avoids cluttering the UI; future multi-path rules should follow this convention.

The eGFR single-code shortcut was lifted as a same-session cleanup ([gdmt-hfref.ts](../../lib/clinical-engine/rules/gdmt-hfref.ts) now uses `EGFR_LOINC_CODES = ['33914-3', '88293-6', '98979-8']`). This closes a follow-up flagged in Sessions 36–37 and means the engine's multi-code lab matching is now consistent across all three lab-touching rules (Lp(a), ApoB, statin) and the GDMT HFrEF rule's eGFR check.

**Negative.** Repurposing `evidence.contraindicationReason` to carry the multi-path qualifier string is semantically dirty — the field name says "contraindication" but holds qualifier paths. A future `evidence.qualifyingPaths: string[]` field would be cleaner. We did not add the type field this session to avoid a backward-incompatible types.ts change touching all five rules; deferred to a future engine-types pass.

The pediatric LDL ≥ 190 fire is a real but minor false-positive in a population the rule doesn't target. Documented limitation, not silently broken.

PREVENT-risk and contraindication handling are deferred; v1 does not catch a moderate-risk primary-prevention patient who should be on a statin per PREVENT, and does not protect a pregnant patient from a misplaced "start a statin" recommendation. Both are flagged in the rule banner and the ADR.

**Operational.** Four new fixtures (15–18) dedicated to this rule. Fixtures 11 and 14 (from ADR 0008) coincidentally trigger the statin diabetes path; the test suite explicitly documents the expected interaction so future readers don't mistake it for a cross-rule bug. Fixture 12 (prior MI + active atorvastatin) demonstrates the suppression path.

## References

- [2026 ACC/AHA Dyslipidemia Guideline (Circulation, DOI 10.1161/CIR.0000000000001423)](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423)
- [AHA press release — diabetes age 40–75, CKD, HIV primary-prevention path](https://newsroom.heart.org/news/accaha-issue-updated-guideline-for-managing-lipids-cholesterol)
- [JACC at-a-glance, 2026 Dyslipidemia](https://www.jacc.org/doi/10.1016/j.jacc.2026.02.4872)
- [LOINC 13457-7 — LDL calculated](https://loinc.org/13457-7), [LOINC 18262-6 — LDL direct](https://loinc.org/18262-6)
- RxNorm REST API (statin RxCUIs verified live 2026-05-13): [rxnav.nlm.nih.gov](https://rxnav.nlm.nih.gov)
- Related ADRs: [0004 — rule signature](0004-rule-signature-pure-function.md), [0006 — Lp(a)](0006-lpa-screening-rule.md), [0007 — NSAID-HF](0007-nsaid-hf-interaction-rule.md), [0008 — ApoB](0008-apob-measurement-rule.md)
- Source: [`lib/clinical-engine/rules/statin-initiation.ts`](../../lib/clinical-engine/rules/statin-initiation.ts)
- Tests: [`lib/clinical-engine/__tests__/statin-initiation.test.ts`](../../lib/clinical-engine/__tests__/statin-initiation.test.ts)
