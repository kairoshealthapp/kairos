# 0010 — AFib anticoagulation as the first calculated-score-gate rule

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Sixth rule shipped in the Kairos clinical engine. Until this rule the engine had five shapes — therapy-gap, universal-screening, drug-condition interaction, conditional-population screening, and threshold — all sourced from cardiology guidelines on HF and dyslipidemia. AFib was added to widen the domain footprint (a third distinct disease) and to introduce a sixth shape: **calculated-score-gate**, in which a recommendation fires only when a derived clinical risk score crosses a guideline-defined threshold.

CHA₂DS₂-VASc is the canonical example. It's computable entirely from PatientBundle inputs (conditions + sex + age), the guideline pins specific numeric thresholds (≥2 in men, ≥3 in women), and the recommendation is Class 1 LOE A — the highest evidence tier available. There is no clearer first instance for the shape.

Primary text pinned from the 2023 ACC/AHA/ACCP/HRS AFib Guideline (Joglar et al, *Circulation* 2024;149:e1–e156, DOI [10.1161/CIR.0000000000001193](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001193)) Section 6.3.1 Recommendation 1, via local pdftotext on the cached PDF:

> "For patients with AF and an estimated annual thromboembolic risk of ≥2% per year (eg, CHA2DS2-VASc score of 2 in men and 3 in women), anticoagulation is recommended to prevent stroke and systemic thromboembolism." — Class 1, LOE A.

Section 6.3.1 Recommendation 4 (also pinned):

> "In patients with AF who are candidates for anticoagulation and without an indication for antiplatelet therapy, aspirin either alone or in combination [with another antiplatelet] is..." — Class 3: Harm, LOE B-R.

That second recommendation makes aspirin-only an active harm in this population, not merely an inadequate substitute. The v1 rule does not surface a separate "aspirin-only is harmful" finding — that's a candidate for Phase 3 — but the gap rule must fire on patients on aspirin only, which it does.

Section 6.3.1 Recommendation 2 (also pinned):

> "In patients with AF who do not have a history of moderate to severe rheumatic mitral stenosis or a mechanical heart valve, and who are candidates for anticoagulation, DOACs are recommended over warfarin..." — Class 1, LOE A.

The v1 rule treats any active oral anticoagulant (DOAC or warfarin) as satisfying the requirement. A "non-valvular AFib on warfarin → consider DOAC" rule is a future Phase 3 candidate; same for a "valvular AFib requires warfarin" rule.

## Decision

The sixth rule ships at [`lib/clinical-engine/rules/afib-anticoagulation.ts`](../../lib/clinical-engine/rules/afib-anticoagulation.ts).

### Calculated-score-gate shape

The rule structure is:
1. Detect a triggering condition (here: AFib via `AFIB_ICD_CODES`).
2. Check suppression by active treatment (any oral anticoagulant).
3. Compute a clinical score from PatientBundle inputs (`calculateChaDsVasc` returns `{ score, components }`).
4. Apply a threshold (sex-dependent here).
5. Emit a gap if the score crosses the threshold and no suppression applies.

`calculateChaDsVasc` is exported as a standalone function so future rules (e.g., a HAS-BLED bleed-risk rule, an aspirin-only-AFib rule that needs to know if the patient is a candidate) can compose with it without duplicating logic. Returns both score and component breakdown.

### Sex-asymmetric threshold

The 2023 guideline retains the sex modifier in CHA₂DS₂-VASc (it did not adopt CHA₂DS₂-VA without sex, which had been discussed in some European literature). The rule encodes thresholds as `CHADSVASC_MALE_THRESHOLD = 2` and `CHADSVASC_FEMALE_THRESHOLD = 3`. Verbatim from guideline.

### Atrial flutter in scope

I48.3 (typical), I48.4 (atypical), and I48.92 (unspecified flutter) are included in `AFIB_ICD_CODES`. The 2023 guideline manages AFlutter identically to AFib for thromboembolic risk.

### Aspirin-only fires gap

Aspirin (RxCUI 1191) is deliberately not in `ANTICOAGULANT_RXCUIS`. A patient with AFib + CHA₂DS₂-VASc ≥ threshold on aspirin only therefore fires the gap. This is the correct behavior per Recommendation 4 of the guideline: aspirin is not anticoagulation in AFib and is itself a Class 3: Harm choice.

### Unknown-sex safer default

The rule emits zero findings when `patient.sex` is missing or not `'male'`/`'female'`. Applying the wrong sex-threshold could either over-fire (using the male threshold of 2 against a true female score that doesn't reach 3) or under-fire. Deferring is safer than guessing, and downstream the clinician will see the missing demographic in the chart and adjudicate.

### Contraindication handling deferred

Bleeding-risk scoring (HAS-BLED), recent ICH history, falls risk, and similar contraindications to anticoagulation are not modeled in v1. The rule's `recommendation` field explicitly reminds the clinician to review bleeding risk before prescribing. This matches the GDMT, statin, and ApoB rules' "engine surfaces, clinician adjudicates" pattern. A HAS-BLED rule is a Phase 3 candidate that can compose with `calculateChaDsVasc`'s output.

## Consequences

**Positive.** The calculated-score-gate shape is now in the engine. The pattern (detect → suppress → score → threshold → emit) generalizes to HAS-BLED, MELD, Wells DVT score, ASCVD risk scoring (when PREVENT becomes implementable), and pretest-probability scores broadly. Exporting `calculateChaDsVasc` as a standalone function decouples the score from the gap; downstream rules can reuse it without coupling to gap-emit logic.

Cross-rule isolation now spans 7 fixtures × 7 rules. The pattern from [ADR 0008](0008-apob-measurement-rule.md) holds: each new rule re-exercises every prior fixture and verifies zero false fires.

**Negative.** `evidence.contraindicationReason` is again repurposed (here to carry the score + components string). Same dirty repurpose as the statin rule, same future cleanup target (a typed `evidence.scoreBreakdown` field). Tracked in guideline-watch follow-ups.

The unknown-sex safer-default means we silently miss patients with truly indeterminate sex on the chart. The decision is defensible (don't fire wrong-threshold findings) but a future enhancement could emit a soft `'manual-review'`-status finding asking the clinician to confirm sex.

The cardiology-RN audience for whom this rule was prioritized will recognize CHA₂DS₂-VASc instantly — credibility win, but also a high bar: any error in component scoring will be caught by a 30-second mental check. Test coverage is therefore broader than the other rules' boundary tests (age 64/65/74/75 boundaries explicitly; each anticoagulant individually; each AFlutter variant).

**Operational.** Five new fixtures (19–23) covering both male and female threshold paths, suppression by apixaban, aspirin-only firing, and a low-risk no-fire case. The fixture math discovered a typo in the master prompt (the documented "CHA₂DS₂-VASc 4" for fixture-19 was off-by-one; actual score is 3, which still fires above the male threshold of 2). Test assertions updated to reflect the computed score.

## References

- [2023 ACC/AHA/ACCP/HRS AFib Guideline (Circulation, DOI 10.1161/CIR.0000000000001193)](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001193)
- [AHA Top Things to Know](https://professional.heart.org/en/science-news/2023-acc-aha-accp-hrs-guideline-for-the-diagnosis-and-management-of-atrial-fibrillation/top-things-to-know)
- RxNorm REST API — anticoagulant RxCUIs verified live 2026-05-13: [rxnav.nlm.nih.gov](https://rxnav.nlm.nih.gov)
- Related ADRs: [0004](0004-rule-signature-pure-function.md), [0007](0007-nsaid-hf-interaction-rule.md), [0009](0009-statin-initiation-rule.md)
- Source: [`lib/clinical-engine/rules/afib-anticoagulation.ts`](../../lib/clinical-engine/rules/afib-anticoagulation.ts)
- Tests: [`lib/clinical-engine/__tests__/afib-anticoagulation.test.ts`](../../lib/clinical-engine/__tests__/afib-anticoagulation.test.ts)
