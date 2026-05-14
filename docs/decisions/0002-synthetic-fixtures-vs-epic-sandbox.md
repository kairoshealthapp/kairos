# 0002 — Synthetic FHIR fixtures vs. Epic sandbox data

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Clinical rules in Kairos must be tested against realistic FHIR R4 bundles. Two sources are available:

1. **Epic on FHIR R4 sandbox** — real-shaped, vendor-validated bundles for a fixed set of test patients.
2. **Hand-authored synthetic fixtures** — JSON bundles written to spec to exercise specific rule branches.

The 2026-05-07 sandbox probe (see [`sandbox-probe-2026-05-07.md`](../sandbox-probe-2026-05-07.md)) walked all candidate patients in the Epic sandbox and identified Warren McGinnis as the single plausible HFrEF case. His chart contained one lab, two `DiagnosticReport` entries from 2019, and one `Encounter` — not enough surface area to exercise the GDMT HFrEF rule's branches (all-gaps, tartrate trap, full-GDMT regression, MRA contraindication on eGFR, beta-blocker contraindication on asthma).

LVEF queries against the sandbox returned `OperationOutcome`, not a numeric observation, so even the rule's primary triggering field could not be exercised end-to-end against a real patient.

## Decision

**Unit tests use hand-authored synthetic FHIR-shaped fixtures.** Five fixtures (`fixture-01` through `fixture-05`) live in `lib/clinical-engine/fixtures/` and are JSON-validated. Each fixture targets a specific rule branch. Real sandbox bundles remain useful for integration probing, surface-level QA, and demos, but are not the source of truth for rule correctness.

## Consequences

**Positive.** Test coverage is deterministic and complete by construction. New rule branches can be exercised by adding a fixture without negotiating sandbox patient state. Rule changes regression-test in under 500ms against 23 tests.

**Negative.** Synthetic fixtures may drift from real-world FHIR shapes — a rule that passes against every fixture can still misread an Epic chart whose `MedicationRequest` uses a coding system, dose form, or text field the fixture authors did not anticipate. Mitigation: every fixture is reviewed for clinical accuracy and FHIR shape conformance before sign-off, and any real-chart bug surfaces a new fixture.

**Operational.** Fixture authorship requires both clinical and FHIR literacy. Brandon (clinical) signs off on each fixture before it is committed.
