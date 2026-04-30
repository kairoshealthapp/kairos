// Phase 3.3 — simulation engine.
//
// Plays a scripted action sequence as an async-iterable stream of
// SimulationEvent objects. The UI consumes the iterator and applies each
// event to its pane state. Typing animation lives in the consumer
// (EncounterDetail's applyEvent), not here, so the engine stays a pure
// scheduler.
//
// SimulationEvent shapes (all { type, ...props }):
//   pane-update      { target, content, mode: 'replace'|'append'|'instant',
//                      typingSpeedCps?: number, delayMsBefore?: number }
//   state-transition { target: 'card', newState: 'drafting'|'drafted'
//                      |'authorized'|'flown-off' }
//   banner           { kind: 'red'|'yellow'|'green', text, durationMs?: number }
//   pause            { durationMs }
//
// The engine awaits each event's `delayMsBefore` (if any) and yields the
// event. The consumer is expected to await its own work (typing, banner
// flash) before requesting the next value.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function* runScript(script) {
  if (!Array.isArray(script)) return;
  for (const event of script) {
    if (event && typeof event.delayMsBefore === "number" && event.delayMsBefore > 0) {
      await sleep(event.delayMsBefore);
    }
    yield event;
  }
}

export { sleep };
