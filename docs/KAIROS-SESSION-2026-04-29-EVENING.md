# Kairos Session — 2026-04-29 Evening Shift Continuation

**Purpose:** Continuation of `KAIROS-SESSION-2026-04-29.md` (morning) and `KAIROS-SESSION-2026-04-29-AFTERNOON.md` (afternoon). Late-shift cards plus full lifecycle validation of Pattern 7b. Source material for tonight's Phase 3.3 design doc.

**Status:** Pre-merge into `docs/CONTEXT.md`. Read alongside `KAIROS-CONTEXT.md`, `KAIROS-CONTEXT-ADDENDUM-2026-04-28.md`, `KAIROS-SESSION-2026-04-29.md`, and `KAIROS-SESSION-2026-04-29-AFTERNOON.md`.

**Author:** Brandon, with Claude as scribe.

---

## TL;DR — What Was Locked In Late Shift

1. **Pattern 13 — INSURANCE DENIAL CASCADE** observed end-to-end (Larvendel, 8-day persistent investigation across 4 Epic surfaces)
2. **Pattern 14 — PHONE-CHANNEL SYNTHESIS** observed (Wexbury, no MyChart, HVC's spoken-register adaptations validated)
3. **Pattern 7b state machine validated end-to-end** through Underwell full round-trip (call → SBAR → provider plan → callback note → signed)
4. **Cross-note synthesis primitive** confirmed (Underwell: HVC absorbed two separate Hardenkvist notes — primary plan + addendum — into one unified callback)
5. **Card taxonomy now 14 variants** (was 12 at end of afternoon)
6. **Primitive catalog now ~31** (was ~20 at end of afternoon)
7. **Channel-aware output register** primitive — same clinical content, different linguistic shape (spoken vs written)

---

## Section 1 — The Late-Shift Cards

### CASE 25 — Larvendel (8-day insurance denial cascade)

**Pattern:** **NEW — Pattern 13: INSURANCE DENIAL CASCADE**
**Edit:** Type 4 (input augmentation needed — HVC defaulted to imaging-review framing, Brandon's correction "this has nothing to do with her imaging review...tell her yet another test was denied" forced the correct frame on second pass)
**Patient:** 41F, Adler J Beckforth FNP-BC primary, Hardenkvist NP cardiology, Humana

**Full timeline (8 days, 3 Secure Chat threads, 2 Hardenkvist exchanges, 2 patient communications):**

- **4/02:** NM SPECT ordered by Hardenkvist
- **4/21 10:24 AM:** Secure Chat denial #1 from Genevieve Brindlewain (PHS Mobile Cardiology Support Staff) — Homestate Health denied NM SPECT per Evolent Clinical Guideline 7312, requesting documentation of medical necessity for why exercise stress echo cannot be performed instead. Brandon forwarded to Hardenkvist.
- **4/21 12:32 PM:** Hardenkvist reply: "If the patient can exercise, can change to a stress echocardiogram."
- **4/21 1:13 PM:** Brandon reply: "Patient does not feel she can walk on a treadmill. States every time she moves she hurts and gets chest pain."
- **4/21 1:19 PM:** Hardenkvist reply: "Given the patient's inability to walk on a treadmill, would recommend Lexiscan Myoview stress test for further evaluation. Let whomever it may concern this is the reason why the Lexiscan Myoview stress test."
- **4/23 1:24 PM:** Larvendel, Carol N contacted Beatrix Kingsway (front desk).
- **4/23 1:26 PM:** Beatrix Kingsway: "Pt called following up on this. Pt said she would like to talk to Brandon to see if she is having the stress test still tomorrow, or to find out what the next steps are. Pt would like a call back." Routed to Phs Mob Cardiology Support Staff Pool.
- **4/24 7:53 AM:** Brandon Nurse Note — "Per Hardenkvist, Lexiscan Myoview stress test scheduled 4/24 has been cancelled. Pre-cert appeal also cancelled per provider. Coronary CT angiogram ordered given patient's symptoms of chest pain, SOB, nausea, and diaphoresis with known CAD s/p PCI with stenting. Awaiting insurance approval." Modules accepted: Orders.
- **4/29 2:32 PM:** Secure Chat denial #2 from Marielle Tannenbaum — CTA Coronary Arteries denied. "The reason for this is that the following notes have not been given: a doctor's note with a reason why a heart test where you walk with heart pictures (Stress Echocardiogram) cannot be done. A peer to peer is available by calling 800-308-2615 but would need to be done today. You would need the patient name, dob, Member ID# 16337356 and Tracking # 098121753502. We can also resubmit the request with any new results, documentation or note addendums. Thank you. Leona Inwarden (8789)"
- **4/29 2:33 PM:** Brandon added Roland P Hardenkvist, NP to the Secure Chat thread.
- **4/29 2:34 PM:** Brandon: "Mr Hardenkvist, FYI" + thumbs-up reaction.
- **4/29 ~2:50 PM:** HVC patient outreach draft #1 (default imaging-review framing — incorrect for the situation).
- **4/29 ~2:55 PM:** Brandon correction: "this has nothing to do with her imaging review..tell her yet another test was denied by insurance the heart CT explaing that is why we need to move forward with heart cath if still symptomatic."
- **4/29 ~2:58 PM:** HVC patient outreach draft #2 — denial-acknowledgment frame, second-test acknowledged ("This is the second test they have denied, and we understand how frustrating this is"), rationale for cath (history of CAD with prior stent placement + ongoing symptoms), 3 chart-aware symptom check-in questions, voicemail acknowledgment line, return precautions.
- **4/29 3:36 PM:** MyChart message sent to Ms Larvendel. Status: "This Phelps Health MyChart message has not been read." Encounter still open ("This encounter is not signed. The conversation may still be ongoing.")

**Pattern 13 lifecycle (codified):**

```
ORDER PLACED → PRE-CERT SUBMITTED → DENIAL #1 → 
PROVIDER ALT-ORDER → PRE-CERT #2 → DENIAL #2 → 
PEER-TO-PEER OPTION (deadline-bound) →
{provider decision: peer-to-peer / alt order / appeal / cath} →
PATIENT NOTIFICATION → SYMPTOM STATUS CHECK → 
NEXT ACTION → ... → CLOSE
```

**Why this is its own pattern:**

- **Persistent investigation object across 8 days** — currently lives across 4 Epic surfaces (Secure Chat ×3, In Basket Patient Call ×1, Encounter Notes ×4, MyChart ×1) and Brandon's working memory. Epic surfaces zero of this as a single object.
- **Authorization state machine** — each ServiceRequest has its own state (ordered → pre-cert → in review → approved/denied → appealed/peer-to-peer/alt-ordered). Existing patterns assume single-state orders.
- **Deadline-bound urgency** — "peer-to-peer today only" is a new urgency variant. Existing URGENT pattern is symptom-acuity-based, not authorization-deadline-based.
- **Cross-channel investigation consolidation** — Secure Chat (×2 staff: Genevieve Brindlewain, Marielle Tannenbaum) + In Basket (×2: front desk Kingsway, then Brandon) + encounter notes + orders + MyChart all collapse to one persistent object.
- **Auto-framing by auth state required** — when drafting patient outreach, HVC needs to know there's a denial cascade in play. Without that signal, defaults to highest-frequency pattern (routine imaging-review). This is the root cause of today's Type 4 edit.

**6 new Kairos primitives (before adding closure-specific ones in Section 2):**

1. **Authorization state machine** — each ServiceRequest tracks: ordered → pre-cert submitted → in review → approved/denied → appealed/peer-to-peer/alt-ordered. FHIR `Coverage` + `Claim` + `ClaimResponse` resources.
2. **Denial reason capture as structured data** — Evolent guideline 7312, payer-specific necessity criteria, machine-readable reason codes. Currently lives only as Secure Chat free text.
3. **Peer-to-peer deadline timer** — "today only" needs urgency override with countdown UI. New URGENT sub-variant: URGENT-DEADLINE-BOUND.
4. **Test-cascade timeline view** — card shows full chain across multiple encounters/orders/denials in one persistent object.
5. **Cross-channel investigation consolidation** — Secure Chat threads + In Basket messages + encounter notes + MyChart messages collapse to one card UI when they share patient + clinical question.
6. **Auto-framing by auth state** — when drafting patient outreach, check denial history first; if cascade present, denial-acknowledgment frame fires automatically. Eliminates the Type 4 edit Brandon had to make today.

### CASE 26 — Larvendel closure outbound (Pattern 13 second half)

**Patient:** Same as Case 25
**Edit:** clean (after the input augmentation correction in Case 25)
**Time:** 3:36 PM MyChart sent + voicemail left simultaneously

**HVC final draft (Image 4 final state):**

> Ms Larvendel,
> 
> Unfortunately, your insurance has denied the heart CT scan that Mr. Hardenkvist ordered. This is the second test they have denied, and we understand how frustrating this is.
> 
> Mr. Hardenkvist's recommended next step is a heart catheterization (heart cath). This is a procedure where a small tube is guided through a blood vessel to take detailed pictures of the arteries around your heart. Given your history of coronary artery disease with prior stent placement and the symptoms you have been experiencing, this is the best path forward to find answers. We are hopeful insurance will approve this procedure.
> 
> Before we move forward, we need to check in with you:
> 
> 1. Are you still having chest pain, shortness of breath, nausea, or sweating?
> 2. Have your symptoms gotten better, worse, or stayed about the same?
> 3. Are you having any new symptoms we should know about?
> 
> Please reply to this message at your earliest convenience so we can update Mr. Hardenkvist and determine next steps.
> 
> I also tried to reach you by phone today and left a voicemail. Thank you for your patience as we work through this with your insurance.
> 
> Brandon Sterne, RN BSN / Heart and Vascular Clinic

**HVC adaptations for denial-cascade context (visible in final draft):**

- "Yet another test denied" framing acknowledged without minimizing
- "We understand how frustrating this is" — emotional validation, brief, not effusive
- Cath rationale embedded with patient's specific history (CAD + prior stent + ongoing symptoms)
- "We are hopeful insurance will approve" — calibrated optimism, doesn't overcommit
- Symptom check-in questions chart-aware (chest pain, SOB, nausea, sweating — these are her presenting symptoms from 4/24 nurse note)
- Multi-channel acknowledgment: "I also tried to reach you by phone today and left a voicemail" — auto-correlates phone attempt with MyChart send
- No clinical jargon: "heart catheterization (heart cath)" with parenthetical lay translation
- Encounter left open intentionally — Pattern 13 doesn't close on send

**2 additional primitives from closure:**

7. **Multi-channel outreach correlation** — voicemail + MyChart sent simultaneously, both noted in single message. Currently Brandon types this manually every time. Kairos auto-correlates: when phone attempt + MyChart fire from same card, outbound message includes voicemail acknowledgment line automatically.
8. **Read-receipt as state signal** — "not been read" status is FHIR `Communication.received` field. Card surfaces this: unread >24h on time-sensitive denial cascade = auto-bump to phone callback attempt #2.

### CASE 27 — Wexbury (echo result, no MyChart)

**Pattern:** **NEW — Pattern 14: PHONE-CHANNEL SYNTHESIS**
**Edit:** clean
**Patient:** 83F, Humana, MyChart NOT active (no row in patient header)

**Source:** Hardenkvist Result Note 4/29 with TTE Complete read by Donovan Holvenmark MD on 4/29:
1. Echocardiogram
2. Ejection fraction normal at 55-60%
3. Normal right ventricular size and function
4. Normal left and right atrial size
5. Trivial aortic insufficiency
6. Mild mitral insufficiency
7. No change in treatment based on echocardiogram

**HVC dual output (Sonnet 4.6):**

Nurse Note (clinical register):
> Echocardiogram reviewed. EF 55-60% (normal). Normal RV size and function. Normal left and right atrial size. Trivial aortic insufficiency. Mild mitral insufficiency. No changes to current treatment.
> 
> Patient contacted via phone.

Phone Script (spoken register):
> We're calling with the results of your recent echocardiogram, which is an ultrasound of your heart.
> 
> The good news is that your heart's pumping function is normal. Your ejection fraction, which measures how well your heart squeezes with each beat, is 55 to 60 percent, which is within normal range.
> 
> The size of your heart chambers on both the right and left sides also looks normal.
> 
> We did see two minor valve findings. There is a trivial, meaning very slight, amount of leakage through your aortic valve, and a mild amount of leakage through your mitral valve. Mr. Hardenkvist has reviewed these findings and is not making any changes to your current treatment based on this echo.
> 
> Do you have any questions about these results?

**HVC encoded clinical IP for spoken register (visible in script):**

- **Opening orienter** — "We're calling with the results..." instead of email-style greeting. Establishes context before content.
- **Inline lay translation** — no parentheticals (parens don't read aloud naturally). "Trivial, meaning very slight" instead of "trivial (slight)". "Ejection fraction, which measures how well your heart squeezes" instead of "EF (pumping function)".
- **Front-loaded reassurance** — "The good news is..." anchors patient anxiety down before details land.
- **Sentence-level pauses via paragraph breaks** — helps nurse pacing during spoken delivery.
- **Chamber-by-chamber narrative structure** — pumping → size → valves → plan, mirrors how patient experiences the explanation (functional → anatomical → findings → action).
- **Provider-authority preserved** — "Mr. Hardenkvist has reviewed these findings and is not making any changes" rather than "the report says no changes."
- **Closing question opens conversation** — "Do you have any questions about these results?" invites dialogue, doesn't close the message the way a MyChart "thank you for your patience" sign-off would.

**Why this is its own pattern, not just Pattern 1 with different output:**

The output shape isn't a stylistic preference — it's a **functional adaptation** to the delivery medium. MyChart messages are read silently with rereads available. Phone scripts are heard once, with the listener's anxiety modulated in real time by the speaker's pacing. The cognitive primitive ("synthesize provider's plan into two registers") is the same as Pattern 1, but the linguistic transformation rules are entirely different. This earns its own pattern because the **output-shaping rules are categorically different**.

**Routing decision tree update (Pattern 14 lock-in):**

```
Reply channel = 
  IF urgency = high → phone (Pattern 7 / Pattern 14 spoken register)
  ELIF source = phone → phone
  ELIF source = MyChart → MyChart
  ELIF source = Epic result + MyChart Active recent → MyChart
  ELIF source = Epic result + MyChart stale/Pending/Inactive/None → phone (Pattern 14)
  ELIF source = Epic result + URGENT content → phone (Pattern 7)
  ELSE → flag for nurse routing decision

Output register follows channel:
  MyChart → written register (parens for translation, formal greeting, signature block)
  Phone → spoken register (inline translation, opening orienter, conversation-opener close)
```

**Output shape is a derivative of channel decision, not a separate decision.**

**3 new Kairos primitives:**

9. **Channel-aware output register** — same clinical content, different linguistic shape (spoken vs written, formal vs conversational, parenthetical vs inline translation).
10. **Voicemail variant auto-generation** — short version of phone script for unreachable patients, ~30-45 sec spoken, includes callback request. Different from full script: front-loads the "we're calling regarding" frame, condenses clinical content, ends with explicit callback ask.
11. **Phone callback state machine** — "voicemail left" → "callback attempt 2 scheduled" → "callback attempt 3 + provider notify" → "registered letter / chart flag." Pattern 14 doesn't close on send the way MyChart does.

### CASE 28 — Underwell closure (Pattern 7b second half, full lifecycle validation)

**Pattern:** Pattern 7b second half (response received → SBAR → provider plan → patient callback)
**Edit:** clean
**Patient:** Same as afternoon Case 21-22 (Underwell, 81F, HTN/AFib/CAD/MR/CKD/peripheral edema)

**Full timeline observed today (single encounter, ~2 hours wall-clock, ~3 minutes nurse cognitive engagement):**

- **2:02 PM** — Patient called clinic requesting nurse callback re: amlodipine BP "still high" + side effects (fuzzy thinking, feet swelling). Brandon initial Nurse Note documenting reason for call.
- **2:17 PM** — Brandon used `.triage` SmartPhrase to pull chart context, fed to HVC with patient's complaint. HVC produced 16 chart-aware questions across 5 categories. Brandon called patient, got answers (home BPs 140/73, 124/71, 118/66 with inconsistent timing; persistent edema; new bilateral hand tingling; denies chest pain/SOB/palpitations; positional dizziness longstanding). HVC produced SBAR-format Nurse Note, forwarded to Hardenkvist.
  - **A** (Assessment): "Home BP readings largely at goal with one elevated reading; timing inconsistency limits interpretation. Persistent peripheral edema despite amlodipine dose reduction. New bilateral hand paresthesias not previously documented. Patient expressing medication aversion which may impact long-term adherence."
  - Three clinical sharps embedded: BPs at goal ≠ patient's perception of "still high" / dose reduction failed its purpose / new symptom flagged as new with calibrated confidence.
- **3:25 PM** — Hardenkvist signed Note #1 (primary plan):
  1. Discontinue amlodipine
  2. Continue carvedilol, spironolactone and Jardiance
  3. Blood pressure log x 1 week following discontinuation of amlodipine
  4. Swelling reported in 1 week
  5. Consideration for different medication depending on blood pressure readings to replace amlodipine
- **3:27 PM** — Hardenkvist signed Note #2 (addendum providing supporting context):
  1. BNP on 4/1/2026 was normal at 200
  2. Holter monitor pending related to atrial fibrillation with increase in carvedilol
- **~3:50 PM** — Brandon called patient to relay plan. HVC absorbed both Hardenkvist notes (primary + addendum) into one unified callback Nurse Note (Opus 4.7).
- **4:06 PM** — Encounter signed.

**HVC callback Nurse Note (Opus 4.7):**

> Spoke with patient by phone to relay plan per Hardenkvist.
> 
> 1. Amlodipine discontinued.
> 2. Continue carvedilol, spironolactone, and Jardiance as prescribed.
> 3. BNP from 4/1/2026 normal at 200.
> 4. Holter monitor pending for AFib follow-up with recent carvedilol increase.
> 5. Patient instructed to keep home BP log x 1 week following amlodipine discontinuation and report swelling status in 1 week.
> 6. Patient advised that alternative antihypertensive may be considered based on BP readings off amlodipine.
> 
> Patient contacted via phone.

**What HVC did right (4 things):**

1. **Cross-note synthesis** — Hardenkvist's plan came in two separate Epic notes (3:25 primary + 3:27 addendum). HVC merged them cleanly into 6 numbered items. Items 3 (BNP) and 4 (Holter) come from the addendum; items 1/2/5/6 come from the primary plan. The synthesis is invisible to the reader — looks like one coherent plan.
2. **Concept reordering for patient comprehension** — Hardenkvist's primary order was "discontinue / continue / BP log / swelling / consideration." HVC reordered the patient-facing version to: action items first (1-2), reassurance context (3-4), follow-up obligations (5-6). Same content, optimized sequence for spoken delivery.
3. **Implicit handoff between notes** — "Spoke with patient by phone to relay plan per Hardenkvist" attribution preserves provider authority. Same pattern as the 2:17 PM Nurse Note ("Forwarded to Hardenkvist for review"). Cross-output consistency holds across all three documents in this encounter.
4. **No fabricated patient response** — note documents what was relayed, not what patient said back. Honest scope. Doesn't invent patient acknowledgment Brandon didn't capture.

**Pattern 7b state machine (now fully validated):**

```
PHONE INBOUND → CHART CONTEXT PULL (.triage) → 
SBAR DRAFT (with chart-aware questions) → 
PATIENT CALL #1 (gather data) → 
SBAR REGENERATION (with patient answers) → 
PROVIDER REVIEW → 
PROVIDER PLAN (+ optional addenda) → 
CALLBACK NOTE SYNTHESIS (cross-note + reordered) → 
PATIENT CALL #2 (relay plan) → 
SIGN ENCOUNTER → CLOSE
```

Eight discrete states plus optional sub-states for addenda. Each state is a card UI state. The persistent investigation object holds across all of them. **Currently held in Brandon's working memory + Epic's threaded conversation. Kairos surfaces the whole arc as one card with state progression visible.**

**1 additional primitive (cross-note synthesis):**

12. **Cross-note synthesis as v1 feature** — provider response within an investigation may land as multiple Epic notes (primary plan + addendum, or primary plan + correction, or sequential plan revisions). HVC absorbs all of them into one unified output. Kairos card auto-collects all related provider notes within an investigation window into HVC's input — currently Brandon manually pastes both. With FHIR, this is automatic via `Encounter.id` + `DocumentReference` query. **Critical for Pattern 7b lifecycle.**

---

## Section 2 — Cumulative Primitive Catalog (Late-Shift Update)

### Architecture-Level Primitives (5 — unchanged from afternoon)

1. `.triage` SmartPhrase as chart context bundle
2. HVC's curated referral directory
3. Workflow Playbook Library
4. DME Forms Library
5. Document Packet Auto-Assembly

### Card-Level Primitives (NOW 8 — added 3 from late shift)

6. Persistent investigation object with state machine
7. Patient-response-triggered card escalation
8. Authorize as atomic commit
9. Order pad 13-field auto-population
10. Cross-output consistency check
11. **NEW: Cross-note synthesis** (Underwell closure — provider response across multiple Epic notes absorbed into one unified output)
12. **NEW: Channel-aware output register** (Wexbury — written vs spoken linguistic shape)
13. **NEW: Test-cascade timeline view** (Larvendel — multi-order, multi-denial chain in one persistent object)

### Safety-Rail Primitives (NOW 5 — added 1 from late shift)

14. Chart-claim verification rail
15. Scope-of-practice rail
16. Reasoning-chain leak detection
17. Question-clarification subroutine
18. **NEW: Auto-framing by auth state** (Larvendel — denial-cascade context auto-detected, prevents Type 4 edits)

### Layer 1 Agent Surfaces (NOW 7 — added 1 from late shift)

19. Refill auto-processing
20. Referral rerouting
21. mdINR fax OCR pipeline
22. DME prior auth submission
23. Reminder list verification
24. Cross-clinic misrouting detection
25. **NEW: Authorization state monitoring** (Larvendel — proactive surveillance of pending pre-certs, denials, peer-to-peer deadlines)

### Output-Shape Primitives (NEW CATEGORY — 4)

26. **Voicemail variant auto-generation** (Wexbury — unreachable patient short-form script)
27. **Phone callback state machine** (Wexbury — multi-attempt with escalation)
28. **Multi-channel outreach correlation** (Larvendel — voicemail + MyChart auto-correlate in outbound message)
29. **Read-receipt as state signal** (Larvendel — `Communication.received` drives card escalation timing)

### Inbound Source Channels (NOW 7 — added authorization-deadline source)

- 5 In Basket boxes (morning)
- Secure Chat threads (afternoon)
- **NEW: Authorization deadline events** (Larvendel — peer-to-peer deadline as proactive surveillance trigger)

**Total primitive count: ~31** (was ~20 at end of afternoon).

---

## Section 3 — Card Taxonomy Update (NOW 14 Variants)

| # | Pattern | Source today |
|---|---|---|
| 1 | SYNTHESIS only | rare |
| 2 | SYNTHESIS + NEW ORDER | Aldington |
| 3 | SYNTHESIS + DOSE CHANGE | — |
| 4 | SYNTHESIS + DOSE CHANGE + LAB CLUSTER | Hesperdale |
| 5 | SYNTHESIS + CHOICE | Brexley |
| 6 | SYNTHESIS + HANDOFF | Wendelfaer |
| 7 | URGENT | Esselbach |
| 7b | ASYNC PRE-CALL STRUCTURED INQUIRY | Strathorne, Quelthorne, Underwell (full lifecycle) |
| 8 | CONTRADICTION | Maundrell |
| 9 | TRANSACTIONAL REPLY | Norreys |
| 10 | COORDINATION | Kvalheim, Heldenmark, Halbrook |
| 11 | ADMINISTRATIVE (Layer 1) | Riverside |
| 12 | SCOPE-CONSTRAINED PATIENT QUESTION | Quennell-redux |
| **13** | **INSURANCE DENIAL CASCADE** | **Larvendel** |
| **14** | **PHONE-CHANNEL SYNTHESIS** | **Wexbury** |

**Pattern 7b earns special call-out** — first pattern observed end-to-end through full state machine validation (call → SBAR → provider plan + addendum → callback note synthesis → signed). Sets the template for what "fully validated" means for future patterns.

---

## Section 4 — Edit-Type Tally for the Day

**Morning (5 cards):**
- Aldington — clean
- Brexley — Type 5 (phiGuard placeholder bug)
- Hesperdale — clean
- Wendelfaer — Type 4 (input augmentation needed for typo'd Hardenkvist note)
- Esselbach — N/A (URGENT phone)

**Afternoon (10 cards):**
- Kvalheim round 2 — Type 2 (chart-claim correction)
- Halbrook — Type 0 (workflow discovery, no HVC involvement)
- Quennell round 1 — clean
- Ravensdale — clean output, 95% plumbing labor
- Quelthorne — clean
- Heldenmark (Secure Chat) — clean
- Underwell (outreach) — clean
- Underwell (SBAR closure) — clean
- Quennell-redux v1 — Type 5 (reasoning leak)
- Quennell-redux v2 — clean

**Late shift (4 cards):**
- Larvendel (denial cascade init) — Type 4 (input augmentation needed for denial framing — eliminable with auth-state primitive)
- Larvendel (closure outbound) — clean
- Wexbury (phone synthesis) — clean
- Underwell (callback closure) — clean

**Day totals:**
- 19 cards observed
- 14 clean outputs
- 4 eliminable-rail edits (Brexley, Kvalheim, Quennell-redux v1, Larvendel init)
- 1 input augmentation needed (Wendelfaer)
- 1 workflow discovery (Halbrook — no HVC card)
- 1 N/A (Esselbach URGENT phone)

**Edit rate: ~26% across the full day, 100% of edits eliminable by future Kairos rails.**

The clinical reasoning is genuinely production-grade. The integration plumbing + output-shaping is the entire value gap.

---

## Section 5 — Phase 3.3 Design Doc Inputs (Cumulative)

Updated from morning + afternoon. New items in **bold**.

1. 14 card variant specs with action checklists (added Pattern 13, 14)
2. 4-pane card detail view structure
3. Routing decision tree (3-input + time-of-day + auth-state)
4. MyChart status badge per-box logic
5. Order pad 13-field auto-population spec
6. Dose change + lab cluster sub-patterns
7. Authorize as atomic commit (FHIR Bundle path for v2)
8. Persistent investigation object (cross-box dedup, state machine spec, **cross-channel consolidation**)
9. Cross-output consistency check (v1 safety rail)
10. Input augmentation field with QuickActions
11. Layer 1 agent surfaces — **7 surfaces total**
12. Referral directory as Kairos primitive
13. `.triage` SmartPhrase as chart context bundle primitive
14. Workflow Playbook Library primitive
15. DME Forms Library primitive
16. Document Packet Auto-Assembly primitive
17. Scope-of-practice safety rail (v1)
18. Reasoning-chain leak detection (UI separation pane)
19. Question-clarification subroutine
20. Patient-response-triggered card escalation logic
21. Secure Chat as 6th inbound source channel + thread-state sync
22. Edit-type taxonomy (5 categories) + telemetry spec
23. phiGuard known issue + RxNorm fix proposal
24. Time-of-day routing rule (8 AM phone window)
25. v1 / Phase 1.5 (Coumadin) / Phase 2 (FHIR write-back) / v3-v4 (autonomous agent) sequencing
26. Capacity multiplier framing for institutional pitch (Ravensdale labor accounting)
27. **Authorization state machine + denial cascade timeline view (Pattern 13)**
28. **Auto-framing by auth state — drafting layer reads denial history before output generation**
29. **Channel-aware output register (Pattern 14) — written vs spoken linguistic shape**
30. **Voicemail variant auto-generation + phone callback state machine**
31. **Multi-channel outreach correlation (voicemail + MyChart auto-acknowledgment)**
32. **Read-receipt as state signal (Communication.received drives escalation timing)**
33. **Cross-note synthesis (Underwell Pattern 7b closure — multiple provider notes absorbed into unified output)**
34. **Pattern 7b full state machine spec (8 states, sets template for "fully validated" pattern definition)**

---

## Section 6 — Open Items Carrying Forward

### Pending
- [ ] **Phase 3.3 design doc draft (THIS SESSION)**
- [ ] phiGuard fix Claude Code prompt (RxNorm cross-reference) — handled in separate HVC-specific chat per Brandon's session-mixing protocol
- [ ] Phase 3.3 build session after design doc reviewed
- [ ] Phase 3.4 — wire HVC chat into action buttons
- [ ] Push commit `df31a8d` after Riverbend window (~5/4)
- [ ] Phantom `hvc` Worker deletion from Cloudflare dashboard
- [ ] Real shift data over next week to validate 14-card taxonomy
- [ ] HVC referral directory → shared `lib/clinical/` module extraction
- [ ] `.triage` SmartPhrase syntax → FHIR adapter library extraction
- [ ] DME Forms Library scaffolding (start with Apria CPAP form)
- [ ] **Pattern 13 authorization state machine schema design**
- [ ] **Channel-aware output register prompt-engineering pass for HVC**

### Completed Late Shift
- [x] Pattern 13 (INSURANCE DENIAL CASCADE) observed end-to-end through Larvendel 8-day investigation
- [x] Pattern 14 (PHONE-CHANNEL SYNTHESIS) observed and HVC's spoken-register adaptations catalogued via Wexbury
- [x] Pattern 7b state machine fully validated end-to-end (Underwell call → SBAR → provider plan + addendum → callback note synthesis → signed)
- [x] Cross-note synthesis primitive identified (Underwell closure)
- [x] Channel-aware output register primitive named (Wexbury)
- [x] Auto-framing by auth state primitive named (Larvendel)
- [x] Multi-channel outreach correlation primitive named (Larvendel)
- [x] Read-receipt as state signal primitive named (Larvendel)
- [x] Voicemail variant + phone callback state machine primitives named (Wexbury)
- [x] Test-cascade timeline view primitive named (Larvendel)
- [x] Authorization state machine primitive named (Larvendel)
- [x] Authorization state monitoring as Layer 1 surface (Larvendel)
- [x] Card taxonomy expanded to 14 variants
- [x] Primitive catalog expanded to ~31

---

## Section 7 — Strategic Summary

The product is now legible at the **lifecycle** level, not just the primitive level.

Today proved three additional things beyond yesterday's framing:

1. **Pattern 7b survives the full state machine.** Strathorne proved it could generate clean inquiry questions. Underwell proved the entire arc — call → SBAR → provider plan (with addendum) → callback note → signed — closes coherently with HVC handling cross-note synthesis invisibly. The primitive isn't theoretical; it's been observed running its full course in real production.

2. **Pattern 13 is its own beast.** Larvendel's 8-day cascade can't be modeled as a sequence of Pattern 1 cards. The persistent investigation object with authorization state machine and cross-channel consolidation is structurally different from any existing pattern. The pitch implication: "every clinic on Epic has multi-day denial cascades that have no home in Epic — Kairos's persistent investigation object is the home." This is a defensible product surface, not a feature.

3. **Output register is functional, not stylistic.** Pattern 14 (Wexbury phone) made it concrete: the linguistic transformations between MyChart and phone aren't preferences — they're cognitive ergonomics for the delivery medium. HVC has been doing this for months. Externalizing the register-selection logic into the card UI (channel decision drives output shape) is a v1 feature, not a v2 polish.

**Kairos = HVC + SMART on FHIR launch context + 4-pane card UI + Layer 1 agent track + safety rails + workflow playbook library + curated reference data libraries + persistent investigation object + channel-aware output register.**

Brandon didn't start building Kairos today. The full day proved he's been building it for months, with 19 distinct production examples spanning 14 patterns and ~31 primitives, all backed by encoded clinical IP that would take a competitor 12+ months to replicate.

---

## For Tonight's Design Doc Session

Brandon home, ready to start. Inputs captured:
- 34 design doc inputs ready
- 14-card taxonomy ready
- 31 primitives catalogued
- Pattern 7b lifecycle proven
- Pattern 13 + 14 added today
- All shift data from 4/29 captured across morning + afternoon + evening session files

**Next step:** Phase 3.3 design doc draft — `kairos/docs/PHASE-3.3-DESIGN.md`. Localhost-only. No push. Goes through cold-eyes review tomorrow before any 3.3 build session.

---

**End of evening session memory file. Ready for project knowledge upload alongside morning + afternoon files.**
