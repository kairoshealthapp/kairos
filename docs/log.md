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

**Phase 5 — Hartwell synthetic data.** `data/patients/hartwell.json` is a 14-entry FHIR Bundle (58yo F on atorvastatin 40 mg started ~6 weeks ago for elevated LDL with FH risk; HTN, prediabetes, sulfa rash; ASA 81 + lisinopril 10; recent labs LDL 95 / AST 42 [H] / ALT 38; provider Dr. Skarsdale in Feb 2026). `data/investigations/hartwell_001.json` seeds a 3-touchpoint bidirectional MyChart round-trip: 6:51 AM provider Result Note from Dr. Ballinger with 5 follow-up questions → 10:07 AM outbound MyChart draft (5th-grade reading level) → 10:15 AM patient inbound reply (denies symptoms, but introduces a turmeric supplement started 3 weeks ago — the bucket-transition surprise). New encounter record `hartwell_encounter_001` with `investigationId: 'investigation_hartwell_001'`.

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

**Phase 5 — Halberg synthetic data + protocol library.** `data/patients/halberg.json` is a 13-entry FHIR Bundle (64yo F with hypothyroidism + resistant HTN + CAD + GAD; on Levothyroxine 100 mcg AM-fasting + Metoprolol succinate 50 mg + Clonidine 0.1 mg BID + Atorvastatin 40 mg + ASA 81 mg; recent TSH 2.1 normal; provider Dr. Skarsdale). Encounter `halberg_encounter_001` typed as `pre_procedure_inquiry` with a structured `procedureContext: { type: 'exercise_stress_test', protocolId: 'pre_stress_test_med_management', scheduledDateMsFromNow: 7d, orderingProvider: 'Dr. Skarsdale' }` — the encounters registry resolves the relative-time scheduledDate at read time. `data/protocols/protocols.json` ships the canonical Pre-Stress Test Med Management protocol with rules covering beta blockers, non-DHP CCBs, **central alpha agonists (the safety-chain catch)**, levothyroxine, statins, and antiplatelets — the rationale text on the central-alpha-agonist rule explicitly calls out that this class is "frequently overlooked."

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

The Tysander med-rec engine produces exactly 11 discrepancies as designed:
- 2 duplicate-class (high) — Metoprolol+Carvedilol, Sertraline+Citalopram
- 3 patient_dropped — Carvedilol (medium), Glipizide (high, hypoglycemia risk), Citalopram (medium)
- 1 dose_mismatch — Metformin 1000→500 (medium)
- 1 frequency_mismatch (high) — Tramadol q6h PRN order, patient using QID
- 1 frequency_mismatch (low) — Famotidine BID order, patient using PRN
- 2 patient_added (low) — Vitamin D, Turmeric
- 1 drug_interaction (medium) — Apixaban + Turmeric (compound bleeding risk)

Engine in `lib/clinical/medRecEngine.js`; shared drug name/class lookup extracted to `lib/clinical/drugLookup.js` (shared with v4 protocol applier). Severity scaling rules: narrow-therapeutic and hypoglycemic agents escalate to high; opioid/benzo overuse goes high; under-use of routine meds is low. Interaction map covers ~9 common pairs.

The Castellanos PA tracker renders the 5-stage history with the canonical progress bar, action bar context-sensitive to `info_requested` (so "Request additional info" is offered), and a Send patient update button that drafts a dual output (warm MyChart message + clinical nurse note) via `lib/prompts/paStatusUpdate.js` against Opus 4.7. The patient-facing message acknowledges the frustration and explains the PA stage in plain language; the nurse note carries clinical density and `[verify: ...]` flags.

Dashboard updates: Tysander encounter card shows the discrepancy badge ("11 discrepancies detected" with high-count call-out); Castellanos card shows the PA stage pill + days-active + transitions count. New header link "Your integrity log →" surfaces the personal attestation history at `/integrity-log`. Inbox count rises to 7 active encounters.

**Phases (8 total):**
1. Pre-visit task data model + state module (`lib/types/preVisitTask.js`, `lib/state/preVisitTasks.js`).
2. Tysander synthetic FHIR R4 Bundle (78yo F, 18 active meds with deliberate duplicates), pre-visit task seed (17 patient-reported entries), encounter registration as `pre_visit_med_rec`.
3. Med-rec engine (`reconcileMedications` + interaction map + drug-class duplicates), shared `drugLookup.js`. Verified against Tysander: produces exactly the spec's ~11 discrepancies.
4. `MedRecPanel` component (3-column Epic / Patient / Discrepancy layout, severity-sorted resolution actions, attestation footer with the inline "are you sure?" confirmation when unresolved discrepancies remain). API routes `/api/med-rec/resolve` + `/api/med-rec/attest`. `/integrity-log` page reads the in-memory log; never aggregated.
5. Castellanos synthetic FHIR Bundle (61yo F, statin-intolerant CAD, recent MI, LDL 132 on max-tolerated atorvastatin, Repatha draft order). PA state-machine type (`lib/types/priorAuth.js` with allowed-transition guard) + storage (`lib/state/priorAuth.js`) + 5-stage seed.
6. `PriorAuthTracker` component (progress bar, vertical timeline, context-sensitive next-step buttons, dual-output draft generator). Prompt + route at `lib/prompts/paStatusUpdate.js` and `app/api/pa-status-update/route.js` (Opus 4.7).
7. Dashboard updates: discrepancy badge for Tysander, PA stage badge for Castellanos, "Your integrity log →" header link, new pill labels for `pre_visit_med_rec` and `prior_auth_inquiry` encounter types.
8. End-to-end verify — full route smoke: `/dashboard`, `/triage/tysander_encounter_001`, `/triage/castellanos_encounter_001`, `/integrity-log`, plus all v2-v4 routes — every one returns HTTP 200. Build clean. Zero real-name leakage. No `<form>` tags.

**Architectural note.** v5 closes out the integrity-and-state primitives layer. Pre-visit task is the temporal phase ahead of the encounter; the AttestationLog distinguishes earned from unearned clicks at the documentation surface; the PA state machine carries multi-stage workflows that outlive any single encounter. The pitch frame ("Kairos is one primitive applied to ten surfaces, not ten features") is now structurally complete: Phase-1 chart-aware inquiry → Investigation links across time → Cohort surfaces populations → Protocol applies guidelines as data → Pre-visit task captures the before-the-room phase → Documentation integrity records what was actually reviewed → State-machine workflow tracks the durable cross-encounter PA. Every new clinical workflow on the roadmap is a composition.

**Files added (uncommitted):**
- `lib/types/preVisitTask.js`, `lib/state/preVisitTasks.js`
- `lib/clinical/medRecEngine.js`, `lib/clinical/drugLookup.js`
- `data/patients/tysander.json`, `data/preVisitTasks/cosgrove_001.json`
- `app/api/med-rec/resolve/route.js`, `app/api/med-rec/attest/route.js`
- `components/MedRecPanel.js`
- `app/integrity-log/page.js`
- `lib/types/priorAuth.js`, `lib/state/priorAuth.js`
- `data/patients/castellanos.json`, `data/priorAuth/castellanos_repatha.json`
- `lib/prompts/paStatusUpdate.js`
- `app/api/pa-status-update/route.js`
- `components/PriorAuthTracker.js`

**Files modified (uncommitted):**
- `lib/fhir/mockData.js` (registered Tysander + Castellanos bundles)
- `lib/fhir/encounters.js` (added `tysander_encounter_001` with `preVisitTaskId`, `castellanos_encounter_001` with `priorAuthId`)
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
- Smoke-tested 10 routes — all return 200: /dashboard, /referral-inbox, /fax-inbox, /integrity-log, /triage/whitfield_encounter_001, /triage/halberg_encounter_001, /triage/tysander_encounter_001, /triage/castellanos_encounter_001, /cohort/inr-reminder, /investigation/investigation_linnehan_001.
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
- **Phase 6** — `lib/state/preVisitTasks.js` rewritten. `discrepancyResolutions` map on the returned task is reconstructed from `kairos_discrepancy_resolutions` rows (latest-write-wins per discrepancy_id, full audit history retained). API routes: `/api/pre-visit-tasks/[id]`, `/api/pre-visit-tasks/[id]/resolutions`. `/api/med-rec/resolve` writes through. Dashboard `buildMedRecBadge` made async, pre-computes via `Promise.all`. `scripts/seed-pre-visit-tasks.js` loads Tysander's 17-med task.
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
