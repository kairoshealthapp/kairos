// Phase-3.6 â€” Specialized SOURCE panel for INR ROUTINE pattern fixtures
// (Crider) and the Maundrell contradiction variant. Replaces the standard
// SourcePane when fixture.pattern === "inr-routine" or
// fixture.patternName === "INR ROUTINE" or fixture.contradictionHold === true.

"use client";

// Parse a target-range string like "2.0 â€“ 3.0" or "2.0 - 3.0 (conventional...)"
// into [min, max] numbers. Returns null if it can't.
function parseTargetRange(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*[â€“\-â€”]\s*(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lo = parseFloat(m[1]);
  const hi = parseFloat(m[2]);
  if (Number.isNaN(lo) || Number.isNaN(hi)) return null;
  return [lo, hi];
}

function classifyValue(value, range) {
  if (range == null || value == null) return "unknown";
  const [lo, hi] = range;
  if (value >= lo && value <= hi) return "in";
  const tenLo = lo * 0.9;
  const tenHi = hi * 1.1;
  if (value >= tenLo && value <= tenHi) return "mild";
  return "out";
}

function colorFor(classification) {
  if (classification === "in") return "var(--kairos-sage)";
  if (classification === "mild") return "var(--kairos-amber)";
  if (classification === "out") return "var(--kairos-oxblood)";
  return "var(--kairos-bone)";
}

function Sparkline({ trend, range }) {
  if (!Array.isArray(trend) || trend.length === 0) return null;
  const W = 280;
  const H = 80;
  const padX = 8;
  const padY = 8;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const values = trend.map((p) => p.value);
  let yMin = Math.min(...values);
  let yMax = Math.max(...values);
  if (range) {
    yMin = Math.min(yMin, range[0]);
    yMax = Math.max(yMax, range[1]);
  }
  // Pad y-axis slightly
  const yPad = (yMax - yMin) * 0.15 || 0.5;
  yMin -= yPad;
  yMax += yPad;

  const xFor = (i) =>
    trend.length === 1
      ? padX + innerW / 2
      : padX + (innerW * i) / (trend.length - 1);
  const yFor = (v) => padY + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const points = trend.map((p, i) => ({ x: xFor(i), y: yFor(p.value), v: p.value, d: p.date }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

  // Reference range band
  let bandY = null;
  let bandH = null;
  if (range) {
    const yHi = yFor(range[1]);
    const yLo = yFor(range[0]);
    bandY = yHi;
    bandH = yLo - yHi;
  }

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="INR trend sparkline"
      style={{ display: "block" }}
    >
      {bandY != null ? (
        <rect
          x={padX}
          y={bandY}
          width={innerW}
          height={bandH}
          fill="rgba(110, 188, 135, 0.15)"
          stroke="rgba(110, 188, 135, 0.35)"
          strokeDasharray="2 2"
          strokeWidth="0.5"
        />
      ) : null}
      <path d={pathD} fill="none" stroke="var(--kairos-bone)" strokeWidth="1.25" />
      {points.map((p, i) => {
        const isLast = i === points.length - 1;
        const cls = classifyValue(p.v, range);
        const fill = isLast ? colorFor(cls) : "var(--kairos-bone-muted)";
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={isLast ? 3.5 : 1.75}
            fill={fill}
            stroke={isLast ? "var(--kairos-bone)" : "none"}
            strokeWidth={isLast ? 0.75 : 0}
          />
        );
      })}
    </svg>
  );
}

export default function INRSourcePanel({ fixture }) {
  if (!fixture) return null;
  const a = fixture.sourceArtifact || {};
  const range = parseTargetRange(fixture.targetRange);
  const trend = Array.isArray(fixture.inrTrend) ? fixture.inrTrend : [];
  const latest = trend.length ? trend[trend.length - 1] : null;
  const latestClass = latest ? classifyValue(latest.value, range) : "unknown";
  const latestColor = colorFor(latestClass);

  const reversed = trend.slice().reverse();
  const isContradiction = fixture.contradictionHold === true;
  const reply = fixture.mychartReply;

  return (
    <section className="kairos-card p-4 h-full flex flex-col overflow-auto">
      <header className="flex items-center justify-between mb-2">
        <span className="kairos-kicker text-amber/80">SOURCE</span>
        <span className="text-[11px] text-bone-muted">{a.resultedAt || a.timestamp || ""}</span>
      </header>

      {isContradiction ? (
        <div className="mb-3">
          {reply ? (
            <div
              className="mb-2 border-l-2 pl-3 py-2"
              style={{ borderColor: "var(--kairos-amber)" }}
            >
              <div className="kairos-kicker text-amber/80 mb-1">
                MyChart Reply (re: outbound INR overdue template 4/24)
              </div>
              <div className="text-[11px] text-bone-muted mb-1">{reply.timestamp}</div>
              <blockquote
                className="text-[13px] text-bone italic leading-relaxed"
                style={{ borderLeft: "none" }}
              >
                â€œ{reply.patientText}â€
              </blockquote>
            </div>
          ) : null}
          <div
            className="border rounded-sm p-2 mb-3"
            style={{
              borderColor: "var(--kairos-oxblood)",
              background: "rgba(185, 28, 28, 0.08)",
            }}
          >
            <div
              className="kairos-kicker mb-1"
              style={{ color: "var(--kairos-oxblood)" }}
            >
              CONTRADICTION HOLD
            </div>
            <div className="text-[12px] text-bone leading-relaxed">
              Patient reports being told to discontinue warfarin. Chart shows
              active warfarin order. Forward to ordering provider for
              verification before drafting any patient-facing reply.
            </div>
          </div>
        </div>
      ) : null}

      {/* Banner: indication / target / agency */}
      <div className="mb-3 text-[12px] text-bone-muted leading-snug">
        {fixture.indication ? (
          <div>
            <span className="text-bone-muted/70">Indication: </span>
            <span className="text-bone">{fixture.indication}</span>
          </div>
        ) : null}
        {fixture.targetRange ? (
          <div>
            <span className="text-bone-muted/70">Target INR: </span>
            <span className="text-bone">{fixture.targetRange}</span>
          </div>
        ) : null}
        {a.resultingAgency ? (
          <div>
            <span className="text-bone-muted/70">Resulting Agency: </span>
            <span className="text-bone">{a.resultingAgency}</span>
          </div>
        ) : null}
      </div>

      {/* Current value */}
      {latest ? (
        <div className="mb-4 flex flex-col items-start">
          <div
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: "32px",
              lineHeight: 1.1,
              color: latestColor,
              fontWeight: 500,
            }}
          >
            INR {latest.value.toFixed(1)}
          </div>
          <div className="text-[11px] text-bone-muted mt-1">
            {a.specimenCollected ? <span>Drawn {a.specimenCollected}</span> : null}
            {a.specimenCollected && a.resultedAt ? <span> Â· </span> : null}
            {a.resultedAt ? <span>Resulted {a.resultedAt}</span> : null}
            {!a.specimenCollected && !a.resultedAt ? <span>{latest.date}</span> : null}
          </div>
        </div>
      ) : null}

      {/* Trend */}
      {trend.length ? (
        <div className="mb-2">
          <div className="kairos-kicker text-bone-muted mb-2">TREND</div>
          <Sparkline trend={trend} range={range} />
          <table className="mt-3 w-full text-[12px]">
            <tbody>
              {reversed.map((p, i) => {
                const cls = classifyValue(p.value, range);
                const flag = cls !== "in" && cls !== "unknown";
                return (
                  <tr key={i} className="border-b border-mist/40">
                    <td className="py-1 text-bone-muted">{p.date}</td>
                    <td className="py-1 text-bone text-right">
                      {p.value.toFixed(1)}
                      {flag ? (
                        <span style={{ color: "var(--kairos-oxblood)" }}> *</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
