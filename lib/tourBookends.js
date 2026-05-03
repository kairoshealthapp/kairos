// v3.0 Bookends Pass — opening + closing cinematic stages.
//
// The bookends frame the 7-card tour with a 20-second opener and a
// ~90-second closer. Frames are full-screen black overlays with
// large-type narration; an audio track plays alongside.
//
// Schema:
//   frames: [
//     {
//       headline:    string,           // large center-line (Fraunces serif)
//       subline:     string | null,    // smaller line below
//       wordmark:    "center"|"corner"|null, // KAIROS wordmark placement
//       holdMs:      number,           // total time on screen (incl. fade)
//       audioFile:   string | null,    // optional MP3 played at frame start
//     },
//     ...
//   ]
//
// The opener has ONE audio file attached to frame 0; frames 1 and 2 ride
// the same track via timed advancement. The closer has FOUR audio files,
// one per frame, so any one can be re-recorded without regenerating the
// whole closer.

export const TOUR_OPENER = {
  id: "opener",
  frames: [
    {
      headline: "KAIROS",
      subline: null,
      wordmark: "center",
      holdMs: 5000,
      audioFile: "opener-v1.mp3",
    },
    {
      headline: "Seven encounters. One morning. One nurse.",
      subline: null,
      wordmark: null,
      holdMs: 7000,
      audioFile: null,
    },
    {
      headline: "What follows is the cardiology nurse's inbox in a regional health system, processed by Kairos.",
      subline: null,
      wordmark: "corner",
      holdMs: 8000,
      audioFile: null,
    },
  ],
};

export const TOUR_CLOSER = {
  id: "closer",
  frames: [
    {
      headline: "Seven encounters. Three to four minutes.",
      subline: "Notes drafted. Patient messages drafted. Orders staged. Triage tailored.",
      wordmark: null,
      holdMs: 22000,
      audioFile: "closer-frame-1.mp3",
    },
    {
      headline: "Every output written from the full chart.",
      subline: "Every problem. Every medication. Every lab. Every recent note.",
      wordmark: null,
      holdMs: 25000,
      audioFile: "closer-frame-2.mp3",
    },
    {
      headline: "More signal in. Better care out.",
      subline: "Generic AI tools don't have the chart context. Kairos does.",
      wordmark: null,
      holdMs: 25000,
      audioFile: "closer-frame-3.mp3",
    },
    {
      headline: "What's missing is the institutional decision to start.",
      subline: "The technical work is done. The integrations are scoped.",
      wordmark: "corner",
      holdMs: 18000,
      audioFile: "closer-frame-4.mp3",
    },
  ],
};

// Voice text for the opener and closer narrations. The
// generate-bookend-audio.js script reads these to call OpenAI TTS.
export const BOOKEND_VOICE_TEXT = {
  "opener-v1":
    "A cardiology nurse processes between fifty-five and seventy patient encounters every day. Each one requires reading the chart, applying clinic protocols, drafting documentation, and communicating with the patient. What follows is one nurse's inbox — the same inbox a current workflow handles in five to twelve minutes per encounter. Watch how Kairos changes that.",
  "closer-frame-1":
    "You watched seven encounters. Each one had documentation, patient communication, and orders pre-drafted before the nurse opened the card. The nurse's role was review and approve — not research and write. That's the workflow change.",
  "closer-frame-2":
    "Every output was generated from the full chart. Every problem on the problem list. Every active medication. Every lab going back years. Every recent note from every provider involved in this patient's care. The AI reviewed what would take a human nurse fifteen minutes per encounter to manually read. It did this in under a second.",
  "closer-frame-3":
    "More clinical signal in means better care out. The triage questions Kairos generated were tailored to the specific patient, not a generic protocol. The medications it flagged were the ones that mattered for this person's regimen. The patient education was anchored to what was actually changing in this person's care. Generic AI tools can't do this. They don't have the chart context. Kairos does.",
  "closer-frame-4":
    "What needs Phelps's help is the integrations that connect Kairos's drafts to Epic's patient communication, order entry, and inbox systems. The technical work is done. The institutional decisions are what's missing.",
};
