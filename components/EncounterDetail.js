// Phase 3.3 — Encounter detail shell. 4-pane grid + animation state machine.
// Consumes the dataSource async-iterator stream and applies SimulationEvent
// objects to pane state.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dataSource from "@/lib/dataSource";
import { routeFor } from "@/lib/routing";
import { getPattern } from "@/lib/patterns";
import { isCinematicMode } from "@/lib/featureFlags";
import { cameraGoto } from "@/lib/tourCamera";
import PatientHeader from "./PatientHeader";
import SourcePane from "./SourcePane";
import NurseNotePane from "./NurseNotePane";
import OutputPane from "./OutputPane";
import OrderPadPane from "./OrderPadPane";
import AddContextRow from "./AddContextRow";
import ActionBar from "./ActionBar";
// Phase-3.6 specialized panels — dispatched by fixture.pattern / id below.
import TriageEncounter from "./TriageEncounter";
import INRSourcePanel from "./INRSourcePanel";
import ReferralPacketPanel from "./ReferralPacketPanel";
import KairosFindingPanel from "./KairosFindingPanel";
import SuggestedReplyPanel from "./SuggestedReplyPanel";
import RoutingPanel from "./RoutingPanel";
import ContradictionAlert from "./ContradictionAlert";

// Phase-3.5: breadcrumb labels (six Epic In Basket folders).
const TAB_LABELS = {
  results: "RESULTS",
  resultsfu: "RESULTS F/U",
  rxrequest: "RX REQUEST",
  patientcall: "PATIENT CALL",
  patientadvice: "PATIENT ADVICE REQUEST",
  securechat: "SECURE CHAT",
};

// Triage pattern dispatch — fixtures whose entire encounter view is the
// four-stage clinical reasoning workflow (TriageEncounter component).
const TRIAGE_FIXTURE_IDS = new Set(["strathorne-doe", "underwell-full-lifecycle"]);

// INR pattern dispatch — fixtures whose SOURCE panel is the trended INR
// view (INRSourcePanel) instead of the standard SourcePane.
function isInrPattern(fixture) {
  if (!fixture) return false;
  if (fixture.pattern === "inr-routine") return true;
  if (fixture.contradictionHold === true) return true;
  if (fixture.patternName === "INR ROUTINE") return true;
  if (fixture.id === "crider-inr" || fixture.id === "maundrell-contradiction") return true;
  return false;
}

const STORAGE_KEY = "kairos.authorizedCards.v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cinematic Pass A — map a pane-update event's target string to the
// data-tour-anchor selector the camera should tight-frame on. Targets
// not in this map skip the cinematic camera move (the typing still
// runs, just without per-pane framing).
function paneAnchorFor(target) {
  switch (target) {
    case "nurse-note":
      return '[data-tour-anchor="nurse-note"]';
    case "mychart":
      return '[data-tour-anchor="output-pane"]';
    case "phone-script":
      return '[data-tour-anchor="phone-script"]';
    case "order-pad":
      return '[data-tour-anchor="order-pad"]';
    default:
      return null;
  }
}

function readAuthorized() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch (e) {
    return new Set();
  }
}

function writeAuthorized(set) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    /* noop */
  }
}

export default function EncounterDetail({ fixture, fromTab }) {
  const router = useRouter();
  const route = useMemo(() => routeFor(fixture), [fixture]);
  const pattern = useMemo(() => getPattern(fixture.patternId), [fixture]);

  // Tour mode: detected via ?tour=1 OR sessionStorage 'kairos-tour-active'.
  // In tour mode, edit affordances are disabled and action/authorize are
  // driven via window events from TourMode.
  const tourMode =
    typeof window !== "undefined" &&
    (new URLSearchParams(window.location.search).get("tour") === "1" ||
      sessionStorage.getItem("kairos-tour-active") === "1");

  const [paneState, setPaneState] = useState(() => ({
    nurseNote: fixture.initialPaneContent?.nurseNote || "",
    mychartMessage: fixture.initialPaneContent?.mychartMessage || "",
    phoneScript: fixture.initialPaneContent?.phoneScript || "",
    orderPad: fixture.initialPaneContent?.orderPad || { orders: [], hasUnansweredQuestions: false },
    typingTarget: null,
    typingSpeedCps: 60,
  }));
  const [cardState, setCardState] = useState("idle"); // idle | drafting | drafted | authorized | flown-off
  const [isPlaying, setIsPlaying] = useState(false);
  const [banner, setBanner] = useState(null);
  const [editable, setEditable] = useState(false);
  const cancelRef = useRef(false);
  // Skip-beat signal: TourMode fires kairos-tour:skip-beat when the user
  // hits Skip mid-action. The typing loop, banner hold, and pause events
  // all check this ref so they fast-forward to a finished state instead of
  // running to completion at normal speed and missing the tour's next beat.
  const skipBeatRef = useRef(false);
  // Cinematic Pass A — counts pane-updates seen within the current
  // action so the camera knows whether this pane is the first reveal
  // (no wide pull-back) or a subsequent reveal (preceded by a wide
  // pull-back). Reset to 0 at the start of every runAction.
  const paneUpdateCountRef = useRef(0);

  // Set per-pane content. mode: 'replace' | 'append' | 'instant'.
  const applyPaneContent = useCallback((target, content, mode) => {
    setPaneState((prev) => {
      const next = { ...prev };
      const key =
        target === "nurse-note"
          ? "nurseNote"
          : target === "mychart"
          ? "mychartMessage"
          : target === "phone-script"
          ? "phoneScript"
          : target === "order-pad"
          ? "orderPad"
          : null;
      if (!key) return prev;
      if (key === "orderPad") {
        next.orderPad = content;
      } else if (mode === "append") {
        next[key] = (prev[key] || "") + content;
      } else {
        next[key] = content;
      }
      return next;
    });
  }, []);

  const applyEvent = useCallback(
    async (event) => {
      if (cancelRef.current) return;
      if (!event) return;
      switch (event.type) {
        case "pane-update": {
          const { target, content, mode = "replace", typingSpeedCps } = event;
          const dispatchArtifactComplete = () => {
            if (typeof window === "undefined") return;
            window.dispatchEvent(
              new CustomEvent("kairos-artifact:render-complete", {
                detail: { target },
              })
            );
          };
          // Cinematic Pass A — Fix 1: before the typing animation runs,
          // pull the camera wide between panes (so the viewer reads the
          // whole encounter context for a beat) and then tight-frame on
          // the active pane so its typewriter lands center-stage instead
          // of off-screen. The first pane-update in an action skips the
          // wide pull-back because there is no previous pane to pull
          // back from. cancelRef is checked so a tour-end mid-camera
          // doesn't strand us in a transition.
          if (isCinematicMode() && !cancelRef.current && !skipBeatRef.current) {
            const cinematicAnchor = paneAnchorFor(target);
            if (cinematicAnchor) {
              if (paneUpdateCountRef.current > 0) {
                await cameraGoto('[data-tour-anchor="patient-header"]', {
                  framing: "wide",
                  holdMs: 1500,
                });
                // Cinematic Pass A — Fix 2: an additional 1500ms beat
                // on top of the wide pull-back's hold so each artifact
                // gets a real read-and-breathe interval instead of the
                // ~400ms type-engine queue delay that has been the
                // inter-pane gap until now. Total inter-pane breathing:
                // 1500ms wide hold + 1500ms beat = 3000ms.
                if (!cancelRef.current && !skipBeatRef.current) {
                  await sleep(1500);
                }
              }
              await cameraGoto(cinematicAnchor, {
                framing: "tight",
                holdMs: 0,
              });
            }
          }
          paneUpdateCountRef.current = (paneUpdateCountRef.current || 0) + 1;
          if (mode === "instant" || target === "order-pad" || !typingSpeedCps) {
            applyPaneContent(target, content, mode);
            dispatchArtifactComplete();
            return;
          }
          // Animated typing: stream characters into pane state.
          // Pass E — Brandon's tour-at-2× still feels slow at the Pass D
          // 4× rate, so bumped to 10× (current ms/char ÷ 2.5). At
          // typingSpeedCps=80 the tour @1× effective rate is now ~533 cps,
          // and tour @2× is ~1066 cps — close to instantaneous on most
          // modern monitors. The 1.5× legacy slowdown is still applied
          // as the readability baseline before the 10× kicks in.
          let intervalMs = Math.max(8, 1000 / typingSpeedCps);
          if (typeof window !== "undefined" && sessionStorage.getItem("kairos-tour-active") === "1") {
            const ts = sessionStorage.getItem("kairos-tour-speed");
            const speedMul = ts === "2" ? 2 : 1;
            intervalMs = Math.max(1, (intervalMs * 1.5) / (speedMul * 10));
          }
          const chars = String(content);
          let acc = mode === "append" ? null : "";
          // Capture the prior content up front when in append mode so the
          // skip-fast-forward path below has the correct base string and
          // doesn't end up writing only the appended chunk.
          if (mode === "append") {
            setPaneState((prev) => {
              acc =
                target === "nurse-note"
                  ? prev.nurseNote || ""
                  : target === "mychart"
                  ? prev.mychartMessage || ""
                  : target === "phone-script"
                  ? prev.phoneScript || ""
                  : "";
              return prev;
            });
            await sleep(0);
          }
          for (let i = 0; i <= chars.length; i++) {
            if (cancelRef.current) return;
            // Fast-forward path — Skip pressed while we were typing. Jump
            // straight to the final string and resolve so action-complete
            // can fire and the tour can advance.
            if (skipBeatRef.current) {
              const finalText = mode === "append" ? (acc || "") + chars : chars;
              applyPaneContent(target, finalText, "replace");
              dispatchArtifactComplete();
              return;
            }
            const partial = chars.slice(0, i);
            const next = mode === "append" ? (acc || "") + partial : partial;
            applyPaneContent(target, next, "replace");
            await sleep(intervalMs);
          }
          dispatchArtifactComplete();
          return;
        }
        case "banner": {
          setBanner({ kind: event.kind, text: event.text });
          // Dispatch for tour controller listeners.
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("kairos-encounter:banner", {
                detail: { kind: event.kind, text: event.text },
              })
            );
          }
          // Skip-aware sleep: poll in 40ms slices so a mid-banner Skip
          // collapses the banner instantly instead of holding the full
          // 1200ms and stalling the next auto-action.
          const bannerDur = event.durationMs || 1200;
          let elapsed = 0;
          while (elapsed < bannerDur) {
            if (cancelRef.current || skipBeatRef.current) break;
            const slice = Math.min(40, bannerDur - elapsed);
            await sleep(slice);
            elapsed += slice;
          }
          if (cancelRef.current) return;
          setBanner(null);
          return;
        }
        case "state-transition": {
          if (event.target === "card") setCardState(event.newState);
          return;
        }
        case "pause": {
          // Skip-aware pause for the same reason as banner above.
          const pauseDur = event.durationMs || 200;
          let elapsed = 0;
          while (elapsed < pauseDur) {
            if (cancelRef.current || skipBeatRef.current) break;
            const slice = Math.min(40, pauseDur - elapsed);
            await sleep(slice);
            elapsed += slice;
          }
          return;
        }
        default:
          return;
      }
    },
    [applyPaneContent]
  );

  const runAction = useCallback(
    async (actionId) => {
      if (isPlaying) return;
      cancelRef.current = false;
      skipBeatRef.current = false; // fresh action starts un-skipped
      paneUpdateCountRef.current = 0; // reset cinematic pane counter
      setIsPlaying(true);
      setEditable(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("kairos-encounter:action-start", {
            detail: { actionId, fixtureId: fixture.id },
          })
        );
      }
      try {
        const stream = dataSource.runAction(fixture.id, actionId);
        for await (const event of stream) {
          if (cancelRef.current) break;
          // Fast-forward path — Skip pressed at any point in the action.
          // Apply each remaining event instantly: pane-updates write final
          // content with no typing, state-transitions snap, banners and
          // pauses are dropped. The iterator continues to drain without
          // animation overhead so action-complete fires promptly and the
          // tour advances to the next beat.
          if (skipBeatRef.current) {
            if (event.type === "pane-update") {
              applyPaneContent(event.target, event.content, "instant");
            } else if (event.type === "state-transition" && event.target === "card") {
              setCardState(event.newState);
            }
            // banner / pause are intentionally dropped during fast-forward
            continue;
          }
          await applyEvent(event);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("runAction error", err);
        setBanner({ kind: "red", text: String(err.message || err) });
        await sleep(2000);
        setBanner(null);
      } finally {
        setIsPlaying(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("kairos-encounter:action-complete", {
              detail: { actionId, fixtureId: fixture.id },
            })
          );
        }
      }
    },
    [applyEvent, fixture.id, isPlaying]
  );

  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  // Tour mode coordination: dispatch ready on mount; listen for auto-action
  // and auto-authorize commands. Always-on listeners — they are no-ops in
  // non-tour use because TourMode is the only thing that emits these events.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("kairos-encounter:ready", { detail: { fixtureId: fixture.id } })
    );
    function onAutoAction(e) {
      const actionId = e.detail && e.detail.actionId;
      const targetFixture = e.detail && e.detail.fixtureId;
      if (targetFixture && targetFixture !== fixture.id) return;
      // Triage fixtures render via TriageEncounter (its own UI). The 4-pane
      // grid below is hidden, so running the action script here just types
      // long content into invisible panes — the tour stalls 15-25s waiting
      // on action-complete between TRIAGE stages, producing the silences
      // Brandon heard on his Card 7 walkthrough. TriageEncounter already
      // listens to auto-action and advances setStage, and now dispatches
      // action-complete immediately so the tour can move on.
      if (TRIAGE_FIXTURE_IDS.has(fixture.id)) return;
      if (actionId) runAction(actionId);
    }
    function onAutoAuthorize() {
      handleAuthorizeRef.current && handleAuthorizeRef.current();
    }
    function onSkipBeat() {
      // Tour Skip pressed — flip the ref so the typing/banner/pause loops
      // fast-forward. The next auto-action resets it inside runAction.
      skipBeatRef.current = true;
    }
    window.addEventListener("kairos-encounter:auto-action", onAutoAction);
    window.addEventListener("kairos-encounter:auto-authorize", onAutoAuthorize);
    window.addEventListener("kairos-tour:skip-beat", onSkipBeat);
    return () => {
      window.removeEventListener("kairos-encounter:auto-action", onAutoAction);
      window.removeEventListener("kairos-encounter:auto-authorize", onAutoAuthorize);
      window.removeEventListener("kairos-tour:skip-beat", onSkipBeat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixture.id, runAction]);

  // Stable ref for handleAuthorize so the auto-authorize listener can call
  // the latest closure without re-binding.
  const handleAuthorizeRef = useRef(null);

  // Auto-clear the channel-aware explanation pane (formerly PhoneScript).
  // The Explanation pane is ephemeral — never part of the patient record —
  // so it should clear visually on Authorize as part of the fly-off, and
  // never persist into the eventual FHIR write payload (v2). Nurse Note +
  // MyChart message remain.
  const dismissExplanation = useCallback(() => {
    setPaneState((p) => ({ ...p, phoneScript: "" }));
  }, []);

  // Authorize → auto-clear explanation pane → fly-off → sessionStorage
  // flag → back to dashboard.
  //
  // Demo-state guard: outside the tour, the fly-off animation still plays
  // (so the click feels real) but the card is NOT persisted as authorized.
  // When the user routes back to /rn, the card reappears in its original
  // state. Only the tour engine should be permanently dismissing fixtures.
  const handleAuthorize = useCallback(async () => {
    if (isPlaying) return;
    setPaneState((p) => ({ ...p, phoneScript: "" })); // ephemeral pane
    setCardState("authorized");
    await sleep(280);
    setCardState("flown-off");
    await sleep(420);
    const tourLive =
      typeof window !== "undefined" &&
      sessionStorage.getItem("kairos-tour-active") === "1";
    if (tourLive) {
      const set = readAuthorized();
      set.add(fixture.id);
      writeAuthorized(set);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("kairos-encounter:flown-off", {
          detail: { fixtureId: fixture.id },
        })
      );
    }
    const q = fromTab ? `?tab=${encodeURIComponent(fromTab)}` : "";
    router.push(`/rn${q}`);
  }, [fixture.id, fromTab, isPlaying, router]);

  // Keep a stable ref for the auto-authorize event listener.
  useEffect(() => {
    handleAuthorizeRef.current = handleAuthorize;
  }, [handleAuthorize]);

  const handleEdit = useCallback(() => {
    if (tourMode) return; // edit affordance disabled during tour
    setEditable((v) => !v);
  }, [tourMode]);

  function handleBack() {
    const q = fromTab ? `?tab=${encodeURIComponent(fromTab)}` : "";
    router.push(`/rn${q}`);
  }

  const blockAuthorize = !!(paneState.orderPad && paneState.orderPad.hasUnansweredQuestions);
  const flownOff = cardState === "flown-off" || cardState === "authorized";

  const categoryLabel = fromTab ? TAB_LABELS[fromTab] || fromTab.toUpperCase() : null;

  // Phase-3.6 — early dispatch for triage fixtures (whole-view replacement
  // by TriageEncounter). Strathorne and Underwell render their own
  // four-stage workflow rather than the standard 4-pane grid below.
  if (TRIAGE_FIXTURE_IDS.has(fixture.id)) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleBack}
              className="text-[12px] text-bone-muted hover:text-bone transition-colors"
            >
              ← Back to dashboard
            </button>
            {categoryLabel ? (
              <>
                <span className="text-[12px] text-bone-muted/60" aria-hidden="true">
                  ›
                </span>
                <span className="kairos-kicker text-amber/80">{categoryLabel}</span>
              </>
            ) : null}
          </nav>
        </div>
        <div data-tour-anchor="patient-header">
          <PatientHeader fixture={fixture} route={route} />
        </div>
        <TriageEncounter fixture={fixture} />
      </div>
    );
  }

  // Phase-3.6 — early dispatch for the Pelc already-resolved fixture
  // (Stream 5 moat). Custom three-panel layout: source / Kairos finding /
  // suggested reply, plus the standard routing panel + action bar.
  if (fixture.id === "pelc-va-rfs" || fixture.pattern === "already-resolved") {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleBack}
              className="text-[12px] text-bone-muted hover:text-bone transition-colors"
            >
              ← Back to dashboard
            </button>
            {categoryLabel ? (
              <>
                <span className="text-[12px] text-bone-muted/60" aria-hidden="true">
                  ›
                </span>
                <span className="kairos-kicker text-amber/80">{categoryLabel}</span>
              </>
            ) : null}
          </nav>
        </div>
        <div data-tour-anchor="patient-header">
          <PatientHeader fixture={fixture} route={route} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <SourcePane fixture={fixture} />
          <KairosFindingPanel finding={fixture.kairosFinding} />
          <div className="lg:col-span-2">
            <SuggestedReplyPanel reply={fixture.suggestedReply} />
          </div>
        </div>
        {fixture.routing ? (
          <div className="mt-4">
            <RoutingPanel routing={fixture.routing} />
          </div>
        ) : null}
        <div className="mt-4">
          <ActionBar
            cardId={fixture.id}
            pattern={pattern}
            isPlaying={false}
            blockAuthorize={false}
            onRunAction={() => {}}
            onAuthorize={handleAuthorize}
            onEdit={handleEdit}
            fromTab={fromTab}
          />
        </div>
      </div>
    );
  }

  // Per-pattern flags for the default four-pane render path below.
  const useInrSource = isInrPattern(fixture);
  const isSellman =
    fixture.id === "sellman-cpap-referral" ||
    fixture.pattern === "synthesis-referral-dme";

  return (
    <div
      className={
        "transition-all duration-500 " +
        (cardState === "authorized" ? "opacity-90 -translate-y-1 " : "") +
        (cardState === "flown-off" ? "opacity-0 -translate-y-8 scale-95 " : "")
      }
      style={{ pointerEvents: flownOff ? "none" : undefined }}
    >
      {/* Top strip: back button + breadcrumb category + pattern label */}
      <div className="flex items-center justify-between mb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleBack}
            className="text-[12px] text-bone-muted hover:text-bone transition-colors"
          >
            ← Back to dashboard
          </button>
          {categoryLabel ? (
            <>
              <span className="text-[12px] text-bone-muted/60" aria-hidden="true">
                ›
              </span>
              <span className="kairos-kicker text-amber/80">{categoryLabel}</span>
            </>
          ) : null}
        </nav>
      </div>

      {/* Banner row (transient) */}
      {banner ? (
        <div
          className={
            "mb-3 px-3 py-2 rounded-sm border text-[12px] font-medium " +
            (banner.kind === "red"
              ? "bg-oxblood/15 border-oxblood/60 text-oxblood"
              : banner.kind === "yellow"
              ? "bg-amber/10 border-amber/60 text-amber"
              : "bg-sage/10 border-sage/60 text-sage")
          }
        >
          {banner.text}
        </div>
      ) : null}

      <div data-tour-anchor="patient-header">
        <PatientHeader fixture={fixture} route={route} />
      </div>

      {/* 4-pane grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div data-tour-anchor="source-pane">
          {useInrSource ? (
            <INRSourcePanel fixture={fixture} />
          ) : (
            <SourcePane fixture={fixture} />
          )}
        </div>
        <div data-tour-anchor="nurse-note">
          {fixture && fixture.contradictionHold ? <ContradictionAlert /> : null}
          <NurseNotePane
            content={paneState.nurseNote}
            isTyping={isPlaying}
            editable={editable && !tourMode}
            onChange={(v) => setPaneState((p) => ({ ...p, nurseNote: v }))}
          />
        </div>
        <div data-tour-anchor="output-pane">
          <OutputPane
            fixture={fixture}
            route={route}
            paneState={paneState}
            isTyping={isPlaying}
            onDismissExplanation={dismissExplanation}
          />
        </div>
        <div data-tour-anchor="order-pad">
          <OrderPadPane orderPad={paneState.orderPad} />
        </div>
      </div>

      {/* Phase-3.6 — Sellman moat: append the auto-assembled referral
          packet preview below the four-pane grid. */}
      {isSellman && fixture.referralPacket ? (
        <div className="mt-4">
          <ReferralPacketPanel packet={fixture.referralPacket} />
        </div>
      ) : null}

      <AddContextRow />

      {/* Phase-3.6 — routing surface for any fixture whose primary action
          is a forward (Lockner / Kvalheim / Strathorne / Maundrell / Sellman /
          Pelc). Renders above the action bar so the nurse can review or
          edit recipient/pool/comment/priority before clicking Authorize. */}
      {fixture.routing ? (
        <div className="mt-4">
          <RoutingPanel routing={fixture.routing} />
        </div>
      ) : null}

      <div data-tour-anchor="action-bar">
        <ActionBar
          cardId={fixture.id}
          pattern={pattern}
          isPlaying={isPlaying}
          blockAuthorize={blockAuthorize}
          onRunAction={runAction}
          onAuthorize={handleAuthorize}
          onEdit={handleEdit}
          fromTab={fromTab}
        />
      </div>
    </div>
  );
}
