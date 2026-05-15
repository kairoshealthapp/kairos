# Kairos

A clinical workflow architecture with a deterministic rules engine running against FHIR-shaped patient data — built to demonstrate a defensible design for safety-critical clinical decision support.

Kairos is a **design-stage prototype**. It runs on synthetic clinical data and published clinical guidelines. It is not deployed in any clinical setting, not connected to real patient data, and not connected to any real Epic instance.

---

## The architecture

The central design decision in Kairos: **clinical rules live in code, never in LLM prompts.**

Every clinical recommendation the engine produces comes from a deterministic, unit-tested TypeScript function with the signature `(bundle: PatientBundle) => Finding[]`. No I/O, no async, no side effects, no model call. Given the same chart, a rule returns the same findings every time. The clinical logic — which drug classes are indicated for heart failure with reduced ejection fraction, what CHA₂DS₂-VASc threshold gates anticoagulation, when an MI is recent enough to still demand a beta-blocker — is auditable source code reviewed against primary-source guideline text.

This matters because the obvious alternative fails in the ways that are hardest to catch. An LLM asked to read a chart and surface care gaps will omit findings non-deterministically, will occasionally invent a threshold or misremember a drug class, and will give a different answer on the same chart twice. For low-stakes summarization that is tolerable. For clinical decision support it is not: the failure mode is a missed gap that looks exactly like a clean chart, and there is no test you can write against a prompt to prove it won't happen.

Kairos keeps the language model strictly out of the safety path. The deterministic engine decides *what is true about the chart*. A model may, separately, polish prose for human readability — and even there, citation enforcement constrains it to the engine's findings. The model never decides what to surface, never gates a recommendation, and never authors a chart entry. **Every chart commit is human-authorized.** The architecture is: a deterministic engine surfaces findings, a model may make them readable, and a human decides what enters the record.

---

## The clinical engine — current state

The engine ships **11 deterministic clinical rules** spanning heart failure and coronary care, arrhythmia, dyslipidemia, and endocrine/metabolic care. Each rule is sourced from a specific recommendation in a published clinical guideline, with the citation, DOI, publication date, verbatim recommendation text, and Class/Level-of-Evidence pinned in a banner block at the top of the rule file. Every clinical detail is verified against primary-source guideline text before the rule ships.

**431 unit tests, all passing** (11 test suites).

### Rules

**Heart failure & coronary care**
- `gdmt-hfref` — guideline-directed medical therapy gaps across the four HFrEF pillars (ACEi/ARB/ARNi, beta-blocker, MRA, SGLT2i)
- `hfpef-sglt2i` — SGLT2i therapy gap in HFpEF
- `nsaid-hf-interaction` — active NSAID prescription in HFrEF (a withdraw recommendation, not an initiate)
- `post-mi-beta-blocker` — beta-blocker gap within 12 months of MI
- `post-mi-acei-arb` — ACEi/ARB gap within 12 months of MI in high-risk patients

**Arrhythmia**
- `afib-anticoagulation` — anticoagulation gap gated on a computed CHA₂DS₂-VASc score

**Dyslipidemia**
- `lpa-screening` — Lp(a) measured at least once in adulthood
- `apob-measurement` — ApoB measurement in conditionally qualifying high-risk patients
- `statin-initiation` — statin gap across multiple threshold paths (ASCVD, LDL ≥ 190, diabetes age 40–75)

**Endocrine / metabolic**
- `t2dm-sglt2i-ckd` — SGLT2i gap in type 2 diabetes with CKD (multi-modal CKD detection)
- `t2dm-statin` — statin gap in type 2 diabetes age 40–75

### Guideline sources

Rules are sourced from six published clinical guidelines:

- 2022 ACC/AHA/HFSA Heart Failure Guideline
- 2023 ACC/AHA/ACCP/HRS Atrial Fibrillation Guideline
- 2025 ACC/AHA/ACEP/NAEMSP/SCAI Acute Coronary Syndromes Guideline
- 2026 ACC/AHA/Multisociety Dyslipidemia Guideline
- ADA Standards of Care 2026
- KDIGO 2022 Diabetes Management in CKD Guideline

Each rule's guideline currency is tracked in [`docs/guideline-watch.md`](docs/guideline-watch.md): publication date, last in-repo clinical review, and a next-review marker. When a guideline updates or a review date passes, the rule banner, the watch row, and the ADR all get a fresh pass.

---

## Rule shapes

The engine deliberately generalizes across a small vocabulary of **nine recurring rule shapes** — structural templates, not clinical categories, so the same shape serves any specialty:

1. Therapy-gap, multi-pillar
2. Therapy-gap, single-pillar
3. Universal screening-gap
4. Conditional-population screening-gap
5. Drug-condition interaction
6. Threshold (value-based, multi-path)
7. Calculated-score-gate
8. Time-bounded therapy-gap
9. Conditional-population therapy-gap

Naming and reusing shapes lets a new rule author pick a pattern rather than improvise structure, and lets a reviewer focus on what is clinically different about a rule rather than re-reading boilerplate. Adding a rule that fits no existing shape requires an ADR introducing the new shape first. Full template definitions, example rule files, and selection guidance are in [`docs/rule-shapes.md`](docs/rule-shapes.md).

---

## Governance model

Kairos is built around an explicit separation of duties across three named human roles:

- **Clinical Authoring Lead** — owns the clinical content of each rule: which guideline, which recommendation, what scope.
- **Engineering Lead** — owns the engine: the rule signature contract, test patterns, type safety, cross-rule isolation.
- **Clinical Safety Reviewer** — independently verifies every rule's clinical detail against primary-source guideline text before it ships.

Every rule file carries `lastReviewed`, `reviewedBy`, and `nextReviewDue` markers. Guideline currency is tracked in [`docs/guideline-watch.md`](docs/guideline-watch.md) as standing infrastructure, not a one-time check. The operating principle throughout: **AI surfaces work; humans authorize.**

---

## Surfaces

Kairos includes two working front-end surfaces, both guided tours built on synthetic patient fixtures:

- **`/rn`** — a cardiology nurse dashboard organized around inbox-style work baskets.
- **`/provider`** — a provider day-in-the-life surface with a 12-section patient briefing drawer.

Live demo: **[kairoshealth.app](https://kairoshealth.app)**

---

## Architecture Decision Records

Sixteen ADRs in Michael Nygard format document the engineering judgment behind the build — why TypeScript for the engine subsystem, why synthetic FHIR fixtures over Epic sandbox data, why the rule signature is a pure function, why cross-rule isolation testing is a standing pattern, and the rationale for each rule as it landed. See [`docs/decisions/`](docs/decisions/) and the [documentation index](docs/INDEX.md).

---

## Stack

- **Next.js** — application surfaces.
- **TypeScript (strict mode)** — the clinical engine subsystem. Rules are pure functions over a typed `PatientBundle`; the rest of the project is plain JavaScript.
- **Deterministic rule functions** — no model in the engine path; `(bundle: PatientBundle) => Finding[]`.
- **FHIR-shaped fixtures** — synthetic patient bundles modeled on FHIR R4 resource shapes.
- **Jest** — 431 unit tests including cross-rule isolation coverage.

---

## Status & disclosure

Kairos is a **design-stage prototype**. It runs entirely on **synthetic clinical data** and **published clinical guidelines**. It is **not deployed** in any clinical setting, **not connected to real patient data**, and not connected to any real Epic instance.

It was built on personal infrastructure as a portfolio artifact — to demonstrate an architecture for safety-critical clinical decision support: deterministic rule engineering, guideline-sourced clinical logic, an explicit human-authorization governance model, and a language model kept deliberately out of the decision path.

Built by Brandon Sterne, a registered nurse with 26 years of clinical experience, now working in cardiology — built from direct observation of how clinical workflow and clinical synthesis actually happen in practice.
