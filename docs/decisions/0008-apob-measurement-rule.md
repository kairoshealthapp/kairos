# 0008 — ApoB measurement as the first conditional-population screening rule

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

Fourth rule shipped in the Kairos clinical engine. Before this rule the engine had three shapes:

1. **Therapy gap** ([ADR 0004](0004-rule-signature-pure-function.md), GDMT HFrEF) — patient missing a recommended drug.
2. **Universal screening gap** ([ADR 0006](0006-lpa-screening-rule.md), Lp(a)) — all adults missing a recommended lab.
3. **Drug-condition interaction** ([ADR 0007](0007-nsaid-hf-interaction-rule.md), NSAID-HF) — active prescription that should be withdrawn.

ApoB was originally proposed as a Lp(a)-style universal screening rule. Reading the 2026 ACC/AHA Dyslipidemia Guideline showed the recommendation is structurally different: ApoB is **selective**, conditional on the patient meeting a qualifying risk profile. From the AHA press release framing:

> "Measuring apoB may be used to assess any residual ASCVD risk and guide treatment among people with **cardiovascular-kidney-metabolic syndrome, Type 2 diabetes, high triglycerides or known cardiovascular disease who have reached their LDL-C and non-HDL-C goals**."

And from the JACC-at-a-glance summary:

> "ApoB testing can be useful to improve risk assessment and guide therapy **once LDL-C and non-HDL-C goals are met**, particularly in those with elevated triglycerides (>200 mg/dL), diabetes, or low achieved LDL-C (<70 mg/dL)."

That is not a universal screening recommendation. The verb tense ("may be used", "can be useful") is also consistent with a Class IIa or similar — not Class I like Lp(a).

The decision Brandon adjudicated mid-session: reshape the rule as a **conditional-population screening gap** and introduce this as a new fourth rule shape. Don't broaden ApoB beyond what the guideline supports.

## Decision

The fourth rule is shipped at [`lib/clinical-engine/rules/apo-b-measurement.ts`](../../lib/clinical-engine/rules/apo-b-measurement.ts) as a **conditional-population screening-gap** rule.

A finding fires when **all** of the following hold:

1. Patient age ≥ 18.
2. No ApoB observation in the lifetime bundle (LOINC `1884-6`, multi-code-ready via `APOB_LOINC_CODES`).
3. Patient meets **at least one** qualifying condition:
   - Diabetes (ICD-10 prefix `E10` or `E11`).
   - Established ASCVD (ICD-10 prefix `I20`–`I25`, `I63`, or `I70`).
   - Most recent LDL-C measurement < 70 mg/dL (achieved-goal proxy). LDL codes `13457-7` and `18262-6` both scanned.
   - Most recent triglyceride measurement > 200 mg/dL (LOINC `2571-8`).

If any of those three gates fails, the rule emits nothing. One Finding per patient, summarising every triggered qualifier in the `summary` string.

### Why this shape is distinct from universal screening

The Lp(a) rule fires on **every adult** with no Lp(a) on file. If applied to a generic-population fixture (no diabetes, no ASCVD, no labs out of band), Lp(a) fires; ApoB does not. The two rules differ structurally:

- **Universal screening**: gate on age only. Fixture realism = "is this person an adult?"
- **Conditional-population screening**: gate on age + a clinical qualifier that justifies the test in this patient. Fixture realism = "is this person in the subset the guideline targets?"

Future rules sourced from "may be useful in" or "can be considered in" guideline language belong in this category and should reuse the qualifier-set pattern established here.

### CKM (cardiovascular-kidney-metabolic) syndrome — deferred

The 2026 guideline cites CKM syndrome as one of the qualifying populations. CKM has no dedicated ICD-10 code as of 2026-05-13; the AHA 2023 framework that defined CKM staging relies on composite-code identification across cardiovascular (I20-I25, I50, I70-I74), renal (N17-N19), and metabolic (E11, E13, E65, E66, E78, R73.0) prefixes plus staging logic.

For v1 we **do not** implement a CKM-specific qualifier path. Most CKM patients qualify indirectly through the diabetes path. Adding CKM-specific logic requires staging semantics that are out of scope here; tracked in `guideline-watch.md`.

### Class / LOE caveat

Primary Circulation PDF returned HTTP 403 again this session (same as Session 36). Class and LOE are not pinned from primary text. Secondary sources consistently describe the recommendation with "may be used" / "can be useful" — pattern-consistent with Class IIa. The rule banner documents this and the `nextReviewDue: 2027-05-13` marker is the gate for revisiting.

## Consequences

**Positive.** A fourth rule shape — conditional-population screening — is now in the engine vocabulary. The qualifier-set evaluator (`evaluateQualifiers`) is a reusable pattern for other "selective measurement" recommendations. The decision to refuse the original universal-screening framing protects the citation-fidelity discipline established in Sessions 36 and 37.

The cross-rule isolation pattern from [ADR 0007](0007-nsaid-hf-interaction-rule.md) is reaffirmed and now spans four rules: fixtures 01–10 are explicitly exercised against `apoBMeasurementRule` to verify zero false fires. Going forward, every new rule should include this sweep so unintended interactions surface immediately.

**Negative.** Multi-code LOINC support is reused from [ADR 0006](0006-lpa-screening-rule.md) but the GDMT eGFR single-code shortcut was still in place when this rule landed. The eGFR shortcut is lifted in the same session as a cleanup (`EGFR_LOINC_CODES = ['33914-3', '88293-6', '98979-8']`). Going forward, multi-code is the default for lab matching.

The "most recent" semantics on LDL and TG observations means a single old elevated/low value cannot trigger the rule if a more recent normal value supersedes it. This matches how clinicians read trends, but it is a deliberate design choice — different from Lp(a)'s lifetime-scan suppression. Documented in the rule banner.

**Operational.** Four new fixtures (11–14) dedicated to this rule. Fixture 12 (prior MI + at-goal LDL on atorvastatin) demonstrates the dual-qualifier case. Fixtures 01–10 verified to emit zero ApoB findings via the cross-rule isolation suite.

## References

- [2026 ACC/AHA Dyslipidemia Guideline (Circulation, DOI 10.1161/CIR.0000000000001423)](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423)
- [ACC press release, 2026-03-13](https://www.acc.org/about-acc/press-releases/2026/03/13/18/01/accaha-issue-updated-guideline-for-managing-lipids-cholesterol)
- [HCPLive — Lp(a) and ApoB in the 2026 Guideline](https://www.hcplive.com/view/expert-insights-lp-a-and-apob-in-the-2026-dyslipidemia-guidelines)
- [LOINC 1884-6 — ApoB serum/plasma mass](https://loinc.org/1884-6)
- Related ADRs: [0006 — Lp(a) screening](0006-lpa-screening-rule.md), [0007 — NSAID-HF interaction](0007-nsaid-hf-interaction-rule.md)
- Source: [`lib/clinical-engine/rules/apo-b-measurement.ts`](../../lib/clinical-engine/rules/apo-b-measurement.ts)
- Tests: [`lib/clinical-engine/__tests__/apo-b-measurement.test.ts`](../../lib/clinical-engine/__tests__/apo-b-measurement.test.ts)
