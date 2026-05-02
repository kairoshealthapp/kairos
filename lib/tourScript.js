// Phase 3.3 — Tour Mode master script. 9 fixtures, scripted in order.
//
// Two-tier narration per bubble:
//   - displayText: short on-screen headline (4-8 words). Anchors the moment.
//   - quickVoiceText: ~12-min Quick Tour narration. Audio at /tour-audio/{audioKey}.mp3
//   - deepVoiceText:  ~22-min Deep Tour narration. Audio at /tour-audio/{audioKey}-deep.mp3
//   - audioKey: stable filename root.
//
// Legacy `body` field mirrors displayText (graceful fallback).
//
// FRAMING GUARDRAILS (apply to BOTH narration tiers):
//   - No first-person past tense implying real-world use.
//   - "Kairos is designed to..." / "In a case like this..." — observational/design-stage only.

const TOUR_SCRIPT = [
  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 1 — Anderson TTE (Pattern 2)
  {
    fixtureId: "aldington-tte",
    progressLabel: "Card 1 of 9 — Mr. Anderson",
    preArrivalNarrator: {
      title: "Card 1 of 9 — Mr. Anderson",
      audioKey: "anderson-tte-pre",
      targetCard: "aldington-tte",
      cursor: {
        target: '[data-encounter-id="aldington-tte"]',
        startTime: 500,
        arriveTime: 2200,
        clickTime: null,
      },
      displayText: "Plenty unread. Only some are yours.",
      quickVoiceText:
        "Plenty unread in your Results Follow-Up box. Only some are yours after you filter by provider. Most apps stop at the basket count. Kairos doesn't. Built from ninety days of cardiology practice.",
      deepVoiceText:
        "Robert Anderson, sixty-one. Dr. Pendrelle reviewed his C-T-A chest yesterday — mild aortic stenosis, mild aortic regurgitation, possibly a bicuspid aortic valve. Plan: transthoracic echo to reassess. The Result Note dropped into your Results Follow-Up box overnight. Mornings look like this — plenty of unread items, only some yours after you filter by provider. Most apps stop at the basket count. Kairos doesn't. Built from ninety days of synthesis patterns observed directly in cardiology practice.",
      body: "Plenty unread. Only some are yours.",
      durationMs: 7500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "anderson-tte-arrival",
      targetButton: "generate-note-mychart",
      // Cue line "Watch what happens here instead." sits at the END of both
      // narrations. Quick audio = 15.1s, cue at ~13.1s. Deep audio = 60.6s,
      // cue at ~58.7s. Cursor stays parked off-screen until the cue, then
      // slides to Generate so arrival lands on the word "watch".
      cursor: {
        target: "#kairos-action-generate-note-mychart",
        // Quick narration tightened in Pass C — chars 250→205 (~18% cut).
        // Cue "Watch what happens here instead" stays at the end; cursor
        // timings scaled by 0.82 so arrival still lands on "watch".
        startTime: 9500,
        arriveTime: 10800,
        clickTime: 11900,
        deep: {
          // Deep narration also tightened in Pass C — chars ~1100→~720
          // (~35% cut). Cursor timings scaled by 0.65 so the cue still
          // lands at the end of the new MP3.
          startTime: 37200,
          arriveTime: 38200,
          clickTime: 39100,
        },
      },
      title: "Mild AS, mild AR.",
      displayText: "Mild AS, mild AR.",
      quickVoiceText:
        "In pure Epic — read the Result Note, call Mr. Anderson, explain the C-T-A from memory, draft note plus MyChart from scratch, type the T-T-E with thirteen fields by hand. Watch what happens here instead.",
      deepVoiceText:
        "Here's how this card goes in pure Epic. You read the Result Note. You call Mr. Anderson. You explain the C-T-A findings from memory — aortic stenosis, ejection fraction, what you remember from the last time Pendrelle ordered a T-T-E for a similar finding. He asks if it's serious. You give him the best answer in the moment. You hang up. Then you write the nurse note from scratch. You write the MyChart message from scratch using different phrasing — written register is different from spoken. You open orders, type T-T-E, and try to remember thirteen fields — indication, priority, symptoms code, diagnosis link, routing, coverage, prior auth flag. You catch most. You miss some. You come back when the order routes back. Next card. Watch what happens here instead.",
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
            audioKey: "anderson-tte-pa1",
            title: "Same voice you've always written in.",
            displayText: "Same voice. Same sign-off.",
            quickVoiceText:
              "Your attribution. Your sign-off. Drafted from your prior notes — not reconstructed from working memory at hour eight.",
            deepVoiceText:
              "Watch the nurse note. Same opening attribution. Same sign-off. Pulled forward from your prior notes — your phrasing, your style, drafted at the level you'd write on your sharpest morning, not on hour eight. No reconstruction from working memory. The system has the chart open and writes from it.",
            body: "Same voice. Same sign-off.",
            durationMs: 5500,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            audioKey: "anderson-tte-pa2",
            title: "Read the MyChart draft.",
            displayText: "Read the MyChart draft.",
            quickVoiceText:
              "MyChart drafts at the same time — patient-facing register, lay translations, follow-up timing explicit. The parts that drop at hour eight when you write from scratch.",
            deepVoiceText:
              "MyChart drafts at the same time. Read it. Same clinical content as the note, in patient-facing register. Brand names with lay translations. Symptom watch-list. Follow-up timing stated explicitly. These are the parts that drop from a from-scratch MyChart at hour eight, when you're tired and the next card is calling. Here, every patient gets the same depth — first card or thirty-first.",
            body: "Read the MyChart draft.",
            durationMs: 9000,
          },
          {
            trigger: "after-action",
            anchor: "order-pad",
            position: "left",
            style: "spotlight",
            audioKey: "anderson-tte-pa3",
            title: "All thirteen fields, pre-staged.",
            displayText: "Thirteen fields. Pre-staged.",
            quickVoiceText:
              "Thirteen fields — future date, code variant, reason, diagnoses, cosign route. All filled correctly. At hour eight, careful nurses miss fields. Orders kick back. Kairos doesn't get tired.",
            deepVoiceText:
              "Standardization lives here. Thirteen fields on this T-T-E order — every one filled correctly. Future date. Code variant. Reason. Associated diagnoses. Cosign route. Stroke and T-I-A screening, answered. Saline bubble study, answered. This isn't just faster than Epic. It's better than Epic. At hour eight, after thirty cards from working memory, careful nurses miss fields. Orders kick back. The patient waits another day. Kairos doesn't get tired.",
            body: "Thirteen fields. Pre-staged.",
            durationMs: 5800,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "anderson-tte-auth",
      // Pass D Phase 4 — Brandon's smoke-test flagged Card 1 as missing
      // the cursor move to Authorize. Quick narration ~205 chars, audio
      // ~13.2s; click ~500ms before audio ends so the ripple syncs with
      // the auto-authorize firing. Deep narration ~415 chars, ~26.8s.
      cursor: {
        target: "#kairos-action-authorize",
        startTime: 10500,
        arriveTime: 11800,
        clickTime: 12700,
        deep: {
          startTime: 24000,
          arriveTime: 25300,
          clickTime: 26300,
        },
      },
      title: "One click.",
      displayText: "One click.",
      quickVoiceText:
        "Note signed, MyChart sent, order pended for cosign. In Epic today: fourteen clicks across five screens — different every shift, every nurse. Here: every order the same correct way. The floor rises.",
      deepVoiceText:
        "One click. Note signed. MyChart sent. Order pended for Pendrelle's cosign. Today this is fourteen clicks across five Epic screens — different every nurse, every shift, every patient. The bigger story isn't the click count. It's that every T-T-E order Kairos pre-stages has the same thirteen fields filled the same correct way. The floor rises. Senior-nurse depth becomes the floor.",
      body: "One click.",
      durationMs: 5000,
    },
    transitionNarrator: {
      audioKey: "anderson-tte-trans",
      title: "Coming up — a simpler one.",
      displayText: "Coming up — a simpler one.",
      quickVoiceText:
        "Most common card you'll see — about seventy percent of your day. Now a simpler one — pure synthesis, no orders.",
      deepVoiceText:
        "Everyday Result Note — about seventy percent of your day. Now the simpler version: pure synthesis, no orders.",
      body: "Coming up — a simpler one.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 2 — Henderson lipid (Pattern 1)
  {
    fixtureId: "wood-lipid",
    progressLabel: "Card 2 of 9 — Mrs. Henderson",
    preArrivalNarrator: {
      title: "Card 2 of 9 — Mrs. Henderson",
      audioKey: "henderson-lipid-pre",
      targetCard: "wood-lipid",
      cursor: {
        target: '[data-encounter-id="wood-lipid"]',
        startTime: 500,
        arriveTime: 2200,
        clickTime: null,
      },
      displayText: "Same box. Simpler pattern.",
      quickVoiceText:
        "Mrs. Henderson, sixty-eight. Lipid panel review — no med change, patient education only. Pure synthesis: provider decided, you document and educate.",
      deepVoiceText:
        "Mrs. Henderson, sixty-eight. Lipid panel review. L-D-L at goal, H-D-L slightly below, triglycerides slightly elevated. Pendrelle isn't changing meds — he wants the patient educated on lifestyle. Most of your morning — about seventy percent of what hits your basket. Pure synthesis: provider decided, you document, you educate.",
      body: "Same box. Simpler pattern.",
      durationMs: 5500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "henderson-lipid-arrival",
      // Cursor: Deep tier only. Quick onArrival narration is a continuous
      // pure-Epic arc with no natural mid-text cue, so we let the cursor
      // stay parked from the preArrival dashboard-card move and skip
      // Quick (quick.target null disables the move via CursorGhost's
      // no-target early-return). Deep narration arc-closes on
      // "Each lipid review is a one-off" at ~43s; cursor slides to
      // Generate at the cue and clicks just before the audio ends so
      // the visual ripple lands on the auto-action firing.
      cursor: {
        // Pass D Phase 4 — Brandon's smoke-test flagged Card 2 Quick as
        // missing the cursor move to Generate (the original config had
        // quick.target=null). Quick narration is ~205 chars, audio ~13s;
        // cursor arrives near the end so the click lands as the bubble
        // dwell expires and the auto-action fires.
        target: "#kairos-action-generate-note-mychart",
        startTime: 10500,
        arriveTime: 11800,
        clickTime: 12700,
        deep: {
          // Deep narration tightened in Pass C — chars 735→510 (~31% cut).
          // Cursor timings scaled by 0.69.
          startTime: 28700,
          arriveTime: 29700,
          clickTime: 33200,
        },
      },
      title: "Lipid panel review.",
      displayText: "Lipid panel review.",
      quickVoiceText:
        "L-D-L at goal, H-D-L slightly below, triglycerides elevated. Pendrelle isn't changing meds — wants lifestyle education. In pure Epic, written from scratch every time, phrasing drifts shift to shift.",
      deepVoiceText:
        "In pure Epic, you've written this card a thousand times. You read the labs. You call. You explain L-D-L and H-D-L from memory. You try to remember the lifestyle counseling — Mediterranean eating, exercise targets, alcohol guidance for the triglyceride pattern. You've said it two thousand times. Sometimes you remember follow-up timing. Sometimes you don't, late shift. You write the note from scratch. You write the MyChart from scratch. Different phrasing than yesterday's lipid review. Different phrasing than the nurse next to you. Each lipid review is a one-off — same clinical content, different quality of explanation.",
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
            audioKey: "henderson-lipid-pa1",
            title: "Lifestyle counseling, embedded.",
            displayText: "Lifestyle counseling — embedded.",
            quickVoiceText:
              "Lifestyle counseling embedded automatically. Exercise, diet, alcohol — specific guidance for this patient's H-D-L and triglyceride pattern. Same depth every time, regardless of nurse or shift.",
            deepVoiceText:
              "Lifestyle counseling, embedded automatically. Exercise. Diet. Alcohol. Specific guidance for this patient's H-D-L and triglyceride pattern — drawn from a clinical reasoning library. Same depth every time. Same lay translation every time. Follow-up timing stated explicitly. Standardization-of-care isn't a buzzword — it's the floor of patient education rising. Regardless of nurse, day, or whether it's the first call of the shift or the thirty-first.",
            body: "Lifestyle counseling — embedded.",
            durationMs: 6500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "henderson-lipid-auth",
      // Cursor moves to Authorize at the "The floor rises" cue line in
      // both tiers. Quick narration ~11s; Deep ~14s. Click lands ~500ms
      // before audio ends so the visual ripple syncs with the
      // auto-authorize event firing right after narration completes.
      cursor: {
        target: "#kairos-action-authorize",
        // Quick narration tightened in Pass C — chars 180→145 (~19% cut).
        // Cursor timings scaled by 0.81 so arrival and click still align
        // with the 'The floor rises' cue and audio tail in the new MP3.
        startTime: 2300,
        arriveTime: 3500,
        clickTime: 8500,
        deep: {
          // Deep narration also tightened — chars 245→205 (~16% cut).
          // Cursor timings scaled by 0.84.
          startTime: 3000,
          arriveTime: 4300,
          clickTime: 11400,
        },
      },
      title: "Pure synthesis.",
      displayText: "Pure synthesis.",
      quickVoiceText:
        "No orders. No labs. Just a clear note and a patient-friendly message. The floor rises — same depth of explanation, regardless of which nurse is on shift.",
      deepVoiceText:
        "No orders. No labs to schedule. A clear note and a patient-friendly message. The floor rises. Every patient gets the same depth of explanation — regardless of which nurse is on shift or how busy the day got.",
      body: "Pure synthesis.",
      durationMs: 4800,
    },
    transitionNarrator: {
      audioKey: "henderson-lipid-trans",
      title: "Next — something harder.",
      displayText: "Next — something harder.",
      quickVoiceText:
        "Harder next. Same box, med change plus multi-lab follow-up. Real cognitive load.",
      deepVoiceText:
        "Harder next. Same box — med change and multi-lab follow-up. Real cognitive load.",
      body: "Next — something harder.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 3 — Bennett Crestor (Pattern 4)
  {
    fixtureId: "hesperdale-crestor",
    progressLabel: "Card 3 of 9 — Ms. Bennett",
    preArrivalNarrator: {
      title: "Card 3 of 9 — Ms. Bennett",
      audioKey: "bennett-crestor-pre",
      targetCard: "hesperdale-crestor",
      cursor: {
        target: '[data-encounter-id="hesperdale-crestor"]',
        startTime: 500,
        arriveTime: 2200,
        clickTime: null,
      },
      displayText: "More complex. Dose change plus labs.",
      quickVoiceText:
        "Crestor twenty to forty, plus lipid panel and hepatic function panel in ninety days. In pure Epic — fourteen discrete actions. Watch.",
      deepVoiceText:
        "Ms. Bennett, fifty-nine. Lipid panel and chem-eight reviewed. L-D-L one-forty-two, above goal. Pendrelle wants Crestor uptitrated — twenty milligrams to forty — plus lipid panel and hepatic function panel rechecked together in ninety days. In pure Epic, this card is roughly fourteen discrete actions. Watch.",
      body: "More complex. Dose change plus labs.",
      durationMs: 6500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "bennett-crestor-arrival",
      // Cursor sweeps to Generate Note + MyChart at the "At hour eight"
      // wrap-up cue in both tiers. Quick narration ~13.6s; Deep ~56.2s.
      // Click ~500ms before each tier's audio ends so the visual ripple
      // aligns with the auto-action firing right after onArrival ends.
      cursor: {
        target: "#kairos-action-generate-note-mychart",
        // Quick narration tightened in Pass C — chars 245→200 (~18% cut).
        // Cursor timings scaled by 0.82.
        startTime: 6900,
        arriveTime: 8100,
        clickTime: 10700,
        deep: {
          // Deep narration tightened in Pass C — chars 1010→690 (~32% cut).
          // Cursor timings scaled by 0.68.
          startTime: 31600,
          arriveTime: 32600,
          clickTime: 37900,
        },
      },
      title: "Dose change plus lab cluster.",
      displayText: "Dose change plus lab cluster.",
      quickVoiceText:
        "In pure Epic, real cognitive load — manually pulling prior A-S-T, A-L-T, last three lipid panels to see the trend. At hour eight, the trend check sometimes gets skipped.",
      deepVoiceText:
        "In pure Epic, this card is real cognitive load — but the load isn't second-guessing the dose. That's Pendrelle's call. The load is everything the nurse needs before the patient picks up. You'd manually scroll back for prior A-S-T and A-L-T values, the last three lipid panels, any side-effect notes — so you can explain why the dose is going up, anticipate her questions, make the MyChart specific to her trajectory rather than generic, and catch anything that should pause the order. Forty-five seconds of scrolling just to do the patient-facing work right. The kind of card a senior nurse handles in two minutes and a newer nurse handles in seven. At hour eight, that prep gets compressed — and the patient gets a thinner explanation than they would have at hour two.",
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
            audioKey: "bennett-crestor-pa1",
            title: "Dose-change diff.",
            displayText: "Dose-change diff.",
            quickVoiceText:
              "Discontinue Crestor twenty, place Crestor forty. Audit-trail note populates from the plan — per Pendrelle. Discontinue reason filled, cosign route set. Nothing from working memory.",
            deepVoiceText:
              "Discontinue Crestor twenty. Place Crestor forty. Audit-trail note populates from the plan — increasing to forty milligrams from twenty per Pendrelle. Discontinue reason filled. Cosign route set. Nothing constructed from working memory at hour eight.",
            body: "Dose-change diff.",
            durationMs: 5500,
          },
          {
            trigger: "after-action",
            anchor: "order-pad",
            position: "left",
            style: "spotlight",
            audioKey: "bennett-crestor-pa2",
            title: "Lab cluster.",
            displayText: "Lab cluster — one row.",
            quickVoiceText:
              "Both labs, same future date, same diagnosis. One row instead of two separate orders by hand. Kairos places orders in the relationships that exist clinically.",
            deepVoiceText:
              "Both labs grouped to the same future date — three months out. Same diagnosis association. One collapsible row instead of two separate orders, two diagnosis lookups, two future-date entries done by hand. This is the lab-cluster primitive. Kairos places orders in the relationships that actually exist clinically. A lipid panel and a hepatic function panel, checked together, because that's how you monitor a forty-milligram statin uptitration.",
            body: "Lab cluster — one row.",
            durationMs: 5500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "bennett-crestor-auth",
      targetButton: "authorize",
      // Replaced the old immediate-sweep-and-mid-narration-click pattern
      // (startTime 300 / clickTime 3300) with Card 1's end-of-narration
      // alignment. Cursor arrives just before audio ends so its ripple
      // syncs with the auto-authorize firing — no double-click visual.
      cursor: {
        target: "#kairos-action-authorize",
        // Quick narration tightened in Pass C — chars 225→190 (~16% cut).
        // Cursor timings scaled by 0.84.
        startTime: 8700,
        arriveTime: 10000,
        clickTime: 11250,
        deep: {
          // Deep narration tightened in Pass C — chars 350→260 (~26% cut).
          // Cursor timings scaled by 0.74.
          startTime: 13000,
          arriveTime: 14100,
          clickTime: 14800,
        },
      },
      title: "Real complexity, handled.",
      displayText: "Real complexity, handled.",
      quickVoiceText:
        "Fourteen clicks in Epic. One in Kairos. The deeper win is consistency — Kairos always pulls the trend, always checks tolerability. Synthesis like this used to need a senior nurse with thirty minutes.",
      deepVoiceText:
        "Fourteen clicks in Epic. One in Kairos, by design. The deeper win is consistency. Kairos always pulls the trend. Always checks tolerability. Synthesis at this level used to require a senior nurse with thirty minutes. With Kairos, it's the floor — every call, every shift, regardless of fatigue.",
      body: "Real complexity, handled.",
      durationMs: 4200,
    },
    transitionNarrator: {
      audioKey: "bennett-crestor-trans",
      title: "Next — the boring case.",
      displayText: "Next — the boring case.",
      quickVoiceText:
        "Different gear — a refill the system resolves from a rule, not synthesis. The boring case.",
      deepVoiceText:
        "Different gear — a refill the system resolves from a rule, not synthesis. The boring case. And an important one.",
      body: "Next — the boring case.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 4 — Stewart transactional (Pattern 9)
  {
    fixtureId: "norreys-transactional",
    progressLabel: "Card 4 of 9 — Mr. Stewart",
    preArrivalNarrator: {
      title: "Card 4 of 9 — Mr. Stewart",
      audioKey: "stewart-transactional-pre",
      targetCard: "norreys-transactional",
      cursor: {
        target: '[data-encounter-id="norreys-transactional"]',
        startTime: 500,
        arriveTime: 2200,
        clickTime: null,
      },
      displayText: "Rx Request box. The boring case.",
      quickVoiceText:
        "Rx Request box. Mr. Stewart — supratherapeutic I-N-R nine days ago. Reynolds dropped warfarin six-point-five to six. Today he wants the refill. Same rule, fifty times a shift.",
      deepVoiceText:
        "Mr. Stewart, sixty-five. KOO-muh-din Clinic patient. Nine days ago his I-N-R ran three-point-nine — supratherapeutic — and Reynolds dropped his warfarin from six-point-five milligrams to six. Today he replied asking for the refill. The Rx Request box is full of these — same rule, same shape, fifty times a shift.",
      body: "Rx Request box. The boring case.",
      durationMs: 5800,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "stewart-transactional-arrival",
      // Cursor sweeps to Generate Reply at the "at hour eight" cue when
      // narration arc-closes. Quick 18.7s; Deep 56.3s. Click ~500ms
      // before audio ends so the ripple syncs with auto-action firing.
      cursor: {
        target: "#kairos-action-generate-reply",
        // Quick narration tightened in Pass C — chars 315→250 (~21% cut).
        // Cursor timings scaled by 0.79.
        startTime: 10750,
        arriveTime: 11900,
        clickTime: 14400,
        deep: {
          // Deep narration tightened in Pass C — chars ~1080→~720 (~33% cut).
          // Cursor timings scaled by 0.67.
          startTime: 26500,
          arriveTime: 27500,
          clickTime: 37400,
        },
      },
      title: "Two preconditions, both met.",
      displayText: "Two preconditions, both met.",
      quickVoiceText:
        "In pure Epic, the same algorithm runs in your head — seen by cardiology in the last year, future appointment booked. Both conditions, full refill. Either missing, thirty days only. The rule lives in working memory — at hour eight, twenty refills behind you, it drifts.",
      deepVoiceText:
        "Here's the algorithm every nurse runs in her head when a refill request lands. Has this patient been seen by cardiology in the last year? Click into the chart. Last cardiology encounter — yes, three months ago. Future appointment on the books? Click the schedule. Yes, in six weeks. Both conditions met — full refill, ninety days, three refills, document the rule, sign. Or no future appointment: thirty-day refill only, document the kickout, route to the Cardiology Support Staff Pool with a note saying needs appointment scheduled before next refill. Same rule every time. But it lives in your head. At hour eight, twenty refills behind you and ten ahead, the rule drifts. Sometimes the kickout note routes to the wrong pool. Sometimes the patient never gets the follow-up because the kickout got lost in the front desk inbox.",
      body: "Two preconditions, both met.",
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
            audioKey: "stewart-transactional-pa1",
            title: "Standard documentation.",
            displayText: "Standard documentation.",
            quickVoiceText:
              "Short note — records the dose change, the rule that fired, the next I-N-R date. Today: typed from memory, phrasing drifts. Here: same way every time.",
            deepVoiceText:
              "One short note. Records the dose change, the rule that fired, the next I-N-R date. Nothing the nurse has to think about — but it still has to be in the chart. The next nurse who picks up this patient needs to see why ninety days got picked instead of thirty. Today that gets typed from memory, phrasing drifts nurse to nurse and shift to shift. Here, stated the same way every time.",
            body: "Standard documentation.",
            durationMs: 5800,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            audioKey: "stewart-transactional-pa2",
            title: "One-line confirmation.",
            displayText: "One-line confirmation.",
            quickVoiceText:
              "One-line confirmation. No interpretation, no over-promising — 'got it, your six-milligram refill has been sent.' Clear answer, not a wall of text or no message at all.",
            deepVoiceText:
              "One-line confirmation. No interpretation, no extra detail, no over-promising. 'Got it, your warfarin six-milligram refill has been sent.' Kairos drafts this when nothing else is in question. The patient gets a clear answer instead of a wall of text or no message at all.",
            body: "One-line confirmation.",
            durationMs: 5800,
          },
          {
            trigger: "after-action",
            anchor: "order-pad",
            position: "left",
            style: "spotlight",
            audioKey: "stewart-transactional-pa3",
            title: "Rule-driven refill.",
            displayText: "Rule-driven refill.",
            quickVoiceText:
              "Ninety days, three refills, Reynolds cosign — pulled from the Rx Request rule, not memory. If the rule had flunked, Kairos routes to the Support Staff Pool with structured handoff context. The system remembers.",
            deepVoiceText:
              "Ninety days. Three refills. Standard diagnosis. Reynolds cosign. Pulled from the Rx Request rule, not from memory. Same documentation language every time. No drift. No exception slipping through because someone was tired or rushed. And if the rule had flunked — patient not seen in the last year, or no future appointment — Kairos would route to the Support Staff Pool with structured handoff context the front desk can act on directly. Not your problem to remember. The system remembers.",
            body: "Rule-driven refill.",
            durationMs: 5800,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "stewart-transactional-auth",
      // Quick and Deep onAuthorize voiceText are identical (210 chars,
      // ~13.1s). Cursor sweeps to Authorize at "Kairos sorts which is
      // which" cue. Single timing block — no deep override needed.
      cursor: {
        target: "#kairos-action-authorize",
        // Quick narration tightened in Pass C — chars 220→190 (~14% cut).
        // Cursor timings scaled by 0.86. Deep narration unchanged in
        // this commit — Quick + Deep voiceText were originally
        // identical here; Deep stays identical until Phase-3 rewrite.
        startTime: 5700,
        arriveTime: 7000,
        clickTime: 10800,
      },
      title: "One-click. Or automatic.",
      displayText: "One-click. Or automatic.",
      quickVoiceText:
        "Some work is one-click. Some automatic. Some routes to the right person without you having to remember to remember. Kairos sorts which is which — so the nurse only sees what needs a nurse.",
      deepVoiceText:
        "Some work is one-click. Some automatic. Some routes to the right person without you having to remember to remember. Kairos sorts which is which — so the nurse only sees what actually needs a nurse.",
      body: "One-click. Or automatic.",
      durationMs: 5500,
    },
    transitionNarrator: {
      audioKey: "stewart-transactional-trans",
      title: "Next — a question with no safe answer yet.",
      displayText: "Next — a careful question.",
      quickVoiceText:
        "A patient asks something Kairos can't safely answer alone. Watch what it does — and what it doesn't.",
      deepVoiceText:
        "A patient asks something Kairos can't safely answer alone. Watch what it does — and what it doesn't.",
      body: "Next — a careful question.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 5 — Nguyen scope-constrained (Pattern 12)
  {
    fixtureId: "quennell-scope",
    progressLabel: "Card 5 of 9 — Ms. Nguyen",
    preArrivalNarrator: {
      title: "Card 5 of 9 — Ms. Nguyen",
      audioKey: "nguyen-scope-pre",
      targetCard: "quennell-scope",
      cursor: {
        target: '[data-encounter-id="quennell-scope"]',
        startTime: 500,
        arriveTime: 2200,
        clickTime: null,
      },
      displayText: "A vague question, then a clarification.",
      quickVoiceText:
        "Ms. Nguyen — elevated H-and-H last week, flagged for hematology referral. Yesterday she asked: could this cause low blood pressure? Vague. Kairos asked what 'this' meant. She clarified: H-and-H. Now Kairos has to answer.",
      deepVoiceText:
        "Ms. Nguyen, sixty-four. Last week her labs showed elevated H-and-H — hemoglobin and hematocrit, mildly elevated, flagged by Pendrelle for hematology referral. Yesterday she replied: could this cause low blood pressure? Vague — could mean any number of things. Kairos asked what 'this' meant. She clarified: she meant the H-and-H. Now Kairos has to answer.",
      body: "A vague question, then a clarification.",
      durationMs: 6000,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "nguyen-scope-arrival",
      // Cursor sweeps to Generate Scope-Respecting Reply at the closing
      // beat of the pure-Epic pain narration. Quick cue "while the
      // patient sits with anxiety" at 12.6s (audio 14.8s); Deep cue
      // "the system gives her no scaffolding" at 45.2s (audio 47.4s).
      cursor: {
        target: "#kairos-action-generate-scope-respecting-reply",
        // Quick narration tightened in Pass C — chars 290→245 (~16% cut).
        // Cursor timings scaled by 0.84.
        startTime: 9300,
        arriveTime: 10600,
        clickTime: 12000,
        deep: {
          // Deep narration tightened in Pass C — chars ~830→~570 (~31% cut).
          // Cursor timings scaled by 0.69.
          startTime: 30200,
          arriveTime: 31200,
          clickTime: 32400,
        },
      },
      title: "Two messages, one thread.",
      displayText: "Two messages, one thread.",
      quickVoiceText:
        "Cardiology nursing scope is heart, meds, imaging. H-and-H and blood pressure regulation is hematology. In pure Epic, the nurse decides alone — answer, guess, or wait two hours for Pendrelle while the patient sits with anxiety.",
      deepVoiceText:
        "Here's the question every cardiology nurse navigates in pure Epic. What's in scope, what isn't. Cardiology nursing scope is the cardiology workup — heart, meds, imaging, lab values pertaining to cardiac function. The relationship between elevated H-and-H and blood pressure regulation is a hematology question. The nurse decides on her own — answer from working memory, guess, ping Pendrelle and wait two hours while the patient sits with anxiety, or ask for clarification. Sometimes the routing fails and the message lands in the wrong pool. Sometimes the answer is partly right and partly outside her license. The pressure to just answer is real, and the system gives her no scaffolding.",
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
            audioKey: "nguyen-scope-pa1",
            title: "Scope rail engaged.",
            displayText: "Scope rail engaged.",
            quickVoiceText:
              "The note documents the clarification round-trip, the scope decision, the routing. Anyone reading the chart later sees the audit trail — Kairos noticed the question was out of cardiology nurse scope.",
            deepVoiceText:
              "The note documents the clarification round-trip, the scope decision, and the routing. Not a productivity note — a safety note. Anyone reading the chart later sees that Kairos noticed the question was out of cardiology nurse scope and routed accordingly. The audit trail is the artifact.",
            body: "Scope rail engaged.",
            durationMs: 6500,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            audioKey: "nguyen-scope-pa2",
            title: "Redirected, not answered.",
            displayText: "Redirected, not answered.",
            quickVoiceText:
              "Brief reply: thanks for clarifying — the best person to answer is the hematology team Pendrelle referred you to. No speculation. Routes to who can. Offers to follow up if the referral hasn't been scheduled.",
            deepVoiceText:
              "The reply is brief. 'Thanks for clarifying. That's a great question, and the best person to answer it is the hematology team Pendrelle referred you to last week.' Doesn't pretend. Doesn't speculate. Doesn't paper over. Routes to who can — and offers to follow up if the referral hasn't been scheduled. The nurse isn't left alone deciding whether to guess.",
            body: "Redirected, not answered.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "nguyen-scope-auth",
      // Cursor sweeps to Authorize at "That isn't a limitation" cue.
      // Quick: 6.8s cue / 10.3s total. Deep: 8.4s cue / 11.9s total.
      cursor: {
        target: "#kairos-action-authorize",
        // Quick narration tightened in Pass C — chars 165→140 (~15% cut).
        // Cursor timings scaled by 0.85.
        startTime: 4500,
        arriveTime: 5800,
        clickTime: 8300,
        deep: {
          // Deep narration tightened in Pass C — chars 175→145 (~17% cut).
          // Cursor timings scaled by 0.83.
          startTime: 5700,
          arriveTime: 7000,
          clickTime: 9450,
        },
      },
      title: "Knows what it doesn't know.",
      displayText: "Knows what it doesn't know.",
      quickVoiceText:
        "Kairos knows when not to think for you. Inside scope, it acts confidently. Outside, it stops. Not a limitation — the safety architecture.",
      deepVoiceText:
        "Kairos knows when not to think for you. The system has scope. Inside it, Kairos acts confidently. Outside it, Kairos stops. Not a limitation — the safety architecture.",
      body: "Knows what it doesn't know.",
      durationMs: 5500,
    },
    transitionNarrator: {
      audioKey: "nguyen-scope-trans",
      title: "Next — when chart and patient disagree.",
      displayText: "Next — chart vs. patient.",
      quickVoiceText:
        "A patient statement that contradicts the chart. Watch what gets drafted — and what doesn't.",
      deepVoiceText:
        "A patient statement that contradicts the chart. Watch what gets drafted — and what doesn't.",
      body: "Next — chart vs. patient.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 6 — Foster contradiction (Pattern 8)
  {
    fixtureId: "maundrell-contradiction",
    progressLabel: "Card 6 of 9 — Mr. Foster",
    preArrivalNarrator: {
      title: "Card 6 of 9 — Mr. Foster",
      audioKey: "foster-contradiction-pre",
      targetCard: "maundrell-contradiction",
      cursor: {
        target: '[data-encounter-id="maundrell-contradiction"]',
        startTime: 500,
        arriveTime: 2200,
        clickTime: null,
      },
      displayText: "INR overdue. Patient says he stopped.",
      quickVoiceText:
        "Mr. Foster, seventy-four. KOO-muh-din Clinic patient — RN-protocol-driven. Normally Kairos drafts the dose, the RN authorizes per protocol. But today he replied: Dr. H told me to stop warfarin and the blood test. Chart shows warfarin active. No provider note discontinuing it. The rare card that exits protocol.",
      deepVoiceText:
        "Mr. Foster, seventy-four. KOO-muh-din Clinic patient. The KOO-muh-din Clinic here is RN-protocol-driven — the RN runs the protocol, makes dose adjustments per established criteria, signs them off without provider involvement. Provider only gets pulled in for the rare clarification case — usually whether a patient should be on KOO-muh-din at all. Five days ago his I-N-R was therapeutic on six milligrams of warfarin — his dose for months. The I-N-R overdue MyChart template went out four days ago because he'd missed his routine check. Today he replied: Dr. H told me to be taking only the other two medications, and also said I don't have to take the blood test anymore. Chart shows warfarin active. No provider note documenting any discontinuation. The rare card — the on-or-off-KOO-muh-din question the protocol can't answer alone.",
      body: "INR overdue. Patient says he stopped.",
      durationMs: 6500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "foster-contradiction-arrival",
      // Cursor sweeps to Forward to Provider at the closing beat. Quick
      // cue "every note becomes the next note's starting point" at 20.4s
      // (audio 23.5s); Deep cue "what makes it visible when something
      // doesn't fit the protocol at all" at 78.0s (audio 82.3s).
      cursor: {
        target: "#kairos-action-forward-to-provider",
        // Quick narration tightened in Pass C — chars 395→310 (~22% cut).
        // Cursor timings scaled by 0.78.
        startTime: 14750,
        arriveTime: 15900,
        clickTime: 17900,
        deep: {
          // Deep narration tightened in Pass C — chars ~1400→~890 (~36% cut).
          // Cursor timings scaled by 0.64.
          startTime: 49000,
          arriveTime: 50000,
          clickTime: 52400,
        },
      },
      title: "Two facts that can't both be right.",
      displayText: "Two facts. Both can't be right.",
      quickVoiceText:
        "On a normal KOO-muh-din card: Kairos drafts the dose, RN authorizes, done. In pure Epic — dose history, supratherapeutic spikes, holds all in different tabs. The nurse reconstructs the trajectory mentally on every call. Kairos brings the paper-flowsheet discipline back. Every note becomes the next note's starting point.",
      deepVoiceText:
        "On a normal KOO-muh-din Clinic card, the picture is simple. Kairos pulls forward the trajectory, drafts the protocol-appropriate dose adjustment, the RN authorizes per protocol — provider isn't in the loop. That's the everyday flow. Look at the I-N-R note itself. In pure Epic, an I-N-R is a single discrete result. Current value shown. Prior values pullable if the nurse manually clicks the trending tab and scrolls. Dose history lives in another tab. The supratherapeutic spikes that prompted the last hold live in a note from three months ago nobody has time to find. Each I-N-R encounter is treated as a one-off, not a continuous record. Warfarin clinics used to run this on paper flowsheets — entire trajectory visible at a glance: dose history, hold history, procedure interruptions. Epic broke that. The nurse reconstructs the trajectory mentally on every call. Kairos brings the paper-flowsheet discipline back. Each note pulls forward — current value, prior values, dose history, hold history, supratherapeutic spikes. Every note becomes the next note's starting point. Exactly what the RN needs to run the protocol confidently — and what makes it visible when something doesn't fit the protocol at all.",
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
            audioKey: "foster-contradiction-pa1",
            title: "Contradiction documented.",
            displayText: "Contradiction documented.",
            quickVoiceText:
              "If the protocol fit: Kairos drafts the dose, RN authorizes, done. Here the protocol can't fit — patient says he's off, chart says active. In pure Epic, either an alert nurse caught it, or she didn't, and the patient bleeds. Kairos holds the draft and routes to Reynolds for the on-or-off clarification — the one place the protocol-driven RN needs the provider.",
            deepVoiceText:
              "On a normal KOO-muh-din card, Kairos drafts the protocol-appropriate dose adjustment and the RN authorizes per protocol. No provider involved. But this card isn't normal. The patient said something today that doesn't match the chart. The protocol can't resolve on-or-off — that's exactly the rare clarification case the workflow reserves for the provider. In pure Epic, this contradiction either gets caught by an alert nurse who read the prior note, or it doesn't, and the dose continues, the I-N-R drifts, the patient bleeds. Instead of drafting an autonomous protocol-driven dose that papers over the contradiction, Kairos holds the draft and routes to provider review with the contradiction flagged. The note records what the patient said, what the chart shows, side-by-side. Forwarded to Reynolds for the on-or-off clarification — the only kind of question that pulls a provider into this clinic.",
            body: "Contradiction documented.",
            durationMs: 7000,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "right",
            style: "spotlight",
            audioKey: "foster-contradiction-pa2",
            title: "MyChart pane held.",
            displayText: "MyChart held — no draft.",
            quickVoiceText:
              "No draft message. The system holds patient-facing replies when source artifact and chart disagree. Synthesis is a safety surface, not just productivity.",
            deepVoiceText:
              "No autonomous reply. The system holds patient-facing replies when source artifact and chart disagree. Synthesis is a safety surface — not just productivity. The patient deserves a real answer. The real answer comes from the provider, not from pattern-matching, and not from a tired nurse trying to remember a note from three months ago.",
            body: "MyChart held — no draft.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "foster-contradiction-auth",
      // Cursor sweeps to Authorize at the artifact-summary cue. Quick
      // cue "The contradiction is the output" at 13.3s (audio 16.1s);
      // Deep cue "the catch is the artifact" at 26.3s (audio 27.9s).
      cursor: {
        target: "#kairos-action-authorize",
        // Quick narration tightened in Pass C — chars 265→225 (~15% cut).
        // Cursor timings scaled by 0.85.
        startTime: 10000,
        arriveTime: 11300,
        clickTime: 13250,
        deep: {
          startTime: 24800,
          arriveTime: 26300,
          clickTime: 27400,
        },
      },
      title: "RN runs the protocol. Provider only on on-or-off.",
      displayText: "RN runs protocol. Provider on on-or-off.",
      quickVoiceText:
        "KOO-muh-din Clinic stays RN-protocol-driven. Kairos drafts the dose, RN authorizes, provider doesn't see it. Provider gets pulled in only for on-or-off — the question this card raised. Kairos noticed. The contradiction is the output, not a reply.",
      deepVoiceText:
        "The pitch holds. KOO-muh-din Clinic stays RN-protocol-driven — Kairos drafts the dose, RN authorizes, provider isn't in the loop. The only question that pulls a provider in is on-or-off — and that's what this card raised. Kairos noticed. The contradiction is the output, not a reply. Today, in pure Epic, this would have gone out as a routine therapeutic-stable note. Here, the catch is the artifact.",
      body: "Same INR. Different plan.",
      durationMs: 5500,
    },
    transitionNarrator: {
      audioKey: "foster-contradiction-trans",
      title: "Next — one card, three stages.",
      displayText: "One card. Three stages.",
      quickVoiceText:
        "Multi-stage. A patient called with chest symptoms. Two hours of clinical work, condensed — the highest-license work on the basket.",
      deepVoiceText:
        "Multi-stage. A patient called with chest symptoms. Two hours of clinical investigation, condensed — the highest-license nursing work on the basket.",
      body: "One card. Three stages.",
      durationMs: 4500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 7 — Reed full lifecycle (Pattern 7b)
  {
    fixtureId: "underwell-full-lifecycle",
    progressLabel: "Card 7 of 9 — Mrs. Reed",
    preArrivalNarrator: {
      title: "Card 7 of 9 — Mrs. Reed",
      audioKey: "reed-full-lifecycle-pre",
      targetCard: "underwell-full-lifecycle",
      cursor: {
        target: '[data-encounter-id="underwell-full-lifecycle"]',
        startTime: 500,
        arriveTime: 2200,
        clickTime: null,
      },
      displayText: "One card. Three stages.",
      quickVoiceText:
        "Mrs. Reed, seventy-two. Hypertension, atrial fibrillation, C-A-D, mitral regurgitation, C-K-D, peripheral edema. Called this morning — blood pressure feels high, fuzzy thinking, swollen feet. One card, three stages. Highest-license work on the basket.",
      deepVoiceText:
        "Mrs. Reed, seventy-two. Hypertension, atrial fibrillation, coronary artery disease, mitral regurgitation, chronic kidney disease, peripheral edema. She called this morning. Said her blood pressure feels high. Fuzzy thinking. Swollen feet. She wants to talk to a nurse. One card, three stages — the highest-license work on the basket.",
      body: "One card. Three stages.",
      durationMs: 6500,
    },
    onArrival: {
      anchor: "action-bar",
      position: "top",
      style: "spotlight",
      audioKey: "reed-full-lifecycle-arrival",
      // TRIAGE choreography — cursor walks Stage 1 → 2 → 3 → 4 across
      // the 5 narration beats. onArrival points to Stage 1
      // ("Generate Patient Assessment"), then each pa[1-3] annotation
      // points to the NEXT stage's button so the cursor is in place
      // before each auto-action fires. By the time pa3 plays, stage=4
      // and the Stage 4 Authorize button is rendered. onAuthorize
      // re-points to the same Stage 4 button for the final click.
      cursor: {
        target: "#kairos-triage-generate-inquiry",
        // Quick narration tightened in Pass C (Card 7 conservative
        // 16% cut — triage is the strongest case study). Scaled by 0.84.
        startTime: 9600,
        arriveTime: 10800,
        clickTime: 11750,
        deep: {
          // Deep narration tightened in Pass C — chars ~1380→~1110 (~20%
          // cut, Card 7 conservative cap). Cursor timings scaled by 0.80.
          startTime: 54300,
          arriveTime: 55400,
          clickTime: 56300,
        },
      },
      title: "Three stages.",
      displayText: "Three stages.",
      quickVoiceText:
        "In pure Epic, you ask questions from memory. The better the nurse, the better the questions. A senior nurse asks twenty. A newer nurse asks fewer, misses things. Same patient, different floor of care depending on who picked up.",
      deepVoiceText:
        "In pure Epic, here's how this call goes. You pick up. You start asking questions from memory and clinical experience — the questions depend on your training, your years on the basket, and your energy at hour seven. A senior nurse with ten years of cardiology asks twenty questions and catches the missed nitroglycerin and the weight fluctuation and the orthostatic component. A newer nurse asks fewer and misses things. Same patient, same call — different floor of care depending on who picked up. After ten or fifteen minutes you've got enough to write an S-B-A-R from your call notes. Different format than the nurse next to you. Different than your own S-B-A-R last week. Routed to the provider. Hours pass. Plan comes back. You call the patient back, synthesize the plan plus any addendum from working memory, and write a callback note. Three separate clinical events, three separate notes, all linked only by your working memory. If a different nurse picks up the callback, that nurse rebuilds context from your note. Two hours of clinical work, fragmented across four documentation events.",
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
            audioKey: "reed-full-lifecycle-pa1",
            // Cursor → Stage 2 button (process-reply). Stage just
            // advanced to 2 when generate-inquiry auto-action fired,
            // so the Stage 2 button is now rendered. Cursor moves
            // there during this narration so it's in place when
            // process-reply auto-action fires on the next beat.
            cursor: {
              target: "#kairos-triage-process-reply",
              // Quick narration tightened in Pass C — chars 265→240
              // (~9% cut). Cursor timings scaled by 0.91.
              startTime: 9700,
              arriveTime: 11100,
              clickTime: 12000,
              deep: {
                startTime: 31200,
                arriveTime: 32700,
                clickTime: 33700,
              },
            },
            title: "Stage 1 — chart-aware questions.",
            displayText: "Stage one — chart-aware questions.",
            quickVoiceText:
              "Stage one. Sixteen questions across five categories, tuned to her chart — symptom characterization, red flags, functional status, med compliance against her real med list. Senior-nurse depth on every call.",
            deepVoiceText:
              "Stage one. Kairos pulls structured chart context automatically — meds, recent labs, last visit, B-P-s, weight history, A-1-c. Sixteen questions generate across five categories. Symptom characterization. Associated symptoms and red flags. Functional status. Medication compliance against her actual med list — not a generic checklist, her med list. Plus chart-context callouts: a medication she stopped taking last month that's relevant to today's symptoms — flagged. Senior-nurse depth on every call, regardless of which nurse picked up.",
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
            audioKey: "reed-full-lifecycle-pa2",
            // Cursor → Stage 3 button (synthesize-callback). Stage
            // advanced to 3 on process-reply auto-action; Stage 3
            // "Synthesize SBAR" button now visible.
            cursor: {
              target: "#kairos-triage-synthesize-callback",
              // Quick narration in Pass C kept verbatim (Stage 2 SBAR
              // beat is the strongest clinical demo on Card 7).
              startTime: 12100,
              arriveTime: 13600,
              clickTime: 14600,
              deep: {
                startTime: 25800,
                arriveTime: 27300,
                clickTime: 28300,
              },
            },
            title: "Stage 2 — SBAR.",
            displayText: "Stage two — SBAR.",
            quickVoiceText:
              "Stage two. S-B-A-R generates from the answers — same structure every time. Three clinical sharps embedded — B-P at goal but patient perceives high; persistent edema means dose reduction failed; new bilateral hand paresthesias flagged as new.",
            deepVoiceText:
              "Stage two. The patient answered the questions. S-B-A-R generates from the answers — same structure every time, the structure providers read fastest. Three clinical sharps embedded: blood pressures at goal but the patient perceives them as high; persistent edema means the dose reduction failed; new bilateral hand paresthesias flagged as new. Routed to the provider. The format doesn't drift between nurses, between shifts, between this call and the last one.",
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
            audioKey: "reed-full-lifecycle-pa3",
            // Cursor → Stage 4 Authorize button. Stage advanced to 4
            // on synthesize-callback auto-action; the
            // "Authorize → forward to provider" button is now visible.
            cursor: {
              target: "#kairos-triage-authorize",
              // Quick narration tightened in Pass C — chars 280→245
              // (~12% cut). Cursor timings scaled by 0.88.
              startTime: 9950,
              arriveTime: 11250,
              clickTime: 12150,
              deep: {
                startTime: 23600,
                arriveTime: 25100,
                clickTime: 26100,
              },
            },
            title: "Stage 3 — cross-note synthesis.",
            displayText: "Stage three — cross-note synthesis.",
            quickVoiceText:
              "Stage three. Pendrelle signed two notes — primary plan plus an addendum about B-N-P and Holter. Kairos absorbs both into one callback. The patient gets one coherent answer instead of two calls that don't quite line up.",
            deepVoiceText:
              "Stage three. Provider plan came back — primary plan plus an addendum about B-N-P and Holter monitor. Two notes signed across the day. Kairos absorbs both into one callback. The nurse calling the patient back has the entire investigation in one place — not fragmented across her working memory and four discrete Epic events. The patient gets one coherent answer instead of two phone calls that don't quite line up.",
            body: "Stage three — cross-note synthesis.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "reed-full-lifecycle-auth",
      // Re-fire cursor onto Stage 4 Authorize. The cursor was placed
      // there on pa3, but a re-target during the auth narration
      // ensures the click ripple aligns with the auto-authorize event.
      cursor: {
        target: "#kairos-triage-authorize",
        // Quick narration tightened in Pass C — chars 225→205 (~9% cut).
        // Cursor timings scaled by 0.91.
        startTime: 9400,
        arriveTime: 10700,
        clickTime: 11650,
        deep: {
          startTime: 16300,
          arriveTime: 17800,
          clickTime: 18800,
        },
      },
      title: "Two hours of clinical work.",
      displayText: "Two hours of clinical work.",
      quickVoiceText:
        "What nurses do at the highest level of their license. Two hours of clinical work, three minutes of cognitive engagement. The investigation persists across stages, so context never lives only in your head.",
      deepVoiceText:
        "What nurses do at the highest level of their license. Kairos amplifies it. Senior-nurse depth becomes available to every nurse on every call. Two hours of clinical work, three minutes of cognitive engagement — and the investigation persists across stages, so context never lives only in your head.",
      body: "Two hours of clinical work.",
      durationMs: 6000,
    },
    transitionNarrator: {
      audioKey: "reed-full-lifecycle-trans",
      title: "Next — a patient with no MyChart.",
      displayText: "Next — no MyChart.",
      quickVoiceText:
        "A patient with no MyChart. Watch what changes about the draft itself.",
      deepVoiceText:
        "Now something different — a patient with no MyChart. Watch what changes about the draft itself.",
      body: "Next — no MyChart.",
      durationMs: 4200,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 8 — Greene phone (Pattern 14)
  {
    fixtureId: "wexbury-phone",
    progressLabel: "Card 8 of 9 — Mrs. Greene",
    preArrivalNarrator: {
      title: "Card 8 of 9 — Mrs. Greene",
      audioKey: "greene-phone-pre",
      targetCard: "wexbury-phone",
      cursor: {
        target: '[data-encounter-id="wexbury-phone"]',
        startTime: 500,
        arriveTime: 2200,
        clickTime: null,
      },
      displayText: "Eighty-three. No MyChart.",
      quickVoiceText:
        "Mrs. Greene, eighty-three. No MyChart. In pure Epic, the nurse mentally shifts from how she'd write a message to how she'd say it. Some do well. Some don't. The patient on the phone gets a worse explanation because of the channel.",
      deepVoiceText:
        "Mrs. Greene, eighty-three. No MyChart active. In pure Epic, she gets called. The nurse mentally shifts from what she'd write in a MyChart message — bullet points, structured lists, clinical terms with lay translations — to what she'd say out loud. Different sentence rhythm. Different vocabulary. Different pacing. Some nurses do this well. Some don't. The patient on the phone gets a worse explanation than the patient with MyChart, just because the channel is different and the nurse doesn't have time to think about register.",
      body: "Eighty-three. No MyChart.",
      durationMs: 6000,
    },
    onArrival: {
      anchor: "patient-header",
      position: "bottom",
      style: "spotlight",
      audioKey: "greene-phone-arrival",
      // Cursor sweeps to Generate Note + Explanation at the closing
      // beat. Quick cue "These aren't the same draft" at 12.8s (audio
      // 14.5s); Deep cue "the quality varies with fatigue" at 35.4s
      // (audio 37.4s).
      cursor: {
        target: "#kairos-action-generate-phone-script",
        // Quick narration tightened in Pass C — chars 265→225 (~15% cut).
        // Cursor timings scaled by 0.85.
        startTime: 9600,
        arriveTime: 10900,
        clickTime: 11900,
        deep: {
          // Deep narration tightened in Pass C — chars ~620→~480 (~23% cut).
          // Cursor timings scaled by 0.77.
          startTime: 26100,
          arriveTime: 27300,
          clickTime: 28400,
        },
      },
      title: "MyChart status: Pending.",
      displayText: "MyChart status: Pending.",
      quickVoiceText:
        "Patient header — MyChart Pending. The routing decision tree shifted the pane from a written reply to an example explanation. Reading and listening are different cognitive instruments. These aren't the same draft.",
      deepVoiceText:
        "Patient header — MyChart Pending. The routing decision tree shifted the bottom-left pane from a written reply to an example explanation. Reading and listening are different cognitive instruments. A MyChart message uses written register — bullet points, structured lists, clinical terms with lay translations. A phone call uses spoken register — sentences that flow, transitions that breathe, pauses where pauses belong. These aren't the same draft. In pure Epic, that shift happens silently in the nurse's head, on every call, and the quality varies with fatigue.",
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
            audioKey: "greene-phone-pa1",
            title: "An example, not a script.",
            displayText: "An example. Not a script.",
            quickVoiceText:
              "Talking points, not a script. Spoken register, not written. Same lay translation, same follow-up timing — shaped for the ear, not the eye. Note the chip — this pane never enters the chart. The words are still yours.",
            deepVoiceText:
              "The pane reads like talking points, not a script. Built from the best clinical communication patterns in the library — spoken register, not written. Note the chip — this pane never enters the patient record. The words are still yours. Same lifestyle counseling, same lay translation, same follow-up timing as the MyChart version — just shaped for the ear, not the eye. Use as many or as few as fit the patient and the call.",
            body: "An example. Not a script.",
            durationMs: 7500,
          },
          {
            // Pass D Phase 8 — Brandon's smoke-test flagged the Nurse
            // Note as never highlighted on Card 8, even though it
            // generates alongside the phone-script pane. This second
            // annotation spotlights the nurse note after the phone
            // script reveals so the viewer sees what enters the chart
            // (clinical register) vs. what stays ephemeral (talking
            // points). audioKey 'greene-phone-pa2' was orphaned in
            // Phase 0 voicemail removal — reused here for the new beat.
            trigger: "after-action",
            anchor: "nurse-note",
            position: "left",
            style: "spotlight",
            audioKey: "greene-phone-pa2",
            title: "What enters the chart.",
            displayText: "What enters the chart.",
            quickVoiceText:
              "And the Nurse Note. Echo result, plain clinical register. Patient contacted by phone — the documentation that lives in the record after the call ends.",
            deepVoiceText:
              "And the Nurse Note. Echo result in plain clinical register — ejection fraction, valve findings, no treatment changes. Patient contacted by phone. This is what enters the chart after the call ends. The phone-script pane stayed ephemeral — words for the call. The note is what the next nurse, or Pendrelle, will see when they open her chart tomorrow.",
            body: "What enters the chart.",
            durationMs: 6500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "greene-phone-auth",
      // Cursor sweeps to Authorize at "Either way, the words are yours"
      // closing cue. Quick: 11.1s cue / 13.1s total. Deep: 14.0s / 16.0s.
      cursor: {
        target: "#kairos-action-authorize",
        // Quick narration tightened in Pass C — chars 225→205 (~9% cut).
        // Cursor timings scaled by 0.91.
        startTime: 8700,
        arriveTime: 10100,
        clickTime: 11500,
        deep: {
          // Deep narration tightened in Pass C — chars 270→230 (~15% cut).
          // Cursor timings scaled by 0.85.
          startTime: 10600,
          arriveTime: 11900,
          clickTime: 13200,
        },
      },
      title: "Channel-aware example.",
      displayText: "Channel-aware example.",
      quickVoiceText:
        "Channel awareness is small until you notice the patients you've called for years would never have responded to a written message. Same clinical content, different shape. Either way, the words are yours.",
      deepVoiceText:
        "Channel awareness is small until you notice the patients you've been calling for years would never have responded to a written message. Kairos meets the patient where they are. Same clinical content, different shape. Either way, the words are yours.",
      body: "Channel-aware example.",
      durationMs: 5500,
    },
    transitionNarrator: {
      audioKey: "greene-phone-trans",
      title: "One more — the closer.",
      displayText: "One more. The closer.",
      quickVoiceText: "One more. The closer — the case Epic literally cannot represent.",
      deepVoiceText: "One more. The closer — the case Epic literally cannot represent.",
      body: "One more. The closer.",
      durationMs: 3000,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // FIXTURE 9 — Jackson denial cascade (Pattern 13)
  {
    fixtureId: "larvendel-denial-cascade",
    progressLabel: "Card 9 of 9 — Ms. Jackson",
    preArrivalNarrator: {
      title: "Card 9 of 9 — Ms. Jackson",
      audioKey: "jackson-denial-cascade-pre",
      targetCard: "larvendel-denial-cascade",
      cursor: {
        target: '[data-encounter-id="larvendel-denial-cascade"]',
        startTime: 500,
        arriveTime: 2200,
        clickTime: null,
      },
      displayText: "Eight days. Two denials.",
      quickVoiceText:
        "Ms. Jackson, fifty-eight. Atypical chest pain workup. Eight days, two denials, four Epic surfaces. In pure Epic, this isn't a card. Scattered across half a dozen places, lived in working memory.",
      deepVoiceText:
        "Ms. Jackson, fifty-eight. Atypical chest pain workup. Eight days ago, Pendrelle ordered a nuclear S-P-E-C-T. This card represents the entire investigation since — and in pure Epic, this investigation isn't a card at all. It's scattered across half a dozen surfaces.",
      body: "Eight days. Two denials.",
      durationMs: 5800,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "jackson-denial-cascade-arrival",
      // Cursor sweeps to Generate Denial-Aware Outreach at the closing
      // beat. Quick cue "Every nurse who touches this case" at 13.4s
      // (audio 18.1s); Deep cue "Every. Single. Time." at 51.8s
      // (audio 53.1s).
      cursor: {
        target: "#kairos-action-generate-denial-aware-outreach",
        // Quick narration tightened in Pass C — chars 285→260 (~9% cut).
        // Cursor timings scaled by 0.91.
        startTime: 10800,
        arriveTime: 12200,
        clickTime: 16000,
        deep: {
          // Deep narration tightened in Pass C — chars ~970→~770 (~21% cut).
          // Cursor timings scaled by 0.79.
          startTime: 39700,
          arriveTime: 40900,
          clickTime: 41600,
        },
      },
      title: "Eight-day timeline.",
      displayText: "Eight-day timeline.",
      quickVoiceText:
        "Nuclear S-P-E-C-T ordered. Denied by Evolent guideline seven-three-one-two. Stress echo offered — can't walk treadmill. Lexiscan, then C-T-A Coronary. Today: denied again. Peer-to-peer, today only. Every nurse who touches this case rebuilds the entire history from scratch.",
      deepVoiceText:
        "Day one — order placed. Day twenty-one — denial number one, Evolent guideline seven-three-one-two. Provider routes an alternate plan, stress echo. Patient can't walk a treadmill. Lexiscan ordered, then cancelled. C-T-A Coronary ordered. Pre-cert number two. Day twenty-nine — today — denial number two. Peer-to-peer option, today only. The patient meanwhile is calling in, asking what's happening with her test. In pure Epic, this conversation lives across three Secure Chat threads, two patient communications in the In Basket, four encounter notes across multiple days, the Media tab where scanned denial letters sit, and the nurse's working memory. Eight days, four Epic surfaces, no single place where the cascade is visible. Every nurse who touches this case rebuilds the entire history from scratch. Every. Single. Time.",
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
            audioKey: "jackson-denial-cascade-pa1",
            title: "Auth-state badge.",
            displayText: "Auth-state badge.",
            quickVoiceText:
              "Peer-to-peer countdown — deadline-bound, a variant Epic doesn't model. The card doesn't disappear when authorized. It accumulates — denial chain, alt-orders, patient symptom updates, all in one place.",
            deepVoiceText:
              "The auth-state badge on the source pane. Peer-to-peer countdown, deadline-bound. Not a status field Epic models — a new variant Kairos surfaces because the underlying primitive is new: the persistent investigation object. The card doesn't disappear when authorized. It accumulates: denial chain, alt-orders, patient symptom updates, peer-to-peer countdown — all in one place with the full timeline visible.",
            body: "Auth-state badge.",
            durationMs: 5500,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "left",
            style: "spotlight",
            audioKey: "jackson-denial-cascade-pa2",
            title: "Denial-acknowledgment frame.",
            displayText: "Denial-acknowledgment frame.",
            quickVoiceText:
              "The outreach drafts in denial-acknowledgment frame, not routine imaging-review frame. Yet another test denied. The patient feels seen. In pure Epic, the nurse adjusts tone manually. Or she doesn't, and the message lands wrong.",
            deepVoiceText:
              "The outreach drafts in denial-acknowledgment frame, not routine imaging-review frame. Yet another test denied. The patient feels seen. This is the prosody primitive — Kairos selects the right linguistic register based on what's happening in the investigation, not what category the card was filed under. In pure Epic, the nurse writing the next message has to remember which patient has been denied twice already and adjust tone manually. Or she doesn't, and the patient gets a routine note that lands wrong.",
            body: "Denial-acknowledgment frame.",
            durationMs: 6000,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "jackson-denial-cascade-auth",
      // Cursor sweeps to Authorize at the closing line
      // "Kairos just stops making you the database." Quick: 12.9s cue
      // / 15.5s total. Deep: 22.7s / 25.3s.
      cursor: {
        target: "#kairos-action-authorize",
        startTime: 11400,
        arriveTime: 12900,
        clickTime: 15000,
        deep: {
          startTime: 21200,
          arriveTime: 22700,
          clickTime: 24800,
        },
      },
      title: "One card.",
      displayText: "One card.",
      quickVoiceText:
        "Eight days. Two denials. Four Epic surfaces. One persistent investigation object that doesn't disappear when you log out. Epic literally cannot do this — it doesn't have the data model. You stay the nurse. Kairos just stops making you the database.",
      deepVoiceText:
        "Eight days. Two denials. Four Epic surfaces. One persistent investigation object that doesn't disappear when you log out. Epic literally cannot do this — it doesn't have the data model. Today this lives in a nurse's working memory across days, and falls apart whenever a different nurse touches the case. Kairos brings that into the chart. You stay the nurse. Kairos just stops making you the database.",
      body: "One card.",
      durationMs: 6500,
    },
    transitionNarrator: null, // last fixture, goes to TourEndModal
  },
];

// ─────────────────────────────────────────────────────────────────────
// Tour duration estimator — Phase-3.4 polish
// ─────────────────────────────────────────────────────────────────────
// Sums character counts for every quickVoiceText / deepVoiceText bubble in
// the script and converts to minutes using an empirical TTS-1 onyx rate.
// Per a 2026-04-30 sample (Anderson pre-arrival ≈ 343 chars at ≈ 22s of
// audio), the rate hovers near 15.5 chars/sec. This is an estimate, not a
// measurement of the on-disk MP3s — but it auto-updates whenever narration
// is edited, so the dashboard pill stays in sync without a build step.
const TTS_CHARS_PER_SEC = 15.5;

function* walkBubbles(fx) {
  if (!fx) return;
  if (fx.preArrivalNarrator) yield fx.preArrivalNarrator;
  if (fx.onArrival) yield fx.onArrival;
  for (const action of fx.actions || []) {
    for (const ann of action.annotations || []) yield ann;
  }
  if (fx.onAuthorize) yield fx.onAuthorize;
  if (fx.transitionNarrator) yield fx.transitionNarrator;
}

function totalCharsForMode(mode) {
  const field = mode === "deep" ? "deepVoiceText" : "quickVoiceText";
  let total = 0;
  for (const fx of TOUR_SCRIPT) {
    for (const b of walkBubbles(fx)) {
      const text = b && b[field];
      if (typeof text === "string") total += text.length;
    }
  }
  return total;
}

export function estimateTourMinutes(mode) {
  const chars = totalCharsForMode(mode);
  const seconds = chars / TTS_CHARS_PER_SEC;
  return Math.max(1, Math.round(seconds / 60));
}

export default TOUR_SCRIPT;
