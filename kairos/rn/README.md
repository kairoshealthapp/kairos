# RN Surface

Owner: Brandon
Route: /rn, /encounter/[id], /tour
Scope: outpatient cardiology RN basket clearing — synthesis, MyChart, INR, refills, triage, denial cascade follow-through

## Boundaries
- This folder is the RN module. RN-specific UI, fixtures, and workflows live here.
- Cross-folder shared utilities (FHIR adapters, patient header, order schema, auth) live in lib/.
- Do not duplicate clinical reasoning across folders — extract to lib/clinical/ when patterns emerge.
