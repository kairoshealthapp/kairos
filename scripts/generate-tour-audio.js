// scripts/generate-tour-audio.js
// Walks lib/tourScript.js, collects every bubble's audioKey + voiceText
// for both Quick (quickVoiceText) and Deep (deepVoiceText) tiers, calls
// OpenAI TTS for each, writes:
//   public/tour-audio/{audioKey}.mp3       (Quick — un-suffixed)
//   public/tour-audio/{audioKey}-deep.mp3  (Deep)
// Skips files that already exist. Logs cost estimate at end.
//
// Run: node scripts/generate-tour-audio.js
// Requires OPENAI_API_KEY in .env.local.

const fs = require("fs");
const path = require("path");

// Load .env.local manually (no dotenv dep — keep this script standalone).
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) {
      const k = m[1];
      let v = m[2];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("OPENAI_API_KEY missing from .env.local");
  process.exit(1);
}

const VOICE = "onyx";
const OUT_DIR = path.join(__dirname, "..", "public", "tour-audio");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Tour script is ESM; we read it as text and pull out the bubble entries by
// regex rather than `require()`-ing the ESM module. For each `audioKey:` we
// capture the *nearest following* `quickVoiceText:` and `deepVoiceText:`
// string literals (each may span multiple lines via concatenation).
const scriptPath = path.join(__dirname, "..", "lib", "tourScript.js");
const scriptSrc = fs.readFileSync(scriptPath, "utf8");

function extractStringLiteralAfter(src, fromIndex, fieldName) {
  // Locate `fieldName:` starting at fromIndex; return the joined contents of
  // the string literal (concatenated double-quoted segments) or null.
  const re = new RegExp(fieldName + ":\\s*([\\s\\S]*?),\\s*\\n");
  const tail = src.slice(fromIndex);
  const m = tail.match(re);
  if (!m) return null;
  const literalSegment = m[1];
  const stringPieces = [];
  const strRe = /"((?:\\.|[^"\\])*)"/g;
  let sm;
  while ((sm = strRe.exec(literalSegment)) !== null) {
    const piece = sm[1]
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
    stringPieces.push(piece);
  }
  const joined = stringPieces.join("");
  return joined.trim().length > 0 ? joined : null;
}

function collectBubbles(src) {
  // Find every audioKey + (quick/deep)VoiceText triple in document order.
  const bubbles = [];
  const audioKeyRe = /audioKey:\s*"([^"]+)"/g;
  let m;
  while ((m = audioKeyRe.exec(src)) !== null) {
    const key = m[1];
    const idx = m.index;
    // Bound the search window to the next audioKey (or end-of-file) so we
    // don't reach into the next bubble's voiceText fields.
    const nextMatch = audioKeyRe.exec(src);
    const windowEnd = nextMatch ? nextMatch.index : src.length;
    audioKeyRe.lastIndex = nextMatch ? nextMatch.index : src.length;
    const window = src.slice(idx, windowEnd);
    const quick = extractStringLiteralAfter(window, 0, "quickVoiceText");
    const deep = extractStringLiteralAfter(window, 0, "deepVoiceText");
    if (quick) bubbles.push({ key: key, mode: "quick", voiceText: quick });
    if (deep) bubbles.push({ key: key, mode: "deep", voiceText: deep });
  }
  return bubbles;
}

function outFileFor(key, mode) {
  return path.join(OUT_DIR, key + (mode === "deep" ? "-deep" : "") + ".mp3");
}

async function synthesize(text, voice) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      voice: voice,
      input: text,
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error("TTS failed " + res.status + ": " + t);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

(async function main() {
  const bubbles = collectBubbles(scriptSrc);
  const quickCount = bubbles.filter((b) => b.mode === "quick").length;
  const deepCount = bubbles.filter((b) => b.mode === "deep").length;
  console.log("Discovered " + bubbles.length + " bubbles total — " + quickCount + " quick, " + deepCount + " deep.");
  let totalChars = 0;
  let generatedChars = 0;
  let generated = 0;
  let skipped = 0;
  for (const b of bubbles) {
    totalChars += b.voiceText.length;
    const outPath = outFileFor(b.key, b.mode);
    const tag = b.mode === "deep" ? "-deep" : "";
    if (fs.existsSync(outPath)) {
      skipped += 1;
      console.log("[skip] " + b.key + tag + ".mp3 (exists)");
      continue;
    }
    process.stdout.write("[gen ] " + b.key + tag + ".mp3 — " + b.voiceText.length + " chars … ");
    try {
      const mp3 = await synthesize(b.voiceText, VOICE);
      fs.writeFileSync(outPath, mp3);
      generated += 1;
      generatedChars += b.voiceText.length;
      console.log("ok (" + mp3.length + " bytes)");
    } catch (e) {
      console.log("FAILED: " + e.message);
    }
  }
  const billedCost = (generatedChars * 15) / 1000000;
  const totalCost = (totalChars * 15) / 1000000;
  console.log("");
  console.log("Done. " + generated + " generated, " + skipped + " skipped.");
  console.log("Total chars across all bubbles: " + totalChars);
  console.log("New chars billed this run: " + generatedChars);
  console.log("Estimated cost this run (TTS-1 at $15/1M): $" + billedCost.toFixed(4));
  console.log("Estimated total tour cost (if regenerated from scratch): $" + totalCost.toFixed(4));
})();
