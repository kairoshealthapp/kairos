# 0019 — COL-E rule: multi-modality screening shape

- **Status:** Accepted
- **Date:** 2026-05-17
- **Index:** [← back to docs index](../INDEX.md)

## Context

Fourteenth rule shipped. Third family-practice rule. HEDIS COL-E backs on USPSTF 2021 colorectal screening: Grade A ages 50-75 (also Grade B for 45-49 added in 2021). The USPSTF accepts any of five modalities with different recency cadences:

- Colonoscopy: 10 years
- FIT/FOBT: 12 months
- Cologuard (sDNA-FIT): 3 years
- Flexible sigmoidoscopy: 5 years
- CT colonography: 5 years

This is the first rule in the engine where the gap is satisfied by ANY of multiple modalities, each with its own recency window. Lp(a) (ADR 0006) accepts multiple LOINC codes for the same test; COL-E accepts entirely different procedures with different cadences.

## Decision

Ship as `col-colorectalScreeningRule` introducing a new rule-shape variant — **#11 Multi-modality screening gap** — documented in `rule-shapes.md`. The shape is defined by:

1. Demographic gate (age band).
2. Set of accepted modalities, each with its own recency window in months.
3. Optional suppression by anatomical-absence ICD (e.g., total colectomy → Z90.49).
4. Fires when no acceptable modality has an in-window record.

### Modality matching strategy (v1)

- **Stool tests** match by LOINC: 29771-3, 14563-1, 57905-2, 14564-9 (FIT/FOBT), 77353-1, 77354-9 (Cologuard).
- **Procedures** match by `display` substring (case-insensitive): "colonoscopy", "sigmoidoscopy", "ct colonography" / "virtual colonoscopy", and bare CPT tokens (45378, 45330, 74263).

CPT-coded procedures in a dedicated `ProcedureBundle` slot are a v2 enhancement. The substring fallback is calibrated to be tolerant of both Epic narrative `display` text and CPT-bearing observation rows.

### Scope decisions

- **Age 45-75.** USPSTF Grade A (50-75) + Grade B (45-49). 76-85 is Grade C (individualize) and OUT OF SCOPE for auto-fire.
- **Total colectomy (Z90.49) suppresses.** Patient has no colon to screen.
- **High-risk hereditary or IBD populations NOT modeled.** They need earlier/more-frequent screening under different society guidance (e.g., USMSTF, AGA).
- **Severity = gap.** Consistent with screening shape.

### Cross-rule co-triggers

Every existing fixture with a patient in the 45-75 age band fires COL-E as a co-trigger because none of those fixtures document a colorectal screening modality. The test suite verifies this programmatically using the same age math the rule uses.

## Consequences

**Positive.** The engine now has a documented multi-modality screening template. Future rules — e.g., cervical cancer screening (multiple cytology/HPV modalities), prostate cancer screening (PSA + DRE) — can reuse this shape's structural template directly.

**Negative.** The display-substring fallback is a soft heuristic. If a chart uses non-standard procedure narration (e.g., "scope of large bowel"), the modality match fails and the patient incorrectly fires the screening gap. Documented as a v2 follow-up; real-chart calibration needed.

The age-band co-trigger volume is substantial — most adult fixtures fire COL-E. This is correct clinical signal (the fixtures genuinely lack screening documentation) but increases the per-patient finding count in demo scenarios. Demo fixtures may need synthetic colonoscopy observations added.

**Operational.** Fixtures 49-52. 64 tests including programmatic age-band sweep of all existing fixtures.

## References

- HEDIS COL-E: https://www.ncqa.org/hedis/measures/colorectal-cancer-screening/
- [USPSTF 2021 Colorectal Cancer Screening (Davidson et al, JAMA)](https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/colorectal-cancer-screening)
- LOINC: [29771-3 FIT](https://loinc.org/29771-3), [77353-1 Cologuard](https://loinc.org/77353-1)
- Related ADRs: [0006 — Lp(a) multi-code LOINC pattern](0006-lpa-screening-rule.md) (sibling pattern; COL-E extends it to multi-modality)
- Source: [`lib/clinical-engine/rules/col-e-colorectal-screening.ts`](../../lib/clinical-engine/rules/col-e-colorectal-screening.ts)
- Tests: [`lib/clinical-engine/__tests__/col-e-colorectal-screening.test.ts`](../../lib/clinical-engine/__tests__/col-e-colorectal-screening.test.ts)
