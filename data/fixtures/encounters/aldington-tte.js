// Pattern 2 — SYNTHESIS + NEW ORDER
// Source: docs/KAIROS-SESSION-2026-04-29.md Section 5 CASE 1 (Boultes/Anderson TTE)

const fixture = {
  id: "aldington-tte",
  slug: "aldington-tte",
  patternId: 2,
  patternName: "SYNTHESIS + NEW ORDER",
  tab: "resultsfu",
  authorizeActions: ["Send MyChart", "Sign Nurse Note", "Done"],
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
    name: "Anderson, Robert",
    displayName: "Robert Anderson",
    age: 61,
    sex: "M",
    dob: "1965-04-15",
    mrn: "71005544",
    proxyName: "Sarah Anderson",
    primary: "Pendrelle NP, Cardiology Associates",
    coverage: "Medicare A+B + supplemental",
  },
  sourceArtifact: {
    type: "Result Note",
    author: "Pendrelle, Cardiology",
    timestamp: "2026-04-29 06:41",
    body: "CTA chest reviewed. Findings consistent with mild aortic stenosis and mild aortic regurgitation, possible bicuspid aortic valve. Recommend transthoracic echo (TTE) for reassessment of valve morphology and severity. No immediate change in management. Patient may follow up at his next routine visit if asymptomatic; sooner if symptomatic. Please notify.",
  },
  // v3.0 — conditional panel declaration. Auto-inferred from
  // actionScripts / finalSignedState; override here if needed.
  panels: ["rnNote", "myChart", "orderPad"],
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
          "Dr. Pendrelle reviewed CTA chest from this week. Findings consistent with mild aortic stenosis and mild aortic regurgitation, possible bicuspid aortic valve. TTE ordered for reassessment of valve morphology and severity. No medication changes. Patient to follow up at next routine visit if asymptomatic, sooner if symptomatic.\n\nPatient notified via MyChart. Patient's daughter (Sarah Anderson, MyChart proxy) auto-included.",
      },
      {
        type: "pane-update",
        target: "mychart",
        mode: "replace",
        typingSpeedCps: 70,
        delayMsBefore: 400,
        content:
          "Mr. Anderson,\n\nYour provider has reviewed your recent CTA (a detailed CT scan of your heart and chest). The scan showed mild narrowing and mild leakage at one of your heart valves — these are minor findings that don't change anything you're doing today, but we want to take a closer look.\n\nWhat to do: No changes to your medications. Continue everything as you've been taking it.\n\nWhat's next: We've ordered an echocardiogram (an ultrasound of your heart) so we can see the valve in motion and measure the narrowing more precisely. The scheduling team will call you to set a time — usually within a week.\n\nWhat to watch for between now and the echo: New chest pain or pressure, shortness of breath with activity that didn't bother you before, light-headedness or feeling like you might pass out, or actually fainting. If any of those happen, call the clinic the same day. For severe chest pain or fainting, call 911.\n\nIf you don't hear from scheduling within a week, or if you have any questions, reply to this message or call the clinic.\n\nBrandon Sterne, RN BSN / Cardiology Associates",
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
              ccResults: ["Pendrelle"],
              cosign: "Pendrelle",
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
      "Dr. Pendrelle reviewed CTA chest. Mild AS, mild AR, possible bicuspid AV. TTE ordered for reassessment. No med changes. Patient notified via MyChart.",
    mychartMessage: "[As drafted above]",
    orders: [
      "Transthoracic echo (TTE) Complete — ECH110 STERNE BR — Future 4/29 First Available — Routine — Pendrelle cosign",
    ],
    dxAssociated: ["Mild aortic stenosis", "Mild aortic regurgitation"],
  },
};

export default fixture;
