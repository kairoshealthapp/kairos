// v3.0 panel content derivation. Walks a fixture's existing actionScripts
// for the final pane-update content per target, then falls back to
// finalSignedState fields for skeleton fixtures with empty actionScripts.
// Used by the 4-panel grid for the static "what this card looks like
// when fully drafted" view that demo viewers see before clicking any
// action button.

const TARGET_TO_KEY = {
  "nurse-note": "rnNote",
  mychart: "myChart",
  "phone-script": "callScript",
  "order-pad": "orderPad",
};

function emptyContent() {
  return {
    rnNote: "",
    myChart: "",
    callScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  };
}

export function derivePanelContent(fixture) {
  const out = emptyContent();
  const scripts = fixture && fixture.actionScripts;
  if (scripts && typeof scripts === "object") {
    for (const key of Object.keys(scripts)) {
      const events = scripts[key];
      if (!Array.isArray(events)) continue;
      for (const ev of events) {
        if (!ev || ev.type !== "pane-update") continue;
        const k = TARGET_TO_KEY[ev.target];
        if (!k) continue;
        if (k === "orderPad") {
          out.orderPad = ev.content || out.orderPad;
        } else if (ev.mode === "append") {
          out[k] = (out[k] || "") + (ev.content || "");
        } else {
          out[k] = ev.content || "";
        }
      }
    }
  }
  // finalSignedState fallback — skeleton fixtures (no animations).
  const fss = fixture && fixture.finalSignedState;
  if (fss) {
    if (!out.rnNote && fss.nurseNote && fss.nurseNote !== "[As drafted above]") {
      out.rnNote = fss.nurseNote;
    }
    if (!out.myChart && fss.mychartMessage && fss.mychartMessage !== "[As drafted above]") {
      out.myChart = fss.mychartMessage;
    }
    if (!out.callScript && fss.phoneScript && fss.phoneScript !== "[As drafted above]") {
      out.callScript = fss.phoneScript;
    }
  }
  // Explicit panelContent override — skeleton fixtures that need
  // structured orderPad content can declare it directly. Same shape
  // as the OrderPadPanel expects (orders, hasUnansweredQuestions, note).
  const pc = fixture && fixture.panelContent;
  if (pc) {
    if (pc.rnNote) out.rnNote = pc.rnNote;
    if (pc.myChart) out.myChart = pc.myChart;
    if (pc.callScript) out.callScript = pc.callScript;
    if (pc.orderPad && Array.isArray(pc.orderPad.orders)) out.orderPad = pc.orderPad;
  }
  return out;
}

// Auto-detect which panels a fixture should render based on whether the
// derived content has any text/orders for that panel. Used as the default
// when a fixture doesn't declare an explicit `panels` array.
export function inferPanels(fixture) {
  const c = derivePanelContent(fixture);
  const out = [];
  if (c.rnNote) out.push("rnNote");
  if (c.myChart) out.push("myChart");
  if (c.orderPad && Array.isArray(c.orderPad.orders) && c.orderPad.orders.length > 0) {
    out.push("orderPad");
  }
  if (c.callScript) out.push("callScript");
  // Default: every fixture should have at least the RN note panel so the
  // grid never renders empty. If nothing was inferred, return [rnNote].
  return out.length > 0 ? out : ["rnNote"];
}

// Best-effort source content extractor — returns the verbatim Epic
// inbox message body for the source pane. Falls back through several
// fixture shapes used across the existing 30-fixture corpus.
export function deriveSourceContent(fixture) {
  if (!fixture) return "";
  if (typeof fixture.sourceContent === "string") return fixture.sourceContent;
  const a = fixture.sourceArtifact;
  if (a && typeof a.body === "string") return a.body;
  return "";
}
