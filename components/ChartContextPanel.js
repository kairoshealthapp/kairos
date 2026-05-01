// Phase 3.6 — Chart Context Panel.
// Renders auto-pulled chart context (problem list, meds, allergies,
// recent labs/procedures, last 2 provider notes) as a structured
// kairos-card panel for triage encounters.

"use client";

export default function ChartContextPanel({ chartContext }) {
  const ctx = chartContext || {};
  const problemList = ctx.problemList || [];
  const meds = ctx.meds || [];
  const allergies = ctx.allergies || [];
  const recentLabs = ctx.recentLabs || [];
  const recentProcedures = ctx.recentProcedures || [];
  const recentNotes = ctx.recentNotes || [];

  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker text-amber/80">CHART CONTEXT</span>
        <span className="text-[11px] text-bone-muted">Auto-pulled</span>
      </header>

      <div className="flex-1 overflow-auto text-[12px] text-bone leading-relaxed space-y-3 pr-1">
        {problemList.length ? (
          <div>
            <div className="kairos-kicker text-bone-muted/80 mb-1">PROBLEM LIST</div>
            <ul className="list-disc list-inside space-y-0.5">
              {problemList.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {meds.length ? (
          <div>
            <div className="kairos-kicker text-bone-muted/80 mb-1">MEDICATIONS</div>
            <ul className="list-disc list-inside space-y-0.5">
              {meds.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {allergies.length ? (
          <div>
            <div className="kairos-kicker text-bone-muted/80 mb-1">ALLERGIES</div>
            <div>{allergies.join(", ")}</div>
          </div>
        ) : null}

        {recentLabs.length ? (
          <div>
            <div className="kairos-kicker text-bone-muted/80 mb-1">RECENT LABS</div>
            <ul className="space-y-0.5">
              {recentLabs.map((l, i) => (
                <li key={i}>
                  <span className="text-bone-muted">{l.date}</span>{" "}
                  <strong className="text-bone">{l.name}</strong>
                  {l.value ? <span> — {l.value}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {recentProcedures.length ? (
          <div>
            <div className="kairos-kicker text-bone-muted/80 mb-1">RECENT PROCEDURES</div>
            <ul className="space-y-0.5">
              {recentProcedures.map((p, i) => (
                <li key={i}>
                  <span className="text-bone-muted">{p.date}</span>{" "}
                  <strong className="text-bone">{p.name}</strong>
                  {p.provider ? <span className="text-bone-muted"> · {p.provider}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {recentNotes.length ? (
          <div>
            <div className="kairos-kicker text-bone-muted/80 mb-1">RECENT NOTES</div>
            <ul className="space-y-2">
              {recentNotes.map((n, i) => (
                <li key={i} className="border-l border-mist/60 pl-2">
                  <div className="text-[11px] text-bone-muted">
                    {n.date} · {n.author}
                  </div>
                  <div className="text-[12px] text-bone">{n.summary}</div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!problemList.length &&
        !meds.length &&
        !allergies.length &&
        !recentLabs.length &&
        !recentProcedures.length &&
        !recentNotes.length ? (
          <span className="text-bone-muted/60 italic">
            — no chart context provided —
          </span>
        ) : null}
      </div>
    </section>
  );
}
