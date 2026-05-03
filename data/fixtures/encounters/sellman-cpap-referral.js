// Phase-3.6 — Morris CPAP referral. Pattern: SYNTHESIS + NEW ORDER +
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
    name: "Morris, Kevin",
    displayName: "Kevin Morris",
    age: 68,
    sex: "M",
    dob: "1958-05-30",
    mrn: "70019384",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B + Mutual of Omaha Supplement",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-29 11:34",
    body: "Sleep study reviewed. AHI 28.6 — moderate-to-severe OSA. Order CPAP via Apria. Refer to sleep medicine for ongoing management. Forward sleep study report + reg face sheet + insurance card front/back + photo ID to Apria.",
  },
  // Pre-staged after the user clicks Generate. The orchestrator may render
  // these directly if pattern === "synthesis-referral-dme".
  generatedNurseNote: "Pendrelle reviewed Mr. Morris's recent sleep study (AHI 28.6, moderate-to-severe OSA). Plan communicated to patient via MyChart: CPAP therapy initiated via Apria; referral to sleep medicine placed for ongoing management. Sleep study report + face sheet + insurance card (front and back) + photo ID forwarded to Apria with cover letter. Patient will be contacted by Apria within 3-5 business days for setup. Sleep medicine appointment will be scheduled by referral coordinator.",
  generatedMyChart: "Mr Morris,\n\nDr. Pendrelle has reviewed your recent sleep study. The findings show moderate-to-severe sleep apnea (AHI 28.6 — this measures how often your breathing pauses during sleep, with 28.6 meaning moderate-to-severe).\n\nNext steps:\n• A CPAP machine has been ordered through Apria. They will contact you in 3-5 business days to set up delivery and a fitting.\n• You have been referred to sleep medicine for ongoing management. The referral coordinator will call to schedule.\n• Continue your other medications as prescribed.\n\nIf you have any questions before Apria reaches out, please reply to this message.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
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
      preview: "Re: Kevin Morris, DOB 5/30/1958, MRN 70019384. Sleep study performed [date], AHI 28.6 consistent with moderate-to-severe OSA. CPAP therapy ordered. See attached: face sheet, insurance card, photo ID, sleep study report, recent cardiology note. Please confirm receipt and contact patient within 3-5 business days. — R. P. Pendrelle, NP",
    },
    items: {
      faceSheet: { included: true, source: "Patient demographics + insurance + MRN", auto: true },
      clinicalDocumentation: [
        { name: "Pendrelle result note 4/29/2026", source: "Notes → Office Visit", included: true, auto: true, rationale: "Referring encounter — required" },
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
  // v3.0 — conditional panel declaration. Auto-inferred from
  // actionScripts / finalSignedState; override here if needed.
  panels: ["rnNote", "myChart", "orderPad"],
  panelContent: {
    orderPad: {
      orders: [
        {
          type: "DME — Durable Medical Equipment",
          codeVariant: "CPAP, auto-titrating, full face mask. Pressure 4-20 cmH2O.",
          reason: "Moderate-to-severe OSA per recent sleep study (AHI 28.6)",
          associatedDx: ["Obstructive sleep apnea (G47.33)"],
          priority: "Routine",
          status: "Faxed to Apria Healthcare",
        },
        {
          type: "Referral",
          codeVariant: "Sleep Medicine — outpatient consult",
          reason: "Ongoing CPAP management and titration",
          associatedDx: ["Obstructive sleep apnea (G47.33)"],
          priority: "Routine",
          status: "Pending coordinator scheduling",
        },
      ],
      hasUnansweredQuestions: false,
    },
  },
  initialPaneContent: { nurseNote: "", mychartMessage: "", phoneScript: "", orderPad: { orders: [], hasUnansweredQuestions: false } },
  actionScripts: {},
  finalSignedState: {
    nurseNote:
      "Sleep study reviewed. AHI 28.6 — moderate-to-severe obstructive sleep apnea. CPAP ordered via Apria Healthcare (DME). Referral placed to Sleep Medicine for ongoing management. Referral packet auto-assembled: cover letter, sleep study report, cardiology note, face sheet, insurance cards (front/back), photo ID. Packet faxed to Apria. Patient notified via MyChart.",
    mychartMessage:
      "Mr. Morris,\n\nYour sleep study results are in. The study showed moderate sleep apnea, which means your breathing is being interrupted during sleep more than it should be. This can cause the tiredness and poor sleep you've been experiencing.\n\nYour provider has ordered a CPAP machine through Apria Healthcare. This is a device you'll use at night to keep your airway open while you sleep. Apria will contact you directly to schedule a fitting and get you set up — most patients hear from them within a week.\n\nWe've also referred you to a sleep medicine specialist who will work with you on an ongoing basis to make sure the CPAP is working well and adjust settings as needed.\n\nWhat to expect:\n- Apria will call you to schedule CPAP setup\n- The sleep medicine office will call to schedule your first appointment\n- If you haven't heard from either within 2 weeks, let us know\n\nThe CPAP takes some getting used to, but most patients notice a real difference in how they feel within the first few weeks. If you have any questions before your appointments, reply to this message or call the clinic.\n\nBrandon Sterne, RN BSN / Lakeside Cardiology Associates",
    phoneScript: "",
    orders: ["CPAP DME via Apria", "Referral to Sleep Medicine"],
    dxAssociated: ["Obstructive sleep apnea (G47.33)"],
  },
  routing: {
    recipient: "Apria Healthcare (DME) + Sleep Medicine (referral coordinator)",
    pool: "Lakeside Cardiology Support Pool",
    comment: "Referral packet auto-assembled and faxed; Sleep Med referral pending coordinator scheduling.",
    priority: "Routine",
  },
};

export default fixture;
