// scripts/generate-bookend-audio.js
// Generates the 5 bookend MP3s (1 opener + 4 closer frames) using
// OpenAI TTS. Reads voice text from lib/tourBookends.js.
//
// Run: node scripts/generate-bookend-audio.js
// Requires OPENAI_API_KEY in .env.local.

const fs = require("fs");
const path = require("path");

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

// Read voice text from lib/tourBookends.js. The module is ESM, so we
// parse its BOOKEND_VOICE_TEXT export by regex rather than require().
const bookendsPath = path.join(__dirname, "..", "lib", "tourBookends.js");
const bookendsSrc = fs.readFileSync(bookendsPath, "utf8");

function extractBookendVoiceText(src) {
  const startMarker = "BOOKEND_VOICE_TEXT = {";
  const startIdx = src.indexOf(startMarker);
  if (startIdx < 0) throw new Error("BOOKEND_VOICE_TEXT not found in tourBookends.js");
  const tail = src.slice(startIdx + startMarker.length);
  const endIdx = tail.indexOf("};");
  if (endIdx < 0) throw new Error("Could not find end of BOOKEND_VOICE_TEXT");
  const body = tail.slice(0, endIdx);
  // Match every "key": "value", pair. The values are double-quoted
  // single-line strings (per our authoring convention).
  const out = {};
  const re = /"([^"]+)"\s*:\s*"((?:\\.|[^"\\])*)"\s*,/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const k = m[1];
    const v = m[2]
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/\\n/g, "\n");
    out[k] = v;
  }
  return out;
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
  return Buffer.from(await res.arrayBuffer());
}

(async function main() {
  const voiceText = extractBookendVoiceText(bookendsSrc);
  const keys = Object.keys(voiceText);
  console.log("Discovered " + keys.length + " bookend tracks: " + keys.join(", "));

  let totalChars = 0;
  let generatedChars = 0;
  let generated = 0;
  let skipped = 0;
  for (const key of keys) {
    const text = voiceText[key];
    totalChars += text.length;
    const outPath = path.join(OUT_DIR, key + ".mp3");
    if (fs.existsSync(outPath)) {
      skipped += 1;
      console.log("[skip] " + key + ".mp3 (exists)");
      continue;
    }
    process.stdout.write("[gen ] " + key + ".mp3 — " + text.length + " chars … ");
    try {
      const mp3 = await synthesize(text, VOICE);
      fs.writeFileSync(outPath, mp3);
      generated += 1;
      generatedChars += text.length;
      console.log("ok (" + mp3.length + " bytes)");
    } catch (e) {
      console.log("FAILED: " + e.message);
    }
  }
  const billedCost = (generatedChars * 15) / 1000000;
  console.log("");
  console.log("Done. " + generated + " generated, " + skipped + " skipped.");
  console.log("New chars billed this run: " + generatedChars);
  console.log("Estimated cost this run (TTS-1 at $15/1M): $" + billedCost.toFixed(4));
})();
