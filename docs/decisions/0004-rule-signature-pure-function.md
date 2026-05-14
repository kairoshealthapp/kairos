# 0004 — Rule signature is a pure function

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Clinical rules in Kairos must be auditable, testable, and reasoning-chain preservable. The architectural primitive (see [`KAIROS-CONTEXT.md`](../KAIROS-CONTEXT.md), "THE ARCHITECTURAL PRIMITIVE") requires that every output artifact be regeneratable against accumulated evidence with prior reasoning preserved. A rule that reads global state, mutates inputs, calls the network, or depends on wall-clock time cannot satisfy that requirement and cannot be unit-tested against deterministic fixtures.

Several reasonable-sounding alternatives — rules as classes with internal state, rules that fetch their own RxNorm or LOINC lookups at run time, rules that emit side effects (logs, writes, telemetry) — all break this primitive in subtle ways. They also make the rule layer untestable without mocking infrastructure, which the project's testing stance explicitly avoids.

## Decision

Every clinical rule is a **pure function** with the signature:

```ts
(bundle: PatientBundle) => Finding[]
```

Concretely: a single function takes a normalized FHIR bundle and returns an array of actionable findings. No I/O, no logging, no shared mutable state, no time-of-day dependence. Knowledge inputs (RxCUI allow-lists, LOINC codes, contraindication thresholds) are module-level constants, not run-time lookups.

Rules emit **actionable findings only** — a rule does not emit a finding merely to confirm a pillar is already satisfied. This narrowing is enforced at the *emit* level, not the type level: commit `b241e86` removed the `status: 'present'` emit from `gdmt-hfref.ts`, and no rule since has emitted a non-actionable finding. The `FindingStatus` union in `types.ts` still includes `present` and `manual-review` alongside the actionable values (`missing`, `contraindicated`, `non-evidence-based`, `interaction`) — the discipline lives in the rules, not the type. (Note `gap` is a `FindingSeverity`, not a `FindingStatus`.)

## Consequences

**Positive.** Rules are trivially unit-testable against synthetic fixtures (23 tests in under 500ms). The signature is the contract — any consumer (surface, audit trail, regression harness) can call any rule the same way. Reasoning chain replay is straightforward: re-run the rule against the bundle at version N.

**Negative.** Rules cannot reach out for fresh knowledge at run time. RxCUI drift, LOINC additions, and guideline updates all require a code change and a redeploy — not a config refresh. Mitigated by the [`rxnorm-verification`](../rxnorm-verification-2026-05-13.md) pattern: knowledge tables are verified on a cadence and updated by PR with clinical sign-off.

**Operational.** UI-level needs for "patient is already on X" status are not findings and must not be emitted from rules. See the Session 25 forward note: pillar confirmations belong on a separate `confirmations` field if surfaced at all.
