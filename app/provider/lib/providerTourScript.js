// /provider tour — 7 top-level STEPS. Three cards walked: Trentham
// (cardiology), Okafor (pulmonology), Whitestone (internal medicine).
// Voorhees has been removed from the tour walk; he remains in the
// cardiology dropdown as a clickable patient.
//
// STEPS (indices 0-6):
//   0  opener        — opening narration; cursor pre-positions on
//                      Cardiology button so it pulses there during
//                      audio rather than parking center-screen
//   1  openClinic    — Cardiology dropdown opens (cursor already there)
//   2  cardWalk 1    — Trentham (open card → 12 sections → close)
//   3  openClinic    — Pulmonology dropdown
//   4  cardWalk 2    — Okafor (open card → 12 sections → close)
//   5  openClinic    — Internal Medicine dropdown
//   6  cardWalk 3    — Whitestone (open card → 12 sections + closing
//                      narration → close)
//
// Card jumper [1][2][3] maps to step indices {2, 4, 6}.

export const PACING = {
  cursorTravelMs: 1200,
  clickHighlightMs: 400,
  scrollSettleMs: 700,
  preAudioPauseMs: 600,
  dropdownOpenMs: 500,
  cardOpenMs: 800,
  cardCloseMs: 800,
};

// Per-section narration. Card 1 (Trentham) keeps its existing audio
// files (mapped below). Cards 2 (Okafor) and 3 (Whitestone) use the
// capability-voice scripts authored for this round; their audio is
// generated at scripts/generate-section-audio.js.
//
// Voice rule: describes what the platform pulled, surfaced, organized.
// NOT teaching pulmonology or internal medicine. Senior physicians
// already know the clinical concepts.

export const SECTION_NARRATION = {
  // ── Card 2 — Lawrence Okafor (Pulmonology) ──
  // Each section's narration matches the universal 12-section schema
  // exactly: 01 Who This Is, 02 Why Today, 03 Active Problems, 04
  // Current Meds, 05 Longitudinal Story, 06 Trended Data, 07 Hospital
  // Course, 08 Allergies, 09 Patterns, 10 Risk Context, 11 Care Gaps,
  // 12 Kairos-Flagged Items.
  card2: {
    "01":
      "Section one introduces the patient — demographics, support system, insurance, language, social barriers. The platform pulls this from the demographic and social history fields so it's visible at the top of the visit.",
    "02":
      "Pulmonology visit type pulled from the schedule. The platform routes COPD-specific reasoning here instead of cardiac.",
    "03":
      "Active problems stack — COPD severity, recent exacerbation, tobacco use, comorbidities. Pulled from the active problem list and the recent admission record.",
    "04":
      "Inhaler regimen extracted, organized by class — LAMA, LABA, ICS — alongside the steroid taper, antibiotic course, and continued chronic meds. The platform reconciles discharge meds against pharmacy fill data and flags pre-admission therapy.",
    "05":
      "Longitudinal story — last visit, three admissions across the year, an ED visit between them, smoking cessation declined, no rehab referral placed. The platform shows trajectory across encounters, not just the most recent visit.",
    "06":
      "Trended data — FEV1 across the last eighteen months, eosinophil count, ABG, discharge SpO2, exacerbation count, A1c. Trajectory matters more than the single most recent value, and the platform surfaces it that way.",
    "07":
      "Recent admission course pulled from the discharge summary — exacerbation trigger, BiPAP duration, sputum culture, med changes, discharge plan. Buried in a PDF, surfaced at the visit level here.",
    "08":
      "Allergies and drug intolerances cross-referenced against pulm prescribing patterns. The platform flags any conflicts before the provider even thinks about ordering.",
    "09":
      "Specialty-authored reasoning. The platform applies pulmonology-specific logic — frequent-exacerbator phenotype, eosinophil-driven escalation triggers, GOLD strategy — to surface what matters for this visit.",
    "10":
      "Risk context — three admissions in twelve months, active smoking, chronic CO2 retention signals, lives alone with transportation barriers. The platform assembles the readmission picture from across the chart.",
    "11":
      "Pulm-specific care gaps surfaced — pulmonary rehab referral, vaccination status, smoking cessation, home oxygen evaluation, inhaler technique. The platform did the cross-referencing.",
    "12":
      "Final layer — items the platform thinks the provider should consider for today's visit. Specialty-authored, prioritized, ready for review.",
  },

  // ── Card 3 — Howard Whitestone (Internal Medicine) ──
  card3: {
    "01":
      "Section one introduces the patient — demographics, support system, healthcare decision-maker, insurance, ADL independence. Pulled from demographic fields and care management notes.",
    "02":
      "Internal medicine visit type. The platform routes multi-specialty reasoning here — this patient has cardiology, endocrine, and renal context all in play.",
    "03":
      "HFrEF, T2DM, CKD stage three-A, hypertension, hyperlipidemia, OA. The platform pulled the full chronic problem stack — and that stack is exactly what makes I-M management complex.",
    "04":
      "Discharge med list assembled — diuretic, beta blocker, ACE inhibitor, MRA, statin, metformin, acetaminophen replacing chronic NSAID. The platform reconciles against pharmacy fill data and flags GDMT pillars.",
    "05":
      "Longitudinal story — last visit, recent admission, outside cardiology consult days before. The platform shows the I-M provider what every other team has done since the last I-M visit.",
    "06":
      "Trended data — EF, BNP, creatinine, A1c, lipids, BP, weight — pulled across the last twelve months. The platform surfaces trajectory across multiple specialties in one view.",
    "07":
      "Recent HF admission course pulled from the discharge summary. The platform surfaces the inpatient team's plan so the I-M provider can carry it forward without rereading the discharge note.",
    "08":
      "NSAID intolerance pulled from the discharge summary and elevated to the visit-level allergy view. Buried in a PDF on admission, visible at the top of the chart now.",
    "09":
      "Specialty-authored reasoning. The platform applied I-M logic — GDMT pillar gaps cross-referenced against diabetes status, NSAID-HF interaction flagged, dose adjustments needed for CKD stage.",
    "10":
      "Thirty-day readmission risk factors assembled — recent admission, comorbidity stack, eGFR, polypharmacy, pain plan. The platform built the risk picture from across the chart.",
    "11":
      "I-M-specific care gaps surfaced — SGLT2i not started, vaccinations, eye exam overdue, pain management plan beyond acetaminophen, weight-log compliance. Cross-specialty maintenance the I-M provider owns.",
    "12":
      "Final layer — items the platform thinks the I-M provider should address today. Multi-specialty issues consolidated into one decision list.",
  },
};

// Card 1 (Trentham) Section 12 narration — replaces the prior copy
// to mention the chart-chat capability now wired into every card.
// All other Card 1 sections continue to use their pre-existing MP3
// files unchanged.
export const CARD1_SECTION12_NARRATION =
  "Section 12 — final layer. Items the platform thinks the provider should consider for today's visit. Specialty-authored, prioritized, ready for review. And one more thing — the chat input at the top of every card lets the provider ask any question about this chart. The platform answers from the chart context with the source section cited. No clicking through tabs to find an answer the chart already has.";

// Closing narration after Card 3 / Whitestone Section 12. Updated to
// surface the chat capability alongside FHIR + specialty logic.
export const CLOSING_NARRATION =
  "Same engine across all three specialties. Kairos is the layer above Epic that knows which data matters for this patient at this visit, and surfaces it without the provider hunting for it. The chart data comes from Epic via FHIR. The reasoning comes from specialty-authored logic. Chat lets the provider ask any question and get the answer with the source cited. The time saved comes from not having to assemble it manually.";

// Audio key resolver. Card 1 (Trentham) maps to existing per-section
// audio files preserved from prior sessions. Cards 2 (Okafor) and 3
// (Whitestone) use newly-generated section-specific audio.
export function audioKeyForSection(card, sectionId) {
  if (card === 1) {
    const map = {
      "01": "provider-tour-02-who",
      "02": "provider-tour-03-why",
      "03": "provider-tour-04-problems",
      "04": "provider-tour-05-meds",
      "05": "provider-tour-06-longitudinal",
      "06": "provider-tour-07-trended",
      "07": "provider-tour-08-hospital",
      "08": "provider-tour-09-allergies",
      "09": "provider-tour-11-patterns",
      "10": "provider-tour-12-risk",
      "11": "provider-tour-13-gaps",
      "12": "provider-tour-14-flagged",
    };
    return map[sectionId] || null;
  }
  if (card === 2) return `provider-tour-okafor-s${sectionId}`;
  if (card === 3) return `provider-tour-whitestone-s${sectionId}`;
  return null;
}

export const CLOSING_AUDIO_KEY = "provider-tour-closing";
export const OPENER_AUDIO_KEY = "provider-tour-01-intro";

// Card jumper map: cardN → { clinic, visitId, stepIdx }
export const CARD_TARGETS = {
  1: { clinic: "cardiology", visitId: "card-0840", stepIdx: 2 },
  2: { clinic: "pulmonology", visitId: "pulm-0840", stepIdx: 4 },
  3: { clinic: "internalMedicine", visitId: "im-0840", stepIdx: 6 },
};

const STEPS = [
  // 0 — opener (cursor pre-positions on Cardiology button)
  {
    type: "opener",
    audioKey: OPENER_AUDIO_KEY,
    cursorTarget: '[data-clinic="cardiology"]',
    card: 1,
  },
  // 1 — Cardiology dropdown opens (cursor already on button)
  {
    type: "openClinic",
    clinic: "cardiology",
    skipCursorTravel: true,
    card: 1,
  },
  // 2 — Card 1 Trentham
  {
    type: "cardWalk",
    card: 1,
    visitId: "card-0840",
    specialty: "cardiology",
  },
  // 3 — Pulmonology dropdown
  { type: "openClinic", clinic: "pulmonology", card: 2 },
  // 4 — Card 2 Okafor
  {
    type: "cardWalk",
    card: 2,
    visitId: "pulm-0840",
    specialty: "pulmonology",
  },
  // 5 — Internal Medicine dropdown
  { type: "openClinic", clinic: "internalMedicine", card: 3 },
  // 6 — Card 3 Whitestone (includes scripted chat demo after section 12,
  // then closing narration)
  {
    type: "cardWalk",
    card: 3,
    visitId: "im-0840",
    specialty: "internalMedicine",
    includesChatDemo: true,
    includesCloser: true,
    closerAudioKey: CLOSING_AUDIO_KEY,
  },
];

export function targetForSection(sectionId) {
  return `[data-tour-anchor="briefing-section-${sectionId}"]`;
}

export function estimateProviderTourMinutes() {
  // 1 opener + 12 sections × 3 cards + closer + 3 dropdown openings
  const opener = 30;
  const closer = 30;
  const sectionsPerCard = 12 * 12; // ~12s per section
  const card1 = sectionsPerCard;
  const card2 = sectionsPerCard;
  const card3 = sectionsPerCard;
  const dropdowns = 3 * 5;
  const total = opener + closer + card1 + card2 + card3 + dropdowns;
  return Math.max(1, Math.round(total / 60));
}

export default STEPS;
