// Phase-3.6 — Ward VA RFS already-resolved. Pattern: ALREADY-RESOLVED.
// Demonstrates Media tab OCR — Kairos surfaces previously-handled work
// already documented in scanned PDFs. Second moat fixture for May 5 demo.

const fixture = {
  id: "pelc-va-rfs",
  slug: "pelc-va-rfs",
  patternId: 14,
  patternName: "ALREADY-RESOLVED (MEDIA TAB)",
  pattern: "already-resolved",
  tab: "patientcall",
  urgency: "calm",
  sourceChannel: "secure-chat",
  sourceBox: "patient-call",
  mychartStatus: "Active",
  receivedAt: "2026-04-30T10:27:00Z",
  card: {
    subject: "VA RFS already submitted — already-resolved",
    kicker: "PATIENT CALL",
    severity: "green",
  },
  patient: {
    name: "Bishop, Charles",
    displayName: "Charles Bishop",
    age: 73,
    sex: "M",
    dob: "1953-03-08",
    mrn: "M000412580",
    proxyName: null,
    primary: "Stellan R Peterson, NP",
    coverage: "VA Healthcare + Medicare",
  },
  sourceArtifact: {
    type: "Patient Call routed via Secure Chat",
    author: "Jennifer Ward (front desk)",
    timestamp: "2026-04-30 10:27",
    body: "Patient was referred to Columbia heart & Vascular. Patient called in and asked us to send the referral to VA so they will pay for the Columbia Heart & Vascular clinic. Please advise.",
  },
  // Kairos's auto-search finding — populated when card opens.
  kairosFinding: {
    headline: "Already submitted to VA Community Care",
    summary: "VA Form 10-10172 (Community Care Provider Medical Request for Service) submitted 4/14/2026 to Columbia VAMC. Confirmation scanned to Media tab same day (4/14/2026 14:47).",
    authTracking: "VA-AUTH-2026-04-14-1432",
    status: "Pending VA review (no response in chart yet)",
    sources: [
      { name: "Scanned RFS form (4/14/2026)", source: "Media tab → Outside Records" },
      { name: "VA submission confirmation page (4/14/2026)", source: "Media tab → Outside Records" },
      { name: "Original Columbia referral (Peterson, 4/10/2026)", source: "Notes → Office Visit" },
      { name: "Patient VA enrollment verification (1/15/2026)", source: "Media tab → Insurance" },
    ],
  },
  suggestedReply: {
    channel: "Secure Chat reply to Jennifer Ward",
    body: "RFS already submitted to VA Community Care 4/14. Awaiting VA authorization. Will update this thread once VA responds. — Brandon",
  },
  routing: {
    recipient: "Jennifer Ward (original sender)",
    pool: "Lakeside Cardiology Support Pool",
    comment: "Already-resolved finding — RFS submitted 4/14, awaiting VA authorization. Replying to original Secure Chat thread.",
    priority: "Normal",
  },
  // v3.0 — conditional panel declaration. Auto-inferred from
  // actionScripts / finalSignedState; override here if needed.
  panels: ["rnNote"],
  initialPaneContent: { nurseNote: "", mychartMessage: "", phoneScript: "", orderPad: { orders: [], hasUnansweredQuestions: false } },
  actionScripts: {},
  finalSignedState: { nurseNote: "", phoneScript: "", orders: [], dxAssociated: [] },
};

export default fixture;
