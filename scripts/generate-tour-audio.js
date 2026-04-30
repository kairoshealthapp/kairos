// scripts/generate-tour-audio.js
// Walks lib/tourScript.js, collects every bubble's voiceText + audioKey,
// calls OpenAI TTS for each, writes public/tour-audio/{audioKey}.mp3.
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
// regex rather than `require()`-ing the ESM module. Each bubble we care about
// has both `audioKey:` and `voiceText:`.
const scriptPath = path.join(__dirname, "..", "lib", "tourScript.js");
const scriptSrc = fs.readFileSync(scriptPath, "utf8");

function collectBubbles(src) {
  // Find every audioKey + voiceText pair in document order. Both fields can
  // span multiple lines (string literals may use concatenation across lines).
  // Strategy: tokenize by `audioKey:` occurrences, then for each, locate the
  // nearest following `voiceText:` and capture its string literal.
  const bubbles = [];
  const audioKeyRe = /audioKey:\s*"([^"]+)"/g;
  let m;
  while ((m = audioKeyRe.exec(src)) !== null) {
    const key = m[1];
    const tail = src.slice(m.index);
    const vtMatch = tail.match(/voiceText:\s*([\s\S]*?),\s*\n/);
    if (!vtMatch) continue;
    // The voiceText literal is inside vtMatch[1]. It may be a single string,
    // multi-line concat, etc. Pull all double-quoted segments and join.
    const literalSegment = vtMatch[1];
    const stringPieces = [];
    const strRe = /"((?:\\.|[^"\\])*)"/g;
    let sm;
    while ((sm = strRe.exec(literalSegment)) !== null) {
      // Unescape common sequences.
      const piece = sm[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
      stringPieces.push(piece);
    }
    const voiceText = stringPieces.join("");
    if (voiceText.trim().length > 0) {
      bubbles.push({ key, voiceText });
    }
  }
  return bubbles;
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
  console.log("Discovered " + bubbles.length + " bubbles with voiceText.");
  let totalChars = 0;
  let generated = 0;
  let skipped = 0;
  for (const b of bubbles) {
    totalChars += b.voiceText.length;
    const outPath = path.join(OUT_DIR, b.key + ".mp3");
    if (fs.existsSync(outPath)) {
      skipped += 1;
      console.log("[skip] " + b.key + ".mp3 (exists)");
      continue;
    }
    process.stdout.write("[gen ] " + b.key + ".mp3 — " + b.voiceText.length + " chars … ");
    try {
      const mp3 = await synthesize(b.voiceText, VOICE);
      fs.writeFileSync(outPath, mp3);
      generated += 1;
      console.log("ok (" + mp3.length + " bytes)");
    } catch (e) {
      console.log("FAILED: " + e.message);
    }
  }
  const cost = (totalChars * 15) / 1000000;
  console.log("");
  console.log("Done. " + generated + " generated, " + skipped + " skipped.");
  console.log("Total chars across all bubbles: " + totalChars);
  console.log("Estimated cost (TTS-1 at $15/1M chars): $" + cost.toFixed(4));
})();
