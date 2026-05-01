// Pattern 2 — SYNTHESIS + NEW ORDER
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 5 CASE 1 (Boultes/Tunturi TTE)

const fixture = {
  id: "aldington-tte",
  slug: "aldington-tte",
  patternId: 2,
  patternName: "SYNTHESIS + NEW ORDER",
  tab: "resultsfu",
  urgency: "calm",
  sourceChannel: "epic-result",
  sourceBox: "results-followup",
  mychartStatus: "active",
  receivedAt: "2026-04-29T11:41:00Z",
  card: {
    subject: "CTA chest — mild AS, mild AR; reassess with TTE",
    kicker: "RESULTS F/U · NOTIFY",
    severity: "green",
  },
  patient: {
    name: "Tunturi, Aleksanteri",
    displayName: "Aleksanteri Tunturi",
    age: 61,
    sex: "M",
    dob: "1965-04-15",
    mrn: "71005544",
    proxyName: "Talvikki Tunturi",
    primary: "Voronova NP, Heart and Vascular Clinic",
    coverage: "Medicare A+B + supplemental",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Voronova, Cardiology",
    timestamp: "2026-04-29 06:41",
    body: "CTA chest reviewed. Findings consistent with mild aortic stenosis and mild aortic regurgitation, possible bicuspid aortic valve. Recommend transthoracic echo (TTE) for reassessment of valve morphology and severity. No immediate change in management. Patient may follow up at his next routine visit if asymptomatic; sooner if symptomatic. Please notify.",
  },
  initialPaneContent: {
    nurseNote: "",
    mychartMessage: "",
    phoneScript: "",
    orderPad: { orders: [], hasUnansweredQuestions: false, note: "" },
  },
  actionScripts: {
    "generate-note-mychart": [
      {
        type: "state-transition",
        target: "card",
        newState: "drafting",
        delayMsBefore: 100,
      },
      {
        type: "banner",
        kind: "green",
        text: "Pulling chart context (.triage equivalent)…",
        durationMs: 800,
        delayMsBefore: 0,
      },
      {
        type: "pane-update",
        target: "nurse-note",
        mode: "replace",
        typingSpeedCps: 80,
        delayMsBefore: 600,
        content:
          "Dr. Voronova reviewed CTA chest from this week. Findings consistent with mild aortic stenosis and mild aortic regurgitation, possible bicuspid aortic valve. TTE ordered for reassessment of valve morphology and severity. No medication changes. Patient to follow up at next routine visit if asymptomatic, sooner if symptomatic.\n\nPatient notified via MyChart. Patient's daughter (Talvikki Tunturi, MyChart proxy) auto-included.",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Mr Tunturi,\n\nDr. Voronova has reviewed your recent CTA (a detailed CT scan of the heart and chest). The scan showed mild narrowing (stenosis) and mild leakage (regurgitation) at one of your heart valves, possibly a bicuspid (two-leaflet) valve.\n\nTo take a closer look, we have ordered an echocardiogram (an ultrasound of your heart). The scheduling team will reach out to set a time. There are no changes to your medications.\n\nPlease follow up at your next routine visit, or sooner if you notice new chest pain, shortness of breath, light-headedness, or fainting.\n\nBrandon Sterne, RN BSN / Heart and Vascular Clinic",
      },
      {
        type: "pane-update",
        target: "order-pad",
        mode: "instant",
        delayMsBefore: 300,
        content: {
          orders: [
            {
              type: "Transthoracic echo (TTE) Complete",
              codeVariant: "ECH110 STERNE BR",
              reason: "reassessment of possible bicuspid aortic valve and aortic stenosis",
              associatedDx: ["Mild aortic stenosis", "Mild aortic regurgitation"],
              priority: "Routine",
              class: "Ancillary Performed",
              status: "Future",
              expectedDate: "2026-04-29 First Available",
              expires: "2027-04-29",
              clinicalQuestions: [
                { q: "Stroke or TIA in the last 90 days?", answered: true, answer: "No" },
                { q: "Saline bubble study?", answered: true, answer: "No" },
              ],
              releaseToPatient: true,
              ccResults: ["Voronova"],
              cosign: "Voronova",
            },
          ],
          hasUnansweredQuestions: false,
        },
      },
      {
        type: "state-transition",
        target: "card",
        newState: "drafted",
        delayMsBefore: 200,
      },
    ],
  },
  finalSignedState: {
    nurseNote:
      "Dr. Voronova reviewed CTA chest. Mild AS, mild AR, possible bicuspid AV. TTE ordered for reassessment. No med changes. Patient notified via MyChart.",
    mychartMessage: "[As drafted above]",
    orders: [
      "Transthoracic echo (TTE) Complete — ECH110 STERNE BR — Future 4/29 First Available — Routine — Voronova cosign",
    ],
    dxAssociated: ["Mild aortic stenosis", "Mild aortic regurgitation"],
  },
};

export default fixture;
