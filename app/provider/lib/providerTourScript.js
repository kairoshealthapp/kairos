// /provider per-clinic tour scripts. ONE tour per clinic, ONE MP3 per
// tour, ~2-2.5 min each. Each tour walks five beats:
//
//   Beat 1  (~15s)  intro          — narrate "what Kairos just did"
//   Beat 2  (~30s)  open-patient   — cursor → patient card → drawer
//                                    opens → scroll to findings panel
//   Beat 3  (~45s)  drill-finding  — highlight Section 09 (findings)
//   Beat 4  (~30s)  architecture   — stay on findings, narrate stack
//   Beat 5  (~15s)  closer         — close drawer, highlight column
//
// The tour audio is a single MP3 per clinic; visual cues advance on
// timed startMs cues. ProviderTour orchestrates the cues against the
// audio's playback time. If the audio ends or errors out, the tour
// also ends.
//
// Each tour's `narration` is the exact text passed to OpenAI TTS at
// audio-generation time (scripts/generate-provider-tour-audio.js).
// It is here so the script and the audio stay in sync — change one,
// regenerate the other.

export const PACING = {
  cursorTravelMs: 1200,
  clickHighlightMs: 400,
  scrollSettleMs: 700,
  preAudioPauseMs: 400,
  drawerOpenMs: 800,
  drawerCloseMs: 600,
};

// ── CARDIOLOGY ─────────────────────────────────────────────────────
const CARDIOLOGY_TOUR = {
  clinicKey: "cardiology",
  label: "Cardiology",
  audioKey: "provider-tour-cardiology",
  patientId: "card-0840",
  patientName: "Robert Trentham",
  estMinutes: 2,
  beats: [
    { startMs: 0, kind: "intro", durationMs: 18000 },
    { startMs: 18000, kind: "open-patient", durationMs: 32000 },
    { startMs: 50000, kind: "drill-finding", durationMs: 48000 },
    { startMs: 98000, kind: "architecture", durationMs: 30000 },
    { startMs: 128000, kind: "closer", durationMs: 15000 },
  ],
  narration:
    "When this cardiology provider opened their schedule this morning, Kairos had already analyzed every patient and surfaced their open care gaps. No reports to run. No chart-by-chart review. " +
    "Mr. Trentham — eight-forty post-hospital visit, recent cardiac arrest workup. The platform pulled his admission, his discharge medication list, his ejection fraction of thirty-two percent, and ran every cardiology rule against the chart. These findings didn't come from a language model reading the chart. Each came from a deterministic rule — actual code — that ran the moment Kairos pulled his FHIR data. Same input, same output, every time. " +
    "Take this GDMT pillar gap. It traces directly to the 2022 ACC AHA HFSA Heart Failure Guideline — Class one recommendation, Level A evidence. The rule fired because the chart shows HFrEF with ejection fraction under thirty-five, and no SGLT2 inhibitor on the active medication list. The rule is auditable code, not a language model interpretation. The provider can read the rule. They can see why it fired. They can trace the citation back to Circulation, 2022. And if they disagree with the rule's interpretation, they override. Every chart commit is human-authorized. " +
    "Clinical rules in code, not prompts. Cited to accredited sources — AHA, ACC, USPSTF, ADA, KDIGO, HEDIS measure specifications. The language model is never in the decision path. The provider sees what fired, the citation behind it, and chooses what goes in the chart. The platform does the chart-wide cross-referencing. The clinician does the medicine. " +
    "Eleven deterministic cardiology rules — heart failure, arrhythmia, dyslipidemia, post-MI care, endocrine — sourced from six major guidelines. That's the cardiology stack today.",
};

// ── FAMILY PRACTICE ────────────────────────────────────────────────
const FAMILY_PRACTICE_TOUR = {
  clinicKey: "familyPractice",
  label: "Family Practice",
  audioKey: "provider-tour-familyPractice",
  patientId: "fp-1020",
  patientName: "Yvette Daugherty",
  estMinutes: 2,
  beats: [
    { startMs: 0, kind: "intro", durationMs: 18000 },
    { startMs: 18000, kind: "open-patient", durationMs: 32000 },
    { startMs: 50000, kind: "drill-finding", durationMs: 48000 },
    { startMs: 98000, kind: "architecture", durationMs: 30000 },
    { startMs: 128000, kind: "closer", durationMs: 15000 },
  ],
  narration:
    "When this family practice provider opened their schedule this morning, Kairos had already analyzed every patient on the day's list and surfaced their open care gaps. No reports to run. No chart-by-chart review. " +
    "Ms. Daugherty — ten-twenty follow-up, type two diabetes uncontrolled. The platform pulled her current medication list, her A1c trajectory of seven-point-nine through ten-point-two over the past year, her newly elevated urine albumin, and ran every rule against the chart. These findings didn't come from a language model reading the note. Each came from a deterministic rule — actual code — that ran the moment Kairos pulled her FHIR data. " +
    "Take this SGLT2 inhibitor gap. It traces to the ADA 2026 Standards of Care, Recommendation 11.4 — A grade evidence — and to the KDIGO 2024 diabetes-in-CKD guideline. The rule fired because the chart shows type two diabetes, eGFR fifty-two, albumin-creatinine ratio of eighty-four, and no SGLT2 inhibitor on the active medication list. Two independent societies, the same recommendation, both fire as separate findings. The provider can read each rule, see why it fired, and trace the citation back to the source. And if they disagree, they override. Every chart commit is human-authorized. " +
    "Clinical rules in code, not prompts. Cited to accredited sources — USPSTF, ADA, ACC, AHA, KDIGO, HEDIS measure specifications. The language model is never in the decision path. The provider sees what fired, the citation behind it, and chooses what goes in the chart. The platform does the chart-wide cross-referencing across HEDIS measures. The clinician does the medicine. " +
    "HEDIS-aligned gaps surfaced on every chart — Controlling Blood Pressure, Glycemic Status, Colorectal Cancer Screening, Breast Cancer Screening. The measures you're graded on, rendered as deterministic rules.",
};

// ── INTERNAL MEDICINE ──────────────────────────────────────────────
const INTERNAL_MEDICINE_TOUR = {
  clinicKey: "internalMedicine",
  label: "Internal Medicine",
  audioKey: "provider-tour-internalMedicine",
  patientId: "im-0840",
  patientName: "Howard Whitestone",
  estMinutes: 2,
  beats: [
    { startMs: 0, kind: "intro", durationMs: 18000 },
    { startMs: 18000, kind: "open-patient", durationMs: 32000 },
    { startMs: 50000, kind: "drill-finding", durationMs: 48000 },
    { startMs: 98000, kind: "architecture", durationMs: 30000 },
    { startMs: 128000, kind: "closer", durationMs: 15000 },
  ],
  narration:
    "When this internal medicine provider opened their schedule this morning, Kairos had already analyzed every patient and surfaced their open care gaps. No reports to run. No chart-by-chart review. " +
    "Mr. Whitestone — eight-forty post-hospital follow-up, multimorbid. The platform pulled his recent HFrEF admission, his diabetes, his CKD stage three A, his hypertension, his lipid panel, his pharmacy fills, and ran every rule against the chart. These findings didn't come from a language model reading the discharge summary. Each came from a deterministic rule — actual code — that ran the moment Kairos pulled his FHIR data. " +
    "Take this SGLT2 inhibitor gap. It traces to the ADA 2026 Standards of Care, A grade evidence, and to the KDIGO 2024 diabetes-in-CKD guideline. The rule fired because the chart shows type two diabetes with eGFR forty-eight, urine albumin-creatinine ratio of ninety-two, no SGLT2 inhibitor on the active medication list. A second rule fires alongside it from the GDMT heart failure pathway — Class one, Level A. The provider can read each rule, see why it fired, and trace the citation back to the source. Every chart commit is human-authorized. " +
    "Clinical rules in code, not prompts. Cited to accredited sources — ACC, AHA, USPSTF, ADA, KDIGO, ACIP, HEDIS measure specifications. The language model is never in the decision path. The provider sees what fired, the citation behind it, and chooses what goes in the chart. The platform does the chart-wide cross-referencing across specialties. The clinician does the medicine. " +
    "CKD ACE inhibitor gaps, adult immunization status, osteoporosis screening, depression screening — sourced from KDIGO, ACIP, USPSTF, and HEDIS measure specifications. The internal medicine stack.",
};

// ── PULMONOLOGY ────────────────────────────────────────────────────
const PULMONOLOGY_TOUR = {
  clinicKey: "pulmonology",
  label: "Pulmonology",
  audioKey: "provider-tour-pulmonology",
  patientId: "pulm-0840",
  patientName: "Lawrence Okafor",
  estMinutes: 2,
  beats: [
    { startMs: 0, kind: "intro", durationMs: 18000 },
    { startMs: 18000, kind: "open-patient", durationMs: 32000 },
    { startMs: 50000, kind: "drill-finding", durationMs: 48000 },
    { startMs: 98000, kind: "architecture", durationMs: 30000 },
    { startMs: 128000, kind: "closer", durationMs: 15000 },
  ],
  narration:
    "When this pulmonology provider opened their schedule this morning, Kairos had already analyzed every patient and surfaced their open care gaps. No reports to run. No chart-by-chart review. " +
    "Mr. Okafor — eight-forty post-hospital visit, COPD exacerbation. The platform pulled his recent admission, his discharge inhaler regimen, his FEV one trend, his tobacco history, his comorbid hypertension and type two diabetes, and ran every rule against the chart. These findings didn't come from a language model reading the discharge note. Each came from a deterministic rule — actual code — that ran the moment Kairos pulled his FHIR data. " +
    "Take this lung cancer screening gap. It traces to the USPSTF 2021 recommendation, grade B — low-dose CT annually for adults fifty to eighty with a twenty pack-year smoking history. The rule fired because the chart shows an active smoker, age sixty-seven, with documented multi-decade tobacco use and no low-dose CT on file. The rule is auditable code, not a language model interpretation. The provider can read the rule, see why it fired, and trace the citation back to JAMA, 2021. And if they disagree, they override. Every chart commit is human-authorized. " +
    "Clinical rules in code, not prompts. Cited to accredited sources — GOLD, GINA, USPSTF, ADA, HEDIS measure specifications. The language model is never in the decision path. The provider sees what fired, the citation behind it, and chooses what goes in the chart. The platform does the chart-wide cross-referencing across pulm and the comorbid stack. The clinician does the medicine. " +
    "GOLD A B E classification, asthma controller gaps, lung cancer screening, tobacco cessation — sourced from GOLD 2024, GINA, USPSTF, and HEDIS measure specifications. The pulmonology stack.",
};

export const TOURS = {
  cardiology: CARDIOLOGY_TOUR,
  familyPractice: FAMILY_PRACTICE_TOUR,
  internalMedicine: INTERNAL_MEDICINE_TOUR,
  pulmonology: PULMONOLOGY_TOUR,
};

export function tourForClinic(clinicKey) {
  return TOURS[clinicKey] || null;
}

export function estimateTourMinutes(/* clinicKey */) {
  return 2;
}

// Tour anchor helpers for the new layout.
export function columnSelectorFor(clinicKey) {
  return `[data-tour-anchor="clinic-column-${clinicKey}"]`;
}
export function tourButtonSelectorFor(clinicKey) {
  return `[data-tour-anchor="tour-button-${clinicKey}"]`;
}
export function patientCardSelectorFor(visitId) {
  return `[data-encounter-id="${visitId}"]`;
}
export function findingsSectionSelector() {
  return `[data-tour-anchor="briefing-section-09"]`;
}

export default TOURS;
