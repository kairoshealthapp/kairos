# Phase 3.3 — Card Detail View Design

**Status:** DRAFT for cold-eyes review (2026-04-30). No code until reviewed.
**Author:** Brandon, with Claude as scribe.
**Source files:**
- [docs/KAIROS-CONTEXT.md](KAIROS-CONTEXT.md)
- [docs/KAIROS-CONTEXT-ADDENDUM-2026-04-28.md](KAIROS-CONTEXT-ADDENDUM-2026-04-28.md)
- [docs/KAIROS-SESSION-2026-04-29.md](KAIROS-SESSION-2026-04-29.md) (morning)
- [docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md](KAIROS-SESSION-2026-04-29-AFTERNOON.md)
- [docs/KAIROS-SESSION-2026-04-29-EVENING.md](KAIROS-SESSION-2026-04-29-EVENING.md)

**Naming reminder:** patient/clinician names below use the scrubbed fakes from the 4/29 shift files (e.g., Aldington = morning's Boultes, Kvalheim = Patton, Larvendel = Brown, Wexbury = Ramey). The mapping table is local-only at `docs/.name-scrub-mapping-2026-04-29.md`.

**Anti-pattern reminder:** read the "Kairos is NOT HVC" section of [KAIROS-CONTEXT.md](KAIROS-CONTEXT.md) before any code session that touches this spec. Kairos has typed schemas, structured outputs, and explicit confidence calibration. No HVC-style banner blocks, post-processors, or "DO NOT MODIFY" const blocks. The card UI does not "navigate to HVC" — HVC drafts INTO destinations within the card.

---

## 1. Goal & Scope

Phase 3.3 ships the click-to-detail card view: clicking a `PatientCard` on the dashboard navigates to a 4-pane encounter detail route, mock data renders into all four panes, the bottom-left pane swaps between MyChart and Phone Script based on the routing decision tree, and an action bar (`Authorize` / `Edit` / `Defer` / `Reject`) is rendered as visual stubs. Localhost-only build on top of Phase 3.2-fix6 (commit `df31a8d`); no FHIR write-back, no HVC chat wiring, no real generation flow. Phase 3.4 wires HVC into the action buttons and provides real draft generation. Phase 3.5 lands the order pad's full 13-field auto-population plus the cross-output consistency check. v1.5 lands Pattern 13 denial-cascade timeline and the authorization state machine. v2 lands FHIR write-back as atomic-commit Authorize. The `firekraker-monorepo/kairos/` directory remains frozen through the Riverbend review window per [KAIROS-CONTEXT.md](KAIROS-CONTEXT.md).

---

## 2. Card Detail View — 4-Pane Layout

Source-of-truth layout from [KAIROS-SESSION-2026-04-29.md](KAIROS-SESSION-2026-04-29.md) Section 4. The card is the encounter mirror: HVC drafts INTO each pane's destination, the nurse never navigates to HVC.

```
┌───────────────────────────────────────────────────────────────┐
│ PATIENT HEADER                              MyChart: Active   │
│ Aldington, Charles  61M  DOB ___  MRN ___       (badge per box)│
├───────────────────────────┬───────────────────────────────────┤
│ SOURCE PANE               │ NURSE NOTE PANE                   │
│ Beckweldon's Result Note      │ HVC-drafted, pinned to source.    │
│ pinned for verification.  │ Edit inline as needed.            │
│ Read-only.                │ Clinical register.                │
│                           │                                   │
├───────────────────────────┼───────────────────────────────────┤
│ MYCHART MESSAGE  -or-     │ ORDER ENTRY PANE                  │
│ PHONE SCRIPT              │ Pre-staged orders, 13 fields each │
│ (channel-aware swap;      │ pre-filled from HVC plan + chart. │
│  see Section 3 routing)   │ Clinical-questions block-Authorize│
│                           │ until clicked.                    │
├───────────────────────────┴───────────────────────────────────┤
│  + Add context  [QuickActions: I forwarded to PCP / I called  │
│    patient and reviewed / Patient agreed to plan via phone /  │
│    Patient declined Option 1, going with Option 2]            │
├───────────────────────────────────────────────────────────────┤
│         [ Authorize ]  [ Edit ]  [ Defer ]  [ Reject ]        │
└───────────────────────────────────────────────────────────────┘
```

### Pane responsibilities

| Pane | Responsibility | 3.3 state |
|---|---|---|
| Patient header | Patient identifiers + MyChart status badge per per-box visibility rule | Renders mock patient + badge |
| Source pane (top-left) | Read-only display of provider's source artifact (Result Note, Patient Call note, MyChart message, Secure Chat thread, denial notice) | Renders mock source text |
| Nurse Note pane (top-right) | Clinical-register draft destined for the encounter Note | Renders mock HVC-drafted text, editable textarea, no generation yet |
| MyChart pane -or- Phone Script pane (bottom-left) | Channel-aware output. MyChart fields (recipient, proxy, subject, notify-by, replies setting, greeting, body) when channel = MyChart. Phone script + voicemail variant + callback state when channel = Phone | Both pane variants render from mock data; routing decision selects which to mount |
| Order pad pane (bottom-right) | 13-field staged orders with clinical-questions gate | Stub: renders fields from mock; no Authorize wiring |
| `+ Add context` row | Free-text + QuickActions for input augmentation | Renders QuickActions, no generation regen yet |
| Action bar | `Authorize` / `Edit` / `Defer` / `Reject` | All four stubbed; on click logs intent + stays on page |

### MyChart status badge per-box visibility

Per [KAIROS-SESSION-2026-04-29.md](KAIROS-SESSION-2026-04-29.md) Section 2:

- **SHOW BADGE** (outbound routing decision is downstream): Results Follow-Up, Rx Request, INR Reminder, Coumadin
- **HIDE BADGE** (source channel already determines reply): Patient Call, Pt Advice Request

The patient-header component reads the source channel from the card's mock data and shows or hides the badge accordingly.

### Action bar — 3.3 stub semantics

| Button | 3.3 behavior | 3.4 behavior | 3.5 behavior | v2 behavior |
|---|---|---|---|---|
| Authorize | Disabled or logs `authorize-clicked` to console; stays on page | Triggers HVC chat plumbing for the active pattern | Adds cross-output consistency check + clinical-questions gate | Atomic-commit FHIR Bundle (Note + Communication + ServiceRequest) |
| Edit | Toggles textareas in Nurse Note + bottom-left into editable state | Persists edit-type telemetry per Section 10 | (no change) | (no change) |
| Defer | Logs intent, returns to dashboard | Persists card state = `deferred` to investigation object | (no change) | (no change) |
| Reject | Logs intent, returns to dashboard | Captures rejection rationale free-text | (no change) | (no change) |

---

## 3. Routing Decision Tree

Three-input routing (source channel × MyChart status × urgency) plus time-of-day plus Pattern 13 auth-state. Source: [KAIROS-SESSION-2026-04-29.md](KAIROS-SESSION-2026-04-29.md) Section 2 + [KAIROS-SESSION-2026-04-29-EVENING.md](KAIROS-SESSION-2026-04-29-EVENING.md) Section 1 (Pattern 14 lock-in).

```
Reply channel =
  IF urgency = high                                 → phone (Pattern 7 / 14 spoken)
  ELIF source = phone                               → phone
  ELIF source = MyChart                             → MyChart
  ELIF source = Epic result + MyChart Active recent → MyChart
  ELIF source = Epic result + MyChart stale/Pending/Inactive/None
                                                    → phone (Pattern 14)
  ELIF source = Epic result + URGENT content        → phone (Pattern 7)
  ELIF source = Secure Chat + auth-state = denial-cascade
                                                    → MyChart + voicemail (Pattern 13)
  ELSE                                              → flag for nurse routing decision

Sort: urgency desc → channel (MyChart first) → time received
Time-of-day rule: urgency override does NOT fire pre-8 AM (phone window opens 8 AM)
```

### MyChart status badge — per box

| Box | Show badge |
|---|---|
| Results Follow-Up | yes |
| Rx Request | yes |
| INR Reminder | yes |
| Coumadin | yes |
| Patient Call | no (source = phone) |
| Pt Advice Request | no (source = MyChart) |
| Secure Chat | no (source channel determines) |

### Channel determines output register (binding)

Output shape is a derivative of channel decision, not a separate decision. Per [KAIROS-SESSION-2026-04-29-EVENING.md](KAIROS-SESSION-2026-04-29-EVENING.md) CASE 27 (Wexbury / Pattern 14):

- **MyChart channel → written register** (parens for translation, formal greeting, signature block)
- **Phone channel → spoken register** (inline translation, opening orienter, conversation-opener close, paragraph breaks for pacing)
- **Voicemail variant** of phone register: ~30-45 sec spoken, callback request, condensed clinical content

The bottom-left pane's component selection is driven by `lib/routing.js`. See Section 8 for register rules.

### 8 AM phone window time-of-day rule

Pre-8 AM, urgency override is muted: an URGENT card stays in the queue and surfaces but does not auto-route to phone. The nurse clears one-tap synthesis cards first; phone calls begin at 8 AM. Real morning evidence: 4/29 morning, 4 of 5 Results Follow-Up cards cleared by 7:50 AM, Esselbach's URGENT phone call initiated 8:01 AM (see [KAIROS-SESSION-2026-04-29.md](KAIROS-SESSION-2026-04-29.md) Section 10).

---

## 4. 14-Pattern Card Taxonomy

Cumulative across 4/28 morning + 4/29 morning/afternoon/evening, 19 distinct cards observed across the day. Source-of-truth tables: [KAIROS-SESSION-2026-04-29-EVENING.md](KAIROS-SESSION-2026-04-29-EVENING.md) Section 3.

| # | Name | Trigger | Active panes | Action buttons | Surface |
|---|---|---|---|---|---|
| 1 | SYNTHESIS only | Provider decided, no orders, no labs | Source / Nurse Note / MyChart / (Order pad empty) | Generate Note + MyChart | v1 |
| 2 | SYNTHESIS + NEW ORDER | Plan includes new diagnostic study or referral (Aldington TTE) | All 4 | Generate Note + MyChart + order-staging diff | v1 |
| 3 | SYNTHESIS + DOSE CHANGE | Med modification, no labs | All 4 (order pad shows dose-change sub-pattern) | Generate Note + MyChart + dose diff | v1 |
| 4 | SYNTHESIS + DOSE CHANGE + LAB CLUSTER | Med change + multi-lab follow-up (Hesperdale Crestor 40 + lipid + hepatic) | All 4 (order pad shows lab cluster) | Generate Note + MyChart + dose diff + lab cluster | v1 |
| 5 | SYNTHESIS + CHOICE | Two-stage with conditional staged orders (Brexley statin choice) | All 4 (order pad pre-stages both) | Generate Note + MyChart + Choose Option A/B | v1 |
| 6 | SYNTHESIS + HANDOFF | Cross-specialty referral, no orders fire from cardiology side (Wendelfaer PCP handoff) | Source / Nurse Note / MyChart / (Order pad shows handoff routing) | Generate Note + MyChart + Route to PCP | v1 |
| 7 | URGENT | Symptom-acuity high; phone-only regardless of MyChart status (Esselbach BNP 1024) | Source / Nurse Note / Phone Script / (Order pad optional) | Generate Note + Phone Script + Page Provider | v1 |
| 7b | ASYNC PRE-CALL STRUCTURED INQUIRY | Patient-origin or outside-origin clinical inbound; nurse must call back to gather information; full lifecycle proven through Underwell (see Section 6 Pattern 7b state machine) | Source / Nurse Note (pre/post SBAR) / MyChart-or-Phone (questions outbound; SBAR after reply) / (Order pad usually empty) | Generate Inquiry / Process Reply / Generate SBAR | v1 |
| 8 | CONTRADICTION | Patient statement contradicts chart; clinical safety hold (Maundrell warfarin contradiction) | Source / Nurse Note (verify-upstream stub) / (other panes inactive) | Forward to Provider (NO autonomous resolution) | v1 |
| 9 | TRANSACTIONAL REPLY | MyChart confirmation round-trip, minimal cognitive load (Norreys refill confirmation) | Source / Nurse Note (1-line) / MyChart (1-line) / (no orders) | Generate Reply | v1 (Layer 2 one-tap) |
| 10 | COORDINATION | Multi-task across boxes, persistent investigation, multi-party scheduling (Kvalheim, Heldenmark Secure Chat, Halbrook DME PA) | Source / Nurse Note / MyChart-or-Phone / (Order pad usually empty) | Generate Reply + Forward to Provider with options | v1 surface; Pattern 10 reroute v3-v4 |
| 11 | ADMINISTRATIVE (Layer 1) | Pharmacy fax, records request, refill-rule auto-clear — NOT cards in v1 surface; background agent | (none — invisible to nurse unless flagged) | (none — agent action) | v1.5 (Coumadin fax OCR), v3 (full agent) |
| 12 | SCOPE-CONSTRAINED PATIENT QUESTION | Patient asks vague clinical question; vague-reference classifier triggers clarification subroutine (Quennell-redux) | Source / Nurse Note (scope-respecting answer) / MyChart / (Order pad empty) | Request Clarification / Generate Scope-Respecting Reply | v1 |
| 13 | INSURANCE DENIAL CASCADE | ServiceRequest denied; persistent investigation across multiple Epic surfaces; auth-state drives auto-framing (Larvendel 8-day, NM SPECT then CTA Coronary, peer-to-peer deadline today) | Source / Nurse Note / MyChart / Order pad with **denial timeline view + auth-state badge + peer-to-peer countdown** | Generate Denial-Aware Outreach / Schedule Peer-to-Peer (deadline) / Forward to Provider | **v1.5** (timeline view + auth state machine); v1 surface as Pattern 10 with manual framing |
| 14 | PHONE-CHANNEL SYNTHESIS | Result Note when MyChart Pending/Inactive/None; spoken register required (Wexbury TTE result) | Source / Nurse Note / Phone Script + voicemail variant / (Order pad usually empty) | Generate Note + Phone Script + Voicemail Variant | v1 |

### Action button sets — explicit per the spec

- **Pattern 1 SYNTHESIS:** `Generate Note + MyChart`
- **Pattern 2 SYNTHESIS + ORDER:** `Generate Note + MyChart` + `Order Staging Diff`
- **Pattern 7b ASYNC PRE-CALL:** `Generate Inquiry` / `Process Reply` / `Generate SBAR`
- **Pattern 13 DENIAL CASCADE:** `Timeline View` + `Auth-State Badge` + `Peer-to-Peer Countdown`
- **Pattern 14 PHONE SYNTHESIS:** `Generate Note + Phone Script` + `Voicemail Variant`

In 3.3 these all render as visual stubs only — clicks log intent. 3.4 wires the generation flow.

---

## 5. Order Pad — 13-Field Auto-Population Spec

Source: [KAIROS-SESSION-2026-04-29.md](KAIROS-SESSION-2026-04-29.md) Section 4 + CASE 1 (Aldington) and CASE 3 (Hesperdale). Field-level derivation rules below; each field has a **derivation source**, a **fallback**, and a **confidence flag** that surfaces in UI when the derivation is weak.

| # | Field | Derivation rule (from HVC plan + chart context) | Fallback | Confidence flag |
|---|---|---|---|---|
| 1 | Order type | First noun phrase after "order" / "obtain" / "schedule" in HVC plan, normalized to Epic order catalog name | Free-text input | low if no catalog match |
| 2 | Code variant | User preference list (e.g., `STERNE BR` variant) keyed on order type | First catalog variant | low if no preference match |
| 3 | Reason for exam | HVC plan verbatim sentence containing the order rationale | Empty | low if HVC plan absent |
| 4 | Associated dx | Cross-ref of HVC plan reasoning against problem list `Condition` resources; first N that match | Top-of-problem-list dx | low if zero matches |
| 5 | Priority | Default `Routine` unless HVC plan contains "urgent"/"stat"/"expedited" | `Routine` | always confident |
| 6 | Class | Default `Ancillary Performed` for diagnostics, `Lab Collect` for labs, `Outpatient Referral` for referrals | `Ancillary Performed` | confident from order type |
| 7 | Status | Default `Future` unless order type is point-of-care | `Future` | confident |
| 8 | Expected date | HVC plan date phrase ("repeat in 90 days", "follow up next month") parsed to absolute; default `First Available` | Today + 30 days | low if HVC plan vague |
| 9 | Expires | Default per-order-type catalog rule | Today + 365 days | confident |
| 10 | Clinical questions | Order-catalog-defined list (e.g., "Stroke/TIA?", "Saline bubble study?") — surfaced as ⚠ block-Authorize until each is acknowledged | Skip if order type has none | always confident |
| 11 | Release to patient | Default per-order-type rule (most labs yes, most imaging yes) | yes | confident |
| 12 | CC Results | Default = ordering provider + cosign target | ordering provider only | confident |
| 13 | Cosign route | Provider on encounter; for nurse-pended orders, route to attending of record | Box-default cosign | confident |

**Block-Authorize gate (Field 10):** any clinical question marked ⚠ disables the `Authorize` button until acknowledged. UI shows a yellow banner "Order requires verification" with the unanswered question count.

### Dose-change sub-pattern

When HVC plan contains phrases like `"increase X to Ymg"`, `"discontinue Y"`, `"taper Z"`:

| Element | Auto-fill |
|---|---|
| Current dose | Pulled from active `MedicationRequest` matching the drug |
| New dose | Parsed from HVC plan |
| Discontinue reason | Selected from HVC plan keywords (`Dose adjustment`, `Therapeutic switch`, `Adverse effect`) |
| End date | Today |
| Audit-trail notes | Auto-generated from template `"increasing to {new} from {old} per {provider}"` (or `"decreasing to ..."` / `"discontinuing ..."` / `"holding ..."`) |
| Taper instructions | Auto-fill from HVC plan if a taper schedule is present; otherwise empty |

Hesperdale Crestor 40mg → DC 20mg pattern is the canonical example ([KAIROS-SESSION-2026-04-29.md](KAIROS-SESSION-2026-04-29.md) CASE 3).

### Lab-cluster sub-pattern

When HVC plan contains phrases like `"repeat X and Y in 90 days"`, `"recheck X, Y, Z next visit"`:

| Element | Auto-fill |
|---|---|
| Cluster detection | HVC plan contains 2+ lab names + a single time phrase |
| Future date | Single shared date for all lab orders in the cluster |
| Diagnosis association | Single shared dx applied to every order in the cluster (one-step UI) |
| Standing-order grouping | All cluster members surface as one collapsible row in the order pad |

Hesperdale Lipid Panel + Hepatic Function Panel both Future 7/29/2026 is the canonical example.

### Clinical questions block-Authorize

For any order whose catalog entry defines clinical questions (stroke/TIA, saline bubble, contrast allergy, etc.), the order pad surfaces them inline. Each question must be acknowledged (radio button: Yes / No / Not applicable) before the `Authorize` button enables. Authorize is gated globally — even if all other panes are clean, an unanswered clinical question blocks the atomic commit.

---

## 6. Persistent Investigation Object

The card UI surfaces what Epic does not: a single object that holds an open clinical question across days, channels, encounters, and orders. Source: [KAIROS-SESSION-2026-04-29-EVENING.md](KAIROS-SESSION-2026-04-29-EVENING.md) CASE 25 (Larvendel, 8 days, 4 Epic surfaces) + CASE 28 (Underwell Pattern 7b lifecycle).

### Schema sketch (v1, mock-data shape)

```
investigation = {
  investigationId:    string (uuid)
  patientId:          string (FHIR Patient.id)
  patternId:          one of 1..14
  state:              one of (open states — see state machine below)
  encounterIds:       string[]  (FHIR Encounter.id list — chronological)
  orderChain:         OrderChainEntry[]  (see below)
  threadIds:          ThreadRef[]        (Secure Chat / In Basket / MyChart message refs)
  noteRefs:           string[]   (FHIR DocumentReference.id list)
  clinicalQuestion:   string     (canonical short phrase: "amlodipine BP/edema",
                                  "denial cascade NM SPECT → CTA → cath",
                                  "scheduling escalation Tregarthen-equivalent")
  authState:          AuthState? (only for Pattern 13; see below)
  channelHistory:     ChannelEvent[]     (voicemail, MyChart, secure chat send/recv)
  createdAt:          ISO datetime
  lastTouchedAt:      ISO datetime
  windowOpen:         boolean    (false once SIGNED or CLOSED)
}

OrderChainEntry = {
  serviceRequestId:   string (FHIR ServiceRequest.id)
  authState:          AuthState
  placedAt:           ISO datetime
  cancelledAt:        ISO datetime?
  replacedBy:         string?     (next ServiceRequestId in the cascade)
}

ThreadRef = {
  channel:            "secure-chat" | "in-basket" | "mychart"
  externalId:         string
  lastMessageAt:      ISO datetime
  participantCount:   number
}

ChannelEvent = {
  channel:            "phone" | "voicemail" | "mychart" | "secure-chat" | "in-basket"
  direction:          "in" | "out"
  at:                 ISO datetime
  receiptStatus:      "delivered" | "read" | "no-answer" | "callback-pending"
}
```

### Investigation state machine (general)

```
NEW → AWAITING_NURSE → IN_PROGRESS → AWAITING_PATIENT → REPLY_RECEIVED →
  AWAITING_PROVIDER → PROVIDER_PLAN → CALLBACK_PENDING → SIGNED → CLOSED

Side states (any open state can transition to):
  - DEFERRED  (nurse parked it; lastTouchedAt rolls)
  - HOLD      (CONTRADICTION / scope concern / safety flag)
  - ESCALATED (calm reply → URGENT phone callback bump per Pattern 7b)
```

Transitions:
- `NEW → AWAITING_NURSE`: card auto-deal from FHIR pull or Secure Chat hook
- `AWAITING_NURSE → IN_PROGRESS`: nurse opens detail view
- `IN_PROGRESS → AWAITING_PATIENT`: outbound MyChart sent (Pattern 7b first-half) or Phone Script delivered as voicemail
- `AWAITING_PATIENT → REPLY_RECEIVED`: patient response inbound (MyChart reply, callback in)
- `REPLY_RECEIVED → AWAITING_PROVIDER`: SBAR drafted, forwarded to provider
- `AWAITING_PROVIDER → PROVIDER_PLAN`: provider note signed (primary + optional addenda — see Section 9 cross-note synthesis)
- `PROVIDER_PLAN → CALLBACK_PENDING`: callback note synthesized, phone attempt initiated
- `CALLBACK_PENDING → SIGNED`: encounter signed
- `SIGNED → CLOSED`: post-window cleanup; `windowOpen` flips false

### Cross-channel consolidation rule

```
same patientId
+ same canonical clinicalQuestion
+ active window (windowOpen = true OR lastTouchedAt within 14 days)
= one investigation
```

When a new Secure Chat thread or In Basket message arrives that maps to an existing investigation, it appends to `threadIds` rather than creating a new investigation. The dashboard shows one card; the detail view's source pane shows the most recent contributing artifact with a "+N earlier" disclosure.

### Authorization state machine for ServiceRequests (Pattern 13)

Each `OrderChainEntry.authState` walks this graph:

```
ORDERED → PRE_CERT_SUBMITTED → IN_REVIEW →
  ├─ APPROVED → (executes; chain ends here)
  ├─ DENIED → ALT_ORDERED (provider decides) →
  │            ├─ new ServiceRequest replaces chain head
  │            └─ goes back to ORDERED
  ├─ DENIED → APPEALED → IN_REVIEW
  └─ DENIED → PEER_TO_PEER_OFFERED  (deadline-bound, today-only urgency)
              ├─ PEER_TO_PEER_DONE → APPROVED | DENIED
              └─ PEER_TO_PEER_MISSED → DENIED (auto)
```

Larvendel's 8-day cascade (NM SPECT → DENIED → exercise stress echo offered → patient unable → Lexiscan Myoview ordered → cancelled → CTA Coronary ordered → DENIED → peer-to-peer today only or move to cath) is the canonical evidence. The card pane surfaces the current `authState` as a badge plus a peer-to-peer countdown timer when applicable.

### Pattern 7b 8-state lifecycle spec

From [KAIROS-SESSION-2026-04-29-EVENING.md](KAIROS-SESSION-2026-04-29-EVENING.md) CASE 28 (Underwell):

```
1. PHONE_INBOUND          (Patient Call arrives)
2. CHART_CONTEXT_PULL     (.triage equivalent fires — see lib/chartContext.js)
3. SBAR_DRAFT_INITIAL     (chart-aware questions generated)
4. PATIENT_CALL_1         (nurse calls, gathers data)
5. SBAR_REGENERATION      (with patient answers + chart context)
6. PROVIDER_REVIEW        (forwarded; AWAITING_PROVIDER state)
7. PROVIDER_PLAN_RECEIVED (primary plan + optional addenda — see Section 9)
8. CALLBACK_NOTE_SYNTHESIS (cross-note synthesis into unified callback)
   → PATIENT_CALL_2 → SIGN_ENCOUNTER → CLOSE
```

Each state is a card UI state. The investigation object holds across all of them. In 3.3 the card detail view renders the current state as a header chip; state transitions are stubbed (no real generation) and v1 of the state machine ships in 3.4 alongside HVC wiring.

---

## 7. Cross-Output Consistency Check (v1 Safety Rail)

Pre-Authorize, the system extracts drug names + doses + dx codes from the Nurse Note pane and the MyChart message pane (or Phone Script pane). Mismatches block Authorize and surface as a yellow banner. This is the v1 belt-and-suspenders before the phiGuard RxNorm fix lands.

### What gets extracted

| Element | Source(s) | Match rule |
|---|---|---|
| Drug names | Both panes | Identical token sets (case-insensitive, RxNorm-aware) |
| Doses | Both panes | Identical numeric + unit pairs per drug |
| Dx codes | Both panes (when present) | Identical ICD-10 codes |

### Phantom phiGuard placeholder bug guard

When either pane contains the literal token `[Patient Name]` (or `[REDACTED]`, `[NAME]`, etc.), the consistency check fails hard with a red banner: **"PHI placeholder leak detected — phiGuard misfired. Edit before Authorize."** The known failing surface is brand-name capitalized drugs (Brexley case: `Nexlizet` redacted to `[Patient Name]`); the placeholder guard catches the leak even when the underlying phiGuard hasn't been fixed yet.

### Mismatch surfacing

Three banner colors:

- **Red — block Authorize** for: PHI placeholder leak, drug-name mismatch (drug appears in one pane, missing or different drug in the other), dose mismatch.
- **Yellow — warn but allow Authorize** for: dx code drift (code differs but lay description matches), drug spelling variants where RxNorm collapses them.
- **Green — silent** when both panes are consistent.

### Dose/dx extraction lives in `lib/consistency.js`

Module signature (specified, not implemented):

```
extractClaims(text)        → { drugs: [{name, dose, route, freq}], doses, dxCodes }
checkConsistency(noteText, outboundText)
                           → { ok: bool, mismatches: [...], placeholderLeak: bool }
```

Wired into the Authorize handler in 3.5. In 3.3 the module exists but the handler does not run it (button is a stub).

---

## 8. Channel-Aware Output Register

Source: [KAIROS-SESSION-2026-04-29-EVENING.md](KAIROS-SESSION-2026-04-29-EVENING.md) CASE 27 (Wexbury / Pattern 14). Output shape is a functional adaptation to delivery medium, not a stylistic preference — MyChart messages are read silently with rereads available; phone scripts are heard once with the listener's anxiety modulated by the speaker's pacing.

### MyChart register rules

- Parenthetical lay translation: `"BNP (a protein your heart releases when it is under stress)"`, `"LDL (bad cholesterol)"`, `"trivial (very slight)"`
- Formal greeting block: `"Ms {LastName},"` on its own line
- Opening attribution preserves provider authority: `"Mr. {Provider} has reviewed your recent {result-type}"`
- Status frame for normal results: reassurance + specific values + plan + safety symptoms + sign-off
- Standard sign-off block (Brandon's identity, preserved from CONTEXT): `"Brandon Sterne, RN BSN / Heart and Vascular Clinic"`
- Audit-trail closer in nurse note (not MyChart): `"Patient notified via MyChart"`
- 6th-grade reading level calibration

### Phone register rules

- Inline lay translation (no parens — parens don't read aloud): `"Trivial, meaning very slight"`, `"Ejection fraction, which measures how well your heart squeezes"`
- Opening orienter: `"We're calling with the results of your recent..."` — establishes context before content
- Front-loaded reassurance: `"The good news is..."` anchors patient anxiety down before details land
- Sentence-level paragraph breaks for nurse pacing during spoken delivery
- Chamber-by-chamber narrative for echo results (functional → anatomical → findings → action)
- Provider-authority preserved: `"Mr. {Provider} has reviewed these findings and is not making any changes"`
- Conversation-opener close: `"Do you have any questions about these results?"` — invites dialogue, doesn't close the conversation

### Voicemail variant rules

- ~30-45 seconds spoken (target word count ~80-110 words at ~150 wpm)
- Opening: `"Hi {Name}, this is {Nurse} from {Clinic}, calling about your recent {topic}..."`
- Front-loaded reassurance OR front-loaded callback request, depending on urgency
- Condensed clinical content: 1-2 sentences max (no chamber-by-chamber detail)
- Explicit callback ask: `"Please give us a call back at {phone} so we can review the details with you."`
- No PHI beyond patient first name and the bare clinical topic

### Phone callback state machine

```
VOICEMAIL_LEFT  (attempt 1 voicemail recorded)
   → CALLBACK_ATTEMPT_2  (next-day re-dial, second voicemail with stronger callback ask)
   → CALLBACK_ATTEMPT_3  (third voicemail + provider notify)
   → REGISTERED_LETTER_OR_CHART_FLAG  (terminal — provider decides next step)
```

Pattern 14 cards do not auto-close on send the way MyChart cards do. The investigation stays in `CALLBACK_PENDING` until an inbound call returns or the state machine reaches the terminal.

### Multi-channel outreach correlation

When a Pattern 13 outreach fires both MyChart and phone simultaneously (Larvendel closure), the outbound MyChart message includes a voicemail-acknowledgment line:

> `"I also tried to reach you by phone today and left a voicemail."`

This line is auto-generated when `channelHistory` shows a voicemail event within 30 minutes of the MyChart send. Currently typed manually every time; auto-correlation eliminates the Type 4 edit.

### Read-receipt as state signal

`Communication.received` field drives card escalation timing. For time-sensitive denial cascades (Pattern 13), unread MyChart >24 hours auto-bumps to phone callback attempt 2. For routine synthesis (Pattern 1), no auto-bump.

---

## 9. Cross-Note Synthesis (Pattern 7b critical)

Provider response within an investigation may land as multiple Epic notes: primary plan + addendum, or primary + correction, or sequential plan revisions. HVC must absorb all of them into one unified callback note. Source: [KAIROS-SESSION-2026-04-29-EVENING.md](KAIROS-SESSION-2026-04-29-EVENING.md) CASE 28 (Underwell — primary plan 3:25 PM + addendum 3:27 PM merged into one numbered list of six items in the callback note).

### What HVC must do

1. Collect all notes within the investigation window keyed by `Encounter.id` and contributing provider
2. Synthesize into one unified callback note with reordered concepts for patient comprehension (action items first, reassurance context middle, follow-up obligations last)
3. Preserve provider attribution: `"Spoke with patient by phone to relay plan per {Provider}"`
4. No fabricated patient response — note documents what was relayed, not what patient said back

### v1 (3.3 + 3.4)

Nurse manually selects which provider notes feed HVC. Card detail view shows a **"Provider notes ({count})"** disclosure in the source pane; nurse checks the boxes for the notes to include before Generate Inquiry / Process Reply / Generate SBAR fires. The synthesis call sends all checked notes in a single HVC request.

### v2

`Encounter.id`-scoped FHIR query auto-collects all `DocumentReference` resources signed by any provider on the investigation's encounter list within the active window, and pre-checks them in the source pane. Nurse can uncheck if a note is irrelevant. No manual paste.

### Cross-output consistency check rides on this

The Section 7 consistency check runs against the unified callback note + the outbound channel pane (MyChart or Phone). When provider notes contradict each other (rare; usually addendum supersedes primary), the synthesizer prefers addendum and surfaces a yellow banner: `"Provider plan revised — addendum overrides primary on {N} items"`.

---

## 10. Edit-Type Taxonomy + Telemetry

5 categories from [KAIROS-SESSION-2026-04-29-AFTERNOON.md](KAIROS-SESSION-2026-04-29-AFTERNOON.md) Section 4.

| Type | Description | Eliminable? | Rail | Telemetry use |
|---|---|---|---|---|
| 1 | Clinical judgment override | NO — irreducible | Calibration signal for recommendation aggressiveness | **Tracked**; type-1 rate IS the safety metric |
| 2 | Chart-claim correction | yes | Chart-claim verification rail (FHIR query before Authorize) | Tracked; trend should fall as v2 ships |
| 3 | Tone/style edit | n/a | Don't optimize. User preference. | **Not tracked** |
| 4 | Scope edit (nurse adds context HVC didn't have) | partially | Input augmentation field with QuickActions | Tracked; trend toward zero as QuickActions cover patterns |
| 5 | PHI/output bug fix | yes | phiGuard RxNorm fix + reasoning-leak detection | Tracked; rate should fall to zero post-fix |

Type 1 stays. Types 2/4/5 trend toward zero as rails harden. Type 3 ignored.

### Per-Authorize telemetry capture

When the nurse clicks `Authorize`, the system captures (locally for v1, eventually `kairos_telemetry` Supabase table for v2):

```
{
  cardId:               string
  patternId:            1..14
  editType:             0..5  (0 = clean, no edit)
  timeToAuthorizeMs:    number  (card open → Authorize click)
  edits:                Edit[]  (textual diffs against initial draft, optional)
  overrideRationale:    string?  (free-text, REQUIRED for Type 1)
  authorizedAt:         ISO datetime
  nurseId:              string  (single-nurse v1: hard-coded constant)
}
```

In 3.3 the telemetry struct is defined and logged to console only. 3.4 wires the localStorage persistence; v2 wires Supabase write.

**Override rationale capture (Type 1):** when the nurse edits the AI-proposed clinical recommendation (Pattern 2 / Pattern 4), a modal appears post-edit asking for rationale before Authorize enables. Free text. Goes to audit log + calibration data. **This is the only hard gate the telemetry system imposes in v1.**

---

## 11. Component Inventory (3.3 build)

New files:

| File | Role | Notes |
|---|---|---|
| `app/encounter/[id]/page.js` | Server component for the detail route | Reads mock card by id, passes to client `EncounterDetail` |
| `components/EncounterDetail.js` | 4-pane shell client component | Holds active-pane state, channel selection, action-bar wiring |
| `components/PatientHeader.js` | Patient identifiers + MyChart status badge | Per-box badge visibility from `lib/routing.js` |
| `components/SourcePane.js` | Read-only source artifact | Renders provider Result Note, Patient Call note, MyChart message, Secure Chat thread, denial notice |
| `components/NurseNotePane.js` | Editable Nurse Note draft | Textarea + edit-type capture |
| `components/OutputPane.js` | Channel-aware bottom-left | Mounts `MyChartPane` or `PhoneScriptPane` based on `lib/routing.js` decision |
| `components/MyChartPane.js` | MyChart fields (recipient, proxy, subject, notify-by, replies, greeting, body) | Driven by mock data |
| `components/PhoneScriptPane.js` | Phone script + voicemail variant + callback-state chip | Driven by mock data; callback state stubbed |
| `components/OrderPadPane.js` | 13-field staged order(s) display, stub block-Authorize gate | No real auto-pop in 3.3 |
| `components/ActionBar.js` | Authorize / Edit / Defer / Reject row | All four stubbed in 3.3 |
| `components/AddContextRow.js` | Free-text + QuickActions chips | Renders the four QuickAction chips; click logs intent |
| `lib/routing.js` | Channel decision tree (Section 3) | Pure function: `routeFor(card) → { channel, badgeVisible, register }` |
| `lib/patterns.js` | 14-pattern taxonomy as data | Array of pattern descriptors with id, name, trigger, panes, actionButtons, surface |
| `lib/consistency.js` | Cross-output consistency check (stub in 3.3) | `extractClaims` + `checkConsistency` exported; not invoked by 3.3 Authorize |
| `lib/investigation.js` | Investigation-object schema + state machine helpers (stub in 3.3) | Type definitions + transition validators |
| `data/mock-encounters/{id}.json` | Mock card data for each of the 14 pattern fixtures | One file per fixture, used by `app/encounter/[id]/page.js` |

Modified files:

| File | Change |
|---|---|
| `app/dashboard/page.js` | Card click handler → `router.push("/encounter/{id}")`; tab state preserved via search-param |
| `components/PatientCard.js` | Wrap inner content in clickable `<button>` (already partially done in 3.2-fix6); add `onClick` with `router.push` |

Untouched (for 3.3):

- `app/api/hvc/*` — HVC fork stays at `df31a8d`; no wiring changes
- `app/globals.css` — token system from 3.2-fix5 is final
- `app/layout.js` — Fraunces / GeistSans / JetBrains_Mono config final
- `firekraker-monorepo/kairos/` — frozen per Riverbend protocol

---

## 12. Sequencing

| Phase | Ships |
|---|---|
| **3.3** | 4-pane shell + click-to-detail navigation + mock data render + channel-aware bottom-left + back button + visual stubs for action bar |
| **3.4** | HVC chat wired into action buttons + real generation flow per pattern + edit-type telemetry → console |
| **3.5** | Order pad full 13-field auto-pop + cross-output consistency check live before Authorize + telemetry persists to localStorage |
| **v1.5** | Pattern 13 denial cascade timeline view + authorization state machine + peer-to-peer countdown UI + Coumadin fax OCR pipeline |
| **v2** | FHIR write-back: atomic-commit Authorize as single Bundle (DocumentReference + Communication + ServiceRequest); telemetry persists to Supabase `kairos_telemetry`; cross-note synthesis auto-collects via Encounter.id |

3.3 deliberately ships visual scaffold without generation. The cold-eyes review tomorrow gates whether 3.4 starts the same week or the spec rewrites first.

---

## 13. Open Questions for Cold-Eyes Review Tomorrow

### What might be missing from this spec

1. **Edit-state persistence across navigation.** If a nurse opens a card, edits the Nurse Note, defers, comes back — does the edit persist locally? The spec implies yes via the investigation object, but the storage mechanism for v1 mock data is undefined. Probably needs a localStorage shim until Supabase lands in v2.
2. **Card lifecycle on the dashboard side.** The spec covers the detail view but doesn't say how `Authorize` removes the card from the dashboard. Probably "card flies off + stack height drops" per the solitaire metaphor, but the animation/state transition needs a spec section.
3. **Back button semantics.** Browser back vs an in-app back chip? The detail view should preserve the dashboard tab the nurse was on. Currently implied; should be explicit.
4. **Pattern 11 (ADMINISTRATIVE) presence in the UI.** Spec says "not cards." But the Layer 1 agent surface needs SOME UI for the nurse to see what got auto-cleared, audit it, and surface anomalies. Not in 3.3 scope, but worth clarifying it's a v1.5 backlog item, not "doesn't exist."
5. **Investigation object lifetime / GC rule.** `windowOpen` flips false on SIGNED → CLOSED, but what evicts CLOSED investigations from local state? 14-day rolling window matches the cross-channel consolidation rule; should be explicit.
6. **Who owns the routing decision when the card is ambiguous?** The decision tree's `ELSE → flag for nurse routing decision` branch — what does that flag look like? A modal? A pane affordance? Spec leaves it open.

### What might be overscoped for 3.3

1. **All 14 panes' visual stubs.** 3.3 could ship Patterns 1, 2, 7b, 13, 14 as a vertical slice (covering the structural variants) and defer 3, 5, 6, 8, 9, 10, 12 to 3.3.1. The session files have richer evidence for the five listed; the others are pattern declarations without full UI exploration.
2. **PhoneScriptPane voicemail variant + callback state machine** in 3.3 is a lot of UI for stub functionality. Could be reduced to "Phone Script body + voicemail-variant disclosure" only, with the callback state machine deferred to 3.4 alongside HVC wiring.
3. **OrderPadPane 13-field rendering** — fields display is straightforward, but the **clinical-questions block-Authorize gate** is real logic. Reasonable to keep both in 3.3 (the gate is just `disabled={hasUnansweredQuestions}` on the button), but worth checking whether mock data carries clinical-question fixtures.
4. **AddContextRow QuickActions** are visible but un-wired in 3.3. Cosmetic risk: makes the UI look more interactive than it is. Could be hidden behind a feature flag until 3.4.

### Sequencing decisions that might want a second look

1. **Should 3.4 wire HVC for ALL patterns or a subset?** The temptation is to wire all 14; the safer slice is Patterns 1, 2, 14 (synthesis variants — same generation primitive). Patterns 7b, 13 require persistent investigation state and are 3.5 / v1.5 candidates.
2. **Does v1.5 (Pattern 13) really need to wait for v2 FHIR write-back?** The denial timeline view + auth-state badge can render entirely from local mock state. Peer-to-peer countdown is just a setInterval. Could pull v1.5 forward into 3.5 if the design holds up under cold-eyes review.
3. **Cross-output consistency check (`lib/consistency.js`) is in 3.3 file inventory but not invoked until 3.5.** Should the module land in 3.5 alongside the wiring? Or in 3.3 to lock the API surface for review? Current spec leans 3.3 for review, 3.5 for invocation; could go either way.
4. **Investigation object schema (`lib/investigation.js`) shipped as types-only in 3.3.** Should the state-machine validators be live in 3.4 (drives card-state transitions) or v1.5 (Pattern 13 needs them most)? Probably 3.4 since Pattern 7b also needs them.

### Patterns that might not fit the 4-pane shape cleanly

1. **Pattern 8 CONTRADICTION (Maundrell).** The card is a clinical safety hold — most panes are inactive. The 4-pane scaffold renders three blank panes. Possibly needs a collapsed "verify-upstream" single-pane variant. Specced as four panes here for consistency; flag for review.
2. **Pattern 10 COORDINATION (Kvalheim, Heldenmark, Halbrook).** Multi-task, multi-thread, sometimes spans Secure Chat + In Basket + phone. The bottom-right Order pad is usually empty. The Source pane gets crowded with thread history. Possibly needs a different right-side composition (e.g., "Threads" pane instead of "Order pad" for Pattern 10). Specced as standard 4-pane; flag for review.
3. **Pattern 11 ADMINISTRATIVE (Layer 1).** Not a card in 3.3. Listed in the taxonomy for completeness but has no detail view. Confirm this stays out of 3.3 scope.
4. **Pattern 13 DENIAL CASCADE (Larvendel).** The Order pad pane needs to expand to include the **denial timeline view**, the **auth-state badge**, and the **peer-to-peer countdown**. That's three widgets in one pane. Either the Order pad becomes "Order chain + auth state" for Pattern 13, or a fifth pane is needed. Currently specced as Order-pad-with-extras; flag for review.

---

**End of draft. Cold-eyes review 2026-04-30. No code until reviewed.**
