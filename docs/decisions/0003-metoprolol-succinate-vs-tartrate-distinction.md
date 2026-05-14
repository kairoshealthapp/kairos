# 0003 — Metoprolol succinate vs. tartrate distinction

- **Status:** Accepted
- **Date:** 2026-05-13
- **Index:** [← back to docs index](../INDEX.md)

## Context

GDMT for HFrEF specifies three evidence-based beta-blockers: **metoprolol succinate (extended-release)**, **carvedilol**, and **bisoprolol**. Metoprolol **tartrate** — the immediate-release salt — is not GDMT for HFrEF. The two salts are routinely conflated in charts: same generic name "metoprolol," different RxCUIs, different indications, different evidence base in heart failure.

A patient on metoprolol tartrate for hypertension or rate control should be flagged by the GDMT rule as a gap in beta-blocker GDMT — not as "already on a beta-blocker, no action." A rule that matches on the string `"metoprolol"` or on a shared ingredient code will silently miss this gap.

This is the so-called "tartrate trap" and is the entire reason `fixture-02` exists in the test suite.

## Decision

The GDMT HFrEF rule matches beta-blockers at the **clinical drug / salt level**, not at the ingredient level. The `betaBlocker` pillar lists exactly three RxCUIs: metoprolol succinate, carvedilol, bisoprolol. Metoprolol tartrate is intentionally absent from the allow-list. A patient on tartrate-only fires a `gap` finding for beta-blocker GDMT.

The same principle applies to other pillars where salt or dose form changes clinical meaning, even though for ACEi/ARB/ARNi and MRA the distinction is less load-bearing today.

## Consequences

**Positive.** The rule reflects guideline-grade clinical accuracy: tartrate ≠ succinate for HFrEF. The `fixture-02` ("tartrate trap") regression guard catches any future change that would collapse the two salts.

**Negative.** Future RxCUI maintenance must preserve salt-level discrimination. The `lib/clinical-engine/rules/gdmt-hfref.ts` allow-list cannot be naively regenerated from an ingredient lookup. The pending RxNorm verification pass (see [`rxnorm-verification-2026-05-13.md`](../rxnorm-verification-2026-05-13.md)) explicitly leaves resolution of ingredient-vs-clinical-drug RxCUIs to human review for this reason.

**Operational.** Any future change to the beta-blocker allow-list requires a clinician sign-off, not just an RxNorm lookup.
