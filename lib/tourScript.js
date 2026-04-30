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
  // FIXTURE 1 — Aldington TTE (Pattern 2)
  {
    fixtureId: "aldington-tte",
    progressLabel: "Card 1 of 9 — Mr. Aldington",
    preArrivalNarrator: {
      title: "Card 1 of 9 — Mr. Aldington",
      audioKey: "aldington-tte-pre",
      displayText: "Twenty-seven unread. Only nine are yours.",
      quickVoiceText:
        "This card came from your Results Follow-Up box. Epic shows twenty-seven unread, but only nine are actually yours once you filter by provider. The same nine surface in a custom 'addressed to me' search. Kairos is designed to pull the union, deduplicate, and surface the real number. This card is one of those nine.",
      deepVoiceText:
        "This is Charles Aldington — sixty-one. Dr. Loxley reviewed his CTA chest yesterday. Mild aortic stenosis, mild aortic regurgitation, possibly a bicuspid aortic valve. The plan is a transthoracic echo to reassess. The Result Note dropped into your Results Follow-Up box overnight. And now it's morning, and you're looking at twenty-seven unread items in that one box. Only nine of them are actually yours after you filter by provider. Most apps stop at the basket count. Kairos doesn't.",
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
      quickVoiceText:
        "Dr. Loxley reviewed Mr. Aldington's CTA. Mild aortic stenosis with mild aortic regurgitation. He wants a transthoracic echo to reassess. Watch what happens next.",
      deepVoiceText:
        "Here's how this card actually goes today, in Epic. You read the Result Note. You copy the imaging summary out. You paste it into a chat tool to get a draft. You wait. You read what came back. You copy the nurse note text into Epic, format it, sign it. You copy the MyChart text into the MyChart field, format it, send it. Then you open orders, type T-T-E, pick the right code variant, fill in the reason, the diagnosis, the priority, the cosign route — thirteen fields, every one of them looked up by hand. Six manual context switches before this one card is done. And you have eight more in this box alone. Watch what happens next.",
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
            quickVoiceText:
              "Same opening attribution, same sign-off you've been writing for years. Drafted, not invented.",
            deepVoiceText:
              "Watch the nurse note. Same opening attribution. Same sign-off. Pulled from your prior notes — not invented from nothing. The note isn't a copy-paste from a chat tool. It's drafted in place by the system that already has Mr. Aldington's chart open.",
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
            quickVoiceText:
              "Take a moment with this one. The MyChart message drafts in parallel with the note — same clinical content, patient-friendly translation, parenthetical lay terms. This is the message Mr. Aldington would actually receive.",
            deepVoiceText:
              "And the MyChart message drafts at the same time. Take a moment to actually read this one. Same clinical content as the note, but in patient-friendly register. Brand names with parenthetical translations. Symptom watch-list at the bottom. This is the message Mr. Aldington would actually receive — and notice it isn't generic. It speaks to him.",
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
            quickVoiceText:
              "Future date, code variant, reason, associated diagnoses, cosign route. You read it. You change anything that doesn't fit.",
            deepVoiceText:
              "Here's where the standardization story lives. Thirteen fields on this T-T-E order — every single one of them filled correctly. Future date. Code variant. Reason. Associated diagnoses. Cosign route. Stroke and T-I-A screening question, answered. Saline bubble study, answered. This isn't just faster than Epic — it's better than Epic. Because at hour eight of a shift, after thirty cards, even careful nurses miss fields. Kairos doesn't get tired.",
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
      quickVoiceText:
        "Note signed, MyChart drafted, order pended for cosign — that's the design. In Epic, this same workflow takes roughly fourteen clicks across five screens.",
      deepVoiceText:
        "One click. Note signed. MyChart sent. Order pended for Loxley's cosign. In Epic, this same workflow takes roughly fourteen clicks across five screens. But the bigger story isn't the click count. It's that every T-T-E order Kairos pre-stages has the same thirteen fields filled the same correct way. The floor rises. The senior-nurse depth becomes the floor.",
      body: "One click.",
      durationMs: 5000,
    },
    transitionNarrator: {
      audioKey: "aldington-tte-trans",
      title: "Coming up — a simpler one.",
      displayText: "Coming up — a simpler one.",
      quickVoiceText:
        "That's the most common card you'll see. About seventy percent of your day looks like this. Now a simpler one.",
      deepVoiceText:
        "That's the everyday Result Note. About seventy percent of your day looks like this card. Now a simpler one — the pure synthesis case.",
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
      quickVoiceText:
        "Same box, simpler pattern. Lab results, no medication change, just patient education. This is pure synthesis — provider decided, you document.",
      deepVoiceText:
        "Mrs. Wood, sixty-eight. Lipid panel review. L-D-L at goal, H-D-L slightly below, triglycerides slightly elevated. Dr. Loxley isn't changing meds — he wants the patient educated on lifestyle. This card type is most of your morning. Probably seventy percent of what hits your basket. Pure synthesis — provider decided, you document.",
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
      quickVoiceText:
        "LDL at goal, HDL slightly below, triglycerides slightly elevated. Dr. Loxley isn't changing meds — he wants the patient educated on lifestyle.",
      deepVoiceText:
        "In Epic, here's the version of this card you've written a thousand times. You read the labs. You write the note from memory — your own phrasing, your own sign-off, the lifestyle counseling you usually include if you remember to include it. You write the MyChart from memory too. Each nurse on the floor writes this slightly differently. Each shift, a slightly different version again. The lifestyle counseling sometimes embedded, sometimes not, depending on how busy the day got.",
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
            quickVoiceText:
              "Notice the lifestyle counseling embedded automatically — exercise, diet, alcohol guidance for the HDL and triglyceride pattern. Built to encode the clinical IP that lives in patterns like this.",
            deepVoiceText:
              "Now look at the message. Lifestyle counseling, embedded automatically. Exercise. Diet. Alcohol. The specific guidance for the H-D-L and triglyceride pattern this patient has — built from the best clinical communication patterns in the library. Same depth every time. Same parenthetical lay translation every time. Standardization-of-care isn't a buzzword here. It's the floor of patient education rising for every patient on the basket — regardless of which nurse drew the card, regardless of how busy the day got, regardless of whether it's the first card of the shift or the thirty-first.",
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
      quickVoiceText:
        "No orders. No labs to schedule. Just a clear note and a patient-friendly message. This card type is meant to handle most of a typical morning.",
      deepVoiceText:
        "No orders. No labs to schedule. Just a clear note and a patient-friendly message. The floor rises. Every patient gets the same depth of explanation, regardless of which nurse is on shift.",
      body: "Pure synthesis.",
      durationMs: 4800,
    },
    transitionNarrator: {
      audioKey: "wood-lipid-trans",
      title: "Next — something harder.",
      displayText: "Next — something harder.",
      quickVoiceText:
        "Now something harder. Same box, but a med change and multiple follow-up labs.",
      deepVoiceText:
        "Now something harder. Same box, but a med change and multi-lab follow-up. Real complexity.",
      body: "Next — something harder.",
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
      audioKey: "calderwood-crestor-pre",
      displayText: "More complex. Dose change plus labs.",
      quickVoiceText:
        "This one's more complex. Dr. Loxley wants Crestor twenty increased to forty, and a lipid panel plus hepatic function panel rechecked in ninety days. In Epic, this is fourteen discrete actions. Watch.",
      deepVoiceText:
        "Ms. Calderwood, fifty-nine. Lipid panel and chem-eight reviewed. L-D-L one-forty-two, above goal. Dr. Loxley wants Crestor uptitrated — twenty milligrams to forty — and a lipid panel plus hepatic function panel rechecked together in ninety days. In Epic, this card is roughly fourteen discrete actions. Watch.",
      body: "More complex. Dose change plus labs.",
      durationMs: 6500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "calderwood-crestor-arrival",
      title: "Dose change plus lab cluster.",
      displayText: "Dose change plus lab cluster.",
      quickVoiceText:
        "The provider's plan tells the system everything: discontinue old dose, place new dose, schedule two labs to the same future date, associate both with the same diagnosis.",
      deepVoiceText:
        "Today, this card requires synthesis. You'd manually correlate A-S-T and A-L-T with statin tolerability — checking that liver function is okay before pushing the dose. You'd manually pull the last three lipid panels to see the trend — is the patient responding to the current dose at all, or is forty milligrams just hopeful? You'd decide if the dose change makes sense in clinical context. Real cognitive load. The kind of card a senior nurse handles in two minutes and a newer nurse handles in seven.",
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
            audioKey: "calderwood-crestor-pa1",
            title: "Dose-change diff.",
            displayText: "Dose-change diff.",
            quickVoiceText:
              "Crestor twenty to forty. The discontinue reason auto-fills from the plan keywords. The audit-trail note drafts itself.",
            deepVoiceText:
              "Discontinue Crestor twenty. Place Crestor forty. The audit-trail note auto-populates from the plan keywords — increasing to forty milligrams from twenty per Loxley. The discontinue reason is filled. The cosign route is set. None of this is invented.",
            body: "Dose-change diff.",
            durationMs: 5500,
          },
          {
            trigger: "after-action",
            anchor: "order-pad",
            position: "left",
            style: "spotlight",
            audioKey: "calderwood-crestor-pa2",
            title: "Lab cluster.",
            displayText: "Lab cluster — one row.",
            quickVoiceText:
              "Both labs grouped to the same future date, same diagnosis association, one collapsible row instead of two separate orders.",
            deepVoiceText:
              "Both labs grouped to the same future date — three months out. Same diagnosis association. One collapsible row instead of two separate orders. This is the lab-cluster primitive. Kairos doesn't just place orders — it places them in the relationships that actually exist clinically. A lipid panel and a hepatic function panel, checked together, because that's how you monitor a forty-milligram statin uptitration.",
            body: "Lab cluster — one row.",
            durationMs: 5500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "calderwood-crestor-auth",
      title: "Real complexity, handled.",
      displayText: "Real complexity, handled.",
      quickVoiceText:
        "Roughly fourteen clicks in Epic. One in Kairos, by design.",
      deepVoiceText:
        "Roughly fourteen clicks in Epic. One in Kairos, by design. But the deeper win is consistency. Kairos always pulls the trend. Kairos always checks tolerability. Synthesis at this level used to require a senior nurse on the basket. With Kairos, it's the floor.",
      body: "Real complexity, handled.",
      durationMs: 4200,
    },
    transitionNarrator: {
      audioKey: "calderwood-crestor-trans",
      title: "Next — the boring case.",
      displayText: "Next — the boring case.",
      quickVoiceText:
        "Now a different gear. A refill request the system can resolve from a rule, not a synthesis. Some work is automatic.",
      deepVoiceText:
        "Now a different gear. A refill request the system can resolve from a rule, not a synthesis. The boring automation case — and an important one.",
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
      quickVoiceText:
        "Rx Request box. Mr. Norreys had an INR-driven dose decrease nine days ago — six-point-five to six milligrams of warfarin — and now wants the new dose refilled. The boring case. Watch what 'boring' looks like when the rule does the work.",
      deepVoiceText:
        "Mr. Norreys, sixty-five. Coumadin Clinic patient. Nine days ago, his I-N-R ran three-point-nine — supratherapeutic — and Marchetti dropped his warfarin from six-point-five milligrams to six. Today he replied to the dose-change message asking for a refill. The Rx Request box is full of these. Most cards in that box look exactly like this one.",
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
      quickVoiceText:
        "Last visit nine days ago, future appointment booked, diagnosis still active. Three preconditions — that's a clean Rx Request. No clinical reasoning needed.",
      deepVoiceText:
        "Here's the algorithm every nurse runs in their head when a refill request lands. Has this patient been seen by cardiology in the last month? If yes — does the patient have a future appointment scheduled? If yes again, refill ninety days, three refills, document the rule, sign. If the patient hasn't been seen in the last month, or has no future appointment, refill thirty days only and forward to the Cardiology Support Staff Pool to get the patient on the schedule before the script runs out. Same rule every time. But it lives in your head — which means at hour eight, with twenty refills behind you and ten ahead, the rule sometimes drifts.",
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
            quickVoiceText:
              "One short note. Records the dose change, the rule that fired, the next INR date. Nothing the nurse would have to think about — but it still has to be in the chart.",
            deepVoiceText:
              "One short note. Records the dose change, the rule that fired, the next I-N-R date. Nothing the nurse would have to think about — but it still has to be in the chart. Because the next nurse who picks up this patient needs to see why ninety days got picked instead of thirty.",
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
            quickVoiceText:
              "Confirms what the patient asked. No medical interpretation, no extra detail. The transactional reply Kairos is designed to draft when nothing else is in question.",
            deepVoiceText:
              "One-line confirmation back to the patient. No interpretation, no extra detail, no over-promising. Just — got it, your warfarin six-milligram refill has been sent. This is the transactional reply Kairos drafts when nothing else is in question.",
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
            quickVoiceText:
              "Ninety days, three refills, standard diagnosis, Marchetti cosign. Pre-staged from the Coumadin Clinic Rx Request rule. Read it, change anything that doesn't fit.",
            deepVoiceText:
              "Ninety days. Three refills. Standard diagnosis. Marchetti cosign. All of it pulled from the Rx Request rule, not from memory. Same documentation language every time. No drift. No exception slipping through because someone was tired or rushed. And if the rule had flunked — if the patient hadn't been seen in the last month — Kairos would route this to the Support Staff Pool with a note saying needs appointment scheduled before next refill. Not your problem to remember. The system remembers.",
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
      quickVoiceText:
        "Some work is one-click. Some work is automatic. Kairos is designed to sort which is which — so the nurse only sees what actually needs a nurse.",
      deepVoiceText:
        "Some work is one-click. Some work is automatic. Some work routes to the right person without you having to remember. Kairos sorts which is which — so the nurse only sees what actually needs a nurse.",
      body: "One-click. Or automatic.",
      durationMs: 5500,
    },
    transitionNarrator: {
      audioKey: "norreys-transactional-trans",
      title: "Next — a question with no safe answer yet.",
      displayText: "Next — a careful question.",
      quickVoiceText:
        "Now a patient asks something Kairos can't safely answer alone. Watch what it does instead.",
      deepVoiceText:
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
      quickVoiceText:
        "Ms. Quennell had elevated H&H last week. Yesterday she asked: 'could this cause low blood pressure?' Vague reference. Kairos asked her what 'this' meant. She clarified. Now Kairos has to answer — carefully.",
      deepVoiceText:
        "Ms. Quennell, sixty-four. Last week, her labs showed elevated H-and-H — hemoglobin and hematocrit, mildly elevated, a finding Dr. Loxley flagged for hematology referral. Yesterday she replied to the lab message asking — quote — could this cause low blood pressure? Vague reference. Could be any number of things. Kairos asked her what this meant. She clarified — she meant the H-and-H. Now Kairos has to answer.",
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
      quickVoiceText:
        "Original vague reference plus the clarification. Cardiology nursing scope is the cardiology workup. Hematology effects on blood pressure belong to hematology.",
      deepVoiceText:
        "Here's the question every cardiology nurse has to navigate. What's in scope, and what isn't. Cardiology nursing scope is the cardiology workup — the heart, the meds, the imaging, the lab values that pertain to cardiac function. The relationship between elevated H-and-H and blood pressure regulation is a hematology question. It's not that the answer is unknowable. It's that a cardiology nurse isn't the right person to answer it definitively.",
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
            quickVoiceText:
              "The note documents the clarification round-trip and the scope decision. Kairos is designed to recognize when a question is out of cardiology nurse scope before drafting an answer.",
            deepVoiceText:
              "The note documents the clarification round-trip, the scope decision, and the routing. This isn't a productivity note — it's a safety note. Anyone reading the chart later sees that Kairos noticed the question was out of scope and routed accordingly. The audit trail is the artifact.",
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
            quickVoiceText:
              "Brief reply, redirected to hematology where the referral already lives. No interpretation of H&H and blood pressure. Answers what's safe to answer; routes the rest to who can.",
            deepVoiceText:
              "The reply itself is brief. Thanks for clarifying. That's a great question, and the best person to answer it is the hematology team Dr. Loxley referred you to last week. Doesn't pretend. Doesn't speculate. Doesn't paper over. Routes to who can — and offers to follow up if the referral hasn't been scheduled.",
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
      quickVoiceText:
        "Kairos doesn't pretend to know what it can't know. The system is designed to recognize scope and route accordingly.",
      deepVoiceText:
        "Kairos doesn't pretend to know what it can't know. The system has scope — and inside the scope, it acts confidently. Outside the scope, it stops. That isn't a limitation. That's the safety architecture.",
      body: "Knows what it doesn't know.",
      durationMs: 5500,
    },
    transitionNarrator: {
      audioKey: "quennell-scope-trans",
      title: "Next — when chart and patient disagree.",
      displayText: "Next — chart vs. patient.",
      quickVoiceText:
        "Now a patient statement that contradicts the chart. Watch what gets drafted — and what doesn't.",
      deepVoiceText:
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
      quickVoiceText:
        "INR overdue MyChart template went out on the twenty-fourth. Mr. Maundrell replied today: 'Dr. M told me to stop warfarin.' Chart still shows it active, last therapeutic INR five days ago, no provider note documenting any discontinuation. Watch.",
      deepVoiceText:
        "Mr. Maundrell, seventy-four. Coumadin Clinic patient. Five days ago his I-N-R was therapeutic on six milligrams of warfarin — the dose he's been on for months. The I-N-R overdue MyChart template went out four days ago because he'd missed his routine check. Today he replied. Quote — Dr. M told me to be taking only the other two medications and also said I don't have to take the blood test anymore. Chart still shows warfarin active. No provider note documenting any discontinuation. Two facts that can't both be right.",
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
      quickVoiceText:
        "Patient says the medication is stopped. Chart says it isn't. They can't both be right — and Kairos isn't the one who gets to decide which.",
      deepVoiceText:
        "Before we look at what Kairos does with the contradiction, look at what's actually in the nurse note. I-N-R isn't a single result. It's a continuous record. Each result lives in context with every prior result, every dose change, every supratherapeutic spike, every interruption for procedures. When you read an I-N-R note in Kairos, you're reading the running record — the entire trajectory of this patient's anticoagulation since they started warfarin. The current draft pulls from the prior note, accumulates the new data, builds forward. Each note becomes the next note's starting point. This is how warfarin clinics have always worked on paper, with the running flowsheet on the front of the chart. Kairos brings that paper discipline into the chart automatically.",
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
            quickVoiceText:
              "The note records what the patient said and what the chart shows, side by side. Forwarded to Marchetti for verification. No autonomous reply — the patient deserves a real answer, and that has to come from a provider.",
            deepVoiceText:
              "Today's plan from the provider would be — keep the dose. But Kairos has the patient history. And the patient said something today that doesn't match the chart. These don't reconcile. Instead of drafting an autonomous note that papers over the contradiction, Kairos holds the draft and routes to provider review with the contradiction flagged. The note records what the patient said, what the chart shows, the side-by-side. Forwarded to Marchetti for verification.",
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
            quickVoiceText:
              "No draft message. The system is designed to hold patient-facing replies when the source artifact and the chart disagree. Synthesis is also a safety surface.",
            deepVoiceText:
              "No autonomous reply. The system is designed to hold patient-facing replies when the source artifact and the chart disagree. Synthesis is also a safety surface — not just a productivity surface. The patient deserves a real answer to this question. And the real answer has to come from the provider, not from Kairos pattern-matching.",
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
      quickVoiceText:
        "Same INR result. Different plan. Kairos noticed. The contradiction is the output — not the reply.",
      deepVoiceText:
        "Same I-N-R result. Different plan. Kairos noticed. The contradiction is the output — not the reply.",
      body: "Same INR. Different plan.",
      durationMs: 5500,
    },
    transitionNarrator: {
      audioKey: "maundrell-contradiction-trans",
      title: "Next — multi-stage.",
      displayText: "Next — multi-stage.",
      quickVoiceText:
        "Now multi-stage. A patient called with chest symptoms. This is a two-hour clinical investigation, condensed.",
      deepVoiceText:
        "Now multi-stage. A patient called with chest symptoms. This is a two-hour clinical investigation, condensed — and the highest-license nursing work on the basket.",
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
      quickVoiceText:
        "Mrs. Underwell called the clinic — blood pressure feels high, fuzzy thinking, swollen feet. She wants to talk to a nurse. This is one card with three stages. Watch all three fire in sequence.",
      deepVoiceText:
        "Mrs. Underwell, seventy-two. Active hypertension, atrial fibrillation, coronary artery disease, mitral regurgitation, chronic kidney disease, peripheral edema. She called the clinic this morning. Said her blood pressure feels high. Fuzzy thinking. Swollen feet. She wants to talk to a nurse. This is one card with three stages — and this is the highest-license nursing work on the basket.",
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
      quickVoiceText:
        "Generate Inquiry, Process Reply, Synthesize Callback. Each one is a different point in a multi-hour investigation.",
      deepVoiceText:
        "In Epic today, here's how this call goes. You pick up. You start asking questions from memory and experience — the better the nurse, the better the questions. After ten or fifteen minutes you've got enough to write an S-B-A-R and route to the provider. Then later, after the provider's plan comes back, you call the patient back and synthesize the answer. Three separate clinical events, three separate notes, all linked by your working memory. If the nurse who routed isn't the same nurse on the callback, the second nurse rebuilds context from the first nurse's note. This works — but it's brittle, and the depth depends entirely on which nurse picked up the phone.",
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
            quickVoiceText:
              "Sixteen questions across five categories, tuned to her actual chart — hypertension, atrial fibrillation, coronary artery disease, mitral regurgitation, chronic kidney disease, peripheral edema.",
            deepVoiceText:
              "Stage one. The dot-triage equivalent runs against her actual chart. Out comes sixteen questions across five categories. Symptom characterization. Associated symptoms and red flags. Functional status. Medication compliance with her actual med list — not a generic check, her med list. Plus chart-context callouts. A medication she stopped taking last month that's relevant to today's symptoms — flagged. The senior-nurse depth becomes the floor depth.",
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
            quickVoiceText:
              "Three clinical sharps embedded — blood pressures at goal but patient perceives them as high; persistent edema means the dose reduction failed; new bilateral hand paresthesias flagged as new.",
            deepVoiceText:
              "Stage two. The patient answered the questions. S-B-A-R generates from the answers. Three clinical sharps embedded — blood pressures at goal but the patient perceives them as high; persistent edema means the dose reduction failed; new bilateral hand paresthesias flagged as new. The S-B-A-R is structured the way the provider reads S-B-A-R-s. Routed.",
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
            quickVoiceText:
              "Dr. Loxley signed two notes — primary plan plus an addendum about BNP and Holter monitor. Kairos absorbed both into one unified callback.",
            deepVoiceText:
              "Stage three. Provider plan came back — primary plan plus an addendum about B-N-P and Holter monitor. Two notes signed across the day. Kairos absorbs both into one unified callback. The nurse calling the patient back has the entire investigation in one place. The patient gets a coherent answer instead of two phone calls that don't quite line up.",
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
      quickVoiceText:
        "One card. Three minutes of nurse cognitive engagement, distributed across the day. The investigation is designed to persist across stages — Kairos would remember where you left off.",
      deepVoiceText:
        "This is what nurses do at the highest level of their license. Kairos amplifies it. The senior-nurse depth becomes available to every nurse on every call. Two hours of clinical work, three minutes of cognitive engagement — and the investigation persists across stages, so you never lose your place.",
      body: "Two hours of clinical work.",
      durationMs: 6000,
    },
    transitionNarrator: {
      audioKey: "underwell-full-lifecycle-trans",
      title: "Next — a patient with no MyChart.",
      displayText: "Next — no MyChart.",
      quickVoiceText:
        "Now something different — a patient with no MyChart. Watch what changes.",
      deepVoiceText:
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
      quickVoiceText:
        "Mrs. Wexbury is eighty-three. She doesn't have MyChart active. Most apps would draft her a MyChart message anyway and leave you to figure it out. Kairos drafts an example of how you might explain the result on the phone instead — words you can use, edit, or skip.",
      deepVoiceText:
        "Mrs. Wexbury, eighty-three. She doesn't have MyChart active. Most apps would draft her a MyChart message anyway and leave you to figure it out. Kairos drafts an example of how you might explain the result on the phone instead — words you can use, edit, or skip.",
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
      quickVoiceText:
        "See the patient header. MyChart Pending — the routing decision tree noticed automatically, and shifted the bottom-left pane to an example explanation rather than a written reply.",
      deepVoiceText:
        "Watch the patient header. MyChart Pending — the routing decision tree noticed automatically and shifted the bottom-left pane from a written reply to an example explanation. Reading and listening are different cognitive instruments. A MyChart message uses written register — bullet points, structured lists, clinical terms with parenthetical translations. A phone call uses spoken register — sentences that flow, transitions that breathe, pauses where pauses belong. These aren't the same draft.",
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
            quickVoiceText:
              "This is an example of how you might explain it. Not a script to read — talking points to use as much or as little as you want. Built from the best clinical communication patterns we've seen. Note the chip: this pane never goes into the patient record.",
            deepVoiceText:
              "The pane reads like talking points, not like a script. Built from the best clinical communication patterns in the library. Note the chip in the corner — this pane never enters the patient record. The words are still yours. You can use as many or as few as fit the patient and the call.",
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
            quickVoiceText:
              "Same example framing, condensed for unreachable patients. Use what fits, edit what doesn't, skip what's not relevant. Still ephemeral — not part of the chart.",
            deepVoiceText:
              "Voicemail talking points — same example framing, condensed for unreachable patients. Use what fits, edit what doesn't, skip what's not relevant. Still ephemeral. Still not part of the chart. The architecture is consistent — you stay the nurse making the call.",
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
      quickVoiceText:
        "Same clinical content, different example. Because phone calls and MyChart messages are different cognitive instruments — and either way, the words are yours.",
      deepVoiceText:
        "Channel-awareness is small until you notice the patients you've been calling for years would never have responded to a written message anyway. Kairos meets the patient where they are. Same clinical content, different example. Either way, the words are yours.",
      body: "Channel-aware example.",
      durationMs: 5500,
    },
    transitionNarrator: {
      audioKey: "wexbury-phone-trans",
      title: "One more — the closer.",
      displayText: "One more. The closer.",
      quickVoiceText: "One more. The closer.",
      deepVoiceText: "One more. The closer.",
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
      audioKey: "vanstone-denial-cascade-pre",
      displayText: "Eight days. Two denials.",
      quickVoiceText:
        "Eight days. Two denials. Four Epic surfaces. Today this lives in working memory because Epic can't surface it as one thing — Kairos is designed to. Watch.",
      deepVoiceText:
        "Ms. Vanstone, fifty-eight. Atypical chest pain workup. Eight days ago, Dr. Loxley ordered a nuclear S-P-E-C-T. The card you're looking at represents the entire investigation since.",
      body: "Eight days. Two denials.",
      durationMs: 5800,
    },
    onArrival: {
      anchor: "source-pane",
      position: "right",
      style: "spotlight",
      audioKey: "vanstone-denial-cascade-arrival",
      title: "Eight-day timeline.",
      displayText: "Eight-day timeline.",
      quickVoiceText:
        "Nuclear stress test ordered the second. Denied the twenty-first by Evolent guideline seven-three-one-two. Stress echo offered, patient can't walk treadmill. Lexiscan ordered, then cancelled. CTA Coronary ordered. Today, the twenty-ninth — denied again. Peer-to-peer available, today only.",
      deepVoiceText:
        "Day one — order placed. Day twenty-one — denial number one, Evolent guideline seven-three-one-two. Provider routes an alternate plan, stress echo. Patient can't walk a treadmill. Lexiscan ordered, then cancelled. C-T-A Coronary ordered. Pre-cert number two. Day twenty-nine — today — denial number two. Peer-to-peer option offered, today only. Patient meanwhile is calling in, asking what's happening with her test. The conversation has lived across three Secure Chat threads, two patient communications, four encounter notes, and the Media tab. Every nurse who touches this case has to reconstruct the entire history from scratch. Every. Single. Time.",
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
            audioKey: "vanstone-denial-cascade-pa1",
            title: "Auth-state badge.",
            displayText: "Auth-state badge.",
            quickVoiceText:
              "Peer-to-peer countdown — deadline-bound urgency, a new variant Epic doesn't model.",
            deepVoiceText:
              "Look at the auth-state badge on the source pane. Peer-to-peer countdown, deadline-bound. This isn't a status field Epic models. This is a new variant Kairos surfaces because the underlying primitive is — the persistent investigation object. The card doesn't disappear when authorized. It accumulates.",
            body: "Auth-state badge.",
            durationMs: 5500,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "left",
            style: "spotlight",
            audioKey: "vanstone-denial-cascade-pa2",
            title: "Denial-acknowledgment frame.",
            displayText: "Denial-acknowledgment frame.",
            quickVoiceText:
              "The outreach drafts in denial-acknowledgment frame, not routine imaging-review frame. 'Yet another test denied' — the patient feels seen.",
            deepVoiceText:
              "The outreach drafts in denial-acknowledgment frame, not routine imaging-review frame. Yet another test denied. The patient feels seen. This is the prosody primitive — Kairos selects the right linguistic register based on what's happening in the investigation, not based on what category the card was filed under.",
            body: "Denial-acknowledgment frame.",
            durationMs: 6000,
          },
          {
            trigger: "after-action",
            anchor: "output-pane",
            position: "left",
            style: "spotlight",
            audioKey: "vanstone-denial-cascade-pa3",
            title: "Multi-channel correlation.",
            displayText: "Multi-channel correlation.",
            quickVoiceText:
              "Voicemail left and MyChart sent simultaneously. The acknowledgment line auto-correlates.",
            deepVoiceText:
              "Voicemail and MyChart drafted simultaneously. The acknowledgment line auto-correlates across both channels. The patient hears the same message on the phone she'll read in MyChart. The clinical record reflects both touchpoints, linked.",
            body: "Multi-channel correlation.",
            durationMs: 5500,
          },
        ],
      },
    ],
    onAuthorize: {
      anchor: "global",
      style: "narrator-corner",
      audioKey: "vanstone-denial-cascade-auth",
      title: "One card.",
      displayText: "One card.",
      quickVoiceText:
        "Eight days. Two denials. Four Epic surfaces. One persistent investigation object that doesn't disappear when you log out.",
      deepVoiceText:
        "Eight days. Two denials. Four Epic surfaces. One persistent investigation object that doesn't disappear when you log out. Epic literally cannot do this — it doesn't have the data model. This is the kind of card that lives in a nurse's working memory across days. Kairos brings that into the chart. You stay the nurse. Kairos just stops making you the database.",
      body: "One card.",
      durationMs: 6500,
    },
    transitionNarrator: null, // last fixture, goes to TourEndModal
  },
];

export default TOUR_SCRIPT;
