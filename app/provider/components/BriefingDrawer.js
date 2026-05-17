// /provider — right-side briefing drawer. Half-screen on desktop, full
// width on mobile. ESC or backdrop click closes. Renders the 12-section
// universal schema across every visit type (post-hospital, routine, new
// patient, annual, device). For routine and lighter visit types section
// 07 (HOSPITAL COURSE & DISCHARGE) is omitted; sections 09–12 fall back
// to scaffolding text when the specialty hasn't yet authored them.
//
// Section 13 (FREE-TEXT QUERY) is a visual-only component per spec — no
// backend tonight.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useTourActive from "@/lib/useTourActive";
import buildBundle from "../lib/buildBundle";
import runAllRules from "../lib/runAllRules";

const SECTION_LABELS = {
  "01": "01 · WHO THIS IS",
  "02": "02 · WHY THEY'RE HERE TODAY",
  "03": "03 · ACTIVE PROBLEMS",
  "04": "04 · CURRENT MEDICATIONS — ARE THEY WORKING",
  "05": "05 · THE LONGITUDINAL STORY",
  "06": "06 · TRENDED DATA THAT MATTERS",
  "07": "07 · HOSPITAL COURSE & DISCHARGE",
  "08": "08 · ALLERGIES",
  "09": "09 · PATTERNS KAIROS SURFACES",
  "10": "10 · RISK CONTEXT",
  "11": "11 · CARE GAPS WORTH ADDRESSING",
  "12": "12 · KAIROS-FLAGGED ITEMS",
};

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin text-amber/80">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Briefly highlight a section anchor with the same gold border the
// tour uses, then remove the class. Matches the /rn SpotlightOverlay
// styling pattern (see globals.css .provider-tour-section-active).
function flashSectionHighlight(sectionId) {
  if (typeof document === "undefined") return;
  const el = document.getElementById("provider-section-" + sectionId);
  if (!el) return;
  el.classList.add("provider-tour-section-active");
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => {
    el.classList.remove("provider-tour-section-active");
  }, 2200);
}

function ChartChat({ briefingId, specialty }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null); // { text, citedSections, notFound }
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  // The chart-query box is only meaningful inside a guided tour, which
  // drives a scripted demo of it. Outside a tour it's hidden entirely so
  // a static visitor never sees a non-functioning feature.
  const tourActive = useTourActive("kairos-provider-tour-active");

  // Reset chat state when the patient changes.
  useEffect(() => {
    setQuestion("");
    setAnswer(null);
    setError(null);
    setLoading(false);
  }, [briefingId]);

  // Tour-driven scripted chat demo. The provider tour dispatches these
  // events at the end of Card 3 to drive a fake question/answer flow
  // without hitting /api/provider-chat. Real user input is unaffected
  // outside the tour.
  useEffect(() => {
    console.log("[chart-chat] tour-event listeners attached", { briefingId });
    function onQuestion(e) {
      const q = (e && e.detail && e.detail.question) || "";
      console.log("[chart-chat] onQuestion", { len: q.length, q });
      setQuestion(q);
      setLoading(false);
      setAnswer(null);
      setError(null);
    }
    function onLoading(e) {
      const v = !!(e && e.detail && e.detail.loading);
      console.log("[chart-chat] onLoading", { loading: v });
      setLoading(v);
      setAnswer(null);
      setError(null);
    }
    function onAnswer(e) {
      const d = (e && e.detail) || {};
      console.log("[chart-chat] onAnswer", {
        textLen: (d.text || "").length,
        cited: d.citedSections,
      });
      setAnswer({
        text: d.text || "",
        citedSections: Array.isArray(d.citedSections) ? d.citedSections : [],
        notFound: !!d.notFound,
      });
      setLoading(false);
      setError(null);
    }
    function onReset() {
      console.log("[chart-chat] onReset");
      setQuestion("");
      setAnswer(null);
      setError(null);
      setLoading(false);
    }
    window.addEventListener("kairos-tour:chat-question", onQuestion);
    window.addEventListener("kairos-tour:chat-loading", onLoading);
    window.addEventListener("kairos-tour:chat-answer", onAnswer);
    window.addEventListener("kairos-tour:chat-reset", onReset);
    return () => {
      console.log("[chart-chat] tour-event listeners detached", { briefingId });
      window.removeEventListener("kairos-tour:chat-question", onQuestion);
      window.removeEventListener("kairos-tour:chat-loading", onLoading);
      window.removeEventListener("kairos-tour:chat-answer", onAnswer);
      window.removeEventListener("kairos-tour:chat-reset", onReset);
    };
  }, [briefingId]);

  const submit = useCallback(async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setAnswer(null);
    setError(null);
    try {
      const res = await fetch("/api/provider-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, briefingId, specialty }),
      });
      if (!res.ok) {
        setError("Could not retrieve answer. Please try again.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setAnswer({
        text: data.answer || "Could not retrieve answer. Please try again.",
        citedSections: Array.isArray(data.citedSections) ? data.citedSections : [],
        notFound: data.notFound === true,
      });
    } catch {
      setError("Could not retrieve answer. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [question, loading, briefingId, specialty]);

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const clear = () => {
    setQuestion("");
    setAnswer(null);
    setError(null);
    if (inputRef.current) inputRef.current.focus();
  };

  // Hidden outside a tour — listeners above stay registered so the box
  // appears the moment a tour starts.
  if (!tourActive) return null;

  return (
    <div
      id="provider-section-13"
      data-section-id="section-13"
      data-tour-anchor="briefing-section-13"
      className="mb-5 scroll-mt-20"
    >
      <div className="border border-mist/60 rounded-md bg-platinum/30 px-3 py-2.5 flex items-center gap-2">
        <SearchIcon className="text-bone-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          data-tour-anchor="chat-input"
          placeholder="Ask anything about this patient's chart..."
          className="bg-transparent border-0 outline-none text-[13px] text-bone placeholder:text-bone-muted/70 flex-1 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !question.trim()}
          data-tour-anchor="chat-submit"
          aria-label="Ask"
          className="text-bone-muted hover:text-amber disabled:opacity-40 disabled:hover:text-bone-muted shrink-0 p-1 rounded-sm transition-colors"
        >
          {loading ? <Spinner /> : <SearchIcon />}
        </button>
      </div>

      {loading && (
        <div className="mt-2 px-3 py-2 text-[12px] text-bone-muted flex items-center gap-2">
          <Spinner />
          <span>Searching chart…</span>
        </div>
      )}

      {error && !loading && (
        <div className="mt-2 px-3 py-2 text-[13px] text-red-400 border border-red-400/30 bg-red-900/10 rounded-md">
          {error}
        </div>
      )}

      {answer && !loading && (
        <div
          className={
            "mt-2 px-3 py-2.5 border rounded-md text-[13px] leading-relaxed " +
            (answer.notFound
              ? "border-mist/40 bg-platinum/20 text-bone-muted"
              : "border-mist/50 bg-platinum/40 text-bone")
          }
        >
          <div>{answer.text}</div>
          {answer.citedSections && answer.citedSections.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {answer.citedSections.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => flashSectionHighlight(s)}
                  className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-amber/60 text-amber hover:bg-amber/10 transition-colors"
                >
                  Section {s}
                </button>
              ))}
              <button
                type="button"
                onClick={clear}
                aria-label="Clear answer"
                className="ml-auto text-[11px] text-bone-muted hover:text-bone px-1.5 py-0.5 rounded-sm hover:bg-platinum transition-colors"
              >
                Clear
              </button>
            </div>
          )}
          {(!answer.citedSections || answer.citedSections.length === 0) && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={clear}
                aria-label="Clear answer"
                className="text-[11px] text-bone-muted hover:text-bone px-1.5 py-0.5 rounded-sm hover:bg-platinum transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// One section block. The anchor ID is what the tour cursor and scroll
// helpers target. Renders nothing if the section's content is null.
function Section({ sectionId, children }) {
  return (
    <section
      id={`provider-section-${sectionId}`}
      data-section-id={`section-${sectionId}`}
      data-tour-anchor={`briefing-section-${sectionId}`}
      className="border-t border-mist/40 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0 scroll-mt-20"
    >
      <h3 className="kairos-kicker text-amber/90 text-[11px] mb-2 uppercase tracking-[0.12em]">
        {SECTION_LABELS[sectionId]}
      </h3>
      <div className="text-[13px] text-bone leading-relaxed">{children}</div>
    </section>
  );
}

// Body — renders a string paragraph or a list of strings.
function Para({ value }) {
  if (!value) return <span className="text-bone-muted/70 italic">—</span>;
  if (typeof value === "string") return <p>{value}</p>;
  return <p>{String(value)}</p>;
}

function BulletList({ items }) {
  if (!items || items.length === 0) {
    return <span className="text-bone-muted/70 italic">—</span>;
  }
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((it, idx) => (
        <li key={idx} className="leading-snug">
          {typeof it === "string" ? it : it.text || JSON.stringify(it)}
        </li>
      ))}
    </ul>
  );
}

// Medication block with rationale, used inside section 04 and inside
// the medication reconciliation subsections of section 07.
function MedList({ items }) {
  if (!items || items.length === 0) {
    return <span className="text-bone-muted/70 italic">—</span>;
  }
  return (
    <ul className="space-y-1">
      {items.map((it, idx) => {
        if (typeof it === "string") {
          return (
            <li key={idx} className="leading-snug text-bone">
              {it}
            </li>
          );
        }
        return (
          <li key={idx} className="leading-snug">
            <span className="text-bone">{it.med}</span>
            {it.rationale ? (
              <span className="text-bone-muted"> — {it.rationale}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function MedRecGroup({ label, items }) {
  return (
    <div className="mt-2 first:mt-0">
      <div className="text-[11px] uppercase tracking-wider text-bone-muted mb-1">
        {label}
      </div>
      <MedList items={items} />
    </div>
  );
}

function Section04Body({ briefing }) {
  // Either an array of strings / {med, rationale} objects, or a richer
  // object with a paragraph + items.
  const meds = briefing.currentMedications;
  if (!meds) return <span className="text-bone-muted/70 italic">—</span>;
  if (Array.isArray(meds)) return <MedList items={meds} />;
  return (
    <div className="space-y-2">
      {meds.preamble ? <p>{meds.preamble}</p> : null}
      <MedList items={meds.items} />
      {meds.note ? (
        <p className="text-bone-muted text-[12px] mt-2">{meds.note}</p>
      ) : null}
    </div>
  );
}

function Section05Body({ briefing }) {
  const story = briefing.longitudinalStory;
  if (!story) return <span className="text-bone-muted/70 italic">—</span>;
  if (typeof story === "string") return <p>{story}</p>;
  return (
    <div className="space-y-3">
      {story.lastVisit ? (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-bone-muted mb-1">
            Last visit with us
          </div>
          <p>{story.lastVisit}</p>
        </div>
      ) : null}
      {story.activitySince && story.activitySince.length > 0 ? (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-bone-muted mb-1">
            Activity since
          </div>
          <BulletList items={story.activitySince} />
        </div>
      ) : null}
      {story.didTheyDoWhatWeAsked ? (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-bone-muted mb-1">
            Did they do what we asked
          </div>
          <p>{story.didTheyDoWhatWeAsked}</p>
        </div>
      ) : null}
      {story.pendingFromInpatient ? (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-bone-muted mb-1">
            Pending from inpatient team
          </div>
          <p>{story.pendingFromInpatient}</p>
        </div>
      ) : null}
    </div>
  );
}

function Section06Body({ briefing }) {
  const t = briefing.trendedData;
  if (!t) return <span className="text-bone-muted/70 italic">—</span>;
  if (typeof t === "string") return <p>{t}</p>;
  if (Array.isArray(t)) return <BulletList items={t} />;
  // Object with named groups → key/value list
  return (
    <div className="space-y-3">
      {Object.entries(t).map(([k, v]) => (
        <div key={k}>
          <div className="text-[11px] uppercase tracking-wider text-bone-muted mb-1">
            {k}
          </div>
          {Array.isArray(v) ? <BulletList items={v} /> : <p>{v}</p>}
        </div>
      ))}
    </div>
  );
}

function Section07Body({ briefing }) {
  const h = briefing.hospitalCourse;
  if (!h) return null;
  if (typeof h === "string") return <p>{h}</p>;
  return (
    <div className="space-y-3">
      {h.summary ? <p>{h.summary}</p> : null}
      {h.procedures && h.procedures.length > 0 ? (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-bone-muted mb-1">
            Procedures
          </div>
          <MedList items={h.procedures.map((p) => ({ med: p.name, rationale: p.rationale }))} />
        </div>
      ) : null}
      {h.medChanges ? (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-bone-muted mb-1">
            Medication changes
          </div>
          <MedRecGroup label="Added" items={h.medChanges.added} />
          <MedRecGroup label="Stopped" items={h.medChanges.stopped} />
          <MedRecGroup label="Adjusted" items={h.medChanges.adjusted} />
        </div>
      ) : null}
      {h.significantFindings ? (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-bone-muted mb-1">
            Significant findings
          </div>
          <p>{h.significantFindings}</p>
        </div>
      ) : null}
      {h.consultRecommendations && h.consultRecommendations.length > 0 ? (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-bone-muted mb-1">
            Consult recommendations
          </div>
          <BulletList items={h.consultRecommendations} />
        </div>
      ) : null}
      {h.pendingAtDischarge && h.pendingAtDischarge.length > 0 ? (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-bone-muted mb-1">
            Pending at discharge
          </div>
          <BulletList items={h.pendingAtDischarge} />
        </div>
      ) : null}
      {h.outsideData ? (
        <div data-section-id="section-07-outside-data">
          <div className="text-[11px] uppercase tracking-wider text-bone-muted mb-1">
            Outside data (Care Everywhere)
          </div>
          <p>{h.outsideData}</p>
        </div>
      ) : null}
    </div>
  );
}

function Section12Body({ briefing }) {
  const items = briefing.kairosFlags;
  if (!items || items.length === 0) {
    return <span className="text-bone-muted/70 italic">—</span>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((f, idx) => (
        <li key={idx} className="leading-snug flex gap-2">
          <span className="text-amber mt-0.5 shrink-0">▸</span>
          <span>{typeof f === "string" ? f : f.text}</span>
        </li>
      ))}
    </ul>
  );
}

function Section09Findings({ findings, fallback }) {
  if (!findings || findings.length === 0) {
    if (fallback) return <p>{fallback}</p>;
    return <p className="text-bone-muted italic">No deterministic-rule findings on this chart.</p>;
  }
  return (
    <ul className="space-y-2">
      {findings.map((f, idx) => {
        const isInfo = f.status === "contraindicated" || f.severity === "info";
        const toneBox = isInfo
          ? "border border-teal/60 bg-teal/10"
          : "border border-amber/50 bg-amber/10";
        const toneLabel = isInfo ? "text-teal" : "text-amber";
        const toneLabelMuted = isInfo ? "text-teal/80" : "text-amber/80";
        const ruleLabel = f.subcategory || f.ruleId || "rule";
        return (
          <li
            key={f.ruleId + ":" + idx}
            data-finding-status={f.status}
            data-finding-severity={f.severity}
            className={`rounded ${toneBox} px-3 py-2`}
          >
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider mb-1">
              <span className={toneLabel}>{ruleLabel}</span>
              <span className={toneLabelMuted}>{String(f.status).replace(/-/g, " ")}</span>
            </div>
            <p className="text-[13px] leading-snug text-bone">{f.summary}</p>
            {f.recommendation && (
              <p className="text-[12px] leading-snug text-bone-muted mt-1.5">{f.recommendation}</p>
            )}
            {f.ruleName && (
              <p className="text-[10.5px] leading-snug text-bone-muted/80 mt-1.5 italic">
                Source: {f.ruleName}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function BriefingBody({ briefing, briefingId, findings }) {
  if (!briefing) return null;
  const showHospital = briefing.kind === "postHospital";
  return (
    <>
      <Section sectionId="01">
        <Para value={briefing.whoThisIs} />
      </Section>
      <Section sectionId="02">
        <Para value={briefing.whyHereToday} />
      </Section>
      <Section sectionId="03">
        {Array.isArray(briefing.activeProblems) ? (
          <BulletList items={briefing.activeProblems} />
        ) : (
          <Para value={briefing.activeProblems} />
        )}
      </Section>
      <Section sectionId="04">
        <Section04Body briefing={briefing} />
      </Section>
      <Section sectionId="05">
        <Section05Body briefing={briefing} />
      </Section>
      <Section sectionId="06">
        <Section06Body briefing={briefing} />
      </Section>
      {showHospital && (
        <Section sectionId="07">
          <Section07Body briefing={briefing} />
        </Section>
      )}
      <Section sectionId="08">
        <Para value={briefing.allergies} />
      </Section>
      <Section sectionId="09">
        <Section09Findings findings={findings} fallback={briefing.patternsKairosSurfaces} />
      </Section>
      <Section sectionId="10">
        <Para value={briefing.riskContext} />
      </Section>
      <Section sectionId="11">
        {Array.isArray(briefing.careGaps) ? (
          <BulletList items={briefing.careGaps} />
        ) : (
          <Para value={briefing.careGaps} />
        )}
      </Section>
      <Section sectionId="12">
        <Section12Body briefing={briefing} />
      </Section>
    </>
  );
}

export default function BriefingDrawer({ open, visit, briefing, briefingId, specialty, onClose }) {
  const closeBtnRef = useRef(null);
  const findings = visit ? runAllRules(buildBundle(visit)) : [];

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    if (closeBtnRef.current) closeBtnRef.current.focus();
    // Issue 4 fix — lock body scroll while drawer is open so the page's
    // own scrollbar disappears. The drawer's aside owns scrolling.
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [open, onClose]);

  if (!visit) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={
          "fixed inset-0 bg-graphite/60 backdrop-blur-[1px] z-30 transition-opacity " +
          (open ? "opacity-100" : "opacity-0 pointer-events-none")
        }
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Visit briefing for ${visit.name}`}
        data-tour-anchor="briefing-drawer"
        id="provider-briefing-drawer"
        style={{ backgroundColor: "#0B0E13" }}
        className={
          // Issue 2 fix — full viewport width on every breakpoint. The
          // briefing IS the surface during the tour; the schedule
          // doesn't need to remain visible behind it. Issue 7 fix —
          // explicit kairos-graphite hex covers any /60 opacity drift
          // and guarantees no schedule bleed-through during late beats.
          "fixed top-0 right-0 bottom-0 z-40 w-full " +
          "border-l border-mist/60 shadow-2xl overflow-y-auto " +
          "transition-transform duration-300 ease-out " +
          (open ? "translate-x-0" : "translate-x-full")
        }
      >
        <header className="sticky top-0 z-10 border-b border-mist/60 bg-graphite px-6 py-4 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="kairos-kicker text-amber/80 text-[11px] mb-1">
              {visit.time} · {visit.visitType}
              {visit.context ? <> · {visit.context}</> : null}
            </div>
            <h2 className="text-bone text-[18px] font-medium leading-tight truncate">
              {visit.name}
              <span className="text-bone-muted font-normal ml-2 text-[14px]">
                {visit.age}{visit.sex}
              </span>
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close briefing"
            className="text-bone-muted hover:text-bone p-1 rounded-sm hover:bg-platinum transition-colors"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="px-6 py-5">
          {/* Section 13 — chart-grounded chat */}
          <ChartChat briefingId={briefingId} specialty={specialty} />

          {briefing ? (
            <BriefingBody briefing={briefing} briefingId={briefingId} findings={findings} />
          ) : (
            <div className="text-[13px] text-bone-muted italic">
              No briefing available for this visit.
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
