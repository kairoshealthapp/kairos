// Anthropic API wrapper. Server-side only — never import this from a Client
// Component. The API key is read from process.env.KAIROS_ANTHROPIC_KEY at call
// time (not module load) so a missing key surfaces as a runtime error from
// the route, not a build-time crash.
//
// Var name is deliberately KAIROS_ANTHROPIC_KEY (not ANTHROPIC_API_KEY) to
// avoid a Windows-level system env var of the same name shadowing .env.local.

import Anthropic from "@anthropic-ai/sdk";

let cachedClient = null;

function getClient() {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.KAIROS_ANTHROPIC_KEY;
  if (!apiKey) {
    throw new Error(
      "KAIROS_ANTHROPIC_KEY is not set. Add it to .env.local before calling Claude."
    );
  }
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

export const KAIROS_OPUS_MODEL = "claude-opus-4-7";

export async function createMessage({ system, messages, maxTokens }) {
  const client = getClient();
  return client.messages.create({
    model: KAIROS_OPUS_MODEL,
    max_tokens: maxTokens ?? 4000,
    system,
    messages,
  });
}
