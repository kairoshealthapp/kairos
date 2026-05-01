// Phase-3.6 — Bellomo CPAP referral. Pattern: SYNTHESIS + NEW ORDER +
// HANDOFF + DME. Most field-heavy variant of any encounter — collapses
// 20+ Epic actions across 5 surfaces into single Authorize. The moat
// fixture for the May 5 demo.

const fixture = {
  id: "sellman-cpap-referral",
  slug: "sellman-cpap-referral",
  patternId: 13,
  patternName: "SYNTHESIS + REFERRAL + DME",
  pattern: "synthesis-referral-dme",
  tab: "resultsfu",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "Active",
  receivedAt: "2026-04-29T11:34:00Z",
  card: {
    subject: "Sleep study — moderate-to-severe OSA. CPAP + Sleep Med referral.",
    kicker: "RESULTS F/U",
    severity: "green",
  },
  patient: {
    name: "Bellomo, Caspian",
    displayName: "Caspian Bellomo",
    age: 68,
    sex: "M",
    dob: "1958-05-30",
    mrn: "70019384",
    proxyName: null,
    primary: "Voronova NP, Heart and Vascular Clinic",
    coverage: "Medicare A+B + Mutual of Omaha Supplement",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Voronova, Cardiology",
    timestamp: "2026-04-29 11:34",
    body: "Sleep study reviewed. AHI 28.6 — moderate-to-severe OSA. Order CPAP via Apria. Refer to sleep medicine for ongoing management. Forward sleep study report + reg face sheet + insurance card front/back + photo ID to Apria.",
  },
  // Pre-staged after the user clicks Generate. The orchestrator may render
  // these directly if pattern === "synthesis-referral-dme".
  generatedNurseNote: "Voronova reviewed Mr. Bellomo's recent sleep study (AHI 28.6, moderate-to-severe OSA). Plan communicated to patient via MyChart: CPAP therapy initiated via Apria; referral to sleep medicine placed for ongoing management. Sleep study report + face sheet + insurance card (front and back) + photo ID forwarded to Apria with cover letter. Patient will be contacted by Apria within 3-5 business days for setup. Sleep medicine appointment will be scheduled by referral coordinator.",
  generatedMyChart: "Mr Bellomo,\n\nDr. Voronova has reviewed your recent sleep study. The findings show moderate-to-severe sleep apnea (AHI 28.6 — this measures how often your breathing pauses during sleep, with 28.6 meaning moderate-to-severe).\n\nNext steps:\n• A CPAP machine has been ordered through Apria. They will contact you in 3-5 business days to set up delivery and a fitting.\n• You have been referred to sleep medicine for ongoing management. The referral coordinator will call to schedule.\n• Continue your other medications as prescribed.\n\nIf you have any questions before Apria reaches out, please reply to this message.\n\nBrandon Sterne, RN BSN / Heart and Vascular Clinic",
  pendedOrders: [
    {
      id: "cpap-dme-order",
      type: "DME Order",
      label: "CPAP via Apria",
      fields: {
        diagnosis: "Obstructive sleep apnea (G47.33)",
        ahi: "28.6",
        supplier: "Apria Healthcare",
        prescription: "CPAP, auto-titrating, with full face mask. Pressure range 4-20 cmH2O. Start.",
        urgency: "Routine",
      },
    },
    {
      id: "sleep-med-referral",
      type: "Referral",
      label: "Sleep Medicine",
      fields: {
        reason: "Moderate-to-severe OSA per recent sleep study (AHI 28.6) — ongoing management",
        diagnosis: "Obstructive sleep apnea (G47.33)",
        priority: "Routine",
        coverage: "in-network: Wash U Sleep Medicine, BJC Sleep Medicine",
        documentation: "Sleep study report, recent cardiology note",
      },
    },
  ],
  referralPacket: {
    destination: "Apria Healthcare — CPAP DME",
    submissionMethod: "Fax (auto-confirmed receipt)",
    coverLetter: {
      template: "HVC SmartPhrase: CPAP-DME-Referral",
      generatedAt: "2026-04-30 14:12",
      preview: "Re: Caspian Bellomo, DOB 5/30/1958, MRN 70019384. Sleep study performed [date], AHI 28.6 consistent with moderate-to-severe OSA. CPAP therapy ordered. See attached: face sheet, insurance card, photo ID, sleep study report, recent cardiology note. Please confirm receipt and contact patient within 3-5 business days. — R. P. Voronova, NP",
    },
    items: {
      faceSheet: { included: true, source: "Patient demographics + insurance + MRN", auto: true },
      clinicalDocumentation: [
        { name: "Voronova result note 4/29/2026", source: "Notes → Office Visit", included: true, auto: true, rationale: "Referring encounter — required" },
        { name: "Sleep study report 4/22/2026", source: "Results → Studies", included: true, auto: true, rationale: "Required clinical documentation for CPAP DME" },
        { name: "Cardiology consult note 2/12/2026", source: "Notes → Office Visit", included: true, auto: true, rationale: "Most recent cardiology — supports clinical context" },
      ],
      labs: { included: false, rationale: "Not relevant to CPAP DME submission" },
      imaging: { included: false, rationale: "No imaging relevant to OSA workup" },
      media: [
        { name: "Mutual of Omaha insurance card — front", source: "Media → Insurance, scanned 2/12/2026", included: true, auto: true, rationale: "Most recent insurance scan; required for DME billing" },
        { name: "Mutual of Omaha insurance card — back", source: "Media → Insurance, scanned 2/12/2026", included: true, auto: true, rationale: "Most recent insurance scan; required for DME billing" },
        { name: "Driver License", source: "Media → ID Documents, scanned 2/12/2026", included: true, auto: true, rationale: "Current photo ID; required for DME submission" },
      ],
      excludedByDefault: [
        { name: "Older insurance scans (3 prior versions)", source: "Media → Insurance", rationale: "Superseded by 2/12/2026 scan" },
        { name: "PCP notes prior to 4/2025", source: "Notes → Office Visit", rationale: ">12 months old; not referral-relevant" },
        { name: "Older sleep study from 2022", source: "Results → Studies", rationale: "Superseded by 4/22/2026 study" },
      ],
    },
  },
  initialPaneContent: { nurseNote: "", mychartMessage: "", phoneScript: "", orderPad: { orders: [], hasUnansweredQuestions: false } },
  actionScripts: {},
  finalSignedState: {
    nurseNote: "",  // computed from generatedNurseNote
    phoneScript: "",
    orders: ["CPAP DME via Apria", "Referral to Sleep Medicine"],
    dxAssociated: ["Obstructive sleep apnea (G47.33)"],
  },
  routing: {
    recipient: "Apria Healthcare (DME) + Sleep Medicine (referral coordinator)",
    pool: "P Phs Mob Cardiology Support Staff Pool",
    comment: "Referral packet auto-assembled and faxed; Sleep Med referral pending coordinator scheduling.",
    priority: "Routine",
  },
};

export default fixture;
