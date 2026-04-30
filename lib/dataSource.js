// Phase 3.3 — DataSource abstraction.
//
// A single surface — `dataSource.runAction(cardId, actionId)` — that returns
// an async-iterable of SimulationEvent objects. The UI consumes it the same
// way regardless of whether the events are scripted (simulation) or real
// HVC chat outputs (live, 3.4).
//
// MODE selection: `NEXT_PUBLIC_KAIROS_MODE` env var, defaults to 'simulation'.
// Live mode is stubbed in 3.3 and throws on first call.

import simulationDataSource from "./simulationDataSource";
import liveDataSource from "./liveDataSource";

const MODE =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_KAIROS_MODE) === "live"
    ? "live"
    : "simulation";

const dataSource = MODE === "live" ? liveDataSource : simulationDataSource;

export default dataSource;
export { MODE };
