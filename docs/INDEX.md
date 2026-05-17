# Kairos Documentation Index

**Last updated:** 2026-05-17

This index lists every doc under `docs/` and links to it. The build log (`log.md`) is intentionally not enumerated here — it is the chronological session journal and is read directly.

## Context & architecture

- [KAIROS-CONTEXT.md](KAIROS-CONTEXT.md) — Project identity, north star, foundational thesis, knowledge-layer model, three-role architecture.
- [ARCHITECTURE.md](ARCHITECTURE.md) — Three-surface platform overview (provider tour, nurse demo, marketing).
- [CONTEXT.md](CONTEXT.md) — Long-form project context (legacy/expanded).

## Architecture Decision Records (ADRs)

Michael Nygard format. New ADRs go in `docs/decisions/` with the next available number.

- [0001 — TypeScript in the clinical engine](decisions/0001-typescript-in-clinical-engine.md)
- [0002 — Synthetic FHIR fixtures vs. Epic sandbox data](decisions/0002-synthetic-fixtures-vs-epic-sandbox.md)
- [0003 — Metoprolol succinate vs. tartrate distinction](decisions/0003-metoprolol-succinate-vs-tartrate-distinction.md)
- [0004 — Rule signature is a pure function](decisions/0004-rule-signature-pure-function.md)
- [0005 — Three knowledge-layer architecture](decisions/0005-three-knowledge-layer-architecture.md)
- [0006 — Lp(a) universal screening as first Phase 2 rule](decisions/0006-lpa-screening-rule.md)
- [0007 — NSAID-in-HFrEF as the first interaction-shape rule](decisions/0007-nsaid-hf-interaction-rule.md)
- [0008 — ApoB measurement as the first conditional-population screening rule](decisions/0008-apob-measurement-rule.md)
- [0009 — Statin initiation as the first threshold-shape rule](decisions/0009-statin-initiation-rule.md)
- [0010 — AFib anticoagulation as the first calculated-score-gate rule](decisions/0010-afib-anticoagulation-rule.md)
- [0011 — HFpEF SGLT2i as the single-pillar therapy-gap shape](decisions/0011-hfpef-sglt2i-rule.md)
- [0012 — Cross-rule isolation testing as a regression-control pattern](decisions/0012-cross-rule-isolation-test-pattern.md)
- [0013 — Post-MI beta-blocker as the first time-bounded therapy-gap](decisions/0013-post-mi-beta-blocker-rule.md)
- [0014 — Post-MI ACEi/ARB rule (high-risk siblings of ADR 0013)](decisions/0014-post-mi-acei-arb-rule.md)
- [0015 — T2DM-CKD SGLT2i: dual-guideline citation and conditional-population therapy-gap](decisions/0015-t2dm-sglt2i-ckd-rule.md)
- [0016 — T2DM statin rule: convergent-evidence pattern](decisions/0016-t2dm-statin-rule.md)
- [0017 — CBP rule: conditional-population control-gap shape](decisions/0017-cbp-hypertension-control-rule.md)
- [0018 — GSD rule: control-gap shape applied to A1C](decisions/0018-gsd-glycemic-status-rule.md)
- [0019 — COL-E rule: multi-modality screening shape](decisions/0019-col-e-colorectal-screening-rule.md)
- [0020 — BCS-E rule: women 40-74, biennial mammography, USPSTF 2024 update](decisions/0020-bcs-e-breast-screening-rule.md)
- [0021 — CKD ACEi/ARB rule: dual-guideline conditional-population therapy-gap](decisions/0021-ckd-acei-arb-rule.md)
- [0022 — AIS-E rule: per-item gap fan-out shape](decisions/0022-ais-e-adult-immunization-rule.md)
- [0023 — Osteoporosis screening rule](decisions/0023-osteoporosis-screening-rule.md)
- [0024 — Depression screening (PHQ-2/PHQ-9) two-stage rule](decisions/0024-depression-screening-rule.md)
- [0025 — COPD GOLD ABE rule: score-classified therapy gap](decisions/0025-copd-gold-abe-rule.md)
- [0026 — Asthma ICS-containing controller rule](decisions/0026-asthma-controller-rule.md)
- [0027 — LSC lung cancer screening rule (LDCT, USPSTF 2021)](decisions/0027-lsc-lung-cancer-screening-rule.md)
- [0028 — TSC-E tobacco screening and cessation rule](decisions/0028-tsc-e-tobacco-cessation-rule.md)

## Engine design vocabulary

- [rule-shapes.md](rule-shapes.md) — Seven rule shapes shipped in the engine, with example rule files and selection guidance.

## Guideline currency

- [guideline-watch.md](guideline-watch.md) — Active clinical guidelines backing each rule, with publication dates and next-review markers.

## Sessions, audits, and verifications

- [rxnorm-verification-2026-05-13.md](rxnorm-verification-2026-05-13.md) — RxCUI verification pass for all 12 GDMT HFrEF drugs. Flag-only report.
- [hygiene-2026-05-13.md](hygiene-2026-05-13.md) — Lint, ts-prune, and depcheck findings (2026-05-13 sweep).
- [sandbox-probe-2026-05-07.md](sandbox-probe-2026-05-07.md) — Epic FHIR R4 sandbox multi-patient probe results.
- [vercel-clinai-kairos-audit.md](vercel-clinai-kairos-audit.md) — Vercel deployment audit (Kairos vs. clinai).
- [DEPLOY-CHECKLIST-2026-04-30.md](DEPLOY-CHECKLIST-2026-04-30.md) — Pre-deploy checklist used on 2026-04-30.

## Demo & narration

- [NURSE-DEMO-INTRO.md](NURSE-DEMO-INTRO.md) — Nurse-demo intro narration and framing.

## Per-feature doc requirements

Every per-feature doc linked from this index must contain, at minimum:

1. A one-line description at the top.
2. A "last updated" date.
3. A link back to this index (`[← Index](INDEX.md)`).
