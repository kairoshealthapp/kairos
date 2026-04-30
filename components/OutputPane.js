// Phase 3.3 — channel-aware bottom-left pane.
// Mounts MyChartPane (channel=mychart) or ExplanationPane (channel=phone)
// based on the routing decision. ExplanationPane (formerly PhoneScriptPane)
// is framed as a reference example, not a script to read aloud — see
// components/ExplanationPane.js header for the rationale.

"use client";

import MyChartPane from "./MyChartPane";
import ExplanationPane from "./ExplanationPane";

export default function OutputPane({ fixture, route, paneState, isTyping, onDismissExplanation }) {
  const channel = route && route.channel;
  if (channel === "phone") {
    return (
      <ExplanationPane
        fixture={fixture}
        content={paneState && paneState.phoneScript}
        typingSpeedCps={paneState && paneState.typingSpeedCps}
        isTyping={isTyping}
        onDismiss={onDismissExplanation}
      />
    );
  }
  // mychart + flag-for-nurse fall through to MyChartPane.
  return (
    <MyChartPane
      fixture={fixture}
      content={paneState && paneState.mychartMessage}
      typingSpeedCps={paneState && paneState.typingSpeedCps}
      isTyping={isTyping}
    />
  );
}
