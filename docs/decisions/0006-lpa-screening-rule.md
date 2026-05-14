# 0006 — Lp(a) universal screening as first Phase 2 rule

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Phase 1 shipped one rule: GDMT for HFrEF (ADR 0004, ADR 0003). Phase 2 expands the rule portfolio. The choice of which rule to ship next is not arbitrary — it shapes the demo story, the differentiation argument vs. HVC, and the engineering precedents that subsequent rules will inherit.

Three forces pointed at Lp(a) universal screening:

1. **Guideline recency.** The 2026 ACC/AHA/Multisociety Dyslipidemia Guideline (Circulation, 2026-03-13, DOI [10.1161/CIR.0000000000001423](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423)) issued the first Class I universal Lp(a) screening recommendation in any US guideline. Two months old at ship.
2. **Portfolio differentiation.** Every "clinical AI" demo shows GDMT or anticoagulation. Lp(a) screening is current-edge cardiology that HVC and similar tools do not surface. It moves Kairos's pitch from "HF tooling" to "guideline-current cardiology engine."
3. **Bellwether practice.** A bellwether outpatient cardiology practice is already ordering Lp(a) on every adult patient per the new guideline.

Beyond *why this rule*, two engineering precedents need adjudication.

**Multi-code LOINC support.** US labs report Lp(a) under two LOINC codes: 10835-7 (mass, mg/dL) and 43583-4 (moles, nmol/L). The 2026 guideline references both unit systems. The GDMT HFrEF rule (today) uses a single-code shortcut for each lab — eGFR is matched on 33914-3 only — which is a known limitation flagged for a future ADR. Lp(a) cannot use the same shortcut: in practice both codes appear in real charts depending on the assay platform, and selecting one would silently miss the other.

**Rule shape: screening-gap vs. threshold.** A screening-gap rule fires when no observation exists, regardless of value. A threshold rule fires when an observation exists but the value crosses a clinical inflection point. The 2026 guideline supports both for Lp(a) — universal screening (Class I) and elevated-Lp(a) management (≥125 nmol/L / ≥50 mg/dL inflection, ≥250 nmol/L / ≥100 mg/dL high-risk). Conflating them in one rule muddies the Finding output and tangles two independent clinical actions.

**Adult age threshold.** The guideline wording is "at least once in adulthood" with no explicit numeric start age. The lipid-panel cadence elsewhere in the guideline starts at age 19. Pediatric Lp(a) screening has separate considerations and is out of scope for this rule.

**Once-in-lifetime semantics.** The guideline states repeat testing is generally unnecessary because Lp(a) is genetically determined and stable. This is a different temporal pattern from "recent eGFR" (rolling) or "active medication" (current). It implies a lifetime-history bundle scan, not a recency filter.

## Decision

The first Phase 2 rule is **Lp(a) universal screening gap detection**, shipped at `lib/clinical-engine/rules/lp-a-screening.ts` and exported from the engine barrel as `lpaScreeningRule`.

- **Multi-code LOINC support is introduced.** The rule matches any observation whose `loincCode` is in `LPA_LOINC_CODES = ['10835-7', '43583-4']`. This is the first rule in the engine with multi-code lab matching. The GDMT HFrEF rule's single-code eGFR shortcut remains in place for Phase 1 fidelity and will be revisited in a future ADR (cf. RxNorm verification work, 2026-05-13).
- **Screening-gap shape only.** This rule emits exactly one Finding type: a gap when no Lp(a) observation exists in the patient's lifetime bundle. It does **not** examine the observation value. Threshold logic for elevated Lp(a) is deferred to a future, separate rule.
- **Adult age threshold = 18.** Sourced from the US adult convention; the guideline wording "in adulthood" does not pin a numeric age. Documented in the rule banner. If a future clinical review prefers 19 or 20, change `LPA_ADULT_AGE_THRESHOLD` in one place.
- **Lifetime bundle scan.** No recency filter. Once Lp(a) is on the chart at any prior date, the gap is satisfied permanently — matching the guideline's once-in-lifetime semantics.
- **Pediatric and unknown-DOB patients are out of scope.** The rule emits zero Findings for those cases.

LOE for the Class I recommendation could not be pinned to the primary Circulation PDF this session (paywall, HTTP 403). Class I is consistent across all secondary summaries. The rule banner notes LOE as "to be confirmed at next review" — the `nextReviewDue: 2027-05-13` marker is the gate.

## Consequences

**Positive.** Kairos now demonstrates currency on a Class I recommendation released two months prior to ship. The multi-code LOINC pattern is now in the engine and is the precedent the next rule will inherit. The screening-gap shape is reusable across other "ordered-once-in-lifetime" recommendations (e.g., AAA screening, one-time vaccinations).

**Negative.** Two rules now use different lab-matching strategies (multi-code for Lp(a), single-code shortcut for GDMT eGFR). This is intentional but creates a transient inconsistency. The GDMT eGFR shortcut should be lifted before any third lab-touching rule ships — otherwise the inconsistency calcifies. Tracked as a follow-up.

**Operational.** Fixtures 06–08 are dedicated to Lp(a) rule exercise rather than retrofitting fixtures 01–05. Existing HFrEF fixtures would otherwise all trip the Lp(a) gap as a side effect (all are adults with no Lp(a) on file), and rewriting their `observations` arrays would distort the GDMT test semantics. The two rule suites stay clean by living on disjoint fixture sets.

## References

- [2026 ACC/AHA Dyslipidemia Guideline (Circulation, DOI 10.1161/CIR.0000000000001423)](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423)
- [ACC press release, 2026-03-13](https://www.acc.org/latest-in-cardiology/journal-scans/2026/03/13/15/20/acc-aha-release-new-clinical-guideline-for-managing-dyslipidemia)
- LOINC: [10835-7 (mass)](https://loinc.org/10835-7), [43583-4 (moles)](https://loinc.org/43583-4)
- Related ADRs: [0004 — rule signature](0004-rule-signature-pure-function.md), [0005 — three knowledge layers](0005-three-knowledge-layer-architecture.md)
- Source: [`lib/clinical-engine/rules/lp-a-screening.ts`](../../lib/clinical-engine/rules/lp-a-screening.ts)
- Tests: [`lib/clinical-engine/__tests__/lp-a-screening.test.ts`](../../lib/clinical-engine/__tests__/lp-a-screening.test.ts)
