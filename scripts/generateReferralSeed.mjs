// One-shot generator for data/referralMessages/seed.json.
// Run: node scripts/generateReferralSeed.mjs
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Deterministic ID generation so re-running produces stable diffs.
let _seq = 0;
function nextId() {
  _seq += 1;
  return `ref_msg_${String(_seq).padStart(4, "0")}`;
}

const SENDERS_ACK = [
  ["Maya Chen, RN", "Riverbend Pulmonology"],
  ["Dr. Hollister", "Cedar Ridge Cardiology"],
  ["Anita Patel, MA", "Northgate Internal Medicine"],
  ["Kim Salazar", "Lakeshore Endocrinology"],
  ["Office of Dr. Pemberton", "Outside Cardiology Associates"],
  ["Theresa Owen, RN", "Westside Family Practice"],
  ["Dr. Klein", "Bayview Nephrology"],
  ["Brad Wexler", "Sunrise Sleep Medicine"],
  ["Office of Dr. Brindleforth", "Hollow Creek Neurology"],
  ["Joelle Pak, MA", "Greenleaf Rheumatology"],
  ["Dr. Sutterfield", "Mountain Vista Endocrinology"],
  ["Riverside Imaging", "Riverside Imaging Center"],
  ["Dr. Barzel", "Eastside Cardiology"],
  ["Front Desk", "Heritage Pulmonology"],
  ["Maria Esposito", "Centerline Vascular"],
];

const SENDERS_APPT = [
  ["Scheduling Dept", "Cedar Ridge Cardiology"],
  ["Reception", "Riverbend Pulmonology"],
  ["Office of Dr. Klein", "Bayview Nephrology"],
  ["Schedulers", "Lakeshore Endocrinology"],
  ["Front Desk", "Westside Family Practice"],
  ["Appointment Desk", "Greenleaf Rheumatology"],
  ["Dr. Brindleforth's Office", "Hollow Creek Neurology"],
  ["Reception", "Sunrise Sleep Medicine"],
];

const SENDERS_RECORDS = [
  ["Records Mgmt", "Riverside Imaging Center"],
  ["Medical Records", "Mountain Vista Endocrinology"],
  ["Health Info Mgmt", "Eastside Cardiology"],
  ["Records Office", "Centerline Vascular"],
  ["Records Dept", "Bayview Nephrology"],
  ["HIM Department", "Outside Cardiology Associates"],
];

const SENDERS_CLINICAL = [
  ["Dr. Penrose", "Outside Family Medicine"],
  ["Dr. Kowalski", "Northgate Internal Medicine"],
  ["Dr. Marston", "Hollow Creek Neurology"],
  ["Dr. Yates", "Cedar Ridge Cardiology"],
];

const SENDERS_SCHED = [
  ["Front Desk", "Cedar Ridge Cardiology"],
  ["Scheduler Tara", "Bayview Nephrology"],
  ["Office of Dr. Hollister", "Cedar Ridge Cardiology"],
  ["Reception", "Lakeshore Endocrinology"],
];

const SENDERS_INFO_REQ = [
  ["Dr. Esperanza", "Outside Cardiology Associates"],
  ["Dr. Barzel", "Eastside Cardiology"],
  ["Dr. Sutterfield", "Mountain Vista Endocrinology"],
];

const SENDERS_REFERRAL_RESPONSE = [
  ["Referral Coordinator", "Outside Cardiology Associates"],
  ["Intake", "Cedar Ridge Cardiology"],
  ["Triage Desk", "Hollow Creek Neurology"],
];

const PATIENTS = [
  "Esme Vandermeer", "Jonas Pritchard", "Camila Whitford", "Theo Albright",
  "Genevieve Mosley", "Beatriz Hummel", "Roland Tilford", "Susanna Brackett",
  "Casey Drumheller", "Iris Cantrell", "Wendell Knapp", "Lorena Bickford",
  "Asher Stillwell", "Rosalind Ackerman", "Gideon Tarpley", "Felicity Brevard",
  "Marcus Dunaway", "Vera Brindelhart", "Pierce Tankersley", "Ophelia Marston",
  "Dorian Cleary", "Nadine Westover", "Beckham Olliver", "Henrietta Vasquez",
  "Solomon Pickard", "Imogene Kelso", "Theron Bedford", "Magnolia Briese",
  "Quentin Hatfield", "Elspeth Carrington", "Ronan Whittaker", "Cordelia Yount",
  "Bartholomew Yates", "Wilhelmina Cropper", "Alistair Thorne", "Cassia Fennell",
];

let patientIdx = 0;
function pickPatient() {
  const p = PATIENTS[patientIdx % PATIENTS.length];
  patientIdx += 1;
  return p;
}

let senderState = {
  ack: 0, appt: 0, records: 0, clinical: 0, sched: 0, info: 0, refresp: 0,
};
function pickFrom(arr, key) {
  const i = senderState[key] % arr.length;
  senderState[key] += 1;
  return arr[i];
}

function nowMinusHours(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

let timeOffsetHours = 1;
function nextRecvTime() {
  const t = nowMinusHours(timeOffsetHours);
  timeOffsetHours += 0.35;
  return t;
}

function ackMsg(i) {
  const [s, o] = pickFrom(SENDERS_ACK, "ack");
  const patient = pickPatient();
  const variants = [
    {
      subject: `Referral received: ${patient}`,
      body: `Thank you for the referral. We have received the chart notes and will contact the patient within 5 business days to schedule. Please let us know if there are any urgent concerns.`,
    },
    {
      subject: `Confirmation - referral for ${patient}`,
      body: `Acknowledging receipt of referral for ${patient}. Faxed records uploaded to chart. Patient will be contacted by our scheduling team. No further action needed at this time.`,
    },
    {
      subject: `Got referral - ${patient}`,
      body: `Confirming we received your referral. Will reach out to patient this week to set up an initial visit. Will fax visit summary back when seen.`,
    },
    {
      subject: `Referral receipt - ${patient}`,
      body: `Hello, this is to confirm we have your referral on file. Estimated wait time for new patient appointments is currently 3-4 weeks. We'll be in touch with the patient.`,
    },
  ];
  const v = variants[i % variants.length];
  return {
    id: nextId(),
    senderName: s,
    senderOrg: o,
    subject: v.subject,
    body: v.body,
    receivedAt: nextRecvTime(),
    patientId: null,
    patientName: patient,
    classification: {
      category: "informational_ack",
      confidence: 0.93 + (i % 7) * 0.005,
      reasoning: "Standard receipt confirmation; no action required.",
      suggestedAction: null,
      routeTo: null,
      classifiedAt: nowMinusHours(0.05),
      classifierModel: "claude-sonnet-4-6",
      humanOverridden: false,
      humanOverrideNote: null,
    },
    status: "classified",
  };
}

function apptConfirmMsg(i) {
  const [s, o] = pickFrom(SENDERS_APPT, "appt");
  const patient = pickPatient();
  const variants = [
    {
      subject: `Appointment scheduled - ${patient}`,
      body: `Patient ${patient} has been scheduled for an initial consultation on the 14th at 2pm. Will fax visit summary after appointment.`,
    },
    {
      subject: `Visit completed - ${patient}`,
      body: `${patient} was seen in our office last week. Follow-up visit scheduled in 3 months. Visit summary attached separately. No urgent concerns at this time.`,
    },
    {
      subject: `Re: ${patient}`,
      body: `Patient was a no-show for the scheduled appointment. We have rescheduled per patient request. New appointment is in 2 weeks. Letting you know for your records.`,
    },
    {
      subject: `${patient} - follow-up`,
      body: `Patient seen on the 21st. Discussed treatment plan, started on additional therapy per our note. Follow-up in 6 weeks. Just informing you.`,
    },
  ];
  const v = variants[i % variants.length];
  return {
    id: nextId(),
    senderName: s,
    senderOrg: o,
    subject: v.subject,
    body: v.body,
    receivedAt: nextRecvTime(),
    patientId: null,
    patientName: patient,
    classification: {
      category: "informational_appointment_confirmation",
      confidence: 0.91 + (i % 5) * 0.01,
      reasoning: "Appointment scheduling/visit completion notice; informational only.",
      suggestedAction: null,
      routeTo: null,
      classifiedAt: nowMinusHours(0.05),
      classifierModel: "claude-sonnet-4-6",
      humanOverridden: false,
      humanOverrideNote: null,
    },
    status: "classified",
  };
}

function recordsMsg(i) {
  const [s, o] = pickFrom(SENDERS_RECORDS, "records");
  const patient = pickPatient();
  const variants = [
    {
      subject: `Records uploaded: ${patient}`,
      body: `Imaging report and prior office notes for ${patient} have been received and uploaded to the patient chart. No action required.`,
    },
    {
      subject: `Lab results received - ${patient}`,
      body: `Outside lab panel for ${patient} received per your request. Filed in chart under Outside Records. Available in Media tab.`,
    },
    {
      subject: `Records request fulfilled - ${patient}`,
      body: `Per your request, we have sent the following records: H&P, recent imaging, current med list. Filed to patient chart. Closing this request.`,
    },
  ];
  const v = variants[i % variants.length];
  return {
    id: nextId(),
    senderName: s,
    senderOrg: o,
    subject: v.subject,
    body: v.body,
    receivedAt: nextRecvTime(),
    patientId: null,
    patientName: patient,
    classification: {
      category: "informational_records_received",
      confidence: 0.94 + (i % 4) * 0.005,
      reasoning: "Records/labs filed to chart; no action required.",
      suggestedAction: null,
      routeTo: null,
      classifiedAt: nowMinusHours(0.05),
      classifierModel: "claude-sonnet-4-6",
      humanOverridden: false,
      humanOverrideNote: null,
    },
    status: "classified",
  };
}

function clinicalMsg(i) {
  const [s, o] = pickFrom(SENDERS_CLINICAL, "clinical");
  const patient = pickPatient();
  const variants = [
    {
      subject: `Question re: ${patient} medication management`,
      body: `Hi — patient brought a med list to my office today, was unsure about the metoprolol dose. She thinks it was changed at her cardiology appointment last month. Could you confirm current dose and any recent dose changes? Want to make sure I have accurate information for her annual physical next week. Thanks.`,
      action: "Confirm current metoprolol dose and recent changes from chart, draft response to outside PCP",
    },
    {
      subject: `Re: ${patient} - eplerenone clarification`,
      body: `Quick question. Patient told me cardiology stopped his eplerenone but I don't see the discontinuation note. Was this stopped or is the patient confused? Patient has follow-up with me next Tuesday and I'd like to clarify before then. Thanks.`,
      action: "Verify eplerenone status from chart and respond to outside provider before patient's Tuesday visit",
    },
    {
      subject: `${patient} - anticoagulation question`,
      body: `Patient seen in our office today. He thinks he is supposed to bridge his warfarin for upcoming dental procedure but cannot remember the plan. Could cardiology weigh in? Procedure is in 10 days.`,
      action: "Coordinate bridging plan for dental procedure, response to outside PCP needed within 1-2 days",
    },
    {
      subject: `Re: lab results for ${patient}`,
      body: `Got the BMP we ordered. K+ came back 5.4. Patient is on lisinopril and spironolactone per our records. Wanted to flag for cardiology before adjusting anything. Should we hold the spironolactone? Recheck timing?`,
      action: "Hyperkalemia coordination — review meds, advise on spironolactone hold + recheck plan",
    },
  ];
  const v = variants[i % variants.length];
  return {
    id: nextId(),
    senderName: s,
    senderOrg: o,
    subject: v.subject,
    body: v.body,
    receivedAt: nextRecvTime(),
    patientId: null,
    patientName: patient,
    classification: {
      category: "actionable_clinical_question",
      confidence: 0.88 + (i % 4) * 0.01,
      reasoning: "Outside provider requesting specific clinical information or coordination; response needed.",
      suggestedAction: v.action,
      routeTo: "provider_review",
      classifiedAt: nowMinusHours(0.05),
      classifierModel: "claude-sonnet-4-6",
      humanOverridden: false,
      humanOverrideNote: null,
    },
    status: "classified",
  };
}

function schedMsg(i) {
  const [s, o] = pickFrom(SENDERS_SCHED, "sched");
  const patient = pickPatient();
  const variants = [
    {
      subject: `Patient unable to schedule - ${patient}`,
      body: `We tried to call patient three times to schedule the cardiology consult per your referral but no answer and the voicemail box is full. Could your office reach out and ask the patient to call us directly? Patient may not realize the referral went out.`,
      action: "Call patient to confirm phone number and ask them to contact outside cardiology",
    },
    {
      subject: `Need scheduling help: ${patient}`,
      body: `Patient called our office in distress, said the appointment we offered (mid-July) is too far out. They want to be seen sooner due to ongoing chest discomfort. Could your team help us understand urgency level so we can re-route appropriately?`,
      action: "Confirm symptom severity with patient, communicate urgency back to outside office for earlier slot",
    },
    {
      subject: `Coordination - ${patient}`,
      body: `Patient is having difficulty taking time off for the procedure we scheduled. They mentioned your office had offered an evening slot a while back. Could you confirm whether that's still on the table or if they need to coordinate through us?`,
      action: "Confirm scheduling availability and route back to outside office",
    },
  ];
  const v = variants[i % variants.length];
  return {
    id: nextId(),
    senderName: s,
    senderOrg: o,
    subject: v.subject,
    body: v.body,
    receivedAt: nextRecvTime(),
    patientId: null,
    patientName: patient,
    classification: {
      category: "actionable_scheduling",
      confidence: 0.86 + (i % 3) * 0.01,
      reasoning: "Outside office requesting scheduling coordination from this clinic.",
      suggestedAction: v.action,
      routeTo: "scheduling",
      classifiedAt: nowMinusHours(0.05),
      classifierModel: "claude-sonnet-4-6",
      humanOverridden: false,
      humanOverrideNote: null,
    },
    status: "classified",
  };
}

function infoReqMsg(i) {
  const [s, o] = pickFrom(SENDERS_INFO_REQ, "info");
  const patient = pickPatient();
  const variants = [
    {
      subject: `Records request: ${patient}`,
      body: `Could you fax over the most recent echo report and stress test for ${patient}? We are doing a comprehensive review and the patient said cardiology had recent imaging. Thanks.`,
      action: "Forward recent echo + stress test to outside provider via secure channel",
    },
    {
      subject: `Need med list - ${patient}`,
      body: `Hi, we are seeing ${patient} for the first time in our office for a second opinion on heart failure management. Could you send over a current med list and last visit note? Patient is here today and will wait.`,
      action: "Urgent — patient in outside office now. Forward current med list + last visit note ASAP.",
    },
    {
      subject: `Documentation - ${patient}`,
      body: `Insurance is requesting documentation that this patient was evaluated by cardiology before they will approve the device we are recommending. Could you send the most recent cardiology consult note? Insurance deadline is end of week.`,
      action: "Send cardiology consult note for insurance authorization, deadline end of week",
    },
  ];
  const v = variants[i % variants.length];
  return {
    id: nextId(),
    senderName: s,
    senderOrg: o,
    subject: v.subject,
    body: v.body,
    receivedAt: nextRecvTime(),
    patientId: null,
    patientName: patient,
    classification: {
      category: "actionable_info_request",
      confidence: 0.89 + (i % 3) * 0.01,
      reasoning: "Outside provider requesting specific records/info from this clinic.",
      suggestedAction: v.action,
      routeTo: "provider_review",
      classifiedAt: nowMinusHours(0.05),
      classifierModel: "claude-sonnet-4-6",
      humanOverridden: false,
      humanOverrideNote: null,
    },
    status: "classified",
  };
}

function refRespMsg(i) {
  const [s, o] = pickFrom(SENDERS_REFERRAL_RESPONSE, "refresp");
  const patient = pickPatient();
  const variants = [
    {
      subject: `Pending: outbound referral for ${patient}`,
      body: `We received your referral for ${patient} but are not currently accepting new heart failure patients in our practice. Please advise — should we redirect or return to your office for placement elsewhere?`,
      action: "Decide whether to redirect referral or place elsewhere; respond to outside office",
    },
    {
      subject: `Re: ${patient} referral`,
      body: `Your referral for electrophysiology consultation came through. Before we accept, we need confirmation of recent Holter results and that medical management has been optimized. Could you confirm and we will proceed?`,
      action: "Confirm Holter results + med optimization status, decide whether to proceed",
    },
    {
      subject: `Insurance issue - referral for ${patient}`,
      body: `Patient's insurance does not allow us to be in network for this consultation. We can either request out-of-network override or refer back to you for redirect to in-network specialist. How do you want to proceed?`,
      action: "Decide on out-of-network override vs redirect; respond to outside office",
    },
  ];
  const v = variants[i % variants.length];
  return {
    id: nextId(),
    senderName: s,
    senderOrg: o,
    subject: v.subject,
    body: v.body,
    receivedAt: nextRecvTime(),
    patientId: null,
    patientName: patient,
    classification: {
      category: "actionable_referral_response_pending",
      confidence: 0.87 + (i % 3) * 0.01,
      reasoning: "Outside clinic awaiting decision on referral acceptance/redirect.",
      suggestedAction: v.action,
      routeTo: "provider_review",
      classifiedAt: nowMinusHours(0.05),
      classifierModel: "claude-sonnet-4-6",
      humanOverridden: false,
      humanOverrideNote: null,
    },
    status: "classified",
  };
}

function ambiguousMsg(i) {
  const senders = [
    ["Dr. Penrose", "Outside Family Medicine"],
    ["Theresa Owen, RN", "Westside Family Practice"],
  ];
  const [s, o] = senders[i % senders.length];
  const patient = pickPatient();
  const variants = [
    {
      subject: `Re: ${patient}`,
      body: `Patient mentioned having some chest pain last week, just letting you know. Otherwise doing well. Will see for routine follow-up next month.`,
    },
    {
      subject: `${patient} - update`,
      body: `Patient told me she felt dizzy a couple of times since starting the new med. Not sure if she has reached out to you about it. Just wanted to flag.`,
    },
  ];
  const v = variants[i % variants.length];
  return {
    id: nextId(),
    senderName: s,
    senderOrg: o,
    subject: v.subject,
    body: v.body,
    receivedAt: nextRecvTime(),
    patientId: null,
    patientName: patient,
    classification: {
      category: "unable_to_classify",
      confidence: 0.42 + i * 0.04,
      reasoning: "Soft clinical mention without explicit ask; unclear whether informational or an implicit clinical concern.",
      suggestedAction: "Human review — determine if symptom flag requires patient contact or chart documentation",
      routeTo: null,
      classifiedAt: nowMinusHours(0.05),
      classifierModel: "claude-sonnet-4-6",
      humanOverridden: false,
      humanOverrideNote: null,
    },
    status: "classified",
  };
}

const out = [];
for (let i = 0; i < 32; i++) out.push(ackMsg(i));
for (let i = 0; i < 18; i++) out.push(apptConfirmMsg(i));
for (let i = 0; i < 14; i++) out.push(recordsMsg(i));
for (let i = 0; i < 4; i++) out.push(schedMsg(i));
for (let i = 0; i < 4; i++) out.push(clinicalMsg(i));
for (let i = 0; i < 3; i++) out.push(infoReqMsg(i));
for (let i = 0; i < 3; i++) out.push(refRespMsg(i));
for (let i = 0; i < 2; i++) out.push(ambiguousMsg(i));

// Shuffle deterministically so categories are interleaved (don't surface as
// blocks of the same category)
function deterministicShuffle(arr) {
  const a = [...arr];
  // simple LCG seeded shuffle
  let seed = 1337;
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const shuffled = deterministicShuffle(out);

const target = path.join(process.cwd(), "data", "referralMessages", "seed.json");
fs.writeFileSync(target, JSON.stringify(shuffled, null, 2));
console.log(`Wrote ${shuffled.length} messages to ${target}`);
