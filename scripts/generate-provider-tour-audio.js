// scripts/generate-provider-tour-audio.js
// Walks app/provider/lib/providerTourScript.js, collects every beat's
// audioKey + voiceText, calls OpenAI TTS (onyx) for each, writes:
//   public/provider-tour-audio/{audioKey}.mp3
// Skips files that already exist. Logs cost estimate at end.
//
// Run: node scripts/generate-provider-tour-audio.js
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
const OUT_DIR = path.join(__dirname, "..", "public", "provider-tour-audio");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const scriptPath = path.join(
  __dirname,
  "..",
  "app",
  "provider",
  "lib",
  "providerTourScript.js"
);
const scriptSrc = fs.readFileSync(scriptPath, "utf8");

function extractStringLiteralAfter(src, fromIndex, fieldName) {
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

function collectBeats(src) {
  const beats = [];
  // Skip schema-example placeholders like audioKey: "..."  — those match
  // pattern `audioKey:\s*"\.+"`.
  const audioKeyRe = /audioKey:\s*"([^"]+)"/g;
  let m;
  while ((m = audioKeyRe.exec(src)) !== null) {
    const key = m[1];
    if (/^\.+$/.test(key)) continue;
    const idx = m.index;
    const nextMatch = audioKeyRe.exec(src);
    const windowEnd = nextMatch ? nextMatch.index : src.length;
    audioKeyRe.lastIndex = nextMatch ? nextMatch.index : src.length;
    const window = src.slice(idx, windowEnd);
    const voiceText = extractStringLiteralAfter(window, 0, "voiceText");
    if (voiceText) beats.push({ key: key, voiceText: voiceText });
  }
  return beats;
}

function outFileFor(key) {
  return path.join(OUT_DIR, key + ".mp3");
}

async function synthesize(text, voice) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Speed parameter pulled from /rn's audio generation config
      // (scripts/generate-tour-audio.js): /rn does not pass `speed`,
      // which means it uses the OpenAI TTS default of 1.0. /provider
      // explicitly sets speed: 1.0 here so the configs are
      // demonstrably identical and any future drift is visible.
      model: "tts-1",
      voice: voice,
      input: text,
      response_format: "mp3",
      speed: 1.0,
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
  const beats = collectBeats(scriptSrc);
  console.log("Discovered " + beats.length + " provider tour beats.");
  let totalChars = 0;
  let generatedChars = 0;
  let generated = 0;
  let skipped = 0;
  for (const b of beats) {
    totalChars += b.voiceText.length;
    const outPath = outFileFor(b.key);
    if (fs.existsSync(outPath)) {
      skipped += 1;
      console.log("[skip] " + b.key + ".mp3 (exists)");
      continue;
    }
    process.stdout.write(
      "[gen ] " + b.key + ".mp3 — " + b.voiceText.length + " chars … "
    );
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
  console.log("Total chars across all beats: " + totalChars);
  console.log("New chars billed this run: " + generatedChars);
  console.log(
    "Estimated cost this run (TTS-1 at $15/1M): $" + billedCost.toFixed(4)
  );
  console.log(
    "Estimated total cost (if regenerated from scratch): $" +
      totalCost.toFixed(4)
  );
})();
