# 0025 — COPD GOLD ABE rule: score-classified therapy gap

- **Status:** Accepted
- **Date:** 2026-05-17
- **Index:** [← back to docs index](../INDEX.md)

## Context

Twentieth rule shipped. Opens the pulmonology surface of the engine. GOLD 2024 retired the prior ABCD framework and ships the simpler ABE classification: symptom burden and exacerbation history drive group membership; group dictates initial inhaler class.

Structurally this is a NEW shape — score-classified therapy gap — distinct from the existing shape #7 (calculated-score-gate, e.g., CHA₂DS₂-VASc) because the score does not gate a single therapy; it routes to one of three distinct recommendations.

## Decision

Ship as `copdGoldAbeRule`. Export `classifyGold(bundle)` for downstream composition. Introduce shape **#14 Score-classified therapy gap** in `rule-shapes.md`.

Three group-specific emission paths sharing one ruleId:
- Group A: missing any bronchodilator (`group-a-no-bronchodilator`)
- Group B: missing LABA+LAMA (`group-b-missing-laba-lama`)
- Group E: missing LABA+LAMA or, if eosinophils ≥300, missing triple therapy (`group-e-missing-laba-lama` / `group-e-missing-triple`)

### Spirometry detection

- Primary: LOINC 33365-8 FEV1/FVC ratio.
- Fallback: LOINC 19926-5 FEV1 / 19868-9 FVC computed in code.
- Tolerates ratio expressed as decimal (0.6) or percent (60) — auto-converts.

### Exacerbation counting (v1)

- ICD `J44.1` (acute exacerbation) condition rows with `onsetDate` within last 12 months.
- Hospitalization vs outpatient distinction NOT modeled (no procedure slot in PatientBundle); v2 enhancement.

### Scope decisions

- **Roflumilast, azithromycin maintenance, oxygen therapy NOT modeled.** Advanced/refractory therapies.
- **Device-burden guidance NOT modeled** (single inhaler vs two devices treated equivalently if drug classes are covered).
- **GOLD spirometric severity (GOLD 1-4 FEV1% predicted) NOT used** for therapy recommendation. GOLD 2024 explicitly decoupled severity from therapy assignment when introducing ABE.

## Consequences

**Positive.** First multi-path therapy rule. The exported `classifyGold` enables future composition (e.g., a separate "COPD pulmonary rehab" rule could condition on group B/E without re-implementing the classifier). Subcategory-as-payload pattern (introduced in ADR 0017 CBP, used in ADR 0022 AIS-E) now extends to therapy-routing decisions.

**Negative.** Exacerbation counting via condition-onset is brittle — discharged inpatient records may or may not carry a J44.1 row depending on coder practice. Real-chart calibration needed before production use.

**Operational.** Fixtures 68-70. 78 tests. `classifyGold` covered with its own test block independently of the rule's emission paths.

## References

- [GOLD 2024 Report](https://goldcopd.org/2024-gold-report/)
- LOINC: [33365-8 FEV1/FVC](https://loinc.org/33365-8), [89270-4 mMRC](https://loinc.org/89270-4), [26449-9 eosinophils](https://loinc.org/26449-9)
- Related ADRs: [0010 — calculated-score-gate (sibling shape)](0010-afib-anticoagulation-rule.md)
- Source: [`lib/clinical-engine/rules/copd-gold-abe.ts`](../../lib/clinical-engine/rules/copd-gold-abe.ts)
- Tests: [`lib/clinical-engine/__tests__/copd-gold-abe.test.ts`](../../lib/clinical-engine/__tests__/copd-gold-abe.test.ts)
