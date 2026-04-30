# Kairos Session — 2026-04-29 Morning Shift Walkthrough

**Purpose:** Live in-clinic workflow walkthrough at Phelps Health cardiology. Real Epic inbox observed screen-by-screen to develop Phase 3.3 card UI spec for Kairos. Source material for design doc.

**Status:** Pre-merge into `docs/CONTEXT.md`. Read alongside `KAIROS-CONTEXT.md` and `KAIROS-CONTEXT-ADDENDUM-2026-04-28.md`.

**Author:** Brandon, with Claude as scribe.

---

## TL;DR — What Was Locked In Today

1. **11 card variant taxonomy** — concrete patterns observed in real shift, not theoretical.
2. **Routing decision tree** — three-input (source channel × MyChart status × urgency) with time-of-day rule.
3. **MyChart status badge** is per-box (outbound boxes show, source-determined boxes hide).
4. **Card detail view** = 4-pane structure: Source / Nurse Note / MyChart / Order pad.
5. **Authorize = atomic commit** (sign Note + send MyChart + pend Order(s) + cosign route + mark done in one tap).
6. **Order pad auto-population** is a 13-field spec — every field derivable from HVC plan + chart context.
7. **Persistent investigation object** deduplicates across boxes from day one.
8. **Cross-output consistency check** is the v1 safety rail catching phiGuard misfires.
9. **Layer 1 agent surfaces** are a separate roadmap track — refills, referral reroute, fax OCR. Not cards. Background processes that prevent cards from existing.
10. **HVC's referral directory is a Kairos primitive**, not a feature. Already-curated knowledge module powering COORDINATION cards, HANDOFF cards, and future autonomous reroute agent.
11. **phiGuard known issue locked in** — drug brand names false-positive as PHI. RxNorm cross-reference fix proposed.
12. **Productivity differential observed** — Brandon clearing 4/5 Results Follow-Up cards before 8 AM phone window opens.

---

## Section 1 — The Five Inbox Surfaces (4/29/26 Morning)

Brandon walked through each Epic In Basket box he checks every morning. Workload accounting from this single morning:

### Surface 1 — Results Follow-Up (5 of 20 patients filtered Provider=Ballard)

- Aldington (61M, CTA chest, mild AS) — SYNTHESIS + NEW ORDER
- Brexley (63F, lipid panel, statin choice) — SYNTHESIS + CHOICE
- Calderwood (55F, lipid + chem-8, Crestor 40 increase) — SYNTHESIS + DOSE CHANGE + LAB CLUSTER
- Drennan (28F, CTA abdomen + incidental pancreatic cyst → PCP handoff) — SYNTHESIS + HANDOFF
- Esselbach (87F, BNP 1024 + pre-op surgery 5/14) — URGENT (phone)

### Surface 2 — Rx Request (6 of 6 patients filtered Provider=Ballard)

Brandon's refill rule: verify last appt ≤12mo + future appt scheduled + dx match → fill 365 days.

- Felgenhauer, Gallichan, Holcombe, Inkpen, Jorgan — auto-eligible Layer 1
- Karstens (Jardiance, Antihyperglycemic Protocol FAILED) — HOLD, requires nurse review

5/6 auto-clear pre-arrival in Kairos Layer 1.

### Surface 3 — Patient Call (4 of 28)

- Lyttleton (66M) — single patient with 2 sub-tasks routed by front desk Adelaide Crowley:
  1. Scheduling escalation (Tregarthen next avail September, patient asking earlier)
  2. Albuterol refill (likely cross-box duplicate with Rx Request)
  
Source channel = phone, so reply channel = phone despite MyChart Active. Recent Patient Communication panel shows 4 cardiology touchpoints yesterday + procedure instructions 2d ago = active investigation.

### Surface 4 — Pt Advice Request (3 of 10)

Both cards are REPLIES to Brandon's prior outbound MyChart messages, not new patient-initiated:

- Maundrell (74M) — INR overdue template, patient replied: *"Dr. M told me to be taking only the other two medications and also said I don't have to take the blood test anymore."* CLINICAL CONTRADICTION: chart shows active warfarin. Cannot resolve from chart alone — must forward to Marchetti. HOLD all action.
- Norreys (65M, 370lb) — INR 3.9 hold/dose decrease 6.5→6mg sent 4/21, patient replied today *"Need refill 6mg warfrin"*. Pure transactional confirmation. TRANSACTIONAL REPLY.

Box rule: source=MyChart so default reply=MyChart unless content forces phone upgrade.

### Surface 5 — My Open Messages (custom search)

Brandon-built custom search filtering "addressed to me" — Epic standard view shows pool not recipient. **All 5 patients shown were duplicates of Results Follow-Up box.** PROOF POINT: Kairos's unified queue (provider-pool ∪ recipient, deduplicated) eliminates this Epic UI gap entirely.

### Workload Accounting

- Across 5 boxes: **14 unique items**
- ~5 auto-clear via Layer 1 agent (refills)
- ~5 one-tap via Layer 2 staging (synthesis cards)
- ~4 require real cognitive engagement (Karstens, Esselbach, Brexley, Maundrell)

---

## Section 2 — The Routing Decision Tree (Codified)

Three-input routing: source channel × MyChart status × urgency override.

```
Reply channel = 
  IF urgency = high → phone (regardless of source)
  ELIF source = phone → phone
  ELIF source = MyChart → MyChart
  ELIF source = Epic result + MyChart Active recent → MyChart
  ELIF source = Epic result + MyChart stale/Pending/Inactive → phone
  ELSE → flag for nurse routing decision

Sort: urgency desc → channel (MyChart first) → time received
Time-of-day rule: urgency override doesn't fire pre-8 AM (phone window)
```

### MyChart Status Badge — Per Box

- **SHOW BADGE** (outbound routing decision): Results Follow-Up, Rx Request, INR Reminder, Coumadin
- **HIDE BADGE** (source channel already determines reply): Patient Call, Pt Advice Request

---

## Section 3 — The 11 Card Variant Taxonomy

Concrete variants observed in real shift work, with action checklists each:

1. **SYNTHESIS only** — pure documentation
2. **SYNTHESIS + NEW ORDER** (Aldington) — plan includes new diagnostic study or referral, order pad pre-staged
3. **SYNTHESIS + DOSE CHANGE** — med modification, no labs
4. **SYNTHESIS + DOSE CHANGE + LAB CLUSTER** (Calderwood) — most field-heavy variant
5. **SYNTHESIS + CHOICE** (Brexley) — two-stage with conditional staged orders
6. **SYNTHESIS + HANDOFF** (Drennan) — cross-specialty referral
7. **URGENT** (Esselbach) — phone-routed regardless of MyChart status
8. **CONTRADICTION** (Maundrell) — clinical safety hold
9. **TRANSACTIONAL REPLY** (Norreys) — MyChart confirmation round-trip
10. **COORDINATION** (Lyttleton) — multi-task across boxes, persistent investigation
11. **ADMINISTRATIVE (Layer 1 agent)** — refills, faxes, referral reroutes. Not cards — background processes.

---

## Section 4 — Card Detail View (4-Pane Spec)

Card is the encounter mirror. HVC drafts INTO destinations. Don't navigate to HVC.

```
┌──────────────────────────────────────────────────────────────┐
│ PATIENT HEADER                                MyChart: Active │
│ Aldington, Charles  61M  DOB ___  MRN ___                       │
├──────────────────────┬───────────────────────────────────────┤
│ SOURCE PANE          │ NURSE NOTE PANE                        │
│ Ballard's Result     │ HVC-drafted, pinned to source.         │
│ Note (pinned for     │ Edit inline as needed.                 │
│ verification)        │                                        │
├──────────────────────┼───────────────────────────────────────┤
│ MYCHART MESSAGE      │ ORDER ENTRY PANE                       │
│ Recipient + proxy    │ Order: Transthoracic echo (TTE)        │
│ auto-filled          │   Variant: ECH110 STERNE BR            │
│ Subject auto-filled  │   Future date: 4/29 First Available    │
│ Notify-by 5/1/2026   │   Class: Routine                       │
│ Replies setting auto │   Reason: [from HVC plan]              │
│ Greeting auto        │   Associated dx: Mild AS, Mild AR      │
│ Body HVC-drafted     │   Cosign: Ballard                      │
├──────────────────────┴───────────────────────────────────────┤
│  + Add context [QuickActions: I forwarded to PCP / I called  │
│    patient and reviewed / Patient agreed to plan via phone]  │
├───────────────────────────────────────────────────────────────┤
│         [ Authorize ]  [ Edit ]  [ Defer ]  [ Reject ]        │
└───────────────────────────────────────────────────────────────┘
```

### Order Pad Auto-Population (13 Fields Derivable)

1. Order type (from HVC plan)
2. Code variant (user preference list — STERNE BR variant)
3. Reason for exam (HVC plan verbatim)
4. Associated dx (problem list cross-ref against HVC reasoning)
5. Priority
6. Class
7. Status
8. Expected date defaults
9. Expires defaults
10. Clinical questions (block Authorize until clicked)
11. Release to patient toggle
12. CC Results
13. Cosign route

---

## Section 5 — The Five Patient Round-Trips

### CASE 1 — Aldington (6:41 AM Result → 7:38 AM Sent, ~4 min)
SYNTHESIS + NEW ORDER. HVC dual output clean. TTE Complete ECH110 STERNE BR ordered, Future / 4/29/2026 First Available / Routine, Mild AS + Mild AR diagnoses, Ballard cosign. Done.

### CASE 2 — Brexley (PHIGUARD BUG CAUGHT)
SYNTHESIS + CHOICE. **HVC OUTPUT BUG:** MyChart message rendered "we can switch your Zetia to a combination medication called **[Patient Name]** (180/10mg daily)". Nexlizet replaced by `[Patient Name]` placeholder.

**Root cause:** HVC's phiGuard PHI filter false-positives on capitalized brand names. Generic names (lovastatin, atorvastatin, warfarin) survive because lowercase + dictionary-known. Brand names = failure surface.

**At-risk drugs:** Nexlizet, Jardiance, Repatha, Eliquis, Brilinta, Entresto, Farxiga, Praluent, Corlanor, Vascepa.

**Proposed fix — RxNorm cross-reference:** Before redacting any token as a name, check against RxNorm drug list. If in RxNorm, skip redaction.

### CASE 3 — Calderwood (~14 actions, 4-5 min)
SYNTHESIS + DOSE CHANGE + LAB CLUSTER. HVC output clean. Crestor 40mg → DC old 20mg → Lipid Panel + Hepatic Function Panel both Future 7/29/2026, Other hyperlipidemia dx, Sign Encounter.

### CASE 4 — Drennan (Input Augmentation Pattern Discovered)
SYNTHESIS + HANDOFF. Ballard's note had typo "**Lease** forward to PCP" (P missing). Brandon disambiguated by giving HVC explicit context: "i have forwarded the results to PCP as requested." HVC then rendered both registers correctly.

**Input augmentation primitive:** Card detail view needs `+ Add context` field with QuickActions:
- "I have forwarded the results to PCP as requested"
- "I have called the patient and reviewed results"
- "Patient agreed to plan via phone"
- "Patient declined Option 1, going with Option 2"

### CASE 5 — Esselbach
URGENT variant. BNP 1024 + pre-op surgery 5/14. MyChart Pending → phone-only. Made phone call after 8 AM.

---

## Section 6 — Lyttleton Case (Patient Call) + Layer 1 Reroute Agent

Lyttleton (66M) called wanting earlier appointment than Tregarthen's September availability.

**Brandon's insight (codified for spec):**
> *"AI could search the chart for a reason that doctor was chosen, if not it could make the decision and redo the entire referral."*

This is a **Layer 1 agent action** — full automation with nurse confirmation only on edge cases.

### Roadmap Path
- **v1:** Surface alternates ranked by availability on COORDINATION card. Default = "Forward to Ballard with options."
- **v2:** Add specificity classification badge. Generic = green light, Specific = red flag.
- **v3:** Agent executes reroute with nurse one-tap confirmation.
- **v4:** Autonomous reroute for high-confidence generic, audit-only nurse view.

---

## Section 7 — HVC's Referral Directory Is a Kairos Primitive

Brandon's HVC app is loaded with curated EP cardiologist contact information by health system:

```
PHELPS HEALTH / LOCAL: No EP on-site
BARNES JEWISH / WASH U (ST. LOUIS): Tregarthen, Vellacott, Birchington, Reardon Wexford (ablation)
ST. LUKE'S / CLEVELAND CLINIC (ST. LOUIS): Jasper Hennessey, Pelletier, Conrad Quayle
MERCY: Lakshmi Vance (St. Louis), Pranav Tandon (Springfield), Wei-Lin Tao (Springfield)
MISSOURI BAPTIST (STL): single number, no specific physician
MERCY @ WASHINGTON: Garrett Pinwell
SSM HEALTH FENTON: Damian Holcrest
COX HEALTH (SPRINGFIELD): Marcus Selwyn Trent
```

**Significance:** the hardest piece of the autonomous reroute pipeline (curated referral directory) is already done. Epic's built-in directory is generic and incomplete. HVC has:
- Right health systems for geography
- Specific physicians at each, by name
- Sub-specialty annotations (Reardon Wexford = ablation/"hit table")
- Phone + fax for direct routing
- Explicit "no EP at Phelps" framing

### Architectural Implication

HVC's referral directory becomes a **Kairos-shared knowledge module** — `lib/clinical/referralDirectory.js`. Single source of truth feeds:
- HVC chat ("who do I send this person to")
- Kairos COORDINATION cards (alternate provider rankings)
- Kairos HANDOFF cards (PCP routing)
- Future autonomous reroute agent (provider candidate pool)

**Pattern observation:** *Wherever Epic's reference data is bad, Brandon has already built the better version in HVC.*

---

## Section 8 — Layer 1 Agent Surfaces (Separate Roadmap Track)

Three Layer 1 agent surfaces identified today. Not cards — background processes that prevent cards from existing:

1. **Refill auto-processing** — Karstens-excluded, 5/6 of Rx Request box clears autonomously
2. **Referral rerouting** — Lyttleton case, with HVC referral directory as foundation
3. **mdINR fax OCR pipeline** — Coumadin Clinic, longitudinal series extraction

### Pitch Framing

If Kairos's pitch line for synthesis pattern is *"clear your inbox in 1/4 the time,"* Layer 1 agent pitch line is *"items don't reach your inbox in the first place."*

This isn't "AI replaces nurses." It's "AI un-misassigns work that shouldn't have been nursing work to begin with."

---

## Section 9 — Cross-Output Consistency Check (v1 Safety Rail)

Pre-Authorize, extract drug names from Nurse Note + MyChart message. Flag mismatches.

**Aldington/Brexley case:** would catch "Nexlizet" vs "[Patient Name]" mismatch. Belt + suspenders even if phiGuard misfires.

Also: dose mismatches, drug name typos (Nexlizett vs Nexlizet), dx code drift between panes.

---

## Section 10 — Productivity Multiplier (Documented)

### Per-card Timing (Brandon's actual observed)
- Synthesis card open → MyChart sent + encounter signed + orders placed + Done = ~3-4 min
- Aldington specifically: 7:34 AM open → 7:38 AM sent
- Calderwood ~14 discrete actions, ~4-5 min

### Kairos Projection
- Card opens with everything pre-filled, scan, Authorize = ~10-20 seconds
- 5 cards × 4 min = 20 min currently. Kairos: ~5 min total. **15 min saved before 8 AM phone window even opens.**

### Real Morning (4/29/26)
- 7:00 AM walk in
- 7:50 AM 4/5 Results Follow-Up cleared (Aldington, Brexley, Calderwood, Drennan)
- Esselbach only remaining (URGENT phone)
- 8:01 AM Esselbach call initiated

Real time matches projected morning workflow exactly.

---

## Section 11 — Coumadin Clinic + INR Reminder Box

Brandon runs Coumadin Clinic essentially solo — single-point-of-failure across the clinic.

Workflow: create Anticoagulation-Warfarin Visit encounter, document, plan, route Marchetti cosign. Two paper mdINR faxes on desk: patient name, DOB, INR, draw date, **full historical trend chart printed on form**.

OCR pipeline opportunity: extract longitudinal series (not just today's value). Phase 1.5 priority.

Sample case: **Oxenford** (87M, INR 2.7 in range 2.0-3.0, trend stable). Layer 2 one-tap territory.

---

## Section 12 — Phase 3.3 Design Doc Inputs (Action Items)

1. 11 card variant specs with action checklists
2. 4-pane card detail view structure
3. Routing decision tree (3-input)
4. MyChart status badge per-box logic
5. Order pad 13-field auto-population spec
6. Dose change + lab cluster sub-patterns
7. Authorize as atomic commit (FHIR Bundle path for v2)
8. Persistent investigation object (cross-box dedup)
9. Cross-output consistency check (v1 safety rail)
10. Input augmentation field with QuickActions
11. Layer 1 agent surfaces (refills, referral reroute, fax OCR) as separate roadmap track
12. Referral directory as Kairos primitive (HVC → shared module)
13. phiGuard known issue + RxNorm fix proposal
14. Time-of-day routing rule (8 AM phone window)
15. v1 / Phase 1.5 (Coumadin) / Phase 2 (FHIR write-back) / v3-v4 (autonomous agent) sequencing

---

## Section 13 — Open Items Carrying Forward

### Pending
- [ ] Phase 3.3 design doc (Claude to draft tonight)
- [ ] phiGuard fix — separate Claude Code prompt, RxNorm cross-reference before name redaction
- [ ] Phase 3.3 build session after design doc reviewed
- [ ] Phase 3.4 — wire HVC chat into action buttons
- [ ] Push commit `df31a8d` after Riverbend window closes (~5/4)
- [ ] Phantom `hvc` Worker deletion from Cloudflare dashboard
- [ ] Real shift data over next week to validate 11-card taxonomy
- [ ] Communication scope availability check for Backend Services (Epic)
- [ ] HVC referral directory → shared module extraction (lib/clinical/)

### Completed
- [x] Memory edit for Kairos pivot
- [x] Supabase ca_* tables dropped (clinai scaffold cleanup)
- [x] Box tour walkthrough (5 surfaces)
- [x] 5 patient round-trips observed (Aldington, Brexley, Calderwood, Drennan, Esselbach)
- [x] HVC PHI filter bug diagnosed (drug brand names false-positive)
- [x] 11 card variant taxonomy locked in
- [x] Routing decision tree codified
- [x] HVC referral directory recognized as Kairos primitive
- [x] Layer 1 agent surfaces identified (refills, reroute, fax OCR)

---

## Section 14 — Strategic Summary

The product is even more legible than yesterday.

**Kairos = HVC + SMART on FHIR launch context + 4-pane card UI + Layer 1 agent track + safety rails for multi-nurse use.**

The clinical reasoning that took months to tune already works in production. The referral directory that took months to curate already exists. The sub-specialty annotations, the contact preferences, the geographic routing — all already there.

**The build ahead is integration plumbing and presentation, not new clinical reasoning OR new clinical reference data.**

Brandon didn't start building Kairos today. He realized today (again, more sharply) that he had already built it.

---

## Quick Reference — Files & Identifiers

- **Project knowledge:** `KAIROS-CONTEXT.md`, `KAIROS-CONTEXT-ADDENDUM-2026-04-28.md`, this file
- **Local repo:** `C:\Users\kents\kairos` (commit `df31a8d` local-only, NOT pushed, Riverbend window thru ~5/4)
- **Monorepo:** `C:\Users\kents\firekraker-monorepo` (untouched per Riverbend protocol)
- **HVC Supabase:** `tmpablcrejgfpkkpeeho`
- **SupperMates Supabase:** `inxtnmsjlvpdofxovbpb`
- **Kairos Phase 3.2-fix6 files:** `components/PatientCard.js`, `app/dashboard/page.js`, `docs/log.md`

---

**End of session memory file. Ready for project knowledge upload.**
