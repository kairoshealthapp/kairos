// Phase 3.3 — Source Pane (top-left). Read-only display of the source
// artifact. Pinned for verification while the nurse reviews the HVC draft.

"use client";

export default function SourcePane({ fixture }) {
  const a = fixture.sourceArtifact || {};
  const thread = Array.isArray(a.threadHistory) ? a.threadHistory : null;
  const auth = fixture.authState; // Pattern 13 carries denial-cascade chain

  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker text-amber/80">SOURCE</span>
        <span className="text-[11px] text-bone-muted">{a.timestamp || ""}</span>
      </header>
      <div className="text-[12px] text-bone-muted mb-2">
        <strong className="text-bone-muted">{a.type}</strong>
        {a.author ? <span> · {a.author}</span> : null}
      </div>

      {auth ? (
        <div className="mb-3 border-l-2 border-oxblood/60 pl-3">
          <div className="kairos-kicker text-oxblood/80 mb-1">
            DENIAL CASCADE — {auth.current.replace(/_/g, " ")}
          </div>
          {auth.deadline ? (
            <div className="text-[11px] text-amber mb-2">
              Peer-to-peer deadline: {new Date(auth.deadline).toLocaleString()}
            </div>
          ) : null}
          <ol className="text-[12px] text-bone-muted space-y-1 list-decimal list-inside">
            {auth.chain.map((c, i) => (
              <li key={i}>
                <span className="text-bone-muted/80">{c.date}</span> · {c.event}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="text-[13px] text-bone leading-relaxed whitespace-pre-wrap flex-1 overflow-auto">
        {a.body}
      </div>

      {thread && thread.length ? (
        <details className="mt-3 text-[12px] text-bone-muted">
          <summary className="cursor-pointer hover:text-bone">
            +{thread.length} earlier messages in thread
          </summary>
          <ul className="mt-2 space-y-2">
            {thread.map((t, i) => (
              <li key={i} className="border-l border-mist/60 pl-2">
                <div className="text-[11px] text-bone-muted/70">
                  {t.at} · {t.from}
                </div>
                <div className="text-[12px] text-bone whitespace-pre-wrap">{t.text}</div>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
