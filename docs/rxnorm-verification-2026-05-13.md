# RxNorm Verification — GDMT HFrEF Drug Codes

> [← Index](INDEX.md) · Last updated: 2026-05-13 · Flag-only verification of all 12 GDMT HFrEF drug RxCUIs against the RxNorm REST API.

**Date:** 2026-05-13
**Source rule file:** `lib/clinical-engine/rules/gdmt-hfref.ts`
**API:** RxNorm REST — `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=<drug>`
**Editing policy:** This report flags mismatches only. No code in `gdmt-hfref.ts` was modified. Human clinical review required before any RxCUI change.

## Results

| # | Drug | Repo RxCUI | RxNorm RxCUI | Status | Source URL |
|---|------|-----------|--------------|--------|------------|
| 1 | lisinopril | 29046 | 29046 | MATCH | https://rxnav.nlm.nih.gov/REST/rxcui.json?name=lisinopril |
| 2 | enalapril | 18867 | 3827 | MISMATCH | https://rxnav.nlm.nih.gov/REST/rxcui.json?name=enalapril |
| 3 | ramipril | 50166 | 35296 | MISMATCH | https://rxnav.nlm.nih.gov/REST/rxcui.json?name=ramipril |
| 4 | losartan | 52175 | 52175 | MATCH | https://rxnav.nlm.nih.gov/REST/rxcui.json?name=losartan |
| 5 | valsartan | 321064 | 69749 | MISMATCH | https://rxnav.nlm.nih.gov/REST/rxcui.json?name=valsartan |
| 6 | sacubitril/valsartan | 1656328 | 1656339 | MISMATCH | https://rxnav.nlm.nih.gov/REST/rxcui.json?name=sacubitril/valsartan |
| 7 | metoprolol succinate | 866924 | 221124 | MISMATCH | https://rxnav.nlm.nih.gov/REST/rxcui.json?name=metoprolol%20succinate |
| 8 | carvedilol | 20352 | 20352 | MATCH | https://rxnav.nlm.nih.gov/REST/rxcui.json?name=carvedilol |
| 9 | bisoprolol | 19484 | 19484 | MATCH | https://rxnav.nlm.nih.gov/REST/rxcui.json?name=bisoprolol |
| 10 | spironolactone | 8629 | 9997 | MISMATCH | https://rxnav.nlm.nih.gov/REST/rxcui.json?name=spironolactone |
| 11 | dapagliflozin | 1545653 | 1488564 | MISMATCH | https://rxnav.nlm.nih.gov/REST/rxcui.json?name=dapagliflozin |
| 12 | empagliflozin | 1545664 | 1545653 | MISMATCH | https://rxnav.nlm.nih.gov/REST/rxcui.json?name=empagliflozin |

## Summary

- **MATCH:** 4 / 12 (lisinopril, losartan, carvedilol, bisoprolol)
- **MISMATCH:** 8 / 12
- **NOT FOUND:** 0 / 12

## Notes for human reviewer

- The mismatches likely reflect a mix of (a) ingredient-level vs. brand/dose-form RxCUIs, (b) historic RxCUI retirement and remap, and (c) collisions like the prior valsartan/eplerenone bug fixed in commit `24263d8`.
- Several of the repo codes (e.g., `866924` for metoprolol succinate) appear to point at dose-form-specific concepts rather than the ingredient concept currently returned by the bare name lookup. The "correct" RxCUI depends on how the normalizer compares medication codes from FHIR `MedicationStatement` resources — ingredient vs. clinical drug.
- The valsartan code in repo (`321064`) collides with the prior eplerenone collision noted in session 723 — needs re-verification.
- Recommended next step: a clinician + dev pair review to decide whether the rule should compare against ingredient RxCUIs (and normalize incoming codes upward to ingredient), or against a curated allow-list of clinical-drug RxCUIs.

**No edits made to `lib/clinical-engine/rules/gdmt-hfref.ts`. Flag-only report.**
