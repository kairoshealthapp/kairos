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
// v3.0 — conditional panel grid + chat bar.
import ChatBar from "./panels/ChatBar";
import PanelGrid from "./panels/PanelGrid";
import { derivePanelContent, inferPanels } from "@/lib/derivePanelContent";
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
          // Pass G-fix3 #2 — typing is a cosmetic flash, not text to
          // read. Bumping the per-char divisor any further hits the
          // browser's setTimeout floor (~4ms even when asked for 1ms),
          // so a long pane content can still take 500-1000ms to appear.
          // Switched to chunked streaming: per tick we write ~80
          // characters at the 1ms floor, so a 500-char artifact lands
          // in ~6 ticks ≈ 25-30ms — visually a single flash with the
          // typing pipeline still doing its thing (skip / cancel /
          // append modes all still work).
          let intervalMs = Math.max(8, 1000 / typingSpeedCps);
          let charsPerTick = 1;
          if (typeof window !== "undefined" && sessionStorage.getItem("kairos-tour-active") === "1") {
            const ts = sessionStorage.getItem("kairos-tour-speed");
            const speedMul = ts === "2" ? 2 : 1;
            intervalMs = 1; // floor — browser setTimeout clamps anyway
            charsPerTick = 80 * speedMul;
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
          let i = 0;
          while (i <= chars.length) {
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
            if (i === chars.length) break;
            i = Math.min(chars.length, i + charsPerTick);
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
      const recipient = e.detail && e.detail.recipient;
      if (targetFixture && targetFixture !== fixture.id) return;
      // Triage fixtures render via TriageEncounter (its own UI). The 4-pane
      // grid below is hidden, so running the action script here just types
      // long content into invisible panes — the tour stalls 15-25s waiting
      // on action-complete between TRIAGE stages, producing the silences
      // Brandon heard on his Card 7 walkthrough. TriageEncounter already
      // listens to auto-action and advances setStage, and now dispatches
      // action-complete immediately so the tour can move on.
      // v3.0 Master Prompt 2 — new tour drives panel terminal buttons via
      // actionId === "panel:<kind>". Routed here BEFORE the triage
      // short-circuit so Reed (triage) can also forward via panel:.
      if (typeof actionId === "string" && actionId.startsWith("panel:")) {
        const kind = actionId.slice("panel:".length);
        if (handlePanelTerminateRef.current) {
          handlePanelTerminateRef.current({ kind, recipient });
        }
        // CRITICAL: dispatch action-complete on the next macrotask so
        // TourMode.runAction has time to call waitForEvent and register
        // its listener AFTER returning from dispatchEvent. Without this
        // delay, action-complete fires synchronously inside the same
        // dispatchEvent call as auto-action, the listener registers
        // too late, and the tour stalls indefinitely. setTimeout(...,0)
        // matches the pattern TriageEncounter already uses for the
        // legacy generate-inquiry/process-reply/synthesize-callback
        // chain.
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("kairos-encounter:action-complete", {
              detail: { actionId, fixtureId: fixture.id },
            })
          );
        }, 0);
        return;
      }
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

  // v3.0 — per-panel completion + card-level auto-clear. Tour mode
  // reuses the existing handleAuthorize fly-off path. Outside the tour:
  //   1. A panel terminal action collapses just that panel.
  //   2. When every action panel on the card is collapsed, fire the
  //      card-level "Encounter complete." toast and nav to /rn after
  //      ~2.5s (1s read-the-collapse beat + 1.5s toast).
  // Read-only panels (callScript) don't count toward completion.
  const [panelToast, setPanelToast] = useState(null);
  const [completedPanels, setCompletedPanels] = useState({}); // { panelId: "summary text" }
  const declaredPanels =
    Array.isArray(fixture.panels) && fixture.panels.length > 0
      ? fixture.panels
      : null;

  const handlePanelTerminate = useCallback(
    (event) => {
      const summaryByKind = {
        "rnNote.done": "Note signed",
        "rnNote.forward":
          event && event.recipient ? `Forwarded to ${event.recipient}` : "Forwarded",
        "myChart.reply": "Reply sent to patient",
        "myChart.replyCc":
          event && Array.isArray(event.cc) && event.cc.length
            ? `Reply sent · CC ${event.cc.join(", ")}`
            : "Reply sent with CC",
        "myChart.forward":
          event && event.recipient ? `Forwarded to ${event.recipient}` : "Forwarded",
        "orderPad.approve": "Orders placed",
        "referralPacket.approve":
          event && event.recipient
            ? `Referral packet sent to ${event.recipient}`
            : "Referral packet sent",
      };
      const panelByKind = {
        "rnNote.done": "rnNote",
        "rnNote.forward": "rnNote",
        "myChart.reply": "myChart",
        "myChart.replyCc": "myChart",
        "myChart.forward": "myChart",
        "orderPad.approve": "orderPad",
        "referralPacket.approve": "referralPacket",
      };
      const kind = event && event.kind;
      const panelId = panelByKind[kind];
      const summary = summaryByKind[kind] || "Done";
      if (!panelId) {
        // Triage cards (Reed / Strathorne / Underwell) terminate via
        // kinds like "triage.forward" — no per-panel completion to
        // collapse, so the card finishes immediately. Route to
        // handleAuthorize so the flown-off event still dispatches and
        // the tour engine can advance.
        if (typeof kind === "string" && kind.startsWith("triage.")) {
          handleAuthorize();
        }
        return;
      }
      setCompletedPanels((prev) => ({ ...prev, [panelId]: summary }));
    },
    [handleAuthorize]
  );

  // v3.0 Master Prompt 2 — keep handlePanelTerminate accessible from the
  // auto-action listener via a ref so the latest closure is always used.
  const handlePanelTerminateRef = useRef(null);
  useEffect(() => {
    handlePanelTerminateRef.current = handlePanelTerminate;
  }, [handlePanelTerminate]);

  // Watch for card-level completion (every action panel collapsed).
  useEffect(() => {
    const ids = declaredPanels || [];
    // callScript is read-only and doesn't count. referralPacket counts
    // when the fixture has a referralPacket and the panel rendered an
    // Approve button.
    const actionIds = ids.filter((id) => id !== "callScript");
    const hasReferral = !!(fixture && fixture.referralPacket);
    const totalActionPanels = actionIds.length + (hasReferral ? 1 : 0);
    if (totalActionPanels === 0) return;
    const completedCount = Object.keys(completedPanels).filter((k) =>
      actionIds.includes(k) || k === "referralPacket"
    ).length;
    if (completedCount < totalActionPanels) return;
    // All done — fire the card-level finish. In tour mode, route through
    // handleAuthorize so the flown-off event dispatches and the tour
    // engine can advance to the next card. Outside tour mode, show the
    // toast and nav back after 1.5s.
    const tourLive =
      typeof window !== "undefined" &&
      sessionStorage.getItem("kairos-tour-active") === "1";
    if (tourLive) {
      const beat = setTimeout(() => {
        if (handleAuthorizeRef.current) handleAuthorizeRef.current();
      }, 700);
      return () => clearTimeout(beat);
    }
    const beat = setTimeout(() => {
      setPanelToast("Encounter complete.");
      const set = readAuthorized();
      set.add(fixture.id);
      writeAuthorized(set);
      const nav = setTimeout(() => {
        const q = fromTab ? `?tab=${encodeURIComponent(fromTab)}` : "";
        router.push(`/rn${q}`);
      }, 1500);
      // Clean up timer if unmounted.
      return () => clearTimeout(nav);
    }, 1000);
    return () => clearTimeout(beat);
  }, [completedPanels, declaredPanels, fixture, fromTab, router]);

  // v3.0 — direct-URL guard. If the user lands on this fixture's URL but
  // the fixture is already in the authorized set (panel-terminated or
  // tour-authorized this session), redirect back to /rn.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tourLive = sessionStorage.getItem("kairos-tour-active") === "1";
    if (tourLive) return;
    const set = readAuthorized();
    if (set.has(fixture.id)) {
      const q = fromTab ? `?tab=${encodeURIComponent(fromTab)}` : "";
      router.replace(`/rn${q}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixture.id]);

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
        <TriageEncounter
          fixture={fixture}
          onCardTerminate={(event) => {
            const tourLive =
              typeof window !== "undefined" &&
              sessionStorage.getItem("kairos-tour-active") === "1";
            if (tourLive) {
              handleAuthorize();
              return;
            }
            const summaryByKind = {
              "triage.forward":
                event && event.recipient ? `SBAR forwarded to ${event.recipient}` : "SBAR forwarded",
              "myChart.reply": "Reply sent to patient",
              "myChart.replyCc":
                event && Array.isArray(event.cc) && event.cc.length
                  ? `Reply sent · CC ${event.cc.join(", ")}`
                  : "Reply sent with CC",
              "myChart.forward":
                event && event.recipient ? `Forwarded to ${event.recipient}` : "Forwarded",
            };
            const text = (event && summaryByKind[event.kind]) || "Encounter complete.";
            setPanelToast(`${text}.`);
            const set = readAuthorized();
            set.add(fixture.id);
            writeAuthorized(set);
            setTimeout(() => {
              const q = fromTab ? `?tab=${encodeURIComponent(fromTab)}` : "";
              router.push(`/rn${q}`);
            }, 1500);
          }}
        />
        {panelToast ? (
          <div
            role="status"
            aria-live="polite"
            className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[80] kairos-card px-4 py-3 shadow-2xl text-[12px] text-bone leading-snug max-w-[420px] text-center"
            style={{
              background: "var(--color-platinum)",
              borderColor: "var(--color-amber)",
              borderWidth: 1,
            }}
          >
            {panelToast}
          </div>
        ) : null}
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

      {/* v3.0 chat bar — non-functional UI shell at top of detail view */}
      <div className="mt-3">
        <ChatBar />
      </div>

      {/* v3.0 layout: source pane (left ~38%) + conditional panel grid
          (right ~62%). On narrow screens the source pane stacks above
          the panel grid.
          Bookends Pass / A1: when tour is active, reserve a 280px gutter
          on the right so the fixed top-right Tour HUD (260px wide +
          16px from edge) never overlaps panel content. Applied to the
          outer grid so both columns shrink proportionally — keeps the
          source/panel ratio identical to free-explore mode. */}
      <div
        className={
          "mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,38fr)_minmax(0,62fr)] gap-4 items-start" +
          (tourMode ? " lg:pr-[280px]" : "")
        }
      >
        <div data-tour-anchor="source-pane">
          {useInrSource ? (
            <INRSourcePanel fixture={fixture} />
          ) : (
            <SourcePane fixture={fixture} />
          )}
        </div>
        <div>
          {/* v3.0 Fix 2 — contradiction warning now lives inside the
              MyChartMessagePanel itself (banner above the drafted
              message), so the outer ContradictionAlert wrapper is no
              longer rendered here. */}
          <PanelGrid
            panels={Array.isArray(fixture.panels) && fixture.panels.length > 0
              ? fixture.panels
              : inferPanels(fixture)}
            fixture={fixture}
            paneState={paneState}
            derived={derivePanelContent(fixture)}
            isTyping={isPlaying}
            tourMode={tourMode}
            onTerminate={handlePanelTerminate}
            completedPanels={completedPanels}
          />
        </div>
      </div>

      {/* Phase-3.6 / Pass E §3 — auto-assembled referral packet preview
          below the four-pane grid. Originally Sellman-only; now any
          fixture that declares a `referralPacket` renders it (Card 10
          beasley-ep-referral uses this too). data-tour-anchor lets the
          tour spotlight gold-box the panel. */}
      {fixture.referralPacket ? (
        <div className="mt-4" data-tour-anchor="referral-packet">
          <ReferralPacketPanel
            packet={fixture.referralPacket}
            tourMode={tourMode}
            onTerminate={handlePanelTerminate}
            completed={!!completedPanels.referralPacket}
            completedSummary={completedPanels.referralPacket}
          />
        </div>
      ) : null}

      {/* v3.0 Master Prompt 2 / A2 — routing surface for forward-only
          fixtures (Lockner / Kvalheim / Strathorne / Pelc). Referral
          packets carry their routing baked in (destination + fax method
          on the packet header), so the Routing section is suppressed
          whenever a referralPacket is present — Approve & Send Packet
          is the only control needed. */}
      {fixture.routing && !fixture.referralPacket ? (
        <div className="mt-4">
          <RoutingPanel routing={fixture.routing} />
        </div>
      ) : null}

      {panelToast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[80] kairos-card px-4 py-3 shadow-2xl text-[12px] text-bone leading-snug max-w-[420px] text-center"
          style={{
            background: "var(--color-platinum)",
            borderColor: "var(--color-amber)",
            borderWidth: 1,
          }}
        >
          {panelToast}
        </div>
      ) : null}
    </div>
  );
}
