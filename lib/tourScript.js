// v3.0 Master Prompt 2 — Tour script for the four-panel card UI.
//
// New tour walks 7 cards — one card per dashboard inbox category —
// pre-filled panels, no Generate gates. Cursor lands on the source
// pane, then on each panel button in turn; narration explains what AI
// drafted, why it helps the nurse and patient, and (where applicable)
// what Epic integration approval is needed to make the action real.
//
// Single tier: one focused tour at the natural pace. Each bubble
// declares only `quickVoiceText`; `estimateTourMinutes("quick")` walks
// the script and produces the visible runtime estimate. Deep mode is
// retained as a no-op alias (same audio files) so the launcher's
// existing event payload still resolves.
//
// Card finishes via panel termination — when the last panel collapses,
// EncounterDetail's card-completion effect calls handleAuthorize which
// dispatches `kairos-encounter:flown-off` and the tour advances. Each
// card therefore sets `skipAutoAuthorize: true` so TourMode does NOT
// dispatch `kairos-encounter:auto-authorize`.
//
// Action schema:
//   {
//     actionId: "panel:<kind>",   // routed by EncounterDetail to
//                                 // handlePanelTerminate({kind, recipient})
//     spotlight: { ...bubble },   // pre-action narration + cursor
//     recipient?: "..."           // for *.forward / referralPacket.approve
//   }
//
// Cursor target conventions:
//   [data-tour-anchor="source-pane" | "nurse-note" | "output-pane" |
//                     "order-pad" | "phone-script" | "referral-packet" |
//                     "patient-assessment" | "sbar"]
//   [data-tour-button="rnNote.done" | "rnNote.forward" | "myChart.reply" |
//                     "myChart.replyCc" | "myChart.forward" |
//                     "orderPad.approve" | "referralPacket.approve" |
//                     "triage.generateSbar"]

const TOUR_SCRIPT = [
  // ─────────────────────────────────────────────────────────────────────
  // CARD 1 — Margaret Whitfield (RESULTS · Coumadin/INR)
  // Panels: RN Note + MyChart
  {
    fixtureId: "whitfield-inr",
    progressLabel: "Card 1 of 7 — Ms. Whitfield",
    skipAutoAuthorize: true,
    preArrivalNarrator: {
      title: "Card 1 of 7 — Ms. Whitfield",
      audioKey: "mp2-whitfield-pre",
      targetCard: "whitfield-inr",
      cursor: {
        target: '[data-encounter-id="whitfield-inr"]',
        startTime: 500,
        arriveTime: 2200,
      },
      displayText: "Coumadin clinic. INR back.",
      quickVoiceText:
        "Margaret Whitfield, seventy-four, warfarin clinic. I-N-R came in this morning. Watch what's already done.",
      body: "Coumadin clinic. INR back.",
      durationMs: 8000,
    },
    onArrival: {
      anchor: "source-pane",
      position: "bottom",
      style: "spotlight",
      cinematicFraming: "top",
      audioKey: "mp2-whitfield-source",
      cursor: {
        target: '[data-tour-anchor="source-pane"]',
        startTime: 500,
        arriveTime: 2200,
      },
      title: "The lab as it landed.",
      displayText: "The lab as it landed.",
      quickVoiceText:
        "This is the lab result as it landed in the inbox. Therapeutic I-N-R of two-point-three. Goal range two to three.",
      body: "The lab as it landed.",
      durationMs: 8000,
    },
    actions: [
      {
        actionId: "panel:rnNote.done",
        spotlight: {
          anchor: "nurse-note",
          position: "left",
          style: "spotlight",
          audioKey: "mp2-whitfield-rnnote",
          cursor: {
            target: '[data-tour-button="rnNote.done"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 17500,
          },
          title: "Note already written.",
          displayText: "Note already written.",
          quickVoiceText:
            "The note is already written. KAIROS reviewed the chart, applied the Phelps warfarin policy, computed the trend across her last eight I-N-Rs, confirmed she's stable on warfarin five milligrams daily, and documented the plan. Continue dose, recheck in four weeks. Done in under two seconds. When the nurse approves, the note signs into Epic — that capability is already authorized.",
          body: "Note already written.",
          durationMs: 19000,
        },
      },
      {
        actionId: "panel:myChart.reply",
        spotlight: {
          anchor: "output-pane",
          position: "left",
          style: "spotlight",
          audioKey: "mp2-whitfield-mychart",
          cursor: {
            target: '[data-tour-button="myChart.reply"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 14500,
          },
          title: "Patient message ready.",
          displayText: "Patient message ready.",
          quickVoiceText:
            "The patient message is ready too. Written in plain language. Explains what her result means, what to do, what to watch for, when her next draw is. Patient education, not chart talk. The message would deliver directly to her patient portal — that part needs Epic integration approval through Phelps.",
          body: "Patient message ready.",
          durationMs: 16000,
        },
      },
    ],
    transitionNarrator: {
      audioKey: "mp2-whitfield-trans",
      title: "Next — a med change.",
      displayText: "Next — a med change.",
      quickVoiceText:
        "Card clears. Next.",
      body: "Card clears. Next.",
      durationMs: 3000,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // CARD 2 — Kevin Halbrook (RESULTS F/U · med change + orders)
  // Fixture: volkenmark-lab-review. Panels: RN Note + MyChart + Order Pad.
  {
    fixtureId: "volkenmark-lab-review",
    progressLabel: "Card 2 of 7 — Ms. Howard",
    skipAutoAuthorize: true,
    preArrivalNarrator: {
      title: "Card 2 of 7 — Ms. Howard",
      audioKey: "mp2-howard-pre",
      targetCard: "volkenmark-lab-review",
      cursor: {
        target: '[data-encounter-id="volkenmark-lab-review"]',
        startTime: 500,
        arriveTime: 2200,
      },
      displayText: "Med change with orders.",
      quickVoiceText:
        "Kevin Halbrook, seventy-two. Provider reviewed her labs and home BP log. Pressures running high. Plan is to increase her Toprol-XL.",
      body: "Med change with orders.",
      durationMs: 9000,
    },
    onArrival: {
      anchor: "source-pane",
      position: "bottom",
      style: "spotlight",
      cinematicFraming: "top",
      audioKey: "mp2-howard-source",
      cursor: {
        target: '[data-tour-anchor="source-pane"]',
        startTime: 500,
        arriveTime: 2200,
      },
      title: "Result note from the provider.",
      displayText: "Result note from the provider.",
      quickVoiceText:
        "Result note from Dr. Pendrelle with the plan.",
      body: "Result note from the provider.",
      durationMs: 5000,
    },
    actions: [
      {
        actionId: "panel:rnNote.done",
        spotlight: {
          anchor: "nurse-note",
          position: "left",
          style: "spotlight",
          audioKey: "mp2-howard-rnnote",
          cursor: {
            target: '[data-tour-button="rnNote.done"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 11500,
          },
          title: "Trend, lab, change documented.",
          displayText: "Trend, lab, change documented.",
          quickVoiceText:
            "The note documents the BP trend, the lab review, and the medication change. Already written from the chart context.",
          body: "Trend, lab, change documented.",
          durationMs: 13000,
        },
      },
      {
        actionId: "panel:myChart.reply",
        spotlight: {
          anchor: "output-pane",
          position: "left",
          style: "spotlight",
          audioKey: "mp2-howard-mychart",
          cursor: {
            target: '[data-tour-button="myChart.reply"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 14000,
          },
          title: "Why the dose is changing.",
          displayText: "Why the dose is changing.",
          quickVoiceText:
            "Patient message explains why the dose is changing — not just \"increasing your medication\" — but what's behind the change, what she should watch for, when to call. Patient education the nurse would otherwise have to write from scratch.",
          body: "Why the dose is changing.",
          durationMs: 15500,
        },
      },
      {
        actionId: "panel:orderPad.approve",
        spotlight: {
          anchor: "order-pad",
          position: "left",
          style: "spotlight",
          audioKey: "mp2-howard-orderpad",
          cursor: {
            target: '[data-tour-button="orderPad.approve"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 13000,
          },
          title: "Three orders staged.",
          displayText: "Three orders staged.",
          quickVoiceText:
            "Three orders staged: discontinue the old Toprol dose, start the new one, repeat the home BP log in two weeks. All pulled from the provider's plan, all ready to send. Order placement is one of the integrations we'd need approved — alongside MyChart messaging.",
          body: "Three orders staged.",
          durationMs: 14500,
        },
      },
    ],
    transitionNarrator: {
      audioKey: "mp2-howard-trans",
      title: "Next — a referral packet.",
      displayText: "Next — a referral packet.",
      quickVoiceText:
        "Card clears.",
      body: "Card clears.",
      durationMs: 2500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // CARD 3 — Kevin Morris (RESULTS F/U · referral packet)
  // Fixture: sellman-cpap-referral.
  // Panels: RN Note + MyChart + Order Pad + Referral Packet.
  {
    fixtureId: "sellman-cpap-referral",
    progressLabel: "Card 3 of 7 — Mr. Morris",
    skipAutoAuthorize: true,
    preArrivalNarrator: {
      title: "Card 3 of 7 — Mr. Morris",
      audioKey: "mp2-morris-pre",
      targetCard: "sellman-cpap-referral",
      cursor: {
        target: '[data-encounter-id="sellman-cpap-referral"]',
        startTime: 500,
        arriveTime: 2200,
      },
      displayText: "Sleep study. CPAP. Referral.",
      quickVoiceText:
        "Kevin Morris, sixty-eight. Sleep study came back — moderate-to-severe sleep apnea. Provider ordered CPAP and a sleep medicine referral.",
      body: "Sleep study. CPAP. Referral.",
      durationMs: 10000,
    },
    onArrival: {
      anchor: "source-pane",
      position: "bottom",
      style: "spotlight",
      cinematicFraming: "top",
      audioKey: "mp2-morris-source",
      cursor: {
        target: '[data-tour-anchor="source-pane"]',
        startTime: 500,
        arriveTime: 2200,
      },
      title: "Result note with the order.",
      displayText: "Result note with the order.",
      quickVoiceText:
        "The result note with the order.",
      body: "Result note with the order.",
      durationMs: 4000,
    },
    actions: [
      {
        actionId: "panel:rnNote.done",
        spotlight: {
          anchor: "nurse-note",
          position: "left",
          style: "spotlight",
          audioKey: "mp2-morris-rnnote",
          cursor: {
            target: '[data-tour-button="rnNote.done"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 7500,
          },
          title: "Findings and referrals.",
          displayText: "Findings and referrals.",
          quickVoiceText:
            "Note documents the findings and the referrals.",
          body: "Findings and referrals.",
          durationMs: 9000,
        },
      },
      {
        actionId: "panel:myChart.reply",
        spotlight: {
          anchor: "output-pane",
          position: "left",
          style: "spotlight",
          audioKey: "mp2-morris-mychart",
          cursor: {
            target: '[data-tour-button="myChart.reply"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 14000,
          },
          title: "What CPAP means, what to expect.",
          displayText: "What CPAP means, what to expect.",
          quickVoiceText:
            "Patient message explains what sleep apnea means, what CPAP is, what to expect from each office, and what timeline. Specific to him, not a generic handout.",
          body: "What CPAP means, what to expect.",
          durationMs: 15500,
        },
      },
      {
        actionId: "panel:orderPad.approve",
        spotlight: {
          anchor: "order-pad",
          position: "left",
          style: "spotlight",
          audioKey: "mp2-morris-orderpad",
          cursor: {
            target: '[data-tour-button="orderPad.approve"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 9500,
          },
          title: "CPAP and sleep medicine.",
          displayText: "CPAP and sleep medicine.",
          quickVoiceText:
            "CPAP order through Apria. Sleep medicine referral. Both staged from the provider's plan.",
          body: "CPAP and sleep medicine.",
          durationMs: 11000,
        },
      },
      {
        actionId: "panel:referralPacket.approve",
        recipient: "Apria",
        spotlight: {
          anchor: "referral-packet",
          position: "top",
          style: "spotlight",
          audioKey: "mp2-morris-packet",
          cursor: {
            target: '[data-tour-button="referralPacket.approve"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 22000,
          },
          title: "Fourteen steps. One click.",
          displayText: "Fourteen steps. One click.",
          quickVoiceText:
            "This is where KAIROS earns its keep on referrals. Cover letter, sleep study report, cardiology context, face sheet, insurance cards front and back, photo ID — all auto-assembled, properly formatted, ready to fax to Apria. What used to be fourteen manual steps is now one approval click. Approve and the packet faxes. The orders post. The patient message goes out. Three actions, one click.",
          body: "Fourteen steps. One click.",
          durationMs: 24000,
        },
      },
    ],
    transitionNarrator: {
      audioKey: "mp2-morris-trans",
      title: "Next — a refill.",
      displayText: "Next — a refill.",
      quickVoiceText:
        "Card clears.",
      body: "Card clears.",
      durationMs: 2500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // CARD 4 — Daniel Stewart (RX REQUEST · refill)
  // Fixture: norreys-transactional. Panels: RN Note.
  {
    fixtureId: "norreys-transactional",
    progressLabel: "Card 4 of 7 — Mr. Stewart",
    skipAutoAuthorize: true,
    preArrivalNarrator: {
      title: "Card 4 of 7 — Mr. Stewart",
      audioKey: "mp2-stewart-pre",
      targetCard: "norreys-transactional",
      cursor: {
        target: '[data-encounter-id="norreys-transactional"]',
        startTime: 500,
        arriveTime: 2200,
      },
      displayText: "Pharmacy refill request.",
      quickVoiceText:
        "Daniel Stewart, sixty-six. Pharmacy refill request through Surescripts.",
      body: "Pharmacy refill request.",
      durationMs: 6500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "bottom",
      style: "spotlight",
      cinematicFraming: "top",
      audioKey: "mp2-stewart-source",
      cursor: {
        target: '[data-tour-anchor="source-pane"]',
        startTime: 500,
        arriveTime: 2200,
      },
      title: "The refill as it appeared.",
      displayText: "The refill as it appeared.",
      quickVoiceText:
        "The refill request as it appeared.",
      body: "The refill as it appeared.",
      durationMs: 4000,
    },
    actions: [
      {
        actionId: "panel:rnNote.done",
        spotlight: {
          anchor: "nurse-note",
          position: "left",
          style: "spotlight",
          audioKey: "mp2-stewart-rnnote",
          cursor: {
            target: '[data-tour-button="rnNote.done"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 18000,
          },
          title: "Refill criteria already verified.",
          displayText: "Refill criteria already verified.",
          quickVoiceText:
            "KAIROS already verified the refill criteria. Mr. Stewart was seen in clinic last month and has a future appointment booked. Both conditions met. Note documents the approval per protocol. Most refills follow this same pattern. They're high-volume, low-judgment work that consumes nursing hours every day. With this workflow approved, that hour comes back to the nurse.",
          body: "Refill criteria already verified.",
          durationMs: 19500,
        },
      },
    ],
    transitionNarrator: {
      audioKey: "mp2-stewart-trans",
      title: "Next — a phone script.",
      displayText: "Next — a phone script.",
      quickVoiceText:
        "Card clears.",
      body: "Card clears.",
      durationMs: 2500,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // CARD 5 — Eleanor Greene (PATIENT CALL · phone)
  // Fixture: wexbury-phone. Panels: RN Note + Call Script.
  {
    fixtureId: "wexbury-phone",
    progressLabel: "Card 5 of 7 — Ms. Greene",
    skipAutoAuthorize: true,
    preArrivalNarrator: {
      title: "Card 5 of 7 — Ms. Greene",
      audioKey: "mp2-greene-pre",
      targetCard: "wexbury-phone",
      cursor: {
        target: '[data-encounter-id="wexbury-phone"]',
        startTime: 500,
        arriveTime: 2200,
      },
      displayText: "Phone call instead of message.",
      quickVoiceText:
        "Eleanor Greene, seventy-one. BP log review, at goal, no changes needed. She's not on MyChart, so this one needs a phone call.",
      body: "Phone call instead of message.",
      durationMs: 9500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "bottom",
      style: "spotlight",
      cinematicFraming: "top",
      audioKey: "mp2-greene-source",
      cursor: {
        target: '[data-tour-anchor="source-pane"]',
        startTime: 500,
        arriveTime: 2200,
      },
      title: "Provider's request.",
      displayText: "Provider's request.",
      quickVoiceText:
        "The provider's request.",
      body: "Provider's request.",
      durationMs: 3500,
    },
    actions: [
      {
        // Pre-action highlight on the read-only Call Script panel
        // (no click — read-only panels don't terminate). Uses a noop
        // panel kind so handlePanelTerminate is a no-op.
        actionId: "panel:noop",
        spotlight: {
          anchor: "phone-script",
          position: "right",
          style: "spotlight",
          audioKey: "mp2-greene-script",
          cursor: {
            target: '[data-tour-anchor="phone-script"]',
            startTime: 1000,
            arriveTime: 2800,
          },
          title: "Read-only — for the call.",
          displayText: "Read-only — for the call.",
          quickVoiceText:
            "This is the panel that doesn't write to Epic. It's reference material for the nurse during the call. KAIROS generated a script tailored to this patient. Anxiety-anchoring opener, plain-language summary of her BP results, return precautions, voicemail fallback. Spoken language, not written. Read-only — the nurse uses it on the call, doesn't chart it.",
          body: "Read-only — for the call.",
          durationMs: 21000,
        },
      },
      {
        actionId: "panel:rnNote.done",
        spotlight: {
          anchor: "nurse-note",
          position: "left",
          style: "spotlight",
          audioKey: "mp2-greene-rnnote",
          cursor: {
            target: '[data-tour-button="rnNote.done"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 8000,
          },
          title: "Call gets made. Note signs.",
          displayText: "Call gets made. Note signs.",
          quickVoiceText:
            "Call gets made, note signs, card clears.",
          body: "Call gets made. Note signs.",
          durationMs: 9500,
        },
      },
    ],
    transitionNarrator: {
      audioKey: "mp2-greene-trans",
      title: "Next — triage.",
      displayText: "Next — triage.",
      quickVoiceText:
        "Next.",
      body: "Next.",
      durationMs: 2000,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // CARD 6 — Barbara Reed (PATIENT ADVICE REQUEST · triage)
  // Fixture: underwell-full-lifecycle. Triage workflow with phone path.
  {
    fixtureId: "underwell-full-lifecycle",
    progressLabel: "Card 6 of 7 — Ms. Reed",
    skipAutoAuthorize: true,
    preArrivalNarrator: {
      title: "Card 6 of 7 — Ms. Reed",
      audioKey: "mp2-reed-pre",
      targetCard: "underwell-full-lifecycle",
      cursor: {
        target: '[data-encounter-id="underwell-full-lifecycle"]',
        startTime: 500,
        arriveTime: 2200,
      },
      displayText: "Triage call from the patient.",
      quickVoiceText:
        "Barbara Reed, eighty-one. Called the clinic — BP still high, fuzzy thinking, swelling getting worse since her amlodipine was reduced last visit.",
      body: "Triage call from the patient.",
      durationMs: 11500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "bottom",
      style: "spotlight",
      cinematicFraming: "top",
      audioKey: "mp2-reed-source",
      cursor: {
        target: '[data-tour-anchor="source-pane"]',
        startTime: 500,
        arriveTime: 2200,
      },
      title: "The call note from front desk.",
      displayText: "The call note from front desk.",
      quickVoiceText:
        "The call note from front desk.",
      body: "The call note from front desk.",
      durationMs: 4000,
    },
    actions: [
      // Beat 0 — force phone mode (Reed's fixture defaults to MyChart).
      // No spotlight; runs invisibly so the next beat finds the
      // phone-mode UI mounted (assessment questions + Generate SBAR).
      {
        actionId: "triage.setPhoneMode",
      },
      // Beat 1 — triage workflow intro (cursor to assessment panel, no
      // click). Position "bottom" so the callout lands BELOW the
      // questions panel, not on top of them (Bug 5).
      {
        actionId: "panel:noop",
        spotlight: {
          anchor: "patient-assessment",
          position: "bottom",
          style: "spotlight",
          audioKey: "mp2-reed-intro",
          cursor: {
            target: '[data-tour-anchor="patient-assessment"]',
            startTime: 800,
            arriveTime: 2500,
          },
          title: "Tailored to this patient.",
          displayText: "Tailored to this patient.",
          quickVoiceText:
            "Triage is where KAIROS goes deeper than any commercial tool. The questions you see here aren't from a generic protocol — they're tailored to this exact patient. KAIROS reviewed her full chart — every condition, every med, every recent lab. The questions are about her specific medications, her specific symptoms, her specific recent change.",
          body: "Tailored to this patient.",
          durationMs: 21000,
        },
      },
      // Beat 2 — captureMockResponses fills the answers. Same bottom
      // placement so callout doesn't overlap the questions being filled.
      {
        actionId: "triage.captureMockResponses",
        spotlight: {
          anchor: "patient-assessment",
          position: "bottom",
          style: "spotlight",
          audioKey: "mp2-reed-capture",
          cursor: {
            target: '[data-tour-anchor="patient-assessment"]',
            startTime: 800,
            arriveTime: 2500,
          },
          title: "Nurse types what the patient said.",
          displayText: "Nurse types what the patient said.",
          quickVoiceText:
            "Two paths. Phone — nurse calls, captures answers in real time. MyChart — questions go to the patient, answers come back, KAIROS auto-generates the SBAR in a child card. On a call, the nurse can type freely or use the structured questions. Every one of them is optional. No protocol forcing twenty questions on a patient who already gave the answer.",
          body: "Nurse types what the patient said.",
          durationMs: 22000,
        },
      },
      // Beat 3 — Generate SBAR click.
      {
        actionId: "triage.generateSbar",
        spotlight: {
          anchor: "sbar",
          position: "right",
          style: "spotlight",
          audioKey: "mp2-reed-sbar",
          cursor: {
            target: '[data-tour-button="triage.generateSbar"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 12000,
          },
          title: "SBAR built in one click.",
          displayText: "SBAR built in one click.",
          quickVoiceText:
            "When the call's done, one click and the SBAR is built. Situation, background, assessment, recommendation — written from what the nurse captured plus the chart context.",
          body: "SBAR built in one click.",
          durationMs: 13500,
        },
      },
      // Beat 4 — forward to provider via the triage path so the card
      // fly-off fires through TriageEncounter's onCardTerminate (which
      // calls handleAuthorize in tour mode). The standard
      // panel:rnNote.forward path doesn't work for triage cards
      // because Reed's fixture declares panels=[rnNote, orderPad,
      // callScript] and the card-completion effect would wait for all
      // three to collapse — which never happens.
      {
        actionId: "triage.forwardSbar",
        spotlight: {
          anchor: "sbar",
          position: "left",
          style: "spotlight",
          audioKey: "mp2-reed-forward",
          cursor: {
            target: '[data-tour-button="rnNote.forward"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 5500,
          },
          title: "Forward to provider.",
          displayText: "Forward to provider.",
          quickVoiceText:
            "Forward to the provider. Done.",
          body: "Forward to provider.",
          durationMs: 7000,
        },
      },
    ],
    transitionNarrator: {
      audioKey: "mp2-reed-trans",
      title: "Next — secure chat.",
      displayText: "Next — secure chat.",
      quickVoiceText:
        "Next.",
      body: "Next.",
      durationMs: 2000,
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // CARD 7 — Sarah Volkenmark DME (SECURE CHAT)
  // Fixture: volkenmark-dme-pa. Panels: RN Note (with secure chat reply).
  {
    fixtureId: "volkenmark-dme-pa",
    progressLabel: "Card 7 of 7 — Volkenmark DME",
    skipAutoAuthorize: true,
    preArrivalNarrator: {
      title: "Card 7 of 7 — Volkenmark DME",
      audioKey: "mp2-volkenmark-pre",
      targetCard: "volkenmark-dme-pa",
      cursor: {
        target: '[data-encounter-id="volkenmark-dme-pa"]',
        startTime: 500,
        arriveTime: 2200,
      },
      displayText: "Secure chat from a colleague.",
      quickVoiceText:
        "Secure chat thread from a colleague — DME prior auth question on a patient's oxygen order.",
      body: "Secure chat from a colleague.",
      durationMs: 9500,
    },
    onArrival: {
      anchor: "source-pane",
      position: "bottom",
      style: "spotlight",
      cinematicFraming: "top",
      audioKey: "mp2-volkenmark-source",
      cursor: {
        target: '[data-tour-anchor="source-pane"]',
        startTime: 500,
        arriveTime: 2200,
      },
      title: "Threaded chat in Epic.",
      displayText: "Threaded chat in Epic.",
      quickVoiceText:
        "The chat thread as it sits in Epic. Real-time threaded messaging.",
      body: "Threaded chat in Epic.",
      durationMs: 7000,
    },
    actions: [
      {
        actionId: "panel:rnNote.done",
        spotlight: {
          anchor: "nurse-note",
          position: "left",
          style: "spotlight",
          audioKey: "mp2-volkenmark-rnnote",
          cursor: {
            target: '[data-tour-button="rnNote.done"]',
            startTime: 1000,
            arriveTime: 2800,
            clickTime: 16000,
          },
          title: "Reply drafted from chart context.",
          displayText: "Reply drafted from chart context.",
          quickVoiceText:
            "KAIROS reads the thread, pulls the relevant chart context, drafts the response. The reply gets posted back to the chat thread. Same Epic integration story — the read works today, the write needs approval. Tour complete.",
          body: "Reply drafted from chart context.",
          durationMs: 17500,
        },
      },
    ],
    // No transition narrator — last card.
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Estimate helpers — TourLauncher reads estimateTourMinutes() to display
// the runtime hint on the launch button.
const TTS_CHARS_PER_SEC = 15.5;

function* walkBubbles(fx) {
  if (!fx) return;
  if (fx.preArrivalNarrator) yield fx.preArrivalNarrator;
  if (fx.onArrival) yield fx.onArrival;
  for (const action of fx.actions || []) {
    // v3.0 Master Prompt 2 — pre-action spotlight is the new home for
    // narration. Iterate it so estimateTourMinutes reflects the actual
    // tour length rather than the legacy after-action annotations.
    if (action.spotlight) yield action.spotlight;
    for (const ann of action.annotations || []) yield ann;
  }
  if (fx.onAuthorize) yield fx.onAuthorize;
  if (fx.transitionNarrator) yield fx.transitionNarrator;
}

function totalCharsForMode(mode) {
  // Single tier — Quick and Deep both walk quickVoiceText. The mode
  // argument is preserved for API compatibility with TourLauncher.
  let total = 0;
  for (const fx of TOUR_SCRIPT) {
    for (const b of walkBubbles(fx)) {
      const text = b && b.quickVoiceText;
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
