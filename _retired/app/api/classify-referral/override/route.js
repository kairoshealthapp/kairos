import { appendOverride } from "@/lib/state/referralMessages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = new Set([
  "informational_ack",
  "informational_appointment_confirmation",
  "informational_records_received",
  "actionable_scheduling",
  "actionable_clinical_question",
  "actionable_info_request",
  "actionable_referral_response_pending",
  "unable_to_classify",
]);

const VALID_ROUTES = new Set([
  "patient_call_basket",
  "pt_advice_request",
  "rx_request",
  "scheduling",
  "provider_review",
]);

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messageId, newCategory, newRouteTo, overrideNote } = body || {};
  if (!messageId) {
    return Response.json({ error: "messageId is required" }, { status: 400 });
  }
  if (!newCategory || !VALID_CATEGORIES.has(newCategory)) {
    return Response.json(
      { error: `newCategory must be one of: ${[...VALID_CATEGORIES].join(", ")}` },
      { status: 400 }
    );
  }
  if (newRouteTo && !VALID_ROUTES.has(newRouteTo)) {
    return Response.json(
      { error: `newRouteTo must be one of: ${[...VALID_ROUTES].join(", ")} or null` },
      { status: 400 }
    );
  }
  if (!overrideNote || !overrideNote.trim()) {
    return Response.json({ error: "overrideNote is required" }, { status: 400 });
  }

  const updated = appendOverride(messageId, {
    newCategory,
    newRouteTo: newRouteTo || null,
    overrideNote: overrideNote.trim(),
  });
  if (!updated) {
    return Response.json({ error: `No message ${messageId}` }, { status: 404 });
  }
  return Response.json({ message: updated });
}
