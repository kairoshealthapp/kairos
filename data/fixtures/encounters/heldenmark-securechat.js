// Pattern 10 — COORDINATION (Secure Chat origin — skeleton)
// Source: docs/KAIROS-SESSION-2026-04-29-AFTERNOON.md CASE 20 (Bailey/Brooks)

const fixture = {
  id: "heldenmark-securechat",
  slug: "heldenmark-securechat",
  patternId: 10,
  patternName: "COORDINATION (Secure Chat origin)",
  tab: "securechat",
  urgency: "calm",
  sourceChannel: "secure-chat",
  sourceBox: "secure-chat",
  mychartStatus: "active",
  receivedAt: "2026-04-29T13:24:00Z",
  card: {
    subject: "Secure Chat (11-participant): order-expiration check on stale referral",
    kicker: "SECURE CHAT · COORDINATION",
    severity: "amber",
  },
  patient: {
    name: "Brooks, Steven",
    displayName: "Steven Brooks",
    age: 69,
    sex: "M",
    dob: "1957-04-01",
    mrn: "73018241",
    proxyName: null,
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Aetna Medicare Advantage",
  },
  sourceArtifact: {
    type: "Secure Chat (11-participant thread)",
    author: "Linda Birchington (PHS scheduling, 9:20 AM)",
    timestamp: "2026-04-29 08:24",
    body:
      "Patient referral order placed 1/2026 still status=PEND with 2 missed appointments. Verify clinical relevance — should we cancel and re-place, or chase the patient?",
  },
  // v3.0 — conditional panel declaration. Auto-inferred from
  // actionScripts / finalSignedState; override here if needed.
  panels: ["rnNote", "myChart"],
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  actionScripts: {},
  finalSignedState: {
    nurseNote:
      "Stale referral identified. Pendrelle confirms still clinically relevant. Patient outreach scheduled. Thread-state synchronization will close the originating Secure Chat thread automatically once patient acknowledges.",
    mychartMessage:
      "Hi,\n\nI wanted to check in on the specialist referral your provider placed back in January. Looking at the chart, the referral is still showing as pending and I see two missed appointments on file — I want to make sure we get this back on track.\n\nA few quick questions, please reply when you have a moment:\n  1. Has anything changed since January? Are the symptoms that prompted the referral better, worse, or about the same?\n  2. Is the referral still something you want to pursue, or have things settled enough that you'd rather hold off?\n  3. If you do want to keep the referral active, would a different appointment time or location work better?\n\nWhat to do:\n- Reply to this message with your answers — there's no wrong answer, and \"hold off for now\" is a perfectly fine choice\n- Continue all your current medications as prescribed\n\nWhat happens next: Based on your reply, we'll either cancel the existing referral and start fresh later, or chase the specialist's office to get you scheduled at a time that works.\n\nWhat to watch for: If your symptoms worsen — new pain, severe shortness of breath, fainting, or anything that feels urgent — don't wait on this thread. Call the clinic the same day, or 911 for severe symptoms.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
    orders: [],
    dxAssociated: [],
  },
};

export default fixture;
