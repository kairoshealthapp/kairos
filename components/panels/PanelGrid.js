// v3.0 Panel Grid — renders the conditional 1/2/3/4-panel layout for the
// right-hand column of the encounter detail view. Reads the fixture's
// `panels` array (or infers from derived content), and routes each ID
// to the matching panel component. Each panel reads streamed paneState
// content first; falls back to derived static content when paneState
// hasn't been populated yet (skeleton fixtures + non-tour static demo).
//
// Fix 1b — when a panel is in `completedPanels`, the panel renders as
// a one-line collapsed strip instead of the full panel. The card-level
// finish in EncounterDetail watches this set.

"use client";

import RNNotePanel from "./RNNotePanel";
import MyChartMessagePanel from "./MyChartMessagePanel";
import OrderPadPanel from "./OrderPadPanel";
import CallScriptPanel from "./CallScriptPanel";
import CompletedPanel from "./CompletedPanel";

const ANCHOR_BY_ID = {
  rnNote: "nurse-note",
  myChart: "output-pane",
  orderPad: "order-pad",
  callScript: "phone-script",
};

const LABEL_BY_ID = {
  rnNote: "RN Note",
  myChart: "MyChart Message",
  orderPad: "Order Pad",
  callScript: "Call Script",
};

function pickContent(panelId, paneState, derived) {
  if (panelId === "rnNote") {
    return paneState.nurseNote || derived.rnNote || "";
  }
  if (panelId === "myChart") {
    return paneState.mychartMessage || derived.myChart || "";
  }
  if (panelId === "callScript") {
    return paneState.phoneScript || derived.callScript || "";
  }
  return "";
}

function pickOrderPad(paneState, derived) {
  const live = paneState.orderPad;
  if (live && Array.isArray(live.orders) && live.orders.length > 0) return live;
  if (derived.orderPad && Array.isArray(derived.orderPad.orders) && derived.orderPad.orders.length > 0) {
    return derived.orderPad;
  }
  return live || derived.orderPad || { orders: [], hasUnansweredQuestions: false };
}

export default function PanelGrid({
  panels,
  fixture,
  paneState,
  derived,
  isTyping,
  tourMode,
  onTerminate,
  completedPanels,
}) {
  const ids = Array.isArray(panels) && panels.length > 0 ? panels : ["rnNote"];
  const count = ids.length;
  const completed = completedPanels || {};

  const gridClass =
    count === 1
      ? "grid grid-cols-1 gap-4"
      : count === 2
      ? "grid grid-cols-1 gap-4"
      : "grid grid-cols-1 xl:grid-cols-2 gap-4";

  return (
    <div className={gridClass}>
      {ids.map((id) => {
        const anchor = ANCHOR_BY_ID[id];
        const wrap = (node) => (
          <div key={id} data-tour-anchor={anchor || undefined}>
            {node}
          </div>
        );
        if (completed[id]) {
          return wrap(
            <CompletedPanel
              label={LABEL_BY_ID[id] || id}
              summary={completed[id]}
            />
          );
        }
        if (id === "rnNote") {
          return wrap(
            <RNNotePanel
              content={pickContent("rnNote", paneState, derived)}
              isTyping={isTyping}
              tourMode={tourMode}
              onTerminate={onTerminate}
            />
          );
        }
        if (id === "myChart") {
          return wrap(
            <MyChartMessagePanel
              fixture={fixture}
              content={pickContent("myChart", paneState, derived)}
              isTyping={isTyping}
              tourMode={tourMode}
              onTerminate={onTerminate}
            />
          );
        }
        if (id === "orderPad") {
          return wrap(
            <OrderPadPanel
              orderPad={pickOrderPad(paneState, derived)}
              tourMode={tourMode}
              onTerminate={onTerminate}
            />
          );
        }
        if (id === "callScript") {
          return wrap(
            <CallScriptPanel
              content={pickContent("callScript", paneState, derived)}
              isTyping={isTyping}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
