// Phase 3.3 — encounter detail route. Server component reads the mock
// fixture by slug and hands it to the client EncounterDetail shell. Tab
// state from the dashboard rides on `?tab=...` for the back button.

import { getFixture, listFixtures } from "@/data/fixtures/encounters";
import EncounterDetail from "@/components/EncounterDetail";

export function generateStaticParams() {
  return listFixtures().map((f) => ({ id: f.id }));
}

export default function EncounterPage({ params, searchParams }) {
  const fixture = getFixture(params.id);
  const fromTab = searchParams && searchParams.tab ? String(searchParams.tab) : null;

  if (!fixture) {
    return (
      <div className="kairos-card p-6">
        <h1 className="kairos-display text-bone text-[20px] mb-2">
          Encounter not found
        </h1>
        <p className="text-[13px] text-bone-muted">
          No fixture is registered with id <code>{params.id}</code>. The
          dashboard only links to fixtures in <code>data/fixtures/encounters/</code>.
        </p>
      </div>
    );
  }

  return <EncounterDetail fixture={fixture} fromTab={fromTab} />;
}
