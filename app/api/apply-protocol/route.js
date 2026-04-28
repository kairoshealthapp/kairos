import { applyProtocol, getProtocol } from "@/lib/clinical/protocolApplier";
import { getBundleForPatient } from "@/lib/fhir/mockData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { protocolId, patientId, scheduledDate, procedureType } = body || {};
  if (!protocolId) return Response.json({ error: "protocolId is required" }, { status: 400 });
  if (!patientId) return Response.json({ error: "patientId is required" }, { status: 400 });

  const protocol = getProtocol(protocolId);
  if (!protocol) return Response.json({ error: "Protocol not found" }, { status: 404 });

  const bundle = getBundleForPatient(patientId);
  if (!bundle) return Response.json({ error: "Patient bundle not found" }, { status: 404 });

  const result = applyProtocol(protocol, { bundle, scheduledDate, procedureType });
  return Response.json({ result });
}
