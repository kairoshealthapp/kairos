# 0007 — NSAID-in-HFrEF as the first interaction-shape rule

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Phase 2 expansion of the Kairos clinical engine. After ADRs [0004](0004-rule-signature-pure-function.md) (rule signature) and [0006](0006-lpa-screening-rule.md) (Lp(a) screening), the engine had two rule shapes: **therapy-gap** (GDMT HFrEF — patient missing a recommended drug) and **screening-gap** (Lp(a) — patient missing a recommended lab). A third shape was needed for portfolio credibility: **interaction** — patient is actively on a prescription that the guideline says should not be on board. Different finding semantics, different recommended action, different UI affordance.

The clinical target was easy: NSAIDs in HFrEF. The 2022 AHA/ACC/HFSA Guideline (Heidenreich et al, *Circulation*. 2022;145:e895–e1032, DOI [10.1161/CIR.0000000000001063](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063)) carries a Class 3: Harm / LOE B-NR recommendation under Section 7.3.2:

> "In patients with HFrEF, NSAIDs worsen HF symptoms and should be avoided or withdrawn whenever possible."

Class 3: Harm is the strongest "don't do this" designation. LOE B-NR is non-randomized but multi-cohort consistent. Clinically obvious to any cardiology reviewer; instant credibility for the rule set. The recommendation lives in Section 7.3.2 — the HFrEF chapter — with no parallel Class 3 in the HFmrEF/HFpEF chapters.

Five scope decisions required adjudication.

**1. New `FindingStatus` value vs. reusing `'contraindicated'`.** The existing `'contraindicated'` status is used in the GDMT rule to mean "patient is missing this pillar AND we shouldn't initiate it" — i.e., a negative finding that suppresses a gap with severity `'info'`. The NSAID case is structurally different: the patient *is on* the drug; the clinical action is *withdraw*, not *do not initiate*. Reusing `'contraindicated'` would force the UI to inspect both `status` and `severity` to disambiguate the two meanings, which is fragile coupling.

**2. Severity for Class 3: Harm with an active prescription.** The existing `FindingSeverity` is `'gap' | 'warning' | 'critical' | 'info'`. None of the existing rules use `'critical'`. NSAIDs blunt diuretic response, drive sodium/water retention, and the supportive text in the 2022 guideline cites observational evidence of increased morbidity *and mortality*. This is materially more urgent than a missing-pillar gap.

**3. HF scope: HFrEF only vs. all HF.** The recommendation text starts with "In patients with HFrEF" and lives in the HFrEF section. The mechanism (renal prostaglandin inhibition → Na/water retention → blunted diuretic response) is plausibly relevant in HFmrEF/HFpEF as well, but the 2022 guideline does not make a Class 3 recommendation outside HFrEF.

**4. Aspirin.** Aspirin is technically an NSAID but pharmacologically distinct at cardioprotective doses (irreversible COX inhibitor; antiplatelet effect dominant at 81 mg). The 2022 recommendation text says "NSAIDs", not "aspirin or NSAIDs". A massive share of US HFrEF patients are on low-dose aspirin for cardioprotection. Including aspirin in the detection list would generate intolerable false-positive load and contradict the clinical intent of the recommendation.

**5. Topical NSAIDs.** The 2022 guideline does not address topical NSAIDs. Topical diclofenac (Voltaren gel, etc.) has low systemic absorption and is not the pharmacology the recommendation targets. But the FHIR `route` field is often missing or freeform in real charts, so any suppression has to fail safe.

**6. COX-2 selective inhibitors (celecoxib).** Table 13 of the 2022 guideline lists both "COX, nonselective inhibitors (NSAIDs)" and "COX, selective inhibitors (COX-2 inhibitors)" as Major exacerbators of underlying myocardial dysfunction. The recommendation supportive text states verbatim: "Several observational cohort studies have revealed increased morbidity and mortality in patients with HF using either nonselective or selective NSAIDs."

## Decision

The third rule, **NSAID-in-HFrEF interaction**, is shipped at [`lib/clinical-engine/rules/nsaid-hf-interaction.ts`](../../lib/clinical-engine/rules/nsaid-hf-interaction.ts).

- **A new `FindingStatus` value `'interaction'` is introduced** in [`lib/clinical-engine/types.ts`](../../lib/clinical-engine/types.ts). It means "active prescription that the guideline says should be withdrawn." Distinct from `'contraindicated'` (do not initiate) and from `'non-evidence-based'` (drug present but wrong member of the class). The UI can render interaction findings with their own affordance — "Discontinue X" vs. "Consider initiating Y" — without inspecting severity.

- **Severity is `'critical'`** for this rule. Class 3: Harm B-NR with an active prescription is the most urgent category currently produced by the engine. No other rule uses `'critical'` yet; this is the first.

- **HFrEF gate only.** The rule reuses [`HFREF_CONDITION_CODES`](../../lib/clinical-engine/rules/gdmt-hfref.ts) from the GDMT rule. No new condition set; tight fidelity to the 2022 guideline's explicit "In patients with HFrEF" wording. HFmrEF/HFpEF expansion is deferred to a future ADR if and when a parallel Class 3 recommendation lands or the writing committee broadens the language. Tested explicitly: HFpEF (I50.32) + active ibuprofen emits zero findings.

- **Aspirin is excluded entirely** from the NSAID detection set. RxCUI 1191 is not in `NSAID_RXCUIS`. Tested explicitly with an active 81 mg aspirin prescription on an HFrEF patient → zero findings.

- **Topical NSAIDs are suppressed via route inspection.** When `medication.route` contains any of `'topical' | 'transdermal' | 'cutaneous'` (case-insensitive substring), the finding does not fire. When `route` is missing or unrecognized, the finding fires (safer default — surface to the clinician for adjudication rather than silently miss a systemic prescription with a sparse Epic record). Tested in both directions.

- **COX-2 selective inhibitors are in scope.** Celecoxib (RxCUI 140587) is included in `NSAID_RXCUIS` per the explicit guideline language.

- **Detection is ingredient-level.** `NSAID_RXCUIS` maps ingredient name → RxNorm ingredient RxCUI. Each ingredient was verified against the live RxNorm REST API at [rxnav.nlm.nih.gov](https://rxnav.nlm.nih.gov) on 2026-05-13. Product-level codes (e.g., "ibuprofen 600 MG Oral Tablet" with its product RxCUI) roll up to these ingredients via the standard RxNorm hierarchy, but the rule also matches by `genericName` substring as a fallback when the chart record lacks an ingredient RxCUI.

- **One finding per offending NSAID.** If the patient is on both naproxen and diclofenac, the rule emits two findings — distinct `subcategory` values — so the clinician sees and can act on each drug independently.

## Consequences

**Positive.** Three distinct finding shapes now coexist in the engine (gap, screening-gap, interaction). The `'interaction'` status generalizes beyond NSAIDs to any future drug-condition or drug-drug rule (e.g., dihydropyridine CCBs in HFrEF, beta-blocker withdrawal in stable HFrEF decompensation, anticoagulant-NSAID bleed risk). Reusing `HFREF_CONDITION_CODES` validates the modularity hypothesis from [ADR 0005](0005-three-knowledge-layer-architecture.md): cross-rule references stay clean when condition sets are exported by their owning rule.

The rule introduces a **cross-rule isolation test pattern**: fixtures 01–08 are exercised against `nsaidHfInteractionRule` to verify zero findings. As the rule count grows, every new rule should include this cross-fixture sweep so unintended interactions surface immediately rather than via partial regression.

The aspirin exclusion is a deliberate clinical decision documented here and in the rule banner; future maintainers must not "complete" the NSAID list by adding aspirin without revisiting this ADR.

**Negative.** Adding a new `FindingStatus` value is a breaking change for any consumer that exhaustively switches over the union (none exist in-repo yet). The provider UI (`BriefingDrawer.js`) currently styles by severity only; introducing `'critical'` may require a new tone token if the existing `gap`/`warning`/`info` tones don't satisfy the design intent. Tracked as a UI-session follow-up; this session is library-only.

The route-based topical suppression is a soft heuristic: if Epic records a topical diclofenac prescription with `route: ''` or `route: 'unknown'`, the finding fires. The safer-default direction is right, but the false-positive rate will need real-chart calibration before this rule fronts production.

**Operational.** Two new fixtures (09, 10) dedicated to this rule; existing fixtures 01–08 are explicitly tested against the new rule to confirm zero false fires. The full test suite is now 76 cases across three rule files — all green.

## References

- [2022 AHA/ACC/HFSA Heart Failure Guideline (Heidenreich et al, Circulation)](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063)
- [RxNorm REST API (rxnav.nlm.nih.gov)](https://rxnav.nlm.nih.gov)
- Related ADRs: [0003 — metoprolol succinate vs. tartrate](0003-metoprolol-succinate-vs-tartrate-distinction.md), [0004 — rule signature](0004-rule-signature-pure-function.md), [0006 — Lp(a) screening](0006-lpa-screening-rule.md)
- Source: [`lib/clinical-engine/rules/nsaid-hf-interaction.ts`](../../lib/clinical-engine/rules/nsaid-hf-interaction.ts)
- Tests: [`lib/clinical-engine/__tests__/nsaid-hf-interaction.test.ts`](../../lib/clinical-engine/__tests__/nsaid-hf-interaction.test.ts)
