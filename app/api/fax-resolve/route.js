import {
  getIncomingFax,
  resolveFaxPatient,
  rejectFax,
} from "@/lib/state/incomingFaxes";
import { createEncounterFromFax } from "@/lib/clinical/faxProcessor";
import { appendFaxEncounter } from "@/lib/state/faxEncounters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { faxId, action, patientId } = body || {};
  if (!faxId) {
    return Response.json({ error: "faxId is required" }, { status: 400 });
  }
  const fax = getIncomingFax(faxId);
  if (!fax) {
    return Response.json({ error: `No fax ${faxId}` }, { status: 404 });
  }

  if (action === "reject") {
    const updated = rejectFax(faxId, "nurse");
    return Response.json({ fax: updated });
  }

  if (action === "confirm_match") {
    if (!patientId) {
      return Response.json({ error: "patientId is required" }, { status: 400 });
    }
    const matched = resolveFaxPatient(faxId, patientId, "nurse");
    if (!matched) {
      return Response.json({ error: "resolve failed" }, { status: 500 });
    }
    if (matched.faxType === "home_inr") {
      const encounter = createEncounterFromFax(matched, patientId);
      appendFaxEncounter(encounter);
      const after = getIncomingFax(faxId);
      return Response.json({ fax: after, encounter });
    }
    return Response.json({ fax: matched, encounter: null });
  }

  return Response.json(
    { error: "action must be 'confirm_match' or 'reject'" },
    { status: 400 }
  );
}
