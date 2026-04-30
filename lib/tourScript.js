// Phase 3.3 — Tour Mode master script. 7 fixtures, scripted in order.
// Annotation triggers:
//   - 'on-arrival' fires after navigating into the encounter route
//   - 'after-action' annotations queue in series after the action completes;
//     each shows for `durationMs`, then advances
//   - 'on-banner' annotations wait for a specific banner kind to fire from
//     the simulation engine (used for Brexley's phiGuard red banner moment)
//
// Anchors: 'patient-header' | 'source-pane' | 'nurse-note' | 'output-pane'
//          | 'order-pad' | 'action-bar' | 'global'
// Style:   'spotlight' (dimmed page + cutout) or 'narrator-corner' (persistent box)

const TOUR_SCRIPT = [
  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 1 — Aldington TTE (Pattern 2)
  {
    fixtureId: "aldington-tte",
    progressLabel: "Card 1 of 7 — Mr. Aldington",
    preArrivalNarrator: {
      title: "Card 1 of 7 — Mr. Aldington",
      body:
        "This card came from your Results Follow-Up box. Epic shows 27 unread, but only 9 are actually yours after you filter by provider. Those same 9 also show up in your custom 'addressed to me' search. Kairos pulled the union, deduplicated, and gave you the real number. This is one of those nine.",
      durationMs: 7500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      title: "Dr. Beckweldon reviewed Mr. Aldington's CTA",
      body:
        "Mild aortic stenosis with mild aortic regurgitation. He wants a transthoracic echo to reassess. Watch what happens next.",
      durationMs: 5500,
    },
    actions: [
      {
        actionId: "generate-note-mychart",
        annotations: [
          {
            trigger: "after-action",
            anchor: "nurse-note",
            position: "left",
            style: "spotlight",
            title: "Same voice you've always written in",
            body:
              "Same opening attribution, same sign-off you've been writing for years. Drafted, not invented.",
            durationMs: 5500,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            title: "Patient-friendly translation",
            body:
              "MyChart message drafts at the same time. Parenthetical lay terms. Patient-friendly framing.",
            durationMs: 5500,
          },
          {
            trigger: "after-action",
            anchor: "order-pad",
            position: "left",
            style: "spotlight",
            title: "All 13 fields, pre-staged",
            body:
              "Future date, code variant, reason, associated diagnoses, cosign route. You read it. You change anything that doesn't fit.",
            durationMs: 5800,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      title: "One click.",
      body:
        "Note signed, MyChart sent, order pended for Beckweldon to cosign. In Epic, this same workflow is 14 clicks across 5 screens.",
      durationMs: 5000,
    },
    transitionNarrator: {
      title: "Coming up — a simpler one",
      body: "That's the most common card you'll see. About 70% of your day looks like this. Now a simpler one.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 2 — Wood lipid (Pattern 1)
  {
    fixtureId: "wood-lipid",
    progressLabel: "Card 2 of 7 — Mrs. Wood",
    preArrivalNarrator: {
      title: "Card 2 of 7 — Mrs. Wood",
      body:
        "Same box, simpler pattern. Lab results, no medication change, just patient education. This is pure synthesis — provider decided, you document.",
      durationMs: 5500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      title: "Lipid panel review",
      body:
        "LDL at goal, HDL slightly below, triglycerides slightly elevated. Dr. Beckweldon isn't changing meds — he wants the patient educated on lifestyle.",
      durationMs: 5200,
    },
    actions: [
      {
        actionId: "generate-note-mychart",
        annotations: [
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "left",
            style: "spotlight",
            title: "Lifestyle counseling, embedded",
            body:
              "Notice the lifestyle counseling embedded automatically — exercise, diet, alcohol guidance for the HDL and triglyceride pattern. That's encoded clinical IP from your real notes.",
            durationMs: 6500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      title: "Pure synthesis.",
      body: "No orders. No labs to schedule. Just a clear note and a patient-friendly message. This card type is most of your morning.",
      durationMs: 4800,
    },
    transitionNarrator: {
      title: "Next — something harder",
      body: "Now something harder. Same box, but a med change AND multiple follow-up labs.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 3 — Hesperdale Crestor (Pattern 4)
  {
    fixtureId: "hesperdale-crestor",
    progressLabel: "Card 3 of 7 — Ms. Hesperdale",
    preArrivalNarrator: {
      title: "Card 3 of 7 — Ms. Hesperdale",
      body:
        "This one's more complex. Dr. Beckweldon wants Crestor 20 increased to 40, AND a lipid panel + hepatic function panel rechecked in 90 days. In Epic, this is 14 discrete actions. Watch.",
      durationMs: 6500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      title: "Dose change + lab cluster",
      body:
        "The provider's plan tells the system everything: discontinue old dose, place new dose, schedule two labs to the same future date, associate both with the same diagnosis.",
      durationMs: 5800,
    },
    actions: [
      {
        actionId: "generate-note-mychart",
        annotations: [
          {
            trigger: "after-action",
            anchor: "order-pad",
            position: "left",
            style: "spotlight",
            title: "Dose-change diff",
            body:
              "Crestor 20 → 40. The discontinue reason auto-fills from the plan keywords. The audit-trail note drafts itself.",
            durationMs: 5500,
          },
          {
            trigger: "after-action",
            anchor: "order-pad",
            position: "left",
            style: "spotlight",
            title: "Lab cluster",
            body:
              "Both labs grouped to the same future date, same dx association, one collapsible row instead of two separate orders.",
            durationMs: 5500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      title: "Real complexity, handled.",
      body: "14 clicks in Epic. One in Kairos.",
      durationMs: 4200,
    },
    transitionNarrator: {
      title: "Next — the safety moment",
      body: "Now the moment we want you to see. The AI almost made a mistake. Watch how the system catches it.",
      durationMs: 4800,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 4 — Brexley statin (Pattern 5) — phiGuard demo
  {
    fixtureId: "brexley-statin",
    progressLabel: "Card 4 of 7 — Ms. Brexley",
    preArrivalNarrator: {
      title: "Card 4 of 7 — Ms. Brexley",
      body:
        "This is the safety moment. Statin choice — Dr. Beckweldon offered the patient a switch from Zetia to Nexlizet. Watch the first draft carefully.",
      durationMs: 5500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      title: "Statin choice",
      body: "Pay attention to the MyChart message as it drafts. We're going to see something break.",
      durationMs: 4800,
    },
    actions: [
      {
        actionId: "generate-note-mychart",
        annotations: [
          {
            trigger: "on-banner",
            bannerKind: "red",
            anchor: "output-pane",
            position: "left",
            style: "spotlight",
            title: "Stop. The system caught it.",
            body:
              "See that — '[Patient Name]' instead of 'Nexlizet'? phiGuard misfired on a brand name. The cross-output consistency check caught it. The system blocks Authorize and forces a regeneration.",
            durationMs: 7500,
            pauseSimulation: true,
          },
          {
            trigger: "on-banner",
            bannerKind: "green",
            anchor: "output-pane",
            position: "left",
            style: "spotlight",
            title: "Regenerated draft",
            body:
              "'Nexlizet' renders correctly. Green banner — drug names match across panes, doses match, dx codes match.",
            durationMs: 5500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      title: "Safety rail held.",
      body: "The point isn't that the AI is perfect. The point is that the system catches when it isn't.",
      durationMs: 5000,
    },
    transitionNarrator: {
      title: "Next — a patient with no MyChart",
      body: "Now something different — a patient with no MyChart. Watch what changes.",
      durationMs: 4200,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 5 — Wexbury phone (Pattern 14)
  {
    fixtureId: "wexbury-phone",
    progressLabel: "Card 5 of 7 — Mrs. Wexbury",
    preArrivalNarrator: {
      title: "Card 5 of 7 — Mrs. Wexbury",
      body:
        "Mrs. Wexbury is 83. She doesn't have MyChart active. Most apps would draft her a MyChart message anyway and leave you to figure it out. Kairos drafts an example of how you might explain the result on the phone instead — words you can use, edit, or skip.",
      durationMs: 6000,
    },
    onArrival: {
      anchor: "patient-header",
      position: "bottom",
      style: "spotlight",
      title: "MyChart status: Pending",
      body:
        "See the patient header. MyChart Pending — the routing decision tree noticed automatically, and shifted the bottom-left pane to an example explanation rather than a written reply.",
      durationMs: 5200,
    },
    actions: [
      {
        actionId: "generate-phone-script",
        annotations: [
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            title: "An example, not a script",
            body:
              "This is an example of how you might explain it. Not a script to read — talking points to use as much or as little as you want. Built from the best clinical communication patterns we've seen. Note the chip: this pane never goes into the patient record.",
            durationMs: 7500,
          },
        ],
      },
      {
        actionId: "generate-voicemail",
        annotations: [
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            title: "Voicemail talking points",
            body:
              "Same example framing, condensed for unreachable patients. Use what fits, edit what doesn't, skip what's not relevant. Still ephemeral — not part of the chart.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      title: "Channel-aware example.",
      body: "Same clinical content, different example. Because phone calls and MyChart messages are different cognitive instruments — and either way, the words are yours.",
      durationMs: 5500,
    },
    transitionNarrator: {
      title: "Next — multi-stage",
      body: "Now multi-stage. A patient called with chest symptoms. This is a two-hour clinical investigation, condensed.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 6 — Underwell full lifecycle (Pattern 7b)
  {
    fixtureId: "underwell-full-lifecycle",
    progressLabel: "Card 6 of 7 — Mrs. Underwell",
    preArrivalNarrator: {
      title: "Card 6 of 7 — Mrs. Underwell",
      body:
        "Mrs. Underwell called the clinic — BP feels high, fuzzy thinking, swollen feet. She wants to talk to a nurse. This is one card with three stages. Watch all three fire in sequence.",
      durationMs: 6500,
    },
    onArrival: {
      anchor: "action-bar",
      position: "top",
      style: "spotlight",
      title: "Three stages",
      body: "Generate Inquiry, Process Reply, Synthesize Callback. Each one is a different point in a multi-hour investigation.",
      durationMs: 5200,
    },
    actions: [
      {
        actionId: "generate-inquiry",
        annotations: [
          {
            trigger: "after-action",
            anchor: "nurse-note",
            position: "right",
            style: "spotlight",
            title: "Stage 1 — chart-aware questions",
            body:
              "16 questions across 5 categories, tuned to her actual chart — HTN, AFib, CAD, MR, CKD, peripheral edema.",
            durationMs: 5500,
          },
        ],
      },
      {
        actionId: "process-reply",
        annotations: [
          {
            trigger: "after-action",
            anchor: "nurse-note",
            position: "right",
            style: "spotlight",
            title: "Stage 2 — SBAR",
            body:
              "Three clinical sharps embedded — BPs at goal but patient perceives them as high; persistent edema means the dose reduction failed; new bilateral hand paresthesias flagged as new.",
            durationMs: 6500,
          },
        ],
      },
      {
        actionId: "synthesize-callback",
        annotations: [
          {
            trigger: "after-action",
            anchor: "nurse-note",
            position: "right",
            style: "spotlight",
            title: "Stage 3 — cross-note synthesis",
            body:
              "Dr. Beckweldon signed two notes — primary plan plus an addendum about BNP and Holter monitor. Kairos absorbed both into one unified callback.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      title: "Two hours of clinical work.",
      body: "One card. Three minutes of nurse cognitive engagement, distributed across the day. The investigation persisted across stages — Kairos remembered where you were.",
      durationMs: 6000,
    },
    transitionNarrator: {
      title: "One more — the closer",
      body: "One more. The closer.",
      durationMs: 3000,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 7 — Larvendel denial cascade (Pattern 13)
  {
    fixtureId: "larvendel-denial-cascade",
    progressLabel: "Card 7 of 7 — Ms. Larvendel",
    preArrivalNarrator: {
      title: "Card 7 of 7 — Ms. Larvendel",
      body:
        "Eight days. Two denials. Four Epic surfaces. Currently lives in your working memory because Epic can't surface it as one thing. Watch.",
      durationMs: 5800,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      title: "8-day timeline",
      body:
        "NM SPECT ordered 4/2. Denied 4/21 by Evolent guideline 7312. Stress echo offered, patient can't walk treadmill. Lexiscan ordered, then cancelled. CTA Coronary ordered. Today, 4/29 — denied again. Peer-to-peer available, today only.",
      durationMs: 8500,
    },
    actions: [
      {
        actionId: "generate-denial-aware-outreach",
        annotations: [
          {
            trigger: "after-action",
            anchor: "source-pane",
            position: "right",
            style: "spotlight",
            title: "Auth-state badge",
            body:
              "Peer-to-peer countdown — deadline-bound urgency, a new variant Epic doesn't model.",
            durationMs: 5500,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "left",
            style: "spotlight",
            title: "Denial-acknowledgment frame",
            body:
              "The outreach drafts in denial-acknowledgment frame, not routine imaging-review frame. 'Yet another test denied' — patient feels seen.",
            durationMs: 6000,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "left",
            style: "spotlight",
            title: "Multi-channel correlation",
            body: "Voicemail left + MyChart sent simultaneously. The acknowledgment line auto-correlates.",
            durationMs: 5500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      title: "One card.",
      body: "Eight days. Two denials. Four Epic surfaces. One persistent investigation object that doesn't disappear when you log out.",
      durationMs: 6500,
    },
    transitionNarrator: null, // last fixture, goes to TourEndModal
  },
];

export default TOUR_SCRIPT;
