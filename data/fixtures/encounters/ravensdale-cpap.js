// Pattern 2 — SYNTHESIS + NEW ORDER (CPAP DME with referral + DME forms + atomic commit)
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 18 (Morris/Norhelden)
// "20+ discrete UI actions across 5 Epic surfaces + paper fax form" — most
// field-heavy variant. Demonstrates Document Packet Auto-Assembly + DME Forms.

const fixture = {
  id: "ravensdale-cpap",
  slug: "ravensdale-cpap",
  patternId: 2,
  patternName: "SYNTHESIS + NEW ORDER (DME — most field-heavy)",
  tab: "securechat",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "active",
  receivedAt: "2026-04-29T16:34:00Z",
  card: {
    subject: "Sleep study + CPAP DME order + sleep med referral",
    kicker: "RESULTS F/U · NOTIFY",
    severity: "green",
  },
  patient: {
    name: "Norhelden, Edward",
    displayName: "Edward Norhelden",
    age: 68,
    sex: "M",
    dob: "1958-05-30",
    mrn: "70019384",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B + Mutual of Omaha supplement",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-29 11:34",
    body:
      "Sleep study reviewed. AHI 28.6 — moderate-to-severe OSA. Order CPAP via Apria. Refer to sleep medicine for ongoing management. Forward sleep study report + reg face sheet + insurance card front/back + photo ID to Apria.",
  },
  // v3.0 — conditional panel declaration. Auto-inferred from
  // actionScripts / finalSignedState; override here if needed.
  panels: ["rnNote", "myChart", "orderPad"],
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  actionScripts: {
    "generate-note-mychart": [
      { type: "state-transition", target: "card", newState: "drafting", delayMsBefore: 100 },
      { type: "banner", kind: "green", text: "Pulling sleep study report (AHI 28.6) + assembling document packet…", durationMs: 1100 },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 500,
        content:
          "Dr. Pendrelle reviewed sleep study. AHI 28.6 — moderate-to-severe OSA. Plan: CPAP order placed (Apria), sleep medicine referral placed, document packet (reg face sheet + last 3 cardiology encounters + insurance card front/back + photo ID) auto-assembled and faxed to Apria. DME order form auto-populated and e-signed with Pendrelle delegation stamp.\n\nPatient notified via MyChart.",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Mr. Norhelden,\n\nYour sleep study results are in. The study showed moderate-to-severe sleep apnea, which means your breathing pauses repeatedly during sleep. This explains a lot of the daytime tiredness and poor sleep you've been describing — and the good news is it's very treatable.\n\nWhat's happening: Your provider has ordered a CPAP machine through Apria Healthcare. CPAP is a small bedside device that gently keeps your airway open while you sleep. We've also referred you to a sleep medicine specialist who will work with you long-term to fine-tune the CPAP settings and check on how it's going.\n\nWhat to do:\n- Watch for a call from Apria within 7-10 business days to schedule a CPAP fitting and delivery\n- Watch for a call from the sleep medicine office to schedule your first specialist visit\n- Continue your other medications as prescribed\n\nWhat to expect: The first week or two with CPAP can take some getting used to — the mask, the air pressure, the sound. Most patients adjust within 2-3 weeks and start noticing better sleep, more energy, and less morning headache. If the mask is uncomfortable, Apria can swap it for a different style at no charge.\n\nWhat to watch for: If you don't hear from Apria within 7-10 business days, or from sleep medicine within 2 weeks, reply to this message and we'll follow up. Severe daytime sleepiness, falling asleep at the wheel, or new chest symptoms — call the clinic or 911 as appropriate.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
      },
      { type: "banner", kind: "yellow", text: "Document Packet Auto-Assembly: 5 documents (face sheet, encounters x3, ins card, photo ID) → fax 2 transmissions queued", durationMs: 1600, delayMsBefore: 200 },
      {
        type: "pane-update",
        target: "order-pad",
        mode: "instant",
        delayMsBefore: 300,
        content: {
          orders: [
            {
              type: "DME — CPAP machine (Apria)",
              codeVariant: "DME-CPAP-A",
              reason: "moderate-to-severe OSA per sleep study (AHI 28.6)",
              associatedDx: ["Obstructive sleep apnea (G47.33)"],
              priority: "Routine",
              class: "DME order",
              status: "Future",
              expectedDate: "2026-04-29",
              clinicalQuestions: [
                { q: "AHI documented?", answered: true, answer: "Yes — 28.6" },
                { q: "Sleep study report attached?", answered: true, answer: "Yes" },
              ],
              cosign: "Pendrelle",
            },
            {
              type: "Referral to Sleep Medicine",
              reason: "ongoing management of moderate-to-severe OSA",
              associatedDx: ["Obstructive sleep apnea (G47.33)"],
              priority: "Routine",
              class: "Outpatient Referral",
              status: "Future",
              expectedDate: "2026-04-29",
              clinicalQuestions: [],
              cosign: "Pendrelle",
            },
            {
              type: "Document Packet (auto-assembled) — fax to Apria",
              reason: "DME order documentation",
              associatedDx: [],
              priority: "Routine",
              class: "Communication / Fax",
              status: "Queued",
              expectedDate: "2026-04-29",
              clinicalQuestions: [],
              packetContents: [
                "Reg face sheet",
                "Cardiology encounter 4/29",
                "Cardiology encounter 3/15",
                "Cardiology encounter 1/22",
                "Insurance card front + back",
                "Photo ID",
              ],
              cosign: "Pendrelle",
            },
          ],
          hasUnansweredQuestions: false,
        },
      },
      { type: "banner", kind: "green", text: "Atomic-commit ready: 1 note + 1 MyChart + 1 referral + 1 DME order + 1 packet (2 fax tx) + 1 schedule task", durationMs: 1800, delayMsBefore: 300 },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote: "[As drafted above]",
    mychartMessage: "[As drafted above]",
    orders: [
      "CPAP DME order — Apria",
      "Sleep medicine referral",
      "Document packet — fax queued (2 transmissions)",
    ],
    dxAssociated: ["Obstructive sleep apnea (G47.33)"],
  },
};

export default fixture;
