// scripts/generate-section-audio.js
//
// Generates 25 new MP3s for /provider tour Cards 2 (Okafor) and 3
// (Whitestone) plus the closing narration. Card 1 (Trentham) audio is
// NOT regenerated — its existing files in public/provider-tour-audio/
// are preserved.
//
// OpenAI TTS-1, voice "onyx", speed 1.0 (matching /rn config).
// Skips files that already exist.
//
// Run: node scripts/generate-section-audio.js
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

// Hardcoded narration map. Mirrors SECTION_NARRATION + CLOSING_NARRATION
// in app/provider/lib/providerTourScript.js — kept in sync manually
// since this is a CommonJS script and the source file is ESM.
const NARRATION = {
  // ── Card 1 — Trentham — Section 12 (chat-aware rewrite) ──
  // All other Card 1 sections use pre-existing MP3s and are not
  // listed here; only Section 12 is regenerated.
  "provider-tour-14-flagged":
    "Section 12 — final layer. Items the platform thinks the provider should consider for today's visit. Specialty-authored, prioritized, ready for review. And one more thing — the chat input at the top of every card lets the provider ask any question about this chart. The platform answers from the chart context with the source section cited. No clicking through tabs to find an answer the chart already has.",

  // ── Card 2 — Lawrence Okafor (Pulmonology) ──
  // Aligned to universal 12-section schema (rewrite 2026-05-06).
  "provider-tour-okafor-s01":
    "Section one introduces the patient — demographics, support system, insurance, language, social barriers. The platform pulls this from the demographic and social history fields so it's visible at the top of the visit.",
  "provider-tour-okafor-s02":
    "Pulmonology visit type pulled from the schedule. The platform routes COPD-specific reasoning here instead of cardiac.",
  "provider-tour-okafor-s03":
    "Active problems stack — COPD severity, recent exacerbation, tobacco use, comorbidities. Pulled from the active problem list and the recent admission record.",
  "provider-tour-okafor-s04":
    "Inhaler regimen extracted, organized by class — LAMA, LABA, ICS — alongside the steroid taper, antibiotic course, and continued chronic meds. The platform reconciles discharge meds against pharmacy fill data and flags pre-admission therapy.",
  "provider-tour-okafor-s05":
    "Longitudinal story — last visit, three admissions across the year, an ED visit between them, smoking cessation declined, no rehab referral placed. The platform shows trajectory across encounters, not just the most recent visit.",
  "provider-tour-okafor-s06":
    "Trended data — FEV1 across the last eighteen months, eosinophil count, ABG, discharge SpO2, exacerbation count, A1c. Trajectory matters more than the single most recent value, and the platform surfaces it that way.",
  "provider-tour-okafor-s07":
    "Recent admission course pulled from the discharge summary — exacerbation trigger, BiPAP duration, sputum culture, med changes, discharge plan. Buried in a PDF, surfaced at the visit level here.",
  "provider-tour-okafor-s08":
    "Allergies and drug intolerances cross-referenced against pulm prescribing patterns. The platform flags any conflicts before the provider even thinks about ordering.",
  "provider-tour-okafor-s09":
    "Specialty-authored reasoning. The platform applies pulmonology-specific logic — frequent-exacerbator phenotype, eosinophil-driven escalation triggers, GOLD strategy — to surface what matters for this visit.",
  "provider-tour-okafor-s10":
    "Risk context — three admissions in twelve months, active smoking, chronic CO2 retention signals, lives alone with transportation barriers. The platform assembles the readmission picture from across the chart.",
  "provider-tour-okafor-s11":
    "Pulm-specific care gaps surfaced — pulmonary rehab referral, vaccination status, smoking cessation, home oxygen evaluation, inhaler technique. The platform did the cross-referencing.",
  "provider-tour-okafor-s12":
    "Final layer — items the platform thinks the provider should consider for today's visit. Specialty-authored, prioritized, ready for review.",

  // ── Card 3 — Howard Whitestone (Internal Medicine) ──
  // Aligned to universal 12-section schema (rewrite 2026-05-06).
  "provider-tour-whitestone-s01":
    "Section one introduces the patient — demographics, support system, healthcare decision-maker, insurance, ADL independence. Pulled from demographic fields and care management notes.",
  "provider-tour-whitestone-s02":
    "Internal medicine visit type. The platform routes multi-specialty reasoning here — this patient has cardiology, endocrine, and renal context all in play.",
  "provider-tour-whitestone-s03":
    "HFrEF, T2DM, CKD stage three-A, hypertension, hyperlipidemia, OA. The platform pulled the full chronic problem stack — and that stack is exactly what makes I-M management complex.",
  "provider-tour-whitestone-s04":
    "Discharge med list assembled — diuretic, beta blocker, ACE inhibitor, MRA, statin, metformin, acetaminophen replacing chronic NSAID. The platform reconciles against pharmacy fill data and flags GDMT pillars.",
  "provider-tour-whitestone-s05":
    "Longitudinal story — last visit, recent admission, outside cardiology consult days before. The platform shows the I-M provider what every other team has done since the last I-M visit.",
  "provider-tour-whitestone-s06":
    "Trended data — EF, BNP, creatinine, A1c, lipids, BP, weight — pulled across the last twelve months. The platform surfaces trajectory across multiple specialties in one view.",
  "provider-tour-whitestone-s07":
    "Recent HF admission course pulled from the discharge summary. The platform surfaces the inpatient team's plan so the I-M provider can carry it forward without rereading the discharge note.",
  "provider-tour-whitestone-s08":
    "NSAID intolerance pulled from the discharge summary and elevated to the visit-level allergy view. Buried in a PDF on admission, visible at the top of the chart now.",
  "provider-tour-whitestone-s09":
    "Specialty-authored reasoning. The platform applied I-M logic — GDMT pillar gaps cross-referenced against diabetes status, NSAID-HF interaction flagged, dose adjustments needed for CKD stage.",
  "provider-tour-whitestone-s10":
    "Thirty-day readmission risk factors assembled — recent admission, comorbidity stack, eGFR, polypharmacy, pain plan. The platform built the risk picture from across the chart.",
  "provider-tour-whitestone-s11":
    "I-M-specific care gaps surfaced — SGLT2i not started, vaccinations, eye exam overdue, pain management plan beyond acetaminophen, weight-log compliance. Cross-specialty maintenance the I-M provider owns.",
  "provider-tour-whitestone-s12":
    "Final layer — items the platform thinks the I-M provider should address today. Multi-specialty issues consolidated into one decision list.",

  // ── Closing narration (chat-aware rewrite) ──
  "provider-tour-closing":
    "Same engine across all three specialties. Kairos is the layer above Epic that knows which data matters for this patient at this visit, and surfaces it without the provider hunting for it. The chart data comes from Epic via FHIR. The reasoning comes from specialty-authored logic. Chat lets the provider ask any question and get the answer with the source cited. The time saved comes from not having to assemble it manually.",
};

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
  const keys = Object.keys(NARRATION);
  console.log("Generating " + keys.length + " audio files...");
  let totalChars = 0;
  let generatedChars = 0;
  let generated = 0;
  let skipped = 0;
  for (const key of keys) {
    const text = NARRATION[key];
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
  console.log("Total chars: " + totalChars);
  console.log("Billed chars this run: " + generatedChars);
  console.log("Estimated cost (TTS-1 $15/1M): $" + billedCost.toFixed(4));
})();
