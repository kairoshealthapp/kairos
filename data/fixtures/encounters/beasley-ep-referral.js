// Pattern 6 — SYNTHESIS + HANDOFF (referral)
// Pass E §3 — new tour Card 10. EP referral packet card. The headline
// collapse: 14 manual steps across 5 Epic surfaces become one Authorize
// click. Stage 1 generates the note + MyChart + referral order;
// Stage 2 (referral packet panel) shows what Kairos pre-assembled for
// the fax — the right documents, pulled from the right tabs, because
// it knows this is an EP referral, not a sleep study or GI consult.

const fixture = {
  id: "beasley-ep-referral",
  slug: "beasley-ep-referral",
  patternId: "6r",
  patternName: "SYNTHESIS + REFERRAL PACKET",
  tab: "resultsfu",
  authorizeActions: [
    "Send MyChart",
    "Sign Note",
    "Place EP Referral",
    "Fax Packet to Riverside",
    "Done",
  ],
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "active",
  receivedAt: "2026-05-03T07:55:00Z",
  card: {
    subject: "Holter — sustained VT; refer EP for ICD eval",
    kicker: "RESULTS F/U · EP REFERRAL",
    severity: "yellow",
  },
  patient: {
    name: "Beasley, William",
    displayName: "William Beasley",
    age: 64,
    sex: "M",
    dob: "1962-02-11",
    mrn: "M000071411",
    proxyName: null,
    primary: "Pendrelle NP, Lakeside Cardiology Associates",
    coverage: "Commercial — Anthem PPO",
    history: "CAD, prior LAD stent (2022) and RCA stent (2024). EF 35% (echo 2026-03-15).",
  },
  sourceArtifact: {
    type: "Holter Monitor Result",
    author: "Pendrelle NP, Cardiology",
    timestamp: "2026-05-03 07:55",
    body: "HOLTER MONITOR — 48-hour ambulatory rhythm study\nKey finding: Multiple sustained VT episodes; longest run 12 seconds.\nEF 35% on most recent echo (2026-03-15).\n\nPendrelle NP review note:\nMultiple sustained VT runs, longest 12s. Given EF 35% and CAD history with prior stents, refer to electrophysiology at Riverside Medical Center for ICD candidacy evaluation. Communicate to patient.",
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
  // Pass E §3 — referral packet rendered below the four-pane grid
  // when the gate condition (fixture.referralPacket truthy) fires.
  referralPacket: {
    destination: "Riverside Medical Center · Electrophysiology · Dr. Ashworth",
    submissionMethod: "Fax 555-555-0142",
    coverLetter: {
      template: "EP referral cover letter",
      generatedAt: "2026-05-03 08:02",
      preview:
        "Re: William Beasley — referral for EP evaluation re: ICD candidacy. Sustained VT on Holter (longest 12s). EF 35%. CAD with prior stents. Records and media attached.",
    },
    items: {
      faceSheet: {
        included: true,
        source: "Auto-built from registration",
      },
      clinicalDocumentation: [
        {
          name: "Pendrelle NP — Holter review note (2026-05-03)",
          source: "Encounter notes · today",
          rationale: "Provider's referral recommendation + clinical reasoning",
          included: true,
        },
        {
          name: "Holter Monitor Result (2026-05-01)",
          source: "Results · cardiology",
          rationale: "The diagnostic that triggered the referral",
          included: true,
        },
        {
          name: "ECG (2026-04-01)",
          source: "Cardiology Studies",
          rationale: "Most recent baseline rhythm for EP comparison",
          included: true,
        },
        {
          name: "Echocardiogram report (2026-03-15) — EF 35%",
          source: "Cardiology Studies",
          rationale: "EF documents ICD candidacy threshold",
          included: true,
        },
        {
          name: "BNP (2026-04-01) — 380 pg/mL",
          source: "Labs",
          rationale: "Concurrent HF biomarker — EP wants the trajectory",
          included: true,
        },
        {
          name: "Active Medication List",
          source: "Meds",
          rationale: "Standard for any specialty consult",
          included: true,
        },
      ],
      media: [
        {
          name: "Insurance card",
          source: "Media tab",
          rationale: "Pre-cert / authorization workflow at receiving practice",
          included: true,
        },
        {
          name: "Photo ID",
          source: "Media tab",
          rationale: "Patient verification at scheduling",
          included: true,
        },
      ],
      excludedByDefault: [
        {
          name: "PCP problem list (full)",
          source: "Problems",
          rationale: "Not requested by EP — included only on demand",
        },
        {
          name: "Routine vitals history",
          source: "Flowsheets",
          rationale: "Not part of a standard EP packet",
        },
      ],
    },
  },
  actionScripts: {
    "assemble-ep-referral": [
      {
        type: "state-transition",
        target: "card",
        newState: "drafting",
        delayMsBefore: 100,
      },
      {
        type: "banner",
        kind: "green",
        text: "Drafting note + MyChart, placing referral order, assembling packet…",
        durationMs: 1000,
        delayMsBefore: 0,
      },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 600,
        content:
          "Holter monitor results reviewed by Pendrelle NP. Multiple sustained VT episodes identified, longest run 12 seconds. EF 35% on most recent echo (2026-03-15).\n\nPendrelle NP recommends electrophysiology evaluation for ICD candidacy. Referral placed to Riverside Medical Center EP — Dr. Ashworth's office.\n\nPatient notified via MyChart. Referral packet assembled and faxed to Riverside Medical Center EP (fax: 555-555-0142).\n\nBrandon Sterne, RN BSN / Lakeside Cardiology Associates",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Mr. Beasley,\n\nYour 48-hour Holter monitor results are in. The recording showed several short runs of an irregular fast rhythm coming from the lower chambers of your heart. The longest run lasted about 12 seconds. Combined with your weakened heart muscle (your most recent echo showed an ejection fraction of 35%) and your history of coronary artery disease with stents, your provider wants a heart-rhythm specialist (electrophysiologist, or \"EP\") to evaluate you.\n\nWhat's happening: We've referred you to the EP team at Riverside Medical Center. They'll review your records and discuss whether a small implantable device — like an ICD (implantable cardioverter-defibrillator) — would lower your risk and add an extra layer of safety. This is a conversation, not a commitment to anything.\n\nWhat to do:\n- Continue all your current medications as prescribed\n- Watch for the EP office to call you to schedule — usually within 1-2 weeks\n- We've already sent your full chart, your Holter results, and your most recent echo to their office, so you don't need to bring records\n\nWhat to watch for between now and the appointment: Fainting or near-fainting, sudden severe dizziness, prolonged palpitations (heart racing for more than a few minutes), chest pain, or shortness of breath that's worse than usual. If any of those happen, call 911 or go to the nearest ER — don't wait for the EP appointment.\n\nIf you don't hear from the EP office within 2 weeks, reply to this message and we'll follow up.\n\nBrandon Sterne, RN BSN / Lakeside Cardiology Associates",
      },
      {
        type: "pane-update",
        target: "order-pad",
        mode: "instant",
        delayMsBefore: 300,
        content: {
          orders: [
            {
              type: "Ambulatory Referral · Electrophysiology",
              codeVariant: "REF-EP-RIVERSIDE",
              reason: "Sustained VT on Holter, ICD candidacy evaluation",
              associatedDx: ["Sustained VT", "CAD with prior stent placement", "EF 35%"],
              priority: "Routine",
              class: "Referral",
              status: "Future",
              expectedDate: "Riverside MC EP — first available",
              authStatus: "Pending",
              cosign: "Pendrelle",
            },
          ],
          hasUnansweredQuestions: false,
        },
      },
      {
        type: "state-transition",
        target: "card",
        newState: "drafted",
        delayMsBefore: 200,
      },
    ],
  },
  finalSignedState: {
    nurseNote: "[As drafted above]",
    mychartMessage: "[As drafted above]",
    orders: [
      "Ambulatory Referral · Electrophysiology · Riverside Medical Center · Routine · Pending auth · Pendrelle cosign",
    ],
    dxAssociated: ["Sustained VT", "CAD with prior stent placement", "EF 35%"],
  },
};

export default fixture;
