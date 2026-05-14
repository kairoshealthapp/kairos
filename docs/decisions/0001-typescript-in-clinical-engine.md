# 0001 — TypeScript in the clinical engine

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

The Kairos clinical engine evaluates structured patient evidence against clinical rules and emits actionable findings (gaps, contraindications, non-evidence-based therapy). Inputs are FHIR R4 resources — `Patient`, `Condition`, `Observation`, `MedicationRequest`, `AllergyIntolerance` — with deeply nested optional fields, multiple coding systems (LOINC, SNOMED, RxNorm, ICD-10), and shapes that vary by EHR (Epic vs. Cerner vs. test fixtures).

A wrong type read against a real chart is not a stack trace — it is a missed gap or a false positive in a clinical recommendation. The cost of an undetected `undefined` slipping into a comparison is meaningfully higher than in a typical web app. Plain JavaScript with hand-written guards repeats the same defensive checks in every rule file and offers no compile-time guarantee that a rule actually handles all the shapes of its inputs.

The rest of Kairos (Next.js surfaces, marketing site, audio pipeline) is plain JavaScript, per the user's global stack preference. TypeScript is a localized exception, not a project-wide migration.

## Decision

The clinical engine (`lib/clinical-engine/`) is written in **TypeScript with strict mode enabled**. The engine-dedicated compiler config is `tsconfig.jest.json` (strict, scoped to `lib/clinical-engine/**`), consumed by a `ts-jest` test setup; the root `tsconfig.json` is the shared Next.js config, not an engine-specific one. Surfaces consuming the engine call into compiled outputs or are themselves typed at the seam.

The rest of the repo remains plain JavaScript. No global migration is implied.

## Consequences

**Positive.** The `Finding`, `PatientBundle`, and rule-input types make the contract between normalizer, rule, and consumer explicit. Compile errors catch most "wrong-shape FHIR" bugs before tests run. The `Finding` type is enforced by the compiler, so a rule cannot emit a structurally malformed finding — though actionable-only output is a discipline enforced at the emit level, not the type level (see [ADR 0004](0004-rule-signature-pure-function.md)).

**Negative.** Engine contributors need familiarity with TypeScript and the FHIR R4 types. Build tooling for the engine is split from the rest of the repo (a dedicated `tsconfig.jest.json` plus `jest.config.js`, separate from the root Next.js `tsconfig.json`). New surfaces that import the engine must accept typed return values or explicitly cast at the boundary.

**Operational.** Adding a new rule requires updating shared types. Removing the engine's TypeScript stance later would require porting rules and tests; it is not a free reversal.
