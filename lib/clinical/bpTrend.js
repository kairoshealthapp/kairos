// Home BP log trend analysis. Inputs are an array of readings as captured
// from a paper log (eventually OCR'd, in v1 hand-entered for the demo).
// Output is a clinically meaningful summary that feeds two consumers:
// - The BPLogTable UI (header stats + outlier highlighting)
// - The chart-aware question generator and SBAR regenerator (as part of
//   chartContext.bpLog.summary so the model sees the trend, not 25 raw rows)
//
// Definitions used here are the conservative ones for outpatient HTN in the
// uncontrolled-but-not-emergent range. Stage 2 HTN is SBP >= 140 or DBP >= 90.
// "Severe" SBP is >= 160 (one of several thresholds that warrant outreach).

const SEVERE_SBP = 160;
const STAGE_2_SBP = 140;
const ELEVATED_SBP = 150; // bucket between stage 2 and severe — the one we color amber

/**
 * @typedef {Object} BPReading
 * @property {string} date - YYYY-MM-DD
 * @property {string} time - HH:mm
 * @property {number} sbp
 * @property {number} dbp
 * @property {string} note
 */

/**
 * @typedef {Object} BPSignificantReading
 * @property {string} date
 * @property {string} time
 * @property {number} sbp
 * @property {number} dbp
 * @property {string} note
 * @property {'severe_htn' | 'with_symptoms' | 'high_dbp' | 'has_note'} reason
 */

/**
 * @typedef {Object} BPTrendAnalysis
 * @property {number} count
 * @property {string} dateRange      - "Apr 13 - Apr 26, 2026"
 * @property {number} avgSBP
 * @property {number} avgDBP
 * @property {number} pctAbove140
 * @property {number} pctAbove150
 * @property {number} pctAbove160
 * @property {number} maxSBP
 * @property {number} minSBP
 * @property {'rising' | 'falling' | 'stable'} trend
 * @property {BPSignificantReading[]} significantReadings
 */

function readingToTimestamp(r) {
  return new Date(`${r.date}T${r.time || "00:00"}:00`).getTime();
}

function parseDate(r) {
  return new Date(`${r.date}T00:00:00`);
}

function formatRange(first, last) {
  if (!first || !last) return "";
  const fmt = (d) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
  const yearFmt = new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(last);
  return `${fmt(first)} – ${fmt(last)}, ${yearFmt}`;
}

function classify(reading) {
  const reasons = [];
  if (reading.sbp >= SEVERE_SBP) reasons.push("severe_htn");
  if (reading.dbp >= 100) reasons.push("high_dbp");
  if (reading.note && reading.note.trim()) reasons.push("has_note");
  if (
    reading.note &&
    /headache|dizz|chest|vision|short(ness)? of breath/i.test(reading.note)
  ) {
    reasons.push("with_symptoms");
  }
  return reasons;
}

/**
 * Simple linear regression on SBP over reading order. Slope > 0.3 mmHg per
 * reading => "rising"; < -0.3 => "falling"; otherwise "stable". Threshold
 * picked so a 25-reading log needs to drift ~7-8 mmHg end-to-end before
 * flipping the label.
 */
function trendDirection(readings) {
  if (!readings.length) return "stable";
  const n = readings.length;
  const xs = readings.map((_, i) => i);
  const ys = readings.map((r) => r.sbp);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  if (slope > 0.3) return "rising";
  if (slope < -0.3) return "falling";
  return "stable";
}

/**
 * @param {BPReading[]} readings
 * @returns {BPTrendAnalysis}
 */
export function analyzeBPTrend(readings) {
  if (!Array.isArray(readings) || readings.length === 0) {
    return {
      count: 0,
      dateRange: "",
      avgSBP: 0,
      avgDBP: 0,
      pctAbove140: 0,
      pctAbove150: 0,
      pctAbove160: 0,
      maxSBP: 0,
      minSBP: 0,
      trend: "stable",
      significantReadings: [],
    };
  }
  const chronological = [...readings].sort(
    (a, b) => readingToTimestamp(a) - readingToTimestamp(b)
  );
  const n = chronological.length;
  const sumSBP = chronological.reduce((a, r) => a + r.sbp, 0);
  const sumDBP = chronological.reduce((a, r) => a + r.dbp, 0);
  const avgSBP = Math.round(sumSBP / n);
  const avgDBP = Math.round(sumDBP / n);
  const pct = (predicate) =>
    Math.round((chronological.filter(predicate).length / n) * 100);
  const significantReadings = chronological
    .map((r) => {
      const reasons = classify(r);
      if (!reasons.length) return null;
      return {
        date: r.date,
        time: r.time,
        sbp: r.sbp,
        dbp: r.dbp,
        note: r.note || "",
        reason: reasons[0],
        reasons,
      };
    })
    .filter(Boolean);
  return {
    count: n,
    dateRange: formatRange(parseDate(chronological[0]), parseDate(chronological[n - 1])),
    avgSBP,
    avgDBP,
    pctAbove140: pct((r) => r.sbp >= STAGE_2_SBP),
    pctAbove150: pct((r) => r.sbp >= ELEVATED_SBP),
    pctAbove160: pct((r) => r.sbp >= SEVERE_SBP),
    maxSBP: chronological.reduce((m, r) => Math.max(m, r.sbp), 0),
    minSBP: chronological.reduce((m, r) => Math.min(m, r.sbp), Infinity),
    trend: trendDirection(chronological),
    significantReadings,
  };
}

export const BP_THRESHOLDS = {
  SEVERE_SBP,
  ELEVATED_SBP,
  STAGE_2_SBP,
};
