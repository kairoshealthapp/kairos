# Kairos — Project Context & Persistent Memory

**Last updated:** 2026-04-27 (evening session — full ClinAI chat history integrated; name scrub applied)
**Maintained by:** Brandon (and future Claude sessions)
**Purpose:** Single source of truth for Kairos. Read this at the start of every Kairos chat and every Claude Code session in the kairos repo. If anything in this file conflicts with assumptions a Claude session is making, this file wins.

---

## Identity & Naming

- **Kairos** is the product name. Public-facing on `kairoshealth.app`. This is what's in the Riverbend application.
- **"ClinAI"** was the internal working name during planning sessions (ClinAI #1, #2, #3, #4 Planning). Same product, same architecture, same vision. Kairos and ClinAI refer to the same thing.
- All future chats and code use **Kairos**. The "ClinAI" name is retired.

---

## CRITICAL: Kairos is NOT HVC. Do not bring HVC patterns into Kairos.

This is the single most important section of this document. HVC and Kairos look superficially similar (both clinical AI, both for outpatient cardiology, both built by Brandon). They are architecturally opposite products and share zero infrastructure.

**HVC patterns that DO NOT apply to Kairos:**

1. **"Human as integration layer."** HVC works because Brandon copy-pastes chart context into the app, then copy-pastes output back into Epic. The nurse IS the data bridge. **Kairos rejects this entirely.** Kairos has bidirectional Epic FHIR integration. The nurse is the air traffic controller (cognitive authority who approves what flies), never the data bridge that moves it. Manual data movement is the defect surface Kairos eliminates.

2. **Shared firekraker-monorepo infrastructure.** HVC lives alongside DebtKiller, LifeOS, etc. with shared `.env.master`, shared Vercel team, shared GitHub repo. **Kairos does not.** Kairos lives in its own private repo (`firekraker1272/kairos`), will eventually have its own Vercel team, dedicated Supabase project, dedicated Anthropic API key. Legal/IP cleanliness is non-negotiable from day one.

3. **Cloudflare Worker as the API surface.** HVC is a Cloudflare Worker. **Kairos is a Next.js application** with proper Epic OAuth flow, FHIR client library, persistent investigation objects in a real database. Different shape entirely.

4. **Anti-reversion architecture (banner blocks, post-processors).** HVC needs this because Sonnet ignores instruction-based rules intermittently and Claude Code edits unrelated logic. Kairos uses production-quality reasoning chains, structured outputs, and validated FHIR responses. Different reliability strategy.

5. **Prompt-based clinical rules with named const blocks.** This is HVC's solution to LLM unreliability in a thin Worker. Kairos has typed schemas, evidence accumulation, versioned regeneratable artifacts, and explicit confidence calibration. Don't drop HVC's "DO NOT MODIFY" const blocks into Kairos.

6. **Hardcoded clinical workflows (Coumadin preprocessor, MyChart attribution fixer).** HVC's workflows are baked into the Worker code. Kairos's workflows are data — cohort definitions, alert rules, investigation object schemas — not hardcoded prompts.

**If a Claude session starts pattern-matching to HVC, stop and re-read this section.** The most common slip is in the early build phase when the prompt structure looks similar.

---

## The North Star

> **Kairos automates the cognitive work nurses do today and removes the nurse from the data-movement loop entirely. The nurse becomes the cognitive authority who approves, denies, or modifies — not the data bridge who copies, pastes, or retypes.**

Brandon's exact framing: *"Remove me from the loop. I just am there to make phone calls when needed, authorize suggestions etc. It needs to do all the research, data collection, note writing. Nurse just approves/denies/modifies as needed."*

Every architectural decision in Kairos is judged against this north star.

---

## Foundational Thesis

Kairos is an automated clinical workflow platform with bidirectional Epic FHIR integration. The systems talk to each other. The nurse never copies, pastes, or retypes anything.

**Customer:** outpatient clinics on Epic.
**Primary user:** outpatient RNs (Phase 1 nurse-only; MA/front desk/provider in later phases).
**Beachhead specialty:** cardiology (proof-of-difficulty).
**Generalization:** workflow shape is constant across specialties; specialty knowledge is a swappable module (acknowledged in post-mortem as multi-quarter investment per specialty, not configuration switch).
**Surfaces:** nurse dashboard for cross-cutting work + Epic-embedded sidebar for single-encounter work. Both, not one.

---

## THE ARCHITECTURAL PRIMITIVE

> **Kairos Phase 1 is not 7-10 separate features. It is ONE primitive — *Chart-Aware Structured Clinical Inquiry* — applied to multiple surfaces.**

The same six-step pattern handles every workflow stream:

1. **Read chart context** (automatic FHIR pull from Epic)
2. **Generate structured inquiry artifact** (questions to ask, decision tree to evaluate, protocol to apply — informed by *that specific patient's* chart)
3. **Capture human-collected evidence as structured data** (patient answers from MyChart pre-visit forms, kiosk tablets, voice transcription, OCR'd faxes, caller reports — all source-tagged: patient / family / outside_clinician / chart)
4. **Regenerate output artifact against accumulated evidence** (versioned, prior reasoning chain preserved, never overwritten)
5. **Nurse approves, edits, or rejects**
6. **Write back to Epic on approval** (structured note, In Basket message, structured data field — all written via FHIR with the nurse as the signing user)

This is the same loop for phone triage, MyChart messages, results follow-up, refills, Coumadin management, BP log analysis, pre-visit med rec, INR reminders, and referral message classification. Different inputs, different output formats, same primitive.

**Pitch frame:** "Kairos is one primitive applied to ten surfaces, not ten features."

---

## The 10 Workflow Streams

### Reactive streams (Phase 1)

1. **Phone triage** — chart-aware question generation, bidirectional Q&A capture, evidence-accumulating SBAR. Whitfield workflow is the canonical proof point.
2. **Results Follow-Up** — Ballinger sends Result Note + clinical questions → Kairos pulls patient context, drafts the patient outreach AND the structured forwarder note simultaneously, nurse approves both. Pemberton pattern.
3. **Rx Request** — Surescripts refill protocol auto-applied (seen last month + future appt scheduled → 90 days/3 refills, dx-associated, cosign-routed to Ballinger). MAs are supposed to work this box but rarely do; pre-staging makes it 90 seconds instead of 5 minutes.
4. **Patient Call** — phone-origin clinical signal, two sub-patterns:
   - **Patient/family-origin** (Devereaux BP log) — answers route through patient (MyChart or callback), patient-friendly framing
   - **Outside-clinician-origin** (Whitfield via Renee VA RN, Linnehan via Amanda Trahan home health RN) — peer-to-peer SBAR framing, higher inherent acuity, real-time stakes
   - **Acuity is partially encoded in caller identity itself** — Kairos detects this signal and shifts framing accordingly.
5. **Pt Advice Request** — patient-initiated MyChart messages OR replies to nurse-initiated outreach. Bidirectional. Diane Hartwell's full round-trip (Ballinger Result Note 6:51 AM → MyChart outreach → patient reply 10:15 AM) crossed three buckets in three hours.
6. **Home INR Faxes** — mdINR paper faxes, 5-10/day. Pure manual transcription today. **Highest-friction analog input** — front desk pulls from fax, walks paper to nurse, nurse manually creates Anticoagulation - Warfarin Visit encounter, types result + history. Strongest "save the clinic from paper" demo. OCR pipeline target.
7. **Secure Chat** — Epic's HIPAA Slack-equivalent, real-time, multi-party threaded messaging tied to MRN. Cross-clinic clarifications, outside records reconciliation, real-time coordination. Threads tie to persistent investigation objects (e.g., Amanda Trahan's note about Linnehan shows up in Linnehan's investigation, not as isolated message).
8. **Pre-Visit Medication Reconciliation** — first pre-visit (not post-encounter) workflow. Patient enters meds via MyChart pre-visit task / kiosk tablet / paper-with-OCR. Kairos compares to Epic med list, surfaces discrepancies for the rooming MA and the nurse. **The defect surface here is documentation fraud at the workflow-step level** — see "MA Attestation Theater" section below.

### Proactive / cohort streams (Phase 1.5 — surveillance, not inbox processing)

9. **INR Reminder** — proactive cohort surveillance. Epic auto-reminds which patients are *due* for an INR check. Kairos surfaces overdue cohort + drift detection + un-seen patients. Different primitive: **patient cohort monitoring**, not single-encounter processing.
10. **Referral Message classification** — high volume (108/day observed 4/27), mostly informational acknowledgments. Kairos auto-classifies and surfaces only the actionable ones. **Noise suppression** primitive.

The **proactive vs reactive distinction is architecturally significant.** Phase 1 is reactive (process inbox events). Phase 1.5 adds the monitoring/alerting layer that runs on schedule.

---

## Canonical Patient Examples (the worked dataset)

These are encounters Brandon documented across ClinAI #1-4 Planning, with all patient and clinician names replaced with fictional substitutes. Synthetic versions of these become the Kairos mock dataset. Each one proves a different aspect of the architecture.

### Phone triage — Whitfield (canonical proof point, currently built)
- 76yo male, CHF + recurrent pleural effusion + COPD + aortic stenosis
- Lasix discontinued 3/1/26 by cardiology; current concern: SOB worse than baseline, weight up 1.5 lb
- Outside-clinician inbound: Renee (VA RN) called 11:01 AM
- Wife answered the questions when Brandon called back
- 31 chart-aware questions generated, organized by organ system
- Evidence-accumulating SBAR with prior reasoning chain preserved across three calls
- **Proves:** chart-aware question generation, outside-clinician peer-to-peer framing, evidence regeneration, answer source tagging (wife = family)

### Phone triage — Marbury (canonical Phase 1 demo target)
- Paper BP log, handwritten, handed to Brandon
- HVC produced clinical signal: *"SBP remains predominantly in 130s-150s with intermittent readings >150 since labetalol initiation; persistent elevation despite five-agent regimen"*
- Manual workflow: ~8-12 minutes. With Kairos: ~30 seconds review.
- **Proves:** OCR pipeline + trend analysis + five-agent regimen failure detection

### Coumadin — Okafor (Tier 2 dosing reasoning)
- Three-factor dosing rationale (INR, dose history, recent labs)
- Lab interpretation: K+ 6.1, hold spironolactone, recheck Thursday
- Med rec embedded in the dosing decision
- **Proves:** Coumadin cohort panel pattern + lab-driven med adjustment + protocol-linked safety chain

### Patient Call (patient-origin) — Devereaux (orthostatic hypotension)
- Raw home BP readings: 96/63, 101/64 — intermittent hypotensive readings post-midodrine start
- Pattern recognition from raw readings, not summary
- 3-day cycle, MyChart inactive → phone path
- **Proves:** pattern recognition from raw clinical data + MyChart-vs-phone routing

### Coumadin subtherapeutic — Linnehan (multi-day, multi-source investigation)
- 5-day cycle including Secure Chat with home health RN Amanda Trahan
- Cross-clinic, cross-source, cross-day
- **Proves:** persistent investigation object across multiple buckets and days + Secure Chat integration

### Hypokalemia — Caldwell
- K+ 3.3, ~2-hour cycle
- MyChart active path → triggered Ballinger re-route → 24-hr urine order placed → new round-trip starting
- **Proves:** rapid-cycle clinical investigation that spawns derivative investigations

### Results Follow-Up — Pemberton (5-question template)
- Ballinger's Result Note triggered structured 5-question follow-up
- **Proves:** structured clinical inquiry as a primitive, even when nurse isn't the inquiry author

### Pt Advice Request bidirectional — Diane Hartwell (full MyChart round-trip)
- 6:51 AM: Ballinger sends Result Note → nurse basket
- 7:03 AM: Nurse pulls med list + last visit (Eftheriou Feb 2026), pastes into HVC
- HVC writes TWO outputs: patient-friendly MyChart message + clinical Nurse Note (Epic addendum) with `[Brandon: verify when atorvastatin initiated]` flag
- 10:07 AM: Patient reads. 10:15 AM: Patient replies via MyChart → lands in Pt Advice Request bucket (bucket transition!)
- **Proves:** dual-output pattern (clinical synthesis + patient-friendly reply from same source) + bucket-crossing investigations + verify-flag pattern for nurse cognitive offload

### MA rooming — Evaline Cosgrove (the attestation theater proof point)
- 50+ medications visible on med list
- 6 "Mark as Reviewed" buttons in 9 minutes (Mira RN's timestamps: 6:41, 6:48, 6:50)
- Five sections (allergies, medications, history, social/family, violence) are pure attestation buttons; only vital signs has actual data entry
- **Proves:** the institution-side ROI story (see MA Attestation Theater section)

### Pre-procedure med management — Sharon Halberg (protocol-linked safety)
- Pre-stress-test med holds: Levothyroxine continue, Metoprolol hold 24h before, Clonidine hold 24h before, both resume after
- Initially missed Clonidine — caught by going back to other nurse (human-to-human verification)
- **Proves:** protocol library hardens the safety chain — Kairos with a protocol library would have flagged the Clonidine omission on the first draft

### Pharmacy / prior auth — Jean Castellanos (Repatha)
- Frustrated multi-issue MyChart message: where is Repatha order, sent Walgreens Springfield address, offers to send again
- Pharmacy benefit / prior authorization workflow
- **Proves:** PA tracking is a distinct workflow with its own state machine — likely a Phase 2 specialized surface, but the primitive still applies

### Other patients flagged for future detail
- Bramwell, Sutherland, Norquist — referenced in PHI awareness, less detailed
- These get filled out as the worked dataset expands across build sessions

---

## Daily Volume & Cognitive Load

Real numbers from Brandon's 4/27 inbox snapshot at 11:25 AM:

| Bucket | Active | Of Total |
|---|---|---|
| Results Follow-Up | 11 | 18 |
| Rx Request | 4 | 12 |
| Patient Call | 9 | 30 |
| Pt Advice Request | 0 | 10 |
| INR Reminder | 0 | 14 |
| MyChart Notifications | 0 | 7 |
| Outside Messages | 0 | 5 |
| Referral Message | 0 | 108 |

**~206 active inbox items, ~101 unread/new across the day so far.** Earlier 55-70 encounters/day estimate was a serious undercount. Even excluding the 108 Referral Messages (mostly informational), real cognitive load is ~100 items/day requiring real clinical processing.

---

## The MA Attestation Theater Finding (institution-side ROI story)

The single most important institutional pitch finding from Brandon's 90 days at Riverbend:

- **25-35% of patients have duplicate or questionable medications on their active med list** (HVC catches them as a byproduct of clinical reasoning)
- MAs click "Medications Reviewed" in seconds despite 50+ medication lists — Evaline Cosgrove review showed 6 attestation buttons in 9 minutes for a patient with 50+ meds
- Epic logs the click but **cannot distinguish the click from the action**
- The MA workflow is structurally **attestation theater, not clinical work**

**Kairos's institutional value here is not workflow efficiency. It is documentation integrity.**

The Kairos pre-visit med rec primitive captures the patient's actual answer independently (via MyChart pre-visit task / kiosk tablet / paper-with-OCR). When the MA clicks "reviewed," Kairos already knows whether discrepancies exist. The "Mark as Reviewed" click only fires when:
- The MA confirmed no discrepancies exist (and Kairos logs *what* was confirmed)
- The MA resolved the discrepancies (and Kairos logs the resolution)

Epic still gets its "medications reviewed" click. But Kairos knows whether the click was earned or fraudulent, because it captured the patient's input independently and can detect the gap.

**The discrepancy surface is the personal cognitive aid for the individual nurse — never management dashboards in v1.** Per the post-mortem: aggregate compliance dashboards are a Phase 2 product requiring nursing leadership co-design before shipping. Discrepancy detection visible to management = "snitch tool" = nursing rebellion.

**Pitch implication:** Kairos can prove the 25-35% med-rec defect rate with Epic's own audit trail data via FHIR query, before Kairos is even installed. That's a defensible, hospital-data-backed metric for the discovery-deliverable / free-audit pitch motion.

---

## Three-Role Architecture (the full clinic OS)

```
FRONT DESK (Phase 3)
├── Kiosk check-in
├── Twilio voice agent (replaces front desk phone-answering)
└── Routes patient calls → nurse Patient Call basket

PROVIDER (Phase 2)        PROVIDER (Phase 2 alt mode)
├── Mode 1: live ordering ├── Mode 2: async notes
├── Replaces Tristan      ├── Replaces DAX subscription
├── Live transcription    ├── Ambient transcription
├── Real-time order       ├── Post-visit SOAP draft
│   extraction            ├── Orders extracted on review
└── Pends orders during   └── 
    visit

         ↓ (orders flow downstream)              

NURSE WORKSTATION (Phase 1 — building first)
├── 8 reactive streams (Results / Coumadin / Rx / Patient Call /
│   Pt Advice / Home INR / Secure Chat / Pre-visit Med Rec)
└── 2 proactive streams (INR Reminder / Referral classification)
```

**Replaced/automated jobs in this clinic OS:**
- Front desk phone-answering (Twilio agent)
- Tristan (live ordering scribe) → Provider Mode 1
- DAX subscription (~$369-600/provider/mo) → Provider Mode 2
- Both nurses for Dr. E + Brandon for Ballinger → Nurse Workstation handles 80-90% of bucket work

**Not replaced (intentionally):**
- The providers themselves (clinical decision-making)
- The nurses themselves (clinical judgment, patient relationships, edge cases the AI flags)
- Front desk humans (in-person greeting, complex insurance, anything kiosk can't handle)

This is a **labor-cost story**, not just a productivity story. Kairos eliminates entire SaaS line items (DAX) AND restructures clinical labor so 80-90% of nurse bucket work is automated.

---

## Three Knowledge Layers

Kairos integrates three distinct knowledge sources (HVC currently has only #1):

1. **Patient knowledge** — FHIR pull from Epic (chart data, current state, history)
2. **Provider preferences** — per-clinician patterns (Ballinger's recheck intervals, Eftheriou's referral preferences, Marston abbreviations, etc.). Learned from prior notes. Personalized clinical drafts.
3. **Clinical guidelines** — ACC/AHA cardiology protocols, drug interaction databases, anticoagulation rules, pre-procedure med management protocols, billing code logic (HCC, E/M, CCM 99490). The protocol-linked safety chain that catches the Sharon Halberg Clonidine omission.

The **specialty-specific knowledge module** is the swappable layer for generalization. Cardiology guidelines are Phase 1; family practice guidelines are a future module; nephrology is another. Same architecture, different module.

---

## Post-Mortem Convergent Failure Modes (from ClinAI #3 stress test)

These are HIGH-CONFIDENCE risks identified by ChatGPT and Gemini independently. Not theoretical — they change the build plan:

1. **Epic write-back is political, not technical.** Hospital CIOs refuse to grant write-scopes to external vendors. Fix: Kairos must be Riverbend internal tool (or co-owned with explicit IP carve-outs), not external company selling to Riverbend. AI Informatics Specialist position is the vehicle. Legal structure pending Riverbend response.

2. **Clinical accuracy is the whole game.** One near-miss attributed to Kairos changes nurse behavior from "approve by default" to "scrutinize everything" and time-savings collapse. Validation methodology: shadow 100 real nurse tasks, measure error rate vs human baseline, threshold <1% clinically meaningful error before any expansion.

3. **Accountability surface as currently scoped will get the product killed.** Discrepancy detection visible to management = "snitch tool" = nursing rebellion. Fix: discrepancy surfacing is personal cognitive aid for individual nurse only. Aggregate compliance dashboards are Phase 2 product requiring nursing leadership co-design before shipping.

4. **The uncomfortable truth (both reviewers):** healthcare IT is built to protect liability, not clinician experience. Kairos must deliver institutional value (audit, risk, control) **through** clinician experience, not pitch clinician experience as the value itself.

5. **FHIR write latency 5-9s vs Epic-native 1s.** Fix: optimistic UI with async write-back. Solvable in engineering.

6. **Specialty generalization is multi-quarter per specialty, not configuration.** Be honest in roadmap.

---

## Build Status (as of 2026-04-27 evening, post name-scrub)

### Epic FHIR sandbox: UNBLOCKED ✓

```
App Name:           Kairos Nurse Dashboard
App ID:             54037
Status:             Test (sandbox-ready)
Production Status:  Dormant — requires Epic customer site approval (political phase)
```

**Credentials:**
```
Non-Production Client ID:  285f1c56-244a-4550-9850-d5e7c840240a
Production Client ID:      cc163b1d-e634-4def-a1bc-f525c10f6f7e   (won't activate until production approval)
```

**Sandbox endpoints:**
```
FHIR Base URL:    https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4
OAuth Token URL:  https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token
JWKS Endpoint:    Brandon's hosted JWKS endpoint (live)
```

**27 scopes saved (R4, Patient Chart contexts):**
- Patient (2): Read Demographics, Search Demographics
- Encounter (2): Read Patient Chart, Search Patient Chart
- Condition (4): Read Problems, Read Encounter Diagnosis, Search Problems, Search Encounter Diagnosis
- MedicationRequest (2): Read Signed Medication Order, Search Signed Medication Order
- Observation (6): Read + Search × Vitals, Labs, Core Characteristics
- AllergyIntolerance (2): Read Patient Chart, Search Patient Chart
- ServiceRequest (3): Read Referral, Read Orders, Search Orders
- DiagnosticReport (2): Read Results, Search Results
- DocumentReference (4): Read + Search × Clinical Notes, Correspondences

**Deferred scopes (not standard FHIR — require proprietary Epic API later):**
- Communication (MyChart In Basket)
- Task (work queue)

### Repo: kairos (firekraker1272/kairos, private) — scaffold complete ✓

Local: `C:\Users\kents\kairos`

**Tonight's progress (2026-04-27 evening session):**
- Next.js 16.2.4 App Router scaffold (JS-only, Tailwind v4, no TypeScript)
- `@anthropic-ai/sdk@^0.91.1` installed
- Whitfield synthetic FHIR R4 Bundle: 18 entries, real LOINC/SNOMED/RxNorm, fictional identifiers
- Mock FHIR client with swap-to-real Epic interface (`getPatient`, `getEncounter`, `searchConditions`, etc.)
- Chart context assembler (`lib/fhir/chartContext.js`)
- Chart-aware question generator with `claude-opus-4-7` (`lib/prompts/chartAwareQuestions.js`)
- API route `/api/chart-aware-questions`
- Triage page at `/triage/[encounterId]` with chart context + questions UI
- Dashboard page with Whitfield encounter link
- EvidenceCapture stubbed (next session wires Calls 2 + 3 of Whitfield workflow)
- Env var renamed `KAIROS_ANTHROPIC_KEY` (avoids Windows-level shadowing of empty `ANTHROPIC_API_KEY`)
- maxTokens bumped to 16000 (4000 truncated mid-JSON for 31-question generation)
- temperature parameter removed (claude-opus-4-7 rejects it)
- **Name scrub applied** — all real patient/clinician names replaced with fictional substitutes throughout working tree, file paths, and git history. Repo reset to fresh init commit. Never pushed.

**Verified end-to-end:**
- 32 clinically defensible questions generated for Whitfield encounter
- Categorized by clinical concept (handoff_context, volume_status, respiratory_cardiac_differential, cardiac_aortic_stenosis, etc.)
- Each question has rationale tied to specific chart finding
- Calibrated confidence language ("based on chart, consider Y" vs "patient has X")
- Catches data-freshness concerns (labs predate Lasix d/c — flagged as stale)
- Honors prior thoracentesis poor-tolerance note explicitly

---

## Repo & Infrastructure Decisions

**Decision: New private repo `kairos`, NOT firekraker-monorepo.**

Reasoning:
- Legal/IP cleanliness for any future ownership transfer
- Blast radius isolation for eventual PHI handling
- Compliance posture for future BAAs
- Audit trail for legal review or acquisition
- Cost accounting via dedicated Anthropic API key
- Avoids any risk of accidentally pushing to firekraker-monorepo and triggering kairos/ Vercel deploy during Riverbend review

**Riverbend review window constraint:**

Two Vercel projects exist on firekraker-monorepo:
- `clinai` project (clinai.firekraker.net) — internal tooling, harmless
- `kairos` project — **serves `kairoshealth.app` and `www.kairoshealth.app`** — Riverbend review surface

**Zero commits to `firekraker-monorepo/kairos/` until at least 2026-05-04.** Vercel auto-deploys on push to main; any deploy creates risk of changing what the reviewer sees.

The new `firekraker1272/kairos` repo is the build environment. **Localhost-only.** No Vercel project. No public URL. No deploys.

**Deferred infrastructure (do not create until needed):**
- Vercel project for kairos repo: re-evaluate ~5/4
- Supabase project: mock data in JSON for first build slice; add Supabase when schema stabilizes
- Dedicated Anthropic API key: using HVC Monorepo key (`KAIROS_ANTHROPIC_KEY` in `.env.local`); create dedicated key when spend tracking matters
- Custom domain on new repo: `kairoshealth.app` stays pointed at firekraker-monorepo/kairos/ until after Riverbend review

---

## Build Principles (binding for all Kairos code)

1. **Production-quality output from day one.** No demo-grade outputs that we'd "fix later."
2. **Clinical accuracy is the whole game.** Every clinical output must be defensible. Calibrated confidence and explicit uncertainty in all reasoning ("based on X and Y, consider Z" — never "patient has Z").
3. **Discrepancy surfacing for individual nurse only.** Never management dashboards in v1. Non-negotiable.
4. **Optimistic UI for any async operation.** Instant confirmation, background processing.
5. **Mock data designed to swap cleanly for real FHIR responses.** Mock objects match Epic FHIR R4 response shape exactly. The day Epic unblocks production, we change a config flag, not a schema.
6. **Versioned regeneratable artifacts.** Clinical outputs regenerate against accumulated evidence; prior reasoning chain is preserved, not overwritten.
7. **Answer source tagging.** Patient / family / outside_clinician / chart — every captured data point.
8. **Bidirectional integration is the architecture, not a stretch goal.** Even mocked, the data flow is two-way from day one.
9. **Every Claude Code prompt ends with: "Update docs/log.md and any affected docs/ files. Do NOT run git push."**
10. **Every prompt explicitly forbids importing HVC patterns.** Re-read the "Kairos is NOT HVC" section if tempted.
11. **No real names ever.** Patient names, clinician names, and clinic names in this document and the repo are all fictional substitutes. Brandon knows the mapping; Claude does not need to. If a real name slips into a prompt, chat, or file, halt and scrub before continuing.

---

## Build Roadmap (workflow-by-workflow progression)

The architectural primitive is the same for every workflow stream. Each session takes one stream from the canonical patient examples list and builds it end-to-end. Sessions stack — each one adds to the same repo, the same architecture, the same dashboard.

| # | Session | Workflow | Patient | Status |
|---|---------|----------|---------|--------|
| 1 | 2026-04-27 | Phone triage (outside-clinician) | Whitfield | ✅ Built end-to-end (chart-aware questions verified clinically defensible) |
| 2 | next | EvidenceCapture wired into Whitfield (Calls 2+3 of round-trip) | Whitfield | ⏳ EvidenceCapture stub exists; wiring queued |
| 3 | next | SBAR regenerator on accumulated evidence | Whitfield | ⏳ Queued |
| 4 | future | Phone triage (paper BP log) + OCR pipeline | Marbury | ⏳ Roadmapped |
| 5 | future | Coumadin cohort + Tier 2 dosing reasoning | Okafor | ⏳ Roadmapped |
| 6 | future | Patient Call (patient-origin) + orthostatic pattern recognition | Devereaux | ⏳ Roadmapped |
| 7 | future | Pt Advice Request (bidirectional MyChart round-trip) + dual-output | Diane Hartwell | ⏳ Roadmapped |
| 8 | future | Results Follow-Up + structured 5-question template | Pemberton | ⏳ Roadmapped |
| 9 | future | Persistent investigation object across days/buckets | Linnehan | ⏳ Roadmapped |
| 10 | future | Rapid-cycle investigation with derivative spawn | Caldwell | ⏳ Roadmapped |
| 11 | future | Pre-visit med rec (MyChart task / kiosk / paper-OCR) | Cosgrove | ⏳ Roadmapped |
| 12 | future | Pre-procedure protocol library + safety chain | Halberg | ⏳ Roadmapped |
| 13 | future | Prior auth tracking state machine | Castellanos | ⏳ Roadmapped |
| 14 | future | INR Reminder cohort surveillance | (cohort, not individual) | ⏳ Roadmapped |
| 15 | future | Referral Message classification + noise suppression | (cohort) | ⏳ Roadmapped |
| 16 | future | Home INR fax OCR pipeline | (workflow, not patient) | ⏳ Roadmapped |
| 17 | future | Nurse dashboard (unified across all 10 streams) | — | ⏳ Roadmapped |
| 18 | future | Persistent investigation object (cross-bucket linking) | — | ⏳ Roadmapped |

**Discipline:** each session ends with a working end-to-end slice. No partial workflows that "almost work." If a session can't finish a stream, it scopes down further until it can.

---

## Riverbend Application Status

- **Submitted:** 4/27 morning
- **Portfolio piece referenced:** kairoshealth.app (existing prototype in firekraker-monorepo/kairos/)
- **HVC not mentioned.** Kairos not mentioned by name in resume. ClinAI not mentioned. Preserves all options on legal structure.
- **Awaiting response.** Estimated review window: 1-2 weeks minimum from 4/27.
- **Build proceeds regardless of Riverbend outcome.** Kairos is not contingent on the job.

---

## Open Items (carries forward)

### Recently Completed (2026-04-27 evening)
- ✅ Created new private repo `firekraker1272/kairos`
- ✅ Local clone to `C:\Users\kents\kairos`
- ✅ docs/CONTEXT.md v1 created and uploaded to Claude project knowledge
- ✅ First Claude Code prompt: scaffold + Whitfield sample + chart-aware question generator
- ✅ Env var renamed to `KAIROS_ANTHROPIC_KEY`
- ✅ `claude-opus-4-7` integration verified (32 clinically defensible questions for Whitfield)
- ✅ Vercel infrastructure audited (clinai project + kairos project on monorepo, kairoshealth.app confirmed on kairos project — frozen until 5/4)
- ✅ Full ClinAI #1-4 chat history integrated into CONTEXT.md v2
- ✅ Name scrub: all real patient and clinician names replaced with fictional substitutes throughout repo + git history; CONTEXT.md updated to match
- ✅ **EvidenceCapture wired** — `components/EvidenceCapture.js` renders question-picker + freeform-toggle entry panel, source pill row defaulting from caller context, sourceDetail input, hover-revealed delete, humanized capturedAt. Whitfield seed (3 items: spouse SOB, family weight trend, outside-RN AKI handoff) lives in `components/TriageWorkspace.js` keyed on `whitfield_encounter_001`.
- ✅ **SBAR regenerator on accumulated evidence** — `lib/prompts/sbarRegenerator.js` (system prompt + chart/evidence summarizers + JSON extractor), `app/api/regenerate-sbar/route.js` (Opus 4.7, maxTokens 4000, no temperature), `components/SBARDraft.js` (versioned, inline `[chart]/[pt]/[family]/[outside RN: name]/[nurse obs]` marker pills via `MARKER_RE`, stale-evidence banner from `hashEvidence` mismatch, regenerate, approve-and-copy with 2s confirmation). Smoke-tested live: returns clinically defensible SBAR identifying CHF decompensation post-furosemide-d/c.
- ✅ **Marbury synthetic patient + encounter** — `data/patients/marbury.json` (24-entry FHIR Bundle, 68F on five-agent regimen incl labetalol started 2 weeks ago, CKD3a, T2DM, HLD, obesity), `data/encounters/marbury_bp_log.json` (24 readings across 14 days w/ 3 noted), encounter registered in `lib/fhir/encounters.js` as patient-origin in-person drop-in.
- ✅ **BPLogTable + bpTrend analysis** — `lib/clinical/bpTrend.js` exports `analyzeBPTrend` (count, dateRange, avg SBP/DBP, % thresholds at 140/150/160, max/min, slope-driven `rising | falling | stable` trend, categorized significantReadings). `components/BPLogTable.js` renders trend stats row with color-coded pct cells, color-coded SBP per reading, "show all" toggle past 8, paper-log captured-from footer. Marbury chartContext attaches `bpLog.summary` so question generator + SBAR see the trend.
- ✅ **Dashboard polish** — `app/dashboard/page.js` is a unified inbox with status dots, stats row (active / awaiting nurse review / in progress), per-encounter pill via `(type, callerContext)` switch (`Phone · Outside RN` for Whitfield, `Patient Call` for Marbury), line-clamped reason, relative timestamp, click-through to triage. `app/page.js` 307s to `/dashboard`. `DashboardClock` is hydration-safe + minute-aligned.
- ✅ **Post-scrub idempotent verification** — re-walked the full 8-phase build prompt; all phases survived the scrub intact, build clean (6 routes), all four routes return expected codes, real-name scan over tracked files returns zero matches.
- ✅ **v3 Investigation primitive** — `lib/types/investigation.js` (Investigation + Touchpoint typedefs, `addTouchpoint`, `findInvestigationForEncounter`, `linkEncounterToInvestigation`, `summarizeInvestigation`) + `lib/state/investigations.js` (in-memory store with JSON seed loader and `<minutes-ago:N>` / `<days-ago:N hh:mm>` / `<today hh:mm>` time-token resolution). The unifying object that links touchpoints across time and Epic buckets — the Phase-1 single-encounter primitives (chart-aware questions, evidence, SBAR) sit one level below it.
- ✅ **Linnehan workflow (time axis proof)** — 71yo M with AFib + CHF on warfarin. 16-entry FHIR Bundle with real LOINC 6301-6 INR (2.4 baseline → 1.6 subtherapeutic) + split warfarin regimen reduced after R thigh hematoma. Three encounters across 5 days. Investigation seed has 6 touchpoints across 3 buckets (results_followup, secure_chat, patient_call) and 4 source actors (system, nurse, outside_clinician [Amanda Trahan home health RN], patient). Proves the primitive handles cross-bucket / cross-source / multi-day investigations.
- ✅ **Hartwell workflow (flow axis proof)** — 58yo F started atorvastatin 6 weeks ago. 14-entry FHIR Bundle with LDL 95 (target met) + AST 42 [H] mildly elevated. Investigation seed has 3 touchpoints with mid-investigation bucket transition (results_followup → pt_advice_request): provider Result Note 6:51 AM → outbound MyChart 10:07 AM → patient inbound reply 10:15 AM (introduces turmeric supplement — the surprise that needs cosign). Proves the primitive handles bidirectional flow + bucket transitions.
- ✅ **SecureChat + InvestigationTimeline + MyChartThread + ResultNoteCard components** — `components/SecureChat.js` (multi-party threaded messaging, role-pill participants, bubble-style messages), `components/InvestigationTimeline.js` (vertical timeline with kind-icons, bucket pills, source pills, expandable inline detail per touchpoint), `components/MyChartThread.js` (patient-facing aesthetic, From: header per message), `components/ResultNoteCard.js` (provider Result Note inline above the dual-output panel). All semantic-token colored, both modes verified.
- ✅ **Dual-output generator** — `lib/prompts/dualOutput.js` system prompt enforces dual-audience separation (plain-language MyChart + clinical Nurse Note + `[verify: ...]` flags + explicit conflict surfacing), `app/api/dual-output/route.js` calls Opus 4.7, `components/DualOutputDraft.js` renders side-by-side panels with verify-flag pills. Smoke-tested live: returned a clinically defensible draft with 7 verify flags, independently caught the turmeric ↔ AST temporal correlation as the most relevant new clinical signal, and produced both a 5th-grade reading-level patient response and a sectioned clinical Nurse Note (Reason for Contact / Patient-Reported Symptom Review / Clinical Synthesis / Plan / Items Requiring Provider Input).
- ✅ **Investigation timeline route + triage badge wiring** — `/investigation/[investigationId]` renders patient header + status pill + summary stats (touchpoints / buckets / days / sources) + chronological timeline + chart sidecar. Triage page header gained a teal `Link2` investigation badge that surfaces "Part of N-event investigation [· spans M buckets]" and links to the timeline. Dashboard inbox cards have the same badge in the bottom-right corner without intercepting the card-level click.
- ✅ **Dashboard updates** — 4-stat grid (Active encounters / Active investigations / Awaiting nurse review / In progress), `status: 'complete'` encounters filtered out (still reachable via investigation timeline), `results_followup + provider` encounter pill added ("Result Note · Provider", clinician tone). Inbox now shows Whitfield + Marbury + Linnehan recheck + Hartwell.
- ✅ **v4 Cohort surveillance primitive** — `lib/types/cohort.js` (CohortDefinition, CohortMember with `flags: overdue|drift|unseen|stable` + `priorityScore`, CohortSnapshot with summary counts, `priorityComparator`, `groupByFlag`) + `lib/state/cohorts.js` (in-memory store with JSON-seed loader and `<N days ago>` time-token resolution) + `lib/clinical/cohortCompute.js` (`computeINRReminderSnapshot` — passthrough today, swap point for live FHIR-driven recomputation later). The proactive/scheduled surface that's fundamentally different from inbox-driven Encounter/Investigation work.
- ✅ **INR Reminder cohort + page + drill-in + outreach** — 15 fictional warfarin patients spanning all four flag categories (Whitcombe at score 92 = canonical compounded overdue+drift; Hollis 95 = highest, including AFib + prior CVA; Steensma 73 = unseen 127d, out-of-state intake never followed up; etc.). `/cohort/inr_reminder` page with 4-stat grid + filter pills + sort dropdown + member rows. `/cohort/inr_reminder/{patientId}` drill-in: SVG INR sparkline w/ goal-range shaded band, history table with in-range/out-of-range tone, current-regimen card, "Why this patient is here" flag explanations, four quick-action buttons (outreach via Opus, three stub-but-flashing alternatives). `lib/prompts/cohortOutreach.js` enforces caring-concierge tone (gentle nudge framed as care continuity, not scolding). Smoke-tested live: returned warm plain-language MyChart message and clinical internal note correctly identifying compounded thromboembolic risk.
- ✅ **Halberg pre-procedure workflow** — 64yo F with hypothyroidism + resistant HTN + CAD + GAD on Levothyroxine + Metoprolol + **Clonidine** + Atorvastatin + ASA. Stress test scheduled in 7 days. 13-entry FHIR Bundle. Encounter `halberg_encounter_001` typed `pre_procedure_inquiry` with structured `procedureContext: { type, protocolId, scheduledDateMsFromNow, orderingProvider }` (encounter registry resolves the relative scheduled date at read time).
- ✅ **Protocol library + applier (the safety chain hardened as code)** — `data/protocols/protocols.json` ships the canonical Pre-Stress Test Med Management protocol with rules covering beta blockers, non-DHP CCBs, **central alpha agonists (the safety-chain catch)**, levothyroxine, statins, antiplatelets. `lib/clinical/protocolApplier.js` walks active MedicationRequests, normalizes via a generic→class map + brand/abbreviation alias map (ASA→aspirin, Coumadin→warfarin, Lipitor→atorvastatin, etc.), matches each med, returns `{ schedule, unmatched, warnings }`. Warnings array explicitly flags any centrally-acting alpha agonist with the "frequently overlooked when reviewing by hand" callout. `app/api/apply-protocol/route.js` exposes server-side. `components/ProtocolApplier.js` renders the prominent amber Safety Chain Warnings block, color-coded schedule (hold = amber, continue = green) with expandable rationale, unmatched-meds collapsible, Approve button → `lib/prompts/patientInstructions.js` (plain-language patient-facing instructions with copyable text). Smoke-tested live: returned 5-med schedule with **Clonidine correctly held + warning** — Halberg Clonidine omission from CONTEXT.md is now a working code path.
- ✅ **Halberg triage layout + dashboard cohort section** — TriageWorkspace detects `pre_procedure_inquiry` encounter type and renders ProcedureContextCard + ProtocolApplier in place of TriageQuestions (the protocol *is* the inquiry). Dashboard gained a "Cohort surveillance" section above the Inbox with cohort cards (flag-by-tone summary, last-reviewed, click-through to cohort page). Pre-Procedure pill added to encounter pill switch. Inbox now shows Whitfield + Marbury + Linnehan recheck + Hartwell + Halberg = 5 cards.

### Open (next session)
- [ ] Dark mode toggle (light/dark/system, persisted, no FOUC)
- [ ] Commit and push tonight's scaffold work to origin/main once visually verified
- [ ] Persistent investigation + cohort storage (Supabase) — replace `lib/state/investigations.js` and `lib/state/cohorts.js` only
- [ ] Real cohort recompute pipeline — replace passthrough in `lib/clinical/cohortCompute.js` with FHIR-driven rule application

### Open (future sessions, roadmapped)
- [ ] Workflows #4-18 per the build roadmap
- [ ] Riverbend interview/offer outcome
- [ ] Legal structure decision (Kairos ownership) — deferred until Riverbend clarifies
- [ ] Migration of Riverbend prototype out of firekraker-monorepo — deferred until after 5/4
- [ ] Tristan heads-up text about HVC confidentiality
- [ ] Phantom "hvc" Worker deletion from Cloudflare dashboard
- [ ] Playwright MCP setup in Claude Code

---

## Session Memory Protocol

Every Kairos chat session ends with an updated version of this file. Specifically:

1. **Build Status section** updated with current sandbox/repo state
2. **Open Items section** updated — completed items move to "Recently Completed" with date, items still open carry forward
3. **Build Roadmap** updated — completed sessions checked off, current work clearly marked
4. **New principles or decisions** added under appropriate section
5. **CRITICAL: Kairos is NOT HVC section** never gets removed or shortened, only added to if new HVC patterns are caught creeping in
6. **No real names section** — if any real name appears in a chat or file, halt, scrub, and update both this file and the repo before continuing

Future Claude sessions read this file at session start before any code is written.

---

## Quick Reference — What to do at the start of every Kairos chat

1. Read this file
2. Check the Build Status section for current state
3. Check the Open Items section for what carries forward
4. Re-read the "Kairos is NOT HVC" section if any HVC pattern-matching tempts you
5. If unsure which workflow to build, follow the Build Roadmap
6. Proceed with Brandon's request

---

## Recently Completed — v5 (2026-04-27)

**Pre-visit task primitive.** New temporal phase before the encounter. `lib/types/preVisitTask.js` defines `PreVisitTask`, `PatientReportedMed`, `Discrepancy`, `AttestationLog`. Storage in `lib/state/preVisitTasks.js` follows the same Supabase swap pattern as cohorts/investigations. Cosgrove pre-visit task in `data/preVisitTasks/cosgrove_001.json` carries 17 patient-reported medications captured via `mychart_form` 2 days before her appointment.

**Cosgrove med-rec workflow.** `lib/clinical/medRecEngine.js` (`reconcileMedications(bundle, reportedMeds)`) plus shared `lib/clinical/drugLookup.js` (~50 generics, 60+ brand aliases, 12 drug classes — extracted from v4 protocol applier and extended). Engine applies seven detection passes: dose mismatch, frequency mismatch (with severity escalation for opioid/benzo over-use), patient-added (low for OTC/supplements), patient-dropped (high for anticoag/antiarrhythmic/sulfonylurea), duplicate-class, drug interactions, and unknown-to-patient. Cosgrove (78yo F on 18 meds with deliberately bloated list) produces exactly **11 discrepancies**: duplicate beta blockers (Metoprolol+Carvedilol), duplicate SSRIs (Sertraline+Citalopram), Glipizide self-stopped (high — hypoglycemia risk), Tramadol scheduled vs PRN order (high — opioid overuse), Metformin self-reduced 1000→500mg, Apixaban+Turmeric interaction, etc.

**Attestation theater proof point.** Every "Mark Medications as Reviewed" click in `MedRecPanel` writes to a personal AttestationLog with `earned: boolean`. Earned = all discrepancies resolved before the click. Unearned = clicked through with unresolved items. Kairos NEVER blocks the click (Epic doesn't, and Kairos does not replace Epic) — Kairos *records* the integrity. Users see an inline "Are you sure?" confirmation when unresolved discrepancies exist, but can always proceed. The institutional pitch: Kairos can prove the 25-35% med-rec defect rate using Epic's own audit trail data via FHIR query, before Kairos is even installed. v5 proves the primitive works end-to-end with 11 detected items the Epic "Mark as Reviewed" click would otherwise paper over.

**Integrity log surface.** `/integrity-log` is each nurse's personal cognitive aid — chronological list of attestations with earned/unearned badges, filter for "unearned only," and links back to source encounters. **Per the post-mortem failure mode #3 this is non-negotiably individual-only** — never aggregated, never reported, never compared across staff. Header link "Your integrity log →" lives next to the dashboard clock.

**Castellanos prior auth state machine.** `lib/types/priorAuth.js` defines the `PriorAuthRequest` with allowed transitions (`submitted → insurance_review → {approved | denied | info_requested}`, `denied → appealing`, `appealing → {approved | denied}`, `approved → medication_dispensed → closed`); `advanceStage()` throws on illegal transitions to fail loudly during demo wiring. Storage in `lib/state/priorAuth.js`. Castellanos's Repatha PA (`data/priorAuth/castellanos_repatha.json`) has 5 stage transitions across 14 days, currently sitting in `info_requested` after a denial-and-appeal loop.

**PA tracker component.** `components/PriorAuthTracker.js` renders the progress bar, vertical stage timeline with per-stage artifacts, and context-sensitive action buttons (currently `info_requested` → "Request additional info"). The patient communication panel uses a dedicated dual-output prompt (`lib/prompts/paStatusUpdate.js`, Opus 4.7) that drafts a warm plain-language MyChart message acknowledging the patient's frustration plus an internal nurse note with `[verify: ...]` flags. Triggered by /api/pa-status-update.

**Dashboard cross-cutting nav updates.** Cosgrove's encounter card carries the discrepancy count badge (severity-weighted color, high-severity callout); Castellanos's card shows the PA stage pill + days-active + transitions count. Pill labels added for `pre_visit_med_rec` and `prior_auth_inquiry` encounter types. Inbox count is now 7 active encounters (Whitfield, Marbury, Linnehan recheck, Hartwell, Halberg, Cosgrove, Castellanos).

**Architectural impact.** v5 closes the integrity-and-state primitives layer. The full primitive stack is now: chart-aware inquiry (v2) → investigation links across time (v3) → cohort surfaces populations on schedule (v4) → protocol applies guidelines as data (v4) → pre-visit task captures the before-the-room phase (v5) → documentation integrity records what was actually reviewed (v5) → state-machine workflow tracks durable cross-encounter PA (v5). The pitch frame ("Kairos is one primitive applied to ten surfaces, not ten features") is now structurally complete; every remaining workflow on the build roadmap is a composition of these primitives, not a new architectural piece.


---

## Recently Completed — v6 (2026-04-27)

**Referral Message classifier (Sonnet 4.6).** `lib/types/referralMessage.js` defines `ReferralMessage` and `ReferralClassification` (8 categories: 3 informational, 4 actionable, 1 ambiguous "unable_to_classify"). `lib/state/referralMessages.js` is the in-memory store with `setClassification`, `appendOverride`, `markStatus`, `markManyStatus`. `lib/prompts/referralClassifier.js` runs against `claude-sonnet-4-6` (NOT Opus — first non-Opus clinical surface; the choice is per-route, not global) with a default-to-suppression system prompt. Classifier route at `/api/classify-referral` accepts both single (`{ messageId }`) and batch (`{ messages: [...] }`) shapes; batch uses sequential concurrency 3 to avoid blasting the API. Override route at `/api/classify-referral/override` is pure state mutation, no model call, requires an override note.

**Referral Inbox surface.** `/referral-inbox` is the dense triage screen. 80 synthetic messages with realistic distribution (32 informational_ack, 18 informational_appointment_confirmation, 14 informational_records_received, 4 actionable_scheduling, 4 actionable_clinical_question, 3 actionable_info_request, 3 actionable_referral_response_pending, 2 unable_to_classify) — only ~14 are actionable. UI has a 200px category sidebar, "Actionable (all)" default filter, dense one-line message rows with confidence dots, hover-expand body, override modal, bulk-select toolbar with "Mark as read" / "Send to nurse review" / "Reclassify selected", and "Reclassify all" + "Mark all informational as read" header buttons. Triage screens optimize for scan rate, not aesthetics.

**Override + reclassify flow.** Overrides set `humanOverridden: true` with the nurse's note attached to the classification. Accuracy metric on the inbox = % of messages where `humanOverridden=false`. Per-message reclassify button + bulk reclassify selected button both call the Sonnet classifier and persist results back to state.

**IncomingFax data model.** `lib/types/incomingFax.js` defines `IncomingFax` + `ExtractedField` (bbox-tagged) + `PatientMatchCandidate` (matchScore + matchSignals + mismatchSignals + requiresHumanConfirmation). Status lifecycle: `awaiting_review → auto_matched | human_matched → processed`, plus `rejected`. `lib/state/incomingFaxes.js` provides `resolveFaxPatient` (auto vs nurse), `rejectFax`, `markFaxProcessed`.

**OCR mock + match engine.** v6 mocks the OCR step — assume extraction has happened and the model output (with confidence + bbox) is the input. `lib/clinical/patientMatch.js` exports `scorePatientMatch` with weighted signals: exact_name 0.4, mrn_match 0.5, dob_match 0.3, name_phonetic 0.15, name_partial 0.10. Penalties: dob_mismatch -0.4, name_variant -0.10. `requiresHumanConfirmation` triggers on top score < 0.85, ambiguity (top two within 0.15), or any mismatch signal. `lib/clinical/faxProcessor.js` auto-flips home_inr clean matches to `auto_matched` and creates Anticoagulation Visit encounters via `createEncounterFromFax`. `lib/state/faxEncounters.js` holds runtime-created encounters; `lib/fhir/encounters.js` `listEncounters()` folds them into the dashboard inbox so a freshly-processed fax shows up immediately.

**Patient match scoring (worked examples).** Linnehan clean fax: score 0.97, no human confirmation needed → auto_matched on processor pass. Marbury ambiguous fax (name OCR'd as "Marb_ry" at 0.62 confidence): two candidates score 0.72 and 0.58, both flagged requiresHumanConfirmation → status stays awaiting_review until nurse confirms. Linnehan DOB-conflict fax: single candidate scores 0.55 with `dob_mismatch` mismatch signal → still requires human confirmation.

**Fax Inbox surface.** `/fax-inbox` two-column layout. Left sidebar (300px): all faxes sorted by receivedAt desc with type/status pills + page count + relative time. Right detail panel: extracted-fields table with confidence dots, match-candidate cards with match/mismatch signal pills, "Confirm match" primary on top candidate / ghost on others, "Reject fax" ghost-red. After confirming a home_inr match, `/api/fax-resolve` creates the encounter and the UI shows a green inline confirmation with a "View encounter" link to the dashboard. 8 synthetic faxes seeded covering the realistic distribution (clean auto-match, no-system-match, ambiguous, DOB-conflict, outside records, lab result, already-processed historical, junk/spam).

**Dashboard cross-cutting nav row.** Replaced the single integrity-log link in the dashboard header with a `<nav>` row of pill links: Cohorts (overdue+unseen count), Investigations (active count), Referral Inbox (actionable count), Fax Inbox (awaiting review count), Integrity Log. Encounter inbox stays the primary visual focus; cross-cutting surfaces are nav, not primary content. Added `encounterPill` case for `anticoagulation_visit` → "Anticoag Visit · Fax" so fax-derived encounters render correctly when they land in the inbox.

**v6 completes the new-primitives roadmap.** The architecture now has 9 primitives:
1. Chart-aware inquiry (v2)
2. Investigation links across time (v3)
3. Cohort surveillance (v4)
4. Protocol library (v4)
5. Pre-visit phase capture (v5)
6. Documentation integrity / attestation log (v5)
7. State-machine workflow / PA tracking (v5)
8. **High-volume classification / noise suppression (v6)** — Referral Inbox
9. **OCR / analog input ingestion (v6)** — Fax Inbox

**Every remaining workflow on the 18-stream build roadmap (Devereaux orthostatic hypotension, Pemberton 5-question template, Caldwell rapid-cycle hypokalemia, Okafor Coumadin dosing, secure chat threading) is a composition of these 9 primitives, not a new architectural piece.** The pitch frame ("Kairos is one primitive applied to ten surfaces, not ten features") is structurally complete; the next phase of the build is wiring those compositions, then the FHIR write-back layer, then nurse shadow validation.

## Recently Completed — v7 (2026-04-27)

**Persistence migration to Supabase.** v2-v6 built architectural primitives but everything reset on page refresh. v7 makes the things that *should* persist actually persist.

**What's persisted now (loses meaning if reset):**
- Investigations + touchpoints (a 5-day investigation can't be 5 separate page-refresh-resetting demos)
- Evidence captured per encounter
- SBAR versions (history retained, not just latest)
- Attestation log (institutional pitch falls apart without durable audit trail)
- Pre-visit tasks + discrepancy resolutions

**What's NOT persisted (by design):** patient/encounter base data (still mocked from JSON until v8 Epic FHIR), cohort snapshots (recomputed each session), today's referral inbox + fax queue (short-lived), protocol library (static config). Persistence migration v7 complete. Things that should be durable now are durable. Cohort snapshots, referral inbox, and fax inbox remain in-memory by design.

**Schema** (in SupperMates Supabase project, all kairos_* prefixed): kairos_investigations, kairos_investigation_touchpoints, kairos_evidence, kairos_sbar_versions, kairos_pre_visit_tasks, kairos_attestation_log, kairos_discrepancy_resolutions. RLS enabled on every table; no policies defined → anon key has zero access. Service role key (server-side only, used in API routes) bypasses RLS. Trigger on touchpoint insert: `last_activity_at = GREATEST(current, NEW.occurred_at)` — historical seeds keep their seeded value, live additions advance the timestamp.

**Architecture rules (binding for v8+):** all Supabase writes happen in API routes with the server client. Browser client uses anon key. Service role key NEVER goes to a client component (verified via grep in `components/` — 0 matches). Pages that need DB data are async server components calling server helpers directly; only TriageWorkspace (which already had to be a 'use client' component for evidence interactivity) does API-backed fetching with optimistic UI.

**Schema gotchas to remember:** TEXT primary keys for `kairos_investigations.id`, `kairos_investigation_touchpoints.id`, `kairos_pre_visit_tasks.id` (not UUID — preserves stable demo URLs like `/investigation/investigation_linnehan_001` across reseeds). Attestation log has display columns (encounter_id, patient_id, patient_name) on top of the spec because the existing UI surfaces those. Discrepancy resolutions are append-only rows — the task's `discrepancyResolutions` map is reconstructed by selecting the latest row per discrepancy_id (full audit history preserved).

**Seed scripts (idempotent, --force to refresh):**
- `scripts/seed-investigations.js` — Linnehan + Hartwell investigations with time tokens resolved at insert time (re-run with --force when demo timestamps drift)
- `scripts/seed-evidence.js` — Whitfield (3) + Marbury (3) evidence items with stable UUIDs
- `scripts/seed-pre-visit-tasks.js` — Cosgrove 17-med pre-visit task

**Verification:** `scripts/verify-phase7.mjs` exercises round-trips on all 7 tables — 14/14 checks pass. Build clean. RLS posture verified (anon → 0 rows). Name-scrub regression scan clean.

## Known Migration Debt

### Multi-tenant DB → dedicated Kairos Supabase project
- **Current state**: Kairos uses the SupperMates Supabase project (inxtnmsjlvpdofxovbpb) as a multi-tenant DB. All Kairos tables are `kairos_*` prefixed; they coexist with SupperMates' own `dk_/lo_/sm_/convos_/etc` tables.
- **Reason for debt**: Supabase free tier limits the firekraker org owner to 2 active projects. HVC and SupperMates already filled both slots when v7 landed. Creating a dedicated `kairos` project would require either pausing/deleting an existing project or upgrading the org to Pro ($25/mo).
- **When to migrate**: trigger conditions are (a) real PHI lands (multi-tenant on a non-BAA shared DB is unacceptable), (b) BAA / data-ownership conversation with Riverbend or any clinical pilot starts, (c) project ownership/handoff to a third party, (d) Supabase Pro tier becomes worth the spend for other reasons.
- **Estimated effort when triggered**: ~2-3 hours. `pg_dump --table='kairos_*'` from SupperMates project, `pg_restore` into the dedicated kairos project, swap the 5 env vars in `.env.local` (KAIROS_SUPABASE_URL, KAIROS_SUPABASE_ANON_KEY, KAIROS_SUPABASE_SERVICE_KEY, NEXT_PUBLIC_KAIROS_SUPABASE_URL, NEXT_PUBLIC_KAIROS_SUPABASE_ANON_KEY), re-run all three seed scripts on the new DB to verify, then drop kairos_* tables from SupperMates after smoke-testing the demo. The `kairos_` prefix on every table makes the dump/restore filter trivial.
- **Future Kairos schema changes** (v8 schema additions, v9 kairos_profiles, etc.) MUST keep the kairos_ prefix until this migration happens. Do not introduce un-prefixed tables.

### Auth (blocks public deploy)
v7 hardcodes the current actor as the literal string `ma_demo` in `/api/attestations/me`, `/api/med-rec/attest`, `/api/med-rec/resolve`, and `/integrity-log`. Every persisted attestation/resolution row stamps `actor_id = 'ma_demo'`. Auth lands in v8.

## Note for v8 — recommended target

**v8 should target Epic FHIR sandbox integration, not generic auth.** The architectural primitives are ready, the persistence layer is in place, and the Riverbend review window ends 5/4. Epic FHIR sandbox lets us:
- Pull real patient/encounter/medication data instead of JSON mocks
- Validate the chart-context assembly against actual FHIR shapes (R4 vs DSTU2 quirks etc.)
- Test the FHIR write-back layer (the eventual target for SBAR completion → encounter note)

Auth (Epic SSO + nurse login) is the gating prerequisite for *public deploy* but not for *Riverbend pilot conversation* — for the pilot, "this hits a real Epic sandbox and reads/writes against real FHIR" is the more compelling demonstration than "this has a login screen." Auth can be v9.
