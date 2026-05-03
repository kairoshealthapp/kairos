// v3.0 Triage Encounter (Fix 9). Rework:
//   - Pre-populated assessment questions (no "Generate Patient Assessment"
//     gate; the AI has already read the chart, so the questions are
//     visible the moment the card opens).
//   - Phone / MyChart channel toggle at the top of the content area.
//   - Phone mode: dual input — free text area at top, structured
//     questions below. Every question individually skippable; no
//     enforced completion. SBAR pane builds in real time from whatever
//     input is captured.
//   - MyChart mode: pre-drafted patient-facing message containing the
//     assessment questions formatted for the patient to answer. Same
//     Reply / Reply+CC / Forward buttons as the standard MyChart panel.
//   - Terminal action collapses the card into the panel-completion
//     pipeline (handled in EncounterDetail via onCardTerminate).
//
// Tour cinematic compatibility: existing kairos-encounter:auto-action
// listener still maps generate-inquiry / process-reply / synthesize-callback
// to the appropriate camera moves and dispatches action-complete.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SourcePane from "./SourcePane";
import PatientAssessmentPanel from "./PatientAssessmentPanel";
import RNNotePanel from "./panels/RNNotePanel";
import CompletedPanel from "./panels/CompletedPanel";
import RecipientPicker from "./panels/RecipientPicker";
import { isCinematicMode } from "@/lib/featureFlags";
import { cameraGoto } from "@/lib/tourCamera";

const STORAGE_PREFIX = "kairos.triage.responses.v1.";

function ChannelToggle({ mode, onChange, mychartActive }) {
  const opt = (id, label, hint) => (
    <button
      key={id}
      type="button"
      onClick={() => onChange(id)}
      disabled={id === "mychart" && !mychartActive}
      title={id === "mychart" && !mychartActive ? "Patient does not have an active MyChart account" : ""}
      className={
        "px-4 py-2 rounded-sm text-[12px] font-medium border-2 transition-colors text-left " +
        (mode === id
          ? "bg-amber border-amber text-graphite shadow-[0_0_0_1px_rgba(245,158,11,0.4)]"
          : "bg-platinum/40 border-mist/60 text-bone-muted hover:border-amber/40 hover:text-bone disabled:opacity-40 disabled:cursor-not-allowed")
      }
    >
      <span className="block">{label}</span>
      <span className={`block text-[10px] mt-0.5 ${mode === id ? "text-graphite/80" : "text-bone-muted/80"}`}>{hint}</span>
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      <span className="kairos-kicker text-bone-muted/80">CHANNEL</span>
      {opt("phone", "Phone call", "Dual input · structured + free text")}
      {opt("mychart", "MyChart message", "Pre-drafted patient prompt")}
    </div>
  );
}

// Compose the SBAR as a single multi-paragraph note suitable for the
// RN Note panel display. Called when the nurse clicks "Generate SBAR"
// after the call ends — the AI synthesizes the four sections from the
// captured free-text + structured responses + chart context. Baseline
// S/B come from the fixture; A/R blend baseline with whatever the
// nurse captured.
function composeSbarText(fixture, responses, notes) {
  const baseline = fixture.sbar || {};
  const responseLines = [];
  const list = fixture.assessment || [];
  list.forEach((q) => {
    const r = responses[q.id];
    if (!r) return;
    const value = Array.isArray(r.value) ? r.value.join(", ") : r.value;
    if (value === undefined || value === "") return;
    responseLines.push(`• ${q.text} → ${value}`);
  });
  const livePart = [
    notes && notes.trim() ? `Free-text: ${notes.trim()}` : null,
    responseLines.length > 0 ? `Captured:\n${responseLines.join("\n")}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
  const a = baseline.a
    ? livePart
      ? `${baseline.a}\n\n${livePart}`
      : baseline.a
    : livePart || "Pending provider review";
  const sections = [
    `S — Situation\n${baseline.s || "Pending provider review"}`,
    `B — Background\n${baseline.b || "Pending provider review"}`,
    `A — Assessment\n${a}`,
    `R — Recommendation\n${baseline.r || "Pending provider review"}`,
  ];
  return sections.join("\n\n");
}

function buildMyChartDraft(fixture) {
  const list = fixture.assessment || [];
  const greeting = `Hi ${fixture.patient?.displayName || "there"},`;
  const intro =
    "Your provider asked us to check in with a few quick questions about how you're feeling. Please reply to this message with your answers — there's no wrong answer, and you can skip any question that doesn't apply.";
  const numbered = list.map((q, i) => `${i + 1}. ${q.text}`).join("\n");
  const closer =
    "Once you reply, a nurse will review and follow up. If anything feels urgent — chest pain, severe shortness of breath, fainting — please call 911 or go to the nearest ER instead of waiting on this message.\n\nBrandon Sterne, RN BSN";
  return [greeting, intro, "", numbered, "", closer].join("\n");
}

export default function TriageEncounter({ fixture, onCardTerminate }) {
  // v3.0 — questions are pre-populated. We keep the legacy stage state
  // for tour compatibility but the UI doesn't gate on it anymore.
  const [stage, setStage] = useState(2);
  const mychartActive = (fixture.mychartStatus || "").toLowerCase() === "active";
  const [mode, setMode] = useState(mychartActive ? "mychart" : "phone");
  const [responses, setResponses] = useState({});
  const [notes, setNotes] = useState("");
  const [picker, setPicker] = useState(null); // null | "cc" | "forward" | "phoneForward"
  const saveTimerRef = useRef(null);

  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}${fixture.slug || fixture.id}`,
    [fixture]
  );

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
    setResponses((prev) => {
      // v3.0 Fix 4b — Skip clears the key entirely so SBAR + display
      // logic don't see a stale undefined entry.
      if (value === undefined || value === null) {
        const { [id]: _drop, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: value };
    });
  }, []);

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

  // v3.0 Master Prompt 2 — refs for responses + notes so the tour
  // auto-action listener (bound once) can compose the SBAR from the
  // latest captured input rather than the stale closure.
  const responsesRef = useRef(responses);
  const notesRef = useRef(notes);
  useEffect(() => { responsesRef.current = responses; }, [responses]);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  // Tour event listener (preserved from prior version so tour cinematic
  // camera + action-complete loop still fire).
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onAutoAction(e) {
      const actionId = e && e.detail && e.detail.actionId;
      const targetFixtureId = e && e.detail && e.detail.fixtureId;
      if (targetFixtureId && targetFixtureId !== fixture.id) return;
      let cinematicTarget = null;
      let cinematicFraming = "tight";
      if (actionId === "generate-inquiry") {
        setStage(2);
        cinematicTarget = '[data-tour-anchor="patient-assessment"]';
      } else if (actionId === "process-reply") {
        captureMockResponses();
        cinematicTarget = '[data-tour-anchor="patient-response"]';
        cinematicFraming = "top";
      } else if (actionId === "synthesize-callback") {
        setStage(4);
        cinematicTarget = '[data-tour-anchor="sbar"]';
      } else if (actionId === "triage.setPhoneMode") {
        // v3.0 Master Prompt 2 / Fix 2c Bug 4 — Reed's fixture has
        // mychartStatus: "Active" so the panel defaults to mychart
        // mode. The tour walks the phone path, so the first triage
        // beat forces the channel to phone before captureMockResponses
        // and generateSbar fire on the (visible) phone-mode UI.
        setMode("phone");
        cinematicTarget = '[data-tour-anchor="patient-assessment"]';
      } else if (actionId === "triage.captureMockResponses") {
        // v3.0 Master Prompt 2 — pre-fill mock responses on Reed so the
        // tour can demonstrate the SBAR build without typing. Dispatches
        // action-complete just like the legacy stages.
        captureMockResponses();
        cinematicTarget = '[data-tour-anchor="patient-assessment"]';
      } else if (actionId === "triage.generateSbar") {
        // Click Generate SBAR — populates the RN Note panel. Composes
        // from the latest responses + notes (via refs) so a prior
        // captureMockResponses landed in the SBAR.
        setSbarText(composeSbarText(fixture, responsesRef.current, notesRef.current));
        cinematicTarget = '[data-tour-anchor="sbar"]';
      } else if (actionId === "triage.forwardSbar") {
        // v3.0 Master Prompt 2 / Fix 2c Bug 4 — terminal Forward in
        // tour mode. Routed through fireTerminate so the triage
        // onCardTerminate (which calls handleAuthorize in tour mode)
        // fires the card fly-off. Recipient is hardcoded to Sterne
        // MD for the tour demo.
        setRnNoteCompleted("SBAR forwarded to Sterne MD");
        // Brief pause so the collapse renders before fly-off; matches
        // the 800ms in handleRnNoteTerminate.
        setTimeout(() => fireTerminate("triage.forward", { recipient: "Sterne MD" }), 600);
        cinematicTarget = '[data-tour-anchor="sbar"]';
      } else {
        return;
      }
      setTimeout(() => {
        if (cinematicTarget && isCinematicMode()) {
          cameraGoto(cinematicTarget, { framing: cinematicFraming, holdMs: 0 });
        }
        window.dispatchEvent(
          new CustomEvent("kairos-encounter:action-complete", {
            detail: { actionId, fixtureId: fixture.id },
          })
        );
      }, 0);
    }
    window.addEventListener("kairos-encounter:auto-action", onAutoAction);
    return () =>
      window.removeEventListener("kairos-encounter:auto-action", onAutoAction);
  }, [fixture.id, captureMockResponses]);

  const assessment = fixture.assessment || [];
  const mychartDraft = useMemo(() => buildMyChartDraft(fixture), [fixture]);

  // v3.0 Fix 1d — phone path no longer builds the SBAR in real time.
  // The nurse captures responses during the call; when ready they
  // click Generate SBAR and the synthesized SBAR populates the RN
  // Note panel for review + Forward.
  const [sbarText, setSbarText] = useState("");
  const [rnNoteCompleted, setRnNoteCompleted] = useState(null);

  function handleGenerateSbar() {
    setSbarText(composeSbarText(fixture, responses, notes));
  }

  function fireTerminate(kind, extra) {
    if (!onCardTerminate) return;
    onCardTerminate({ kind, ...extra });
  }

  function handleRnNoteTerminate(event) {
    const kind = event && event.kind;
    const recipient = event && event.recipient;
    if (kind === "rnNote.forward") {
      const summary = recipient ? `SBAR forwarded to ${recipient}` : "SBAR forwarded";
      setRnNoteCompleted(summary);
      // Pause briefly so the nurse sees the collapse, then fire the
      // card-level finish.
      setTimeout(() => fireTerminate("triage.forward", { recipient }), 800);
      return;
    }
    if (kind === "rnNote.done") {
      setRnNoteCompleted("SBAR signed");
      setTimeout(() => fireTerminate("triage.done"), 800);
    }
  }

  // Bookends Pass / A1: detect tour mode so we can reserve the same
  // 280px right gutter as EncounterDetail. Card 6 (Reed triage) renders
  // through this component, so the HUD-overlap fix has to apply here
  // too or RN-Note text on the right column gets clipped.
  const triageTourMode =
    typeof window !== "undefined" &&
    (new URLSearchParams(window.location.search).get("tour") === "1" ||
      sessionStorage.getItem("kairos-tour-active") === "1");

  return (
    <div className="flex flex-col gap-4 p-4">
      <ChannelToggle mode={mode} onChange={setMode} mychartActive={mychartActive} />

      <div
        className={
          "grid grid-cols-1 lg:grid-cols-2 gap-4 items-start" +
          (triageTourMode ? " lg:pr-[280px]" : "")
        }
      >
        <div data-tour-anchor="source-pane">
          <SourcePane fixture={fixture} />
        </div>
        {mode === "phone" ? (
          <>
            <div data-tour-anchor="patient-assessment">
              <PatientAssessmentPanel
                assessment={assessment}
                mode="phone"
                responses={responses}
                onResponseChange={handleResponseChange}
                notes={notes}
                onNotesChange={setNotes}
                readOnly={false}
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateSbar}
                  data-tour-button="triage.generateSbar"
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-sm bg-amber text-graphite hover:bg-amber/90 transition-colors"
                >
                  Generate SBAR
                </button>
                <span className="text-[11px] text-bone-muted italic">
                  {sbarText
                    ? "SBAR drafted in the RN Note panel — review and Forward to provider."
                    : "Click when the call ends — SBAR drafts from your captured input."}
                </span>
              </div>
            </div>
            <div data-tour-anchor="sbar">
              {rnNoteCompleted ? (
                <CompletedPanel label="RN Note" summary={rnNoteCompleted} />
              ) : (
                <RNNotePanel
                  content={sbarText}
                  isTyping={false}
                  tourMode={false}
                  onTerminate={handleRnNoteTerminate}
                />
              )}
              {!sbarText && !rnNoteCompleted ? (
                <div className="text-[11px] text-bone-muted/70 italic mt-2">
                  SBAR will generate when you're ready — click Generate SBAR after the call.
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="lg:col-span-2" data-tour-anchor="patient-assessment">
            <section className="kairos-card p-4 flex flex-col overflow-hidden relative">
              <header className="flex items-center justify-between mb-2">
                <span className="kairos-kicker kairos-kicker-strong text-amber/80">
                  MYCHART MESSAGE
                </span>
                <span className="text-[11px] text-bone-muted">Pre-drafted patient prompt</span>
              </header>
              <dl className="text-[12px] text-bone-muted grid grid-cols-[88px_1fr] gap-x-3 gap-y-1 mb-3">
                <dt>Recipient</dt>
                <dd className="text-bone">{fixture.patient?.displayName || fixture.patient?.name}</dd>
                <dt>Notify by</dt>
                <dd className="text-bone">2 business days</dd>
              </dl>
              <div className="border-t border-mist/40 pt-3 flex-1 overflow-auto text-[13px] text-bone leading-relaxed whitespace-pre-wrap">
                {mychartDraft}
              </div>
              <div className="mt-3 pt-3 border-t border-mist/40 flex items-center gap-2 flex-wrap relative">
                <button
                  type="button"
                  onClick={() => fireTerminate("myChart.reply")}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-sm bg-amber text-graphite hover:bg-amber/90 transition-colors"
                >
                  Reply
                </button>
                <button
                  type="button"
                  onClick={() => setPicker("cc")}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-sm bg-platinum/60 text-bone border border-mist/60 hover:bg-platinum hover:border-amber/60 transition-colors"
                >
                  Reply + CC
                </button>
                <button
                  type="button"
                  onClick={() => setPicker("forward")}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-sm bg-platinum/60 text-bone border border-mist/60 hover:bg-platinum hover:border-amber/60 transition-colors"
                >
                  Forward
                </button>
                <RecipientPicker
                  open={picker === "cc"}
                  multi
                  onConfirm={(cc) => {
                    setPicker(null);
                    fireTerminate("myChart.replyCc", { cc });
                  }}
                  onCancel={() => setPicker(null)}
                  title="CC clinicians"
                />
                <RecipientPicker
                  open={picker === "forward"}
                  onConfirm={(recipient) => {
                    setPicker(null);
                    fireTerminate("myChart.forward", { recipient });
                  }}
                  onCancel={() => setPicker(null)}
                  title="Forward to clinician"
                />
              </div>
            </section>
          </div>
        )}
      </div>

      {/* v3.0 Fix 1d — phone-mode terminal action moved into the RN
          Note panel itself (Forward button on the populated SBAR).
          The bottom "Forward SBAR" bar is no longer needed. */}
    </div>
  );
}
