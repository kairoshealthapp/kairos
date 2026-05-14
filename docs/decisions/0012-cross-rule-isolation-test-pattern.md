# 0012 — Cross-rule isolation testing as a regression-control pattern

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

By the close of Session 40, the Kairos clinical engine had seven rules and 27 fixtures. Each rule had been written with explicit awareness of the fixtures shipped before it. The risk that a new rule silently misclassified a fixture meant for an earlier rule had been controlled informally — one test suite at a time, by the rule author manually running the new rule against prior fixtures during implementation.

That informal control held through seven rules but is not durable as the engine grows. With seven rules × 27 fixtures = 189 rule-fixture pairs to think about, the cost of mentally re-checking each on every new rule is high. Worse, the failure mode is silent: a misclassification that yields the same `findings.length === 0` for the wrong reason as the right one will not surface in any individual rule's own test suite.

By the third rule (NSAID-HF, Session 37) a convention had emerged: every new rule's test file includes a `describe('cross-rule isolation — fixtures 01-N do not fire …')` block that iterates over every prior fixture and asserts the new rule emits zero findings (or, where a fixture intentionally co-triggers, asserts the specific expected count). Sessions 36, 37, 38, and now 40 each added rules that followed this convention.

The pattern needs to be made explicit rather than left as informal precedent. New rules should inherit it by reading this ADR, not by reading the prior rule's test file and copying the structure.

## Decision

**Every new rule's test file MUST include a cross-rule isolation block** that exercises the new rule against every existing fixture in `lib/clinical-engine/fixtures/`. The block must:

1. Enumerate every fixture file explicitly by name (no glob iteration — explicit names protect against new fixtures being silently included without thought).
2. For each fixture, assert the expected finding count from the new rule. The expected count is almost always zero (cross-rule isolation = "this fixture is not meant to trigger this rule"). When a fixture intentionally co-triggers a new rule (e.g., fixture-11 T2DM patient triggers both the ApoB rule and the statin diabetes path), the test should assert the specific expected count and include a one-line comment explaining the intentional co-trigger.
3. Live in a clearly labeled `describe` block: `cross-rule isolation — fixtures 01-N do not fire <rule-name> findings`.

When a fixture is added for a new rule, the new rule's tests must verify the new rule's expected findings (positive cases). The cross-rule isolation block for **prior rules** is not retroactively required to add the new fixture — by the time a new fixture lands, the new rule's own tests have already verified its behavior against the new fixture, and the prior rules' isolation blocks would only be re-tested if someone modified one of those rules. The convention is forward-looking: each new rule must verify it does not false-fire on prior fixtures.

The decision sets a hard expectation: a new rule whose test file lacks the cross-rule isolation block is incomplete and should not be merged.

## Consequences

**Positive.** Silent cross-rule misclassification surfaces immediately when the new rule is added to the suite. The total cost is small per rule (5–20 test cases that each run in microseconds) and grows linearly with rule count. The pattern is easy to inherit from the prior rule's test file as a copy-paste-then-extend structure.

When a fixture is *modified* (rare; once per session at most), every rule's isolation block that includes that fixture will re-run and either still pass or fail loudly. Failure means either (a) the fixture modification introduced an unintentional cross-rule trigger, or (b) the modification revealed a real false-positive that was always there. Both are useful signals; failure mode is loud rather than silent.

**Negative.** The fixture enumeration is hand-maintained and grows linearly. A future engine refactor could move to a registry-based fixture discovery, but the explicit enumeration is more readable and protects against newly-added fixtures being included before they've been thought about. Tradeoff accepted.

The test runtime increases linearly with rule_count × fixture_count. As of Session 40 the full suite runs in ~1 second; this is not yet a problem and the explicit-enumeration discipline guards against accidental glob-based blowup.

A rare edge case: a fixture that *intentionally* co-triggers multiple rules (because the patient is realistically multi-problem) requires the isolation block to assert a non-zero count and explain why. The explanation belongs as a code comment, not just a passing test. Test files in this engine have moved toward "show your work" — comments explain the clinical scenario for any non-trivial expected count.

**Operational.** This ADR is being written after seven rules have shipped, so no retroactive changes are needed — every existing rule already follows the pattern. The decision codifies the convention so the eighth rule's author finds the rule in writing rather than by reading rule #7's tests and inferring it.

## References

- Example isolation blocks: [`apo-b-measurement.test.ts`](../../lib/clinical-engine/__tests__/apo-b-measurement.test.ts), [`statin-initiation.test.ts`](../../lib/clinical-engine/__tests__/statin-initiation.test.ts), [`afib-anticoagulation.test.ts`](../../lib/clinical-engine/__tests__/afib-anticoagulation.test.ts), [`hfpef-sglt2i.test.ts`](../../lib/clinical-engine/__tests__/hfpef-sglt2i.test.ts)
- Related ADRs: [0002](0002-synthetic-fixtures-vs-epic-sandbox.md), [0004](0004-rule-signature-pure-function.md)
- Rule-shapes inventory: [`rule-shapes.md`](../rule-shapes.md)
