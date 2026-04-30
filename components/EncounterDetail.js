// Phase 3.3 — Encounter detail shell. 4-pane grid + animation state machine.
// Consumes the dataSource async-iterator stream and applies SimulationEvent
// objects to pane state.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dataSource from "@/lib/dataSource";
import { routeFor } from "@/lib/routing";
import { getPattern } from "@/lib/patterns";
import PatientHeader from "./PatientHeader";
import SourcePane from "./SourcePane";
import NurseNotePane from "./NurseNotePane";
import OutputPane from "./OutputPane";
import OrderPadPane from "./OrderPadPane";
import AddContextRow from "./AddContextRow";
import ActionBar from "./ActionBar";

const STORAGE_KEY = "kairos.authorizedCards.v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
          if (mode === "instant" || target === "order-pad" || !typingSpeedCps) {
            applyPaneContent(target, content, mode);
            return;
          }
          // Animated typing: stream characters into pane state.
          // When tour is active at 1x, scale typing intervals by 1.5 so the
          // typing animation feels slower in tandem with the tour cadence.
          // 2x scales by 1.0 (roughly the previous 1x feel). Reading
          // sessionStorage on each event so a mid-action speed toggle takes
          // effect for the next event.
          let tourScale = 1.0;
          if (typeof window !== "undefined" && sessionStorage.getItem("kairos-tour-active") === "1") {
            const ts = sessionStorage.getItem("kairos-tour-speed");
            tourScale = ts === "2" ? 1.0 : 1.5;
          }
          const intervalMs = Math.max(8, (1000 / typingSpeedCps) * tourScale);
          const chars = String(content);
          let acc = mode === "append" ? null : "";
          for (let i = 0; i <= chars.length; i++) {
            if (cancelRef.current) return;
            const partial = chars.slice(0, i);
            if (mode === "append" && acc === null) {
              // capture the existing content the first iteration
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
            const next = mode === "append" ? (acc || "") + partial : partial;
            applyPaneContent(target, next, "replace");
            await sleep(intervalMs);
          }
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
          await sleep(event.durationMs || 1200);
          if (cancelRef.current) return;
          setBanner(null);
          return;
        }
        case "state-transition": {
          if (event.target === "card") setCardState(event.newState);
          return;
        }
        case "pause": {
          await sleep(event.durationMs || 200);
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
      if (actionId) runAction(actionId);
    }
    function onAutoAuthorize() {
      handleAuthorizeRef.current && handleAuthorizeRef.current();
    }
    window.addEventListener("kairos-encounter:auto-action", onAutoAction);
    window.addEventListener("kairos-encounter:auto-authorize", onAutoAuthorize);
    return () => {
      window.removeEventListener("kairos-encounter:auto-action", onAutoAction);
      window.removeEventListener("kairos-encounter:auto-authorize", onAutoAuthorize);
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
  const handleAuthorize = useCallback(async () => {
    if (isPlaying) return;
    setPaneState((p) => ({ ...p, phoneScript: "" })); // ephemeral pane
    setCardState("authorized");
    await sleep(280);
    setCardState("flown-off");
    await sleep(420);
    const set = readAuthorized();
    set.add(fixture.id);
    writeAuthorized(set);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("kairos-encounter:flown-off", {
          detail: { fixtureId: fixture.id },
        })
      );
    }
    const q = fromTab ? `?tab=${encodeURIComponent(fromTab)}` : "";
    router.push(`/dashboard${q}`);
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
    router.push(`/dashboard${q}`);
  }

  const blockAuthorize = !!(paneState.orderPad && paneState.orderPad.hasUnansweredQuestions);
  const flownOff = cardState === "flown-off" || cardState === "authorized";

  return (
    <div
      className={
        "transition-all duration-500 " +
        (cardState === "authorized" ? "opacity-90 -translate-y-1 " : "") +
        (cardState === "flown-off" ? "opacity-0 -translate-y-8 scale-95 " : "")
      }
      style={{ pointerEvents: flownOff ? "none" : undefined }}
    >
      {/* Top strip: back button + pattern label */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handleBack}
          className="text-[12px] text-bone-muted hover:text-bone transition-colors"
        >
          ← Back to dashboard
        </button>
        <span className="kairos-kicker text-bone-muted">
          PATTERN {String(fixture.patternId)} · {fixture.patternName || (pattern && pattern.name)}
        </span>
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
          <SourcePane fixture={fixture} />
        </div>
        <div data-tour-anchor="nurse-note">
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

      <AddContextRow />

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
