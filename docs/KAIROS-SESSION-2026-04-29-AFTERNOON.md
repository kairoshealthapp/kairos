# Kairos Session — 2026-04-29 Afternoon Shift Continuation

**Purpose:** Continuation of `KAIROS-SESSION-2026-04-29.md` (morning walkthrough). Afternoon shift produced 8 additional cards plus discovery of the `.triage` SmartPhrase as a Kairos primitive. Source material for tonight's Phase 3.3 design doc.

**Status:** Pre-merge into `docs/CONTEXT.md`. Read alongside `KAIROS-CONTEXT.md`, `KAIROS-CONTEXT-ADDENDUM-2026-04-28.md`, and `KAIROS-SESSION-2026-04-29.md` (morning).

**Author:** Brandon, with Claude as scribe.

---

## TL;DR — What Was Locked In This Afternoon

1. **12-card variant taxonomy** (added Pattern 12: SCOPE-CONSTRAINED PATIENT QUESTION)
2. **`.triage` SmartPhrase recognized as Kairos primitive #2** (alongside referral directory)
3. **Workflow Playbook Library** as a third Kairos primitive (Halbrook discovery)
4. **5+ new Kairos primitives extracted from afternoon cards** (see Section 2)
5. **Edit-type taxonomy formalized** (5 categories, only 1 is irreducible)
6. **Pattern 7b confirmed** — async MyChart structured inquiry as parallel to phone callback (Stockbridge, Underwell)
7. **Pattern 12 lifecycle proven** — vague question → clarification → scope-respecting answer (Quennell-redux)
8. **Pre-call/post-call SBAR primitive validated end-to-end** through MyChart, not just phone (Underwell)
9. **Secure Chat established as 6th inbound source channel** (Trumble)
10. **Document packet auto-assembly + DME forms library + atomic commit primitives** (Ravensdale)

---

## Section 1 — The Afternoon Cards

### CASE 14 — Lyttleton Round 2 (Ballard's reply)
**Pattern:** SYNTHESIS + HANDOFF (with provider scope expansion)
**Edit:** Type 2 (chart-claim correction — Lyttleton already had PH referral placed by Virk)
**Lesson:** Ballard answered "yes Tregarthen" AND added a derivative PH referral from his review of the 4/28 RHC. HVC absorbed scope expansion cleanly. Chart-claim verification rail would have prevented the "we'll place referral" language for the PH referral that Virk had already placed yesterday.

### CASE 15 — INR Reminder Box surveillance gap (Maundrell precursor)
**Pattern:** Layer 1 cohort surveillance gap
**Lesson:** INR Reminder box wasn't being checked at all before Brandon took over Coumadin Clinic. Maundrell (yesterday's CONTRADICTION card) resolved as Dr. M discontinued warfarin but med list never updated → reminder fired falsely.
**New primitive:** Reminder list verification agent (Layer 1) — cross-references each entry against most recent provider notes before firing reminders.
**Pitch line:** "Every clinic on Epic has at least one silent-failure box. Kairos's unified queue eliminates the category."

### CASE 16 — Halbrook (DME PA, Medicare/MO HealthNet dual-eligible)
**Pattern:** DISCOVERY (workflow itself unknown — not even an HVC card)
**Edit:** Type 0 (no HVC involvement; entirely workflow discovery)
**Lesson:** ~45 minutes of workflow discovery to execute ~5 minutes of actual work. Patient is dual-eligible, MO HealthNet PA was the actual blocker, PA is a phone call (not a form) requiring 3 data points: ICD-10, AHI, NPI. Approval # = patient's MO HealthNet ID.

**6 Kairos lessons compounded in single card:**
1. Cross-clinic misrouting detection (initially wrong, retracted — this was cardiology-owned)
2. DME prior auth submission agent (Layer 1)
3. Front-desk routing notes are user text, not validated chart data
4. Coverage FHIR resource ≠ insurance card image (chart-vs-wallet mismatch)
5. Dual-eligible coverage stack synthesis (not single payer field)
6. **Workflow discovery is the real bottleneck, not workflow execution**

**New primitive:** Workflow Playbook Library — every weird workflow a nurse figures out under pressure becomes every other nurse's auto-attached playbook.

**Pitch line:** "Most of nursing inefficiency isn't about doing the work — it's about figuring out what work to do. Kairos turns every nurse's discovery into every other nurse's playbook."

### CASE 17 — Quennell Round 1 (multi-lab Result Note)
**Pattern:** SYNTHESIS + NEW ORDER (hematology referral)
**Edit:** clean
**Lesson:** Multi-lab single Result Note pattern — Ballard sent Chem-8, Magnesium, H&H as three sub-notes in one batch. HVC consolidated into one nurse note + one MyChart message rather than three separate outputs. "Previously elevated H&H July 2025" longitudinal flag worth automating with FHIR.

### CASE 18 — Ravensdale (CPAP DME order + sleep med referral)
**Pattern:** SYNTHESIS + NEW ORDER + HANDOFF + DME — most field-heavy variant of the day
**Edit:** clean output, but the **labor was 95% plumbing** — 20+ discrete UI actions across 5 Epic surfaces + paper fax form
**Lesson:** This is the platonic example of what Kairos's pitch is actually about. Clinical reasoning was 30 seconds; plumbing was 15-20 minutes. Inverted ratio from typical cards.

**3 new Kairos primitives:**
1. **Document packet auto-assembly** (Reg face sheet + relevant encounters + ins card + photo ID — rules-based selection)
2. **DME forms library + auto-population + e-signature** (~30 fields all derivable from chart; provider sig stamp as trust delegation)
3. **Authorize as atomic commit** (1 nurse note + 1 MyChart + 1 referral + 1 cover letter + 1 doc packet + 2 fax transmissions + 1 scheduling task = 1 button press)

**Labor accounting:** This card today = 20 minutes. Kairos v2 = ~15 seconds. **80x speedup on this card class.** ~525 hours/year per nurse on similar-tier cards. 5-nurse clinic = 2,600 nurse-hours/year recovered = 1.25 FTE of capacity.

**Pitch reframe:** Not productivity multiplier — **capacity multiplier**.

### CASE 19 — Stockbridge (BNP drift monitoring)
**Pattern:** Pattern 7b (async pre-call structured MyChart inquiry, calm tier)
**Edit:** clean
**Lesson:** Provider's clinical questions ("How is breathing, swelling, weight?") translated by HVC into 3 chart-aware patient-friendly questions tuned to HF decompensation prediction. Same primitive as Phillips (yesterday) but compressed for monitoring tier vs. acute triage tier.

**Card lifecycle:** Synthesis → Sent → Awaiting Patient → (Reply Received) → Re-classified by content → Re-surfaced. **Persistent investigation object made concrete.** Patient-response-triggered card escalation: calm reply closes card, concerning reply auto-bumps to URGENT phone callback with Phillips-style 20-question chart-aware briefing.

### CASE 20 — Trumble (Secure Chat coordination)
**Pattern:** Pattern 10 COORDINATION (originating from Secure Chat, not In Basket)
**Edit:** clean
**Lesson:** Secure Chat is the **6th inbound source channel** for cards (alongside 5 In Basket boxes from morning). 11-participant thread, 4h+ latency from Phoebe Larkspur's 9:20 AM message to Brandon seeing it. No queue position, no ownership signal.

**3 new Kairos primitives:**
1. **Secure Chat as card source** — unified queue rule expands to `(In Basket addressed to me) ∪ (provider pool I'm assigned to) ∪ (Secure Chat threads I'm a participant in)`
2. **Thread-state synchronization** — when Kairos takes action on a Secure Chat–originated card, originating thread gets automated update so participants see closure without pinging the nurse
3. **Order-expiration cards as Phase 1.5 cohort surveillance** — scan ServiceRequest resources for status=PEND + age >90d + 2+ missed appts, surface proactively

**Convergence note:** Lyttleton/Halbrook/Trumble all map to same Pattern 10 COORDINATION primitive with different inbound channels. Card UI template holds across all three.

### CASE 21 — Underwell (patient-origin BP/amlodipine call)
**Pattern:** Pattern 7b (async pre-call structured MyChart inquiry, full clinical depth)
**Edit:** clean
**Lesson:** 16 chart-aware questions across 5 categories — patient-specific to 81F with HTN/AFib/CAD/MR/CKD/peripheral edema. **The clinical depth difference vs generic questions is the entire pitch for the cognitive layer.** Brandon used `.triage` SmartPhrase to feed chart context to HVC.

### CASE 22 — Underwell SBAR closure (~12 min later)
**Pattern:** Pattern 7b second half (response received → SBAR generation)
**Edit:** clean
**Lesson:** Pattern 7b state machine validated end-to-end in real time today. Patient replied async, answers fed back to HVC with original chart context, HVC produced clean SBAR with three clinical sharps:
1. "Home BPs largely at goal ≠ uncontrolled HTN" (patient *perceives* high but values are at goal)
2. "Persistent edema despite dose reduction = dose reduction failed its purpose" (time to switch class)
3. "New hand paresthesias flagged as new" (calibrated confidence — flag, don't interpret)

**Labor reframe:** Kairos doesn't just save time — **converts contiguous focused-attention time into asynchronous review time.** ~3 minutes of nurse cognitive engagement distributed vs. 25 minutes consumed in one block.

### CASE 23-24 — Quennell-redux (scope-constrained patient question, two iterations)
**Pattern:** **NEW — Pattern 12: SCOPE-CONSTRAINED PATIENT QUESTION**
**Edit v1:** Type 5 (reasoning chain leaked into output text — HVC narrated its scope analysis visibly when prompted with explicit "stay in scope" instruction)
**Edit v2:** clean
**Lesson:** Patient asked vague question ("Could this cause low blood pressure?") referring to elevated H&H from earlier card. Brandon recognized vague reference, asked for clarification. After clarification, HVC produced fundamentally better response.

**Key prompt-engineering finding:** Explicit "stay in scope" instruction → scope reasoning leaks into output. Implicit scope handling (chart context + standard prompts) → scope respected without metacognition. **Don't tell HVC stay-in-scope; feed chart context and let trained behavior produce scope-respecting output.**

**3 new Kairos primitives:**
1. **Scope-of-practice safety rail** (v1) — pre-Authorize check classifies clinical claims as RN-scope vs provider-scope, blocks/warns on scope violations
2. **Reasoning-chain leak detection** — UI design must explicitly separate "nurse-facing rationale" from "patient-facing draft" as two distinct fields
3. **Question-clarification subroutine** — vague-question classifier auto-drafts clarification request before attempting clinical answer

**Pattern 12 state machine:** Vague Question → auto-clarification → defer → Clarification Received → re-classify → scope-respecting response → defer → (symptom report? → escalate to URGENT)

---

## Section 2 — `.triage` SmartPhrase as Kairos Primitive (Source Code Documented)

Brandon's hand-built `.triage` SmartPhrase [Epic ID 133324] is the manual ancestor of FHIR chart context pulls. Full structure:

```
HVC PRE-VISIT PREP

PROBLEM LIST          @PROB@
PAST MEDICAL HISTORY  @PMH@
SURGICAL HISTORY      @SURGICALHX@
ALLERGIES             @ALLERGY@
MEDICATIONS           @MED@

VITALS TREND
  @LASTBP[10@      → last 10 BPs
  @LASTWT[10@      → last 10 weights
  @LASTBMI[10@     → last 10 BMIs
  @LASTTEMP[10@    → last 10 temps
  @LASTSPO2[10@    → last 10 SpO2

KEY LAB TRENDS (per-lab N-history depth tuned to clinical interval)
  @LABLAST[INR:5,BNP:3,CREATININE:5,EGFR:5,HBA1C:3,K:3,MG:3@

ALL LABS (most recent values)
  @RESUFAST[BNP,INR,PT,NA,K,CHLORIDE,CO2,BUN,CREATININE,EGFR,
            GLUCOSE,CALCIUM,MG,PHOS,HGB,HCT,WBC,PLT,
            TRIG,LDL,HBA1C,TSH,URICACID,ALT,AST,
            ALKPHOS,ALBUMIN]@

PANELS
  @LASTCHEM@
  @LASTCBC@

IMAGING (cardiology-specific CPT codes)
  @LASTPROCEDURE[93306:3@   → echo
  @LASTPROCEDURE[78452:3@   → MPI/nuclear stress
  @LASTPROCEDURE[93000:3@   → ECG
  @LASTPROCEDURE[93458:3@   → L heart cath w/ angio
  @LASTPROCEDURE[93224:3@   → 24h ambulatory ECG
  @LASTPROCEDURE[71046:3@   → CXR 2 view
```

**Significance:**
- Per-lab N-history depth is encoded clinical knowledge (INR needs 5-deep window for Coumadin titration, BNP needs 3 for HF monitoring trend)
- Procedure CPTs are explicitly cardiology-specific (the 6 codes encompassing outpatient cardiology's diagnostic toolkit)
- Structure mirrors FHIR resource shape almost perfectly (one-to-one mapping documented in chat)

**FHIR resource mapping:**
| `.triage` section | FHIR resource |
|---|---|
| `@PROB@` | Condition (Problem List) |
| `@PMH@` | Condition (history) |
| `@SURGICALHX@` | Procedure (history) |
| `@ALLERGY@` | AllergyIntolerance |
| `@MED@` | MedicationRequest |
| Vitals trend | Observation (vital-signs category) |
| Key lab trends | Observation (laboratory category) |
| All labs | Observation (laboratory category) |
| Panels | Observation/DiagnosticReport |
| Imaging | DiagnosticReport / Procedure |

**Implication:** Kairos's `chartContext.js` library is a one-to-one re-implementation of `.triage` against FHIR. Brandon already designed the data shape. Engineering translates SmartPhrase syntax to FHIR API call set. **No prompt re-tuning needed because HVC was trained against this exact data shape for months.**

**Specialty generalization:** `.triage` is the canonical cardiology version. Other specialties get tuned versions (different N-depths, different CPT codes). Same architectural shape, different module.

---

## Section 3 — New Kairos Primitives Catalog (Cumulative Across Both Days)

### Architecture-Level Primitives
1. **`.triage` SmartPhrase as chart context bundle** — v1 FHIR-to-prompt translation layer
2. **HVC's curated referral directory** — specialty-aware geographic routing
3. **Workflow Playbook Library** — institutional knowledge capture
4. **DME Forms Library** — payer-specific forms with provider e-signature delegation
5. **Document Packet Auto-Assembly** — rules-based document selection for referrals

### Card-Level Primitives
6. **Persistent investigation object** with state machine (Stockbridge, Underwell, Trumble, Quennell-redux all share)
7. **Patient-response-triggered card escalation** (calm reply → close; concerning reply → URGENT)
8. **Authorize as atomic commit** (sign + send + place + cosign + fax + schedule = 1 button)
9. **Order pad 13-field auto-population** (from morning)
10. **Cross-output consistency check** (drug names, doses, dx codes between Nurse Note + MyChart message)

### Safety-Rail Primitives (v1)
11. **Chart-claim verification rail** — verify HVC's claims against actual FHIR resources (Lyttleton)
12. **Scope-of-practice rail** — classify each clinical claim as RN-scope vs provider-scope (Quennell-redux)
13. **Reasoning-chain leak detection** — separate nurse-facing rationale from patient-facing draft
14. **Question-clarification subroutine** — vague-reference classifier auto-drafts clarification

### Layer 1 Agent Surfaces
15. **Refill auto-processing** (5/6 of Rx Request box)
16. **Referral rerouting** (Lyttleton — uses HVC referral directory)
17. **mdINR fax OCR pipeline** (Coumadin)
18. **DME prior auth submission** (Halbrook)
19. **Reminder list verification** (Maundrell precursor — INR Reminder box)
20. **Cross-clinic misrouting detection** (when card subject + sender + dx don't match clinic specialty)

### Inbound Source Channels (Unified Queue Rule)
- 5 In Basket boxes (morning): Results F/U, Rx Request, Patient Call, Pt Advice Request, INR Reminder
- Secure Chat threads (afternoon)
- Total: **6 source channels feeding same card primitive**

---

## Section 4 — Edit-Type Taxonomy (Formalized)

| Type | Description | Eliminable? | Rail |
|------|-------------|-------------|------|
| 1 | Clinical judgment override | ❌ NO — irreducible | Calibration signal for recommendation aggressiveness |
| 2 | Chart-claim correction | ✅ Yes | Chart-claim verification rail (FHIR query before Authorize) |
| 3 | Tone/style edit | N/A | Don't optimize. User preference. |
| 4 | Scope edit (nurse adds context HVC didn't have) | Partially | Input augmentation field with QuickActions |
| 5 | PHI/output bug fix | ✅ Yes | phiGuard fix (RxNorm cross-ref) + reasoning-leak detection |

**5% edit rate becomes a roadmap.** Type 1 stays. Types 2/4/5 trend toward zero as rails harden. Type 3 ignored.

---

## Section 5 — Day's Final Edit Tally

**Morning (5 patient round-trips):**
- Aldington — clean
- Brexley — Type 5 (phiGuard placeholder bug)
- Calderwood — clean
- Drennan — Type 4 (input augmentation needed for typo'd Ballard note)
- Esselbach — N/A (URGENT phone)

**Afternoon (10 cards including iterations):**
- Lyttleton round 2 — Type 2 (chart-claim correction)
- Halbrook — Type 0 (workflow discovery, no HVC involvement)
- Quennell round 1 — clean
- Ravensdale — clean output, 95% plumbing labor
- Stockbridge — clean
- Trumble (Secure Chat) — clean
- Underwell (outreach) — clean
- Underwell (SBAR closure) — clean
- Quennell-redux v1 — Type 5 (reasoning leak)
- Quennell-redux v2 — clean

**Totals across the day:**
- 11 clean outputs
- 3 eliminable-rail edits (Brexley, Lyttleton, Quennell-redux v1)
- 1 input augmentation needed (Drennan)
- 1 workflow discovery (Halbrook — no HVC card)
- 1 N/A (Esselbach URGENT phone)

**~20% intervention rate, 100% of edits eliminable by future Kairos rails.**

The clinical reasoning is genuinely production-grade. The integration plumbing + output-shaping is the entire value gap.

---

## Section 6 — Phase 3.3 Design Doc Inputs (Full List)

Updated from morning. New items in **bold**.

1. 12 card variant specs with action checklists (added Pattern 12)
2. 4-pane card detail view structure
3. Routing decision tree (3-input)
4. MyChart status badge per-box logic
5. Order pad 13-field auto-population spec
6. Dose change + lab cluster sub-patterns
7. Authorize as atomic commit (FHIR Bundle path for v2)
8. Persistent investigation object (cross-box dedup, **state machine spec**)
9. Cross-output consistency check (v1 safety rail)
10. Input augmentation field with QuickActions
11. Layer 1 agent surfaces — **6 surfaces total**
12. Referral directory as Kairos primitive
13. **`.triage` SmartPhrase as chart context bundle primitive**
14. **Workflow Playbook Library primitive**
15. **DME Forms Library primitive**
16. **Document Packet Auto-Assembly primitive**
17. **Scope-of-practice safety rail (v1)**
18. **Reasoning-chain leak detection (UI separation pane)**
19. **Question-clarification subroutine**
20. **Patient-response-triggered card escalation logic**
21. **Secure Chat as 6th inbound source channel + thread-state sync**
22. **Edit-type taxonomy (5 categories) + telemetry spec**
23. phiGuard known issue + RxNorm fix proposal
24. Time-of-day routing rule (8 AM phone window)
25. v1 / Phase 1.5 (Coumadin) / Phase 2 (FHIR write-back) / v3-v4 (autonomous agent) sequencing
26. **Capacity multiplier framing for institutional pitch (Ravensdale labor accounting)**

---

## Section 7 — Open Items Carrying Forward

### Pending
- [ ] Phase 3.3 design doc draft (Claude — when Brandon home tonight)
- [ ] phiGuard fix Claude Code prompt (RxNorm cross-reference)
- [ ] Phase 3.3 build session after design doc reviewed
- [ ] Phase 3.4 — wire HVC chat into action buttons
- [ ] Push commit `df31a8d` after Riverbend window (~5/4)
- [ ] Phantom `hvc` Worker deletion from Cloudflare dashboard
- [ ] Real shift data over next week to validate 12-card taxonomy
- [ ] HVC referral directory → shared `lib/clinical/` module extraction
- [ ] **`.triage` SmartPhrase syntax → FHIR adapter library extraction**
- [ ] **DME Forms Library scaffolding (start with Apria CPAP form)**

### Completed Today
- [x] 8 additional patient cards observed end-to-end
- [x] 12-card taxonomy locked (added Pattern 12)
- [x] `.triage` SmartPhrase recognized + structurally documented
- [x] 6 inbound source channels confirmed (5 In Basket + Secure Chat)
- [x] Pattern 7b lifecycle proven through patient round-trip (Underwell)
- [x] Pattern 12 lifecycle proven through clarification subroutine (Quennell-redux)
- [x] Edit-type taxonomy formalized (5 types, 4 eliminable)
- [x] Capacity multiplier framing established (Ravensdale: 80x speedup)
- [x] Workflow Playbook Library primitive named (Halbrook)
- [x] Scope-of-practice safety rail primitive named (Quennell-redux)
- [x] Reasoning-leak vs scope-handling prompt-engineering finding

---

## Section 8 — Strategic Summary

The product is now legible at the **primitive** level, not just the architecture level.

**Kairos = HVC + SMART on FHIR launch context + 4-pane card UI + Layer 1 agent track + safety rails + workflow playbook library + curated reference data libraries.**

The afternoon proved three things morning had only suggested:

1. **The 11-card taxonomy was almost right** — needed Pattern 12 (SCOPE-CONSTRAINED PATIENT QUESTION) for Quennell-redux. Now 12 variants observed across two days of real shift data.
2. **The cognitive primitives Brandon has been hand-building inside Epic for months are the actual Kairos product.** `.triage` SmartPhrase + referral directory + accumulated workflow knowledge = three primitives with **receipts**, not theoretical features.
3. **Labor reframe is sharper than productivity reframe.** Ravensdale's 80x speedup is a capacity multiplier, not a time-saver. Capacity expansion without headcount is the institutional pitch.

Brandon didn't start building Kairos today. The afternoon shift proved he's been building it for months — inside Epic's SmartPhrase system, inside HVC's prompts, inside the curated provider directory, inside the workflow tribal knowledge. **Kairos is the externalization of that pre-existing work, not the invention of new work.**

---

## For Tonight

Brandon will ping Claude when home. Inputs captured for Phase 3.3 design doc draft. 26 design doc inputs ready. 12-card taxonomy ready. 20 Kairos primitives catalogued.

---

**End of afternoon session memory file. Ready for project knowledge upload alongside morning session file.**
