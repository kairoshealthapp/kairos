// Phase 3.3 — channel decision tree.
// Source of truth: docs/PHASE-3.3-DESIGN.md Section 3.
//
// SCOPE: implements the routing tree EXCEPT the Pattern 13 denial-cascade
// branch (deferred to v1.5 per the design doc Sequencing table). Secure
// Chat sources fall through to a 3.3 default of `mychart` so Pattern 10
// cards mount the channel-aware bottom-left pane; v1.5 will add the
// auth-state branch.

const BADGE_BOXES = new Set([
  "results-followup",
  "rx-request",
  "inr-reminder",
  "coumadin",
]);

/**
 * @param {object} card
 * @param {"high"|"calm"} card.urgency
 * @param {"epic-result"|"phone"|"mychart"|"secure-chat"} card.sourceChannel
 * @param {"active"|"active-recent"|"stale"|"pending"|"inactive"|"none"} card.mychartStatus
 * @param {string} card.sourceBox
 * @returns {{ channel: "phone"|"mychart"|"flag-for-nurse", badgeVisible: boolean, register: "spoken"|"written" }}
 */
export function routeFor(card) {
  const { urgency, sourceChannel, mychartStatus, sourceBox } = card || {};
  const badgeVisible = BADGE_BOXES.has(sourceBox);

  let channel;
  if (urgency === "high") {
    channel = "phone";
  } else if (sourceChannel === "phone") {
    channel = "phone";
  } else if (sourceChannel === "mychart") {
    channel = "mychart";
  } else if (sourceChannel === "epic-result") {
    if (mychartStatus === "active" || mychartStatus === "active-recent") {
      channel = "mychart";
    } else {
      channel = "phone";
    }
  } else if (sourceChannel === "secure-chat") {
    // Pattern 13 denial-cascade routing deferred to v1.5. For 3.3, secure-chat
    // sources route to mychart so the bottom-left pane mounts the channel-aware
    // composition; Pattern 10 coordination uses MyChart-back-to-patient by
    // default.
    channel = "mychart";
  } else {
    channel = "flag-for-nurse";
  }

  const register = channel === "phone" ? "spoken" : "written";
  return { channel, badgeVisible, register };
}
