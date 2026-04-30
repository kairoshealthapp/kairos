// Phase 3.3 — Tour Mode master script. 9 fixtures, scripted in order.
//
// Apple-style split for every bubble:
//   - displayText: short on-screen headline (4-8 words). Anchors the moment.
//   - voiceText: full conversational narration. Used for TTS audio.
//   - audioKey: stable key for /tour-audio/{audioKey}.mp3 lookup.
//
// `body` field is kept as a graceful fallback for the legacy components that
// haven't been migrated; for newly authored bubbles it mirrors displayText.
//
// Annotation triggers:
//   - 'on-arrival' fires after navigating into the encounter route
//   - 'after-action' annotations queue in series after the action completes;
//     each shows for `durationMs`, then advances. With audio enabled, dwell
//     is overridden by audio.duration + 500ms buffer (see TourMode).
//   - 'on-banner' annotations wait for a specific banner kind to fire from
//     the simulation engine (reserved; no current fixture uses it).
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
      audioKey: "aldington-tte-pre",
      displayText: "Twenty-seven unread. Only nine are yours.",
      voiceText:
        "This card came from your Results Follow-Up box. Epic shows twenty-seven unread, but only nine are actually yours once you filter by provider. The same nine surface in a custom 'addressed to me' search. Kairos is designed to pull the union, deduplicate, and surface the real number. This card is one of those nine.",
      body: "Twenty-seven unread. Only nine are yours.",
      durationMs: 7500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "aldington-tte-arrival",
      title: "Mild AS, mild AR.",
      displayText: "Mild AS, mild AR.",
      voiceText:
        "Dr. Beckweldon reviewed Mr. Aldington's CTA. Mild aortic stenosis with mild aortic regurgitation. He wants a transthoracic echo to reassess. Watch what happens next.",
      body: "Mild AS, mild AR.",
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
            audioKey: "aldington-tte-pa1",
            title: "Same voice you've always written in.",
            displayText: "Same voice. Same sign-off.",
            voiceText:
              "Same opening attribution, same sign-off you've been writing for years. Drafted, not invented.",
            body: "Same voice. Same sign-off.",
            durationMs: 5500,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            audioKey: "aldington-tte-pa2",
            title: "Read the MyChart draft.",
            displayText: "Read the MyChart draft.",
            voiceText:
              "Take a moment with this one. The MyChart message drafts in parallel with the note — same clinical content, patient-friendly translation, parenthetical lay terms. This is the message Mr. Aldington would actually receive.",
            body: "Read the MyChart draft.",
            durationMs: 9000,
          },
          {
            trigger: "after-action",
            anchor: "order-pad",
            position: "left",
            style: "spotlight",
            audioKey: "aldington-tte-pa3",
            title: "All thirteen fields, pre-staged.",
            displayText: "Thirteen fields. Pre-staged.",
            voiceText:
              "Future date, code variant, reason, associated diagnoses, cosign route. You read it. You change anything that doesn't fit.",
            body: "Thirteen fields. Pre-staged.",
            durationMs: 5800,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "aldington-tte-auth",
      title: "One click.",
      displayText: "One click.",
      voiceText:
        "Note signed, MyChart drafted, order pended for cosign — that's the design. In Epic, this same workflow takes roughly fourteen clicks across five screens.",
      body: "One click.",
      durationMs: 5000,
    },
    transitionNarrator: {
      audioKey: "aldington-tte-trans",
      title: "Coming up — a simpler one.",
      displayText: "Coming up — a simpler one.",
      voiceText:
        "That's the most common card you'll see. About seventy percent of your day looks like this. Now a simpler one.",
      body: "Coming up — a simpler one.",
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
      audioKey: "wood-lipid-pre",
      displayText: "Same box. Simpler pattern.",
      voiceText:
        "Same box, simpler pattern. Lab results, no medication change, just patient education. This is pure synthesis — provider decided, you document.",
      body: "Same box. Simpler pattern.",
      durationMs: 5500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "wood-lipid-arrival",
      title: "Lipid panel review.",
      displayText: "Lipid panel review.",
      voiceText:
        "LDL at goal, HDL slightly below, triglycerides slightly elevated. Dr. Beckweldon isn't changing meds — he wants the patient educated on lifestyle.",
      body: "Lipid panel review.",
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
            audioKey: "wood-lipid-pa1",
            title: "Lifestyle counseling, embedded.",
            displayText: "Lifestyle counseling — embedded.",
            voiceText:
              "Notice the lifestyle counseling embedded automatically — exercise, diet, alcohol guidance for the HDL and triglyceride pattern. Built to encode the clinical IP that lives in patterns like this.",
            body: "Lifestyle counseling — embedded.",
            durationMs: 6500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "wood-lipid-auth",
      title: "Pure synthesis.",
      displayText: "Pure synthesis.",
      voiceText:
        "No orders. No labs to schedule. Just a clear note and a patient-friendly message. This card type is meant to handle most of a typical morning.",
      body: "Pure synthesis.",
      durationMs: 4800,
    },
    transitionNarrator: {
      audioKey: "wood-lipid-trans",
      title: "Next — something harder.",
      displayText: "Next — something harder.",
      voiceText:
        "Now something harder. Same box, but a med change and multiple follow-up labs.",
      body: "Next — something harder.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 3 — Hesperdale Crestor (Pattern 4)
  {
    fixtureId: "hesperdale-crestor",
    progressLabel: "Card 3 of 9 — Ms. Hesperdale",
    preArrivalNarrator: {
      title: "Card 3 of 9 — Ms. Hesperdale",
      audioKey: "hesperdale-crestor-pre",
      displayText: "More complex. Dose change plus labs.",
      voiceText:
        "This one's more complex. Dr. Beckweldon wants Crestor twenty increased to forty, and a lipid panel plus hepatic function panel rechecked in ninety days. In Epic, this is fourteen discrete actions. Watch.",
      body: "More complex. Dose change plus labs.",
      durationMs: 6500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "hesperdale-crestor-arrival",
      title: "Dose change plus lab cluster.",
      displayText: "Dose change plus lab cluster.",
      voiceText:
        "The provider's plan tells the system everything: discontinue old dose, place new dose, schedule two labs to the same future date, associate both with the same diagnosis.",
      body: "Dose change plus lab cluster.",
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
            audioKey: "hesperdale-crestor-pa1",
            title: "Dose-change diff.",
            displayText: "Dose-change diff.",
            voiceText:
              "Crestor twenty to forty. The discontinue reason auto-fills from the plan keywords. The audit-trail note drafts itself.",
            body: "Dose-change diff.",
            durationMs: 5500,
          },
          {
            trigger: "after-action",
            anchor: "order-pad",
            position: "left",
            style: "spotlight",
            audioKey: "hesperdale-crestor-pa2",
            title: "Lab cluster.",
            displayText: "Lab cluster — one row.",
            voiceText:
              "Both labs grouped to the same future date, same diagnosis association, one collapsible row instead of two separate orders.",
            body: "Lab cluster — one row.",
            durationMs: 5500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "hesperdale-crestor-auth",
      title: "Real complexity, handled.",
      displayText: "Real complexity, handled.",
      voiceText:
        "Roughly fourteen clicks in Epic. One in Kairos, by design.",
      body: "Real complexity, handled.",
      durationMs: 4200,
    },
    transitionNarrator: {
      audioKey: "hesperdale-crestor-trans",
      title: "Next — the boring case.",
      displayText: "Next — the boring case.",
      voiceText:
        "Now a different gear. A refill request the system can resolve from a rule, not a synthesis. Some work is automatic.",
      body: "Next — the boring case.",
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
      audioKey: "norreys-transactional-pre",
      displayText: "Rx Request box. The boring case.",
      voiceText:
        "Rx Request box. Mr. Norreys had an INR-driven dose decrease nine days ago — six-point-five to six milligrams of warfarin — and now wants the new dose refilled. The boring case. Watch what 'boring' looks like when the rule does the work.",
      body: "Rx Request box. The boring case.",
      durationMs: 5800,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "norreys-transactional-arrival",
      title: "Three preconditions, all met.",
      displayText: "Three preconditions, all met.",
      voiceText:
        "Last visit nine days ago, future appointment booked, diagnosis still active. Three preconditions — that's a clean Rx Request. No clinical reasoning needed.",
      body: "Three preconditions, all met.",
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
            audioKey: "norreys-transactional-pa1",
            title: "Standard documentation.",
            displayText: "Standard documentation.",
            voiceText:
              "One short note. Records the dose change, the rule that fired, the next INR date. Nothing the nurse would have to think about — but it still has to be in the chart.",
            body: "Standard documentation.",
            durationMs: 5800,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            audioKey: "norreys-transactional-pa2",
            title: "One-line confirmation.",
            displayText: "One-line confirmation.",
            voiceText:
              "Confirms what the patient asked. No medical interpretation, no extra detail. The transactional reply Kairos is designed to draft when nothing else is in question.",
            body: "One-line confirmation.",
            durationMs: 5800,
          },
          {
            trigger: "after-action",
            anchor: "order-pad",
            position: "left",
            style: "spotlight",
            audioKey: "norreys-transactional-pa3",
            title: "Rule-driven refill.",
            displayText: "Rule-driven refill.",
            voiceText:
              "Ninety days, three refills, standard diagnosis, Skarsdale cosign. Pre-staged from the Coumadin Clinic Rx Request rule. Read it, change anything that doesn't fit.",
            body: "Rule-driven refill.",
            durationMs: 5800,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "norreys-transactional-auth",
      title: "One-click. Or automatic.",
      displayText: "One-click. Or automatic.",
      voiceText:
        "Some work is one-click. Some work is automatic. Kairos is designed to sort which is which — so the nurse only sees what actually needs a nurse.",
      body: "One-click. Or automatic.",
      durationMs: 5500,
    },
    transitionNarrator: {
      audioKey: "norreys-transactional-trans",
      title: "Next — a question with no safe answer yet.",
      displayText: "Next — a careful question.",
      voiceText:
        "Now a patient asks something Kairos can't safely answer alone. Watch what it does instead.",
      body: "Next — a careful question.",
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
      audioKey: "quennell-scope-pre",
      displayText: "A vague question, then a clarification.",
      voiceText:
        "Ms. Quennell had elevated H&H last week. Yesterday she asked: 'could this cause low blood pressure?' Vague reference. Kairos asked her what 'this' meant. She clarified. Now Kairos has to answer — carefully.",
      body: "A vague question, then a clarification.",
      durationMs: 6000,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "quennell-scope-arrival",
      title: "Two messages, one thread.",
      displayText: "Two messages, one thread.",
      voiceText:
        "Original vague reference plus the clarification. Cardiology nursing scope is the cardiology workup. Hematology effects on blood pressure belong to hematology.",
      body: "Two messages, one thread.",
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
            audioKey: "quennell-scope-pa1",
            title: "Scope rail engaged.",
            displayText: "Scope rail engaged.",
            voiceText:
              "The note documents the clarification round-trip and the scope decision. Kairos is designed to recognize when a question is out of cardiology nurse scope before drafting an answer.",
            body: "Scope rail engaged.",
            durationMs: 6500,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            audioKey: "quennell-scope-pa2",
            title: "Redirected, not answered.",
            displayText: "Redirected, not answered.",
            voiceText:
              "Brief reply, redirected to hematology where the referral already lives. No interpretation of H&H and blood pressure. Answers what's safe to answer; routes the rest to who can.",
            body: "Redirected, not answered.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "quennell-scope-auth",
      title: "Knows what it doesn't know.",
      displayText: "Knows what it doesn't know.",
      voiceText:
        "Kairos doesn't pretend to know what it can't know. The system is designed to recognize scope and route accordingly.",
      body: "Knows what it doesn't know.",
      durationMs: 5500,
    },
    transitionNarrator: {
      audioKey: "quennell-scope-trans",
      title: "Next — when chart and patient disagree.",
      displayText: "Next — chart vs. patient.",
      voiceText:
        "Now a patient statement that contradicts the chart. Watch what gets drafted — and what doesn't.",
      body: "Next — chart vs. patient.",
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
      audioKey: "maundrell-contradiction-pre",
      displayText: "INR overdue. Patient says he stopped.",
      voiceText:
        "INR overdue MyChart template went out on the twenty-fourth. Mr. Maundrell replied today: 'Dr. M told me to stop warfarin.' Chart still shows it active, last therapeutic INR five days ago, no provider note documenting any discontinuation. Watch.",
      body: "INR overdue. Patient says he stopped.",
      durationMs: 6500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "maundrell-contradiction-arrival",
      title: "Two facts that can't both be right.",
      displayText: "Two facts. Both can't be right.",
      voiceText:
        "Patient says the medication is stopped. Chart says it isn't. They can't both be right — and Kairos isn't the one who gets to decide which.",
      body: "Two facts. Both can't be right.",
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
            audioKey: "maundrell-contradiction-pa1",
            title: "Contradiction documented.",
            displayText: "Contradiction documented.",
            voiceText:
              "The note records what the patient said and what the chart shows, side by side. Forwarded to Skarsdale for verification. No autonomous reply — the patient deserves a real answer, and that has to come from a provider.",
            body: "Contradiction documented.",
            durationMs: 7000,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            audioKey: "maundrell-contradiction-pa2",
            title: "MyChart pane held.",
            displayText: "MyChart held — no draft.",
            voiceText:
              "No draft message. The system is designed to hold patient-facing replies when the source artifact and the chart disagree. Synthesis is also a safety surface.",
            body: "MyChart held — no draft.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "maundrell-contradiction-auth",
      title: "Same INR. Different plan.",
      displayText: "Same INR. Different plan.",
      voiceText:
        "Same INR result. Different plan. Kairos noticed. The contradiction is the output — not the reply.",
      body: "Same INR. Different plan.",
      durationMs: 5500,
    },
    transitionNarrator: {
      audioKey: "maundrell-contradiction-trans",
      title: "Next — multi-stage.",
      displayText: "Next — multi-stage.",
      voiceText:
        "Now multi-stage. A patient called with chest symptoms. This is a two-hour clinical investigation, condensed.",
      body: "Next — multi-stage.",
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
      audioKey: "underwell-full-lifecycle-pre",
      displayText: "One card. Three stages.",
      voiceText:
        "Mrs. Underwell called the clinic — blood pressure feels high, fuzzy thinking, swollen feet. She wants to talk to a nurse. This is one card with three stages. Watch all three fire in sequence.",
      body: "One card. Three stages.",
      durationMs: 6500,
    },
    onArrival: {
      anchor: "action-bar",
      position: "top",
      style: "spotlight",
      audioKey: "underwell-full-lifecycle-arrival",
      title: "Three stages.",
      displayText: "Three stages.",
      voiceText:
        "Generate Inquiry, Process Reply, Synthesize Callback. Each one is a different point in a multi-hour investigation.",
      body: "Three stages.",
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
            audioKey: "underwell-full-lifecycle-pa1",
            title: "Stage 1 — chart-aware questions.",
            displayText: "Stage one — chart-aware questions.",
            voiceText:
              "Sixteen questions across five categories, tuned to her actual chart — hypertension, atrial fibrillation, coronary artery disease, mitral regurgitation, chronic kidney disease, peripheral edema.",
            body: "Stage one — chart-aware questions.",
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
            audioKey: "underwell-full-lifecycle-pa2",
            title: "Stage 2 — SBAR.",
            displayText: "Stage two — SBAR.",
            voiceText:
              "Three clinical sharps embedded — blood pressures at goal but the patient perceives them as high; persistent edema means the dose reduction failed; new bilateral hand paresthesias flagged as new.",
            body: "Stage two — SBAR.",
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
            audioKey: "underwell-full-lifecycle-pa3",
            title: "Stage 3 — cross-note synthesis.",
            displayText: "Stage three — cross-note synthesis.",
            voiceText:
              "Dr. Beckweldon signed two notes — primary plan plus an addendum about BNP and Holter monitor. Kairos absorbed both into one unified callback.",
            body: "Stage three — cross-note synthesis.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "underwell-full-lifecycle-auth",
      title: "Two hours of clinical work.",
      displayText: "Two hours of clinical work.",
      voiceText:
        "One card. Three minutes of nurse cognitive engagement, distributed across the day. The investigation is designed to persist across stages — Kairos would remember where you left off.",
      body: "Two hours of clinical work.",
      durationMs: 6000,
    },
    transitionNarrator: {
      audioKey: "underwell-full-lifecycle-trans",
      title: "Next — a patient with no MyChart.",
      displayText: "Next — no MyChart.",
      voiceText:
        "Now something different — a patient with no MyChart. Watch what changes.",
      body: "Next — no MyChart.",
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
      audioKey: "wexbury-phone-pre",
      displayText: "Eighty-three. No MyChart.",
      voiceText:
        "Mrs. Wexbury is eighty-three. She doesn't have MyChart active. Most apps would draft her a MyChart message anyway and leave you to figure it out. Kairos drafts an example of how you might explain the result on the phone instead — words you can use, edit, or skip.",
      body: "Eighty-three. No MyChart.",
      durationMs: 6000,
    },
    onArrival: {
      anchor: "patient-header",
      position: "bottom",
      style: "spotlight",
      audioKey: "wexbury-phone-arrival",
      title: "MyChart status: Pending.",
      displayText: "MyChart status: Pending.",
      voiceText:
        "See the patient header. MyChart Pending — the routing decision tree noticed automatically, and shifted the bottom-left pane to an example explanation rather than a written reply.",
      body: "MyChart status: Pending.",
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
            audioKey: "wexbury-phone-pa1",
            title: "An example, not a script.",
            displayText: "An example. Not a script.",
            voiceText:
              "This is an example of how you might explain it. Not a script to read — talking points to use as much or as little as you want. Built from the best clinical communication patterns we've seen. Note the chip: this pane never goes into the patient record.",
            body: "An example. Not a script.",
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
            audioKey: "wexbury-phone-pa2",
            title: "Voicemail talking points.",
            displayText: "Voicemail talking points.",
            voiceText:
              "Same example framing, condensed for unreachable patients. Use what fits, edit what doesn't, skip what's not relevant. Still ephemeral — not part of the chart.",
            body: "Voicemail talking points.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "wexbury-phone-auth",
      title: "Channel-aware example.",
      displayText: "Channel-aware example.",
      voiceText:
        "Same clinical content, different example. Because phone calls and MyChart messages are different cognitive instruments — and either way, the words are yours.",
      body: "Channel-aware example.",
      durationMs: 5500,
    },
    transitionNarrator: {
      audioKey: "wexbury-phone-trans",
      title: "One more — the closer.",
      displayText: "One more. The closer.",
      voiceText: "One more. The closer.",
      body: "One more. The closer.",
      durationMs: 3000,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 9 — Larvendel denial cascade (Pattern 13)
  {
    fixtureId: "larvendel-denial-cascade",
    progressLabel: "Card 9 of 9 — Ms. Larvendel",
    preArrivalNarrator: {
      title: "Card 9 of 9 — Ms. Larvendel",
      audioKey: "larvendel-denial-cascade-pre",
      displayText: "Eight days. Two denials.",
      voiceText:
        "Eight days. Two denials. Four Epic surfaces. Today this lives in working memory because Epic can't surface it as one thing — Kairos is designed to. Watch.",
      body: "Eight days. Two denials.",
      durationMs: 5800,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "larvendel-denial-cascade-arrival",
      title: "Eight-day timeline.",
      displayText: "Eight-day timeline.",
      voiceText:
        "Nuclear stress test ordered the second. Denied the twenty-first by Evolent guideline seven-three-one-two. Stress echo offered, patient can't walk treadmill. Lexiscan ordered, then cancelled. CTA Coronary ordered. Today, the twenty-ninth — denied again. Peer-to-peer available, today only.",
      body: "Eight-day timeline.",
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
            audioKey: "larvendel-denial-cascade-pa1",
            title: "Auth-state badge.",
            displayText: "Auth-state badge.",
            voiceText:
              "Peer-to-peer countdown — deadline-bound urgency, a new variant Epic doesn't model.",
            body: "Auth-state badge.",
            durationMs: 5500,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "left",
            style: "spotlight",
            audioKey: "larvendel-denial-cascade-pa2",
            title: "Denial-acknowledgment frame.",
            displayText: "Denial-acknowledgment frame.",
            voiceText:
              "The outreach drafts in denial-acknowledgment frame, not routine imaging-review frame. 'Yet another test denied' — the patient feels seen.",
            body: "Denial-acknowledgment frame.",
            durationMs: 6000,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "left",
            style: "spotlight",
            audioKey: "larvendel-denial-cascade-pa3",
            title: "Multi-channel correlation.",
            displayText: "Multi-channel correlation.",
            voiceText:
              "Voicemail left and MyChart sent simultaneously. The acknowledgment line auto-correlates.",
            body: "Multi-channel correlation.",
            durationMs: 5500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "larvendel-denial-cascade-auth",
      title: "One card.",
      displayText: "One card.",
      voiceText:
        "Eight days. Two denials. Four Epic surfaces. One persistent investigation object that doesn't disappear when you log out.",
      body: "One card.",
      durationMs: 6500,
    },
    transitionNarrator: null, // last fixture, goes to TourEndModal
  },
];

export default TOUR_SCRIPT;
