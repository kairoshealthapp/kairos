# Kairos — Project Context & Persistent Memory

> [← Index](INDEX.md) · Single source of truth for Kairos identity, north-star, and architecture. Read at the start of every Kairos session.

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

1. **Phone triage** — chart-aware question generation, bidirectional Q&A capture, evidence-accumulating SBAR.
2. **Results Follow-Up** — Provider sends Result Note + clinical questions → Kairos pulls patient context, drafts the patient outreach AND the structured forwarder note simultaneously, nurse approves both.
3. **Rx Request** — Surescripts refill protocol auto-applied (seen last month + future appt scheduled → 90 days/3 refills, dx-associated, cosign-routed).
4. **Patient Call** — phone-origin clinical signal, two sub-patterns:
   - Patient/family-origin (BP log)
   - Outside-clinician-origin (peer-to-peer SBAR framing, higher inherent acuity)
5. **Pt Advice Request** — patient-initiated MyChart messages OR replies to nurse-initiated outreach. Bidirectional.
6. **Home INR Faxes** — mdINR paper faxes, 5-10/day. Strongest "save the clinic from paper" demo. OCR pipeline target.
7. **Secure Chat** — Epic's HIPAA Slack-equivalent, real-time, multi-party threaded messaging tied to MRN.
8. **Pre-Visit Medication Reconciliation** — first pre-visit (not post-encounter) workflow. The defect surface here is documentation fraud at the workflow-step level.

### Proactive / cohort streams (Phase 1.5)

9. **INR Reminder** — proactive cohort surveillance. Different primitive: **patient cohort monitoring**, not single-encounter processing.
10. **Referral Message classification** — high volume (108/day observed), mostly informational acknowledgments. **Noise suppression** primitive.

The **proactive vs reactive distinction is architecturally significant.** Phase 1 is reactive (process inbox events). Phase 1.5 adds the monitoring/alerting layer that runs on schedule.

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

**~206 active inbox items, ~101 unread/new across the day so far.** Even excluding the 108 Referral Messages (mostly informational), real cognitive load is ~100 items/day requiring real clinical processing.

---

## The MA Attestation Theater Finding (institution-side ROI story)

The single most important institutional pitch finding from Brandon's 90 days at Riverbend:

- **25-35% of patients have duplicate or questionable medications on their active med list**
- MAs click "Medications Reviewed" in seconds despite 50+ medication lists
- Epic logs the click but **cannot distinguish the click from the action**
- The MA workflow is structurally **attestation theater, not clinical work**

**Kairos's institutional value here is not workflow efficiency. It is documentation integrity.**

The Kairos pre-visit med rec primitive captures the patient's actual answer independently. When the MA clicks "reviewed," Kairos already knows whether discrepancies exist.

**The discrepancy surface is the personal cognitive aid for the individual nurse — never management dashboards in v1.** Per the post-mortem: aggregate compliance dashboards are a Phase 2 product requiring nursing leadership co-design before shipping. Discrepancy detection visible to management = "snitch tool" = nursing rebellion.

**Pitch implication:** Kairos can prove the 25-35% med-rec defect rate with Epic's own audit trail data via FHIR query, before Kairos is even installed.

---

## Three-Role Architecture (the full clinic OS)

```
FRONT DESK (Phase 3)
├── Kiosk check-in
├── Twilio voice agent (replaces front desk phone-answering)
└── Routes patient calls → nurse Patient Call basket

PROVIDER (Phase 2)        PROVIDER (Phase 2 alt mode)
├── Mode 1: live ordering ├── Mode 2: async notes
├── Live transcription    ├── Ambient transcription
├── Real-time order       ├── Post-visit SOAP draft
│   extraction            ├── Orders extracted on review
└── Pends orders during   └── 
    visit

         ↓ (orders flow downstream)              

NURSE WORKSTATION (Phase 1 — building first)
├── 8 reactive streams
└── 2 proactive streams
```

**Replaced/automated jobs:**
- Front desk phone-answering (Twilio agent)
- Live ordering scribe → Provider Mode 1
- DAX subscription (~$369-600/provider/mo) → Provider Mode 2
- Both nurses + Brandon → Nurse Workstation handles 80-90% of bucket work

This is a **labor-cost story**, not just a productivity story.

---

## Three Knowledge Layers

Kairos integrates three distinct knowledge sources (HVC currently has only #1):

1. **Patient knowledge** — FHIR pull from Epic
2. **Provider preferences** — per-clinician patterns. Learned from prior notes.
3. **Clinical guidelines** — ACC/AHA cardiology protocols, drug interaction databases, anticoagulation rules, pre-procedure med management protocols, billing code logic.

The **specialty-specific knowledge module** is the swappable layer for generalization.

---

## Post-Mortem Convergent Failure Modes

1. **Epic write-back is political, not technical.** Hospital CIOs refuse to grant write-scopes to external vendors. Fix: Kairos must be Riverbend internal tool.

2. **Clinical accuracy is the whole game.** One near-miss attributed to Kairos changes nurse behavior. Validation methodology: shadow 100 real nurse tasks, measure error rate vs human baseline, threshold <1% clinically meaningful error.

3. **Accountability surface as currently scoped will get the product killed.** Discrepancy detection visible to management = "snitch tool" = nursing rebellion. Fix: discrepancy surfacing is personal cognitive aid for individual nurse only.

4. **The uncomfortable truth:** healthcare IT is built to protect liability, not clinician experience. Kairos must deliver institutional value (audit, risk, control) **through** clinician experience.

5. **FHIR write latency 5-9s vs Epic-native 1s.** Fix: optimistic UI with async write-back.

6. **Specialty generalization is multi-quarter per specialty, not configuration.**

---

## Build Status (as of 2026-04-27 evening, post name-scrub)

### Epic FHIR sandbox: UNBLOCKED ✓

```
App Name:           Kairos Nurse Dashboard
App ID:             54037
Status:             Test (sandbox-ready)
```

**Credentials:**
```
Non-Production Client ID:  285f1c56-244a-4550-9850-d5e7c840240a
Production Client ID:      cc163b1d-e634-4def-a1bc-f525c10f6f7e
```

**Sandbox endpoints:**
```
FHIR Base URL:    https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4
OAuth Token URL:  https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token
```

### Repo: kairos (firekraker1272/kairos, private) — scaffold complete ✓

Local: `C:\Users\kents\kairos`

---

## Repo & Infrastructure Decisions

**Decision: New private repo `kairos`, NOT firekraker-monorepo.**

Reasoning:
- Legal/IP cleanliness for any future ownership transfer
- Blast radius isolation for eventual PHI handling
- Compliance posture for future BAAs
- Audit trail for legal review or acquisition
- Cost accounting via dedicated Anthropic API key

**Riverbend review window constraint:**

Two Vercel projects exist on firekraker-monorepo:
- `clinai` project — internal tooling, harmless
- `kairos` project — **serves `kairoshealth.app`** — Riverbend review surface

**Zero commits to `firekraker-monorepo/kairos/` until at least 2026-05-04.**

The new `firekraker1272/kairos` repo is the build environment. **Localhost-only.** No Vercel project. No public URL. No deploys.

---

## Build Principles (binding for all Kairos code)

1. **Production-quality output from day one.**
2. **Clinical accuracy is the whole game.** Calibrated confidence and explicit uncertainty in all reasoning.
3. **Discrepancy surfacing for individual nurse only.** Never management dashboards in v1.
4. **Optimistic UI for any async operation.**
5. **Mock data designed to swap cleanly for real FHIR responses.**
6. **Versioned regeneratable artifacts.**
7. **Answer source tagging.**
8. **Bidirectional integration is the architecture, not a stretch goal.**
9. **Every Claude Code prompt ends with: "Update docs/log.md and any affected docs/ files. Do NOT run git push."**
10. **Every prompt explicitly forbids importing HVC patterns.**
11. **No real names ever.** Patient names, clinician names, and clinic names in this document and the repo are all fictional substitutes.

---

## Build Roadmap

| # | Workflow | Status |
|---|---|---|
| 1 | Phone triage (outside-clinician) | ✅ Built end-to-end |
| 2 | EvidenceCapture wiring | ⏳ Queued |
| 3 | SBAR regenerator | ⏳ Queued |
| 4 | Phone triage (paper BP log) + OCR | ⏳ Roadmapped |
| 5 | Coumadin cohort + Tier 2 dosing | ⏳ Roadmapped |
| 6 | Patient Call (patient-origin) | ⏳ Roadmapped |
| 7 | Pt Advice Request (bidirectional) | ⏳ Roadmapped |
| 8 | Results Follow-Up | ⏳ Roadmapped |
| 9 | Persistent investigation object | ⏳ Roadmapped |
| 10 | Rapid-cycle investigation | ⏳ Roadmapped |
| 11 | Pre-visit med rec | ⏳ Roadmapped |
| 12 | Pre-procedure protocol library | ⏳ Roadmapped |
| 13 | Prior auth tracking | ⏳ Roadmapped |
| 14 | INR Reminder cohort surveillance | ⏳ Roadmapped |
| 15 | Referral Message classification | ⏳ Roadmapped |
| 16 | Home INR fax OCR pipeline | ⏳ Roadmapped |
| 17 | Nurse dashboard (unified) | ⏳ Roadmapped |
| 18 | Persistent investigation object | ⏳ Roadmapped |

---

## Riverbend Application Status

- **Submitted:** 4/27 morning
- **Awaiting response.** Estimated review window: 1-2 weeks minimum from 4/27.
- **Build proceeds regardless of Riverbend outcome.**

---

## Session Memory Protocol

Every Kairos chat session ends with an updated version of this file. Specifically:

1. **Build Status section** updated with current state
2. **Open Items section** updated
3. **Build Roadmap** updated
4. **New principles or decisions** added
5. **CRITICAL: Kairos is NOT HVC section** never gets removed or shortened
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
