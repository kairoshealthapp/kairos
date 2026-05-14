# Rule Shapes — Kairos Clinical Engine Vocabulary

**Last updated:** 2026-05-13
[← Index](INDEX.md)

The Kairos clinical engine deliberately surfaces a small set of recurring rule shapes. Every rule belongs to one. Naming and reusing shapes lets new rule authors pick a pattern rather than improvise structure, lets reviewers focus on what's different about a given rule rather than re-reading boilerplate, and gives the portfolio audience a vocabulary for talking about engine coverage.

A rule shape is a structural template, not a clinical category. The same shape can serve any specialty.

## The nine shapes shipped

### 1. Therapy-gap, multi-pillar

A disease has multiple recommended drug classes (pillars), each independently indicated. The rule iterates pillars; for each, checks whether the patient is on any qualifying member of the class; emits a gap per missing pillar. Each gap is independently actionable. May also surface non-evidence-based therapy (right class, wrong member) and contraindications.

- **Example:** [`gdmt-hfref.ts`](../lib/clinical-engine/rules/gdmt-hfref.ts) — ACEi/ARB/ARNi, beta-blocker, MRA, SGLT2i.
- **When to choose:** the guideline names ≥2 drug classes as indicated for the same disease state, and the patient should be on members of each independently.
- **ADR:** [0004](decisions/0004-rule-signature-pure-function.md)

### 2. Therapy-gap, single-pillar

Same as multi-pillar but degenerate to one drug class. Used when only one therapy is indicated for the condition, or when one new recommendation lands in an existing multi-pillar landscape and gets its own rule for evidence-tracking clarity.

- **Example:** [`hfpef-sglt2i.ts`](../lib/clinical-engine/rules/hfpef-sglt2i.ts) — single SGLT2i pillar for HFpEF.
- **When to choose:** "in disease X, drug class Y is indicated" with no parallel class.
- **ADR:** [0011](decisions/0011-hfpef-sglt2i-rule.md)

### 3. Universal screening-gap

A recommendation says all adults (or all patients meeting a simple demographic gate) should have a particular lab measured at least once. The rule fires when the lab is absent from a lifetime bundle scan. No value/threshold inspection. No qualifying-population logic beyond age.

- **Example:** [`lp-a-screening.ts`](../lib/clinical-engine/rules/lp-a-screening.ts) — Lp(a) once in adulthood.
- **When to choose:** a Class I universal screening recommendation.
- **ADR:** [0006](decisions/0006-lpa-screening-rule.md)

### 4. Conditional-population screening-gap

A recommendation says a lab "can be useful" or "may be considered" in a specific high-risk subset. The rule fires only when the patient meets ≥1 qualifying condition AND the lab is absent. Distinct from universal screening because the gate is clinical, not demographic.

- **Example:** [`apo-b-measurement.ts`](../lib/clinical-engine/rules/apo-b-measurement.ts) — ApoB in patients with diabetes, ASCVD, achieved LDL<70, or elevated TG.
- **When to choose:** the guideline conditions a measurement on a clinical risk profile, not on every adult.
- **ADR:** [0008](decisions/0008-apob-measurement-rule.md)

### 5. Drug-condition interaction

A patient is actively on a prescription that the guideline says should not be on board given their condition. The clinical action is **withdraw**, not initiate. Severity is `'critical'` (higher than gap-shape rules). Uses the `'interaction'` `FindingStatus` value.

- **Example:** [`nsaid-hf-interaction.ts`](../lib/clinical-engine/rules/nsaid-hf-interaction.ts) — NSAIDs in HFrEF.
- **When to choose:** a Class 3: Harm or equivalent "avoid X in patients with Y" recommendation.
- **ADR:** [0007](decisions/0007-nsaid-hf-interaction-rule.md)

### 6. Threshold (value-based, multi-path)

A recommendation is gated by one or more numeric thresholds against PatientBundle observations. Multiple paths may trigger the same recommendation; the rule emits **one Finding per patient listing all triggered paths** (rather than one per path) to match the clinical action ("start a statin") which is independent of how many paths qualified the patient. Suppressed when the patient is already on the indicated therapy.

- **Example:** [`statin-initiation.ts`](../lib/clinical-engine/rules/statin-initiation.ts) — ASCVD, LDL ≥ 190, or diabetes age 40–75.
- **When to choose:** recommendation has multiple independent numeric gates leading to the same therapeutic action.
- **ADR:** [0009](decisions/0009-statin-initiation-rule.md)

### 7. Calculated-score-gate

A recommendation is gated by a clinical risk score computed from PatientBundle inputs. The score is exported as a standalone function so future rules can compose with it. Threshold may vary by demographic (e.g., sex-asymmetric thresholds in CHA₂DS₂-VASc).

- **Example:** [`afib-anticoagulation.ts`](../lib/clinical-engine/rules/afib-anticoagulation.ts) — CHA₂DS₂-VASc ≥2 men, ≥3 women.
- **When to choose:** the guideline pins thresholds against a derived score (CHA₂DS₂-VASc, HAS-BLED, MELD, Wells, PREVENT, etc.) that's computable from chart data.
- **ADR:** [0010](decisions/0010-afib-anticoagulation-rule.md)

### 8. Time-bounded therapy-gap

A therapy-gap rule whose firing is gated by a time anchor: the patient must have had a qualifying event (MI, stroke, procedure, transplant) within a specific window for the recommendation to apply. The rule extracts the most recent qualifying Condition, reads its `onsetDate`, and computes the elapsed window against today.

- **Examples:** [`post-mi-beta-blocker.ts`](../lib/clinical-engine/rules/post-mi-beta-blocker.ts) and [`post-mi-acei-arb.ts`](../lib/clinical-engine/rules/post-mi-acei-arb.ts) — both gate on MI onset within 12 months.
- **When to choose:** a "post-event" or "within X months/years of Y" recommendation. The shape extends to post-stroke antiplatelet, post-procedure DAPT, post-transplant immunosuppression, etc.
- **ADRs:** [0013](decisions/0013-post-mi-beta-blocker-rule.md), [0014](decisions/0014-post-mi-acei-arb-rule.md)
- **Caveat:** fixtures with absolute `onsetDate` values become stale as real-world time advances. Tests against them fail loudly when stale — the correct signal that fixtures need refreshing. Time-boundary inline tests use computed dates and remain stable.

### 9. Conditional-population therapy-gap

A therapy-gap rule that fires only when the patient meets ≥1 clinical qualifier (not just a demographic gate). Sibling shape of conditional-population screening (#4 above), differing only in whether the missing item is a therapy or a measurement.

- **Example:** [`t2dm-sglt2i-ckd.ts`](../lib/clinical-engine/rules/t2dm-sglt2i-ckd.ts) — fires only when T2DM + CKD (multi-modal detection: ICD `N18.x`, eGFR 25–59, or UACR ≥30).
- **When to choose:** the guideline conditions a therapy on a clinical risk profile beyond a single disease code (e.g., "SGLT2i in T2DM with CKD" vs. "SGLT2i in all T2DM"). Often pairs with multi-modal disease detection (ICD OR observation OR derived state).
- **ADR:** [0015](decisions/0015-t2dm-sglt2i-ckd-rule.md)

## Conventions inherited by every rule, regardless of shape

- Bannered guideline-source block at the top of the rule file: citation, DOI, publication date, exact recommendation verbatim, Class / LOE, scope decisions, `lastReviewed`, `reviewedBy`, `nextReviewDue`.
- Pure-function signature: `(bundle: PatientBundle) => Finding[]`. No side effects, no I/O, no async ([ADR 0004](decisions/0004-rule-signature-pure-function.md)).
- Multi-code lab matching by default. Multi-code RxNorm matching with `genericName` substring fallback.
- Suppression-by-active-prescription where the recommended therapy is a drug. Inactive prescriptions do not suppress.
- Cross-rule isolation tests against every existing fixture ([ADR 0012](decisions/0012-cross-rule-isolation-test-pattern.md)).
- Per-rule named exports of every constant a future composer would need (score functions, code sets, threshold values).

## Meta-patterns

These are not rule shapes (each rule still belongs to exactly one shape above), but engine-output patterns that span multiple rules.

### Convergent-evidence

Two rules with different evidence pedigrees fire on the same clinical scenario. The clinician sees both citations independently arriving at the same recommended action. v1 convention: **fire both rules, do not deduplicate**. Surfaces the convergence signal at the cost of dual chips in the UI. v2 may introduce a Finding-deduplication layer that groups by clinical action while preserving the citations.

- **Example:** a T2DM patient age 40–75 not on a statin fires both [`statin-initiation`](../lib/clinical-engine/rules/statin-initiation.ts) (citing 2026 ACC/AHA Dyslipidemia) and [`t2dm-statin`](../lib/clinical-engine/rules/t2dm-statin.ts) (citing ADA Standards 2026).
- **ADR:** [0016](decisions/0016-t2dm-statin-rule.md)

### Dual-guideline citation

A single rule sourced from two converging guidelines. Distinct from convergent-evidence (which is two rules); here one rule banner cites both guidelines and the rule's summary/recommendation surfaces both sources inline.

- **Example:** [`t2dm-sglt2i-ckd.ts`](../lib/clinical-engine/rules/t2dm-sglt2i-ckd.ts) cites ADA 2026 §11.11a + KDIGO 2022 §1.3.1.
- **ADR:** [0015](decisions/0015-t2dm-sglt2i-ckd-rule.md)
- **Maintenance note:** if either guideline updates, both banner sources need re-review. Tracked as separate rows in [guideline-watch.md](guideline-watch.md) pointing at the same rule.

## How to add a new shape

If a new rule does not fit any of the seven shapes above, write an ADR introducing the new shape **before** shipping the rule. The ADR should explain why none of the existing shapes are a fit, define the new shape's structural template, and commit to a naming convention so the next rule of the same shape can reuse it. Future shape ADRs should be linked from this doc.
