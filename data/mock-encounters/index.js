// Phase 3.3 — encounter fixture registry. One fixture per row in the design
// doc Section 4 14-pattern taxonomy. Pattern 7 and 7b are listed as separate
// rows there, so we ship 15 fixture files keyed by sequential id.

import enc001 from "./enc-001.json";
import enc002 from "./enc-002.json";
import enc003 from "./enc-003.json";
import enc004 from "./enc-004.json";
import enc005 from "./enc-005.json";
import enc006 from "./enc-006.json";
import enc007 from "./enc-007.json";
import enc007b from "./enc-007b.json";
import enc008 from "./enc-008.json";
import enc009 from "./enc-009.json";
import enc010 from "./enc-010.json";
import enc011 from "./enc-011.json";
import enc012 from "./enc-012.json";
import enc013 from "./enc-013.json";
import enc014 from "./enc-014.json";

const fixtures = {
  "enc-001": enc001,
  "enc-002": enc002,
  "enc-003": enc003,
  "enc-004": enc004,
  "enc-005": enc005,
  "enc-006": enc006,
  "enc-007": enc007,
  "enc-007b": enc007b,
  "enc-008": enc008,
  "enc-009": enc009,
  "enc-010": enc010,
  "enc-011": enc011,
  "enc-012": enc012,
  "enc-013": enc013,
  "enc-014": enc014,
};

export default fixtures;

export function getFixture(id) {
  return fixtures[id] || null;
}

export function listFixtures() {
  return Object.values(fixtures);
}
