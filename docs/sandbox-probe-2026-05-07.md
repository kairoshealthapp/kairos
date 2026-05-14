# Epic FHIR R4 sandbox probe — 2026-05-07

> [← Index](INDEX.md) · Last updated: 2026-05-07 · Results of the one-off Epic FHIR R4 sandbox probe for HFrEF candidate patients.

One-off probe (`node scripts/sandbox-probe.js`) ran end-to-end against
`https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4`. Backend Services JWT
auth (RS384, kid `clinai-key-1`, client `a85de553-…`) succeeded and returned a
1-hour access token with the full `system/*.read` scope set we expected.

## Phase 1 GDMT candidate

**Warren James McGinnis III — `e0w0LEDCYtfckT6N.CkJKCw3`** is the only sandbox
patient with cardiac history on the problem list. He carries `ICD-10 I25.2 Old
myocardial infarction` and `ICD-10 I51.9 Heart disease, unspecified`, both with
parallel SNOMED codings (`399211009`, `56265001`). He is the closest analogue to
an HFrEF patient available in the sandbox set, even though he is not coded with
`I50.x` and has no LVEF observation.

## Probe answers to the three open questions

1. **LVEF storage shape** — Inconclusive in this sandbox. Every
   `Observation?code=loinc|10230-1` and `loinc|8806-2` query returned a Bundle
   with `total=0` and a single `OperationOutcome` warning. There is no real LVEF
   `Observation` resource on any of the 5 accessible patients. Warren has 2
   `DiagnosticReport`s in the cardiology category (`Stress test`, `Cholesterol,
   total` from 2019-05-28) but no `presentedForm` PDF and no LVEF in narrative
   form. **Implication for Phase 1:** the GDMT-gap rule must operate on
   synthetic / hand-curated LVEF data; a sandbox-grounded LVEF input does not
   exist. Plan to support both `Observation.valueQuantity` and
   `DiagnosticReport.conclusion` text scraping when we move past sandbox.

2. **Heart failure coding** — Not present. No I50.x and no SNOMED HF code
   (84114007 / 42343007 / 703272007 / 85232009) appears on any of the 5
   accessible patients. The closest cardiac coding seen was Warren's I25.2 / I51.9.
   **Implication:** the HF detection rule cannot be exercised against the
   sandbox; we will need to graft a synthetic I50.32 condition onto the Warren
   fixture (or a derived fixture) for Phase 1 development.

3. **MedicationRequest.status='active'** — Returns clean: only the
   `MedicationRequest` resource type, no stale/completed entries mixed in. The
   only OperationOutcome entries we saw were warnings, never additional med
   resources. Counts on accessible patients: Camila 1, Derrick 0, Desiree 0,
   "Elijah Pendrelle" (actually Linda Jane Ross, see footnote) 1, Warren **0**.
   **Implication:** the `status=active` filter is reliable, but the sandbox is
   too sparse to exercise GDMT med-class detection — none of the 5 accessible
   patients carry an ACEi/ARB/ARNI/BB/MRA/SGLT2i. We will need a synthetic
   medication list for the Phase 1 fixture.

## Per-patient summary

| Sandbox name           | FHIR ID                         | Resolved name           | HF (I50/SNOMED) | Cardiac history (I20–I25/I51)                  | Active meds | LVEF Obs | Allergies |
| ---------------------- | ------------------------------- | ----------------------- | --------------- | ---------------------------------------------- | ----------- | -------- | --------- |
| Camila Lopez           | `erXuFYUfucBZaryVksYEcMg3`      | Camila Maria Lopez      | 0               | —                                              | 1           | 0        | 1         |
| Derrick Lin            | `eq081-VQEgP8drUUqCWzHfw3`      | Derrick Lin             | 0               | —                                              | 0           | 0        | 1         |
| Desiree Lambridge         | `eAB3mDIBBcyUKviyzrxsnAw3`      | Desiree Caroline Lambridge | 0               | —                                              | 0           | 0        | 1         |
| Elijah Pendrelle (mislabeled) | `eIXesllypH3M9tAA5WdJftQ3`   | **Dr. Linda Jane Ross** | 0               | —                                              | 1           | 0        | 1         |
| Linda Ross             | `eIH9a6H4v6tlBwy0t8QrxSA3`      | —                       | —               | —                                              | —           | —        | —         |
| Olivia Roberts         | `eq3p3kmtns1Bo4eAitJSOhg3`      | —                       | —               | —                                              | —           | —        | —         |
| **Warren McGinnis**    | `e0w0LEDCYtfckT6N.CkJKCw3`      | Warren James McGinnis III | 0             | **I25.2 Old MI; I51.9 Heart disease, unspecified** | 0           | 0        | 2         |

Two of the seven candidate IDs returned 404 (`Linda Ross`, `Olivia Roberts`).
The ID listed for "Elijah Pendrelle" actually resolves to a patient named
`Dr. Linda Jane Ross` — the name→ID map in the task brief is stale for that row.

## Console output

```
=== Epic FHIR R4 sandbox probe — Kairos Phase 1 ===
Run at: 2026-05-08T02:01:08.570Z
Endpoint: https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4

client_id: a85de553-5013-47e8-9f3b-f3c797176f81

[1/3] Exchanging JWT for access token…
  ✓ access_token acquired (expires_in=3600s, scope=system/AllergyIntolerance.read system/CarePlan.read system/Condition.read system/Coverage.read system/DiagnosticReport.read system/DocumentReference.read system/DocumentReference.write system/Encounter.read system/Immunization.read system/MedicationRequest.read system/Observation.read system/Patient.read system/Procedure.read system/ServiceRequest.read)
  ✓ token_type=Bearer, expires_at≈2026-05-08T03:01:08.996Z

[2/3] Probing 7 patients…

  PATIENT Camila Maria Lopez erXuFYUfucBZaryVksYEcMg3: HF_conditions=0 (codes: []), active_meds=1, LVEF_observations=0, allergies=1
  PATIENT Derrick Lin eq081-VQEgP8drUUqCWzHfw3: HF_conditions=0 (codes: []), active_meds=0, LVEF_observations=0, allergies=1
  PATIENT Desiree Caroline Lambridge eAB3mDIBBcyUKviyzrxsnAw3: HF_conditions=0 (codes: []), active_meds=0, LVEF_observations=0, allergies=1
  PATIENT Linda Jane Ross eIXesllypH3M9tAA5WdJftQ3: HF_conditions=0 (codes: []), active_meds=1, LVEF_observations=0, allergies=1
  SKIP Linda Ross (eIH9a6H4v6tlBwy0t8QrxSA3): Patient 404
  SKIP Olivia Roberts (eq3p3kmtns1Bo4eAitJSOhg3): Patient 404
  PATIENT Warren James McGinnis e0w0LEDCYtfckT6N.CkJKCw3: HF_conditions=0 (codes: []), active_meds=0, LVEF_observations=0, allergies=2 cardiac_hx=[ICD10:I25.2 (Old myocardial infarction); ICD10:I51.9 (Heart disease, unspecified)]

[3/3] Wrote fixtures to C:\Users\kents\kairos\scripts\fixtures
Done. 5/7 patients accessible.
```

## Artifacts

- `scripts/sandbox-probe.js` — the probe (gitignored fixtures, no creds in repo).
- `scripts/fixtures/sandbox-{camila,derrick,desiree,elijah,warren}.json` —
  full raw FHIR bundles per patient, gitignored. Use `sandbox-warren.json` as
  the seed for the hand-curated Phase 1 GDMT fixture.
