import {
  classifyReferralMessage,
  classifyBatch,
} from "@/lib/prompts/referralClassifier";
import {
  getReferralMessage,
  setClassification,
} from "@/lib/state/referralMessages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, messageId } = body || {};

  // Single-message path: classify by id (looked up from state).
  if (messageId) {
    const msg = getReferralMessage(messageId);
    if (!msg) {
      return Response.json({ error: `No message ${messageId}` }, { status: 404 });
    }
    try {
      const classification = await classifyReferralMessage(msg);
      const updated = setClassification(messageId, classification);
      return Response.json({ message: updated });
    } catch (err) {
      return Response.json(
        {
          error: "Classifier failed",
          message: err.message,
          rawResponse: err.rawResponse,
          parsed: err.parsed,
        },
        { status: 500 }
      );
    }
  }

  // Batch path: caller passes full message objects (used by "Reclassify all"
  // to keep the route stateless about which messages are in scope).
  if (Array.isArray(messages) && messages.length > 0) {
    try {
      const classifications = await classifyBatch(messages);
      // Persist any successful classifications back to state.
      for (let i = 0; i < messages.length; i++) {
        const c = classifications[i];
        if (c && !c.error) setClassification(messages[i].id, c);
      }
      return Response.json({ classifications });
    } catch (err) {
      return Response.json(
        { error: "Batch classification failed", message: err.message },
        { status: 500 }
      );
    }
  }

  return Response.json(
    { error: "Provide either { messageId } or { messages: [...] }" },
    { status: 400 }
  );
}
