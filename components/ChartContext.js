function SectionLabel({ children }) {
  return (
    <h3 className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-faint">
      {children}
    </h3>
  );
}

function Pill({ children, tone = "neutral", className = "" }) {
  const palettes = {
    neutral: "bg-muted text-fg-muted border border-line-faint",
    flagLow:
      "bg-[color:var(--color-flag-low-soft)] text-[color:var(--color-flag-low)] border border-[color:var(--color-flag-low-soft)]",
    flagHigh:
      "bg-[color:var(--color-flag-high-soft)] text-[color:var(--color-flag-high)] border border-[color:var(--color-flag-high-soft)]",
    flagSuccess:
      "bg-[color:var(--color-flag-success-soft)] text-[color:var(--color-flag-success)] border border-[color:var(--color-flag-success-soft)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-[12px] font-medium ${palettes[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

function isPainfulProcedureCondition(name = "") {
  return /painful|tolerated poorly|disaster/i.test(name);
}

function formatEncounterStart(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  if (sameDay) return `Today, ${time}`;
  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(d);
  return `${date}, ${time}`;
}

export default function ChartContext({ chartContext }) {
  if (!chartContext?.patient) {
    return (
      <div className="rounded-card border border-line-faint bg-surface p-5 text-[13px] text-fg-muted">
        No chart context available.
      </div>
    );
  }

  const { patient, encounter, conditions, medications, recentVitals, recentLabs, recentNotes } =
    chartContext;

  const activeMeds = medications?.filter((m) => m.status === "active") || [];
  const stoppedMeds = medications?.filter((m) => m.status === "stopped") || [];

  return (
    <article className="rounded-card border border-line-faint bg-surface">
      <header className="space-y-1 border-b border-line-faint p-5">
        <div
          className="text-[13px] text-fg-faint"
          title={patient.id ? `MRN ${patient.id}` : undefined}
        >
          {patient.gender} · {patient.age}y · DOB {patient.birthDate}
        </div>
        {encounter && (
          <div className="pt-2 text-[13px] text-fg-muted">
            <span className="font-medium text-fg">{encounter.type}</span>
            {encounter.start && (
              <>
                <span className="mx-2 text-fg-faint/60">·</span>
                <span className="text-fg-faint">{formatEncounterStart(encounter.start)}</span>
              </>
            )}
            {encounter.reason && (
              <p className="mt-1 italic text-fg-muted">{encounter.reason}</p>
            )}
          </div>
        )}
      </header>

      <div className="space-y-7 p-5">
        <section className="space-y-2">
          <SectionLabel>Active Problems</SectionLabel>
          {conditions?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {conditions.map((c) => {
                const flagged = isPainfulProcedureCondition(c.name);
                return (
                  <Pill
                    key={c.snomed || c.name}
                    tone="neutral"
                    className={
                      flagged
                        ? "border-l-2 border-l-[color:var(--color-flag-low)]/60"
                        : ""
                    }
                  >
                    {c.name}
                  </Pill>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] text-fg-faint">None on problem list</p>
          )}
        </section>

        <section className="space-y-2">
          <SectionLabel>Active Medications</SectionLabel>
          {activeMeds.length ? (
            <div className="flex flex-wrap gap-1.5">
              {activeMeds.map((m) => (
                <Pill key={m.rxnorm || m.name} tone="neutral">
                  {m.name}
                </Pill>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-fg-faint">None</p>
          )}
        </section>

        {stoppedMeds.length > 0 && (
          <section className="space-y-2">
            <SectionLabel>Recently Stopped</SectionLabel>
            <ul className="space-y-1.5">
              {stoppedMeds.map((m) => (
                <li
                  key={m.rxnorm || m.name}
                  className="text-[13px] text-fg-faint"
                >
                  <span className="line-through decoration-fg-faint/60">{m.name}</span>
                  {m.discontinuedDate && (
                    <span className="ml-2">d/c {m.discontinuedDate}</span>
                  )}
                  {m.statusReason && (
                    <span className="ml-2 italic">— {m.statusReason}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-2">
          <SectionLabel>Recent Labs</SectionLabel>
          {recentLabs?.length ? (
            <ul className="divide-y divide-line-faint">
              {recentLabs.map((o, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 py-2 text-[13px]"
                >
                  <span className="text-fg-muted">{o.name}</span>
                  <span className="font-mono font-medium text-fg">{o.value}</span>
                  <span className="min-w-[1.5rem]">
                    {o.flag === "H" && <Pill tone="flagHigh">H</Pill>}
                    {o.flag === "L" && <Pill tone="flagLow">L</Pill>}
                  </span>
                  <span className="text-[12px] text-fg-faint">{o.date?.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-fg-faint">No recent labs</p>
          )}
        </section>

        <section className="space-y-2">
          <SectionLabel>Recent Vitals</SectionLabel>
          {recentVitals?.length ? (
            <ul className="divide-y divide-line-faint">
              {recentVitals.map((o, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-2 text-[13px]"
                >
                  <span className="text-fg-muted">{o.name}</span>
                  <span className="font-mono font-medium text-fg">{o.value}</span>
                  <span className="text-[12px] text-fg-faint">{o.date?.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-fg-faint">No recent vitals</p>
          )}
        </section>

        <section className="space-y-2">
          <SectionLabel>Recent Notes</SectionLabel>
          {recentNotes?.length ? (
            <ul className="space-y-3">
              {recentNotes.map((d, i) => (
                <NoteCard key={i} note={d} />
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-fg-faint">No recent notes</p>
          )}
        </section>
      </div>
    </article>
  );
}

function NoteCard({ note }) {
  return (
    <li className="rounded-button border border-line-faint p-3">
      <div className="text-[13px] font-medium text-fg">{note.type}</div>
      <div className="mt-0.5 text-[12px] text-fg-faint">
        {note.date?.slice(0, 10)}
        {note.author && (
          <>
            <span className="mx-1.5 text-fg-faint/60">·</span>
            {note.author}
          </>
        )}
      </div>
      <details className="mt-2 group">
        <summary className="cursor-pointer list-none text-[13px] text-fg-muted [&::-webkit-details-marker]:hidden">
          <span className="line-clamp-4 italic group-open:line-clamp-none">
            {note.description}
          </span>
        </summary>
      </details>
    </li>
  );
}
