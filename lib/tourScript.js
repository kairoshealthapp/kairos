// Phase 3.3 — Tour Mode master script. 9 fixtures, scripted in order.
// Annotation triggers:
//   - 'on-arrival' fires after navigating into the encounter route
//   - 'after-action' annotations queue in series after the action completes;
//     each shows for `durationMs`, then advances
//   - 'on-banner' annotations wait for a specific banner kind to fire from
//     the simulation engine (reserved; no current fixture uses it)
//
// Anchors: 'patient-header' | 'source-pane' | 'nurse-note' | 'output-pane'
//          | 'order-pad' | 'action-bar' | 'global'
// Style:   'spotlight' (dimmed page + cutout) or 'narrator-corner' (persistent box)

const TOUR_SCRIPT = [
  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 1 — Aldington TTE (Pattern 2)
  {
    fixtureId: "aldington-tte",
    progressLabel: "Card 1 of 9 — Mr. Aldington",
    preArrivalNarrator: {
      title: "Card 1 of 9 — Mr. Aldington",
      body:
        "Imagine your Results Follow-Up box. Epic shows 27 unread, but only 9 are actually yours once you filter by provider. The same 9 surface in a custom 'addressed to me' search. Kairos is designed to pull the union, deduplicate, and surface the real number. This card is one of those nine.",
      durationMs: 7500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      title: "Dr. Loxley reviewed Mr. Aldington's CTA",
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
            title: "Read the MyChart draft",
            body:
              "Take a moment with this one. The MyChart message drafts in parallel with the note — same clinical content, patient-friendly translation, parenthetical lay terms. This is the message Mr. Aldington would actually receive.",
            durationMs: 9000,
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
        "Note signed, MyChart drafted, order pended for cosign — that's the design. In Epic, this same workflow takes roughly 14 clicks across 5 screens.",
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
    progressLabel: "Card 2 of 9 — Mrs. Wood",
    preArrivalNarrator: {
      title: "Card 2 of 9 — Mrs. Wood",
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
        "LDL at goal, HDL slightly below, triglycerides slightly elevated. Dr. Loxley isn't changing meds — he wants the patient educated on lifestyle.",
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
              "Notice the lifestyle counseling embedded automatically — exercise, diet, alcohol guidance for the HDL and triglyceride pattern. Built to encode the clinical IP that lives in patterns like this.",
            durationMs: 6500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      title: "Pure synthesis.",
      body: "No orders. No labs to schedule. Just a clear note and a patient-friendly message. This card type is meant to handle most of a typical morning.",
      durationMs: 4800,
    },
    transitionNarrator: {
      title: "Next — something harder",
      body: "Now something harder. Same box, but a med change AND multiple follow-up labs.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 3 — Calderwood Crestor (Pattern 4)
  {
    fixtureId: "calderwood-crestor",
    progressLabel: "Card 3 of 9 — Ms. Calderwood",
    preArrivalNarrator: {
      title: "Card 3 of 9 — Ms. Calderwood",
      body:
        "This one's more complex. Dr. Loxley wants Crestor 20 increased to 40, AND a lipid panel + hepatic function panel rechecked in 90 days. In Epic, this is 14 discrete actions. Watch.",
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
      body: "Roughly 14 clicks in Epic. One in Kairos, by design.",
      durationMs: 4200,
    },
    transitionNarrator: {
      title: "Next — the boring case",
      body: "Now a different gear. A refill request the system can resolve from a rule, not a synthesis. Some work is automatic.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 4 — Norreys transactional (Pattern 9)
  {
    fixtureId: "norreys-transactional",
    progressLabel: "Card 4 of 9 — Mr. Norreys",
    preArrivalNarrator: {
      title: "Card 4 of 9 — Mr. Norreys",
      body:
        "Rx Request box. Mr. Norreys had an INR-driven dose decrease nine days ago — 6.5 to 6 mg of warfarin — and now wants the new dose refilled. The boring case. Watch what 'boring' looks like when the rule does the work.",
      durationMs: 5800,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      title: "Rx Request rule preconditions",
      body:
        "Last visit 4/21, future appointment booked, dx active. Three preconditions — that's a clean Rx Request. No clinical reasoning needed.",
      durationMs: 5200,
    },
    actions: [
      {
        actionId: "generate-reply",
        annotations: [
          {
            trigger: "after-action",
            anchor: "nurse-note",
            position: "right",
            style: "spotlight",
            title: "Standard documentation",
            body:
              "One short note. Records the dose change, the rule that fired, the next INR date. Nothing the nurse would have to think about — but it still has to be in the chart.",
            durationMs: 5800,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            title: "One-line confirmation",
            body:
              "Confirms what the patient asked. No medical interpretation, no extra detail. The transactional reply Kairos is designed to draft when nothing else is in question.",
            durationMs: 5800,
          },
          {
            trigger: "after-action",
            anchor: "order-pad",
            position: "left",
            style: "spotlight",
            title: "Rule-driven refill",
            body:
              "90 days, 3 refills, standard dx, Marchetti cosign. Pre-staged from the Coumadin Clinic Rx Request rule. Read it, change anything that doesn't fit.",
            durationMs: 5800,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      title: "One-click. Or automatic.",
      body: "Some work is one-click. Some work is automatic. Kairos is designed to sort which is which — so the nurse only sees what actually needs a nurse.",
      durationMs: 5500,
    },
    transitionNarrator: {
      title: "Next — a question with no safe answer yet",
      body: "Now a patient asks something Kairos can't safely answer alone. Watch what it does instead.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 5 — Quennell scope-constrained (Pattern 12)
  {
    fixtureId: "quennell-scope",
    progressLabel: "Card 5 of 9 — Ms. Quennell",
    preArrivalNarrator: {
      title: "Card 5 of 9 — Ms. Quennell",
      body:
        "Ms. Quennell had elevated H&H last week. Yesterday she asked: 'could this cause low blood pressure?' Vague reference. Kairos asked her what 'this' meant. She clarified. Now Kairos has to answer — carefully.",
      durationMs: 6000,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      title: "Two messages, one thread",
      body:
        "Original vague reference plus the clarification. Cardiology RN scope is the cardiology workup. Hematology effects on BP belong to hematology.",
      durationMs: 5500,
    },
    actions: [
      {
        actionId: "generate-scope-respecting-reply",
        annotations: [
          {
            trigger: "after-action",
            anchor: "nurse-note",
            position: "right",
            style: "spotlight",
            title: "Scope rail engaged",
            body:
              "The note documents the clarification round-trip and the scope decision. Kairos is designed to recognize when a question is out of cardiology RN scope before drafting an answer.",
            durationMs: 6500,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            title: "Redirected, not answered",
            body:
              "Brief reply, redirected to hematology where the referral already lives. No interpretation of H&H ↔ BP. Answers what's safe to answer; routes the rest to who can.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      title: "Knows what it doesn't know.",
      body: "Kairos doesn't pretend to know what it can't know. The system is designed to recognize scope and route accordingly.",
      durationMs: 5500,
    },
    transitionNarrator: {
      title: "Next — when the chart and the patient disagree",
      body: "Now a patient statement that contradicts the chart. Watch what gets drafted — and what doesn't.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 6 — Maundrell contradiction (Pattern 8)
  {
    fixtureId: "maundrell-contradiction",
    progressLabel: "Card 6 of 9 — Mr. Maundrell",
    preArrivalNarrator: {
      title: "Card 6 of 9 — Mr. Maundrell",
      body:
        "INR overdue MyChart template went out 4/24. Mr. Maundrell replied today: 'Dr. M told me to stop warfarin.' Chart still shows it active, last therapeutic INR five days ago, no provider note documenting any discontinuation. Watch.",
      durationMs: 6500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      title: "Two facts that can't both be right",
      body:
        "Patient says the med is stopped. Chart says it isn't. They can't both be right — and Kairos isn't the one who gets to decide which.",
      durationMs: 5500,
    },
    actions: [
      {
        actionId: "forward-to-provider",
        annotations: [
          {
            trigger: "after-action",
            anchor: "nurse-note",
            position: "right",
            style: "spotlight",
            title: "Contradiction documented",
            body:
              "The note records what the patient said and what the chart shows, side by side. Forwarded to Marchetti for verification. No autonomous reply — the patient deserves a real answer, and that has to come from a provider.",
            durationMs: 7000,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            title: "MyChart pane held",
            body:
              "No draft message. The system is designed to hold patient-facing replies when the source artifact and the chart disagree. Synthesis is also a safety surface.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      title: "Same INR. Different plan.",
      body: "Same INR result. Different plan. Kairos noticed. The contradiction is the output — not the reply.",
      durationMs: 5500,
    },
    transitionNarrator: {
      title: "Next — multi-stage",
      body: "Now multi-stage. A patient called with chest symptoms. This is a two-hour clinical investigation, condensed.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 7 — Underwell full lifecycle (Pattern 7b)
  {
    fixtureId: "underwell-full-lifecycle",
    progressLabel: "Card 7 of 9 — Mrs. Underwell",
    preArrivalNarrator: {
      title: "Card 7 of 9 — Mrs. Underwell",
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
              "Dr. Loxley signed two notes — primary plan plus an addendum about BNP and Holter monitor. Kairos absorbed both into one unified callback.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      title: "Two hours of clinical work.",
      body: "One card. Three minutes of nurse cognitive engagement, distributed across the day. The investigation is designed to persist across stages — Kairos would remember where you left off.",
      durationMs: 6000,
    },
    transitionNarrator: {
      title: "Next — a patient with no MyChart",
      body: "Now something different — a patient with no MyChart. Watch what changes.",
      durationMs: 4200,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 8 — Wexbury phone (Pattern 14)
  {
    fixtureId: "wexbury-phone",
    progressLabel: "Card 8 of 9 — Mrs. Wexbury",
    preArrivalNarrator: {
      title: "Card 8 of 9 — Mrs. Wexbury",
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
      title: "One more — the closer",
      body: "One more. The closer.",
      durationMs: 3000,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 9 — Vanstone denial cascade (Pattern 13)
  {
    fixtureId: "vanstone-denial-cascade",
    progressLabel: "Card 9 of 9 — Ms. Vanstone",
    preArrivalNarrator: {
      title: "Card 9 of 9 — Ms. Vanstone",
      body:
        "Eight days. Two denials. Four Epic surfaces. Today this lives in working memory because Epic can't surface it as one thing — Kairos is designed to. Watch.",
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
