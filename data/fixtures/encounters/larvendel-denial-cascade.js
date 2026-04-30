// Pattern 13 — INSURANCE DENIAL CASCADE
// Source: docs/KAIROS-SESSION-2026-04-29-EVENING.md CASE 25+26 (Brown/Larvendel)
// 8-day cascade: NM SPECT denied → exercise stress echo offered → patient
// unable to walk → Lexiscan Myoview ordered & cancelled → CTA Coronary
// placed → DENIED today, peer-to-peer offered today only.

const fixture = {
  id: "larvendel-denial-cascade",
  slug: "larvendel-denial-cascade",
  patternId: 13,
  patternName: "INSURANCE DENIAL CASCADE",
  tab: "other",
  urgency: "calm",
  sourceChannel: "secure-chat",
  sourceBox: "secure-chat",
  mychartStatus: "active",
  receivedAt: "2026-04-29T19:32:00Z",
  card: {
    subject: "Secure Chat: CTA Coronary denied — peer-to-peer today only",
    kicker: "SECURE CHAT · OTHER",
    severity: "red",
  },
  patient: {
    name: "Larvendel, Carol N",
    displayName: "Carol N Larvendel",
    age: 41,
    sex: "F",
    dob: "1985-06-18",
    mrn: "94817302",
    proxyName: null,
    primary: "Adler J Beckforth, FNP-BC",
    coverage: "Humana Gold (commercial)",
  },
  // Pattern 13 carries denial cascade metadata for the v1.5 timeline UI.
  authState: {
    current: "PEER_TO_PEER_OFFERED",
    deadline: "2026-04-29T23:59:00-05:00",
    chain: [
      { date: "2026-04-02", event: "NM SPECT ordered by Beckweldon", state: "ORDERED" },
      { date: "2026-04-21 10:24", event: "DENIED #1 — Homestate Health, Evolent guideline 7312 (need stress echo first)", state: "DENIED" },
      { date: "2026-04-21 12:32", event: "Beckweldon alt: stress echocardiogram if patient can exercise", state: "ALT_PROPOSED" },
      { date: "2026-04-21 13:13", event: "Patient unable to walk — chest pain on movement", state: "ALT_BLOCKED" },
      { date: "2026-04-21 13:19", event: "Beckweldon alt: Lexiscan Myoview stress test", state: "ALT_PROPOSED" },
      { date: "2026-04-24 07:53", event: "Lexiscan cancelled per Beckweldon; CTA Coronary ordered instead", state: "ALT_REPLACED" },
      { date: "2026-04-29 14:32", event: "DENIED #2 — CTA Coronary; peer-to-peer offered today only", state: "PEER_TO_PEER_OFFERED" },
    ],
  },
  sourceArtifact: {
    type: "Secure Chat Thread",
    author: "Marielle Tannenbaum (PHS Mobile Cardiology Support Staff)",
    timestamp: "2026-04-29 14:32",
    body:
      "CTA Coronary Arteries denied. Reason: missing a doctor's note explaining why a heart-walking test (Stress Echocardiogram) cannot be done. A peer-to-peer is available today only by calling 800-XXX-XXXX (Member ID# 16337356, Tracking# 098121753502). Resubmission with new documentation also possible. — Leona Inwarden (8789)\n\n[Roland P Beckweldon, NP added to thread 14:33. Brandon: \"Mr Beckweldon, FYI\" + thumbs-up reaction.]",
    threadHistory: [
      { at: "2026-04-21 10:24", from: "Genevieve Brindlewain (PHS)", text: "Homestate Health denied NM SPECT per Evolent Clinical Guideline 7312, requesting documentation of medical necessity for why exercise stress echo cannot be performed instead." },
      { at: "2026-04-21 12:32", from: "Beckweldon", text: "If the patient can exercise, can change to a stress echocardiogram." },
      { at: "2026-04-21 13:13", from: "Brandon Sterne, RN BSN", text: "Patient does not feel she can walk on a treadmill. States every time she moves she hurts and gets chest pain." },
      { at: "2026-04-21 13:19", from: "Beckweldon", text: "Given the patient's inability to walk on a treadmill, would recommend Lexiscan Myoview stress test for further evaluation." },
      { at: "2026-04-24 07:53", from: "Brandon Sterne, RN BSN", text: "Per Beckweldon, Lexiscan Myoview cancelled. Pre-cert appeal also cancelled. Coronary CT angiogram ordered given symptoms of chest pain, SOB, nausea, and diaphoresis with known CAD s/p PCI with stenting." },
      { at: "2026-04-29 14:32", from: "Marielle Tannenbaum (PHS)", text: "CTA Coronary denied. Peer-to-peer today only. Member ID# 16337356, Tracking# 098121753502." },
    ],
  },
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "Authorization state machine + timeline UI deferred to v1.5." },
  },
  actionScripts: {
    "generate-denial-aware-outreach": [
      { type: "state-transition", target: "card", newState: "drafting", delayMsBefore: 100 },
      { type: "banner", kind: "yellow", text: "Auth-state detected: DENIAL_CASCADE active. Switching to denial-acknowledgment frame.", durationMs: 1800 },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 500,
        content:
          "Pattern 13 INSURANCE DENIAL CASCADE — second denial in 8-day investigation. Dr. Beckweldon added to Secure Chat thread for peer-to-peer decision (deadline today only) vs. resubmission vs. moving directly to heart cath given patient's CAD with prior stent + ongoing symptoms.\n\nPatient outreach drafted using denial-acknowledgment frame (NOT default imaging-review frame — auth-state aware). Voicemail attempted concurrently with MyChart send.",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Ms Larvendel,\n\nUnfortunately, your insurance has denied the heart CT scan that Dr. Beckweldon ordered. This is the second test they have denied, and we understand how frustrating this is.\n\nDr. Beckweldon's recommended next step is a heart catheterization (heart cath). This is a procedure where a small tube is guided through a blood vessel to take detailed pictures of the arteries around your heart. Given your history of coronary artery disease with prior stent placement and the symptoms you have been experiencing, this is the best path forward to find answers. We are hopeful insurance will approve this procedure.\n\nBefore we move forward, we need to check in with you:\n\n1. Are you still having chest pain, shortness of breath, nausea, or sweating?\n2. Have your symptoms gotten better, worse, or stayed about the same?\n3. Are you having any new symptoms we should know about?\n\nPlease reply to this message at your earliest convenience so we can update Dr. Beckweldon and determine next steps.\n\nI also tried to reach you by phone today and left a voicemail. Thank you for your patience as we work through this with your insurance.\n\nBrandon Sterne, RN BSN / Heart and Vascular Clinic",
      },
      { type: "banner", kind: "green", text: "Multi-channel correlation: voicemail event ≤30min — auto-acknowledgment line included.", durationMs: 1500, delayMsBefore: 300 },
      { type: "state-transition", target: "card", newState: "drafted", delayMsBefore: 200 },
    ],
  },
  finalSignedState: {
    nurseNote: "[As drafted above]",
    mychartMessage: "[As drafted above]",
    orders: [],
    dxAssociated: ["Coronary atherosclerosis", "Chest pain"],
  },
};

export default fixture;
