// Phase 3.3 — live HVC data source. STUBBED.
// Wired in 3.4 alongside the actual HVC chat plumbing.

const liveDataSource = {
  async *runAction(/* cardId, actionId */) {
    throw new Error(
      "Live HVC mode not implemented in 3.3 — wired in 3.4. " +
        "Toggle NEXT_PUBLIC_KAIROS_MODE back to 'simulation' to run scripted fixtures."
    );
    // eslint-disable-next-line no-unreachable
    yield null;
  },
};

export default liveDataSource;
