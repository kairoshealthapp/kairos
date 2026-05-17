# 0020 — BCS-E rule: women 40-74, biennial mammography, USPSTF 2024 update

- **Status:** Accepted
- **Date:** 2026-05-17
- **Index:** [← back to docs index](../INDEX.md)

## Context

Fifteenth rule shipped. Fourth and final family-practice rule. HEDIS BCS-E backs on USPSTF 2024 Breast Cancer Screening, which formally lowered the screening starting age to 40 (was 50) and codified biennial cadence across the 40-74 band, Grade B.

The clinical change from prior US convention is meaningful: ~6 million additional women aged 40-49 now fall inside the auto-screen population under HEDIS BCS-E.

Structurally this rule is shape #11 (multi-modality screening) with a singleton-modality (mammography family). Reuses the modality-window mechanism introduced in ADR 0019 for COL-E with a 24-month window.

## Decision

Ship as `bcsBreastScreeningRule`. Population: women age 40-74. Recency window 24 months. Modality: mammography family by LOINC (24604-1, 24606-6, plus aliases) OR display substring ("mammogram", "mammography", CPT 77065/77066/77067).

### Scope decisions

- **Sex match by `PatientDemographics.sex === 'female'`** (lowercased). Patients with undefined/non-female sex emit zero findings — safer default that avoids erroneously firing on patients whose sex was unrecorded.
- **Bilateral mastectomy (Z90.13) suppresses.** Unilateral mastectomy does NOT suppress — contralateral breast still needs screening.
- **Age 75+ NOT auto-fired.** USPSTF grades 75+ as Grade I (insufficient evidence).
- **Dense-breast MRI supplementation NOT modeled.** Separate clinical pathway; deferred.
- **High-risk hereditary populations (BRCA1/2 carriers, prior thoracic XRT) OUT OF SCOPE for v1.** They need earlier and MRI-based screening under different guidance.

### Cross-rule co-triggers

Existing fixtures with female patients in the 40-74 band fire BCS-E as co-triggers. Verified programmatically using the rule's same age math.

## Consequences

**Positive.** Family-practice surface of the engine now covers the four canonical adult primary-care quality measures: HTN control (CBP), diabetes control (GSD), CRC screening (COL-E), breast cancer screening (BCS-E). These four are the most heavily-reported HEDIS measures in commercial primary care.

**Negative.** The sex gate is brittle. A patient whose `sex` field is set to 'F' (instead of 'female') will not fire the rule; this is a parser concern, not a rule concern. The `normalize.ts` layer can be extended to canonicalize sex values in a future ADR if real FHIR streams reveal sex-value diversity beyond the case-insensitive 'female' assumption.

**Operational.** Fixtures 53-55. 66 tests including programmatic sex+age sweep of all existing fixtures.

## References

- HEDIS BCS-E: https://www.ncqa.org/hedis/measures/breast-cancer-screening/
- [USPSTF 2024 Breast Cancer Screening (Nicholson et al, JAMA)](https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening)
- LOINC: [24604-1 MG Breast Screening](https://loinc.org/24604-1)
- Related ADRs: [0019 — COL-E multi-modality screening pattern](0019-col-e-colorectal-screening-rule.md) (sibling shape; BCS-E specializes to singleton modality)
- Source: [`lib/clinical-engine/rules/bcs-e-breast-screening.ts`](../../lib/clinical-engine/rules/bcs-e-breast-screening.ts)
- Tests: [`lib/clinical-engine/__tests__/bcs-e-breast-screening.test.ts`](../../lib/clinical-engine/__tests__/bcs-e-breast-screening.test.ts)
