# 0022 — AIS-E rule: per-item gap fan-out shape

- **Status:** Accepted
- **Date:** 2026-05-17
- **Index:** [← back to docs index](../INDEX.md)

## Context

Seventeenth rule shipped. Second internal-medicine rule. HEDIS AIS-E ("Adult Immunization Status") aggregates several ACIP-recommended adult immunizations into a single composite measure. Underlying authority: ACIP 2026 adult immunization schedule.

This is the first engine rule that emits **multiple Findings per patient invocation** — one per missing antigen. Prior rules emitted at most one Finding per `ruleId` per patient (statin-initiation merges multiple qualifying paths into one Finding; this rule cannot, because the clinical action is a separate shot order per antigen).

## Decision

Ship as `aisAdultImmunizationRule`. Introduce a new rule shape — **#12 Per-item gap fan-out** — documented in `rule-shapes.md`. The shape:

1. Demographic gate (adult ≥18).
2. Iterates a set of "items" (here, antigens).
3. For each item: age-gate and/or condition-gate, then cadence check.
4. Emits one Finding per missing item, sharing `ruleId` but using `subcategory` to identify the antigen.

### Antigens modeled in v1

| Antigen | Age gate | Condition gate | Cadence | CVX |
|---|---|---|---|---|
| Influenza | adult | — | 12 mo | 140, 141, 150, 158, 161, 168, 185, 186, 188, 197, 205 |
| Tdap | adult | — | 120 mo | 115 |
| Pneumococcal | ≥65 or high-risk | asthma/COPD/DM/HF/CKD/CLD | lifetime | 33, 215, 216, 332 |
| Zoster RZV | ≥50 | — | lifetime | 187 |
| COVID-19 | ≥65 | — | 12 mo | 207-302 family |

### Scope decisions

- **CVX matched via `PatientObservation.loincCode` field** in v1. This is the v2-deferrable concession: PatientBundle has no dedicated immunization slot, so CVX-coded observations stand in. A `PatientImmunization` slot is a v2 enhancement.
- **HPV / Hep A / Hep B / MMR / varicella catch-up NOT modeled.** Each has nontrivial demographic/risk-factor logic; deferred.
- **Zoster series completeness NOT modeled.** Any single Shingrix dose satisfies v1.
- **Pregnancy / immunocompromised cadences NOT modeled.**
- **Pneumococcal high-risk ICD set: J45 (asthma), J44 (COPD), E10/E11 (diabetes), I50 (HF), N18 (CKD), K70/K74 (CLD).** ACIP-derived.

### Cross-rule isolation

The "does-not-throw" guard pattern used here (instead of per-fixture finding-count assertion) reflects this rule's behavior: every adult fixture fires at least one finding. Per-fixture finding-count assertions would create dozens of expected-value lines that drift as ACIP cadences update. The unit-test block thoroughly covers cadence, qualifier, and age-gate behavior.

## Consequences

**Positive.** The per-item fan-out shape is now in the engine. Future rules with the same shape (HEDIS PHE statin care for cardiovascular disease has a similar antigen-equivalent expansion, as does diabetes-bundle measures combining multiple deliverables) can adopt this template directly.

The high finding density per patient is the correct clinical signal — an older adult with no immunizations on file should produce a long list. UI work needs to handle a per-`ruleId` finding count >1.

**Negative.** The CVX-via-`loincCode` shim is ugly. It works but conflates two distinct code systems in the same field, increasing the risk of cross-system collision (no current LOINC code overlaps with any CVX code, but the design is fragile). The PatientImmunization slot deserves promotion to v2.

ACIP recommendations change annually. The `lastReviewed: 2026-05-17 / nextReviewDue: 2027-05-17` markers are load-bearing. The COVID-19 CVX list in particular churns rapidly and needs the most attention at next review.

**Operational.** Fixtures 59-61. 72 tests. The 5-finding count assertion on fixture-59 is the canonical "what does AIS-E emit" reference for downstream UI work.

## References

- HEDIS AIS-E: https://www.ncqa.org/hedis/measures/adult-immunization-status/
- ACIP 2026 Adult Schedule: https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-age.html
- Related ADRs: [0017 — control-gap shape](0017-cbp-hypertension-control-rule.md) (sibling subcategory-as-payload pattern)
- Source: [`lib/clinical-engine/rules/ais-e-adult-immunization.ts`](../../lib/clinical-engine/rules/ais-e-adult-immunization.ts)
- Tests: [`lib/clinical-engine/__tests__/ais-e-adult-immunization.test.ts`](../../lib/clinical-engine/__tests__/ais-e-adult-immunization.test.ts)
