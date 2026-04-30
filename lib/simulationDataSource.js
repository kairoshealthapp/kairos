// Phase 3.3 — simulation data source.
// Looks up a fixture by id and replays its scripted actionScripts via the
// shared simulationEngine. The UI sees the same async-iterable surface as
// the future live HVC mode.

import { runScript } from "./simulationEngine";
import { getFixture } from "@/data/fixtures/encounters";

const simulationDataSource = {
  async *runAction(cardId, actionId) {
    const fixture = getFixture(cardId);
    if (!fixture) {
      throw new Error(`simulationDataSource: unknown fixture "${cardId}"`);
    }
    const script = fixture.actionScripts && fixture.actionScripts[actionId];
    if (!script) {
      // Fixture exists but action is not yet scripted (skeleton-only). Yield a
      // single banner event so the UI surfaces the gap rather than failing.
      yield {
        type: "banner",
        kind: "yellow",
        text: `Action "${actionId}" not scripted in this fixture (skeleton-only). Wire in a follow-up build session.`,
        durationMs: 2400,
      };
      return;
    }
    yield* runScript(script);
  },
};

export default simulationDataSource;
