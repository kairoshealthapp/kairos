// Phase 3.6 — Triage Encounter (Stream 1).
// State-machined view of the four-stage clinical reasoning workflow:
//   Stage 1: assessment generation (empty assessment + response panels)
//   Stage 2: response capture (structured input form / MyChart preview)
//   Stage 3: SBAR ready (mock-prefilled responses visible)
//   Stage 4: SBAR + routing + authorize
//
// Stage transitions are mock — clicking a button advances local state.
// Auto-saves the current responses object to localStorage on change
// (debounced 300ms) under a fixture-scoped key.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SourcePane from "./SourcePane";
import ChartContextPanel from "./ChartContextPanel";
import PatientAssessmentPanel from "./PatientAssessmentPanel";
import SBARNotePanel from "./SBARNotePanel";
import RoutingPanel from "./RoutingPanel";

const STORAGE_PREFIX = "kairos.triage.responses.v1.";

function ResponseDisplay({ assessment, responses, notes }) {
  const list = assessment || [];
  const r = responses || {};
  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker kairos-kicker-strong text-amber/80">
          PATIENT RESPONSE
        </span>
        <span className="text-[11px] text-bone-muted">Captured</span>
      </header>
      {!list.length || !Object.keys(r).length ? (
        <div className="flex-1 flex items-center justify-center text-bone-muted/60 italic text-[13px]">
          — empty — captured after patient responds —
        </div>
      ) : (
        <div className="flex-1 overflow-auto pr-1 space-y-2.5 text-[12px]">
          {list.map((q, idx) => {
            const resp = r[q.id];
            if (!resp) return null;
            const value = Array.isArray(resp.value) ? resp.value.join(", ") : resp.value;
            const display =
              q.inputType === "number_unit" && resp.unit
                ? `${resp.value} ${resp.unit}`
                : value;
            return (
              <div key={q.id}>
                <div className="text-bone-muted">
                  <span className="mr-1">{idx + 1}.</span>
                  {q.text}
                </div>
                <div className="text-bone ml-4">
                  → {display ?? <span className="italic text-bone-muted/60">no response</span>}
                </div>
                {resp.followUp ? (
                  <div className="text-bone ml-4">
                    <span className="text-bone-muted">↳ {q.followUp?.text}</span>{" "}
                    <span>{resp.followUp}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
          {notes ? (
            <div className="pt-2 border-t border-mist/60">
              <div className="text-bone-muted">Additional notes</div>
              <div className="text-bone ml-4">{notes}</div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function ActionButton({ onClick, children, primary, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        primary
          ? "px-4 py-2 rounded-sm text-[13px] bg-amber/90 text-platinum hover:bg-amber transition-colors disabled:opacity-50"
          : "px-4 py-2 rounded-sm text-[13px] border border-mist/60 text-bone hover:border-amber/60 hover:text-bone transition-colors disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}

export default function TriageEncounter({ fixture }) {
  const [stage, setStage] = useState(1);
  const mychartActive =
    (fixture.mychartStatus || "").toLowerCase() === "active";
  const [mode, setMode] = useState(mychartActive ? "mychart" : "phone");
  const [responses, setResponses] = useState({});
  const [notes, setNotes] = useState("");
  const saveTimerRef = useRef(null);

  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}${fixture.slug || fixture.id}`,
    [fixture]
  );

  // Hydrate responses from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setResponses(parsed.responses || {});
        setNotes(parsed.notes || "");
      }
    } catch (e) {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Debounced auto-save.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ responses, notes })
        );
      } catch (e) {
        /* noop */
      }
    }, 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [responses, notes, storageKey]);

  const handleResponseChange = useCallback((id, value) => {
    setResponses((prev) => ({ ...prev, [id]: value }));
  }, []);

  // Move to stage 3: load mock prefilled responses from fixture.
  const captureMockResponses = useCallback(() => {
    const mock = fixture.mockResponses || {};
    const next = {};
    let mockNotes = "";
    Object.keys(mock).forEach((k) => {
      if (k === "notes") {
        mockNotes = mock[k];
        return;
      }
      next[k] = mock[k];
    });
    setResponses(next);
    setNotes(mockNotes);
    setStage(3);
  }, [fixture]);

  const assessment = stage >= 2 ? fixture.assessment || [] : [];
  const sbar = fixture.sbar || {};

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[480px]">
        <SourcePane fixture={fixture} />
        <PatientAssessmentPanel
          assessment={assessment}
          mode={mode}
          responses={responses}
          onResponseChange={handleResponseChange}
          notes={notes}
          onNotesChange={setNotes}
          readOnly={stage >= 3}
        />
        <ChartContextPanel chartContext={fixture.chartContext} />
        <ResponseDisplay assessment={assessment} responses={stage >= 3 ? responses : {}} notes={stage >= 3 ? notes : ""} />
      </div>

      {stage >= 4 ? (
        <>
          <SBARNotePanel sbar={sbar} />
          <RoutingPanel routing={fixture.routing} />
        </>
      ) : null}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="kairos-kicker text-bone-muted/80 mr-2">
          STAGE {stage} OF 4
        </span>

        {stage === 1 ? (
          <>
            <ActionButton primary onClick={() => setStage(2)}>
              Generate Patient Assessment
            </ActionButton>
            <ActionButton onClick={() => {}}>Defer</ActionButton>
            <ActionButton onClick={() => {}}>Reject</ActionButton>
          </>
        ) : null}

        {stage === 2 ? (
          <>
            {mychartActive && mode === "mychart" ? (
              <>
                <ActionButton primary onClick={captureMockResponses}>
                  Send via MyChart
                </ActionButton>
                <ActionButton onClick={() => setMode("phone")}>
                  Switch to phone-call mode
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton primary onClick={captureMockResponses}>
                  Phone call mode
                </ActionButton>
                {mychartActive ? (
                  <ActionButton onClick={() => setMode("mychart")}>
                    Switch to MyChart
                  </ActionButton>
                ) : null}
              </>
            )}
            <ActionButton onClick={() => {}}>Defer</ActionButton>
            <ActionButton onClick={() => {}}>Reject</ActionButton>
            <ActionButton onClick={() => setStage(1)}>Edit Assessment</ActionButton>
          </>
        ) : null}

        {stage === 3 ? (
          <>
            <ActionButton primary onClick={() => setStage(4)}>
              Synthesize SBAR
            </ActionButton>
            <ActionButton onClick={() => {}}>Defer</ActionButton>
            <ActionButton onClick={() => {}}>Reject</ActionButton>
            <ActionButton onClick={() => setStage(2)}>Edit Responses</ActionButton>
            <ActionButton onClick={() => setStage(2)}>Re-inquire</ActionButton>
          </>
        ) : null}

        {stage === 4 ? (
          <>
            <ActionButton primary onClick={() => {}}>
              Authorize → forward to provider
            </ActionButton>
            <ActionButton onClick={() => setStage(3)}>Edit</ActionButton>
            <ActionButton onClick={() => {}}>Defer</ActionButton>
            <ActionButton onClick={() => {}}>Reject</ActionButton>
          </>
        ) : null}
      </div>
    </div>
  );
}
