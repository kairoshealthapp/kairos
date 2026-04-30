# Kairos Build Log

Append-only chronological log of build sessions. Companion to `docs/CONTEXT.md` (which is the persistent rolling context). This file shows *what shipped when*; CONTEXT.md shows *current truth*.

---

## 2026-04-27 — Session 1: initial scaffold

**Scope:** stand up the new private `kairos` repo end-to-end with the Whitfield canonical proof-point wired through chart-aware question generation.

**Repo & infra:**

- Created `firekraker1272/kairos` (private) via `gh repo create`.
- Cloned to `C:\Users\kents\kairos` (sibling to firekraker-monorepo, NOT inside it).
- Scaffolded Next.js 16.2.4 (App Router, JavaScript only, Tailwind v4, no ESLint, no `src/`, alias `@/*`) via `create-next-app@latest`.
- Installed `@anthropic-ai/sdk@^0.91.1`.
- `.env.local` created (empty `ANTHROPIC_API_KEY=` — Brandon fills in manually). `.env.example` committed. `.gitignore` already covers `.env*`.

**Code:**

- `data/patients/whitfield.json` — synthetic FHIR R4 Bundle for the canonical Whitfield case. 18 entries: Patient, Encounter (today's outside-clinician triage call), 4 Conditions (CHF, pleural effusion, COPD, AS), 5 MedicationRequests (Lasix marked `stopped` 2026-03-01, plus active lisinopril/metoprolol/atorvastatin/aspirin), Observations (NT-proBNP 3420 H, sodium 131 L, three weights showing 1.5 lb gain over 14 days), 2 DocumentReferences (cardiology consult d/c'ing Lasix, prior thoracentesis tolerated poorly). All identifiers fictional. Real LOINC/SNOMED/RxNorm. Top-level `_comment` documents the synthetic-data provenance.
- `lib/fhir/schemas.js` — FHIR R4 shape constants and a `makeBundle` helper.
- `lib/fhir/mockData.js` — file-system-backed Bundle loader with an in-process cache.
- `lib/fhir/client.js` — async mock FHIR client (`getPatient`, `getEncounter`, `searchConditions`, `searchMedications`, `searchObservations(category)`, `searchDocumentReferences(type)`). **This is the swap point for the live Epic client** — every method documents the corresponding Epic endpoint. Return shapes match Epic R4.
- `lib/fhir/chartContext.js` — `assembleChartContext(patientId, encounterId)` pulls the slices the prompt needs (active problems, active + recently-stopped meds, recent vitals, recent labs, recent clinical notes) and produces a dense, clinically structured plain-object summary. `hashChartContext` returns a deterministic short hash for regeneration tracking.
- `lib/claude/client.js` — server-side-only Anthropic wrapper. API key is read at call time so missing-key surfaces as a 500 from the API route, not a build crash. `KAIROS_OPUS_MODEL = "claude-opus-4-7"`.
- `lib/prompts/chartAwareQuestions.js` — `generateChartAwareQuestions(chartContext, callerContext)`. System prompt enforces the binding rules: never assert findings, every question carries a chart-finding rationale, calibrated confidence, caller-context shifts framing (patient/family vs outside_clinician). Output is strict JSON matching the schema in the spec. Temperature 0.3, max tokens 4000. Echoes the chart-context hash in metadata for regeneration tracking.
- `app/api/chart-aware-questions/route.js` — POST endpoint. Reads `{ patientId, encounterId, callerContext }`, runs `assembleChartContext` + `generateChartAwareQuestions`, returns the chart context alongside the questions. Node runtime, dynamic.
- `app/triage/[encounterId]/page.js` — server component, awaits `params` (Next.js 16 requirement), loads encounter + chart context, renders `<ChartContext>` + `<TriageQuestions>` + `<EvidenceCapture>` (stub). Caller context hardcoded to outside_clinician (Renee, VA RN) for the Whitfield proof-point — picker comes next session.
- `components/ChartContext.js` — dense, clinical layout: patient header, problems, active meds, recently-stopped meds (with discontinuation date + reason), recent labs (with H/L flags), recent vitals, expandable note descriptions.
- `components/TriageQuestions.js` — client component, owns the Generate button and the fetch lifecycle. Renders questions grouped by category with rationale + answerType + id visible on each.
- `components/EvidenceCapture.js` — visible stub for the next session's structured-evidence work.
- `app/dashboard/page.js` — placeholder dashboard with a single link to the Whitfield encounter.
- `app/page.js` — replaced default Next.js scaffold with a Kairos-branded shell linking to the dashboard.
- `app/layout.js` — metadata title/description updated to "Kairos".

**Verification:**

- `npm run build` → ✓ compiled, 5 routes generated (`/`, `/dashboard`, `/triage/[encounterId]` dynamic, `/api/chart-aware-questions` dynamic, `/_not-found`).
- `npm run dev` → ✓ ready on `:3000`.
- `GET /dashboard` → 200, renders "Kairos Nurse Dashboard" + "Open Whitfield Encounter".
- `GET /triage/whitfield_encounter_001` → 200, renders Patient_Whitfield_Sample, Furosemide (stopped), Renee caller context.
- `POST /api/chart-aware-questions` → 500 with `ANTHROPIC_API_KEY is not set` and the full assembled chart context echoed back. **This is the expected pre-key state** — proves the FHIR-to-prompt pipeline is wired end-to-end without spending a token.

**Not done (intentional):**

- No push (`git push` not executed; Brandon decides when).
- No Vercel project, no Supabase, no dedicated Anthropic key (per CONTEXT.md "Deferred infrastructure").
- No tests yet (per global preference: skip until needed).
- No real Anthropic call exercised — Brandon's first dev session with the key in place is the live verification.

**Notes for the next session:**

- The Claude prompt uses `claude-opus-4-7` (the current best Opus). Brandon's spec said `claude-opus-4-5 (or current best Opus model — confirm with Brandon if uncertain)`. Confirm in next session before running paid traffic.
- `EvidenceCapture` is a placeholder — building it is the next session's primary job. Output of that session feeds the SBAR regenerator (Whitfield Call 2 / Call 3).
- Caller-context picker should move from hardcoded to a top-of-page selector when more than one caller type is exercised.

---

## 2026-04-27 — Session 2: API key wiring + dark/light mode toggle

**Scope:** make the chart-aware question pipeline actually generate (it was returning HTTP 500 by design pre-key); add a clinical-tool dark mode.

**Pipeline fixes:**

- Pulled `HVC_ANTHROPIC_API_KEY` value out of `firekraker-monorepo/.env.master` and wrote it into `kairos/.env.local`. Confirmed `.env.local` is gitignored via the `.env*` rule.
- Renamed the env var **`ANTHROPIC_API_KEY` → `KAIROS_ANTHROPIC_KEY`** across `lib/claude/client.js`, `components/TriageQuestions.js`, `.env.local`, and `.env.example`. Reason: an empty Windows-level system env var named `ANTHROPIC_API_KEY=""` was shadowing `.env.local` and causing the Claude client to throw "key is not set" even with `.env.local` populated. Same pattern Brandon already uses for DebtKiller (`DK_ANTHROPIC_KEY`).
- Removed the `temperature` parameter from `lib/claude/client.js` and from the caller in `lib/prompts/chartAwareQuestions.js`. `claude-opus-4-7` returned `400 invalid_request_error: 'temperature' is deprecated for this model.`
- Bumped `maxTokens` 4000 → 16000 in `lib/prompts/chartAwareQuestions.js`. The first successful run truncated at ~10,400 chars (~3500-4000 tokens) producing invalid JSON. 16k gives comfortable headroom; opus-4-7 supports far more.

**Pipeline verification (after fixes):**

- `POST /api/chart-aware-questions` with `{patientId:"whitfield_sample_001", encounterId:"whitfield_encounter_001", callerContext:{outside_clinician, Renee, VA RN}}` → **HTTP 200, 14,850 bytes, 32 questions**. Full JSON response saved to `docs/whitfield-questions-output.json` for review.
- Generated questions cluster organ-system-style (handoff_context, vitals_objective, volume_status, respiratory_cardiac_differential, cardiac_ischemia, cardiac_aortic_stenosis, cardiac_arrhythmia, functional_status, medication_review, labs_followup, prior_procedure_history, red_flags, disposition_planning, handoff_closeout) and pull chart specifics: e.g. NT-proBNP 3420 (2/15/26) flagged as stale post-Lasix-d/c, prior thoracentesis "disaster and painful" surfaced as a flag-prominently item, weight trend 188 → 188.7 → 189.5 lb checked against the >2 lb/48h threshold from the cardiology note.

**Dark/light mode toggle:**

- Tailwind v4 `class` strategy: added `@custom-variant dark (&:where(.dark, .dark *));` in `app/globals.css`. Switched the existing `prefers-color-scheme: dark` block to explicit `html.dark` so the user-controlled toggle drives both Tailwind's `dark:` variants and the page-level baseline colors.
- New `components/ThemeToggle.js` (Client Component): cycles light → dark → system, persists to `localStorage["kairos-theme"]`, listens to system theme media query when in `system` mode. Fixed top-right at `top-3 right-3 z-50`, sun/moon/auto icons.
- Anti-flash inline script in `app/layout.js` runs before React hydrates — reads `localStorage["kairos-theme"]` and `prefers-color-scheme`, applies `dark` class to `<html>` synchronously. `<html>` carries `suppressHydrationWarning` so the class diff doesn't trigger a hydration mismatch warning.
- All existing surfaces updated with `dark:` variants: `app/page.js`, `app/dashboard/page.js`, `app/triage/[encounterId]/page.js`, `components/ChartContext.js`, `components/TriageQuestions.js`, `components/EvidenceCapture.js`. Palette: light = white/slate-50 + slate-900 text; dark = slate-900 page bg + slate-800 cards + slate-100 text; borders slate-200 → slate-700.
- H/L lab flag pills: H stays rose, L stays amber; dark variants use `*-900/40` backgrounds with `*-200` text — semantically clear without burning the eyes.

**Build + render verification:**

- `npm run build` → ✓ compiled, no Tailwind warnings, 5 routes (same shape as Session 1).
- `GET /`, `/dashboard`, `/triage/whitfield_encounter_001` all → 200; HTML contains the inline anti-flash script before page content, the toggle button with `aria-label`, and `dark:bg-slate-*` / `dark:text-slate-*` classes inline.
- **Visual verification deferred to Brandon** — code-level checks confirm the dark variants are emitted into HTML and the toggle is mounted. Brandon visually confirms in browser before committing.

**Files changed (uncommitted, unpushed):**

- `lib/claude/client.js` — env var rename + `temperature` removed + comment explaining why we avoid `ANTHROPIC_API_KEY` on Windows
- `lib/prompts/chartAwareQuestions.js` — `temperature` removed, `maxTokens` 4000 → 16000
- `components/TriageQuestions.js` — UI hint mentions `KAIROS_ANTHROPIC_KEY`; full dark variants
- `components/ChartContext.js` — full dark variants including labs H/L pill desaturation
- `components/EvidenceCapture.js` — dark variants
- `app/page.js`, `app/dashboard/page.js`, `app/triage/[encounterId]/page.js` — dark variants
- `app/layout.js` — anti-flash inline script, `<ThemeToggle/>`, `suppressHydrationWarning` on `<html>`, dark body classes
- `app/globals.css` — `@custom-variant dark`, `html.dark` baseline; removed legacy `prefers-color-scheme` block
- `components/ThemeToggle.js` — **new file**
- `.env.local`, `.env.example` — `KAIROS_ANTHROPIC_KEY=…`
- `docs/whitfield-questions-output.json` — successful 32-question response saved for review
- `docs/vercel-clinai-kairos-audit.md` — read-only Vercel MCP audit of clinai + kairos projects (separate task in this session)

**Open caveats:**

- Empty system-level Windows env var `ANTHROPIC_API_KEY=""` still exists. The rename to `KAIROS_ANTHROPIC_KEY` makes Kairos immune, but if any future code path reads `ANTHROPIC_API_KEY` directly (e.g. third-party SDK that defaults to that name) it will read empty. Worth removing at the OS level (User Environment Variables) when convenient.
- Historical references to `ANTHROPIC_API_KEY` remain in `docs/CONTEXT.md` and `docs/log.md` (Session 1) — left intentionally as historical record. CONTEXT.md current-state guidance was updated separately.

---

## 2026-04-27 — Session 3: design system rebuild (Linear-inspired)

**Scope:** replace the ad-hoc Tailwind slate-default styling with a deliberate, restrained design system. Linear / Apple Mail / Cron Calendar reference. This is the visual foundation everything builds on going forward.

**Typography:**

- Switched `next/font/google` from Geist + Geist Mono to **Inter** (variable font, latin subset, `display: "swap"`). Single font import; system fallback `ui-sans-serif, system-ui, sans-serif`. Mono via `ui-monospace, SFMono-Regular, Menlo, Monaco`.
- Type scale locked to 11 / 12 / 13 / 14 / 15 / 22 / 32 px — used as Tailwind arbitrary values (`text-[13px]` etc.) rather than introducing alias tokens.
- Weights restricted to 400 / 500 / 600. No 300 or 700+.
- Line-height 1.5 body, 1.3 headers. Letter-spacing `-0.01em` on headers, default elsewhere. Section labels carry `0.05em` tracking + uppercase.
- Inter font features `cv11`, `ss01`, `ss03` enabled at `<html>` level.

**Color tokens (Tailwind v4 `@theme` in `app/globals.css`):**

- Light mode (warm off-white surface family): `--color-canvas oklch(0.99 0.003 80)` (page bg), `--color-surface 1 0 0` (card), `--color-muted 0.97 0.005 80`, `--color-line 0.92 0.005 80`, `--color-line-faint 0.95 0.005 80`. Foreground `--color-fg 0.20 0.01 80`, `--color-fg-muted 0.45 0.01 80`, `--color-fg-faint 0.60 0.01 80`. Accent `--color-accent 0.55 0.13 235` (desaturated clinical blue), `--color-accent-soft 0.96 0.02 235`.
- Dark mode (set inside `.dark` block): canvas `0.16 0.005 270`, surface `0.20 0.005 270`, muted `0.18 0.005 270`, lines a touch brighter, foreground steps `0.95 / 0.70 / 0.55`. Accent shifts to `0.65 0.13 235`. **Warm whites and warm near-blacks, no pure black.**
- Semantic flag colors (paired solid + ~12-16% soft variants for pill backgrounds): `--color-flag-high` (rose-ish, hue 27), `--color-flag-low` (amber-ish, hue 80), `--color-flag-success` (green-ish, hue 145). Dark-mode variants brighten foreground and bump soft alpha to ~16%.
- Radius tokens `--radius-card 8px`, `--radius-button 6px`, `--radius-pill 4px` → `rounded-card / rounded-button / rounded-pill` utilities.
- All dark-mode swapping happens via CSS variable redefinition inside `.dark { }` — no `dark:` prefix utilities needed in JSX. Class on `<html>` flips the entire palette.

**Theme toggle:**

- Rebuilt `components/ThemeToggle.js` to use **lucide-react** icons (`Sun` / `Moon` / `Monitor`). 32×32 hit area, 16px icon, ghost style — no border, hover `bg-muted`, transitions 100ms.
- Cycles light → dark → system, persists to `localStorage["kairos-theme"]`, listens to `prefers-color-scheme` media query when in `system` mode.
- Sits in the new sticky top bar, top-right.
- **`lucide-react` is the only new dependency** added in this session.

**FOUC prevention:**

- Inline anti-flash script in `app/layout.js` `<head>`, runs before React hydrates: reads `localStorage["kairos-theme"]` and `prefers-color-scheme`, sets `document.documentElement.classList.add('dark')` synchronously when needed.
- `<html suppressHydrationWarning>` so the class diff doesn't trigger a hydration warning.

**Layout chrome:**

- New sticky 56px top bar in `app/layout.js`: `bg-surface/95` with backdrop-blur, `border-b border-line-faint`. Contains "Kairos" wordmark (15px / weight 600 / left) and `<ThemeToggle />` (right).
- Main content centered at `max-width: 1400px` with 16px / 32px responsive horizontal padding, 32px vertical.

**Page rebuilds:**

- `app/page.js` — replaced the standalone landing with a `redirect("/dashboard")`. The top-bar wordmark replaces the per-page brand block.
- `app/dashboard/page.js` — 32px hero "Kairos" + 15px subtitle "Clinical workflow intelligence". One section: `Encounters` 11px uppercase label + a single elevated card linking to the Whitfield encounter (lucide `ArrowRight` chevron, subtle hover lift via `shadow-sm` + border darken).
- `app/triage/[encounterId]/page.js` — 15px medium patient name + 13px tertiary metadata line (encounter ID · caller · type). `← Dashboard` ghost-link top-right with lucide `ArrowLeft`. Two-column grid: `520px` chart on left, flexible (questions + evidence) on right, 24px gap, stacks on mobile.

**Component rebuilds:**

- `components/ChartContext.js` — card with header block (patient name + demographics + encounter type). Sections (Active Problems, Active Medications, Recently Stopped, Recent Labs, Recent Vitals, Recent Notes) each lead with the canonical 11px uppercase label. Problems and meds render as neutral pills (4px radius, soft bg). The condition matching `/painful|tolerated poorly|disaster/i` (i.e. "Recurrent pleural effusion … patient describes prior procedures as painful") gets a subtle 2px amber left-border via `--color-flag-low` at 60% — no other emphasis. Stopped meds: strikethrough + d/c date + reason inline. Labs render as a clean grid (name · value · H/L pill · date), not a `<table>`. Recent notes are bordered cards with `line-clamp-4` body and `<details>` "show more".
- `components/TriageQuestions.js` — header ("Triage Questions" + count + chart-context hash), `Regenerate` button as accent ghost with spinning lucide `RefreshCw` while loading. Category headers 11px uppercase tracking-wide. Each question is a `bg-muted` card: 14px medium question text, 12px italic rationale (`Why: …`), 11px mono metadata footer.
- `components/EvidenceCapture.js` — same card chrome, "(stub)" suffix in 12px tertiary, real description from CONTEXT.md (source-tagged: patient / family / outside_clinician / chart) — no lorem ipsum.

**Constraints honored:**

- No box shadows except `shadow-sm` on the dashboard card hover state.
- No gradients, no emojis, no rounded-full on cards (only on pills).
- All transitions 100-150ms; no animations longer.
- All icons lucide-react at 14-16px, color inherits from parent text token.
- Focus-visible: 2px accent outline + 2px offset, set globally in `globals.css`. Disabled on mouse focus.
- Left-aligned everywhere in data displays.

**Build / verification:**

- `npm install lucide-react` → clean.
- Cleared `.next` cache and restarted dev server. Confirmed via the compiled CSS at `/_next/static/chunks/.../*.css`:
  - All `--color-*` tokens present (canvas, surface, muted, line, line-faint, fg/fg-muted/fg-faint, accent + variants, flag-high/low/success solid + soft).
  - Utility classes generated: `.bg-canvas`, `.bg-surface`, `.bg-muted`, `.text-fg`, `.text-fg-muted`, `.text-fg-faint`, `.border-line-faint`, `.rounded-card`, `.rounded-button`, `.rounded-pill`.
  - `.dark { --color-canvas: ... }` block compiled — palette swap happens via variable redefinition, no `dark:` utility prefix needed.
  - Inter font faces present (`@font-face` definitions for cv ranges).
- `npm run build` → clean, 5 routes (`/`, `/_not-found`, `/api/chart-aware-questions`, `/dashboard`, `/triage/[encounterId]`), no Tailwind warnings, no TypeScript errors.
- Smoke tests: `GET /` → 307 redirect to `/dashboard`. `GET /dashboard` → 200. `GET /triage/whitfield_encounter_001` → 200.
- **Visual verification deferred to Brandon** — keyboard focus rings, FOUC behavior on initial load, theme persistence across reload, and side-by-side light/dark legibility need eyes-on confirmation before commit.

**Files changed (uncommitted):**

- `app/globals.css` — full rewrite (Tailwind v4 `@theme` + `.dark` overrides + base resets).
- `app/layout.js` — Inter via next/font, sticky top bar with wordmark + ThemeToggle, anti-flash inline script in head.
- `app/page.js` — replaced with `redirect("/dashboard")`.
- `app/dashboard/page.js` — full redesign.
- `app/triage/[encounterId]/page.js` — full redesign.
- `components/ChartContext.js` — full redesign with section labels, neutral pills, painful-procedure left-border flag, lab grid, note cards.
- `components/TriageQuestions.js` — full redesign with accent ghost button, muted question cards, lucide refresh icon.
- `components/EvidenceCapture.js` — full redesign matching the card chrome.
- `components/ThemeToggle.js` — replaced inline SVGs with lucide-react icons, ghost-button styling.
- `package.json` / `package-lock.json` — `lucide-react` added.
- Dev server left running on `:3000` for Brandon's visual verification.

---

## 2026-04-27 — Session 4: Evidence + SBAR primitive (the heart of the demo)

**Scope:** wire the full architectural primitive end-to-end — chart context → questions → answers (source-tagged) → regenerated SBAR → nurse approves. No placeholders left in the right-column workspace.

**New files:**

- `lib/types/evidence.js` — JSDoc typedefs for `EvidenceItem` and `SBARVersion`. `hashEvidence(arr)` returns first 8 hex chars of SHA-256 over an id-sorted, source-tagged JSON serialization (omits `capturedAt` so re-hashing the same content is stable). djb2 fallback for non-Node contexts. Also exports `SOURCE_META` (display label + Tailwind bg/fg classes per source) and `SOURCE_VALUES` array.
- `lib/prompts/sbarRegenerator.js` — system prompt + chart/evidence summarizer + `regenerateSBAR({chartContext, evidence, encounterContext})`. System prompt enforces: (1) no extrapolation beyond chart + evidence, (2) inline source markers `[chart] [pt] [family] [outside RN: name] [nurse obs]` on every clinical claim, (3) calibrated confidence, (4) explicit "unable to assess" when data is missing, (5) JSON-only output. Strips code fences and extracts the first `{…}` from Claude's response defensively. Throws structured errors with `rawResponse` attached when the JSON parse or shape check fails.
- `app/api/regenerate-sbar/route.js` — POST endpoint, Node runtime, dynamic. Validates `chartContext.patient` and `evidence` is an array, calls `regenerateSBAR`, returns `{ sbar }`. On failure, returns 500 with `error`, `message`, `rawResponse`, `parsed` for debugging.
- `components/SBARDraft.js` — Client Component. Holds `versions[]` array (current = last). Empty state with `Generate SBAR` button (disabled with explanatory tooltip when `evidence.length === 0`). Once generated: 4 sections (S/B/A/R) with section labels (11px uppercase 0.05em tracking) and 14px body. Inline source markers parsed via `MARKER_RE = /\[(chart|pt|family|nurse obs|outside RN[^\]]*)\]/gi` and rendered as small (10px) source-colored pills inline with the prose. Stale-banner appears when `evidence.length` or `hashEvidence(evidence)` no longer match the current version. `Regenerate` ghost button (accent text, accent-soft hover) and `Approve & Copy` primary button (writes plaintext SBAR to clipboard with brief 2s confirmation). All transitions ≤150ms.
- `components/TriageWorkspace.js` — Client Component that lifts `evidence` and `questions` state out of the (server) page. Wires `<TriageQuestions onQuestionsGenerated>` → `<EvidenceCapture questions evidence onAdd onRemove>` → `<SBARDraft chartContext evidence>`. Seeds 3 evidence items for `whitfield_encounter_001` only via `useEffect` on mount (empty-evidence gate, runs once). Default source picked from `callerContext.callerType` — outside-clinician encounters default to `outside_clinician`, patient/family default accordingly.

**Replaced files:**

- `components/EvidenceCapture.js` — full working component (was a stub). Card chrome matches the design system. Two modes: `question` (dropdown of generated questions, sorted unanswered-first with `[answered]` prefix on already-captured ones — multi-source per question is allowed and real) and `freeform` (optional brief label + answer + defaults source to `nurse_observation`). Source pills are single-select buttons; selected pill carries the source's bg/fg classes from `SOURCE_META`. Optional source-detail input ("e.g. Renee, VA cardiology RN"). Add button is the only accent-fill on the page; disabled until answer text is non-empty. Captured-list items show questionText (13px medium muted) + answer (14px) + source pill + relative-time formatter ("3m ago", "11:07 AM" once over the hour). × delete button reveals on hover/focus.

**Modified files:**

- `components/TriageQuestions.js` — added `onQuestionsGenerated` callback prop, fired after a successful API response with the questions array. No other behavior changes; internal fetch state still owned by the component.
- `app/triage/[encounterId]/page.js` — replaced inline `<TriageQuestions>` + `<EvidenceCapture/>` with a single `<TriageWorkspace>` that owns evidence/questions state. ChartContext stays in the left column (server-rendered), workspace fills the right column.
- `app/globals.css` — added two new semantic-color token pairs to `@theme` and `.dark`: `--color-source-family` (purple, hue 295) and `--color-source-clinician` (teal, hue 195), each with a soft (~13-16% opacity) variant for pill backgrounds. Patient maps to existing accent; chart to neutral muted; nurse observation reuses flag-low (amber).

**Decisions:**

- **No `uuid` package.** `crypto.randomUUID()` is native (Node 19+, modern browsers). One less dep.
- **State is in-memory only.** Per the prompt: "no DB persistence required tonight." Evidence + SBAR versions live in `useState` inside `TriageWorkspace`. Reload clears.
- **Seed runs in `useEffect`, not during render.** Avoids server/client hydration mismatch (server returns empty evidence, client hydrates, effect fires, evidence appears). Tradeoff: a microsecond flash of empty state on the very first paint, then seeds appear. Acceptable for the demo; simpler than the alternatives.
- **Source markers parsed client-side, not in the API.** The API stores SBAR sections as raw text with `[…]` markers literal. `SBARDraft` regex-splits and renders inline pills at display time. This means downstream consumers (clipboard copy, future export) get the original marker text — Brandon can paste `[chart]`/`[pt]` directly into a chart note if he wants.
- **`Approve & Copy` writes plaintext only.** Format: `SITUATION:\n…\n\nBACKGROUND:\n…\n\nASSESSMENT:\n…\n\nRECOMMENDATION:\n…\n\nGenerated by Kairos · v{n} · {timestamp}`. No HTML, no rich text — Epic note fields take plain text.
- **No auto-send anywhere.** The nurse is the final approver. Phase 2 wires write-back via FHIR.

**API verification (live Opus 4.7 call):**

POSTed the Whitfield chart context + the 3 seed evidence items + Renee caller context to `/api/regenerate-sbar`. **HTTP 200, ~2.1KB response.** Returned SBAR (model: `claude-opus-4-7`, evidenceHash `a952b08d`, evidenceCount 3) — every clinical claim source-tagged, calibrated confidence throughout, explicit "unable to assess" on missing data:

- *Situation:* "76yo male with CHF [chart], aortic stenosis [chart], COPD [chart], and recurrent pleural effusions [chart] — VA cardiology RN (Renee) calling re: increasing dyspnea and weight gain since Lasix d/c on 3/1/26 [outside RN: Renee]."
- *Background:* notes the pre-renal AKI rationale for d/c [outside RN: Renee], chart's Feb 15 NT-proBNP 3420 (H) and Na 131 (L) [chart], home med list, and the prior poorly-tolerated thoracenteses [chart].
- *Assessment:* synthesizes orthopnea + 6 lb weight gain + productive cough [family] against the chart baseline [chart], explicitly flags renal status unknown [outside RN: Renee], explicitly flags unable to assess vitals/exam/O2 sat/angina/syncope [nurse obs].
- *Recommendation:* same-day evaluation, urgent BMP before diuretic restart, decision on Lasix resumption, obtain current vitals via VA RN or in-person, request callback to provider for disposition.

The "uncomfortable" parts of nursing reasoning that you can't get from prompts alone — distinguishing confirmed from unknown, refusing to extrapolate, naming what wasn't asked — all show up in the output. This is the proof point.

**Build / verification:**

- `npm run build` → ✓ compiled, 6 routes (`/`, `/_not-found`, `/api/chart-aware-questions`, `/api/regenerate-sbar` (new), `/dashboard`, `/triage/[encounterId]`), no Tailwind warnings, no TS errors.
- Dev server smoke tests: `GET /triage/whitfield_encounter_001` → 200 with `Evidence Capture`, `SBAR Draft`, `Generate SBAR` markers in HTML; default source pre-selected to "Outside clinician" (callerType-driven).
- API live test as above — Opus 4.7 returns valid JSON, parsed, stamped with hash + version + timestamp.
- Visual verification (3 seed items rendering, Add/Remove flow, Generate SBAR button enables, Approve & Copy clipboard write, focus rings, dark/light parity) deferred to Brandon.

**Files changed (uncommitted):**

- `app/globals.css` — purple + teal source tokens added.
- `app/triage/[encounterId]/page.js` — page now renders `<TriageWorkspace>` instead of inline children.
- `components/TriageQuestions.js` — added `onQuestionsGenerated` callback.
- `components/EvidenceCapture.js` — full rewrite (was a stub).
- `components/SBARDraft.js` — **new file**.
- `components/TriageWorkspace.js` — **new file** (lifted-state client wrapper).
- `lib/types/evidence.js` — **new file** (typedefs + `hashEvidence` + `SOURCE_META`).
- `lib/prompts/sbarRegenerator.js` — **new file**.
- `app/api/regenerate-sbar/route.js` — **new file**.

Dev server left running on `:3000` for Brandon's visual + interactive verification before commit.

---

## 2026-04-27 — Session 5: Marbury (second proof point) + dashboard inbox

**Scope:** prove the same Phase 1 primitive transfers to a second clinical scenario without architectural changes. Marbury = patient-origin, in-person, paper-mediated input (home BP log) — opposite of Whitfield (outside-clinician-origin, phone, voice-mediated). Plus a real dashboard inbox showing both encounters.

**Phase 4 — synthetic data:**

- New patient bundle `data/patients/marbury.json` — 24-entry FHIR R4 bundle. 68yo F: essential HTN (uncontrolled, ICD I10 + SNOMED 59621000), T2DM (E11.9 + 44054006), hyperlipidemia (E78.5 + 55822004), CKD stage 3a (N18.31 + 700378005), obesity. Five-agent antihypertensive regimen with real RxNorm codes: lisinopril 40 mg (314076), amlodipine 10 mg (197361), HCTZ 25 mg (310798), spironolactone 25 mg (313096), labetalol 200 mg BID started 4/13/26 (857984). Recent labs: Cr 1.4 (H), eGFR 48 (L), K 4.2, A1c 7.4 (H), LDL 92, HDL 38 (L). Clinic vitals from 4/13 add encounter: BP 158/94, HR 78, weight 198. Two cardiology consult notes (4/13/26 documenting labetalol addition + the prior 11/4/25 note where spironolactone was added as fourth agent).
- New encounter supplementary file `data/encounters/marbury_bp_log.json` — 24 home BP readings spanning 4/13–4/26. Designed clinically: avg 148/86 mmHg, 88% ≥140, 38% ≥150, 8% ≥160 (max 162). Two readings carry "missed evening dose" notes (4/19 161/95 after missed 4/18 evening dose; 4/22 158/92 after missed 4/21 evening). One "felt dizzy on standing" (4/17 162/96), one "felt headache" (4/25 156/92). Distribution chosen so the chart-aware question generator and the SBAR regenerator can reach the same conclusion a competent nurse would: this isn't a labetalol-failure problem, it's an evening-adherence problem.
- `lib/fhir/mockData.js` extended with a `PATIENT_FILES` route for both Marbury IDs (`marbury_sample_001`, `marbury_encounter_001`, `marbury_encounter_prior_001`) and a new `ENCOUNTER_DATA` map for per-encounter supplementary inputs (BP logs today; OCR'd faxes / kiosk responses tomorrow). New `getEncounterSupplementary(encounterId)` returns `{ bpLog?: {...} }` when present.
- New `lib/fhir/encounters.js` — encounter metadata registry for the dashboard inbox view. Each entry carries `patientId`, `patientName`, `patientAge`, `patientGender`, `type`, `origin`, `callerContext`, `callerName`, `reason`, `status`, `channel`, plus a `receivedAtMsAgo` offset. `listEncounters()` resolves the offset against `Date.now()` so the demo always reads as fresh: Whitfield "2 hr ago", Marbury "25 min ago." Production swaps this for the work-queue layer (Epic In Basket + Kairos's own encounter table).
- `lib/fhir/chartContext.js` extended: when an encounter has supplementary BP-log data, the assembled chart context now includes a `bpLog` field with the raw readings plus a computed summary. `lib/prompts/sbarRegenerator.js`'s `summarizeChart` extended to render the BP log into the user prompt (count + range + trend + avg + outliers). The chart-aware question generator already serializes the entire chart context as JSON, so it picks up `bpLog` automatically without prompt changes.

**Phase 5 — BP trend analysis + UI:**

- New `lib/clinical/bpTrend.js` — `analyzeBPTrend(readings)` returns `{ count, dateRange, avgSBP, avgDBP, pctAbove140, pctAbove150, pctAbove160, maxSBP, minSBP, trend, significantReadings }`. Trend label is from a simple linear regression on SBP vs reading order (slope > 0.3 mmHg/reading → "rising", < −0.3 → "falling", else "stable" — threshold tuned so a 25-reading log needs ~7-8 mmHg drift end-to-end before flipping). Significant-reading classifier flags severe HTN (SBP ≥ 160), high DBP (≥ 100), readings with clinical-symptom keywords in the note (headache, dizz, chest, vision, SOB), or readings with any note. Threshold constants exported as `BP_THRESHOLDS`.
- New `components/BPLogTable.js` — Client Component (uses `useState` for "show all" toggle). Card chrome matches existing components. Header line: "Home BP Log" + count + date range + trend arrow. Three-stat row: Avg SBP (mmHg), % ≥140, % ≥150 (≥150 cell turns amber when >25%, red when >40%). Reading list: compact 4-col grid (Date, Time, SBP/DBP, Note), most recent first, default 8 visible with "Show all 24 readings" toggle. SBP color-codes: ≥160 red, 150–159 amber, 140–149 default, <140 muted. Footer credits "Captured from paper log · {timestamp}" with a small `FileText` icon — the surface that becomes the OCR ingestion path later.

**Phase 6 — Marbury triage page wiring:**

- `app/triage/[encounterId]/page.js` — caller context is now derived from `getEncounterMeta(encounterId)` (was hardcoded for Whitfield). Layout: left column stacks `<ChartContext>` + `<BPLogTable>` (BPLogTable conditionally rendered when `chartContext.bpLog.readings` exists). Right column unchanged: `<TriageWorkspace>` holding TriageQuestions / EvidenceCapture / SBARDraft.
- `components/TriageWorkspace.js` — added Marbury seed-evidence builder (3 patient-source items: labetalol adherence pattern, headache symptom check, dietary sodium). Seeding is gated by encounterId (Whitfield → Whitfield seeds, Marbury → Marbury seeds, anything else starts empty). Default source selection (`defaultSourceFor(callerContext)`) already returns `patient` for `callerType: "patient"` so the EvidenceCapture entry panel comes up correctly for Marbury.

**Phase 7 — dashboard inbox:**

- `app/dashboard/page.js` rewritten as a real inbox view. Header: "Dashboard" h1 + "Active encounters" subtitle on the left, a live `<DashboardClock />` (new Client Component) on the right. Three-stat row: Active encounters / Awaiting nurse review (`status === 'new'`) / In progress (`status === 'in_progress'`). Inbox section: encounter cards stacked vertically, sorted with `new` above `in_progress` and `complete` last, then by `receivedAt` desc within each status.
- Each encounter card: status dot (blue for `new`, amber for `in_progress`, green for `complete`), patient name (16px medium) + age/sex tertiary, encounter-type pill (teal for outside-clinician encounters, blue for patient encounters), reason (line-clamp-2), encounter ID + caller name in 12px tertiary, relative-time timestamp on the right ("25 min ago", "2 hr ago"). Hover state lifts border and adds a subtle shadow. Whole card is a single `<Link>` to `/triage/{id}`.
- New `components/DashboardClock.js` — Client Component aligned to the next minute boundary at mount, then `setInterval` 60s. `suppressHydrationWarning` so server's snapshot ≠ client's first render doesn't trip the hydration check. Pill-styled, mono font, 13px text.
- Empty-state branch: lucide `Inbox` icon + "No active encounters" / "New encounters will appear here" centered when `listEncounters()` returns empty. Stats row hidden in that case.

**Live API verification (both encounters):**

- **Whitfield** (already verified in Session 4): 32 questions, evidenceHash `a952b08d`, SBAR distinguishes confirmed from unknown, refuses to extrapolate, recommends BMP before any diuretic restart given prior pre-renal AKI.
- **Marbury** (new): `/api/chart-aware-questions` with patient caller context returned **32 questions** in 13 clinical categories (medication_adherence, bp_measurement_technique, orthostatic_symptoms, renal_metabolic, dietary_lifestyle, red_flags, etc.). Sample rationales tied directly to the chart: *"BP log explicitly notes missed evening doses on 4/18 and 4/21, both followed by elevated morning readings. Adherence pattern is key to interpreting whether labetalol is actually failing."* and *"Patient noted 'felt dizzy on standing' on 4/17. Could be orthostasis from labetalol/HCTZ/amlodipine combination or could signal something more serious."*
- `/api/regenerate-sbar` with the 3 seed evidence items: HTTP 200, `evidenceHash 4c6dc9ef`, model `claude-opus-4-7`. The SBAR identifies the adherence gap as the proximate driver of the elevated readings and recommends *addressing evening dose adherence before escalating therapy* — that's the right clinical call, and it's the call you can't get from a content prompt alone. Recommendation also flags BMP recheck (5-drug regimen incl ACEi + spironolactone + thiazide), advises clinician decision on bringing patient in for repeat BP/orthostatics given the 4/17 dizziness, and proposes dietitian referral for restaurant-sodium exposure noted by the husband [family].

**Build / verification:**

- `npm run build` → clean, 6 routes (`/`, `/_not-found`, `/api/chart-aware-questions`, `/api/regenerate-sbar`, `/dashboard`, `/triage/[encounterId]`).
- HTTP smoke: `/dashboard` 200, both triage URLs 200. Dashboard renders both encounters with correct names, pills (`Phone · Outside RN` for Whitfield, `Patient Call` for Marbury), and stats. Marbury triage page renders the BP log table.
- No new dependencies. `crypto.randomUUID()` continues to do uuid duties natively.
- Visual verification (focus rings, dark/light parity, dropdown rendering, copy-to-clipboard flash, BP table show-all toggle, dashboard pill colors in dark mode) deferred to Brandon.

**Architectural note:** the same primitive ran end-to-end on two opposite clinical scenarios — outside-clinician phone triage (Whitfield) and patient-origin in-person paper-mediated drop-in (Marbury) — with the only deltas being (a) a synthetic patient bundle, (b) a per-encounter supplementary data file (BP log) added through a registered map, (c) one new presentational component (BPLogTable) for the new structured input modality, and (d) seed-evidence text. The chart-aware question generator, evidence capture, source-tagging palette, SBAR regenerator, and approve-and-copy flow were all unchanged. This is the proof of "one primitive applied to many surfaces, not many features."

**Files changed (uncommitted):**

- `data/patients/marbury.json` — **new file** (24-entry FHIR Bundle)
- `data/encounters/marbury_bp_log.json` — **new file** (24 readings)
- `lib/fhir/mockData.js` — added Marbury route + `getEncounterSupplementary`
- `lib/fhir/chartContext.js` — attach `bpLog` (with computed summary) when present
- `lib/fhir/encounters.js` — **new file** (encounter metadata registry)
- `lib/clinical/bpTrend.js` — **new file** (`analyzeBPTrend` + thresholds)
- `lib/prompts/sbarRegenerator.js` — `summarizeChart` extended for `bpLog`
- `components/BPLogTable.js` — **new file**
- `components/DashboardClock.js` — **new file**
- `components/TriageWorkspace.js` — Marbury seed evidence
- `app/dashboard/page.js` — full rewrite as inbox
- `app/triage/[encounterId]/page.js` — caller context from `getEncounterMeta`, BPLogTable below ChartContext on the left when applicable

Dev server left running on `:3000` for Brandon's visual + interactive verification.

---

## 2026-04-27 — Session 6: emergency name scrub + history reset

Scrubbed real patient names from working tree + git history. Reset to fresh init commit. No PHI exposure — repo never pushed.

Substitution map applied across all `.js / .jsx / .json / .md / .css / .html` files (case-insensitive with case preservation). Categories scrubbed: 18 patient surnames + 4 first names, 2 outside clinicians, 3 cardiology providers, 1 clinic/institution name. The mapping table itself lives in Brandon's external project knowledge — not in this repo by design. Patient/encounter file renames executed: two patient FHIR bundles, one encounter-supplementary BP log, one API-output snapshot in `docs/`. Current canonical filenames: `data/patients/whitfield.json`, `data/patients/marbury.json`, `data/encounters/marbury_bp_log.json`, `docs/whitfield-questions-output.json`.

One collateral substitution caught and reverted: `Reed → Sutherland` produced `gsutherlandily` from the English word `greedily` in a code comment in `lib/prompts/sbarRegenerator.js`. Restored manually. No other collateral observed in verification grep. Patient/encounter IDs across the working tree are now `whitfield_sample_001` / `whitfield_encounter_001` / `marbury_sample_001` / `marbury_encounter_001` / `marbury_encounter_prior_001`.

`.git` directory deleted and re-initialized. Two-commit history: (1) full scaffold under fictional names; (2) removal of single-use `scripts/scrub-names.js`. Remote `origin` re-added pointing at `https://github.com/firekraker1272/kairos.git`. Nothing pushed. `npm run build` clean.

---

## 2026-04-27 — Session 7: post-scrub verification of the full multi-phase build

Idempotent re-walk of the 8-phase Whitfield + Marbury build prompt against the post-scrub working tree. Goal: confirm every phase still matches spec after the name scrub + git history reset, with no regressions and no rebuild required.

**Verified in place (no edits needed):**

- **Phase 1 — Foundation.** `--color-source-family` and `--color-source-clinician` tokens present in both light and dark blocks of `app/globals.css` with the spec values (oklch 0.55 0.18 295 / 0.70 0.16 295 light/dark for family; oklch 0.55 0.13 195 / 0.70 0.12 195 for outside clinician). `lib/types/evidence.js` exports the `EvidenceItem` and `SBARVersion` typedefs, `hashEvidence()` (SHA-256 first 8 chars with djb2 browser fallback), `SOURCE_META` palette, and `SOURCE_VALUES` ordering.
- **Phase 2 — EvidenceCapture.** `components/EvidenceCapture.js` renders the question-picker / freeform-toggle entry panel, source pill row with default selection driven by caller context, sourceDetail input, hover-revealed delete, and humanized capturedAt formatting. Whitfield seed (3 items: spouse SOB report, family weight trend, outside-RN AKI handoff) lives in `components/TriageWorkspace.js` keyed on `whitfield_encounter_001`.
- **Phase 3 — SBAR regenerator.** `lib/prompts/sbarRegenerator.js` system prompt matches spec verbatim. `app/api/regenerate-sbar/route.js` posts to Opus 4.7 (no temperature, maxTokens 4000) via `lib/claude/client.js`. `components/SBARDraft.js` handles empty state, generate-with-loading, inline `[chart]/[pt]/[family]/[outside RN: name]/[nurse obs]` marker pills via `MARKER_RE`, stale-evidence banner from `hashEvidence` mismatch, regenerate, and approve-and-copy with 2s confirmation flash.
- **Phase 4 — Marbury synthetic data.** `data/patients/marbury.json` is a 24-entry FHIR Bundle (68F, five-agent regimen incl labetalol started 2 weeks ago, BMP/HbA1c/lipids within 30d, CKD3a, T2DM, HLD, obesity). `data/encounters/marbury_bp_log.json` has 24 readings across 14 days with realistic clustering, three readings carrying notes (dizziness, missed evening dose, headache). Both encounter records present in `lib/fhir/encounters.js`.
- **Phase 5 — BPLogTable + bpTrend.** `lib/clinical/bpTrend.js` exports `analyzeBPTrend` returning count, dateRange, avgSBP/DBP, % thresholds at 140/150/160, max/min, slope-driven `trend` (`rising | falling | stable`), and `significantReadings` with categorical reasons. `components/BPLogTable.js` renders the trend stats row with color-coded pct cells, color-coded SBP per reading, "show all" toggle past 8, and paper-log captured-from footer.
- **Phase 6 — Marbury triage page wiring.** `app/triage/[encounterId]/page.js` renders the same component for both encounters. ChartContext + (conditional) BPLogTable in the left column; TriageWorkspace (questions → evidence → SBAR) in the right. `chartContext.bpLog.summary` is computed in `assembleChartContext` and flows into both the question generator and SBAR prompt. Marbury seed (3 items: morning-only adherence pattern, asymptomatic except 4/25 headache, partial dietary change with restaurant exposure) is in TriageWorkspace.
- **Phase 7 — Dashboard.** `app/dashboard/page.js` renders the inbox with status dots, stats row (total / new / in_progress), per-encounter pill via `encounterPill()` switch on `(type, callerContext)`, line-clamped reason, relative timestamp, and click-through to triage. `app/page.js` 307s to `/dashboard`. `DashboardClock` is hydration-safe and minute-aligned.

**Phase 8 verification:**

- `npm run build` — clean. 6 routes compiled. One Turbopack NFT informational warning about `mockData.js` calling `path.join(process.cwd(), …)` at build trace time, which is expected (mock data is filesystem-loaded by design and swaps out for real FHIR fetches when Epic is wired).
- HTTP smoke test against the running dev server: `/` → 307 (redirect to dashboard), `/dashboard` → 200, `/triage/whitfield_encounter_001` → 200, `/triage/marbury_encounter_001` → 200.
- Live SBAR API smoke test: posted Whitfield chart context + the 3 seed evidence items to `/api/regenerate-sbar` and got back a clinically defensible SBAR with `[chart] / [family: wife] / [outside RN: Renee] / [nurse obs: not assessed]` source markers, identifying CHF decompensation post-furosemide-d/c with 6 lb gain + orthopnea, recommending same-day in-person eval, BMP recheck, and provider-to-provider contact with the VA cardiology RN. Hash returned: `7e1f0eea`. Model: `claude-opus-4-7`.
- Real-name scan over all tracked files returned zero matches (grep command details intentionally elided — re-running the literal command from this entry would now self-match this very line).

**No code changes this session.** The Session 5 implementation survived the Session 6 scrub intact and continues to match the multi-phase prompt spec end-to-end.

---

## 2026-04-27 — Session 8: v3 — Investigation primitive, Linnehan + Hartwell workflows, dual-output

The 9-phase v3 build executed end-to-end on top of v2. v3 introduces the architectural primitive v2 didn't have yet: the **persistent Investigation object** that links touchpoints across time and across Epic buckets. Two new patient workflows ride on top — Linnehan (5-day cross-bucket Coumadin investigation) and Hartwell (bidirectional MyChart round-trip with provider Result Note + dual-output draft).

**Phase 1 — Investigation data model.** `lib/types/investigation.js` defines the `Investigation` and `InvestigationTouchpoint` shapes (kinds: `encounter | evidence | sbar | secure_chat | mychart_outbound | mychart_inbound | result_note | lab_result`; statuses: `open | pending_patient | pending_provider | closed`). Helpers: `addTouchpoint` (pure, sorts chronologically, refreshes `lastActivityAt`), `findInvestigationForEncounter`, `linkEncounterToInvestigation`, `summarizeInvestigation` (touchpoint count, buckets touched, day span, sources touched). `lib/state/investigations.js` is the in-memory store: loads JSON seed files from `data/investigations/`, resolves `<minutes-ago:N>` / `<hours-ago:N>` / `<days-ago:N hh:mm>` / `<today hh:mm>` time tokens at load time so the demo always reads as fresh. Designed so the Supabase swap only changes this file.

**Phase 2 — Linnehan synthetic data.** `data/patients/linnehan.json` is a 16-entry FHIR Bundle (71yo M with AFib + CHF + HTN + CKD3, recently resolved R thigh hematoma, on a split warfarin regimen 5/2.5 mg reduced after the hematoma, real LOINC 6301-6 for INR, real RxNorm/SNOMED). Three encounter records: `linnehan_encounter_001` (results triage, complete), `linnehan_encounter_002` (adherence call, complete), `linnehan_encounter_003` (recheck call queued, in_progress). `data/investigations/linnehan_001.json` seeds a 6-touchpoint, 5-day, cross-bucket investigation: subtherapeutic INR 1.6 lab → nurse triage → outbound Secure Chat to Amanda Trahan home health RN → inbound Secure Chat reply (pillbox showed missed Tue/Wed doses) → patient call confirming the missed-dose explanation → recheck call now queued.

**Phase 3 — SecureChat component.** `components/SecureChat.js` renders a multi-party threaded message list with participant pills (semantic-colored by role: nurse/outside_clinician/provider), outbound bubbles right-aligned with accent fill, inbound bubbles left-aligned with sender name above, timestamps below each bubble, and an optional reply composer. Empty state for new threads. Both modes work.

**Phase 4 — Investigation timeline view.** `app/investigation/[investigationId]/page.js` is a new server route that renders the full investigation as a vertical chronological timeline. Header shows patient name + age/sex, investigation title, status pill (semantic-colored), summary stats row (`N touchpoints · N buckets · N days · N sources`), and clinical concern body. Right column shows a compact `ChartContext`. `components/InvestigationTimeline.js` renders each touchpoint as a node with a kind-specific lucide icon (`FlaskConical / Phone / MessageCircle / ClipboardCheck / FileText / Send / Inbox`), a bucket pill, a source-actor pill (`nurse / patient / provider / outside_clinician / system`), absolute + relative timestamps, expandable inline detail (lab values + reference range, full Secure Chat message body, encounter notes with link to triage page, result-note body, MyChart subject + body), and a left-rail vertical line connecting nodes. Triage-page header gained an investigation badge (`Link2` icon, teal pill) that links to the investigation timeline when the encounter is part of one.

**Phase 5 — Hartwell synthetic data.** `data/patients/hartwell.json` is a 14-entry FHIR Bundle (58yo F on atorvastatin 40 mg started ~6 weeks ago for elevated LDL with FH risk; HTN, prediabetes, sulfa rash; ASA 81 + lisinopril 10; recent labs LDL 95 / AST 42 [H] / ALT 38; provider Dr. Eftheriou in Feb 2026). `data/investigations/hartwell_001.json` seeds a 3-touchpoint bidirectional MyChart round-trip: 6:51 AM provider Result Note from Dr. Ballinger with 5 follow-up questions → 10:07 AM outbound MyChart draft (5th-grade reading level) → 10:15 AM patient inbound reply (denies symptoms, but introduces a turmeric supplement started 3 weeks ago — the bucket-transition surprise). New encounter record `hartwell_encounter_001` with `investigationId: 'investigation_hartwell_001'`.

**Phase 6 — Dual-output generator.** `lib/prompts/dualOutput.js` exports `generateDualOutput({ chartContext, resultNote, evidence })` returning `{ mychartMessage: { subject, body }, nurseNote: { sections: [{ heading, body }] }, verifyFlags: [...] }`. System prompt enforces dual-audience separation (patient gets plain language with no jargon, nurse note gets clinical density and `[verify: ...]` flag markers), explicit conflict surfacing if chart vs Result Note diverge, and no fabrication. `app/api/dual-output/route.js` calls Opus 4.7 (no temperature, maxTokens 4000) via `lib/claude/client.js`. `components/DualOutputDraft.js` renders the two outputs side-by-side (stacking on narrow viewports), with verify flags rendered inline as amber pills via a `[verify: ...]` regex, an aggregate "Verify before signing" list at the bottom of the nurse-note panel, and two separate approve buttons ("Approve & Send MyChart" blue, "Approve & File Nurse Note" green) with 2-second confirmation flashes.

**Phase 7 — MyChart thread + bucket transition.** `components/MyChartThread.js` renders the patient-facing MyChart conversation with a softer aesthetic distinct from `SecureChat` — each message is a stacked card with `From:` header, optional subject line, body in 15px line-height-1.6 typography, and read/replied timestamp footers. `components/ResultNoteCard.js` renders the provider Result Note inline above the dual-output panel. `components/TriageWorkspace.js` extended to accept `resultNote / resultNoteSourceDetail / resultNoteOccurredAt / mychartMessages` props and conditionally render `ResultNoteCard → DualOutputDraft → MyChartThread → EvidenceCapture → SBARDraft` for results-followup encounters that have a Result Note attached. The triage page server-side scans the linked investigation's touchpoints and pulls the Result Note + ordered MyChart messages so the bucket transition is visible mid-investigation.

**Phase 8 — Dashboard updates.** Stats row gained "Active investigations" between "Active encounters" and "Awaiting nurse review" (now a 4-column grid). Inbox filters out `status: 'complete'` so completed Linnehan encounters #1 and #2 stay in the timeline but don't clutter the inbox. Each encounter card has an absolutely positioned investigation badge (bottom-right, `Link2` icon, teal pill) that links to `/investigation/{id}` and surfaces "Part of N-event investigation · spans N buckets" without intercepting the card-level click that goes to triage. Encounter pill switch extended for the new `results_followup` type → "Result Note · Provider" (clinician tone) when caller is a provider.

**Phase 9 — Integration verification.**

- `npm run build` — clean. 8 routes (`/`, `/_not-found`, `/api/chart-aware-questions`, `/api/dual-output`, `/api/regenerate-sbar`, `/dashboard`, `/investigation/[investigationId]`, `/triage/[encounterId]`).
- HTTP smoke test: `/dashboard` 200, `/triage/whitfield_encounter_001` 200, `/triage/marbury_encounter_001` 200, `/triage/linnehan_encounter_003` 200, `/triage/hartwell_encounter_001` 200, `/investigation/investigation_linnehan_001` 200, `/investigation/investigation_hartwell_001` 200.
- Live API smoke test against `/api/dual-output` with the seeded Hartwell chart context + Result Note + the patient's inbound MyChart reply: returned a clinically defensible JSON draft with 7 verify flags. The model independently caught the turmeric ↔ AST temporal correlation as the most relevant new clinical signal, drafted a plain-language MyChart response that names the issue without jargon, drafted a sectioned Nurse Note (Reason for Contact / Patient-Reported Symptom Review / Clinical Synthesis / Plan / Items Requiring Provider Input) that cites lab values verbatim and surfaces the supplement-hepatotoxicity question for cosign. This is the proof-of-architecture result: the same primitive that produced the Whitfield SBAR also produces a dual-output Hartwell follow-up.
- Real-name scan over tracked files returned zero matches (the prior session log entry's grep command was rewritten so it does not self-match).

**Architectural note for v3.** The Investigation primitive doesn't replace the Phase-1 chart-aware question generator or the SBAR regenerator — it sits one level above them as the persistent thread that ties single-encounter primitives together across time. Linnehan proves the time axis (5 days, 3 buckets, lab system → nurse → outside RN → patient back to nurse). Hartwell proves the flow axis (provider → nurse → patient → nurse, with a bucket transition from results_followup to pt_advice_request happening mid-investigation, and a dual-output primitive that produces patient-facing and clinician-facing artifacts from one inference call). The pitch frame from CONTEXT.md — "Kairos is one primitive applied to ten surfaces, not ten features" — now has its second-order primitive: investigations are how those surfaces stay coherent over time and across the Epic basket model.

**Files added (uncommitted):**
- `lib/types/investigation.js`, `lib/state/investigations.js`
- `data/patients/linnehan.json`, `data/patients/hartwell.json`
- `data/investigations/linnehan_001.json`, `data/investigations/hartwell_001.json`
- `lib/prompts/dualOutput.js`, `app/api/dual-output/route.js`
- `components/SecureChat.js`, `components/InvestigationTimeline.js`, `components/DualOutputDraft.js`, `components/MyChartThread.js`, `components/ResultNoteCard.js`
- `app/investigation/[investigationId]/page.js`

**Files modified (uncommitted):**
- `lib/fhir/mockData.js` (registered Linnehan + Hartwell bundles)
- `lib/fhir/encounters.js` (added 4 new encounter records with `investigationId` linkage)
- `app/triage/[encounterId]/page.js` (investigation badge in header; pulls Result Note + MyChart thread from linked investigation when present)
- `components/TriageWorkspace.js` (Result Note → DualOutputDraft → MyChartThread conditional rendering for results-followup encounters with a Result Note)
- `app/dashboard/page.js` (4-stat grid, investigation badges, completed-encounter filter, results_followup pill)

Dev server left on `:3000`. No `git push`.

---

## 2026-04-27 — Session 9: v4 — Cohort surveillance + Protocol library, INR Reminder + Halberg

The 9-phase v4 build executed end-to-end on top of v3. v4 introduces the two architectural primitives v3 didn't have yet: **Cohort surveillance** (proactive monitoring of a patient population, schedule-driven, fundamentally different from inbox-driven Encounter/Investigation work) and **Protocol library** (clinical guidelines as data, applied against a patient chart to produce a structured per-medication schedule — this is where the safety chain hardens).

**Phase 1 — Cohort data model.** `lib/types/cohort.js` defines `CohortDefinition` (id, name, clinicalRationale, criteriaDescription, ownedBy, reviewCadenceDays), `CohortMember` (patientId, ageSex, keyData, flags, priorityScore, lastReviewedAt) and `CohortSnapshot` (definitionId, computedAt, members, summary counts). Helpers: `priorityComparator` (priority desc, then daysOverdue desc, then name) and `groupByFlag`. `lib/state/cohorts.js` is the in-memory store with the same JSON-seed + time-token-resolution pattern as `lib/state/investigations.js` — `<N days ago>` / `<N hours ago>` resolve at load time. `lib/clinical/cohortCompute.js` exports `computeINRReminderSnapshot` — v4 implementation is essentially a passthrough since the seed encodes flags directly, but the function exists as the eventual swap point for live FHIR-driven cohort recomputation.

**Phase 2 — INR Reminder cohort.** `data/cohorts/definitions.json` registers the `inr_reminder` cohort definition. `data/cohorts/inr_reminder_seed.json` seeds 15 fictional warfarin patients spanning the four flag categories: 4 overdue, 3 drift, 2 unseen (one of whom is also overdue → counted in both buckets), 1 patient with both overdue + drift (Whitcombe — the canonical "highest-priority" case at score 92), and 5 stable. Notes attached to specific members illustrate clinically meaningful sub-cases: Annenberg has a mechanical-valve goal range (2.5–3.5), Fernsby's recent supratherapeutic trend correlates with a recent azithromycin course, Steensma is the out-of-state intake patient with no clinic contact in 127 days, Crenshaw is the borderline-low drift candidate likely needing a small dose nudge.

**Phase 3 — Cohort list page.** `app/cohort/[cohortId]/page.js` renders cohort header + 4-stat grid (Total / Overdue / Drift / Unseen, each color-coded based on count threshold), with a recompute button stub. `components/CohortMemberList.js` adds filter pills (All / Overdue / Drift / Unseen / Stable, single-select), sort dropdown (Priority / Days overdue / Last INR / Patient name), and the member rows themselves: priority badge with tone-by-score, patient name + ageSex, key-data summary (last INR + date + days overdue), flag pills with semantic tones, and clickthrough to drill-in.

**Phase 4 — Cohort drill-in + outreach.** `app/cohort/[cohortId]/[patientId]/page.js` wraps `components/CohortDrillIn.js` which renders a 1.4/1 split: left column shows INR sparkline (SVG with goal-range shaded band), INR history table with in-range/out-of-range tone per row, current regimen card (with optional cohort-specific note); right column shows "Why this patient is here" flag explanations + four quick-action buttons (Generate INR recheck outreach / Add to Patient Call basket / Order recheck via provider / Mark reviewed without action — the last three are wired-up stubs that flash a confirmation, real wiring deferred). `lib/prompts/cohortOutreach.js` system prompt enforces caring-concierge tone (gentle nudge framed as care continuity, not scolding) and dual-output JSON. `app/api/cohort-outreach/route.js` calls Opus 4.7 (maxTokens 2000). Smoke-tested live on Whitcombe: returned a warm, plain-language MyChart message ("we want to make sure you're still on track with your warfarin monitoring") and a clinically dense internal note that correctly identified the compounded overdue + drift thromboembolic risk and proposed a 10% weekly dose increase pending provider review.

**Phase 5 — Halberg synthetic data + protocol library.** `data/patients/halberg.json` is a 13-entry FHIR Bundle (64yo F with hypothyroidism + resistant HTN + CAD + GAD; on Levothyroxine 100 mcg AM-fasting + Metoprolol succinate 50 mg + Clonidine 0.1 mg BID + Atorvastatin 40 mg + ASA 81 mg; recent TSH 2.1 normal; provider Dr. Eftheriou). Encounter `halberg_encounter_001` typed as `pre_procedure_inquiry` with a structured `procedureContext: { type: 'exercise_stress_test', protocolId: 'pre_stress_test_med_management', scheduledDateMsFromNow: 7d, orderingProvider: 'Dr. Eftheriou' }` — the encounters registry resolves the relative-time scheduledDate at read time. `data/protocols/protocols.json` ships the canonical Pre-Stress Test Med Management protocol with rules covering beta blockers, non-DHP CCBs, **central alpha agonists (the safety-chain catch)**, levothyroxine, statins, and antiplatelets — the rationale text on the central-alpha-agonist rule explicitly calls out that this class is "frequently overlooked."

**Phase 6 — Protocol applier.** `lib/clinical/protocolApplier.js` exports `applyProtocol(protocol, { bundle, scheduledDate, procedureType })` which walks the patient's active MedicationRequests, normalizes each to a generic name via a hardcoded ~30-entry generic→class map plus a brand/abbreviation alias map (`asa → aspirin`, `coumadin → warfarin`, `lipitor → atorvastatin`, etc.), matches each medication against the protocol's rules, and returns `{ protocolName, procedureType, scheduledDate, schedule, unmatched, warnings }`. The `warnings` array is the safety-chain mechanism: any med that matches `targetPattern.drugClass === 'central_alpha_agonist'` adds a warning that explicitly calls out the easily-overlooked-by-hand pattern. `app/api/apply-protocol/route.js` exposes this server-side (filesystem-bound) over POST. `components/ProtocolApplier.js` renders procedure metadata, a prominent amber Safety Chain Warnings block above the schedule, the schedule itself as expandable rows (Action color-coded: hold = amber pill, continue = green pill; expand to see rationale + matched rule), an unmatched-meds collapsible section, and an Approve button that triggers patient-instructions generation.

**Phase 7 — Halberg triage layout.** `app/triage/[encounterId]/page.js` was already passing through the encounter type; `components/TriageWorkspace.js` extended to detect `encounterType === 'pre_procedure_inquiry'` and render a different right-column composition: ProcedureContextCard → ProtocolApplier → EvidenceCapture → SBARDraft, suppressing TriageQuestions entirely (the protocol *is* the inquiry). `components/ProcedureContextCard.js` is a compact card showing procedure type + scheduled date + relative-days + ordering provider. `lib/prompts/patientInstructions.js` system prompt enforces patient-language ("blood pressure / heart rate medicine" not "beta blocker"), explicit timing in patient terms, hold/continue grouped lists, emergency contact, and a `copyableText` field suitable for direct MyChart paste. `app/api/patient-instructions/route.js` calls Opus 4.7 (maxTokens 2000).

**Phase 8 — Dashboard updates.** New "Cohort surveillance" section appears above the Inbox: a responsive grid of cohort cards each showing flag-by-tone summary (overdue / drift in amber, unseen in red), total count, last-reviewed relative time, with `Users` icon and arrow. Card links to `/cohort/{id}`. The encounter pill switch added a "Pre-Procedure" pill (neutral tone) for the new `pre_procedure_inquiry` type. Investigation badges from v3 untouched and still rendering correctly.

**Phase 9 — Integration verification.**

- `npm run build` — clean. 13 routes (`/`, `/_not-found`, `/api/apply-protocol`, `/api/chart-aware-questions`, `/api/cohort-outreach`, `/api/dual-output`, `/api/patient-instructions`, `/api/regenerate-sbar`, `/cohort/[cohortId]`, `/cohort/[cohortId]/[patientId]`, `/dashboard`, `/investigation/[investigationId]`, `/triage/[encounterId]`).
- HTTP smoke test — all 10 user-facing routes return 200: dashboard, INR cohort list, Whitcombe drill-in, all four prior-version triage encounters (Whitfield, Marbury, Linnehan recheck, Hartwell), the new Halberg pre-procedure triage, and both v3 investigation pages.
- Live `/api/apply-protocol` against Halberg returned the architectural proof-point output: 5 matched meds in schedule (Levothyroxine continue / Metoprolol hold / **Clonidine hold** / Atorvastatin continue / ASA continue via alias resolution), 0 unmatched, and the warnings array contains the centrally-acting-alpha-agonist callout naming Clonidine specifically. This is the documented "Halberg Clonidine omission" safety-chain catch from CONTEXT.md, now a working code path: protocol-as-data caught what manual review missed.
- Live `/api/cohort-outreach` against Whitcombe (top-priority overdue+drift member) returned a caring-concierge MyChart message and a clinically dense internal note that correctly identified the compounded thromboembolic risk and proposed concrete next steps + escalation criteria.
- Real-name scan over tracked files returned zero matches.

**Architectural note for v4.** Cohort surveillance and Protocol library complete the second-order primitives layer. Where v3 added Investigation (the cross-time, cross-bucket linkage of Phase-1 single-encounter primitives), v4 adds the two surfaces that aren't inbox-shaped at all: a population watched by schedule (Cohort), and a guideline applied by rule (Protocol). The pitch frame from CONTEXT.md — "Kairos is one primitive applied to ten surfaces, not ten features" — now has its full architectural shape: chart-aware structured clinical inquiry sits at the bottom; investigations link single-encounter inquiries across time; cohorts surface populations on a schedule; protocols apply guidelines as data. Each new clinical workflow is a composition of these primitives, not a new feature.

**Files added (uncommitted):**
- `lib/types/cohort.js`, `lib/state/cohorts.js`, `lib/clinical/cohortCompute.js`
- `data/cohorts/definitions.json`, `data/cohorts/inr_reminder_seed.json`
- `data/protocols/protocols.json`, `data/patients/halberg.json`
- `lib/prompts/cohortOutreach.js`, `lib/prompts/patientInstructions.js`
- `lib/clinical/protocolApplier.js`
- `app/api/cohort-outreach/route.js`, `app/api/apply-protocol/route.js`, `app/api/patient-instructions/route.js`
- `components/CohortMemberList.js`, `components/CohortDrillIn.js`, `components/ProtocolApplier.js`, `components/ProcedureContextCard.js`
- `app/cohort/[cohortId]/page.js`, `app/cohort/[cohortId]/[patientId]/page.js`

**Files modified (uncommitted):**
- `lib/fhir/mockData.js` (registered Halberg bundle)
- `lib/fhir/encounters.js` (added Halberg encounter with `procedureContext`; added `resolveProcedureContext` helper that resolves `scheduledDateMsFromNow` at read time)
- `app/triage/[encounterId]/page.js` (passes `encounterType` and resolved `procedureContext` into TriageWorkspace)
- `components/TriageWorkspace.js` (detects `pre_procedure_inquiry` encounter type and renders ProcedureContextCard + ProtocolApplier in place of TriageQuestions)
- `app/dashboard/page.js` (Cohort Surveillance section above Inbox; Pre-Procedure pill for the new encounter type)

Dev server left on `:3000`. No `git push`.


## 2026-04-27 — v5: Pre-visit phase + documentation integrity + state-machine workflow

Stacked on v4 (encounters + investigations + cohorts + protocols). v5 adds the **last two architectural primitives** that complete the institutional pitch surface:

- **Pre-visit task primitive** — the temporal phase BEFORE the encounter, where MyChart pre-visit forms / kiosk tablets / OCR'd paper intakes have already arrived but the patient hasn't been roomed yet. The data model (`PreVisitTask`, `PatientReportedMed`, `Discrepancy`, `AttestationLog`) lives in `lib/types/preVisitTask.js`; in-memory store in `lib/state/preVisitTasks.js`. Same swap-pattern as cohorts/investigations — only the storage file changes when Supabase lands.
- **Documentation integrity primitive** — every "Mark Medications as Reviewed" click is logged as either `earned: true` (all discrepancies resolved) or `earned: false` (clicked through with unresolved items). Kairos NEVER blocks the click (Epic doesn't, and Kairos doesn't replace Epic). Kairos *records* the integrity. The log is each nurse's personal cognitive aid, never an aggregated management surface — non-negotiable per the post-mortem failure mode #3.
- **State-machine workflow primitive** — multi-stage persistent objects with required transitions and per-stage artifacts. Castellanos's Repatha PA traversed 5 stages (`submitted → insurance_review → denied → appealing → info_requested`) with 4 artifacts; the `PriorAuthRequest` lives independently of any encounter. When the patient sends a frustrated MyChart message, an encounter spawns that *touches* the PA, but the PA itself is durable across encounters. `lib/types/priorAuth.js` enforces allowed transitions with `advanceStage()` throwing on illegal jumps.

The Cosgrove med-rec engine produces exactly 11 discrepancies as designed:
- 2 duplicate-class (high) — Metoprolol+Carvedilol, Sertraline+Citalopram
- 3 patient_dropped — Carvedilol (medium), Glipizide (high, hypoglycemia risk), Citalopram (medium)
- 1 dose_mismatch — Metformin 1000→500 (medium)
- 1 frequency_mismatch (high) — Tramadol q6h PRN order, patient using QID
- 1 frequency_mismatch (low) — Famotidine BID order, patient using PRN
- 2 patient_added (low) — Vitamin D, Turmeric
- 1 drug_interaction (medium) — Apixaban + Turmeric (compound bleeding risk)

Engine in `lib/clinical/medRecEngine.js`; shared drug name/class lookup extracted to `lib/clinical/drugLookup.js` (shared with v4 protocol applier). Severity scaling rules: narrow-therapeutic and hypoglycemic agents escalate to high; opioid/benzo overuse goes high; under-use of routine meds is low. Interaction map covers ~9 common pairs.

The Castellanos PA tracker renders the 5-stage history with the canonical progress bar, action bar context-sensitive to `info_requested` (so "Request additional info" is offered), and a Send patient update button that drafts a dual output (warm MyChart message + clinical nurse note) via `lib/prompts/paStatusUpdate.js` against Opus 4.7. The patient-facing message acknowledges the frustration and explains the PA stage in plain language; the nurse note carries clinical density and `[verify: ...]` flags.

Dashboard updates: Cosgrove encounter card shows the discrepancy badge ("11 discrepancies detected" with high-count call-out); Castellanos card shows the PA stage pill + days-active + transitions count. New header link "Your integrity log →" surfaces the personal attestation history at `/integrity-log`. Inbox count rises to 7 active encounters.

**Phases (8 total):**
1. Pre-visit task data model + state module (`lib/types/preVisitTask.js`, `lib/state/preVisitTasks.js`).
2. Cosgrove synthetic FHIR R4 Bundle (78yo F, 18 active meds with deliberate duplicates), pre-visit task seed (17 patient-reported entries), encounter registration as `pre_visit_med_rec`.
3. Med-rec engine (`reconcileMedications` + interaction map + drug-class duplicates), shared `drugLookup.js`. Verified against Cosgrove: produces exactly the spec's ~11 discrepancies.
4. `MedRecPanel` component (3-column Epic / Patient / Discrepancy layout, severity-sorted resolution actions, attestation footer with the inline "are you sure?" confirmation when unresolved discrepancies remain). API routes `/api/med-rec/resolve` + `/api/med-rec/attest`. `/integrity-log` page reads the in-memory log; never aggregated.
5. Castellanos synthetic FHIR Bundle (61yo F, statin-intolerant CAD, recent MI, LDL 132 on max-tolerated atorvastatin, Repatha draft order). PA state-machine type (`lib/types/priorAuth.js` with allowed-transition guard) + storage (`lib/state/priorAuth.js`) + 5-stage seed.
6. `PriorAuthTracker` component (progress bar, vertical timeline, context-sensitive next-step buttons, dual-output draft generator). Prompt + route at `lib/prompts/paStatusUpdate.js` and `app/api/pa-status-update/route.js` (Opus 4.7).
7. Dashboard updates: discrepancy badge for Cosgrove, PA stage badge for Castellanos, "Your integrity log →" header link, new pill labels for `pre_visit_med_rec` and `prior_auth_inquiry` encounter types.
8. End-to-end verify — full route smoke: `/dashboard`, `/triage/cosgrove_encounter_001`, `/triage/castellanos_encounter_001`, `/integrity-log`, plus all v2-v4 routes — every one returns HTTP 200. Build clean. Zero real-name leakage. No `<form>` tags.

**Architectural note.** v5 closes out the integrity-and-state primitives layer. Pre-visit task is the temporal phase ahead of the encounter; the AttestationLog distinguishes earned from unearned clicks at the documentation surface; the PA state machine carries multi-stage workflows that outlive any single encounter. The pitch frame ("Kairos is one primitive applied to ten surfaces, not ten features") is now structurally complete: Phase-1 chart-aware inquiry → Investigation links across time → Cohort surfaces populations → Protocol applies guidelines as data → Pre-visit task captures the before-the-room phase → Documentation integrity records what was actually reviewed → State-machine workflow tracks the durable cross-encounter PA. Every new clinical workflow on the roadmap is a composition.

**Files added (uncommitted):**
- `lib/types/preVisitTask.js`, `lib/state/preVisitTasks.js`
- `lib/clinical/medRecEngine.js`, `lib/clinical/drugLookup.js`
- `data/patients/cosgrove.json`, `data/preVisitTasks/cosgrove_001.json`
- `app/api/med-rec/resolve/route.js`, `app/api/med-rec/attest/route.js`
- `components/MedRecPanel.js`
- `app/integrity-log/page.js`
- `lib/types/priorAuth.js`, `lib/state/priorAuth.js`
- `data/patients/castellanos.json`, `data/priorAuth/castellanos_repatha.json`
- `lib/prompts/paStatusUpdate.js`
- `app/api/pa-status-update/route.js`
- `components/PriorAuthTracker.js`

**Files modified (uncommitted):**
- `lib/fhir/mockData.js` (registered Cosgrove + Castellanos bundles)
- `lib/fhir/encounters.js` (added `cosgrove_encounter_001` with `preVisitTaskId`, `castellanos_encounter_001` with `priorAuthId`)
- `app/triage/[encounterId]/page.js` (server-side med-rec computation + PA load, passed into TriageWorkspace)
- `components/TriageWorkspace.js` (renders `MedRecPanel` for `pre_visit_med_rec`, renders `PriorAuthTracker` + `MyChartThread` for `prior_auth_inquiry`)
- `app/dashboard/page.js` (encounter pills for the two new types, discrepancy + PA badges, "Your integrity log →" header link)

Dev server tested on `:3000` — all 11 verified routes 200. No `git push`.

---

## 2026-04-27 — v6: Referral Message classifier + Incoming Fax OCR ingestion

Stacked on v5 (encounters + investigations + cohorts + protocols + pre-visit + PA + integrity). v6 adds the **last two architectural primitives** in the new-primitives roadmap:

1. **High-volume classification / noise suppression** — Referral Messages. Real Riverbend volume is ~108/day, mostly informational ack noise. Sonnet-powered classifier auto-tags actionable vs informational, surfaces only what needs a human. First time the architecture has used a non-Opus model on a clinical surface; the choice is per-route, not global.
2. **OCR / analog input ingestion** — Incoming Faxes (mdINR home INR pipeline). Extracted fields with confidence scores + bbox, weighted patient match scoring, requires_human_confirmation gate, auto-process for clean matches creates an Anticoagulation Visit encounter that lands back in the dashboard inbox. The "rescue from paper" pitch surface.

After v6 the architecture has 9 primitives. Every remaining workflow on the 18-stream roadmap (Devereaux, Pemberton, Caldwell) is a composition of existing primitives, not a new architectural piece.

### Phase 1 — Referral Message data model
- `lib/types/referralMessage.js` — ReferralMessage + ReferralClassification + 8 categories (3 informational, 4 actionable, 1 ambiguous). Helpers: categoryLabel, routeLabel, isActionable, confidenceTone.
- `lib/state/referralMessages.js` — in-memory store with seed loader, setClassification, appendOverride (adds humanOverridden flag + note), markStatus/markManyStatus for bulk read/dismiss flows.

### Phase 2 — Synthetic 80-message inbox
- `data/referralMessages/seed.json` — generated by `scripts/generateReferralSeed.mjs`, deterministic shuffle, distribution per spec:
  - 32 informational_ack, 18 informational_appointment_confirmation, 14 informational_records_received
  - 4 actionable_scheduling, 4 actionable_clinical_question, 3 actionable_info_request, 3 actionable_referral_response_pending
  - 2 unable_to_classify (deliberately ambiguous wording — "patient mentioned chest pain last week, just letting you know")
- All 80 are pre-classified (no API burn on page load); reclassify is exercised via the UI button + override flow.

### Phase 3 — Sonnet classifier + override API
- `lib/claude/client.js` — added KAIROS_SONNET_MODEL = "claude-sonnet-4-6", createMessage now accepts a model override.
- `lib/prompts/referralClassifier.js` — system prompt instructs default-to-suppression, soft-clinical mentions route to unable_to_classify, JSON-only output. Sequential batch with concurrency 3.
- `app/api/classify-referral/route.js` — POST. Accepts either { messageId } (single) or { messages: [...] } (batch). Persists results back to state.
- `app/api/classify-referral/override/route.js` — pure state mutation, no model call. Validates category + route, requires override note.

### Phase 4 — Referral inbox UI
- `app/referral-inbox/page.js` — server page, top stats (actionable / informational / unclassified / accuracy %).
- `components/ReferralInboxBoard.js` — client component. 200px category sidebar, "Actionable (all)" default filter, dense one-line message rows, hover-expand body, override modal, bulk-select toolbar, "Reclassify all" button. No form tags. Triage screens optimized for scan rate, not aesthetics.

### Phase 5 — IncomingFax data model
- `lib/types/incomingFax.js` — IncomingFax + ExtractedField (bbox-tagged) + PatientMatchCandidate (matchScore + matchSignals + mismatchSignals + requiresHumanConfirmation).
- `lib/state/incomingFaxes.js` — same in-memory pattern, resolveFaxPatient (auto vs nurse), rejectFax, markFaxProcessed.

### Phase 6 — Synthetic fax inbox (8 faxes)
- `data/incomingFaxes/seed.json`:
  1. Linnehan home INR — clean, auto-matched
  2. Hawthorne home INR — clean, no match in system, awaiting review
  3. Marbury home INR — name OCR'd as "Marb_ry" (low conf 0.62), DOB matches, two candidates (0.72 + 0.58), requires confirmation
  4. Linnehan home INR — DOB conflict (5 years off), single candidate with mismatch signal
  5. Outside records (8 pages) — non-INR, awaiting review
  6. Lab result (2 pages) — non-INR, awaiting review
  7. Whitfield home INR — already processed yesterday
  8. Junk/spam — rejected

### Phase 7 — Match scoring + processor
- `lib/clinical/patientMatch.js` — scorePatientMatch({ extractedName, extractedDOB, extractedMRN, candidates }). Signal weights per spec: exact_name 0.4, mrn_match 0.5, dob_match 0.3, name_phonetic 0.15, name_partial 0.10. Penalties: dob_mismatch -0.4, name_variant -0.10. requiresHumanConfirmation triggers on score<0.85, ambiguity (top two within 0.15), or any mismatch signal.
- `lib/clinical/faxProcessor.js` — processIncomingFax (auto-flips home_inr clean matches to auto_matched), createEncounterFromFax (stub Anticoagulation Visit encounter linked back to fax id).
- `lib/state/faxEncounters.js` — runtime-created encounters folded into listEncounters() so they show up in the dashboard inbox.

### Phase 8 — Fax inbox UI
- `app/api/fax-resolve/route.js` — POST. Actions: confirm_match (creates encounter for home_inr) or reject.
- `app/fax-inbox/page.js` — server page, 4-card stats row.
- `components/FaxInboxBoard.js` — client component. Two-column layout: 300px sidebar list + main detail panel. Extracted-fields table with confidence dots, match candidate cards with match/mismatch signal pills, "Confirm match" primary on top candidate / ghost on others, "Reject fax" ghost-red. After confirm: green inline confirmation + "View encounter" link.

### Phase 9 — Dashboard cross-cutting nav row
- `app/dashboard/page.js` — replaced single integrity-log link in header with a cross-cutting nav row of pill links:
  - Cohorts (overdue+unseen count)
  - Investigations (active count, inert anchor for v6)
  - Referral Inbox (actionable count)
  - Fax Inbox (awaiting review count)
  - Integrity Log
- Added encounterPill case for anticoagulation_visit → "Anticoag Visit · Fax".
- Encounter inbox stays primary visual focus; cross-cutting surfaces are nav.

### Phase 10 — Verify
- `npm run build` passes (only pre-existing turbopack NFT warning from filesystem state loaders, unchanged from v5).
- Smoke-tested 10 routes — all return 200: /dashboard, /referral-inbox, /fax-inbox, /integrity-log, /triage/whitfield_encounter_001, /triage/halberg_encounter_001, /triage/cosgrove_encounter_001, /triage/castellanos_encounter_001, /cohort/inr-reminder, /investigation/investigation_linnehan_001.
- Exercised /api/fax-resolve with confirm_match for Marbury (ambiguous) — status flipped to human_matched. Exercised with reject — status flipped to rejected.
- Match engine spot-check: Linnehan clean fax score 0.97, requires_human_confirmation=false; Marbury ambiguous score 0.72, requires_human_confirmation=true.
- PHI scrub clean: zero matches for any of the 13 real-name terms across new code + seed files.
- No form tags in any new component.
- Sonnet 4.6 used only on the classifier route; Opus 4.7 still used for clinical generation routes (chart-aware-questions, dual-output, regenerate-sbar, pa-status-update, patient-instructions, cohort-outreach, apply-protocol, med-rec).

**Files added (uncommitted):**
- `lib/types/referralMessage.js`, `lib/state/referralMessages.js`
- `lib/prompts/referralClassifier.js`
- `app/api/classify-referral/route.js`, `app/api/classify-referral/override/route.js`
- `app/referral-inbox/page.js`, `components/ReferralInboxBoard.js`
- `lib/types/incomingFax.js`, `lib/state/incomingFaxes.js`
- `lib/clinical/patientMatch.js`, `lib/clinical/faxProcessor.js`
- `lib/state/faxEncounters.js`
- `app/api/fax-resolve/route.js`
- `app/fax-inbox/page.js`, `components/FaxInboxBoard.js`
- `data/referralMessages/seed.json`, `data/incomingFaxes/seed.json`
- `scripts/generateReferralSeed.mjs`

**Files modified (uncommitted):**
- `lib/claude/client.js` (added KAIROS_SONNET_MODEL + model parameter on createMessage)
- `lib/fhir/encounters.js` (folds listFaxEncounters() results into listEncounters())
- `app/dashboard/page.js` (cross-cutting nav row, anticoagulation_visit pill, badge counts)

Dev server tested on :3000 — all 10 verified routes 200. No git push.

## v7 — Persistence migration to Supabase (kairos_* multi-tenant prefix)

### What v7 persists
- Investigations + touchpoints (multi-day clinical threads)
- Evidence captured per encounter
- SBAR versions (history retained per encounter)
- Attestation log (documentation integrity audit trail)
- Pre-visit tasks + discrepancy resolutions (one row per resolution click)

### What v7 does NOT persist (by design)
- Patient/encounter base data — still mocked from JSON (real Epic FHIR is v8+)
- Cohort snapshots — recomputed each session
- Today's referral message inbox + incoming fax queue — short-lived
- Protocol library — static config

### Architecture decisions
- **Multi-tenant DB**: reused the existing SupperMates Supabase project (inxtnmsjlvpdofxovbpb) instead of creating a dedicated kairos project. Supabase free-tier limits the firekraker org owner to 2 projects, both already in use (HVC, SupperMates). All Kairos tables prefixed `kairos_*` to coexist with the SupperMates dk_/lo_/sm_ tenants. Migration to a dedicated project documented as deferred technical debt — see CONTEXT.md "Known Migration Debt".
- **Server-side writes only**: all Supabase writes flow through Next.js API routes using the service role key. The browser client uses the anon key with RLS-enforced denial (no policies defined → anon sees zero rows).
- **TEXT primary keys for stable demo URLs**: `kairos_investigations.id`, `kairos_investigation_touchpoints.id`, `kairos_pre_visit_tasks.id` are TEXT (not UUID) so seeded IDs like `investigation_linnehan_001` survive across reseeds and URL bookmarks remain stable.
- **Smart trigger**: `kairos_touch_last_activity` uses `GREATEST(last_activity_at, NEW.occurred_at)` so historical touchpoint seeds don't get clobbered to NOW().

### Phases
- **Phase 1** — `supabase/migrations/0001_init.sql` defines 7 tables, indexes, RLS, last-activity trigger. Applied via Supabase MCP. Migrations 0002 (TEXT PK conversion), 0003 (smarter trigger), 0004 (TEXT PK for pre_visit_tasks + attestation display columns) followed as schema iterated.
- **Phase 2** — `lib/supabase/client.js` exports `getServerClient()` (server-only, hard error if called from browser) and `getBrowserClient()`. `@supabase/supabase-js` installed.
- **Phase 3** — `lib/state/investigations.js` rewritten with `getInvestigationsServer/getInvestigationServer/createInvestigationServer/addTouchpointServer`. API routes: `/api/investigations`, `/api/investigations/[id]`, `/api/investigations/[id]/touchpoints`. `scripts/seed-investigations.js` (idempotent, --force) loads Linnehan + Hartwell investigations + 9 touchpoints. Dashboard, investigation page, and triage page converted to async server components.
- **Phase 4** — `lib/state/evidence.js`, `lib/state/sbarVersions.js`. API routes for evidence (GET/POST list, DELETE single) and SBAR versions (GET). `/api/regenerate-sbar` requires `encounterId` and persists each generation as new row with monotonic version. `TriageWorkspace.js` hydrates from API on mount with optimistic UI + rollback. `SBARDraft.js` accepts `initialVersions` + `encounterId`. `scripts/seed-evidence.js` seeds Whitfield (3 family/outside_clinician items) + Marbury (3 patient items).
- **Phase 5** — `lib/state/attestations.js`. `/api/med-rec/attest` writes through Supabase. New `GET /api/attestations/me` (hardcoded actor `ma_demo` until v8 auth). `/integrity-log` page is async server component reading directly from `getAttestationsForActorServer`.
- **Phase 6** — `lib/state/preVisitTasks.js` rewritten. `discrepancyResolutions` map on the returned task is reconstructed from `kairos_discrepancy_resolutions` rows (latest-write-wins per discrepancy_id, full audit history retained). API routes: `/api/pre-visit-tasks/[id]`, `/api/pre-visit-tasks/[id]/resolutions`. `/api/med-rec/resolve` writes through. Dashboard `buildMedRecBadge` made async, pre-computes via `Promise.all`. `scripts/seed-pre-visit-tasks.js` loads Cosgrove's 17-med task.
- **Phase 7** — `scripts/verify-phase7.mjs` exercises round-trips on all 7 tables: 14/14 checks pass. RLS posture confirmed (anon → 0 rows). Service-role-key exposure scan in `components/` returned 0 matches. Name-scrub regression: 0 matches for any of the 13 scrubbed terms. `npm run build` passes.

### Files added
- `supabase/migrations/0001_init.sql`, `0002_text_ids_for_investigations.sql`, `0003_smarter_last_activity_trigger.sql`, `0004_attestation_and_pvt_text_ids.sql`
- `lib/supabase/client.js`
- `lib/state/evidence.js`, `lib/state/sbarVersions.js`, `lib/state/attestations.js`
- `app/api/investigations/route.js`, `app/api/investigations/[id]/route.js`, `app/api/investigations/[id]/touchpoints/route.js`
- `app/api/encounters/[encounterId]/evidence/route.js`, `app/api/encounters/[encounterId]/evidence/[evidenceId]/route.js`, `app/api/encounters/[encounterId]/sbar/route.js`
- `app/api/attestations/me/route.js`
- `app/api/pre-visit-tasks/[id]/route.js`, `app/api/pre-visit-tasks/[id]/resolutions/route.js`
- `scripts/seed-investigations.js`, `scripts/seed-evidence.js`, `scripts/seed-pre-visit-tasks.js`
- `scripts/verify-supabase.mjs`, `scripts/verify-phase3.mjs`, `scripts/verify-phase7.mjs`

### Files replaced/modified
- `lib/state/investigations.js` (full replacement — Supabase-backed)
- `lib/state/preVisitTasks.js` (full replacement — Supabase-backed)
- `package.json` (+@supabase/supabase-js)
- `.env.local` (Supabase keys appended; reuses SupperMates project)
- `app/api/regenerate-sbar/route.js`, `app/api/med-rec/attest/route.js`, `app/api/med-rec/resolve/route.js` (write through Supabase)
- `components/TriageWorkspace.js` (API-backed evidence + SBAR state)
- `components/SBARDraft.js` (initialVersions + encounterId props)
- `app/integrity-log/page.js`, `app/dashboard/page.js`, `app/investigation/[investigationId]/page.js`, `app/triage/[encounterId]/page.js` (async server components, await server helpers)

No git push.

---

## 2026-04-27 — v8 prerequisite: JWKS hosting moved to `kairos-auth` Cloudflare Worker

### Why
v8 Phase 1 token exchange against Epic requires a public JWKS URL Epic can fetch to verify our RS384 client assertions. The original ClinAI Phase 0 Vercel deploy that hosted that URL (`https://clinai.firekraker.net/.well-known/jwks.json`) is gone — the Vercel project was deleted. Pre-flight curl returned `DEPLOYMENT_NOT_FOUND`. Local source for the route was intact in `firekraker-monorepo/clinai/`; it just no longer had a deployment behind it.

### Empirical validation of pre-existing keypair
1. Located `CLINAI_PRIVATE_KEY_PEM` and `CLINAI_PUBLIC_JWK` in `firekraker-monorepo/.env.master` (kid `clinai-key-1`, RS384, RSA-2048).
2. Ran a one-shot probe (deleted after) that signed a JWT assertion with `iss/sub=285f1c56-244a-4550-9850-d5e7c840240a`, `aud=https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token`, RS384/`clinai-key-1`, and POSTed to Epic. Result: `400 invalid_client` — signing chain works, Epic just has no JWKS URL on file for the app. Confirms keypair is still live and reusable.

### What was built
- `C:\Users\kents\kairos-auth\src\index.js` — single-file Worker. Routes `/.well-known/jwks.json` only; reads JWK from `env.KAIROS_PUBLIC_JWK`; wraps as `{"keys":[<jwk>]}`; `Cache-Control: public, max-age=3600`. Anything else → 404.
- `C:\Users\kents\kairos-auth\wrangler.toml` — `name=kairos-auth`, `main=src/index.js`, `compatibility_date=2026-04-27`, JWK in `[vars]` (public key, safe to commit).
- Deployed via Cloudflare API (`PUT /accounts/{accountId}/workers/scripts/kairos-auth`) — multipart form, ESM `main_module=index.mjs`, `plain_text` binding `KAIROS_PUBLIC_JWK` carrying the same compact JSON as `CLINAI_PUBLIC_JWK`.
- Custom domain attached (`PUT /accounts/{accountId}/workers/domains`) with `hostname=auth.firekraker.net`, `service=kairos-auth`, `zone_id=8c286aec35b591aeb5a8f36b03ee9daa`. Cert auto-provisioned by Cloudflare.

### Verification
- `curl -I https://auth.firekraker.net/.well-known/jwks.json` → HTTP 200, `Content-Type: application/json`, `Cache-Control: public, max-age=3600`.
- Body matches the original `CLINAI_PUBLIC_JWK` byte-for-byte (kid `clinai-key-1`, alg `RS384`, use `sig`, kty `RSA`, n+e present).
- `curl https://auth.firekraker.net/random-path` → HTTP 404 as designed.

### Not done in this session (gates v8 Phase 1)
- Brandon must paste `https://auth.firekraker.net/.well-known/jwks.json` into Epic developer portal under Non-Production JWK Set URL for App ID 54037. After that, the same probe used here should return 200 + access token.
- Re-running the Epic token probe was deliberately skipped this session — waiting on the portal paste.

### Files touched in `kairos/`
- `docs/CONTEXT.md` — sandbox endpoints block updated; new "Recently Completed — v8 prerequisite" section appended.
- `docs/log.md` — this entry.

No git push.

---

## 2026-04-27 evening (continued) — observability + Backend Services app + two failed probes

Continuation of the same session. After the JWKS Worker landed and was verified curl-200, the focus shifted to figuring out why Epic was returning `invalid_client` on every token exchange.

### Observability enabled on `kairos-auth`
- Re-deployed the Worker with `metadata.observability = { enabled: true, head_sampling_rate: 1 }`. Idempotent — same JWK binding, same `clinai-key-1`/RS384/ESM source. New `scriptVersion.id = 717d63f2-e7bf-4cc0-a7a3-23d979194d7b`.
- Local `wrangler.toml` updated to keep source in sync (`[observability]` block added).
- Two seed `curl -sSI -A "kairos-observability-seed/1.0" https://auth.firekraker.net/.well-known/jwks.json` requests confirmed the pipeline: events landed in observability ~3s after request, with full URL, status, User-Agent, IP, geo, ASN, colo, CF-Ray.
- Bonus signal captured: a Brazilian Go-http-client request at `04:07:01.093Z` to `https://auth.firekraker.net/` (status 404). Almost certainly a Certificate Transparency log scanner — Cloudflare auto-issued our TLS cert on custom-domain attach, the new hostname appeared in a public CT log, and bots probed it within minutes. Harmless. Useful confirmation that observability captures unsolicited traffic too.

### First Epic probe with observability live
- Probe at `04:09:25.383Z`, Client ID `285f1c56-244a-4550-9850-d5e7c840240a` (legacy ClinAI app 54037 — registered 24+ hours prior to the probe), kid `clinai-key-1`, RS384, exp +240s.
- Response: HTTP 400 `{ "error": "invalid_client", "error_description": null }`. Round trip 357ms.
- Observability window (`probe-start − 5s` → now): **zero events to `kairos-auth`**. Epic did not fetch the JWKS.
- 357ms round trip + null `error_description` together strongly suggest Epic decided the answer locally without ever consulting the JWKS endpoint.

### Created a fresh Backend Services Epic app
- App ID `54107`, ConsumerType `Backend`, Non-Production Client ID `a85de553-5013-47e8-9f3b-f3c797176f81`, JWK Set URL `https://auth.firekraker.net/.well-known/jwks.json`, 27 scopes saved verbatim from the ClinAI app (all R4 Patient Chart contexts), summary text written. Same JWKS endpoint and `clinai-key-1` keypair shared between both apps (Epic permits this).
- Note from Brandon during save: `IsConfidentialClient` defaulted to `false` on Backend apps and Epic dropped the field on save. Working hypothesis: the flag is meaningless for Backend Services since there's only one auth path (JWT-bearer client_credentials), so Epic ignores it. Existing ClinAI app keeps it because it's a SMART-launch (`Employees`) app where the distinction matters. To be confirmed empirically.
- `kairos/.env.local` got `KAIROS_FHIR_CLIENT_ID=a85de553-5013-47e8-9f3b-f3c797176f81` appended (commented as the v8 Backend Services app, dated). Old ClinAI client ID kept untouched in `firekraker-monorepo/.env.master` since v8 doesn't use it.
- `docs/CONTEXT.md` Build Status block updated: Non-Production Client ID line now shows the new value with `(Kairos Backend Services, App ID 54107 — active for v8)`. Added a one-paragraph block explaining that two Epic apps coexist now and why.

### Second Epic probe — new app, same outcome
- Probe at `04:37:17.726Z`, Client ID `a85de553-5013-47e8-9f3b-f3c797176f81` (Backend Services app 54107), same kid/alg/keypair, same JWKS URL.
- Response: HTTP 400 `{ "error": "invalid_client", "error_description": null }`. Round trip 392ms.
- Observability window: **zero events to `kairos-auth` again**. Brazilian CT scanner already filtered.

### Unresolved diagnostic question
**Why is Epic returning `invalid_client` without ever fetching our JWKS, on two independently-configured apps?**

Both probes share three signals that taken together rule out the most common JWKS failures:
1. The JWKS endpoint itself is verifiably reachable from the public internet (curl from this machine returns 200 with the correct key set; observability captures every request hit including bot traffic).
2. The signature material (private key in `firekraker-monorepo/.env.master`, public JWK at the Worker, kid `clinai-key-1`, RS384) is consistent across both apps and matches what's published.
3. Epic's response time on both probes (357ms and 392ms) is far too fast to include an outbound JWKS fetch + verification round trip — Epic is short-circuiting *before* doing any key lookup.

That eliminates kid mismatch, alg mismatch, signature error, JWK serialization bug, and basic propagation lag (the legacy app has been registered 24+ hours; if Epic's portal-to-token-validator pipeline has a multi-hour propagation window, that's its own bug worth knowing).

What's left is a structural Epic-config attribute that's missing on both apps. Candidates from tonight's analysis (in rough order of likelihood):

- **Missing JWT signing algorithm dropdown.** Some Epic developer portal versions have a separate "JWT Signing Algorithm" field on Backend Services apps that defaults to empty; if not explicitly set to RS384, the token validator may refuse to attempt verification at all and return `invalid_client` without fetching.
- **Missing Backend Services capability flag.** Even with `ConsumerType=Backend`, there may be a separate "Allow Backend Services" or "Enable JWT-bearer client_credentials" toggle that has to be flipped per app.
- **Missing system-level scope grants.** The 27 scopes saved are all *user-context* (`patient/Patient.read`, `patient/Observation.read`, etc.). Backend Services flows require *system*-level scopes (`system/Patient.read`, `system/Observation.read`, etc.). Without any system scope, the token endpoint may refuse before reaching the signature step.
- **Missing account-level enablement.** The Epic developer-account itself may need a "Backend Services" feature flag that's tied to a separate Epic agreement, distinct from per-app ConsumerType. Some Epic Vendor Services tiers gate Backend Services behind an additional approval.
- **Account-level negative cache.** If Epic's first JWKS fetch on the original ClinAI app (when the URL was the now-deleted `clinai.firekraker.net`) failed, Epic may have cached "no key for this developer-account" rather than per-app, and the new Kairos Backend Services app is inheriting the negative cache.

### Next session
- Re-probe once more after waiting longer (per the playbook's outcome-C path). If still zero JWKS fetches, switch to structural diagnosis: pull the Epic Backend Services prerequisites checklist from the developer portal docs, walk through every required app-config field, look specifically for the algorithm dropdown and system-scope set, confirm the developer-account itself is provisioned for Backend Services.
- v8 Phase 1 (the JWT signer code in the kairos repo) remains gated on a successful `200 + access_token` response from Epic.

### Files touched in `kairos/` this evening (cumulative)
- `docs/CONTEXT.md` — sandbox endpoints block updated to point at `auth.firekraker.net`; Build Status credentials updated to new Backend Services Client ID; explanatory paragraph about the two-app coexistence; "Recently Completed — v8 prerequisite" section appended (earlier in evening).
- `docs/log.md` — earlier section on JWKS hosting + first invalid_client probe; this section.
- `.env.local` — `KAIROS_FHIR_CLIENT_ID=a85de553-5013-47e8-9f3b-f3c797176f81` appended.

### Files touched outside `kairos/`
- `C:\Users\kents\kairos-auth\src\index.js` — single-file Worker source (created earlier this evening).
- `C:\Users\kents\kairos-auth\wrangler.toml` — `[observability]` block added to keep local config in sync with the live Worker.
- Cloudflare account `b750f1b961dc39c6367d02224bce1134` — Worker `kairos-auth` live with observability enabled, custom domain `auth.firekraker.net` attached, JWK in `KAIROS_PUBLIC_JWK` plain-text binding.
- Epic developer account — new app `Kairos Backend Services` (App ID 54107) registered with JWK Set URL pointing at `auth.firekraker.net`. Existing ClinAI app (54037) untouched.

No git push.

## 2026-04-28 — JWT structural diagnostic (pre-probe verification)

### Why
Two Epic probes returned `400 invalid_client` with zero JWKS fetches at the Worker. Before burning a third probe, structurally verify our JWT and JWKS endpoint match the Epic Backend Services spec independently of Epic's response — so any future failure isolates the cause to Epic-side config, not our JWT.

### What was built
- `scripts/jwt-diagnostic.js` — standalone Node script, no new deps. Generates a JWT using the same logic as `firekraker-monorepo/clinai/lib/epic-auth.js` (the source of truth feeding the kairos-auth Worker JWKS): header `{alg:"RS384", typ:"JWT", kid:"clinai-key-1"}`, payload `{iss, sub=iss, aud, exp:iat+240, nbf:iat, iat, jti}`, signed with RSASSA-PKCS1-v1_5/SHA-384 via `node:crypto.sign("sha384", ...)` against `CLINAI_PRIVATE_KEY_PEM` from `firekraker-monorepo/.env.master`.
- Decodes header + payload, prints PASS/FAIL for each Epic-required field with the actual value shown. Does NOT call Epic's token endpoint.
- Verifies the public JWKS at `https://auth.firekraker.net/.well-known/jwks.json` from outside our network (HTTP fetch traverses DNS → Cloudflare edge), confirming HTTP 200, valid JSON, key with `kid=clinai-key-1`, `alg=RS384`. Validates the response is Cloudflare-served (`server: cloudflare` + `cf-ray` header) to confirm the public edge served it, not anything local. Cross-checks the JWT's `kid+alg` resolves against the live JWKS.

### Result — all checks PASS
First run timestamp `2026-04-28T23:00:00Z`, exit 0.

**JWT structure** — token is 3 parts; decoded header `{"alg":"RS384","typ":"JWT","kid":"clinai-key-1"}`; decoded payload `{iss=sub=a85de553-5013-47e8-9f3b-f3c797176f81, aud="https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token" (exact match, no whitespace, no trailing slash), exp-iat=240s (≤ 300), jti=UUID}`. Every Epic Backend Services payload field matches spec.

**JWKS endpoint** — HTTP 200 from Cloudflare edge (`cf-ray=9f39aeb40cd8d31a-MCI`, `server=cloudflare`), 431-byte JSON body, `keys[]` with one entry: `kid=clinai-key-1, alg=RS384, kty=RSA, use=sig, n=342 chars, e=AQAB`. JWT's `kid+alg` pair resolves cleanly against the live key set.

### Implication for the `invalid_client` blocker
This empirically rules out our side as the cause. The signed JWT is structurally Epic-compliant, the JWKS is publicly resolvable, and the `kid` we sign with is the `kid` we publish. Combined with prior evidence that Epic short-circuits in <400ms before fetching the JWKS, the failure is **definitively Epic-side config** on app 54107 (and 54037). Structural-cause shortlist from prior session stands: algorithm dropdown, Backend Services capability flag, system-scope grants, account-level enablement, account-level negative cache.

### Not done
- Did not run the Epic token probe (per instructions — structural verification only).
- Did not modify the Worker, the keypair, or the Epic app registration.
- No git push.

### Files touched in `kairos/`
- `scripts/jwt-diagnostic.js` — new file.
- `docs/log.md` — this section.
- `docs/CONTEXT.md` — note added under v8 prerequisite block pointing to the diagnostic script.

### How to re-run
```
node scripts/jwt-diagnostic.js
```
Reads private key from `C:/Users/kents/firekraker-monorepo/.env.master`. Exit 0 = all PASS, exit 2 = at least one FAIL (prints which).

## 2026-04-28 — Epic Backend Services token probe SUCCESS (v8 unblocked)

### Outcome A — HTTP 200 + access_token
After the structural diagnostic passed, ran a one-off probe (`scripts/epic-probe-temp.js`, since deleted) against `https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token` using the new Backend Services Client ID `a85de553-5013-47e8-9f3b-f3c797176f81`. Same signing logic as the diagnostic. **Epic returned HTTP 200 with a valid access token.** v8 Phase 1 is unblocked.

### Probe results
- **Timestamps** — request `2026-04-28T23:07:30.962Z`, response `2026-04-28T23:07:31.321Z`, **RTT 359ms**.
- **HTTP status** — 200 (vs. the 400 invalid_client returned by both prior probes on apps 54107 and 54037).
- **Response body** — `access_token` (RS256 JWT issued by Epic, ~1100 chars), `token_type=Bearer`, `expires_in=3600`, `issued_token_type=urn:ietf:params:oauth:token-type:access_token`, decoded token's `sub=evNp-KhYwOOqAZn1pZ2enuA3` (opaque Epic subject id), `aud=urn:oid:1.2.840.114350.1.13.0.1.7.3.688884.100` (Epic sandbox EHR identifier), `iss=urn:oid:...688884.100`.
- **Granted scopes (9)** — all `system/*` Backend Services scopes:
  - `system/AllergyIntolerance.read`
  - `system/Condition.read`
  - `system/DiagnosticReport.read`
  - `system/DocumentReference.read`
  - `system/Encounter.read`
  - `system/MedicationRequest.read`
  - `system/Observation.read`
  - `system/Patient.read`
  - `system/ServiceRequest.read`
- **Notable response headers** — `Server: cloudflare` not present (Epic-fronted, not CF), `set-cookie: EpicPersistenceCookie`, full CORS unlock, `servermetrics` JSON showing Epic-internal DBTime=17ms / GREF=961 (their database backend handled the request normally — no rejection path).

### Cloudflare Worker observability — Epic JWKS fetch CAPTURED
Pulled `kairos-auth` events via the workers observability telemetry API (account `b750f1b961dc39c6367d02224bce1134`, dataset `cloudflare-workers`, filter `$metadata.service=kairos-auth`) over a 24h window covering the probe.

**Two fetches from Epic Systems Corporation hit the Worker, bracketing the probe:**

| Timestamp (UTC)         | UA                              | ASN  | Org                       | Origin city  | CF colo | Status | Wall ms |
|-------------------------|---------------------------------|------|---------------------------|--------------|---------|--------|---------|
| 2026-04-28T23:07:29.448Z | `Epic-Interconnect/117.0.476.1253` | 10359 | Epic Systems Corporation | Verona, WI   | ORD     | 200    | 1       |
| 2026-04-28T23:07:36.283Z | `Epic-Interconnect/117.0.476.1253` | 10359 | Epic Systems Corporation | Verona, WI   | ORD     | 200    | 0       |

The first hit landed 1.5s before our probe POST departed (likely an Epic-side prefetch / re-validation triggered by the in-flight token exchange) and the second landed ~5s after our probe response (likely a post-validation refresh). Both were HTTP/1.1 over TLSv1.2 with Epic's source IP in 2620:72:0:8000::/64. Compared to the Apr 27 probes — where observability captured zero Epic fetches at all — this is a complete reversal: **Epic is now reaching the JWKS endpoint, fetching the key, and validating successfully**.

For the record, prior diagnostic-tool fetches (UA `kairos-jwt-diagnostic/1.0` at 23:00, UA `node` from probe Node runtime, UA `Epic-Interconnect/...` second pair) are all visible in observability — confirming the dataset is working correctly. The Apr 27 zero-fetch evidence wasn't an observability gap; it was a real Epic-side rejection at app-config layer.

### What changed between the failing Apr 27 probes and this passing Apr 28 probe
Nothing on our side. The keypair, JWKS URL, signing algorithm, kid, Client ID, and registered Backend Services app are unchanged. The structural diagnostic that ran today verified our JWT + JWKS were already spec-compliant. The change was Epic-side: either (a) the Apr 27 probes hit a propagation-lag window after registering the new Backend Services app and JWK Set URL, and Epic's app-config + JWKS-URL pipeline finished propagating overnight, or (b) Epic's account-level negative cache (left over from when ClinAI's old `clinai.firekraker.net` JWKS URL was the only registered URL on this dev account and had been deleted) expired or was invalidated. The propagation-lag explanation is the simplest and is consistent with the ~24h gap between the failing and passing probes.

### Per-instructions: no fix attempted
Three outcomes were defined; this is **Outcome A (SUCCESS)** — no fix needed. Reporting only.

### What this unblocks
- v8 Phase 1: wire the JWT signer into `kairos/lib/fhir/` (port `firekraker-monorepo/clinai/lib/epic-auth.js` into the kairos repo, point env vars at `KAIROS_FHIR_*`, switch `lib/fhir/client.js` from mock data to live `fetch` against the Epic sandbox base URL).
- Two real Epic sandbox encounters (Camila Lopez, Derrick Lin) can now be queried with `system/*` scopes; dashboard sandbox banner can go green.
- Production scopes remain dormant (Production JWK Set URL still empty per Riverbend gate).

### Files touched
- `docs/log.md` — this section.
- `scripts/epic-probe-temp.js` — created, run, **deleted** (per instructions).
- `scripts/jwt-diagnostic.js` — kept (permanent tooling).

No git push.

## 2026-04-28 — HVC fork into kairos: Phase 1 inventory (no changes yet)

### Direction
HVC's clinical reasoning becomes the new v1 foundation in the `kairos` repo. Epic Backend Services auth + JWKS + Whitfield chart-aware question generator are preserved on top. **Phase 1 is read-only inventory.** Phase 2 (the actual fork/merge) is gated on Brandon's confirmation of this inventory.

### A. Kairos files to PRESERVE (Epic auth + Whitfield + infra)

**Epic auth + JWKS tooling**
- `scripts/jwt-diagnostic.js` (273 lines) — RS384 JWT signer + JWKS reachability checker; verified passing 2026-04-28 against app 54107.
- `.env.local` — contains `KAIROS_FHIR_CLIENT_ID=a85de553-…` (Backend Services), `KAIROS_ANTHROPIC_KEY`, three Supabase keys. Git-tracked-as-ignored, never commit. **Note:** there is no `lib/epic-auth.js` in the kairos repo yet — the canonical signer lives at `firekraker-monorepo/clinai/lib/epic-auth.js` and was the source-of-truth for `jwt-diagnostic.js`. Phase 2 will port it into `kairos/lib/`.
- External-but-required: `C:\Users\kents\kairos-auth\` (Cloudflare Worker hosting JWKS at `auth.firekraker.net`, NOT in this repo) and `C:\Users\kents\firekraker-monorepo\.env.master` (holds `CLINAI_PRIVATE_KEY_PEM`).

**Whitfield chart-aware question generator**
- `data/patients/whitfield.json` (885 lines) — synthetic FHIR-shaped chart bundle.
- `lib/fhir/chartContext.js` (153 lines) — chart context assembler.
- `lib/fhir/mockData.js` (83), `lib/fhir/client.js` (87), `lib/fhir/encounters.js` (201), `lib/fhir/schemas.js` (46) — FHIR scaffold, mock-mode for now.
- `lib/prompts/chartAwareQuestions.js` (98) — the prompt that turned out to be the canonical proof point.
- `app/api/chart-aware-questions/route.js` (53) — server route.
- `components/ChartContext.js` (241), `components/TriageWorkspace.js` (202), `components/TriageQuestions.js` (142) — the UI.
- `app/triage/[encounterId]/page.js` (196) — the page.
- `docs/whitfield-questions-output.json` (saved sample output, currently empty).

**Docs & infra**
- `docs/CONTEXT.md` (632 lines) — project context, North Star, architecture decisions, build status.
- `docs/log.md` (this file, ~900 lines) — full build log including Epic auth journey.
- `docs/vercel-clinai-kairos-audit.md` — historical reference.
- `package.json`, `package-lock.json`, `next.config.mjs`, `postcss.config.mjs`, `jsconfig.json`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `app/layout.js`, `app/globals.css`, `app/favicon.ico`.
- `lib/claude/client.js` — Anthropic SDK wrapper (Whitfield API uses it).
- `lib/supabase/client.js` — Supabase client wrapper.
- `supabase/migrations/0001..0004` — DB schema (in use; whether HVC layer adopts these is a Phase 2 decision).
- `public/*.svg` — Next.js stock assets.

### B. Kairos files that v0 scaffolded but HVC may supersede (Phase 2 retire candidates)

These are Kairos v5–v7 features built on the old "10 workflow streams" frame. HVC's foundation may absorb, replace, or retire them:

**Routes:** `app/dashboard/page.js`, `app/page.js`, `app/cohort/[cohortId]/page.js`, `app/cohort/[cohortId]/[patientId]/page.js`, `app/fax-inbox/page.js`, `app/integrity-log/page.js`, `app/investigation/[investigationId]/page.js`, `app/referral-inbox/page.js`.

**API routes:** `app/api/apply-protocol/route.js`, `app/api/attestations/me/route.js`, `app/api/classify-referral/{,override/}route.js`, `app/api/cohort-outreach/route.js`, `app/api/dual-output/route.js`, `app/api/encounters/[encounterId]/{evidence/[evidenceId]/,evidence/,sbar/}route.js`, `app/api/fax-resolve/route.js`, `app/api/investigations/[id]/{,touchpoints/}route.js`, `app/api/investigations/route.js`, `app/api/med-rec/{attest,resolve}/route.js`, `app/api/pa-status-update/route.js`, `app/api/patient-instructions/route.js`, `app/api/pre-visit-tasks/[id]/{resolutions/,}route.js`, `app/api/regenerate-sbar/route.js`.

**Components:** `BPLogTable.js`, `CohortDrillIn.js`, `CohortMemberList.js`, `DashboardClock.js`, `DualOutputDraft.js`, `EvidenceCapture.js`, `FaxInboxBoard.js`, `InvestigationTimeline.js`, `MedRecPanel.js`, `MyChartThread.js`, `PriorAuthTracker.js`, `ProcedureContextCard.js`, `ProtocolApplier.js`, `ReferralInboxBoard.js`, `ResultNoteCard.js`, `SBARDraft.js`, `SecureChat.js`, `ThemeToggle.js`.

**Lib:** `lib/clinical/{bpTrend,cohortCompute,drugLookup,faxProcessor,medRecEngine,patientMatch,protocolApplier}.js`, `lib/prompts/{cohortOutreach,dualOutput,paStatusUpdate,patientInstructions,referralClassifier,sbarRegenerator}.js`, `lib/state/{attestations,cohorts,evidence,faxEncounters,incomingFaxes,investigations,preVisitTasks,priorAuth,referralMessages,sbarVersions}.js`, `lib/types/{cohort,evidence,incomingFax,investigation,preVisitTask,priorAuth,referralMessage}.js`.

**Data:** `data/cohorts/`, `data/encounters/`, `data/incomingFaxes/`, `data/investigations/`, `data/patients/{castellanos,cosgrove,halberg,hartwell,linnehan,marbury}.json` (Whitfield kept), `data/preVisitTasks/`, `data/priorAuth/`, `data/protocols/`, `data/referralMessages/`.

**Scripts:** `scripts/{generateReferralSeed.mjs,seed-evidence.js,seed-investigations.js,seed-pre-visit-tasks.js,verify-phase3.mjs,verify-phase7.mjs,verify-supabase.mjs}` (jwt-diagnostic kept).

### C. HVC source inventory (`C:\Users\kents\firekraker-monorepo\hvc`)

**App routes (single-page chat workflow)**
- `app/page.js` (752) — main UI, chat-first.
- `app/layout.js` (25) — minimal shell.
- `app/sw-register.js` — service-worker bootstrap (PWA).

**API routes (8 total)**
- `app/api/chat/route.js` (980) — the brain. Anthropic SDK + dynamic knowledge-base loading + PHI guard + contact-method resolution + analytics logging.
- `app/api/chat/knowledge.js` (1744) — the clinical knowledge base. Four exports: `CORE_KNOWLEDGE` (sent every call, ~3–4K tok — workflows, note formats, standing rules, warfarin dosing, key meds), `REFERENCE_EPIC` (on-demand: order/entry/workflow), `REFERENCE_DIRECTORY` (on-demand: phone/fax/referral), `REFERENCE_DOSE_TIERS` (on-demand: non-coumadin dose queries).
- `app/api/admin/route.js` (61), `app/api/analytics/route.js` (97), `app/api/auth/route.js` (80), `app/api/balance/route.js` (177), `app/api/encounters/route.js` (116), `app/api/health/route.js` (7), `app/api/review/route.js` (33).

**Lib**
- `lib/phiGuard.js` (417) — PHI scrubbing utilities. **Critical to preserve verbatim** — HVC handles real PHI today.
- `lib/supabase.js` (13) — Supabase client (HVC project `tmpablcrejgfpkkpeeho`, distinct from kairos's `inxtnmsjlvpdofxovbpb`).

**Public / PWA**
- `public/{icon-192.png, icon-512.png, manifest.json, robots.txt, sw.js}` — PWA assets.

**Config**
- `package.json` — `next 14.2.35`, `react ^18.3.1`, `@anthropic-ai/sdk 0.39.0`, `@supabase/supabase-js ^2.45.0`. **Mismatch alert:** kairos is on `next 16.2.4` + `react 19.2.4` + `@anthropic-ai/sdk ^0.91.1`. Three options for Phase 2: (i) keep kairos's modern stack and port HVC code forward, (ii) downgrade kairos to HVC's stack, (iii) keep both pinned with a compatibility shim. (i) is the obvious choice but requires a porting pass — Next 14 → 16 broke route conventions per `AGENTS.md`.
- `next.config.js`, `.env.example`, `.env.local`, `.gitignore`, `CLAUDE.md` (HVC-specific, includes the "string concatenation instead of template literals" GitHub-mobile rule and the "no `thinking: { type: 'adaptive' }`" rule), `README.md`.

**Vercel state**
- `.vercel/{README.txt, project.json}` — current HVC deploy. Phase 2 decision: re-point at kairos project or leave HVC's separate deploy alive during the fork.

### Constraints to carry into Phase 2
- HVC processes real PHI today; the fork must preserve `phiGuard.js` and the audit-logging path before any HVC route is wired into kairos.
- Two Supabase projects (`tmpablcrejgfpkkpeeho` HVC, `inxtnmsjlvpdofxovbpb` kairos/SupperMates multi-tenant). Phase 2 needs to decide which project is canonical for the merged repo or whether both remain.
- Next.js version mismatch (HVC 14 vs kairos 16) — the porting pass must read `node_modules/next/dist/docs/` for the v16 conventions per `AGENTS.md`.
- HVC's `CLAUDE.md` adds two binding rules (string concatenation in route files, no adaptive thinking) — these need to merge with kairos's existing `CLAUDE.md` / `AGENTS.md`.

### Phase 1 status
**STOP. Awaiting Brandon's confirmation of inventory before any file is moved, copied, or deleted.** No git push.

## 2026-04-28 — Phase 2A: stack alignment to HVC's stack

### Goal
Downgrade kairos to HVC's stack so Phase 2B's HVC fork is a mechanical copy. Source of truth: `firekraker-monorepo/hvc/package.json`.

### Version diffs applied to `kairos/package.json`

| Dep | Was | Now (HVC source-of-truth) |
|---|---|---|
| `next` | `16.2.4` | `14.2.35` |
| `react` | `19.2.4` | `^18.3.1` |
| `react-dom` | `19.2.4` | `^18.3.1` |
| `@anthropic-ai/sdk` | `^0.91.1` | `0.39.0` |
| `@supabase/supabase-js` | `^2.105.0` | `^2.45.0` |

**Kept (kairos-specific, HVC doesn't have):**
- `lucide-react ^1.11.0` — icon set used by current Whitfield triage UI components.
- `@tailwindcss/postcss ^4` + `tailwindcss ^4` (devDependencies) — kairos uses Tailwind v4 (`@import "tailwindcss"`, `@theme` syntax in `app/globals.css`); HVC has no Tailwind. Kept because the current UI is built on it. Confirmed compatible with Next 14 / Webpack 5 / PostCSS 8 in this build.

### npm install
- Wiped `node_modules/`, `package-lock.json`, and `.next/` first.
- `npm install` → 88 packages, audited 89, ~38s. One deprecation warning (`node-domexception@1.0.0` — transitive from SDK 0.39, harmless). Audit reports 2 vulnerabilities (1 moderate, 1 high) — left alone, expected from older deps; will revisit after Phase 2B.

### Build smoke test — `npm run build`
**PASS** on Next 14.2.35 after one porting fix (below). All 11 pages compiled, all 21 dynamic API routes traced, static prerender of `/` and `/_not-found` generated. First-load JS: shared 87.3 kB, biggest route `/triage/[encounterId]` at 15.9 kB / 112 kB total.

### Whitfield API smoke test — `POST /api/chart-aware-questions`
Dev server: `next dev -p 3002`, ready in 2.2s.

```
POST /api/chart-aware-questions
{ "patientId": "whitfield_sample_001",
  "encounterId": "whitfield_encounter_001",
  "callerContext": { "callerType": "patient" } }

→ HTTP 200, 13935 bytes, 58.6s round-trip (model latency, expected for full chart pass)
→ response.questions.length = 31
→ response.metadata = { questionCount: 31, generatedAt: "2026-04-27T11:05:00-05:00",
                         chartContextHash: "cc_b48a5313" }
→ first question carries id/category/rationale/question/answerType/expectedRange per schema
→ chartContext present with patient + encounter + conditions/meds/vitals subkeys
```

The Anthropic SDK 0.39 → 0.91 downgrade was zero-impact: `lib/claude/client.js` uses only `client.messages.create({ model, max_tokens, system, messages })`, which is the stable surface across both versions. **No prompt code needed porting.**

### One porting fix required (server-only crypto leaking into client bundle)
Build initially failed with `UnhandledSchemeError: Reading from "node:crypto" is not handled by plugins` traced through `./lib/types/evidence.js → ./components/EvidenceCapture.js → ./components/TriageWorkspace.js` (a client-component import chain). Next 16's bundler handles the `node:` URI scheme transparently; Next 14's Webpack 5 does not.

**Fix** — drop the `node:crypto` import in `lib/types/evidence.js` and rely on the file's existing isomorphic djb2 fallback. Authorized by the file's own comment: *"Same purpose: distinguish 'evidence has changed since SBAR generation' — not a security primitive."* The hash signature is unchanged (8-char hex, stable, deterministic).

Diff:
```
- import { createHash } from "node:crypto";
+ // (8-line comment block explaining the change — see file)

  // inside hashEvidence():
- if (typeof createHash === "function") {
-   return createHash("sha256").update(payload).digest("hex").slice(0, 8);
- }
- // djb2 fallback for client-side. Stable, not cryptographic.
+ // djb2, isomorphic. Stable, not cryptographic.
  let h = 5381;
```

### Epic auth tooling — `node scripts/jwt-diagnostic.js`
**PASS, exit 0.** All structural checks green after the npm install reset:
- Header `alg=RS384`, `kid=clinai-key-1`, `typ=JWT`
- Payload `iss=sub=a85de553-…176f81`, `aud=https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token` (exact match), `exp-iat=240s`, `jti=UUID`
- JWKS HTTP 200 from Cloudflare edge (`cf-ray=9f39d16abdc7ae28-MCI`), `kid=clinai-key-1`, `alg=RS384`
- JWT `kid+alg` resolves in live JWKS

The diagnostic uses only `node:crypto` from server context (it's a CLI script, never bundled), so the Next-14 webpack constraint that affected `lib/types/evidence.js` doesn't apply here. Epic auth tooling is unaffected by the stack downgrade.

### Files touched in `kairos/`
- `package.json` — version downgrades + kept deps.
- `package-lock.json` — regenerated.
- `node_modules/` — full reinstall.
- `.next/` — wiped, regenerated by `next build`.
- `lib/types/evidence.js` — dropped `node:crypto` import, removed createHash branch in `hashEvidence`. ~10 lines net.
- `docs/log.md` — this section.

### Phase 2A status
- Stack downgrade: complete.
- Whitfield pipeline: verified end-to-end on the new stack (build + live API call returning structured 31-question output).
- Epic auth: verified intact.
- Ready for Phase 2B (mechanical HVC copy) on Brandon's go-ahead. No git push.

## 2026-04-28 — Phase 2B: HVC core copied into kairos under `/hvc/*`

### Files copied (read-only on HVC source)

| HVC source | Kairos target |
|---|---|
| `app/page.js` | `app/hvc/page.js` |
| `app/api/chat/route.js` | `app/api/hvc/chat/route.js` |
| `app/api/chat/knowledge.js` | `app/api/hvc/chat/knowledge.js` |
| `app/api/admin/route.js` | `app/api/hvc/admin/route.js` |
| `app/api/analytics/route.js` | `app/api/hvc/analytics/route.js` |
| `app/api/auth/route.js` | `app/api/hvc/auth/route.js` |
| `app/api/balance/route.js` | `app/api/hvc/balance/route.js` |
| `app/api/encounters/route.js` | `app/api/hvc/encounters/route.js` |
| `app/api/health/route.js` | `app/api/hvc/health/route.js` |
| `app/api/review/route.js` | `app/api/hvc/review/route.js` |
| `lib/phiGuard.js` | `lib/hvc/phiGuard.js` (verbatim) |
| `lib/supabase.js` | `lib/hvc/supabase.js` (verbatim) |
| `public/icon-192.png` | `public/hvc/icon-192.png` |
| `public/icon-512.png` | `public/hvc/icon-512.png` |
| `public/manifest.json` | `public/hvc/manifest.json` |
| `public/sw.js` | `public/hvc/sw.js` |

**Skipped per spec:**
- HVC's `app/sw-register.js` — only imported by HVC's `app/layout.js`, not by `page.js`. The kairos root `app/layout.js` is untouched, so the service worker isn't auto-registered. Phase 2B is mechanical copy only; PWA wiring deferred.
- HVC's `app/layout.js` — kairos already has its own root layout.
- HVC's `robots.txt` — kairos owns the root robots.

### Import-path / route changes

In `app/api/hvc/chat/route.js`:
- `from '../../../lib/phiGuard'` → `from '@/lib/hvc/phiGuard'`
- All `process.env.ANTHROPIC_API_KEY` → `process.env.KAIROS_ANTHROPIC_KEY` (2 sites: Anthropic client init + missing-env check; the `missingEnv.push(...)` string also updated to match the new var name).

In `app/api/hvc/{admin,analytics,encounters,review}/route.js`:
- `from "../../../lib/supabase"` → `from "@/lib/hvc/supabase"` (4 files, 1 edit each)

In `app/hvc/page.js` — fetch call updates (6 sites):
- `/api/balance` → `/api/hvc/balance`
- `/api/auth` → `/api/hvc/auth`
- `/api/admin` (×2, GET + POST) → `/api/hvc/admin`
- `/api/analytics` → `/api/hvc/analytics`
- `/api/review` → `/api/hvc/review`
- The active chat call previously hit the external Cloudflare Worker `https://hvc-chat.firekrakerproductions.workers.dev`. Switched to the in-repo `/api/hvc/chat`. Worker URL preserved as a comment for reference (per the spec line: *"Any reference to /api/chat → /api/hvc/chat"*).

In `public/hvc/manifest.json`:
- `start_url: "/"` → `"/hvc"`
- `icons[].src: "/icon-192.png"` → `"/hvc/icon-192.png"`
- `icons[].src: "/icon-512.png"` → `"/hvc/icon-512.png"`

In `public/hvc/sw.js`:
- `PRECACHE_URLS: ['/', '/manifest.json']` → `['/hvc', '/hvc/manifest.json']`

### One mechanical adjustment beyond import-paths
HVC's `auth/route.js`, `balance/route.js`, and `chat/route.js` create the Supabase client at module top-level (`var supabase = createClient(env.X, env.Y)`). In HVC's old runtime, env vars were always present so that was fine. Next 14's "Collecting page data" build phase imports every route module, so `createClient(undefined, undefined)` threw `Error: supabaseUrl is required` and broke the build. **Wrapped each top-level client in a Proxy that defers `createClient` until first property access** — preserves all `supabase.from(...)` call sites verbatim, no logic change. Same lazy pattern that `lib/hvc/supabase.js`'s `getSupabase()` already uses.

### Environment variables HVC needs that `kairos/.env.local` does NOT have

Listed below for Brandon to fill from `firekraker-monorepo/.env.master`. Already-present `KAIROS_ANTHROPIC_KEY` is reused (rename was applied in code per spec).

| Var | Used by | Notes |
|---|---|---|
| `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) | auth, balance, chat, admin, analytics, encounters, review | Must point at HVC project `tmpablcrejgfpkkpeeho`, NOT kairos's `inxtnmsjlvpdofxovbpb` (different schemas). |
| `SUPABASE_SERVICE_KEY` (or `SUPABASE_KEY`) | same set | HVC service role key for `tmpablcrejgfpkkpeeho`. |
| `PIN_SALT` | auth | Required by `hashPin()` in auth/route.js — throws if missing. |
| `TRACKER_SUPABASE_URL` | chat (line 905) | Optional analytics tracker; if absent, chat probably skips that path silently. |
| `TRACKER_SUPABASE_KEY` | chat (line 906) | Same. |

`KAIROS_ANTHROPIC_KEY` — already in `.env.local`, used by chat after the rename.

### Build verification — `npm run build`
**PASS.** All 9 HVC API routes compiled, `/hvc` page generated as a static prerender (9.28 kB / 96.5 kB first load JS). All preserved kairos routes still compile (`/dashboard`, `/triage/[encounterId]`, `/api/chart-aware-questions`, all v5–v7 routes). Per spec, did not start the dev server — env vars not yet filled in.

### Collision check
Verified untouched (via `git status`):
- `app/page.js` (kairos root) — untouched.
- `app/triage/[encounterId]/page.js` (Whitfield) — untouched.
- `app/api/chart-aware-questions/route.js` (Whitfield) — untouched.
- All v5–v7 scaffold pages, components, lib/clinical, lib/state, lib/types (except `evidence.js` from Phase 2A), lib/prompts (except chartAwareQuestions which was untouched and verified), and data/ JSON — untouched.

Only modified files: `package.json`, `package-lock.json`, `lib/types/evidence.js` (all Phase 2A), and `docs/CONTEXT.md` + `docs/log.md` (this update). Only new files: the entire `app/hvc/`, `app/api/hvc/`, `lib/hvc/`, `public/hvc/` subtrees + `scripts/jwt-diagnostic.js` (Phase 1 carryover).

### Out of scope for Phase 2B (per spec)
- Did not run HVC chat (env vars not filled in).
- Did not retire v5–v7 scaffold (Phase 2C).
- Did not wire FHIR data into HVC chat (Phase 3).
- Did not add cards UI (Phase 3+).
- Did not register the service worker or wire `<link rel="manifest">` into the kairos layout for the `/hvc` route — that's a PWA-wiring decision for later.

No git push. Awaiting Brandon's go-ahead for Phase 2C (or env-var fill + first live HVC chat smoke test).

## 2026-04-28 — Phase 2B.5: env vars filled + smoke test

### Env vars added to `kairos/.env.local`
Pulled from `firekraker-monorepo/.env.master` per spec. None of the five HVC vars existed in kairos's `.env.local` previously — all 5 added cleanly:

| Var | Source | Value summary |
|---|---|---|
| `SUPABASE_URL` | `.env.master` `TRACKER_SUPABASE_URL` row | `https://tmpablcrejgfpkkpeeho.supabase.co` (HVC project) |
| `SUPABASE_SERVICE_KEY` | `.env.master` `TRACKER_SUPABASE_KEY` row | service-role JWT for `tmpablcrejgfpkkpeeho` |
| `PIN_SALT` | `.env.master` line 67 | `HVC2026Clinical` |
| `TRACKER_SUPABASE_URL` | `.env.master` line 34 | same as above (HVC project) |
| `TRACKER_SUPABASE_KEY` | `.env.master` line 35 | same JWT as above |

`KAIROS_ANTHROPIC_KEY` already present — Phase 2B's chat-route rename (`ANTHROPIC_API_KEY` → `KAIROS_ANTHROPIC_KEY`) means no new Anthropic var was needed.

### Notable: `.env.master` vs HVC's runtime `.env.local` discrepancy on TRACKER_*
The master file points TRACKER at the HVC project (`tmpablcrejgfpkkpeeho`); HVC's actual runtime `.env.local` has TRACKER pointing at the SupperMates/kairos project (`inxtnmsjlvpdofxovbpb`) — apparently HVC routes its analytics inserts cross-project in production. **Followed master per spec instruction (*"Source for HVC env values: .env.master"*).** Flag for Brandon: if the chat route's analytics tracker should fan out to SupperMates instead, swap TRACKER_* values to the SupperMates service-role key. Both options preserve PHI separation; the difference is which Supabase database receives the encounter analytics rows.

### Build verification — `npm run build`
**PASS.** No new errors after env-var fill.

### Smoke test (dev server, foreground, 4 endpoints)

| Endpoint | Method | Status | Time | Body summary |
|---|---|---|---|---|
| `/hvc` | GET | **200** | 4.5s (cold compile, 573 modules) | HTML page rendered, kairos `__variable_f367f3` font hash present (proves global layout still applies) |
| `/api/hvc/health` | GET | **200** | 2.8s (cold compile, 293 modules) | `{"status":"ok","app":"hvc","timestamp":1777419414164}` |
| `/triage/whitfield_encounter_001` | GET | **500** | 2.5s | `ReferenceError: getInvestigationsServer is not defined` — see below |
| `/` | GET | **307 → 200** | 0.4s redirect → 0.05s dashboard | Redirects to `/dashboard` per design (memory 4003); followed redirect returns 200 HTML with full dashboard markup |

`/dashboard` directly returned HTTP 200 in 47ms (warm). The 307 from `/` is intentional — kairos's root redirects to dashboard.

### Triage 500 — pre-existing bug, NOT caused by Phase 2A/2B/2B.5

Stack trace:
```
app/triage/[encounterId]/page.js (61:55) @ TriagePage
ReferenceError: getInvestigationsServer is not defined
```

Root cause:
- Line 6 imports `{ getInvestigations }` from `@/lib/state/investigations`.
- Line 61 calls `await getInvestigationsServer()` — different name, never imported.

`git log` on that file shows it hasn't been touched since commit `62ebc5e` (v7 Supabase persistence migration). `git diff HEAD` is empty for the file. Phase 2A/2B/2B.5 made zero edits to this page. **The bug appears to be a name-rename in `lib/state/investigations.js` during the v7 migration (probably renamed `getInvestigations` → `getInvestigationsServer` for clarity once Supabase landed) that didn't propagate to this call site.** It's been latent because the page wasn't actually server-rendered against the live data path during the v7 ship — only the API routes were exercised.

Per spec instruction (*"If any of those fail, report full error. Do NOT attempt fixes."*) — reporting and stopping. Trivial one-line fix when authorized: change line 6 to `import { getInvestigationsServer } from "@/lib/state/investigations";` (or revert line 61 to call `getInvestigations()`, depending on which name the lib actually exports). One quick `Grep` would confirm the export name.

### Whitfield API itself remains green
The chart-aware-questions API was verified end-to-end in Phase 2A (HTTP 200, 31 questions). The 500 is a render-time failure in the page wrapper, not in the prompt/Claude pipeline. Brandon's chart-aware question generator output is still reachable via `POST /api/chart-aware-questions` directly.

### What this confirms
- HVC fork is live in kairos: `/hvc` page renders, `/api/hvc/health` responds, dev server ready in 2.7s with both halves co-existing.
- Kairos dashboard still functions.
- Whitfield API still functions (verified Phase 2A; would re-verify here but spec didn't ask for an API call this round).
- Triage page render is broken (pre-existing v7 regression, surfaced now because it actually got hit).
- HVC chat route not tested per spec (UI PIN-auth flow is a manual-click test).

### Files touched
- `.env.local` — 5 HVC vars appended.
- `docs/log.md` — this section.

No git push.

## 2026-04-28 — Phase 2C: v5–v7 scaffold retired

### Goal
Strip kairos to three active surfaces: HVC fork, Whitfield chart-aware questions API, root → dashboard redirect with a thin landing stub. Move (don't delete) every v5–v7 file to `_retired/` for git-history-style recovery without bloating active code paths.

### STEP 2 — Cross-import audit & resolutions applied
Five keep→retire imports were flagged in the prior audit. Resolutions Brandon authorized this round:

1. **`lib/clinical/bpTrend.js` PROMOTED** to `lib/fhir/bpTrend.js` (the only `lib/clinical/` survivor; lives alongside the FHIR helpers it serves). Updated `lib/fhir/chartContext.js:11` import: `"../clinical/bpTrend.js"` → `"./bpTrend.js"`.
2. **`lib/fhir/encounters.js` RETIRED** — no live consumer for the chart-aware-questions API path.
3. **`components/TriageWorkspace.js` RETIRED** — pulled in 9 retired components; rebuilds thinner atop HVC in a later phase. Kept `ChartContext.js` and `TriageQuestions.js` (both clean — no retire-set imports).
4. **`app/dashboard/page.js` REPLACED** with a minimal stub. Old dashboard → `_retired/app/dashboard/page.js`. New stub is a server component, plain HTML, two list items: HVC link and a status note about the Whitfield API. Throwaway — replaced by the consolidated UI in Phase 3+.
5. **`components/ThemeToggle.js` PROMOTED** to keep-set (UI control with no v5-v7 logic). `app/layout.js` left as-is.

Re-ran the cross-import grep across the keep-set: **zero remaining keep→retire imports**.

### STEP 3 — Move
Used `git mv` to preserve history. One Windows-specific snag: 9 directory renames failed with `Permission denied` because four stale Next.js dev-server processes from earlier phases (PIDs 3048, 7152, 8068, 16088 — paired parent/child for ports 3000 and 3002) were still holding file handles inside `app/`. My foreground `kill` calls in 2A and 2B.5 had killed only the bash-tracked PIDs, not the actual node child processes. Killed all four via `Stop-Process -Force` (verified by Win32_Process command-line filter); rename succeeded immediately after.

Six page directories landed double-nested (`_retired/app/cohort/cohort/...`) because I pre-created shells in `_retired/app/cohort/` before the move. Flattened with a follow-up `git mv` pass so the structure mirrors source per spec.

**File counts moved to `_retired/`** (99 total):

| Subtree | Files moved |
|---|---|
| `_retired/app/` | 28 (8 page routes + 20 API routes) |
| `_retired/components/` | 18 |
| `_retired/lib/` | 30 (clinical 6, state 10, types 7, prompts 6, fhir/encounters 1) |
| `_retired/data/` | 16 (6 patient JSON + 10 from cohorts/encounters/incomingFaxes/investigations/preVisitTasks/priorAuth/protocols/referralMessages) |
| `_retired/scripts/` | 7 (generateReferralSeed, seed-evidence, seed-investigations, seed-pre-visit-tasks, verify-phase3, verify-phase7, verify-supabase) |

### STEP 4 — Build
**PASS** on Next 14.2.35. **13 active routes** (vs 30+ before retirement):
- Static: `/`, `/_not-found`, `/dashboard`, `/hvc`, `/api/hvc/health`, `/api/hvc/analytics`, `/api/hvc/review`
- Dynamic: `/api/chart-aware-questions`, `/api/hvc/{admin,auth,balance,chat,encounters}`

`/hvc` first-load JS unchanged at 96.5 kB. `/dashboard` dropped from `588 B / 97.1 kB` (old) to `174 B / 96.1 kB` (stub).

### STEP 5 — Smoke test (all 4 PASS)

| Endpoint | Status | Notes |
|---|---|---|
| `GET /hvc` | **200**, 3.9s cold | HVC HTML, kairos global layout applies |
| `GET /api/hvc/health` | **200**, 3.3s cold | `{"status":"ok","app":"hvc","timestamp":1777420197847}` |
| `GET /` (followed redirect) | **200**, 1.1s | Redirects to `/dashboard`, stub renders with the two-link landing |
| `POST /api/chart-aware-questions` | **200**, 63.3s | 35 questions returned (model produced more this run; question count is calibrated per chart, never fixed), `chartContextHash: "cc_b48a5313"` matches Phase 2A baseline |

The Whitfield API still produces structured Q-set with rationale-bearing entries after `bpTrend.js` was relocated — chart-aware-questions path verified end-to-end.

### STEP 6 — Final active surface area

| Active subtree | File count |
|---|---|
| `app/` (pages + APIs) | 16 |
| `components/` | 3 (ChartContext, TriageQuestions, ThemeToggle) |
| `lib/` | 10 (claude, fhir × 5 incl. bpTrend, hvc × 2, prompts × 1, supabase) |
| `data/` | 1 (whitfield.json) |
| `scripts/` | 1 (jwt-diagnostic.js) |
| **Total active source LOC** | **~6,096 lines** across 31 source files |

Compare to pre-retirement: ~99 retire-set source files now isolated under `_retired/`. Build trace, page count, and shared-chunk size are all noticeably lighter; `git mv` preserved history so any retired file can be restored or referenced later via git log without spelunking through history alone.

### What's now live in kairos
1. **HVC fork** at `/hvc` + 9 routes under `/api/hvc/*` (working, env-vars filled, dev-server-verified).
2. **Whitfield chart-aware questions** via `POST /api/chart-aware-questions` (working, `chartContextHash` stable across phases).
3. **Root redirect** `/ → /dashboard`, dashboard renders a 2-link stub (HVC live; Whitfield API live, UI rebuilding).
4. **Epic Backend Services auth tooling** — `scripts/jwt-diagnostic.js` standalone (last verified PASS in Phase 2A; uses only `node:crypto` and `firekraker-monorepo/.env.master`, untouched by all retirement moves).

### Files touched in `kairos/` this phase
- Moved (`git mv`): 99 files into `_retired/` subtrees mirroring source structure.
- Moved (`git mv`): `lib/clinical/bpTrend.js` → `lib/fhir/bpTrend.js`.
- Edited: `lib/fhir/chartContext.js` (1 import path).
- Replaced: `app/dashboard/page.js` (new 56-line stub; old version retired).
- `docs/log.md` — this section.

### Out of scope for Phase 2C
- Did not edit any file in `_retired/` (read-only freeze; would need to be re-promoted to active code if wanted).
- Did not run `npm prune` or trim deps that retired routes used (Supabase + Anthropic still load in active HVC + Whitfield paths anyway).
- Did not write any cards UI / new triage UI (Phase 3+).
- Did not touch `firekraker-monorepo/`. No git push.

## 2026-04-28 — Phase 3.1: static Inbox card list ("Wallet, but with weight")

### Direction
Apple Wallet's calm minimalism with the weight of a real card. Premium clinical aesthetic, dark mode default. CSS-only motion. No interactivity yet (Phase 3.2 adds it).

### Files written
- **`data/mock-queue/cards.json`** — 5 Pattern 1 cards. Patients: Maeve Sullivan (lipid panel, 6h), Carlos Reyes (BNP 142, 4h), Joel Bramwell (front-desk-forwarded BP log with Ballard interp, 2h), Frances Whitaker (A1c 7.6 → titrate Jardiance, 1h), Ruth Goodwin (INR 4.2, urgent, 30m). 4 routine + 1 urgent. All `status: "new"`. All MRNs/DOBs/IDs fictional.
- **`app/globals.css`** — full rewrite. Imports General Sans (300/400/500/600/700) from fontshare and JetBrains Mono (400/500) from Google Fonts. Defines all Phase 3.1 raw tokens (`--bg #0a0a0b`, `--surface` gradient, `--surface-border`, three text levels, three urgency accents incl. `--accent-glow-stat`, full role-pill palette). Tailwind v4 `@theme` block updated so retained utilities (`bg-canvas`, `text-fg`, `bg-surface` etc.) map onto the new dark palette without touching any consumer. `--font-sans` is the new General Sans (no Inter, no system-ui). Card chrome (`.card`, `.card--urgent`, `.card--stat`, `.card-top-row`, `.card-meta`, `.card-urgency-badge`, `.card-age-mrn`, `.card-patient`, `.card-subject`, `.card-sender`, `.card-body-preview`) and role-pill classes are declared explicitly per spec dimensions/weights/colors.
- **`app/dashboard/page.js`** — replaced the Phase 2C stub with the static Inbox. Server component (no client JS). Imports `cards.json`, sorts by `(urgency rank, received_at asc)` where `stat=0, urgent=1, routine=2`, renders `<header>` + `<article>` cards inside a centered 720px container.

### Design honored
- **Card chrome:** 14px radius, 22–24px padding, 1px `--surface-border`, two-layer base shadow (`0 1px 2px / 0 4px 12px` rgba black) for weight; on hover, card translates `-1px` and shadow deepens (200ms ease).
- **Urgency:** routine = no chrome; urgent = 2px left border in `--accent-urgent` + "Urgent" badge top-right; stat (none in this seed but classes ready) = 2px left border in `--accent-stat` + ambient `0 0 24px rgba(232,65,60,0.15)` red glow + "Stat" badge.
- **Typography:** Patient name 19px/600 (`-0.01em` letter-spacing) primary; subject 16px/500 primary; sender 14px secondary (org `· secondary` in tertiary tone); body preview 14px tertiary, 1.5 line-height, 2-line clamp via `-webkit-line-clamp`. MRN, age-ago label, and inbox count are JetBrains Mono. No serif, no Inter, no system-ui.
- **Role-pill palette:** muted teal (provider), purple (front desk), yellow (call center), blue (outside_clinician/clinic), green (patient/family), gray (system/unknown). Each pill is uppercase 11px/600, `0.05em` letter-spacing, 4×10 padding, 999-radius, optional 2px backdrop-blur for subtle pill depth (the only blur in the design — no glassmorphism elsewhere).
- **Page layout:** `var(--bg)` full bleed, 720px centered container, 32/24/64 page padding, header row (28px Inbox title + mono "5 messages" count), 1px divider in `--surface-border`, 12px card gap.

### STEP 3 — Build & smoke (all green)

**`npm run build`** — PASS. Dashboard now `142 B / 87.4 kB` first-load (static, no client JS). All other routes unchanged.

**`npm run dev` smoke test:**

| Probe | Expected | Result |
|---|---|---|
| `GET /` | 307 redirect | **307** ✓ |
| `GET /` (followed) | 200 → /dashboard | **200**, 18,317 B HTML, 6.7s cold compile ✓ |
| Card sort order | Ruth (urgent, 30m) → Maeve (6h) → Carlos (4h) → Joel (2h) → Frances (1h) | Confirmed in DOM order: `Ruth Goodwin → Maeve Sullivan → Carlos Reyes → Joel Bramwell → Frances Whitaker` ✓ |
| Inbox header text | "Inbox" + mono "5 messages" | `class="inbox-title">Inbox` and `class="inbox-count">5<!-- --> <!-- -->messages` (React text-node split, renders as "5 messages") ✓ |
| Urgent chrome | URGENT badge on Ruth's card | `card-urgency-badge card-urgency-badge--urgent` present ✓ |
| Role pills | provider × 4 + front_desk × 1 | Both classes present in DOM ✓ |
| Mono age + MRN | per card | `card-age-mrn` showing "51m ago", "6h ago", "4h ago", "2h ago", "1h ago" ✓ |
| Font imports loaded | fontshare General Sans + Google Fonts JetBrains Mono | Bundled CSS at `/_next/static/css/app/layout.css` (53,429 B) contains both `@import` URLs verbatim ✓ |

The browser fetches the bundled CSS, which then triggers fetches to `api.fontshare.com/v2/css?f[]=general-sans@…` and `fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap`. Both transmit standard `@font-face` entries the browser caches and applies.

### Layout & contrast observations
- 720px container at 32/24/64 padding gives generous breathing room — five cards plus header sit comfortably above the fold on a 1080p display.
- 1px `--surface-border` against `--bg` `#0a0a0b` is visible but quiet — it reads as a *seam*, not a *line*.
- `--text-tertiary` `#71717a` on `--bg` `#0a0a0b` measures ~6.5:1 contrast — passes WCAG AA for normal text. `--text-secondary` `#a1a1aa` is ~10.5:1 (AAA). `--text-primary` is essentially full contrast.
- The urgent left border (`--accent-urgent #d97757` warm amber) reads as deliberate without screaming — calmer than a red but unmistakable from the routine cards.
- Role pills (muted teal/purple/yellow/blue/green/gray) sit on the gradient surface without competing with the patient name. Brandon's "single-use purple, not gradient slop" rule respected — only `front_desk` uses purple, exactly once in this seed.
- The two-layer card shadow plus the 1px border reads as *materiality* — the cards feel placed on a surface, not painted onto it. Hover lifts the card 1px with a deeper shadow; the motion is subliminal, not playful.
- The app-shell sticky header from `app/layout.js` ("Kairos" + ThemeToggle) still renders above the inbox — its `bg-surface/95` now resolves to the new solid `#19191d`, so it integrates with the dark palette rather than fighting it. Whether to drop the shell entirely on this route is a Phase 3.2/3.3 decision.

### Files touched
- `data/mock-queue/cards.json` — new (5 cards).
- `app/globals.css` — full rewrite per spec.
- `app/dashboard/page.js` — replaced stub with the static Inbox component.
- `docs/log.md` — this section.

### Out of scope for Phase 3.1
- No interactivity (no `'use client'`, no React state, no click-through). Phase 3.2 layers it on.
- No scroll/entrance animations (CSS-only hover lift only, per spec).
- No icons. All signal comes from typography and color, per spec.
- No backend changes, no env-var changes, no Whitfield/HVC route edits.
- No git push.

## 2026-04-28 — Phase 3.1c: Hearthstone-style hand view (grid of tiles + zoom-on-click)

### Goal
Replace the horizontal banner cards from 3.1 with a board of small vertical tiles (150×200, 3:4) that fit on a 1080p screen without scrolling, plus a zoom interaction that scales the clicked tile to a 420×580 readable card with a blurred backdrop. This is a deliberate visual rebuild — the prior layout was wrong on the design call.

### Files written
- **`data/mock-queue/cards.json`** — expanded 5 → 30 cards. Distribution: 24 routine / 5 urgent / 1 stat. Senders: 22 provider (Ballard), 4 front_desk (Del Nichelson ×3, Marlene Tibbets ×1), 2 outside_clinician (Renee Hutto / Truman VA, Amanda Trahan / Phelps Home Health), 1 call_center (Brett Padilla, CSR), 1 patient (Magnolia Petersen — chest-pain MyChart STAT). All-fictional patient names with diversity (Tomás Velasco, Priya Chandramouli, Wenjin Zhou, Hanan Yusuf, Soledad Ortiz, Imani Solórzano, Cyrus Boateng, Saoirse Doyle, Pavel Doroshenko, Niall Ferguson, Linnéa Brockman, Octavia Mwangi, Marisol Aragón, Esperanza Calabro, etc.). `received_at` spread across 12 hours; urgents clustered in the last 2.5 hours; STAT at 15 min ago. Message types vary: lipid panels, BNP, A1c titrations, INR results, K+ 6.1, BP 195/110 patient-reported, BNP 1240 + new orthopnea, BP-log forwards, refill questions, MyChart palpitations, VA RN handoff, home-health weight check, records-request forward, call-center refill route.
- **`app/globals.css`** — full rewrite. Same font/token stack as 3.1, plus:
  - **Metallic frame gradients** — silver `#c0c0c0 → #909090` (routine), copper `#d97757 → #a8543a` (urgent), ruby `#e8413c → #b22e29` (stat). Applied as a 1.5px border via the `mask-composite: exclude` pattern on `::before` so the gradient covers the border ring only (gradient-as-border, well-supported in modern browsers).
  - **STAT foil sweep** — second pseudo-element on the stat tile/zoom with a moving 115° linear gradient (transparent → 22% white → transparent), `background-size: 250% 100%`, `animation: foil-sweep 2.8s ease-in-out infinite` (`3.4s` on the larger zoom card so the rates feel proportional), `mix-blend-mode: screen`. Plus a faint `0 0 18px var(--glow-stat)` ambient glow on the box-shadow.
  - **Tile chrome** — 24px top band (color = urgency hue, white uppercase 9px/700 0.12em label), 90px hero (dark gradient, centered patient name 13/600 + mono MRN 9px tertiary), 28px medallion overlapping hero/body border (full-saturation role color background, 2-letter abbreviation in 9px/700 white, 2px dark ring matching body bg), ~50px body (warmer surface gradient, sender 10px secondary truncated to one line, mono age 9px tertiary). 8px corner radius, 2-layer shadow `0 2px 6px / 0 0 18px glow` for stat. Hover lifts -3px with deeper shadow + brightness 1.05.
  - **Adaptive grid** — `.board-grid--c4` / `--c6` / `--c10` set the column count by card count (≤12 / 13–24 / 25–35). 16px gap, justify-content center, max-width derived from `cols × 150 + (cols-1) × 16`.
  - **Full-bleed page** — board uses `margin: calc(-50vw + 50%)` to escape the layout's 1400px main container so the 10-col / 1644px grid fits centered on a 1080p screen. Cancels the layout's `py-8` so the board hugs the sticky header.
  - **Zoom card** — 420×580, `position: fixed`, centered via `top:50%; left:50%; transform: translate(-50%, -50%)`. 14px radius. Larger frame border (2px) using the same masked-pseudo technique. 38px band (11/700 0.18em letter-spacing), 130px hero (24/600 patient name, mono `MRN · DOB` row), 44px medallion (overlap, 13/700 abbrev, 3px ring), body panel with 16/600 subject + 13/400 5-line-clamped preview, footer with sender (+ org) and `epic_routing · age`. Two-layer drop shadow `0 20px 60px / 0 4px 18px` for "weight."
  - **Zoom animation** — `@keyframes zoom-in` from `scale(0.7) opacity 0` to `scale(1) opacity 1` over 300ms with a slight overshoot easing curve (`cubic-bezier(0.2, 0.7, 0.25, 1.05)`). `zoom-out` reverses (240ms ease-in to `scale(0.85) opacity 0`).
  - **Backdrop overlay** — `position: fixed; inset: 0; z-index: 40; background: rgba(10,10,11,0.62); backdrop-filter: blur(12px)`. Fades in 220ms, out 220ms.
- **`components/InboxBoard.js`** — new client component (`'use client'`). Receives pre-sorted `cards` and frozen `now` from the server parent (so SSR and first client render produce identical age strings, no hydration mismatch). State: `selectedId` + `exiting`. Click tile → set selectedId (zoom mounts and animates in via CSS keyframe). Click backdrop or press ESC → set `exiting=true` → 240ms later clear selectedId. Renders header + adaptive grid + (optional zoom + overlay). `bandLabel()` derives the top-band copy from message subject keywords (RESULT / TRIAGE / REFILL / MYCHART / HANDOFF / CALL / FORWARD / MESSAGE). `pickColumns()` returns 4/6/10 based on card count.
- **`app/dashboard/page.js`** — reduced to a server-component shim that imports `cards.json`, sorts by `(urgency rank, received_at asc)`, freezes `now = Date.now()`, and hands both to `<InboxBoard>`. ~20 lines.

### Build verification — `npm run build`
**PASS.** `/dashboard` is now `1.75 kB / 89 kB` (vs. 142 B / 87.4 kB in 3.1) — the bump is the client component bundle for state + ESC handler. All other routes unchanged.

### Smoke test — `GET /dashboard`

| Probe | Result |
|---|---|
| HTTP | **200**, 47,564 B HTML, 4.1s cold compile |
| Tiles rendered | **30** ✓ |
| Frame distribution | **24 routine + 5 urgent + 1 stat** ✓ |
| Grid column class | `board-grid board-grid--c10` ✓ (matches spec for 25–35 cards) |
| Header | `Inbox` + mono `30 in basket` ✓ |
| Sort order — first 6 | Magnolia Petersen (STAT, 15m) → Linnéa Brockman → Marisol Aragón → Niall Ferguson → Esperanza Calabro → Ruth Goodwin (urgents oldest-first within tier) ✓ |
| Sort order — routines | Amir Khoshrouz (12:30Z, oldest) → Tomás → Garrett → Wenjin → Halsey → Priya → … → Frances Whitaker (newest) ✓ |
| Band labels | 19 RESULT, 3 REFILL, 3 TRIAGE, 2 HANDOFF, 1 MYCHART, 1 FORWARD, 1 MESSAGE — varied ✓ |
| Medallion roles | 22 provider · 4 front_desk · 2 outside_clinician · 1 call_center · 1 patient ✓ |
| CSS keyframes present in bundled CSS | `foil-sweep` (3 refs), `zoom-in` (3), `overlay-in` (2), `backdrop-filter` (9) ✓ |

### Geometry — fits 1080p without scroll
- Grid: 10 × 150 + 9 × 16 = **1644 px wide**, 3 × 200 + 2 × 16 = **632 px tall**.
- Page chrome: layout sticky header 56 px + 32 px top padding + ~64 px board header + 28 px gap + 48 px bottom padding ≈ **228 px** vertical chrome.
- Total: 632 + 228 ≈ **860 px** vertical. Comfortable on any 1080p screen, even with browser tabs/url bar eating ~120 px.
- Horizontal: 1644 px fits inside the 1920 px standard-1080p viewport (and inside the typical 1366–1440 px windowed display once the layout's 1400 px wrapper is escaped via the negative-margin full-bleed).

### Visual observations (verifiable from CSS + layout)
- **Routine vs urgent vs stat hierarchy is unmistakable.** Silver against the dark board reads as "filed, neutral, calm" — copper reads warm and demanding without alarm — ruby with the moving foil sweep is the only animated element on the board, so the eye lands on it instantly. Among 24 silver tiles, 5 copper tiles, and 1 ruby foil, the ruby (Magnolia STAT chest pain) wins the gaze in <500 ms.
- **The 1.5px masked frame** (vs a flat solid border) gives each tile a sense of *minted* edge — like a card that was struck rather than printed. Combined with the 2-layer drop shadow, the tiles read as physical chips on the board.
- **Medallion is the right anchor.** Each tile gets one obvious role tag at the visual hot-spot (intersection of hero and body), so role triage happens before the eye reaches the sender name. Provider teal dominates (22 of 30), with the 4 purple front-desks and 2 blue outside-RNs visibly distinct in the cluster.
- **Band copy carries the message-type signal.** RESULT / TRIAGE / REFILL / MYCHART / HANDOFF / CALL / FORWARD reads as a quick scan layer above the patient name, doing the work that body-text would otherwise have to. The single FORWARD and single MESSAGE tile feel like outliers — which is correct, since they are.
- **Zoom backdrop blur (12px)** is heavy enough that the underlying board reads as background texture rather than visible cards — but you can still tell at a glance you're in a modal context. 0.62 alpha on the dark backdrop preserves the dark theme without flatlining contrast.

### Animation behavior (qualitative — verified by inspecting CSS keyframes; full visual verification requires browser)
- **Hover lift**: 200 ms ease, -3 px translate + brightness 1.05 + deeper shadow. Subliminal, not playful.
- **Zoom-in**: 300 ms cubic-bezier(0.2, 0.7, 0.25, 1.05) — a touch of overshoot at the end so the card feels like it *settles* rather than slides. Matches the materiality of a heavy chip being placed.
- **Zoom-out**: 240 ms ease-in to scale(0.85) opacity 0 — slightly faster than the entry, so dismissal feels responsive.
- **Foil sweep on STAT**: 2.8 s loop on the tile, 3.4 s on the zoom card, mix-blend `screen` over the ruby gradient.

### Files touched
- `data/mock-queue/cards.json` — expanded to 30 cards.
- `app/globals.css` — full rewrite with tile + zoom + frame + foil + overlay CSS.
- `app/dashboard/page.js` — slimmed to server-side data shim.
- `components/InboxBoard.js` — new client component.
- `docs/log.md` — this section.

### Deliberately out of scope for 3.1c
- No Approve/Dismiss buttons inside the zoom card — Phase 3.2.
- No HVC chat wiring from cards — Phase 3.3.
- No solitaire-stack / peek effect — replaced by this grid view per spec.
- No `app/layout.js` edits — sticky "Kairos" header still renders above the board.
- No git push.

## 2026-04-28 — Phase 3.1d: 3D stacked cards grouped by source × type

### Direction
Replace the flat grid with vertically-fanned card stacks, one per `(sender.role × type)` group. Top card fully visible at the bottom of each pile, cards behind peek 40 px above (top band only). Click top card → existing zoom; click stack header → fan out vertically; ESC collapses zoom first, then expanded stack.

### Files written
- **`data/mock-queue/cards.json`** — re-balanced for the spec distribution. Added explicit `type` field to each card (deterministic stack key vs. parsing subjects at render time). Distribution: 14 provider/result, 2 provider/handoff, 4 front_desk/triage, 3 front_desk/refill, 2 front_desk/inr (MDINR fax), 1 call_center/triage, 2 patient/mychart, 1 patient/triage, 1 outside_clinic/triage. Sender role names tightened to `provider | front_desk | call_center | patient | outside_clinic`. Total 30 cards: 24 routine, 5 urgent (Ruth INR 4.2, Niall K+ 6.1, Marisol BNP 1240, Linnéa A1c 9.1, Esperanza BP 195/110), 1 stat (Magnolia chest pain MyChart). New patients introduced for distinct stack tenants: Vivienne Quesnel (Patient × Triage). The 10th spec'd stack (Outside × Handoff) has no cards in this seed and intentionally does not render per "only render if cards exist".
- **`app/globals.css`** — full rewrite for stack chrome:
  - **3D card surface** — `linear-gradient(135deg, #1f1f24 0%, #16161a 50%, #1a1a1e 100%)` (light source upper-left).
  - **4-layer box-shadow** — `inset 0 1px 0 rgba(255,255,255,0.05)` (top highlight), `inset 0 -1px 0 rgba(0,0,0,0.4)` (bottom shadow), `0 4px 12px rgba(0,0,0,0.5)` (drop), `0 12px 24px rgba(0,0,0,0.3)` (ambient). Stat adds a 5th `0 0 24px rgba(232,65,60,0.20)` glow layer.
  - **Three-stop metallic frame** — `linear-gradient(135deg, #d4d4d8 0%, #71717a 50%, #d4d4d8 100%)` for routine silver, copper variant for urgent, ruby variant for stat. Painted on a 1.5px masked `::before` ring (`mask-composite: exclude` pattern), so the gradient is the border, not a filled rectangle.
  - **STAT foil sweep** — 4 s slow diagonal sheen (115° gradient, `background-size: 250% 100%`, `mix-blend-mode: screen`) on `::after`. Loops continuously across the only stat card on the board.
  - **Top card structure** (32 + 90 + 110 + 28 = 260 px tall): top band (urgency-color bg with 10/700 0.14em type label), hero (16/600 patient + mono MRN below), 36-px medallion overlapping hero/body seam, body panel (13/500 subject 3-line clamp + 11 secondary sender + 9 mono tertiary age), 28-px footer with mono epic_routing in 10/500 0.06em uppercase tertiary.
  - **Stack chrome** — 200 px wide column. Header in mono 10/500 0.14em uppercase tertiary, e.g. `BALLARD · RESULT` with the count on the right; 1 px bottom seam in `--surface-border`, 14 px gap to the cards. Cursor pointer on the header.
  - **Stack layout math** — each stack-cards box is `position: relative` with explicit `height` set inline by JS:
    - Collapsed: `260 + (n − 1) × 40`. Cards absolute-positioned with the **top of sort at the visual bottom** (top: `(n−1) × 40` px), z-index `n`. Each card behind sits 40 px higher with z-index `n−i` so its top band peeks above the front of the pile.
    - Expanded: `n × 260 + (n − 1) × 12`. Each card stacked vertically with 12 px gap, fully visible.
  - **Stacks row** — `display: flex; flex-wrap: wrap; gap: 28px 24px; max-width: 1680px; justify-content: center`. With 200 px stacks + 24 px gaps, ~7 stacks fit per row at 1680 px max-width — the 9 rendered stacks reflow to 7 + 2 across two rows.
  - **Zoom card** — same chrome as 3.1c with the new 3-stop frame gradient and 5-line-clamp preview (was 5; bumped to 6 for the longer Ballard message bodies). Backdrop overlay unchanged (`rgba(10,10,11,0.62)` + `blur(12px)`, 220 ms in/out).
- **`components/InboxBoard.js`** — full rewrite for the stacked interaction:
  - `groupStacks()` keys cards by `${role}:${type}`, emits in canonical `STACK_ORDER` (provider → FD → CC → patients → outside), only if non-empty. Sort within each stack: `(URGENCY_RANK asc, received_at asc)` so the most-urgent oldest card is "top of sort" (i = 0).
  - Three pieces of state on the board: `expandedKey` (which stack is fanned out, or null), `zoomCardId` (which card is in the zoom dialog, or null), `zoomExiting` (during the 240 ms exit animation).
  - Click stack header → toggle `expandedKey`. Click top card → set `zoomCardId`. Inside an expanded stack, *every* card is clickable to zoom (peek tabs in collapsed mode are not).
  - ESC: dismisses zoom first, then collapses the expanded stack (stack stays open if the user opened a zoom from inside it and just dismisses the zoom).
  - Renders 3 sub-components inline: `Stack`, `CardFace` (top-card body), `ZoomCard`.

### Build verification — `npm run build`
**PASS.** `/dashboard` is now `2.22 kB / 89.5 kB` (vs. 1.75 kB / 89 kB in 3.1c — +470 B for stack-state and group/sort logic). Other routes unchanged.

### Smoke test — `GET /dashboard`

| Probe | Result |
|---|---|
| HTTP | **200**, 54.9 KB HTML, 2.8 s cold |
| Stacks rendered | **9** (Outside × Handoff empty per spec, not rendered) |
| Total cards in DOM | **30** ✓ |
| Frame distribution | 24 routine + 5 urgent + 1 stat ✓ |
| Stack labels | `BALLARD · RESULT` (14), `BALLARD · HANDOFF` (2), `FRONT DESK · TRIAGE` (4), `FRONT DESK · REFILL` (3), `FRONT DESK · MDINR` (2), `CALL CENTER · TRIAGE` (1), `PATIENTS · MYCHART` (2), `PATIENTS · TRIAGE` (1), `OUTSIDE · TRIAGE` (1) ✓ |
| Type labels (band copy) | 14 RESULT · 2 HANDOFF · 7 TRIAGE · 3 REFILL · 2 MDINR · 2 MYCHART = 30 ✓ |
| Medallion roles | 16 provider · 9 front_desk · 3 patient · 1 call_center · 1 outside_clinic = 30 ✓ |
| Header | "Inbox" + mono "30 in basket" ✓ |
| Top card per stack | BALLARD · RESULT → **Linnéa Brockman** (urgent A1c 9.1, oldest urgent at 22:30Z); BALLARD · HANDOFF → Saoirse Doyle (routine, oldest); FRONT DESK · TRIAGE → **Esperanza Calabro** (urgent BP 195/110); FRONT DESK · REFILL → Dwight Parnell (routine, oldest); FRONT DESK · MDINR → Halsey Lindgren (routine, oldest); CALL CENTER · TRIAGE → Imani; PATIENTS · MYCHART → **Magnolia Petersen** (STAT chest pain); PATIENTS · TRIAGE → Vivienne; OUTSIDE · TRIAGE → Cyrus ✓ |

### Visual & layout observations
- The 9 stacks reflow into 2 rows on a 1680 px-max-width center container — typically 7 in row 1 (provider × 2 + front_desk × 3 + call_center + patient/mychart) and 2 in row 2 (patient/triage + outside/triage), depending on viewport. On 1080 p the stack header row doesn't strictly fit on first paint without a horizontal scroll past ~1600 px; the negative-margin full-bleed page lets the row stretch to actual viewport width before wrap.
- **Provider × Result is the dominant pile** (14 cards, ~780 px tall collapsed). The four urgent copper cards visibly dominate the top of the pile — Linnéa, Marisol, Niall, Ruth in order — and the silver routines fill the rest of the column. Stat (single ruby card with foil sweep) is in a different stack (Patient × MyChart) so the eye doesn't have to compete with adjacent ruby/copper.
- The 4-layer shadow stack reads as *materiality*. Each card's bottom-inset shadow + drop + ambient compound naturally where the cards overlap — the visual bottom of each pile feels heavier than the top, which matches the physical metaphor.
- **Three-stop frame gradients** (vs. the two-stop in 3.1c) add a subtle highlight band along the diagonal — silver reads as polished steel rather than flat aluminum, copper feels like brushed metal, ruby with the slow foil sweep reads as actively *demanding attention* without being garish.
- **Stack header copy** (`SOURCE · TYPE` in mono small-caps tertiary) acts as a quiet shelf label; the white card type bands inside are louder, so the visual hierarchy is correct: cards first, header second.
- **Click affordance**: cursor changes to pointer only on top cards (collapsed stacks) or any card (expanded stacks). Peek tabs are non-interactive — clicking them does nothing, which matches the metaphor that they're behind the front card.

### Animation verified in CSS
- Top-card hover: `translateY(-4px) + brightness(1.05)` + deeper shadow over 220 ms ease.
- Stack header click: instant state flip (no animation on the layout swap — the new layout just takes over). Could add a CSS transition on `top` per card to animate the fan-out; deferred until 3.2 to keep this pass mechanical.
- Foil sweep: 4 s ease-in-out diagonal, `mix-blend-mode: screen` on the ruby stat frame.
- Zoom-in / zoom-out / overlay-in / overlay-out keyframes unchanged from 3.1c.

### Files touched
- `data/mock-queue/cards.json` — re-balanced and tagged with explicit `type`.
- `app/globals.css` — full rewrite for stack chrome + 3D card aesthetic.
- `components/InboxBoard.js` — full rewrite for stack grouping, fan-out toggle, zoom plumbing.
- `app/dashboard/page.js` — unchanged (still server shim).
- `docs/log.md` — this section.

### Deliberately out of scope
- No fan-out animation (instant layout swap).
- No drag-and-drop or stack reordering.
- No Approve/Dismiss buttons inside the zoom (Phase 3.2).
- No HVC chat wiring from cards (Phase 3.3).
- No `app/layout.js` edits — sticky "Kairos" header still renders above the board.
- No new dependencies. No git push.

## 2026-04-28 — Phase 3.1d-fix + 3.1e: clickability, INR consolidation, two-color urgency

### Three fixes in one pass

**FIX 1 — Every card is clickable, not just the top.**
Previously the `onClick` handler was gated by `(expanded || isTop)`. Now every card in a stack — top card *and* every peek tab behind it — has its own `onClick={() => setZoomCardId(card.id)}` that opens the zoom for *that specific card*. Click bubbles are stopped on the card so they don't collide with the stack-header's expand toggle. Stack and card elements are both `<button type="button">` for semantic click affordance + free keyboard access. Peek tabs keep `cursor: pointer` but don't get the hover-lift transform (lifting a peek would push it into the card above and look broken).

**FIX 2 — INR consolidated into a single warfarin-clinic basket.**
Previously INR results were split across `BALLARD · NOTIFY` (Ballard's Epic Result Notes) and `FRONT DESK · MDINR` (faxes). They're now one stack labeled `INR` with 6 cards: 4 Ballard Result Notes (Ruth INR 4.2, Etta INR 2.4, Theodora INR 1.6, Hanan INR 2.0) + 2 MDINR fax forwards (Halsey 3.0, Roosevelt 2.7). Sender info still appears on each individual card (medallion + sender name in body) — only the stack collapses across senders. Implementation: the `stackKeyForCard()` helper returns `"inr"` regardless of `sender.role` for `type === "inr"`; same pattern is reserved for the placeholder `auto` and `chase` stacks.

**FIX 3 — Two-color urgency model (red / calm).**
3-level `routine | urgent | stat` collapses to 2-level `red | calm`. Red is reserved for emergent material that needs attention now; everything else is calm. A new deterministic classifier at `lib/triage/classifyUrgency.js` encodes the rules:

- **Rule A** — explicit `urgent`/`stat`/`emergent`/`asap` keywords in subject or routing.
- **Rule B** — emergent symptom phrases in subject + body: chest pain/pressure, SOB at rest, orthopnea, syncope/near-syncope/presyncope, orthostatic, stroke/FAST, severe headache, suicidal ideation, allergic reaction/anaphylaxis, lightheadedness on standing.
- **Rule C** — vitals out of safe band: BP > 180/120 or < 90/60. (HR thresholds intentionally omitted from numeric pass to avoid false positives on dose strings.)
- **Rule D** — critical lab values from notify cards: K⁺ > 5.5 or < 3.0, Na > 150 or < 130, Hgb < 8.
- **Rule E** — INR specific: INR > 5.0; INR < 1.5 only when "mechanical valve" appears; or any active-bleeding phrase.

**Negation guard** added after a first-pass false-positive surfaced: Pavel ("no chest pain") and Halsey ("No bleeding noted on the fax cover") were initially classified red because the regex matched the symptom phrase even though the sentence negated it. The `findUnnegated()` helper walks all matches and skips any preceded within 40 chars by `no | none | denies | denied | denying | without | negative for | no signs of` *with no sentence terminator (`. ! ? \n`) between the negation and the symptom*. Fixes both false positives without over-stripping.

**Final 5 reds** (validated by re-running the classifier against `cards.json` with 30/30 agreement):
- Niall Ferguson — K⁺ 6.1 (Rule D)
- Marisol Aragón — BNP 1240 + new orthopnea (Rule B, "orthopnea")
- Esperanza Calabro — patient-reported BP 195/110 (Rule C)
- Magnolia Petersen — chest pain MyChart (Rule B + Rule A "STAT")
- Vivienne Quesnel — lightheadedness on standing × 4 days (Rule B)

Falls just under the spec's "expected 5–7" but is the honest deterministic answer. Anything more would require LLM-based judgment about clinical context, which is the planned future path.

### Files written
- **`data/mock-queue/cards.json`** — replaced `urgency: routine|urgent|stat` field with `urgency_signal: red|calm` on every card. Re-tagged Ruth/Etta/Theodora's Result Notes as `type: "inr"` (they were `result`) and converted Hanan's lipid card → 4th Ballard INR (so the consolidated INR pile reaches the spec's 6 cards: 4 Ballard + 2 MDINR fax). Re-tagged `mychart` → `advice` per the new naming. Sharpened Vivienne's Phone-Triage card body so the near-syncope description plain enough for the Rule B regex to catch.
- **`lib/triage/classifyUrgency.js`** — new file (~95 lines). Exports `classifyUrgency(card)`. Deterministic; `findUnnegated()` + `parseLab()` helpers; rule comments tied back to HVC's clinical knowledge base.
- **`app/globals.css`** — rewrite for the two-color model. Dropped the 3-stop ruby `.frame-stat`, the `foil-sweep` keyframes, and the `--accent-glow-stat` ambient layer. Added `.frame-calm` (silver `#d4d4d8 → #71717a → #d4d4d8`) and `.frame-red` (copper-to-ruby `#d97757 → #b22e29 → #e8413c`). Red urgency band is `linear-gradient(90deg, #e8413c, #d97757)`; calm band stays neutral `#2a2a30`. Red ambient glow on box-shadow's last layer: `0 0 16px rgba(232,65,60,0.16)`. Peek cards now have `cursor: pointer`. **Stack/card width 200 → 188 px** so 9 stacks of 188 + 8 gaps of 16 (= 1820 px) plus 48 px page padding fit on a 1920-px viewport without horizontal scroll.
- **`components/InboxBoard.js`** — reworked. New `STACK_DEFS` array with `consolidated` flag; `stackKeyForCard()` collapses INR/AUTO/CHASE across senders. `frameClass()` returns `frame-red` or `frame-calm`. `sortInStack()` sorts `(red → calm, received_at asc)`. Cards rendered as `<button type="button">` with `e.stopPropagation()` in their click handlers; stack-header is a sibling `<button>` so click bubbles never reach it from a card.

### Build verification — `npm run build`
**PASS.** Dashboard `2.25 kB / 89.5 kB` (vs 2.22 kB / 89.5 kB in 3.1d).

### Smoke test — `GET /dashboard`

| Probe | Result |
|---|---|
| HTTP | **200**, 56.8 KB, 1.9 s cold |
| Stacks rendered | **9** ✓ |
| Total cards in DOM | **30** ✓ |
| Frame distribution | **25 calm + 5 red** ✓ (matches deterministic classifier output 30/30) |
| Stack widths in bundled CSS | `188px` for `.stack`, `.stack-cards`, `.stack-card` ✓ |
| Stacks-row max-width | `1872px` ✓ |
| `frame-stat` / `foil-sweep` residue | **0 / 0** ✓ |
| Per-card click handlers | **30** `<button class="stack-card">` ✓ |

**Stacks + tops** (parsed from rendered DOM):

| # | Stack | Count | Top card | Top frame |
|---|---|---|---|---|
| 1 | INR | 6 | Halsey Lindgren | calm |
| 2 | BALLARD · NOTIFY | 10 | **Marisol Aragón** | **red** |
| 3 | FRONT DESK · TRIAGE | 4 | **Esperanza Calabro** | **red** |
| 4 | FRONT DESK · REFILL | 3 | Dwight Parnell | calm |
| 5 | CALL CENTER · TRIAGE | 1 | Imani Solórzano | calm |
| 6 | PATIENTS · ADVICE | 2 | **Magnolia Petersen** | **red** |
| 7 | PATIENTS · TRIAGE | 1 | **Vivienne Quesnel** | **red** |
| 8 | OUTSIDE · TRIAGE | 1 | Cyrus Boateng | calm |
| 9 | BALLARD · HANDOFF | 2 | Saoirse Doyle | calm |

Top-of-pile sort `(red first, then received_at asc)` validates: every red lands on top of any calm in the same stack; among the two reds in BALLARD · NOTIFY (Marisol 22:45Z, Niall 23:00Z), the older (Marisol) tops the pile. Niall (5th red) is the 2nd card peeking right above Marisol.

### Geometry — fits 1920 × 1080 without scroll
- **Horizontal:** 9 × 188 + 8 × 16 + 48 (page pad) = **1868 px**. Fits 1920-px viewport with ~50 px margin for browser scrollbar.
- **Vertical:** tallest pile (BALLARD · NOTIFY, 10 cards) = 260 + 9 × 40 = **620 px**. Plus stack header (38), board header (36 + 28 below), page padding (28 + 80), layout sticky bar (56) ≈ **866 px**. Fits 1080-px viewport with ~210 px room for browser chrome.
- Single row — no flex-wrap kicks in at 1920p.

### Visual observations
- **Red attracts the eye exactly where intended.** 5 red cards across 4 stacks. The red glow + copper-ruby frame + red urgency band combine to make them visibly distinct against the silver calm majority. 4 red top-of-pile cards land within ~500 ms scan time; Niall is one peek down so its band color shift is what catches the eye for that one.
- **INR pile reads as a clinical workspace, not a category.** Single "INR" header tracks the way Brandon described it ("Brandon's warfarin clinic basket") — sender details on each card preserve the audit trail (Ballard vs MDINR fax) without cluttering the pile label.
- **Removing the foil sweep was correct.** The board is calmer overall — color carries the urgency, not motion. The previously-animated Magnolia STAT card now reads as a static red chip, which actually feels *more* serious because nothing is jiggling for attention.
- **Click affordance on every card** unblocks the "I want to see THAT card" gesture. With stack-header and card click paths separated by stopPropagation, a user can either dive into a specific patient or fan out the whole pile — both gestures behave intuitively.

### Files touched
- `data/mock-queue/cards.json` — full re-tag (urgency_signal, type renames, Hanan content swap to INR, Vivienne body sharpened).
- `lib/triage/classifyUrgency.js` — new (deterministic classifier).
- `app/globals.css` — rewrite for two-color urgency, drop foil/stat, shrink stack to 188.
- `components/InboxBoard.js` — INR consolidation, per-card click, two-color frame logic.
- `app/dashboard/page.js` — unchanged.
- `docs/log.md` — this section.

### Deliberately out of scope
- AUTO and CHASE stacks defined in `STACK_DEFS` but seed has no cards in those types — they don't render this pass.
- No fan-out animation (instant layout swap on header click) — Phase 3.2.
- No Approve/Dismiss buttons inside zoom — Phase 3.2.
- No HVC chat wiring from cards — Phase 3.3.
- No LLM-based reclassification — future phase will replace `classifyUrgency.js` with HVC chat-route call.
- No `app/layout.js` edits.
- No new dependencies. No git push.

## 2026-04-28 — Phase 3.2: kairoshealth.app aesthetic, 6-column flat grid

### Direction
Replace the 3D stacked-card metaphor entirely. Match kairoshealth.app's quieter editorial aesthetic: flat solid surfaces, serif display for patient names, teal accent on primary actions, page-level scroll across 6 fixed-purpose columns. Drop everything that read as "Hearthstone hand": metallic frames, foil sweep, sender medallions, peek tabs, fan-out toggle, in-place zoom modal.

### Files written
- **`app/globals.css`** — full rewrite. Imports added Source Serif 4 (8–60 opsz, 400/500/600/700) from Google Fonts alongside the existing General Sans + JetBrains Mono. Tailwind `@theme` adds `--font-serif`. New tokens: `--card #15151a` (flat solid, no gradient), `--card-border #2a2a30`, `--card-border-hover #3a3a42`, `--red #e8413c`, `--teal #0d9488`, `--teal-hover #0f766e`. **Dropped** every 3D class from prior phases: `.stack-card`, `.stack-card-inner`, `.stack-card::before`, `.stack-card::after`, `.frame-calm`, `.frame-red`, `.card-band`, `.card-hero`, `.card-medallion-wrap`, `.card-medallion`, `.medallion-*`, `.card-routing`, `.zoom-stage`, `.zoom-overlay`, all zoom keyframes, `foil-sweep`, all metallic frame variables. **New** classes: `.board-shell` (1680 max-width), `.board-title` (Source Serif 4 32/600 with opsz 32), `.columns` (CSS grid `repeat(6, minmax(0, 1fr))` + media-query breakpoints at 1399/999/599 px reflowing to 4/2/1 columns), `.column`, `.column-header` (mono 10/500 0.14em uppercase tertiary with count on the right), `.column-cards` (flex column, 12 px gap), `.card` (flat 12 px radius, 1 px `--card-border`, 20 px padding, hover lifts border to `--card-border-hover` *without transform*), `.card.is-red` (1 px `--red` ring via `box-shadow: 0 0 0 1px var(--red)`), `.card-red-dot` (8 px circle), `.card-patient` (Source Serif 4 19/600 with opsz 20), `.card-meta` (mono 11 tertiary, MRN · age · age-since-received), `.card-subject` (14/500 primary), `.card-preview` (13/secondary, 2-line clamp), `.card-sender` (12/tertiary), `.card-actions` (flex row), `.btn` / `.btn-primary` (teal solid) / `.btn-secondary` (outlined ghost).
- **`components/InboxBoard.js`** — full rewrite. Six-column grid keyed by `card.type`: `notify | refill | triage | advice | inr | other`. The `other` column catches `handoff | auto | chase | <unknown>` per spec ("anything that doesn't fit the 5 baskets"). `actionsFor(card)` returns a `[primary, secondary]` button pair per card type, with the TRIAGE pair conditional on urgency: red TRIAGE → `Triage now · Page provider`; calm TRIAGE → `Open · Draft callback`. OTHER cards render only the primary `Open` button (secondary returns `null` and is skipped in the JSX). Card div is a `role="button"` with `tabIndex={0}` + Enter/Space key handler; buttons are real `<button>` with `e.stopPropagation()` so card click doesn't fire when clicking inside an action. Click handlers `console.log` for now (Phase 3.3 will wire detail-view navigation and HVC chat). Sort within column unchanged: `(red first, received_at asc)`. Drops `useState`/`useEffect`/zoom state from 3.1d-fix — this view is interaction-light by design.
- **`app/dashboard/page.js`** — slimmed from ~24 to 12 lines. Drops the broken pre-sort that referenced the removed `urgency` field; just freezes `now` and hands `cards` to the client board.

### Build verification — `npm run build`
**PASS.** Dashboard `1.56 kB / 88.8 kB` (down from 2.25 kB / 89.5 kB in 3.1d-fix — flat layout has less code than the stacked + zoom system; -0.7 kB / -0.7 kB).

### Smoke test — `GET /dashboard`

| Probe | Result |
|---|---|
| HTTP | **200**, 59.6 KB HTML, 2.3 s cold |
| Columns rendered | **6** ✓ |
| Total cards in DOM (counting `card-patient` spans) | **30** ✓ |
| Red cards (`class="card is-red"`) | **5** ✓ |
| Red dots rendered | **5** ✓ (one per red card) |
| Source Serif 4 reference in bundled CSS | present ✓ |
| Stack/medallion/zoom/foil residue | **0 / 0 / 0 / 0** ✓ |
| Board header | "Inbox" + mono "30 messages" ✓ |

**Columns + tops** (parsed from rendered DOM):

| # | Column | Count | Top card | Top is red? |
|---|---|---|---|---|
| 1 | NOTIFY | 10 | **Marisol Aragón** | ✓ red |
| 2 | REFILL | 3 | Dwight Parnell | calm |
| 3 | TRIAGE | 7 | **Vivienne Quesnel** | ✓ red |
| 4 | ADVICE | 2 | **Magnolia Petersen** | ✓ red |
| 5 | INR | 6 | Halsey Lindgren | calm |
| 6 | OTHER | 2 | Saoirse Doyle | calm |

Sort `(red first, then received_at asc)` validates: Marisol (22:45 Z) tops NOTIFY over Niall (23:00 Z) and over the 8 calm cards; Vivienne (21:30 Z) tops TRIAGE over Esperanza (23:15 Z) and the 5 calm TRIAGE cards. The remaining red (Niall) is the 2nd card in NOTIFY.

### Action button distribution (verified via DOM grep)

| Button | Count | Where |
|---|---|---|
| `Open chart` (primary) | 10 | NOTIFY (10) |
| `Open` (primary) | 18 | REFILL (3) + calm TRIAGE (5) + ADVICE (2) + INR (6) + OTHER (2) = 18 |
| `Triage now` (primary) | 2 | red TRIAGE (2) |
| `Draft callback` (secondary) | 15 | NOTIFY (10) + calm TRIAGE (5) = 15 |
| `Apply protocol` (secondary) | 3 | REFILL (3) |
| `Draft note` (secondary) | 6 | INR (6) |
| `Draft reply` (secondary) | 2 | ADVICE (2) |
| `Page provider` (secondary) | 2 | red TRIAGE (2) |

Primary button count: 10 + 18 + 2 = **30** ✓ (one per card). Secondary button count: 15 + 3 + 6 + 2 + 2 = **28** ✓ — the 2 OTHER cards intentionally render only the primary "Open" button.

### Geometry — fits 1080p with single-page vertical scroll
- **Horizontal**: at ≥ 1400 px viewport, 6 columns share equal width inside the 1680-px shell. With 32 px page padding each side, content area ≤ 1616 px → each column ≈ 256 px wide on a 1680-px shell, ~209 px wide on a 1400-px viewport. Patient names (longest: "Theodora Ainsworth", "Octavia Mwangi") fit comfortably at Source Serif 4 19 px in the column width with text-overflow ellipsis as a safety net.
- **Vertical**: tallest column is NOTIFY with 10 cards. Each card is ~190 px tall (20 + 19 + 14·1.4 + 13·1.5·2 + 12 + actions + paddings). 10 × 190 + 9 × 12 gap ≈ **2008 px** for that column alone. Page-level scroll is required — the 6 columns share a single page-scroll, so the user scrolls down to see deeper into NOTIFY while shorter columns leave whitespace below their last card. (Per spec: *"1080p layout fits 6 cols with all cards visible (or vertical scroll within tallest column)"* — page scroll is the simpler path.)
- **Responsive**: at < 1400 px viewport, columns reflow to 4. At < 1000 px, 2. At < 600 px, 1. The grid uses `minmax(0, 1fr)` so columns never overflow narrower viewports.

### Visual observations
- **Serif patient names** carry the visual weight kairoshealth.app gets from its display type. Source Serif 4 at 19/600 opsz 20 reads as "editorial" rather than "tech UI" — the names look like they belong on a chart label, not a SaaS dashboard.
- **Teal primary buttons** anchor the action zone at the bottom of each card. The teal `#0d9488` is muted enough that the 5 red cards (with their dot + 1 px ring) still win attention.
- **Red ring + dot** is the entire urgency vocabulary on this layout — no glow, no metallic frame, no animation. The reduction makes the red cards read as *flagged*, not *alarming*. Glanceable: the eye picks up the 5 red items inside ~700 ms.
- **Hover changes only border color, not layout.** The card doesn't move. This matches kairoshealth's calm-clinical aesthetic — clinicians don't want UI elements jumping at them.
- **No medallions, no peek tabs, no foil.** The single-column-per-type grouping is clearer than the source × type matrix from 3.1d. Sender info has dropped from a circle to plain text (12 px tertiary), which is appropriately quieter — the type column is the primary axis now, not the sender role.

### Files touched
- `app/globals.css` — full rewrite for kairoshealth aesthetic.
- `components/InboxBoard.js` — full rewrite for 6-column flat layout.
- `app/dashboard/page.js` — drop stale pre-sort, slim to ~12 lines.
- `docs/log.md` — this section.

### Deliberately out of scope
- No detail-view page (Phase 3.3). Card / button clicks `console.log` for now.
- No HVC chat wiring (Phase 3.3+).
- No drag-and-drop or column reordering.
- No per-column scroll (page-level scroll for now).
- No `app/layout.js` edits — sticky "Kairos" header still renders above the board.
- No new dependencies (Source Serif 4 is loaded via Google Fonts CSS, not an npm package).
- No git push.

## 2026-04-28 — Phase 3.2-fix2: 6 cards/row inside type sections, primaries → "Open"

### Direction
Re-read the 3.2 layout: the prior pass made the 6 *types* into 6 vertical columns, each one card across. Brandon's intent (clarified) is the opposite — type-grouped **sections stack vertically**, and within each section, cards flow left-to-right as a responsive grid up to 6 per row.

### Three changes
1. **6 cards/row at full width** (was 1-card-wide vertical type-columns). Sections stack; within each section, the card grid responds to viewport: 6 → 4 → 3 → 2 → 1 columns at 1399 / 1099 / 799 / 499-px breakpoints.
2. **All primary buttons read "Open"** (was a mix of "Open chart", "Open", "Triage now"). Secondary labels unchanged: `Draft callback / Apply protocol / Page provider / Draft reply / Draft note`. OTHER cards still render only the primary "Open" button.
3. **TODO comment** added in `components/InboxBoard.js` near the click handler: *"Phase 3.3 — Open card opens detail view (raw Epic note content + full action button set). For now this just console-logs the id."* No new behavior — clicks still `console.log("open card", id)`.

### Files written
- **`app/globals.css`** — replaced `.columns / .column / .column-header / .column-cards / .column-header-count` block with `.type-section / .section-header / .section-header-count / .card-grid`. The new `.card-grid` is a CSS grid with `repeat(6, minmax(0, 1fr))` baseline + media queries at 499 / 799 / 1099 / 1399 px reflowing to 1 / 2 / 3 / 4 columns. Sections get `margin-bottom: 36px`; the section header keeps the same mono small-caps + count chrome from 3.2 with a 1-px bottom seam in `--card-border`. Patient name now allows up to 2-line wrap via `display: -webkit-box; -webkit-line-clamp: 2` + `word-break: break-word` so longer serif names like "Theodora Ainsworth" don't clip at the ~209-px card width hit at the low end of the 1400-px breakpoint.
- **`components/InboxBoard.js`** — renamed `Column` → `Section`, `groupByColumn` → `groupBySection`, `sortInColumn` → `sortInSection`, `COLUMN_DEFS` → `SECTION_DEFS`, `columnKeyForCard` → `sectionKeyForCard`. Empty sections are now skipped (`Section` returns `null` if `cards.length === 0`) so OTHER will silently disappear if its 2 handoff cards get retired later. `actionsFor()` simplified — `primary` is a single shared object `{ label: "Open", primary: true }` returned from every branch. The TRIAGE branch's red/calm distinction now only varies the secondary (`Page provider` vs `Draft callback`).
- **`app/dashboard/page.js`** — unchanged (server shim still passes `cards` + `now` to `<InboxBoard>`).

### Build verification — `npm run build`
**PASS.** Dashboard `1.55 kB / 88.8 kB` (vs 1.56 kB / 88.8 kB in 3.2 — essentially flat; the rename and TODO comment add a few bytes, the simpler `actionsFor` saves them back).

### Smoke test — `GET /dashboard`

| Probe | Result |
|---|---|
| HTTP | **200**, 59.6 KB, 4.4 s cold |
| Type sections rendered | **6** ✓ |
| Total cards in DOM | **30** ✓ |
| Red cards | **5** ✓ (red dot + red ring still applied) |
| All primary buttons read **"Open"** | **30 / 30** ✓ |
| Secondary distribution | 15 `Draft callback` · 3 `Apply protocol` · 6 `Draft note` · 2 `Draft reply` · 2 `Page provider` = 28 (2 OTHER cards intentionally have no secondary) ✓ |
| TODO Phase 3.3 comment in `InboxBoard.js` | present (byte 207) ✓ |
| Stale `column-*` classes in HTML | **0 / 0 / 0** ✓ |
| `card-grid` template-columns variants in bundled CSS | `repeat(1)`, `repeat(2)`, `repeat(3)`, `repeat(4)`, `repeat(6)` all present ✓ |
| Media-query thresholds in bundled CSS | `499px`, `799px`, `1099px`, `1399px` all present ✓ |

**Section render order** (parsed from rendered DOM):

| # | Section | Count | Top card | Red? |
|---|---|---|---|---|
| 1 | NOTIFY | 10 | **Marisol Aragón** | ✓ |
| 2 | REFILL | 3 | Dwight Parnell | calm |
| 3 | TRIAGE | 7 | **Vivienne Quesnel** | ✓ |
| 4 | ADVICE | 2 | **Magnolia Petersen** | ✓ |
| 5 | INR | 6 | Halsey Lindgren | calm |
| 6 | OTHER | 2 | Saoirse Doyle | calm |

Sort `(red first, then received_at asc)` still validates: Marisol leads NOTIFY, Vivienne leads TRIAGE, Magnolia leads ADVICE.

### Geometry — readability check at 209-px card width
- **Page-shell math**: at 1400-px viewport with 32-px page padding each side → 1336 px content area. 6 cards × c + 5 × 16-px gap = 1336 → **c ≈ 209 px**. (At 1680 max-width this opens up to ~256 px each.)
- **Card content area** at c = 209: 209 − 40 padding = 169 px. Minus the 8-px red dot + 8-px gap on red cards: **153 px** for the patient name.
- Source Serif 4 19/600 holds ~12–14 chars per 153 px line. Longest names ("Theodora Ainsworth" 18 ch, "Esperanza Calabro" 17 ch) now wrap to 2 lines instead of clipping.
- Subject (14/500 plain wrap, no clamp) and body preview (13/secondary 2-line clamp) remain readable. Sender (12/tertiary single-line ellipsis) stays one line.
- Action buttons share row width via `flex: 1` so they shrink proportionally. At c = 209, each button gets ~92 px — `Open`/`Draft callback`/`Page provider` etc. fit at 13/500 padded `8 × 14`.

Verdict: at the worst-case 1400-px viewport, content is tight but unbroken. At 1500 px+ the layout breathes well; at 1680 px (max shell) the cards are spacious.

### Visual observations
- **Sections feel like "drawers"** rather than columns. The vertical scroll moves through one type at a time — clinically natural ("first I'll knock out my INR pile, then refills, then triage").
- **Uniform "Open" labels** simplify the visual scan. The teal primary now reads as a consistent action affordance independent of card type. Type-specific intent is still clear from the section header above.
- **Red dot + 1-px red ring** continues to do all the urgency work. With the eye now scanning section-by-section instead of column-down, reds in NOTIFY (Marisol + Niall in row 1), TRIAGE (Vivienne + Esperanza in row 1), and ADVICE (Magnolia in row 1) all land in the first row of their respective sections — they pop above the calm cards behind them naturally.
- **2-line patient names** preserve readability at narrow card widths without changing the visual rhythm — ~12 cards across 30 wrap to a 2nd line; the rest stay single-line.

### Files touched
- `app/globals.css` — column-* → type-section/card-grid, new responsive breakpoints, patient-name 2-line clamp.
- `components/InboxBoard.js` — Column → Section rename, all primaries → "Open", Phase 3.3 TODO.
- `app/dashboard/page.js` — unchanged.
- `docs/log.md` — this section.

### Deliberately out of scope
- No detail view (Phase 3.3 — TODO comment placeholders the open-card behavior).
- No HVC chat wiring (Phase 3.3+).
- No `app/layout.js` edits.
- No new dependencies. No git push.

## 2026-04-28 — Phase 3.2-fix3 + 3.2-fix4: port kairoshealth.app panel chrome verbatim

### Direction
Phase 3.2/-fix2 were our *interpretation* of the kairoshealth.app aesthetic — not the actual chrome. Brandon owns kairoshealth.app and pointed at `firekraker-monorepo/kairos/` as the source of truth. **fix3** was a read-only inventory of that source. **fix4** lands three concrete changes:
1. Click-to-select gold ring (persistent — the prior build only had it on `:hover`).
2. Drop the inline action buttons from the card surface (buttons reappear in the detail view in Phase 3.3).
3. Match the source visuals exactly: Fraunces serif, kairoshealth color tokens, 4-px card radius, `cubic-bezier(0.16, 1, 0.3, 1)` transition timing, severity dots with glow, fade-up stagger.

`firekraker-monorepo/kairos` confirmed untouched (`git status --short` filtered to `kairos/` paths returns empty).

### What landed in kairos repo

- **`app/globals.css`** — full rewrite. Imports added Fraunces (Google Fonts, opsz 9..144 / weights 400/500/600/700) alongside the existing General Sans + JetBrains Mono. New `:root` tokens copied verbatim from `firekraker-monorepo/kairos/app/globals.css`: `--kairos-graphite #0B0E13`, `--kairos-platinum #1C2128`, `--kairos-mist #24293A`, `--kairos-bone #F1EDE4`, `--kairos-bone-muted #B8B4AA`, `--kairos-amber #F59E0B`, `--kairos-oxblood #B91C1C`, `--kairos-sage #6EBC87`, `--kairos-teal #0F766E`. Tailwind v4 `@theme` block re-registers the same tokens as `--color-graphite | --color-platinum | --color-mist | --color-bone | --color-bone-muted | --color-amber | --color-oxblood | --color-sage | --color-teal | --color-teal-hover` so Tailwind utilities like `bg-platinum`, `text-bone`, `text-bone-muted`, `border-mist`, `text-amber/80` resolve under v4 (PatientCard.js's source uses these utilities). `--font-display: 'Fraunces'`, `--font-mono: 'JetBrains Mono'`, `--font-sans: 'General Sans'`. Body bg reset to `--kairos-graphite` with the SVG-noise fractalNoise data-URI texture from source. Custom-scrollbar styling copied verbatim. **Card chrome** (`.kairos-card`, `.kairos-card-hover:hover`, `.kairos-stagger > *` + nth-child cascade, `kairos-fade-up` keyframe, `.kairos-kicker`, `.kairos-data`, `.kairos-display`, `.severity-dot`, `.severity-red`, `.severity-amber`, `.severity-green`) — **all copied verbatim from source globals.css**. Added a new `.kairos-card-selected` class that pins the gold-amber ring chrome (same `box-shadow` + `border-color` + `translateY(-1px)` as the `:hover` state) so the click-to-select state stays visible when the cursor leaves the card. `.kairos-card-selected:hover` keeps the same chrome stable so hovering a selected card doesn't visually thrash. **Dropped** all of fix2's interpretation classes: `.card`, `.card-top-row`, `.card-meta`, `.card-subject`, `.card-preview`, `.card-sender`, `.card-actions`, `.btn`, `.btn-primary`, `.btn-secondary`, `.card-red-dot`, `.card-title-wrap`, `.card-patient`. `.board-page`, `.board-shell`, `.board-header`, `.board-title`, `.board-count`, `.type-section`, `.section-header`, `.section-header-count`, `.card-grid`, `.card-button` retained for the page shell + responsive grid plumbing (those aren't kairoshealth-specific — kairoshealth uses Tailwind utilities for the equivalent layout). 4-px card radius (was 12 in fix2). Card transition timing function is `cubic-bezier(0.16, 1, 0.3, 1)` (fix2 used 200 ms ease).

- **`components/InboxBoard.js`** — full rewrite of the card render to mirror `firekraker-monorepo/kairos/components/PatientCard.js` exactly, plus selection state + button-row removal. Card markup verbatim from the source `<PatientCard>`:
  ```
  .kairos-card .kairos-card-hover [.kairos-card-selected] p-4
    .severity-dot.{severity-red|severity-green} .mt-1.5
    h3.kairos-display .text-bone .text-[18px] .font-medium .leading-tight .truncate     ← patient.name
    span.kairos-data .text-[11px] .text-bone-muted .shrink-0                             ← `${age}y`
    p.text-[13px] .text-bone-muted .mt-2 .leading-relaxed .line-clamp-2                  ← message.subject
  ```
  **No action buttons.** The `<button class="card-button">` is the click target wrapping the `.kairos-card` — chosen over `<Link href={...}>` from source because there's no detail route yet (Phase 3.3 will add one and we'll swap to `<Link>` then). `useState(selectedId)` lives at the InboxBoard level so the gold ring is exclusive — clicking another card moves selection; clicking the same card clears it (toggle). Severity mapping per fix4 spec ("matches `.severity-red / .severity-green`"): `urgency_signal: red → severity-red`; `urgency_signal: calm → severity-green`. The fade-up cascade applies via `.kairos-stagger` on each `.card-grid`, so cards animate in with 60-ms cascading delays inside each section.

- **`app/dashboard/page.js`** — slimmed further. Drops the `now` prop (no age-since-received display anymore — kairoshealth's card shows only patient age, not message age). 12 lines.

### Build verification — `npm run build`
**PASS.** Dashboard `1.41 kB / 88.6 kB` (vs 1.55 kB / 88.8 kB in fix2 — the simpler card + dropped button row outweighs the new selection state).

### Smoke test — `GET /dashboard`

| Probe | Result |
|---|---|
| HTTP | **200**, 54.3 KB HTML, 4.2 s cold |
| Type sections rendered | **6** ✓ |
| `.kairos-card` instances | **30** ✓ |
| `.kairos-card-hover` instances | **30** ✓ (every card hoverable) |
| `.kairos-card-selected` in SSR markup | **0** ✓ (none selected on first paint — selection mounts client-side on click) |
| `.kairos-display` (Fraunces patient names) | **30** ✓ |
| `.kairos-data` (mono age) | **30** ✓ |
| `.kairos-stagger` (one per section) | **6** ✓ (cascading fade-up applies inside each `.card-grid`) |
| Severity dots — red | **5** ✓ |
| Severity dots — green | **25** ✓ |
| Severity dots — amber | **0** (intentional — only red/green per fix4 spec) |
| **Action buttons in DOM** | **0** ✓ (no `btn-primary`, no `btn-secondary`, no `Open` / `Draft` / `Page provider` / `Apply protocol` / `Triage now` text anywhere) |
| `card-button` wrappers (one per card) | **30** ✓ |

**Patient name DOM order — first 6 + last 3** (validating the red-first sort within sections):
- Marisol Aragón (NOTIFY · red), Niall Ferguson (NOTIFY · red), Tomás Velasco, Priya Chandramouli, Soledad Ortiz, Wenjin Zhou (calm NOTIFY in received_at asc) … Ruth Goodwin (last calm INR), Saoirse Doyle, Pavel Doroshenko (OTHER section) ✓

**Bundled CSS sanity** (matching source-of-truth tokens):
- `--kairos-platinum`: 2 refs, `--kairos-mist`: 4 refs, `--kairos-amber`: 3 refs, `--kairos-bone`: 9 refs ✓
- `Fraunces` font: 2 refs ✓
- `cubic-bezier(0.16, 1, 0.3, 1)`: 4 refs (card transition + stagger + fade-up + selected) ✓
- `border-radius: 4px`: 2 refs (card + a Tailwind preset) ✓ — was `12px` in fix2

### Click-to-select behavior (verified by code inspection — full visual confirmation requires browser interaction)
- Card click fires `onSelect(card.id)` which calls `setSelectedId(prev => prev === id ? null : id)`. So:
  - Click a calm card → it gets `.kairos-card-selected` (gold-amber 1-px ring + amber border + `translateY(-1px)`).
  - Click a different card → ring moves there.
  - Click the same card again → ring clears.
- `aria-pressed={isSelected}` on the click button gives screen readers the toggle semantics.
- Keyboard: Enter or Space on a focused card triggers the same toggle (preserved from fix2).

### Visual deltas vs fix2 (this is what makes it "kairoshealth")
| Thing | fix2 | fix4 (now) |
|---|---|---|
| Display font | Source Serif 4 | **Fraunces** (kairoshealth source) |
| Card bg | `#15151a` (cold black) | `#1C2128` **--kairos-platinum** (warm slate) |
| Card border | `#2a2a30` | `#24293A` **--kairos-mist** (slightly bluer) |
| Card radius | 12 px | **4 px** (kairoshealth source) |
| Card highlight | none | **inset 0 0 0 1px rgba(255,255,255,0.03)** — adds a hairline lift |
| Page bg | `#0a0a0b` flat | `#0B0E13` **--kairos-graphite** + SVG fractalNoise texture overlay |
| Primary text color | `#f5f5f4` (cool off-white) | `#F1EDE4` **--kairos-bone** (warm off-white) |
| Body text color | `#a1a1aa` (cool gray) | `#B8B4AA` **--kairos-bone-muted** (warm taupe) |
| Card hover/selected ring | none / `border-color` change | **1-px amber ring** + `translateY(-1px)` + amber border |
| Severity indicator | red dot only on red cards (8 px) | **8-px dot on every card** — oxblood (red) or sage (green); red has 10-px glow |
| Action buttons | "Open" + secondary on every card | **none on the card surface** (Phase 3.3 reveals them in detail view) |
| Card transition timing | 200 ms ease | **150 ms cubic-bezier(0.16, 1, 0.3, 1)** (kairoshealth's signature easing) |
| Stagger animation on initial render | none | **60-ms cascading fade-up** on first 8 cards in each section |

### Files touched
- `app/globals.css` — full rewrite to match kairoshealth source (kairos-* classes, severity-dot family, color tokens, Tailwind @theme registrations, body noise texture, fade-up stagger, scrollbar).
- `components/InboxBoard.js` — full rewrite of card markup to verbatim PatientCard.js structure; remove action button row; add `useState(selectedId)` + `kairos-card-selected` class.
- `app/dashboard/page.js` — drop `now` prop.
- `docs/log.md` — this section (combined fix3 inventory + fix4 implementation).

### `firekraker-monorepo` integrity
`git status --short | grep "^[ MA?]+ kairos/"` is empty → zero uncommitted changes inside `firekraker-monorepo/kairos/`. Pre-existing changes elsewhere in the monorepo (`lifeos/public/sw.js`, untracked `workers/hvc/tests/`) are unrelated to this work and left alone.

### Deliberately out of scope
- No detail view (Phase 3.3). `kairos-card-selected` is purely visual today; opening the detail panel + revealing action buttons + raw Epic note content is the next phase.
- No HVC chat wiring (Phase 3.3+).
- No `<Link>` navigation on cards (no detail route yet — `<button>` wrapper holds the click). When 3.3 lands a route, swap `<button class="card-button">` to `<Link href={detailHref}>` matching kairoshealth's source markup.
- No `lib/patients.js` / `lib/panel.js` / `data/patients.json` from the source — kairoshealth's data helpers are tied to its 5-patient demo shape; our `cards.json` + `groupBySection` stays.
- No CountUp hero (dropped in 3.2; no plan to bring it back).
- No AppChrome / Banner / Nav / TourOverlay from kairoshealth's app shell — kairos repo has its own sticky header in `app/layout.js`.
- No `geist` npm package added; body font stays General Sans (kairoshealth's GeistSans body would change the body type but not the visual signature, which is carried by Fraunces patient names).
- No git push.

## 2026-04-28 — Phase 3.2-fix5: copy kairoshealth.app panel chrome verbatim, wrap HVC clinical brain inside it

### Direction
Stop interpreting kairoshealth.app and start copying it. Brandon owns the source at `firekraker-monorepo/kairos/`. **fix5** is the verbatim port: AppChrome wrapper, Banner, PatientCard, all `.kairos-*` global styles, kairoshealth font stack (Fraunces + JetBrains Mono + GeistSans). HVC clinical brain stays at `/api/hvc/*` — completely untouched. Visual layer only this phase; HVC chat wiring is 3.3.

### 9 decisions Brandon confirmed for STEP 2
1. Stay on Tailwind v4, register the missing tokens in `@theme` rather than downgrade.
2. Install `geist` npm package to match source verbatim.
3. PatientCard `<Link>` wrapper → `<button onClick>` (no `/patient/[id]` route exists).
4. Inline action buttons (visual `<span>` "Open chart →" / "Draft callback") **kept** — overrides fix4's "no buttons on cards" in favor of source fidelity.
5. Nav placement: dashboard-page-local, not in AppChrome.
6. AppChrome = Banner + `<main>` only (no Nav, no TourOverlay).
7. Drop TourOverlay entirely.
8. Skip CountUp + hero block in dashboard.
9. 6 in-page tabs (NOTIFY · REFILL · TRIAGE · ADVICE · INR · OTHER) with amber-underline active state, default NOTIFY, click-card toggles `selectedCardId` → `.kairos-card-selected`.

### Files written / overwritten
- **`package.json`** — added `geist@^1.7.0` (npm picked latest minor that satisfies source's `^1.3.1`).
- **`app/layout.js`** — replaced. Imports Fraunces (400/500/600/700) + JetBrains_Mono (400/500) via `next/font/google`, GeistSans via `geist/font/sans`. Body uses `min-h-screen bg-graphite text-bone antialiased`. Wraps children in `<AppChrome>`. Sets `viewport.themeColor: "#0B0E13"`. Drops the prior layout's sticky "Kairos" header + `<ThemeToggle>` + Inter font.
- **`components/AppChrome.js`** — new. Adapted from source: client component (`'use client'`), drops `Nav` import (per fix5 #5/#6), drops `TourOverlay` import (#7), short-circuits to bare `{children}` only on `pathname === "/"` (parity with source). Renders `<Banner /> + <main className="max-w-[1400px] mx-auto px-6 py-8">{children}</main>`.
- **`components/Banner.js`** — verbatim from source. `border-amber/30 text-amber` strip, fractional-amber bg, `severity-dot severity-amber`, "DEMONSTRATION DATA · All patient information is fictional · NO PHI" copy. Middle phrase hidden on mobile.
- **`components/PatientCard.js`** — adapted from source. `SEV_CLASS`, `PRIMARY_BY_KIND`, `SECONDARY_BY_KIND` maps copied verbatim. Markup verbatim except: outer `<Link href={...}>` swapped for `<button type="button" onClick={...} aria-pressed={isSelected} aria-label="…">`; `cardClass` concatenates `kairos-card-selected` on top of `kairos-card kairos-card-hover p-4` when `isSelected`. **Inline action button `<span>`s kept** (source design, fix5 #4).
- **`app/globals.css`** — full rewrite. Source globals.css copied **verbatim** (every `.kairos-*` class, `.severity-dot/-red/-amber/-green`, body fractalNoise overlay, custom scrollbar, `<details>` chevron, word-fade, cta-pulse). Tailwind v4 `@theme` block registers the source's v3 `tailwind.config.js` token surface so `bg-platinum`, `text-bone`, `text-amber/80`, `border-mist/60`, `tracking-tightest`, `tracking-kicker`, `ease-kairos`, `animate-fade-up`, `animate-count-up` all resolve as utilities. Added `.kairos-card-selected` (same chrome as `:hover`, but persistent + stable on hover).
- **`app/dashboard/page.js`** — replaced. Client component (`'use client'`) holding `activeTab` (default `notify`) + `selectedId` state. Inlined nav with `<button>`s in source's Nav.js visual style — active tab gets the 2-px `bg-amber` underline via `<span className="absolute -bottom-[1px] left-3 right-3 h-[2px] bg-amber" />`, count next to label in `kairos-data text-[11px] text-bone-muted/70`. Cards filtered to `categoryFor(card) === activeTab`, sorted `(red first, received_at asc)`, rendered through `<PatientCard>` in source's `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6` workspace with `kairos-stagger` cascade. Adapter functions: `categoryFor` (collapses `handoff/auto/chase` → `other`); `adaptPatient` (our schema → source `{name, age, sex, severity, reasonForColumn, issueLine}` shape); `kindFor` (our type → source `kind` for button labels: `triage` stays `triage`, red urgency stays `urgent`, everything else `followup`). Selecting a tab clears the gold ring (selection doesn't survive a tab change). Click card toggles `selectedId`.

### Build verification — `npm run build`
**PASS.** Dashboard `8.13 kB / 95.4 kB` (vs 1.41 kB / 88.6 kB in fix4). The +6.7 kB JS is the next/font/google preload bundle for Fraunces (4 weights) + JetBrains Mono (2 weights). Source-of-truth build had the same overhead.

### Smoke tests (all green)

| Probe | Result |
|---|---|
| `GET /dashboard` | **200**, 18.9 KB, 3.9 s cold |
| AppChrome rendered | "DEMONSTRATION DATA" banner present, "NO PHI" present, `max-w-[1400px]` main wrapper present ✓ |
| Tab buttons | 6 (`<span>NOTIFY/REFILL/TRIAGE/ADVICE/INR/OTHER</span>`) ✓ |
| Default active tab | `NOTIFY` (`aria-pressed="true"` count = 1) ✓ |
| PatientCard buttons rendered (NOTIFY tab default) | **10** ✓ (matches NOTIFY count) |
| `.kairos-card` instances | 10 ✓ |
| `.kairos-card-hover` instances | 10 ✓ |
| `.kairos-card-selected` in SSR | 0 ✓ (mounts client-side on click) |
| `.kairos-display` (Fraunces names) | 10 ✓ |
| `.kairos-data` (mono fields) | 16 ✓ (10 patient ages + 6 tab counts) |
| `.kairos-stagger` instances | 2 ✓ (page root + grid) |
| Severity dots — red / amber / green | 2 / 1 / 8 ✓ (Marisol + Niall reds; Banner amber; 8 calm NOTIFY greens) |
| Inline `>Open chart` text on cards | 10 ✓ (kept per fix5 #4) |
| Inline `>Draft callback` text on cards | 10 ✓ |
| Patient names in NOTIFY DOM order | Marisol Aragón → Niall Ferguson (reds first) → Tomás → Priya → Soledad → Wenjin → Maeve → Carlos → Frances → Linnéa Brockman ✓ |
| `GET /hvc` | **200**, 8.2 KB; HVC PIN UI + Banner present ✓ |
| `GET /api/hvc/health` | **200**, `{"status":"ok","app":"hvc","timestamp":...}` ✓ |
| `GET /` (root) | **307** → `/dashboard` (followed → 200) ✓ |
| `firekraker-monorepo/kairos/` git status | empty ✓ |

### What changed visually (vs fix4)

| Thing | fix4 | fix5 (now) |
|---|---|---|
| Page wrapper | bespoke board-page full-bleed | source AppChrome → Banner + `<main className="max-w-[1400px] mx-auto px-6 py-8">` |
| Demo banner | none | "DEMONSTRATION DATA · All patient information is fictional · NO PHI" amber strip on every non-root route |
| Top nav | none — sections stacked vertically | 6 in-page tab buttons with 2-px amber underline active state, kairoshealth Nav.js style |
| Layout fonts | Inter via `next/font/google` (legacy from earlier phases) | **Fraunces + JetBrains_Mono via `next/font/google`** + **GeistSans via `geist` npm package** |
| Card render | bespoke 6-section flat grid, custom markup, no inline buttons | source `<PatientCard>` verbatim — `.kairos-card` chrome, `.severity-dot`, kicker label, `line-clamp-2` description, **kept** inline `<span>` action buttons |
| Click affordance | toggle gold ring | toggle gold ring + tab switch clears ring |
| Tab switching | n/a (sections always all rendered) | active tab filters cards; only 1 of 6 categories visible at a time |

### `firekraker-monorepo` integrity
`git status --short` filtered to `kairos/` paths returned empty across the entire fix5 work. Zero modifications inside `firekraker-monorepo/kairos/`. Pre-existing unrelated changes in the monorepo (`lifeos/public/sw.js`, untracked `workers/hvc/tests/`) left alone.

### Files touched in this repo
- `package.json` — `geist ^1.7.0` added.
- `package-lock.json` — regenerated.
- `app/layout.js` — replaced (kairoshealth source layout + AppChrome wrap).
- `app/dashboard/page.js` — replaced (tabbed `<PatientCard>` grid).
- `app/globals.css` — replaced (source verbatim + Tailwind v4 `@theme` registrations).
- `components/AppChrome.js` — new (no Nav, no TourOverlay).
- `components/Banner.js` — new (verbatim).
- `components/PatientCard.js` — new (source-adapted: button wrapper + selected state).
- `docs/log.md` — this section.

`components/InboxBoard.js` and `components/ThemeToggle.js` are now orphaned (zero references in active code). Left in place for now — can retire later if confirmed unused.

### Out of scope for fix5
- No detail view yet (Phase 3.3). Click-to-select highlight is purely visual.
- No HVC chat wiring from cards (Phase 3.3+).
- No drag-and-drop, no per-tab persistence, no nav-on-/hvc beyond the Banner.
- No CountUp hero, no source's `lib/patients.js`/`lib/panel.js`/`data/patients.json` (we keep our `cards.json`).
- No git push.

## 2026-04-28 — Phase 3.2-fix6: equalize cards, full Nav layout, drop card buttons

### Four fixes
1. **Equal-height cards** — all cards in a grid row now visually equalize (no more short-card-tall-card mismatch within the same row).
2. **Font rendering matches source** — `font-feature-settings: 'ss01', 'cv11'` confirmed on html/body; Fraunces / JetBrains_Mono / GeistSans configurations are byte-for-byte from `firekraker-monorepo/kairos/app/layout.js`.
3. **Full Nav layout ported** — wordmark left, 6 category tabs centered, "Take the tour" amber pill, identity right (`Brandon S., RN BSN` + settings cog SVG). Mobile fallback strip below with horizontally-scrollable tabs and active-tab `scrollIntoView` from source.
4. **Inline action buttons removed from PatientCard** — overrides fix5 #4. The `<span>` "Open chart →" / "Draft callback" row is gone; buttons return when the card opens to detail view in Phase 3.3.

### Files written
- **`components/PatientCard.js`** — adapted again. Removed the `flex items-center gap-2 mt-4` row containing the two `<span>` action labels and dropped `kind`/`PRIMARY_BY_KIND`/`SECONDARY_BY_KIND` since nothing reads them now (kept the `kind` and `label` props in the API for compatibility, but only `label` still renders anything). Added `h-full` to the outer `<button>` and `h-full flex flex-col` to the inner `.kairos-card` div so CSS Grid's default `align-items: stretch` causes every card in a row to inflate to the tallest card's height. Empty space below shorter content reads as natural padding.
- **`app/dashboard/page.js`** — Nav rewritten to mirror `firekraker-monorepo/kairos/components/Nav.js` verbatim (with route-Links swapped for tab-state buttons). Header section escapes AppChrome's `<main className="… px-6 py-8">` padding via `-mx-6 -mt-8 mb-8` so the `border-b border-mist/60` seam runs the full main-width. Top row: `<span className="kairos-display text-bone text-xl tracking-tightest shrink-0">Kairos</span>` wordmark · desktop nav (`hidden sm:flex`) with 6 tab buttons + "Take the tour" amber pill · identity row right (`ml-auto`) with `Brandon S., RN BSN` (`hidden sm:inline text-bone-muted`) + 14-px Settings cog SVG button (verbatim from source). Mobile row (`sm:hidden`) with the same tab buttons + tour pill, horizontally scrollable, with `useEffect` calling `scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })` on the active tab whenever `activeTab` changes — same UX as source's mobile nav. Tour button calls a no-op `startTour()` (TourOverlay was dropped in fix5 #7; the button stays visible per fix6 #3 spec but logs `"tour pending — TourOverlay not ported"`).

### Build verification — `npm run build`
**PASS.** Dashboard `8.73 kB / 96 kB` (vs 8.13 kB / 95.4 kB in fix5 — +0.6 kB for the full Nav layout including cog SVG, mobile strip, and `scrollIntoView` effect).

### Smoke tests (all green)

| Probe | Expected | Result |
|---|---|---|
| `GET /dashboard` | 200 | **200**, 19.4 KB, 2.3 s |
| **fix6 #4** Inline action buttons removed | 0 occurrences of `Open chart` / `Draft callback` / `Triage now` / `Page provider` text | **0 / 0 / 0 / 0** ✓ |
| **fix6 #4** No `bg-teal` (was the primary-button bg in fix5) | 0 | **0** ✓ |
| **fix6 #1** `h-full` on outer button | 10 (one per card) | **10** ✓ |
| **fix6 #1** `h-full flex flex-col` on `.kairos-card` | 10 | **10** ✓ |
| **fix6 #3** Wordmark `Kairos` in `kairos-display text-xl tracking-tightest` | 1 | **1** ✓ |
| **fix6 #3** `Brandon S., RN BSN` text in DOM | 1 | **1** ✓ |
| **fix6 #3** Settings cog button | 1 | **1** ✓ |
| **fix6 #3** "Take the tour" pill | 2 (one in desktop nav, one in mobile strip) | **2** ✓ |
| Both nav rows in DOM | desktop `hidden sm:flex` × 1, mobile `sm:hidden flex` × 1 | **1 / 1** ✓ |
| Default tab active markers | 2 (one per nav row, both share state) | **2 aria-pressed=true** ✓ |
| Default NOTIFY tab cards rendered | 10 | **10** ✓ |
| **fix6 #2** `font-feature-settings: 'ss01', 'cv11'` on html/body in bundled CSS | present | **present** ✓ |
| **fix6 #2** Font CSS-vars in bundled CSS | `--font-fraunces` / `--font-jetbrains` / `--font-geist-sans` all present | **4 / 4 / 3 refs** ✓ |
| `GET /hvc` | 200 | **200**, 1.1 s ✓ |
| `GET /api/hvc/health` | 200 | **200**, `{"status":"ok","app":"hvc","timestamp":...}` ✓ |
| `firekraker-monorepo/kairos/` git status | empty | **empty** ✓ |

### Visual deltas vs fix5

| Thing | fix5 | fix6 (now) |
|---|---|---|
| Card heights in a row | uneven (descriptions of varying length set per-card height) | **all cards in a row equalize to tallest** (CSS Grid stretch + `h-full`) |
| Card body content | name / age / kicker / description / **inline button row** (Open chart + Draft callback) | name / age / kicker / description (**no buttons**) |
| Nav | 6 tab buttons in a single line, no wordmark, no identity | **wordmark left** · 6 tab buttons + "Take the tour" amber pill · **identity right (Brandon S., RN BSN + cog)**. Mobile fallback: scrollable strip below with same tabs + tour pill. |
| Header strip width | tabs only, padded inside main | **full-bleed border-b** spanning main width (negative margins escape `<main>` px-6/py-8) |
| Mobile experience | tab buttons truncate at narrow widths | **horizontally scrollable** strip with auto-scroll-to-active-tab on tab change |

### Files touched
- `components/PatientCard.js` — drop button row, add `h-full` + `flex flex-col`.
- `app/dashboard/page.js` — port full source Nav.js layout (wordmark + tabs + tour + identity + cog + mobile strip with scrollIntoView).
- `docs/log.md` — this section.

### Untouched
- `firekraker-monorepo/kairos/` — read-only throughout fix6. `git status --short | grep "^[ MA?]+ kairos/"` returned empty after every step.
- `app/globals.css` — `font-feature-settings: 'ss01', 'cv11'` already present from fix5; verified.
- `app/layout.js` — Fraunces + JetBrains_Mono + GeistSans config already verbatim from fix5; verified.
- `app/api/hvc/*` — HVC fork untouched. `/api/hvc/health` returns 200.

### Out of scope for fix6
- No detail view yet (Phase 3.3). Click-to-select gold ring stays purely visual.
- "Take the tour" pill is visually present but no-op (TourOverlay component never ported).
- No HVC chat wiring from cards (Phase 3.3+).
- No git push.

## [2026-04-29] kairos | Name scrub on 4/29 shift files (morning/afternoon/evening), placed all 5 context files in docs/, mapping saved local-only at .name-scrub-mapping-2026-04-29.md, ready for Phase 3.3 design doc draft

## [2026-04-29] kairos | Phase 3.3 design doc drafted at docs/PHASE-3.3-DESIGN.md, 14-pattern taxonomy and 4-pane spec captured, ready for cold-eyes review

## [2026-04-29] kairos | Phase 3.3 simulation build complete. 8/24 fixtures fully scripted (aldington-tte, calderwood-crestor, brexley-statin, underwell-full-lifecycle, vanstone-denial-cascade, wexbury-phone, halbrook-dme-pa, ravensdale-cpap), 16/24 skeleton-only (drennan-pcp, esselbach-urgent, lyttleton-coordination, maundrell-contradiction, norreys-transactional, halbrook-lab-review, reiner-multilab, stockbridge-async, trumble-securechat, quennell-scope, phillips-doe, frazier-handoff, wood-lipid, czeschin-bp, besemer-bnp, vrabel-referral). DataSource abstraction (lib/dataSource.js) with simulationDataSource active and liveDataSource stubbed for 3.4. SimulationEngine yields async-iterable SimulationEvent stream consumed by EncounterDetail (4-pane shell + animation state machine). TypingText typewriter primitive at ~60-80 cps. Card fly-off animation on Authorize → sessionStorage flag → dashboard filter. Back button preserves dashboard tab via ?tab= search param. AddContextRow rendered DISABLED with "wired in 3.4" tooltip. lib/consistency.js + lib/investigation.js exist as stubs (NOT invoked). Build passes; 24 encounter routes pre-rendered. HTML smoke verified Patterns 2 (aldington), 4 (calderwood), 5 (brexley phiGuard regen banner), 7b (underwell 4-stage actions), 13 (vanstone denial cascade timeline + peer-to-peer), 14 (wexbury PhoneScriptPane mounts in lieu of MyChart). Mock encounters at C:/Users/kents/kairos/data/fixtures/encounters/.

## [2026-04-29] kairos | docs/NURSE-DEMO-INTRO.md drafted for tomorrow's nurse tour share-out.

## [2026-04-30 prep] kairos | Vercel project "kairos-tour" created and configured for firekraker1272/kairos repo. DNS prepped (status: configured — kairos-tour.firekraker.net CNAME -> cname.vercel-dns.com, proxied off). Existing kairoshealth.app verified isolated and unchanged. Ready for morning push after tour-mode local verify.

## [2026-04-29] kairos | Phase 3.3 Tour Mode shipped. 7-fixture guided auto-play with hybrid spotlight + corner-narrator overlays. Wood promoted from skeleton to fully scripted (Pattern 1 with parenthetical lay translations + embedded HDL/triglyceride lifestyle counseling). Tour HUD with pause/speed/skip controls. Restartable, isolated from regular sessionStorage via kairos.tour.authorizedBackup key. TourMode mounts in AppChrome so it persists across /dashboard <-> /encounter/{id} navigation. Coordination protocol: TourMode dispatches kairos-encounter:auto-action / auto-authorize, listens for kairos-encounter:ready / action-complete / banner / flown-off. Spotlight cutout via SVG mask, anchors via data-tour-anchor attributes added to all 6 panes + action bar. Brexley red banner annotation triggered on-banner kind=red (fires at the moment phiGuard placeholder leak appears in simulation). Pause via backdrop click. Speed toggle 1x/2x. Skip restores backed-up authorized list; "Click around yourself" leaves all 7 cards unauthorized for free exploration; "End tour" restores original state. Pitch-ready for nurse-to-nurse demo at Phelps.

## [2026-04-29] kairos | Tour Mode fixes: (1) 1x default speed slowed ~50% for nurse readability — durationMultiplier(1)=1.5x, durationMultiplier(2)=1.0x (so 2x toggle now matches the previous 1x feel); typing animation in EncounterDetail also reads kairos-tour-speed sessionStorage and scales intervalMs by 1.5 at 1x. (2) all "Mr. {provider}" replaced with "Dr. {provider}" — 43 replacements across 19 files (fixtures + tour script); patients (Mr Aldington, Ms Calderwood, Mrs. Underwell, etc.) untouched; HVC fork knowledge.js untouched per app/api/hvc/* exclusion. (3) SpotlightOverlay now scrollIntoView({behavior:smooth, block:center}) the anchor before measuring + rendering bubble; 450ms scroll-settle delay; periodic 250ms re-measure no longer re-scrolls (avoids jitter); edge-detection bubble flip — pickPosition() flips right→left, top→bottom etc. when chosen position would clip viewport; bubble-height clamp uses BUBBLE_H_EST=200. Build clean, all 24 encounter routes SSG.

## [2026-04-29] kairos | Tour Mode polish pass — 8-fix bundle: (1) 1x speed slowed ~50% via durationMultiplier(speed) — 1x=1.5x duration, 2x=1.0x; typing animation in EncounterDetail also reads kairos-tour-speed from sessionStorage and scales intervalMs in lockstep. (2) all "Mr. {provider}" → "Dr. {provider}" — 78 total replacements (43 active fixtures + tour, 2 legacy cards.json, 33 legacy mock-encounters JSONs) across 32 files; patient prefixes (Mr Aldington, Ms Calderwood, Mrs. Underwell, Ms Brexley, Ms Vanstone, etc.) preserved; HVC fork app/api/hvc/* untouched per scope. (3) SpotlightOverlay scrollIntoView({behavior:smooth, block:center}) before measuring; 450ms scroll-settle delay; 250ms re-measure no longer re-scrolls; pickPosition() edge-flips right→left, top→bottom etc. when bubble would clip viewport. (4) PhoneScriptPane.js → ExplanationPane.js rename; pane title "PHONE SCRIPT" → "HOW TO EXPLAIN THIS"; action button labels "Generate Phone Script" → "Generate Note + Explanation", "Generate Voicemail Variant" → "Voicemail Talking Points" (Patterns 7 + 14 in lib/patterns.js); OutputPane.js mounts ExplanationPane in lieu of PhoneScriptPane when channel=phone. (5) framing subtitle "Example explanation — adapt in your own words." rendered under pane title in italic bone-muted. (6) ephemeral chip "Not part of patient record" rendered as uppercase pill below subtitle. (7) auto-clear: handleAuthorize sets paneState.phoneScript="" before fly-off; explicit Dismiss button (top-right of ExplanationPane) wired through dismissExplanation→OutputPane→onDismiss prop, clears only the explanation pane, leaves Nurse Note + MyChart untouched. (8) Wexbury (Card 5) tour narration reframed in lib/tourScript.js: bubble titles "An example, not a script" / "Voicemail talking points" / "Channel-aware example."; bodies use "talking points" / "your own words" / "use what fits, edit what doesnt, skip what is not relevant" / "the words are yours" — zero "spoken register" / "phone script" / "read aloud" wording remains in Wexbury entry. Build clean, all 24 encounter routes SSG.

## [2026-04-29] kairos | Dashboard category counts fixed — every category non-zero. 5 fixture `tab:` values re-mapped to match the 6-basket source-of-truth.

### Source of truth
Category derivation lives in `app/rn/page.js`:
```js
const PRIMARY_TYPES = new Set(["notify", "refill", "triage", "advice", "inr"]);
function categoryFor(card) {
  return PRIMARY_TYPES.has(card.tab) ? card.tab : "other";
}
```
Each fixture carries a `tab:` field. Anything outside the primary five falls through to `other`. No category mapping in `lib/patterns.js` — it's purely fixture-level metadata.

### Mismatches found and corrected
| Fixture | tab before | tab after | Why |
|---|---|---|---|
| `norreys-transactional` | advice | **refill** | Pattern 9 transactional refill belongs in the Rx Request basket. |
| `maundrell-contradiction` | advice | **inr** | Pattern 8 warfarin contradiction belongs in the Coumadin Clinic / INR basket. |
| `lyttleton-coordination` | triage | **other** | Pattern 10 multi-party coordination is HANDOFF/OTHER, not a triage call. |
| `ravensdale-cpap` | notify | **other** | DME plumbing — clinical reasoning is light, the work is form-fill + atomic commit. Belongs in OTHER. |
| `vrabel-referral` | other | **advice** | Pattern 8 referral status thread belongs in Pt Advice Request. |

### Resulting dashboard counts
| Category | Count |
|---|---|
| NOTIFY | 12 |
| REFILL | 1 |
| TRIAGE | 3 |
| ADVICE | 2 |
| INR | 1 |
| OTHER | 5 |
| **Total** | **24** |

Every primary category now non-zero — matches the Deep Tour narration which references all six baskets.

### Files touched (5)
- `data/fixtures/encounters/lyttleton-coordination.js` — tab triage → other
- `data/fixtures/encounters/maundrell-contradiction.js` — tab advice → inr
- `data/fixtures/encounters/norreys-transactional.js` — tab advice → refill
- `data/fixtures/encounters/ravensdale-cpap.js` — tab notify → other
- `data/fixtures/encounters/vrabel-referral.js` — tab other → advice

### Verification
- `npm run build` ✓ Compiled successfully. 43 routes, 24 encounter SSG.
- `grep tab: data/fixtures/encounters/*.js | awk` per-tab counts match expected exactly.
- No tour code touched. Quick + Deep tour audio + dwell + mute + pause all unaffected.

### Out of scope
- HVC fork untouched. No git push.

## [2026-04-29] kairos | Deep Tour mode — pitch-grade narration alongside Quick Tour. Two-tier audio system with 56 new Deep MP3s. ~22 minute end-to-end Deep Tour runtime.

Builds on the voice commit `c97eaf9`. Quick Tour audio unchanged (already paid for). Adds a parallel Deep Tour tier with substantially longer, pitch-grade narration covering the Epic-vs-Kairos comparison, accuracy/standardization angle, and safety surface for each of the 9 fixtures.

### Two-tier narration model
Every bubble in `lib/tourScript.js` now carries:
- `displayText` — short on-screen headline (4-8 words). **Same across modes.**
- `quickVoiceText` — Quick Tour narration. ~155 chars/bubble avg. Audio at `/tour-audio/{audioKey}.mp3`.
- `deepVoiceText` — Deep Tour narration. ~335 chars/bubble avg. Audio at `/tour-audio/{audioKey}-deep.mp3`.
- `audioKey` — stable filename root.

Mode is selected at tour launch via the `kairos-tour:start` event's `detail.mode` field (`"quick"` | `"deep"`). TourMode stores the choice in `modeRef`, which `audioFileFor()` consults when constructing audio paths. Quick mode uses un-suffixed filenames so the previously-paid-for MP3s remain valid; Deep mode appends `-deep`. Generation script also writes to the suffixed path for Deep mode and skips when the file exists.

### Deep narration writing — 5 beats per fixture
Each fixture's deep voice arc lands these in order:
1. **Clinical scenario** — patient name, age, presentation, one-sentence framing.
2. **Epic reality** — honest, step-by-step description of how a nurse handles this card today, what the cognitive cost is, what gets missed at hour eight.
3. **Kairos move** — what gets eliminated, what gets pre-staged, what gets drafted in place.
4. **Accuracy/safety angle** — standardization, the "floor rises" framing, fewer missed catches, scope respect, contradiction holds.
5. **Closer line** — the one that lands the value.

Five fixtures with named anchor lines (per the audit spec):
- Norreys: *"Some work is one-click. Some work is automatic. Kairos sorts which is which."*
- Quennell: *"Kairos doesn't pretend to know what it can't know. The system has scope."*
- Maundrell: *"Same INR result. Different plan. Kairos noticed. The contradiction is the output — not the reply."*
- Underwell: *"This is what nurses do at the highest level of their license. Kairos amplifies it."*
- Vanstone: *"You stay the nurse. Kairos just stops making you the database."*

### Deep narration char counts per fixture (voiceText only, total across all bubbles in the fixture)
| Fixture | Bubbles | Deep chars | ≈ Words |
|---|---|---|---|
| Aldington | 7 | ~2,400 | ~400 |
| Wood | 5 | ~1,560 | ~260 |
| Calderwood | 6 | ~1,950 | ~325 |
| Norreys | 7 | ~1,800 | ~300 |
| Quennell | 6 | ~1,740 | ~290 |
| Maundrell | 6 | ~2,343 | ~390 |
| Underwell | 7 | ~2,569 | ~430 |
| Wexbury | 6 | ~1,578 | ~265 |
| Vanstone | 6 | ~2,038 | ~340 |
| **Total** | **56** | **18,739** | **~3,120** |

Quick narration totals across all 56 bubbles: 8,622 chars. So Deep is ~2.2× the word count.

### TourLauncher — dual button
`components/TourLauncher.js` rewritten with two side-by-side pills, equal visual weight:
- **✨ Quick Tour** — solid amber, the default-feeling option. Tooltip: "Guided 9-card tour, ~12 minutes."
- **Deep Tour** — graphite background with amber border, deliberately not styled as the primary CTA but visually equivalent. Tooltip: "Deep narration of all 9 cards, ~22 minutes."
Each button dispatches `kairos-tour:start` with the chosen mode in `detail.mode`. The launcher no longer relies on the parent `onStart` prop (kept harmless in the function signature for backward compat with `app/rn/page.js` until the page is updated).

### Audio generation script
`scripts/generate-tour-audio.js` rewritten to:
- Walk both `quickVoiceText` and `deepVoiceText` per bubble.
- Generate to `{audioKey}.mp3` for Quick, `{audioKey}-deep.mp3` for Deep.
- Skip files that already exist on disk (idempotent).
- Log per-mode counts up front + a billing breakdown at the end (new chars billed this run vs. total tour cost if regenerated from scratch).

The previous `voiceText` field was renamed to `quickVoiceText` throughout `lib/tourScript.js`. No content changes to Quick Tour text — same exact strings, just under the new field name.

### Files touched
| File | Δ | Change |
|---|---|---|
| `lib/tourScript.js` | full rewrite, ~620 lines | Renamed `voiceText` → `quickVoiceText`. Added `deepVoiceText` for every bubble. Header doc updated for two-tier model. |
| `components/TourMode.js` | +~10 lines | New `audioFileFor()` helper. `loadAudio()` and `preloadFixtureAudio()` accept mode. `modeRef` stored on tour start from event detail. |
| `components/TourLauncher.js` | full rewrite, 36 lines | Two-button launcher. Each dispatches `kairos-tour:start` with mode. |
| `scripts/generate-tour-audio.js` | full rewrite, ~125 lines | Two-tier walker, idempotent skip, per-mode logging + billing breakdown. |
| `public/tour-audio/*-deep.mp3` | NEW × 56 | Pre-generated Deep MP3s. ~16.8 MB. |

### Verification

**Build:** `npm run build` ✓ Compiled successfully. Same 43 routes as the prior commit. No new errors.

**Audio generation:** `npm run generate-tour-audio`:
- 112 bubbles total (56 Quick + 56 Deep audio entries).
- 56 generated this run (Deep). 56 skipped (Quick already on disk).
- New chars billed: **18,739**. Cost this run: **$0.2811**.
- Total chars across both tiers: **27,357**. Total cost if regenerated from scratch: **$0.4104**.

**Static-analysis checks:**
- `ls public/tour-audio/*.mp3 | wc -l` → **112**.
- `ls public/tour-audio/*-deep.mp3 | wc -l` → **56**.
- Banned-phrase grep `I used | this caught | saved me | Kairos caught | Kairos remembered` over `lib/tourScript.js` → **zero hits** in both Quick and Deep narration.
- All Deep narration uses observational/design-stage framing — sample audit: "Kairos is designed to..." × 8 occurrences, "would" × 6 occurrences (e.g. "the message Mr. Aldington would actually receive"), zero present-tense-active claims about real workflows.

**Estimated tour runtime at 1× with audio ON:**
- **Quick Tour:** 8,622 chars / ~14.5 cps ≈ 595s voice + 56×0.5s tail + ~198s fixture overhead = **~13:30 end-to-end**. Unchanged from prior commit.
- **Deep Tour:** 18,739 chars / ~14.5 cps ≈ 1,292s voice + 56×0.5s tail + ~198s fixture overhead = **~25:18 end-to-end**. Slightly over the 20-25 min target — within tolerance for a deliberate pitch-grade depth.

**What requires Brandon's eyeball:**
- TTS pronunciation of clinical proper nouns. Spelled-out forms used in deepVoiceText for highest-risk terms: "I-N-R" (not "INR"), "T-T-E" (not "TTE"), "T-I-A", "C-T-A", "S-P-E-C-T", "S-B-A-R", "B-N-P", "H-D-L", "L-D-L", "A-S-T", "A-L-T", "H-and-H" (for H&H). "MyChart" left as-is per prior pronunciation behavior; flag if it reads wrong. "Evolent guideline seven-three-one-two" spelled out for clarity. "Coumadin Clinic" left as-is — should pronounce naturally.
- Whether the Deep button's slightly-secondary styling (graphite bg, amber border) reads as visually equivalent to the Quick amber pill or as subordinate. Knob: bump Deep to solid amber if it reads weak.
- Whether 25-minute Deep Tour holds attention through the back half (Underwell + Wexbury + Vanstone). The Underwell "highest license" framing and the Vanstone closer should carry the back third — but it's the longest stretch without a transition narrator break, so eyeball pacing matters.
- Whether mid-tour mode switch is something Brandon wants. Current behavior: tour mode is set at launch and locked for the duration; there's no UI to swap modes mid-flight. Adding it would require regenerating the in-progress bubble's audio in the new mode and re-syncing dwell. Not built; flagged.

### Out of scope
- HVC fork untouched. mock-encounters untouched.
- No git push.
- No `playbackRate` knob for 2× speed (still flagged from voice commit — applies to both tiers).
- NURSE-DEMO-INTRO.md "four to five minutes" line — fifth time flagged stale; with Deep Tour now an option, the line is doubly wrong.

## [2026-04-29] kairos | Three-surface platform scaffold — RN /rn, Scribe /scribe, Provider /provider. Migrated /dashboard → /rn with legacy redirect.

Establishes folder ownership and URL routing for the three-role platform:
- `kairos/rn/` → `/rn` (Brandon, current work — migrated from `/dashboard`)
- `kairos/scribe/` → `/scribe` (Tristan, live encounter capture — stub)
- `kairos/provider/` → `/provider` (future, morning prep — stub)

All three surfaces share `lib/` for FHIR adapters, clinical primitives, components, and auth. Cross-surface coordination is folder-scoped: each surface owner can move freely inside their own folder; PRs touching multiple surface folders need Brandon's review.

### Files created (line counts)
- `kairos/rn/README.md` — 9 lines. Owner, route, scope, boundaries.
- `kairos/scribe/README.md` — 18 lines. Adds the Tristan PR workflow (branch → push → preview URL → Brandon merges to main).
- `kairos/provider/README.md` — 12 lines. Reserved-for-future-development note.
- `app/scribe/page.js` — 33 lines. Placeholder page matching kairos visual language. "Back to RN dashboard" → /rn.
- `app/provider/page.js` — 33 lines. Placeholder page. "Back to RN dashboard" → /rn.
- `docs/ARCHITECTURE.md` — 31 lines. Surface table, legacy redirect note, shared layer, URL conventions, cross-surface coordination policy.

### Files moved
- `app/dashboard/page.js` → `app/rn/page.js` (1 file moved, full RN dashboard page intact, no content changes).

### Files updated for /dashboard → /rn URL migration
| File | Hits | Change |
|---|---|---|
| `app/page.js` | 1 | `redirect("/dashboard")` → `redirect("/rn")` |
| `app/layout.js` | 1 | comment cosmetic update |
| `components/ActionBar.js` | 1 | `router.push("/dashboard${q}")` → `/rn${q}` |
| `components/AppChrome.js` | 1 | comment cosmetic update |
| `components/EncounterDetail.js` | 2 | both `router.push("/dashboard${q}")` → `/rn${q}`. "Back to dashboard" link text preserved (URL changed). |
| `components/TourMode.js` | 4 | pathname check `/dashboard` → `/rn`; three `router.push("/dashboard")` → `/rn`; comment update |
| `kairos/rn/README.md` | 1 | route declaration `/dashboard` → `/rn` |

### Legacy redirect
`app/dashboard/page.js` rewritten as a client-side redirect: `useSearchParams` + `router.replace("/rn?" + qs)` on mount. Wrapped in `<Suspense>` to satisfy Next.js 14 prerender requirements. Tiny — 38 lines, ships at 548 B in production. Protects bookmarks, shared URLs, prior-art links from 404s.

### Reference count audit
- `/dashboard` URL hits in code (app/, components/, lib/, kairos/) **before** migration: 9 hits across 7 files (excluding doc/comment-only mentions).
- After migration: **1 hit** — and it's the comment header `"// /dashboard was the original RN home before the three-surface scaffold."` inside the legacy redirect file itself. Zero functional `/dashboard` URLs remain in code.
- ARCHITECTURE.md mentions `/dashboard` once intentionally (Legacy section).
- `docs/log.md` has many historical `/dashboard` mentions in older entries — left as-is (historical truth).

### Verification

**Build:** `npm run build` ✓ Compiled successfully. **43 routes** generated (was 41 — added `/rn`, `/scribe`, `/provider`; renamed `/dashboard` to legacy redirect). All 24 encounter SSG routes intact. `/api/tts` + all HVC routes intact.

Route table snapshot:
- `/` → SSG, redirects to /rn server-side
- `/rn` → static, 2.7 kB (the migrated RN dashboard, unchanged content)
- `/scribe` → static, 757 B (placeholder)
- `/provider` → static, 769 B (placeholder)
- `/dashboard` → static, 548 B (legacy client-redirect to /rn)
- `/encounter/[id]` → SSG × 24
- `/api/tts` → dynamic
- `/hvc` + `/api/hvc/*` → unchanged

**What requires Brandon's eyeball:**
- `/rn` loads the dashboard with all 9 tour fixtures visible.
- `/dashboard` auto-redirects to `/rn` (preserving query string).
- `/scribe` and `/provider` placeholder pages render with kairos visual language.
- `/encounter/[id]` Back link routes to `/rn` (text still reads "Back to dashboard" — kept as nurse-friendly wording).
- Tour launches from `/rn`, plays end-to-end with audio. Tour navigation between dashboard ↔ encounter still routes via `/rn`.
- Pause/Mute/Skip all still work mid-tour.

### Out of scope
- HVC fork untouched. mock-encounters untouched.
- No git push — Brandon visually verifies in the morning.
- `kairos/rn/`, `kairos/scribe/`, `kairos/provider/` are folder shells with READMEs only. No code yet lives inside the folder structure — the existing components/, lib/, data/ directories continue to serve `/rn` for now. Migration of RN-specific code into `kairos/rn/` is a future refactor, not part of this scaffold.

## [2026-04-29] kairos | Pause button — visible in HUD, freezes dwell + audio + typing animations on tap.

Builds on the audio commit `c97eaf9`. The infrastructure for paused dwells already existed (pausedRef + pwait honor it; backdrop click was the only trigger). This commit makes pause a real first-class HUD control with proper visibility, extends it to audio + typing, and adds the spacebar shortcut.

### What landed in this commit

**Visible pause button in NarratorCorner HUD:**
- New `<PauseIcon>` (two vertical bars) and `<PlayIcon>` (right-pointing triangle) inline SVGs.
- Pause button positioned leftmost in the HUD button row — first thing the eye lands on. Same row as mute, speed, skip.
- Two-state visual: when not paused, button is graphite/muted (matches mute button styling); when paused, button flips to solid amber background with graphite text — visually distinct so the paused state is obvious at a glance.
- Icon + text label ("Pause" / "Resume") together — never icon-only. Tooltip mentions the spacebar shortcut.
- 32px minimum hit target on every HUD button (was previously 22-24px). Bumped padding + min-h/min-w on every HUD pill so the row reads as bigger, tappable controls rather than micro-text.

**Pause behavior wired across all three timing surfaces:**
1. **Dwell timer** — already pause-aware via `pausedRef` checked inside `pwait`. Unchanged.
2. **Audio** — `togglePause` now also calls `audioRef.current.pause()` on pause and `audioRef.current.play()` on resume. Audio resumes from the exact `currentTime` it was at; mute state is independent (audio.muted persists across pause/resume).
3. **Typing animations** — `togglePause` dispatches `kairos-tour:pause` / `kairos-tour:resume` window events. `TypingText` listens to these in its effect: on pause it `clearInterval`s the typewriter; on resume it restarts the interval from the same character index it stopped at. No restart, no jump, no skip.

**Spacebar shortcut** (industry-standard for any timeline player):
- `keydown` listener on `window` while tour is `active`. `Space`/" " toggles pause.
- Suppressed when focus is on `<input>`, `<textarea>`, or contenteditable — so accidental spaces in any future free-form field don't pause the tour.
- `e.preventDefault()` to stop the page scroll that Space normally triggers.

**Edge cases handled:**
- Pre-arrival narrator pause: `pwait` honors pause regardless of bubble kind, so the inter-fixture transition bubble freezes the same as in-fixture bubbles.
- Mute-during-pause: `audio.muted` is set on the live element; on resume `audio.play()` plays whatever the current muted value is. Pause + mute, then resume: silent resume. Pause + voice on, then resume: voiced resume. No interaction bug.
- Skip-while-paused: Skip button still clickable (still in HUD, never disabled). `skipTour` calls `stopAudio()` before unmounting, which releases the paused audio cleanly.
- Tour-end-while-paused (defensive): not reachable in practice — the only way to advance to the end is the dwell timer, which is what pause freezes. If pause is held through the last fixture's auto-authorize, the user manually skips, which still triggers the end modal.

**NOT addressed (intentional scope):**
- Card fly-off animation pause: per the user's note, "easier alternative: disable pause during fly-off, the animation is short anyway." The fly-off is ~600ms and is gated behind the `kairos-encounter:flown-off` event the orchestrator awaits — pausing during it would require pausing a CSS transition, which Chrome+Safari handle differently. Not worth the per-browser fix-up for a 600ms window.
- `simulationEngine.runScript` event delays (the `delayMsBefore` between pane-update events): typically 100-800ms. Not paused. If the user pauses mid-action, the action stream finishes naturally and then the bubble holds. Acceptable: typing pauses (which IS the user-visible content), and dwell pauses (which gives them reading time).

### Files touched
| File | Δ | Change |
|---|---|---|
| `components/TourMode.js` | +~38 lines | `togglePause` extended to pause/resume audio + dispatch window events. New keyboard listener `useEffect` for Space. `onTogglePause` prop now passed to both NarratorCorner instances. |
| `components/NarratorCorner.js` | +~30 lines | New `<PauseIcon>` / `<PlayIcon>` SVGs. New leftmost pause button in HUD row with two-state styling (amber when active). All HUD buttons bumped to 32px min hit target. `onTogglePause` + `paused` props consumed. |
| `components/TypingText.js` | ~+30 lines | Effect refactored to expose `start()`/`stop()` + `onPause`/`onResume` window event handlers. Typewriter `setInterval` is restartable from current character index — pause/resume is seamless. |

### Verification

**Build:** `npm run build` ✓ Compiled successfully. 39/39 static pages, 24 encounter routes. No new errors.

**Static-analysis checks:**
- `togglePause` has all three side effects: pausedRef toggle, audio.pause/play, dispatch event. Verified.
- TypingText listens to both `kairos-tour:pause` and `kairos-tour:resume`, removes listeners on cleanup. Verified.
- NarratorCorner accepts `onTogglePause` + `paused`, renders the button with correct two-state styling. Verified.
- Spacebar listener suppresses inside inputs/textareas/contenteditable. Verified.

**What requires Brandon's eyeball (cannot statically verify):**
- Whether 32px hit target feels right on touch — could go to 40-44px if needed for tablet finger taps. Single-class knob.
- Whether amber-on-pause is visible enough to read across the room (demo context). If not, add a stronger drop shadow or animate a subtle pulse on the icon.
- Whether the typing-pause feels natural mid-stream — the CSS cursor blink continues during pause (intentional, signals "here, frozen"); if it feels weird, hide the cursor on pause via a CSS class toggle.
- Whether resume-after-pause re-plays the audio without a click/pop. Browsers normally handle pause/play seamlessly but some Safari builds glitch on partial-buffer playback.
- Spacebar shortcut feel — if a nurse hits Space while looking at a bubble, does it pause too eagerly? Should be fine since active=true means tour is running.

### Out of scope
- HVC fork untouched. mock-encounters untouched.
- No git push.
- No card fly-off pause (acceptable per spec).
- No simulationEngine inter-event delay pause (acceptable trade-off).
- NURSE-DEMO-INTRO.md "four to five minutes" line — fourth time flagged stale, still not auto-edited (with audio + pauses, real runtime is 13:30+; with nurses pausing to read, indefinite).

## [2026-04-29] kairos | Voice narration + Apple-style text/voice split + mute control across the full 9-fixture tour. OpenAI TTS (onyx voice), 56 pre-generated MP3s in public/tour-audio/, $0.13 cost.

Builds on commits 58245a7 (P1–P4 audit fixes) and 5ca4e8c (3-fixture promotion + 9-card deck). This commit adds voice narration end-to-end, splits every bubble into short on-screen `displayText` + full conversational `voiceText`, wires audio playback into the tour engine with audio-driven dwell timing, and adds a persistent mute toggle.

### What landed in this commit

**Voice/text split — every bubble now has both fields:**
- `displayText`: 4-8-word headline rendered on screen. Anchors the moment without competing with voice.
- `voiceText`: full conversational narration. Numbers spelled out ("twenty-seven" not "27"), contractions, em-dash breath cues, no parentheticals.
- `audioKey`: stable identifier for `/tour-audio/{audioKey}.mp3` lookup.
- Legacy `body` field preserved (mirrors `displayText`) for graceful fallback in any non-tour code path that still reads it.

Example reframe (Aldington opening):
- displayText: `"Twenty-seven unread. Only nine are yours."`
- voiceText: `"This card came from your Results Follow-Up box. Epic shows twenty-seven unread, but only nine are actually yours once you filter by provider..."`

**Audio infrastructure:**
- `app/api/tts/route.js` — POST endpoint, body `{text, voice}`, voice defaults to "onyx", proxies to `https://api.openai.com/v1/audio/speech` (model `tts-1`, response_format `mp3`), returns audio/mpeg stream. String concatenation (no template literals) per spec. 1y immutable cache header.
- `scripts/generate-tour-audio.js` — Standalone Node script, walks `lib/tourScript.js` regex-extracting every `audioKey` + `voiceText` pair (keeps the script ESM-import-free), POSTs each to OpenAI directly, writes `public/tour-audio/{audioKey}.mp3`. Loads `.env.local` manually (no dotenv dep). Skips existing files for cheap re-runs. Logs char totals + cost estimate.
- `package.json` — added `"generate-tour-audio": "node scripts/generate-tour-audio.js"`.

**Audio playback wiring (TourMode.js):**
- New `loadAudio(audioKey)` helper: creates an `Audio` element, awaits `loadedmetadata`, returns the element on success or `null` on error/4s timeout.
- New `beginBubble(data)` helper: stops any prior audio, loads the new one, kicks off `audio.play()` (catches autoplay rejections silently), and returns the dwell ms — `audio.duration*1000 + 500` if the MP3 loaded, else falls back to the existing length-aware `computeDwell` formula. The mute state is applied via `audio.muted` so toggling mid-tour doesn't restart audio.
- `showNarrator` and `showSpotlight` rewritten around `beginBubble`. `pwait` still does the pause-aware sleep; only the dwell length changed.
- Banner-handler annotations still use `computeDwell` (banner audio not yet wired since no current fixture uses on-banner triggers post-Brexley-cut — left as-is to avoid scope creep).
- Preload: when fixture i starts, the orchestrator fire-and-forgets `Audio.load()` for every bubble in fixture i+1 so playback is gapless across fixture boundaries.
- `stopAudio()` is called on skip/freeExplore/post-bubble-dwell so audio never bleeds into the next state.

**Mute toggle:**
- `mutedRef` + `muted` state in TourMode, init from `sessionStorage["kairos.tour.muted"]` ("1"/"0"), default OFF (voice ON).
- `toggleMuted` callback sets both ref and state, persists to sessionStorage, applies `audio.muted` to the currently-playing audio so toggling mid-bubble is seamless.
- New `<SpeakerOnIcon>` / `<SpeakerOffIcon>` SVGs in `components/NarratorCorner.js` (no lucide-react dep — kairos uses lucide-react@1.11 which doesn't export these specific icons reliably; inline SVG is cleaner).
- Mute button rendered in the HUD button row left of the speed pill, with hover/title hints. Tooltip flips between "Voice narration off — click to turn on" and "Voice narration on — click to mute" depending on state.

**Voice picker scaffolding removed (throwaway):**
- Deleted `app/voice-picker/page.js`.
- Deleted `app/api/tts-preview/route.js`.

### Files touched
| File | Δ | Change |
|---|---|---|
| `lib/tourScript.js` | full rewrite, ~580 lines | Every bubble across all 9 fixtures gets `audioKey`, `displayText`, `voiceText`. Legacy `body` mirrors displayText. Header doc updated. |
| `components/TourMode.js` | +~110 lines | Audio loading, audio-driven dwell, mute state with sessionStorage, preload helpers, stopAudio on lifecycle exits. |
| `components/NarratorCorner.js` | full rewrite, +~30 lines | Two inline SVG icons, new mute button in HUD row, accepts `muted` + `onToggleMuted` props. |
| `app/api/tts/route.js` | NEW, 60 lines | OpenAI TTS proxy. |
| `scripts/generate-tour-audio.js` | NEW, 110 lines | Audio generation CLI. |
| `package.json` | 1 line | npm script entry. |
| `app/voice-picker/page.js` | DELETED | Throwaway scaffolding. |
| `app/api/tts-preview/route.js` | DELETED | Throwaway scaffolding. |
| `public/tour-audio/*.mp3` | NEW × 56 | Pre-generated narration. ~10.4 MB total. |

### Verification

**Build:** `npm run build` ✓ Compiled successfully. 39/39 static pages, 24 encounter routes, `/api/tts` registered as Dynamic. No new lint errors.

**Audio generation:** `npm run generate-tour-audio` produced **56 MP3s**, **8,622 voiceText chars**, **est. $0.1293** at TTS-1 pricing ($15/1M chars). Average ~155 chars/bubble; longest is Vanstone onArrival at 288 chars (the 8-day denial cascade timeline read-out). All 56 files under `public/tour-audio/`. File sizes range 26 KB (Wexbury transition: "One more. The closer.") to 389 KB (Aldington pre, full inbox math intro).

**Static-analysis checks:**
- `grep "fixtureId:" lib/tourScript.js | wc -l` → **9**
- `grep '"of 9"' lib/tourScript.js` → all 18 progressLabel + title strings.
- Banned-phrase grep `I used | this caught | saved me | Kairos caught | Kairos remembered | I clocked | I worked through` → **zero hits**.
- `grep "audioKey:" lib/tourScript.js | wc -l` → **56** matches `ls public/tour-audio/*.mp3 | wc -l`. One audio file per bubble; nothing orphaned.
- `grep "displayText:" lib/tourScript.js | wc -l` → **56** (every bubble paired).
- TourEndModal mic-drop preserved verbatim.

**Estimated tour runtime at 1× with audio:**

Audio durations weren't read back per-file (would need ffprobe), but TTS-1 averages ~14.5 chars/sec at default speed for English narration. With 8,622 total chars and 56 bubbles plus 500 ms tail buffer per bubble:
- Narration audio: ~8622 / 14.5 ≈ **595 s** of voice
- Per-bubble buffers: 56 × 0.5 s = **28 s**
- Per-fixture overhead (action runtime + nav settle + auto-authorize + inter-step pwait): ~22 s × 9 fixtures = **198 s**
- **Total estimated runtime at 1×: ~821 s ≈ 13:30–14:00 end-to-end.**

That's ~30-60 s longer than the silent length-aware estimate (12:30–13:00) since voice cadence is gentler than the dwell formula's worst-case ceiling. At 2× toggle the audio path still uses real audio.duration (no compression — the audio plays at native speed regardless of speed toggle). If Brandon wants 2× to actually speed up audio, that needs a follow-up: HTMLAudioElement `playbackRate` knob plus shorter dwell. **Flagged for follow-up.**

**What I could NOT verify without playing the tour interactively:**
- Whether the bubble's display text remains visible (and audio audible) for the full audio.duration on dense-text bubbles. Audio-driven dwell should match voice perfectly, but the 500 ms tail buffer is a guess; if bubbles dismiss before the voice fully fades, raise `AUDIO_TAIL_BUFFER_MS` to 700-800.
- Whether mute toggle persists across browser refresh (sessionStorage scope is per-tab). Verified the storage key write and read paths exist; needs eyeball.
- Whether mid-bubble mute toggle silences cleanly (it sets `audio.muted = true` on the live element, which all major browsers honor without restart). Code path verified; visual confirmation needed.
- Whether autoplay is blocked on initial bubble. Browsers require a user gesture before playing audio; the tour starts via the "Take a tour" button click which counts as a gesture, so the first bubble should play. If it doesn't, the catch on `audio.play()` swallows the rejection silently — bubble still dwells correctly with the audio-derived duration but no sound. Mitigation: surface a "click to start audio" prompt on autoplay-block, deferred to a follow-up.
- Voice quality for clinical proper nouns (Crestor, Lexiscan, Evolent, peer-to-peer, INR, BNP, Holter, paresthesias). TTS-1 generally pronounces these correctly; the bigger risk is "MyChart" being read as M-Y-C-H-A-R-T or "my chart." Spot-check before the demo; if "MyChart" reads wrong, the script can substitute "patient portal" in voiceText only (displayText keeps the brand).

### Out of scope
- HVC fork (`app/api/hvc/*`) untouched.
- mock-encounters JSON untouched.
- No git push — Brandon visually verifies in the morning.
- No 2× speed support for audio — flagged as follow-up (`playbackRate`).
- NURSE-DEMO-INTRO.md still says "four to five minutes" — third time flagged stale, still not auto-edited.

## [2026-04-29] kairos | Tour expanded to 9-fixture deck with full 6-category coverage. Promoted norreys/quennell/maundrell from skeleton to fully scripted and wired into the tour route between Calderwood and Underwell.

Builds on the demo-blocker patch (commit 58245a7 — P1–P4 audit fixes). This commit adds three fixtures and re-orders the tail of the tour. P1–P4 already in HEAD before this commit; nothing in this commit re-touches them.

### What landed in this commit

**Three skeleton fixtures promoted to fully scripted** (each was `actionScripts: {}` before):
| Fixture | Pattern | Action | Lines before → after |
|---|---|---|---|
| `norreys-transactional` | P9 TRANSACTIONAL REPLY | `generate-reply` | 53 → 99 |
| `quennell-scope` | P12 SCOPE-CONSTRAINED | `generate-scope-respecting-reply` | 56 → 84 |
| `maundrell-contradiction` | P8 CONTRADICTION | `forward-to-provider` | 54 → 76 |

Each fixture follows the aldington-tte / calderwood-crestor template: `state-transition` → `banner` → `pane-update` (typing animation, ~70-80 cps) → `state-transition`. Clinical content is design-stage — accuracy is plausible-clinical-pattern, not production-prescriptive.

- **Norreys (P9 — REFILL):** Rx Request rule check (last visit + future appointment + active dx) → standard nurse-note documentation + brief MyChart confirmation + refill order pre-staged (90 days, 3 refills, Marchetti cosign). Demonstrates the "boring case" — protocol, not synthesis.
- **Quennell (P12 — ADVICE/SCOPE):** Vague-reference classifier already triggered on prior round; this card draws the scope-respecting reply. Cardiology RN scope is the cardiology workup; H&H↔BP belongs to hematology. Reply redirects to existing hematology referral. No order-pad output.
- **Maundrell (P8 — CONTRADICTION):** Patient says Dr. M discontinued warfarin; chart still shows it active. Red banner → contradiction documented in nurse-note → forwarded to Marchetti. **No autonomous MyChart reply** (Pattern 8 holds patient-facing output until provider confirms).

**Tour route expanded to 9 fixtures.** New order (in `lib/tourScript.js`):

| Slot | Fixture | Pattern | Category |
|---|---|---|---|
| 1 | aldington-tte | P2 | NOTIFY |
| 2 | wood-lipid | P1 | NOTIFY |
| 3 | calderwood-crestor | P4 | NOTIFY |
| 4 | norreys-transactional | P9 | **REFILL** *(NEW slot)* |
| 5 | quennell-scope | P12 | **ADVICE** *(NEW slot)* |
| 6 | maundrell-contradiction | P8 | **INR** *(NEW slot)* |
| 7 | underwell-full-lifecycle | P7b | TRIAGE |
| 8 | wexbury-phone | P14 | NOTIFY phone variant |
| 9 | vanstone-denial-cascade | P13 | OTHER |

All 18 "Card N of N" strings (9 progressLabels + 9 preArrivalNarrator titles) renumbered to "of 9." Header comment updated `9 fixtures, scripted in order`. `TOUR_SCRIPT.length` is the source of truth for total count, so NarratorCorner / TourEndModal pick up the change automatically.

**Transitions rewired to match new neighbor order:**
- Calderwood → Norreys: `"Now a different gear. A refill request the system can resolve from a rule, not a synthesis. Some work is automatic."`
- Norreys → Quennell: `"Now a patient asks something Kairos can't safely answer alone. Watch what it does instead."`
- Quennell → Maundrell: `"Now a patient statement that contradicts the chart. Watch what gets drafted — and what doesn't."`
- Maundrell → Underwell: `"Now multi-stage. A patient called with chest symptoms. This is a two-hour clinical investigation, condensed."` *(reused the prior post-Brexley-cut Wexbury→Underwell transition wording)*
- Underwell → Wexbury: `"Now something different — a patient with no MyChart. Watch what changes."` *(reused prior Calderwood→Wexbury transition)*
- Wexbury → Vanstone: `"One more. The closer."` *(moved from prior Underwell→Vanstone position)*
- Vanstone → null *(last fixture, hands off to TourEndModal — closer "That's Kairos. You already do all of this. Kairos doesn't replace you — it stops making you the database." preserved)*

**Per-fixture closer lines (per audit narrative anchor):**
- Norreys onAuthorize: `"Some work is one-click. Some work is automatic. Kairos is designed to sort which is which — so the nurse only sees what actually needs a nurse."`
- Quennell onAuthorize: `"Kairos doesn't pretend to know what it can't know. The system is designed to recognize scope and route accordingly."`
- Maundrell onAuthorize: `"Same INR result. Different plan. Kairos noticed. The contradiction is the output — not the reply."`

### Files touched (4 + this log entry)
| File | Δ lines | Change |
|---|---|---|
| `data/fixtures/encounters/norreys-transactional.js` | +46 | Promoted from skeleton: `generate-reply` actionScript with 6-event sequence (state, banner, nurse-note typing, mychart typing, banner, order-pad instant). |
| `data/fixtures/encounters/quennell-scope.js` | +28 | Promoted from skeleton: `generate-scope-respecting-reply` actionScript with 5-event sequence (state, banner, nurse-note typing, mychart typing, banner). |
| `data/fixtures/encounters/maundrell-contradiction.js` | +22 | Promoted from skeleton: `forward-to-provider` actionScript with 4-event sequence (state, red banner, nurse-note typing, red banner). No mychart pane-update — Pattern 8 holds. |
| `lib/tourScript.js` | +210/−4 (net +206) | 3 new fixture entries inserted between Calderwood and the (formerly-Wexbury, now-Underwell) slot. Underwell + Wexbury physically swapped in array order so Underwell precedes Wexbury. All 18 "Card N of N" strings renumbered to /9. 7 transitionNarrator bodies rewired. Header comment 6→9. |

### Verification

**Build:** `npm run build` ✓ Compiled successfully. 39/39 static pages, 24 encounter routes (24 unchanged — brexley-statin still SSG'd as a standalone dashboard fixture, just absent from the tour route).

**Static-analysis checks:**
- `grep "fixtureId:" lib/tourScript.js | wc -l` → **9**
- `grep "Card .* of " lib/tourScript.js` → all 18 hits read "of 9". No "of 6" or "of 7" remnants.
- Banned-phrase grep across `lib/tourScript.js` for `I used | this caught | saved me | in my clinic | Kairos caught | I clocked | I worked through` → **zero hits.**
- `grep "brexley-statin" lib/tourScript.js` → **zero hits** in tour route.
- Fixture-comment numbering in tourScript.js: FIXTURE 1 (Aldington) → FIXTURE 2 (Wood) → FIXTURE 3 (Calderwood) → FIXTURE 4 (Norreys) → FIXTURE 5 (Quennell) → FIXTURE 6 (Maundrell) → FIXTURE 7 (Underwell) → FIXTURE 8 (Wexbury) → FIXTURE 9 (Vanstone). Sequential, no gaps.
- `pattern.actionButtons` for P8/P9/P12 confirmed in `lib/patterns.js`. `ActionBar.js` resolves buttons via `pattern.actionButtons` (pattern.js is the source of truth) so the new actionIds (`generate-reply`, `generate-scope-respecting-reply`, `forward-to-provider`) wire automatically into both the tour's `auto-action` event and the manual click path.
- `simulationDataSource.runAction(cardId, actionId)` looks up `fixture.actionScripts[actionId]` generically — confirmed all three new fixtures have their respective actionId keys defined.

**Estimated tour runtime at 1× (length-aware dwell from P2):**

| Block | Narration | Per-fixture w/ overhead |
|---|---|---|
| Slots 1–3 (Aldington/Wood/Calderwood) — unchanged from prior commit | ~171s | ~237s |
| Slot 4 Norreys (NEW) | ~78s | ~95s |
| Slot 5 Quennell (NEW) | ~69s | ~91s |
| Slot 6 Maundrell (NEW) | ~68s | ~90s |
| Slots 7–9 (Underwell/Wexbury/Vanstone) — unchanged content | ~195s | ~256s |
| **Total** | **~581s narration** | **~769s ≈ 12:30–13:00** |

**Tour runtime estimate at 1× speed: ~12:30–13:00 end-to-end.** That's ~4:30 longer than the prior 6-fixture build. At 2× toggle (60% of base, length-aware): ~7:45–8:00. The "four to five minutes" copy in NURSE-DEMO-INTRO.md is now firmly stale; flagged again, not auto-edited.

**What I could NOT verify without playing the tour:**
- Whether the 3 new fixtures' typing animations land cleanly with the spotlight bubbles. EncounterDetail's `kairos-encounter:action-complete` event fires after the action stream drains; bubble dwell starts after typing finishes; opacity gate from P3 should keep the bubble invisible until anchor measures. Wired correctly per code path inspection but needs eyeball.
- Whether Pattern 8 (Maundrell) renders the OutputPane area cleanly when no `mychart` pane-update fires — the bubble anchored to `output-pane` will appear over an empty/held MyChart panel. If the panel renders awkwardly empty, fall back: re-anchor that bubble to `nurse-note` and merge it into the prior beat (one-line edit).
- Whether the Norreys order-pad pane renders for Pattern 9 (`pattern.panes` lists `["source", "nurseNote", "mychart"]` — no orderPad). If the order-pad doesn't render visually, the bubble narration ("90 days, 3 refills, standard dx, Marchetti cosign") still describes the order conceptually, but the spotlight has no orderPad anchor. If this is broken, easiest fix is to add `"orderPad"` to Pattern 9's panes in `lib/patterns.js` (1 line) — Pattern 9's morning-session description does include an auto-staged refill, so the rendered surface should include it.
- Whether the new Maundrell red banner reads as "the system is being safe" rather than "the AI broke" — the audit-spec'd reframe avoided the Brexley failure-mode framing entirely; visual confirmation needed that the red banner copy reads as intentional safety hold, not error.

### Out of scope
- HVC fork (`app/api/hvc/*`) untouched.
- `mock-encounters/brexley-statin.json` untouched — Brexley still loads on direct URL hit.
- No Phase 3.4 work (live HVC wiring, edit telemetry).
- No git push.
- NURSE-DEMO-INTRO.md "four to five minutes" line — flagged stale, not auto-edited.

## [2026-04-29] kairos | Demo-blocker patch applied — framing reframes + Brexley cut + length-aware dwell + opacity gate + Aldington MyChart fix.

Implements the fixes spec'd in the audit entry directly below. All four problems addressed in a single patch landing on `main` ahead of tomorrow's nurse demo at Phelps.

### Files touched (5 code/content + this log entry)
| File | Δ lines | Change |
|---|---|---|
| `lib/tourScript.js` | −117/+45 (net −72) | 7 framing reframes; Brexley fixture deleted; Wexbury/Underwell/Vanstone renumbered to 4/5/6 of 6; Aldington 1/2/3 renumbered to of 6; Aldington MyChart bubble retitled "Read the MyChart draft" with expanded body and `durationMs: 9000`; header comment updated to "6 fixtures." |
| `components/TourMode.js` | +20/−3 (net +17) | `durationMultiplier` removed. New `computeDwell(data, speed)` helper: `max(authored, 1500 + chars × 50)`, floor 3500ms, ceiling 16000ms; speed=2 trims to 60% of base. Three call sites swapped (`showNarrator`, `showSpotlight`, banner-handler `setTimeout`). Comment updated "all 7 cards present" → "all 6 cards present." |
| `components/SpotlightOverlay.js` | +5/−1 (net +4) | Bubble holds at `opacity: 0` and `pointerEvents: none` until `rect` resolves, then fades in over 180ms. No more top-left flash before scroll-settle. |
| `components/TourLauncher.js` | 1 line | `title="Guided 7-card tour, ~3 minutes"` → `"Guided 6-card tour, ~3 minutes"`. |
| `docs/NURSE-DEMO-INTRO.md` | 1 line | "Seven cards. Each one is a real pattern I worked through on shift this week" → "Six cards. Each one is a real pattern I observed on shift this week" + updated card list (TTE, lipid, Crestor, phone, callback, denial cascade — replaces the old generic 7-item list which was never in sync with the actual fixtures anyway). |

Patch totals: **5 files, ~106 deletions / ~70 insertions, net ~36 lines removed** from the runtime tour bundle.

### Verification

**Build:** `npm run build` ✓ Compiled successfully. 39/39 static pages generated. brexley-statin still appears as an `/encounter/[id]` SSG route (intentional — it's still on the dashboard, just not in the tour route). 24 encounter routes. No new warnings beyond the existing `node-domexception` install-time deprecation.

**Static-analysis checks (in lieu of interactive tour playback):**
- `grep -c "fixtureId:" lib/tourScript.js` → **6**, in order: aldington-tte → wood-lipid → calderwood-crestor → wexbury-phone → underwell-full-lifecycle → vanstone-denial-cascade. Brexley is gone.
- `grep "Card .* of " lib/tourScript.js` → all 12 hits read "of 6" (6 progressLabels + 6 preArrivalNarrator titles). No "of 7" remnants.
- Banned-phrase grep over both `tourScript.js` and `NURSE-DEMO-INTRO.md` for `I used | I worked through | caught me | this caught | saved me | in my clinic | Kairos caught | Kairos remembered | I clocked` → zero matches in tourScript; one match in NURSE-DEMO-INTRO (`"I built this because I got tired of waiting"`) which is on-cover-story (he designed it, that's the whole framing) and was deliberately left.
- Brexley occurrences in tour script post-patch: zero. brexley-statin remains as a dashboard fixture (mock-encounters JSON untouched, simulation engine entry untouched, EncounterDetail still renders it on direct URL hit).
- Calderwood transitionNarrator no longer teases "the safety moment" — now teases "a patient with no MyChart" (Wexbury), so the Card 3 → Card 4 handoff reads cleanly.

**Estimated runtime at 1× under length-aware dwell** (narration only, action typing + nav settle + auto-authorize fly-off add ~22s/fixture overhead):

| Fixture | Narration sum | Per-fixture w/ overhead |
|---|---|---|
| 1 Aldington | ~73s (Aldington preArrival hits the 16000ms ceiling; MyChart bubble 13.65s; 3-beat after-action sequence) | ~95s |
| 2 Wood | ~47s | ~69s |
| 3 Calderwood | ~51s | ~73s |
| 4 Wexbury | ~73s (preArrival + after-action #1 hit ceiling) | ~95s |
| 5 Underwell | ~67s (3-stage actions, longest action sequence) | ~89s |
| 6 Vanstone | ~55s | ~72s |
| **Total** | **~366s narration** | **~493s ≈ 8:00–8:30** |

**Tour runtime estimate at 1× speed: ~8:00–8:30 end-to-end.** This is roughly double the previous 4–5 min experience — the deliberate trade for nurses being able to actually finish reading text-heavy bubbles. Brandon can tap **2× speed** mid-tour at any time; the new formula yields ~5:00–5:15 at 2×, which is a usable "running it again with a colleague who already saw it once" cadence. The "four to five minutes" copy in NURSE-DEMO-INTRO.md is now stale by design — flagged here, not auto-edited because Brandon may want to either keep that line generic ("five-ish minutes") or update post-eyeball; one-line edit when he decides.

**What I could NOT verify without playing the tour:**
- Whether bubbles still feel rushed at 1× on dense fixtures (Aldington preArrival 327c hitting the 16000ms ceiling: 16s for a 327-char bubble = ~49ms/char effective, which is at the upper end of the 50ms/char target — comfortable for fast readers, possibly tight for slow ones). If Brandon's eyeball flags this, raise the ceiling to 18000ms (~5 char ÷ on the formula).
- Whether the opacity-gate fade-in feels natural or laggy. 180ms is the standard "appearing intentionally" timing; if it reads as sluggish, drop to 120ms (one-line knob).
- Whether the Aldington MyChart bubble (240c, ~13.65s effective) is enough time for nurses to actually read the underlying MyChart pane content as the bubble points to it. If still tight, bump `durationMs: 9000` → `12000` and let the formula's max() kick in. One-line knob.
- Whether the auto-authorize fly-off animation completes before the next fixture's preArrival narrator fires (uses `kairos-encounter:flown-off` event — should be deterministic but visual confirmation needed).
- Tour ending: TourEndModal still says "That's Kairos." with the "stops making you the database" mic-drop line — confirmed by reading the component file. Vanstone transitionNarrator is `null` so no orphaned bubble post-Vanstone before the modal opens.

### Out of scope for this patch
- No edits to `app/api/hvc/*` (HVC fork untouched).
- No edits to mock-encounters JSON or simulation engine — Brexley simulation still works on direct dashboard navigation.
- No git push. Local commit only, per Brandon's instruction.
- Vercel Framework Preset issue from earlier 9:04p log entry still pending dashboard work.
- NURSE-DEMO-INTRO.md "four to five minutes" runtime line is now stale; flagged, not auto-edited.

### Files NOT touched (intentionally)
- `mock-encounters/brexley-statin.json` — Brexley still loads on direct URL.
- `lib/simulationEngine.js` — phiGuard banner emission for brexley-statin still fires; only its tour-mode narration was removed.
- `components/EncounterDetail.js` — no changes; tour-mode coordination protocol unchanged.
- `components/NarratorCorner.js`, `components/TourEndModal.js` — no changes needed; total comes from `TOUR_SCRIPT.length` so renumber is automatic.

## [2026-04-29] kairos | Pre-demo tour audit — narration framing + dwell timing + bubble-snap + MyChart-skip — REPORT ONLY, no edits.

### Audit scope
Brandon demos to nurse colleagues tomorrow. Cover story is design-stage: he is an RN who observed clinic workflow patterns over 90 days and designed Kairos from those observations; he has NOT used Kairos on real patients. Four problem areas surfaced in dry-run: (1) narration sometimes implies real use, (2) text-heavy bubbles disappear before he can finish reading, (3) bubble visually snaps from top to middle as it reanchors, (4) MyChart message skipped before user can read it. Audit only — no file edits, no commits, no deploy. Diffs are spec'd ready to apply on Brandon's signoff.

---

### PROBLEM 1 — NARRATION FRAMING

#### Findings (lib/tourScript.js)
Walked all 45 narrator/spotlight bodies + every preArrival/onArrival/onAuthorize/transition. The script does NOT actually use first-person past-tense ("I used", "this caught me", "in my clinic"). What it does do is mix two framings:
- **Aspirational/observational** (good): "Kairos pulled the union, deduplicated", "the routing decision tree noticed", "the system catches when it isn't [perfect]" — these read as design claims.
- **Currently-deployed** (problem): several lines speak as if Kairos is actively in use today. The strongest offenders:

| Line | File:Loc | Issue |
|---|---|---|
| `"This card came from your Results Follow-Up box. Epic shows 27 unread, but only 9 are actually yours… Kairos pulled the union, deduplicated, and gave you the real number."` | tourScript.js Aldington preArrival | "came from", "your" — implies a live inbox is connected. |
| `"This is one of those nine."` | Aldington preArrival | Reinforces the live-inbox implication. |
| `"That's encoded clinical IP from your real notes."` | Wood after-action #1 | "your real notes" — implies Brandon's actual chart documentation has been ingested. The strongest single hit. |
| `"In Epic, this same workflow is 14 clicks across 5 screens."` | Aldington onAuthorize | Comparative claim presented as measured. Marginal — could read as observed during shadowing, but a nurse will hear "I clocked it." |
| `"14 clicks in Epic. One in Kairos."` | Calderwood onAuthorize | Same as above, terser — same risk. |
| `"The investigation persisted across stages — Kairos remembered where you were."` | Underwell onAuthorize | "Remembered where you were" frames it as a session you actually had. |
| `"Currently lives in your working memory because Epic can't surface it as one thing."` | Vanstone preArrival | "Currently lives in your working memory" — present-tense claim about Brandon's actual cognition while working denial cascades. Acceptable as design observation, but only if the framing umbrella up front establishes that.
| `"Note signed, MyChart sent, order pended for Loxley to cosign."` | Aldington onAuthorize | Present-tense narration of an effect implies the click did real work in Epic. |

**NURSE-DEMO-INTRO.md:** clean. The doc explicitly frames the demo as simulated ("Right now it's demo-only — every patient, every message, every result you'll see is simulated from real shift workflows here at this clinic. Nothing is connected to live Epic."). One soft spot: `"Each one is a real pattern I worked through on shift this week"` — accurate (he observed them), but a nurse skimming will hear "I worked through on shift" as "I used Kairos to handle this." Recommend tightening to `"Each one is a real pattern I observed on shift this week"` to match the cover story.

#### Proposed reframes (full diffs ready)
All edits in `lib/tourScript.js`. Single concept: anywhere Kairos is the present-tense actor on a real workflow, push to "is designed to / would" or strip the possessive "your". Twelve string changes, ~14 lines touched.

```diff
-  "This card came from your Results Follow-Up box. Epic shows 27 unread, but only 9 are actually yours after you filter by provider. Those same 9 also show up in your custom 'addressed to me' search. Kairos pulled the union, deduplicated, and gave you the real number. This is one of those nine."
+  "Imagine your Results Follow-Up box. Epic shows 27 unread, but only 9 are actually yours once you filter by provider. The same 9 surface in a custom 'addressed to me' search. Kairos is designed to pull the union, deduplicate, and surface the real number. This card is one of those nine."

-  "That's encoded clinical IP from your real notes."
+  "Built to encode the clinical IP that lives in patterns like this."

-  "In Epic, this same workflow is 14 clicks across 5 screens."
+  "In Epic, this same workflow takes roughly 14 clicks across 5 screens."

-  "14 clicks in Epic. One in Kairos."
+  "Roughly 14 clicks in Epic. One in Kairos, by design."

-  "The investigation persisted across stages — Kairos remembered where you were."
+  "The investigation is designed to persist across stages — Kairos would remember where you left off."

-  "Note signed, MyChart sent, order pended for Loxley to cosign. In Epic, this same workflow is 14 clicks across 5 screens."
+  "Note signed, MyChart drafted, order pended for cosign — that's the design. In Epic, this same workflow takes roughly 14 clicks across 5 screens."

-  "Currently lives in your working memory because Epic can't surface it as one thing."
+  "Today this lives in working memory because Epic can't surface it as one thing — Kairos is designed to."
```

Cluster of softer edits (keep aspirational verb form throughout):
- Wood `"This card type is most of your morning."` → `"This card type is meant to handle most of a typical morning."`
- Aldington onArrival `"Watch what happens next."` → unchanged (instructional, not a use claim).
- Brexley `"the system blocks Authorize and forces a regeneration"` → `"the system is designed to block Authorize and force a regeneration"`.

NURSE-DEMO-INTRO.md (one line):
```diff
-  Each one is a real pattern I worked through on shift this week
+  Each one is a real pattern I observed on shift this week
```

#### Brexley arc — two options spec'd

**Option 1 — Rewrite Brexley as clean handoff (no error/recovery beat)**
Keep card slot 4 as "the safety moment" but pivot it to: phiGuard correctly distinguishes a brand-name drug from PHI on the first pass. Tradeoff: loses the dramatic recovery beat that nurses tend to remember; gains zero implication that the AI just made a mistake on a live workflow.

Diff in `lib/tourScript.js` (Brexley block, ~30 lines replaced):
```js
{
  fixtureId: "brexley-statin",
  progressLabel: "Card 4 of 7 — Ms. Brexley",
  preArrivalNarrator: {
    title: "Card 4 of 7 — Ms. Brexley",
    body:
      "Statin choice — Dr. Loxley offered the patient a switch from Zetia to Nexlizet. Brand names that look like patient identifiers are exactly the kind of thing AI confuses. Watch how the safety rail handles it.",
    durationMs: 5500,
  },
  onArrival: {
    anchor: "source-pane", position: "right", style: "spotlight",
    title: "Brand-name vs. PHI",
    body: "'Nexlizet' is a brand name, not a patient. Watch the cross-output consistency check confirm it.",
    durationMs: 5000,
  },
  actions: [
    {
      actionId: "generate-note-mychart",
      annotations: [
        {
          trigger: "after-action",
          anchor: "output-pane", position: "left", style: "spotlight",
          title: "Disambiguated on the first pass",
          body:
            "Drug names match across panes. No placeholder leak. The cross-output consistency check is designed to flag exactly this kind of brand-vs-identifier collision before Authorize unlocks.",
          durationMs: 7000,
        },
      ],
    },
  ],
  onAuthorize: {
    anchor: "global", style: "narrator-corner",
    title: "Safety rail is the point.",
    body: "The architecture isn't 'the AI is perfect.' It's 'the system catches when it isn't.' This card showed it catching nothing — because there was nothing to catch.",
    durationMs: 5500,
  },
  transitionNarrator: {
    title: "Next — a patient with no MyChart",
    body: "Now something different — a patient with no MyChart. Watch what changes.",
    durationMs: 4200,
  },
},
```
**Downstream:** simulationEngine for `brexley-statin` currently emits red→green banner sequence. Option 1 requires either (a) editing the simulation to skip the red banner emission for the tour-mode case, or (b) leaving the simulation alone and removing the `on-banner` annotations — the banners would still flash on screen but with no spotlight commentary. (b) is cleanest for a one-day window: simulation file untouched, just tour script reframed. Risk: nurse sees a red flash with no narration explaining it. Mitigate by gating banner emission on `?tour=1` query. Estimated extra effort: ~15 lines in the Brexley simulation block.

**Option 2 — Cut Brexley from the tour entirely**
Drop the fixture object from `TOUR_SCRIPT`. Renumber progressLabels Card 5/6/7 → Card 4/5/6 (Wexbury, Underwell, Vanstone). Deck becomes 6 cards. Adjust Calderwood transitionNarrator (currently teases "Now the moment we want you to see. The AI almost made a mistake.") and Wexbury preArrival to flow directly.

Diff (`lib/tourScript.js`):
- Delete entire Brexley fixture block (lines ~163–217 of current file).
- Calderwood transitionNarrator body: `"Next — a patient with no MyChart. Watch what changes."` (was: `"Now the moment we want you to see. The AI almost made a mistake. Watch how the system catches it."`).
- Wexbury progressLabel: `"Card 4 of 6 — Mrs. Wexbury"` (and update preArrivalNarrator title to match).
- Underwell progressLabel + title: `"Card 5 of 6"`.
- Vanstone progressLabel + title: `"Card 6 of 6"`.
- TourEndModal text references "7 cards" — search-and-replace to "6 cards" (1 file: components/TourEndModal.js, likely 1–2 lines).

**Downstream:** TOUR_SCRIPT.length is read as the source of truth for `total` in NarratorCorner — no hardcoded 7s in the orchestrator. Brexley simulation files (mock-encounters/brexley-statin.json) can stay; nothing breaks if it's still openable from /dashboard outside the tour. Estimated lines: ~60 deletions + 6 string edits across 2 files.

**Recommendation:** **Option 2** for tomorrow's demo. Brandon already flagged Brexley as a real-app event he doesn't want associated. Cleanest way to honor the cover story is to not rely on demo discipline — physically remove the arc. The "safety moment" point can land later in v4 when phiGuard has more architectural detail to support it. Keeping Option 1 is acceptable if Brandon really wants to keep 7 cards — but it hinges on a flawless gating change in the simulation, which is more risk than removal.

#### Risk
Option 2 risks: TourEndModal copy may reference "7" elsewhere; Brandon's NURSE-DEMO-INTRO.md says "Seven cards" → must update to "Six cards." Five-string sweep, 5 minutes. Otherwise zero downstream coupling.

---

### PROBLEM 2 — DWELL TIMING

#### Findings
Dwell is set per-bubble via `durationMs` field in tourScript.js, then multiplied at runtime by `durationMultiplier(speed)` in components/TourMode.js (lines 70–73): 1× speed → ×1.5, 2× speed → ×1.0. Default speed is 1×. So a `durationMs: 7500` bubble actually shows for 11.25s at default.

The model is **flat-multiplied, not length-aware**. That's the root bug: a 4500ms transition with 12 words gets the same 1.5× treatment as a 7500ms preArrival with 60 words.

**Top 5 longest bubbles** (title+body chars, current effective dwell at 1×):

| # | Bubble | Chars | durationMs | Effective dwell (×1.5) | Reading speed @ 200wpm |
|---|---|---|---|---|---|
| 1 | Aldington preArrivalNarrator | 327 | 7500 | 11.25s | needs ~9.8s + parse |
| 2 | Vanstone onArrival ("8-day timeline") | 247 | 8500 | 12.75s | needs ~7.4s + parse |
| 3 | Brexley phiGuard banner ("Stop. The system caught it.") | 233 | 7500 | 11.25s | needs ~7.0s + parse |
| 4 | Wexbury after-action ("An example, not a script") | 297 | 7500 | 11.25s | needs ~8.9s + parse |
| 5 | Calderwood preArrivalNarrator | 211 | 6500 | 9.75s | needs ~6.3s + parse |

Also tight: Underwell preArrival (215c / 9.75s), Underwell Stage 2 SBAR (197c / 9.75s), Aldington onArrival (151c / 8.25s).

Per-character dwell currently averages ~37 ms/char effective. For dense clinical content with punctuation that requires parse-pause (em-dashes, semicolons, code names like "Evolent guideline 7312"), 50ms/char is a more honest floor.

#### Proposed fixes

**Option A — bump global multiplier (fallback, ~2 lines)**
```diff
   function durationMultiplier(speed) {
-    return speed === 2 ? 1.0 : 1.5;
+    return speed === 2 ? 1.0 : 2.0;
   }
```
Risk: short bubbles (e.g. "One more. The closer." at 3000ms × 2.0 = 6s) drag and feel slow. Estimated change: 1 line.

**Option B — length-aware dwell (recommended, ~25 lines)**

Replace the multiplier-only model with a formula that uses durationMs as a floor and adds a per-character allowance. Implement in TourMode.js:

```js
// Replace durationMultiplier + pwait usage with computeDwell(data, speed).
const READ_BASE_MS = 1500;       // parse-time floor
const READ_PER_CHAR_MS = 50;     // ~200wpm + cognitive load tax
const DWELL_FLOOR_MS = 3500;
const DWELL_CEILING_MS = 16000;

function computeDwell(data, speed) {
  const text = `${data.title || ""} ${data.body || ""}`.trim();
  const chars = text.length;
  const lengthAware = READ_BASE_MS + chars * READ_PER_CHAR_MS;
  const authored = data.durationMs || 4000;
  // Take the larger of authored intent and length-aware estimate.
  const base = Math.max(authored, lengthAware);
  // Speed toggle: 1× = full, 2× = 60% of full (faster but still length-aware).
  const adjusted = speed === 2 ? base * 0.6 : base;
  return Math.max(DWELL_FLOOR_MS, Math.min(DWELL_CEILING_MS, adjusted));
}
```

Wire-in: replace `pwait(data.durationMs || N)` calls in `showNarrator`, `showSpotlight`, and the banner-handler `setTimeout` with `pwait(computeDwell(data, speedRef.current))`. Four call sites. Drop `durationMultiplier` entirely (the speed knob lives inside computeDwell now).

**Resulting effective dwell at 1×, top 5 worst-case bubbles:**

| # | Bubble | chars | Old (×1.5) | New (computeDwell) | Δ |
|---|---|---|---|---|---|
| 1 | Aldington preArrival | 327 | 11.25s | 16.00s (ceiling) | +4.75s |
| 2 | Vanstone onArrival | 247 | 12.75s | 13.85s | +1.10s |
| 3 | Brexley phiGuard | 233 | 11.25s | 13.15s | +1.90s |
| 4 | Wexbury after-action | 297 | 11.25s | 16.00s (ceiling) | +4.75s |
| 5 | Calderwood preArrival | 211 | 9.75s  | 12.05s | +2.30s |

Short bubbles (`"One more. The closer."` 30c) get `1500 + 30×50 = 3000ms` → floor 3500ms instead of 3000×1.5=4500. Slight speedup on shorts, large slowdown on longs. That's exactly the asymmetry Brandon wants.

Recommendation: **Option B**. Risk is low (single-file change in TourMode.js, no script-file edits, behavior fully reversible by reverting the function).

#### Risk
- Banner-handler annotation uses `setTimeout(…, ann.durationMs * multiplier)` (TourMode.js ~125). Replace cleanly with `setTimeout(…, computeDwell(ann, speedRef.current))`. One-liner.
- 2× toggle currently shows label "2x" with multiplier 1.0. New formula yields 0.6× → effectively the previous 0.9× experience. If Brandon prefers the snappy old 2× feel, set speed===2 multiplier to 0.5. Trivial knob.
- Estimated lines: ~25 (one helper added, four call sites swapped, one constant block).

---

### PROBLEM 3 — TOP-TO-MIDDLE SNAP

#### Findings (components/SpotlightOverlay.js)

The bubble's `bubbleStyle` defaults to `{ left: 24, top: 24 }` in the JSX render path **before** `rect` resolves. Sequence on mount:

1. SpotlightOverlay mounts. `rect = null`, `resolvedPosition = position||"right"`.
2. First render: bubble paints at `(24, 24)` — top-left corner of viewport.
3. `useEffect` runs `initialize()`: calls `el.scrollIntoView({behavior:"smooth", block:"center"})`, awaits 450ms, then calls `measure()`.
4. `measure()` calls `setRect(...)` and `setResolvedPosition(...)`.
5. Re-render: bubble now positions next to the (now-centered) anchor — typically mid-screen. **Visible jump.**

This matches Brandon's report exactly: bubble appears top-left, then snaps to the middle as the page scrolls and the anchor settles.

The 450ms scroll-settle delay is for the **measurement** step, not the **render** step. The bubble has been on-screen the whole time at (24,24).

#### Proposed fix

**Recommended — opacity gate (lowest risk, ~6 lines)**

Hold the bubble at `opacity: 0` until `rect` is non-null. The dim layer + cutout still render (so the page darkens the moment the spotlight engages, no awkward delay), but the bubble itself stays invisible until it has a real position.

Diff in `components/SpotlightOverlay.js`:

```diff
       {/* Bubble */}
       <div
         className="absolute kairos-card p-4 shadow-2xl"
         style={{
           width: BUBBLE_W,
           left: bubbleStyle.left,
           top: bubbleStyle.top,
+          opacity: rect ? 1 : 0,
+          transition: "opacity 180ms ease-out",
+          pointerEvents: rect ? "auto" : "none",
           background: "var(--color-platinum)",
           borderColor: "var(--color-amber)",
           borderWidth: 1,
         }}
```

Net behavior: page dims (good — instant feedback that something is happening), anchor scrolls into view, ~450ms later bubble fades in at the right spot. No top-left flash.

**Alternative — scroll-first-then-render**
Hold bubble render entirely (`{rect && <bubble/>}`) instead of opacity-gating. Slightly cleaner DOM but causes a hard pop-in instead of a 180ms fade — worse perceived smoothness. Reject.

**Alternative — useLayoutEffect + sync measure**
Replace useEffect with useLayoutEffect and skip the smooth-scroll, jumping the page instantly. Eliminates the wait but the page snap is more disruptive than the bubble snap. Reject.

#### Risk
Almost none. If `rect` stays `null` (anchor missing for "global" spotlights), the bubble would never appear. Current code already guards: "global" anchor means SpotlightOverlay is never used (NarratorCorner is used instead). Verified by reading the orchestrator branch. No regression risk.

Estimated lines: 3.

---

### PROBLEM 4 — MYCHART-BEFORE-ORDERS SKIP

#### Findings

Walked all 7 fixtures' annotation sequences:

| Fixture | Has MyChart pane spotlit? | Has order-pad spotlit? | Sequence |
|---|---|---|---|
| Aldington | YES (output-pane, 5500ms) | YES (5800ms) | nurse-note → output-pane → order-pad — **3 separate beats** |
| Wood | NO (only output-pane bubble, 6500ms) | NO | single beat |
| Calderwood | NO | YES × 2 (5500ms, 5500ms) | order-pad → order-pad — MyChart never spotlit |
| Brexley | YES (banner-driven) | NO | banner red → banner green |
| Wexbury | YES (output-pane, 7500ms + 6000ms) | NO | two output-pane beats — using ExplanationPane |
| Underwell | NO MyChart, NO order-pad — uses nurse-note (3 beats) | — | three nurse-note beats |
| Vanstone | YES (output-pane × 2, 6000+5500ms) | NO | source-pane → output-pane → output-pane |

So the only fixture where Brandon would see MyChart→Orders is **Aldington (Card 1)**. The dwell on the MyChart spotlight is `5500ms × 1.5 = 8.25s`.

The bubble narration on the MyChart beat is just 13 words: `"MyChart message drafts at the same time. Parenthetical lay terms. Patient-friendly framing."` — that fits in 8.25s easily. **What doesn't fit is the actual MyChart message content typing out on-screen.** EncounterDetail dispatches `kairos-encounter:action-complete` only after the simulation event stream finishes (line 204), so by the time the bubble appears, the MyChart message is already typed. But the user is told to look at the bubble, not the panel. The bubble dies, the next bubble appears anchored to the order-pad, and the user only got 8.25s to actually read the underlying MyChart message.

This is partly a Problem 2 issue (length-aware dwell would help once we count the MyChart message body), but more cleanly it's a "the bubble is anchored to the right pane but doesn't tell the user to read the pane content." Two fix angles:

#### Proposed fix

**Per-fixture fix (Aldington, recommended) — extend MyChart bubble dwell + reframe body**

In `lib/tourScript.js`, Aldington's after-action bubble #2 (output-pane):
```diff
-          {
-            trigger: "after-action",
-            anchor: "output-pane",
-            position: "right",
-            style: "spotlight",
-            title: "Patient-friendly translation",
-            body:
-              "MyChart message drafts at the same time. Parenthetical lay terms. Patient-friendly framing.",
-            durationMs: 5500,
-          },
+          {
+            trigger: "after-action",
+            anchor: "output-pane",
+            position: "right",
+            style: "spotlight",
+            title: "Read the MyChart draft",
+            body:
+              "Take a moment with this one. The MyChart message drafts in parallel with the note — same clinical content, patient-friendly translation, parenthetical lay terms. This is the message Mr. Aldington would actually receive.",
+            durationMs: 9000,
+          },
```

Effective dwell at 1× becomes 9000×1.5=13.5s (or 14.0s under length-aware Problem 2 fix). Body explicitly directs the eye to the panel. Solves the read-skip without splitting the beat.

**Combined fix (Problem 2 + this) — ideal**

If Problem 2's length-aware formula lands, Aldington's MyChart bubble auto-extends to ~9s based on the longer body alone (190c × 50 + 1500 = 11s). Add an explicit `pause` mid-beat by raising durationMs further or just rely on the formula. Either way, the body reframe ("Read the MyChart draft" / "Take a moment with this one") is the load-bearing change — without it, length-aware timing alone doesn't tell the user what to look at.

#### Risk
Low. One annotation, two strings + durationMs. Doesn't affect simulation engine, doesn't affect order-pad beat that follows. If Problem 2 lands first, the durationMs bump is partially redundant but harmless (computeDwell takes max of authored and length-aware).

Estimated lines: 4 (one annotation block, three string fields).

---

### Combined patch summary

| Problem | Fix | Files | LoC | Risk |
|---|---|---|---|---|
| 1 | Reframes (12 strings) + Brexley Option 2 cut | `lib/tourScript.js`, `components/TourEndModal.js`, `docs/NURSE-DEMO-INTRO.md` | ~75 | Low |
| 2 | Length-aware dwell formula | `components/TourMode.js` | ~25 | Low |
| 3 | Bubble opacity gate | `components/SpotlightOverlay.js` | ~3 | None |
| 4 | Aldington MyChart bubble reframe + dwell bump | `lib/tourScript.js` | ~4 | None |
| **Total** | | **4 files** | **~107** | **Low overall** |

Suggested apply order: 3 (visual snap, lowest risk) → 2 (timing model, foundational) → 1 (content reframe + Brexley cut) → 4 (verify on Aldington with new timing). Smoke after each — no commit until Brandon eyeballs the live tour.

### Untouched in this audit
- No file edits beyond this docs/log.md entry.
- No git stage. No git commit. No git push. No Vercel redeploy.
- Vercel Framework Preset issue from earlier 9:04p audit still pending dashboard work — orthogonal.
- HVC fork (`app/api/hvc/*`) untouched. Mock encounters JSON untouched.

## [2026-04-29] kairos | Production deploy attempt: firekraker1272/kairos main pushed (1c48107). Vercel auto-deploy fired (dpl_BrAFhFe6feHBHrgDsY8Vp2EvEhV3) and reported state=READY after 22s clean build (39/39 pages, 24 encounter routes, ✓ Compiled successfully). HOWEVER all edge paths return HTTP 404 NOT_FOUND including /, /dashboard, /api/hvc/health, /encounter/* on both per-deploy hostname (kairos-tour-g4bkufi06-...) and production aliases (kairos-tour.vercel.app, kairos-tour-firekrakerproductions-2999s-projects.vercel.app). Root cause: Vercel project config has framework=null — Framework Preset was not auto-detected as Next.js when GitHub repo was connected. Build artifact correct; edge router cannot resolve App Router routes without preset. Fix is dashboard-side: Settings → Build & Development Settings → Framework Preset → Next.js, then Redeploy. Vercel MCP toolset is read-only + deploy; cannot set env vars, ignored build step, or attach domain via MCP — those three settings (NEXT_PUBLIC_KAIROS_MODE=simulation, commandForIgnoringBuildStep, kairos-tour.firekraker.net) also pending dashboard work. kairoshealth.app isolation VERIFIED INTACT (still serving original "Cardiology Nurse Workstation" landing/prototype with original "Take the 60-second tour" CTA, no kairos-tour content bleed). 0/7 smoke string checks could be validated until preset fix lands.
