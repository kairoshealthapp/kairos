// Provider surface — cardiology day-in-the-life schedule fixtures.
// 15 visits, demonstration data only. All names fictional.
//
// Each row now carries an additive `bundle` descriptor with conditions /
// medications / observations / allergies so the clinical engine rules
// fire on the column display. The existing patient header fields are
// unchanged — bundle is purely additive.

const CARDIOLOGY_SCHEDULE = [
  {
    id: "card-0840",
    time: "8:40 AM",
    name: "Robert Trentham",
    age: "66",
    sex: "M",
    visitType: "Post Hospital Visit",
    context: "cardiac arrest workup",
    isPostHospital: true,
    briefingId: "card-cardiac-arrest",
    bundle: {
      conditions: [
        { code: "I50.22", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Chronic systolic (congestive) heart failure", status: "active", onsetDate: "2026-04-12" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2012-04-04" },
        { code: "E78.5", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Hyperlipidemia, unspecified", status: "active", onsetDate: "2015-09-22" },
      ],
      medications: [
        { rxnormCode: "202363", name: "furosemide 40 MG Oral Tablet", genericName: "furosemide", dose: "40 mg daily", route: "oral", status: "active", prescribedDate: "2026-04-20" },
        { rxnormCode: "200031", name: "carvedilol 12.5 MG Oral Tablet", genericName: "carvedilol", dose: "12.5 mg BID", route: "oral", status: "active", prescribedDate: "2026-04-20" },
        { rxnormCode: "29046", name: "lisinopril 10 MG Oral Tablet", genericName: "lisinopril", dose: "10 mg daily", route: "oral", status: "active", prescribedDate: "2026-04-20" },
        { rxnormCode: "83367", name: "atorvastatin 40 MG Oral Tablet", genericName: "atorvastatin", dose: "40 mg daily", route: "oral", status: "active", prescribedDate: "2015-09-25" },
      ],
      observations: [
        { loincCode: "10230-1", display: "Left ventricular ejection fraction", value: 32, unit: "%", effectiveDate: "2026-04-12", category: "imaging" },
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 124, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 78, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 78, unit: "mg/dL", effectiveDate: "2026-05-04", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "card-0900",
    time: "9:00 AM",
    name: "Daniel Voorhees",
    age: "58",
    sex: "M",
    visitType: "Follow Up",
    context: "EKG Afib",
    isPostHospital: false,
    briefingId: "card-ekg-afib",
    bundle: {
      conditions: [
        { code: "I48.91", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Unspecified atrial fibrillation", status: "active", onsetDate: "2025-11-20" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2018-06-08" },
      ],
      medications: [
        { rxnormCode: "29046", name: "lisinopril 20 MG Oral Tablet", genericName: "lisinopril", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2018-06-12" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 134, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 82, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
      ],
      allergies: [],
    },
  },
  {
    id: "card-0920",
    time: "9:20 AM",
    name: "Marcus Halpern",
    age: "29",
    sex: "M",
    visitType: "Follow Up",
    context: "1mo",
    isPostHospital: false,
    briefingId: "card-routine-1mo-halpern",
    bundle: { conditions: [], medications: [], observations: [], allergies: [] },
  },
  {
    id: "card-0940",
    time: "9:40 AM",
    name: "Eleanor Castellanos",
    age: "53",
    sex: "F",
    visitType: "Follow Up",
    context: "1mo",
    isPostHospital: false,
    briefingId: "card-routine-1mo-castellanos",
    bundle: {
      conditions: [
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2020-05-18" },
      ],
      medications: [
        { rxnormCode: "5487", name: "hydrochlorothiazide 25 MG Oral Tablet", genericName: "hydrochlorothiazide", dose: "25 mg daily", route: "oral", status: "active", prescribedDate: "2020-05-22" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 132, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 82, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
      ],
      allergies: [],
    },
  },
  {
    id: "card-1000",
    time: "10:00 AM",
    name: "Patricia Lindstrom",
    age: "61",
    sex: "F",
    visitType: "Follow Up",
    context: "6mo",
    isPostHospital: false,
    briefingId: "card-routine-6mo-lindstrom",
    bundle: {
      conditions: [
        { code: "I50.32", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Chronic diastolic (congestive) heart failure", status: "active", onsetDate: "2024-02-14" },
        { code: "E11.9", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Type 2 diabetes mellitus without complications", status: "active", onsetDate: "2020-09-11" },
      ],
      medications: [
        { rxnormCode: "6809", name: "metformin 1000 MG Oral Tablet", genericName: "metformin", dose: "1000 mg twice daily", route: "oral", status: "active", prescribedDate: "2020-09-15" },
        { rxnormCode: "202363", name: "furosemide 20 MG Oral Tablet", genericName: "furosemide", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2024-02-18" },
      ],
      observations: [
        { loincCode: "10230-1", display: "Left ventricular ejection fraction", value: 56, unit: "%", effectiveDate: "2024-02-14", category: "imaging" },
        { loincCode: "98979-8", display: "Glomerular filtration rate by CKD-EPI 2021", value: 68, unit: "mL/min/1.73m2", effectiveDate: "2026-05-04", category: "laboratory" },
        { loincCode: "4548-4", display: "Hemoglobin A1c", value: 7.6, unit: "%", effectiveDate: "2026-05-04", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "card-1020",
    time: "10:20 AM",
    name: "Mildred Aoki",
    age: "86",
    sex: "F",
    visitType: "Follow Up",
    context: "1mo",
    isPostHospital: false,
    briefingId: "card-routine-1mo-aoki",
    bundle: {
      conditions: [
        { code: "I48.91", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Unspecified atrial fibrillation", status: "active", onsetDate: "2022-08-04" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2005-01-10" },
      ],
      medications: [
        { rxnormCode: "1599538", name: "apixaban 5 MG Oral Tablet", genericName: "apixaban", dose: "5 mg BID", route: "oral", status: "active", prescribedDate: "2022-08-08" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 128, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 76, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
      ],
      allergies: [],
    },
  },
  {
    id: "card-1040",
    time: "10:40 AM",
    name: "Geraldine Beaumont",
    age: "78",
    sex: "F",
    visitType: "Follow Up",
    context: "6mo",
    isPostHospital: false,
    briefingId: "card-routine-6mo-beaumont",
    bundle: {
      conditions: [
        { code: "I25.10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Atherosclerotic heart disease of native coronary artery without angina pectoris", status: "active", onsetDate: "2018-12-04" },
      ],
      medications: [
        { rxnormCode: "83367", name: "atorvastatin 40 MG Oral Tablet", genericName: "atorvastatin", dose: "40 mg daily", route: "oral", status: "active", prescribedDate: "2018-12-08" },
      ],
      observations: [
        { loincCode: "2089-1", display: "LDL cholesterol", value: 64, unit: "mg/dL", effectiveDate: "2026-05-04", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "card-1100",
    time: "11:00 AM",
    name: "Walter Moskowitz",
    age: "74",
    sex: "M",
    visitType: "Follow Up",
    context: "3mo",
    isPostHospital: false,
    briefingId: "card-routine-3mo-moskowitz",
    bundle: {
      conditions: [
        { code: "I50.22", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Chronic systolic (congestive) heart failure", status: "active", onsetDate: "2023-04-10" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2008-02-20" },
      ],
      medications: [
        { rxnormCode: "200031", name: "carvedilol 25 MG Oral Tablet", genericName: "carvedilol", dose: "25 mg BID", route: "oral", status: "active", prescribedDate: "2023-04-15" },
        { rxnormCode: "29046", name: "lisinopril 20 MG Oral Tablet", genericName: "lisinopril", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2008-02-25" },
      ],
      observations: [
        { loincCode: "10230-1", display: "Left ventricular ejection fraction", value: 36, unit: "%", effectiveDate: "2023-04-10", category: "imaging" },
        { loincCode: "98979-8", display: "Glomerular filtration rate by CKD-EPI 2021", value: 58, unit: "mL/min/1.73m2", effectiveDate: "2026-05-04", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "card-1120",
    time: "11:20 AM",
    name: "Renee Calabrese",
    age: "46",
    sex: "F",
    visitType: "Follow Up",
    context: "palpitations",
    isPostHospital: false,
    briefingId: "card-palpitations",
    bundle: { conditions: [], medications: [], observations: [], allergies: [] },
  },
  {
    id: "card-1300",
    time: "1:00 PM",
    name: "Doris Whitfield-Hayes",
    age: "73",
    sex: "F",
    visitType: "Follow Up",
    context: "",
    isPostHospital: false,
    briefingId: "card-routine-whitfield",
    bundle: {
      conditions: [
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2011-05-30" },
      ],
      medications: [
        { rxnormCode: "17767", name: "amlodipine 5 MG Oral Tablet", genericName: "amlodipine", dose: "5 mg daily", route: "oral", status: "active", prescribedDate: "2011-06-02" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 126, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 76, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
      ],
      allergies: [],
    },
  },
  {
    id: "card-1320",
    time: "1:20 PM",
    name: "Thomas Brennan",
    age: "66",
    sex: "M",
    visitType: "Post Hospital Visit",
    context: "CHF exacerbation",
    isPostHospital: true,
    briefingId: "card-chf-exac",
    bundle: {
      conditions: [
        { code: "I50.22", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Chronic systolic (congestive) heart failure", status: "active", onsetDate: "2023-03-14" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2010-07-22" },
      ],
      medications: [
        { rxnormCode: "202363", name: "furosemide 40 MG Oral Tablet", genericName: "furosemide", dose: "40 mg twice daily", route: "oral", status: "active", prescribedDate: "2023-03-18" },
        { rxnormCode: "200031", name: "carvedilol 25 MG Oral Tablet", genericName: "carvedilol", dose: "25 mg BID", route: "oral", status: "active", prescribedDate: "2023-03-18" },
        { rxnormCode: "29046", name: "lisinopril 20 MG Oral Tablet", genericName: "lisinopril", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2010-07-25" },
      ],
      observations: [
        { loincCode: "10230-1", display: "Left ventricular ejection fraction", value: 34, unit: "%", effectiveDate: "2026-04-30", category: "imaging" },
        { loincCode: "98979-8", display: "Glomerular filtration rate by CKD-EPI 2021", value: 54, unit: "mL/min/1.73m2", effectiveDate: "2026-04-30", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "card-1340",
    time: "1:40 PM",
    name: "Roland Petrosyan",
    age: "58",
    sex: "M",
    visitType: "Post Hospital Visit",
    context: "AFib with RVR",
    isPostHospital: true,
    briefingId: "card-afib-rvr",
    bundle: {
      conditions: [
        { code: "I48.91", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Unspecified atrial fibrillation", status: "active", onsetDate: "2026-05-02" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2017-04-04" },
      ],
      medications: [
        { rxnormCode: "29046", name: "lisinopril 20 MG Oral Tablet", genericName: "lisinopril", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2017-04-08" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 132, unit: "mmHg", effectiveDate: "2026-05-08", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 84, unit: "mmHg", effectiveDate: "2026-05-08", category: "vital-signs" },
      ],
      allergies: [],
    },
  },
  {
    id: "card-1400",
    time: "2:00 PM",
    name: "Harold Sandborn",
    age: "83",
    sex: "M",
    visitType: "Follow Up",
    context: "1mo",
    isPostHospital: false,
    briefingId: "card-routine-1mo-sandborn",
    bundle: { conditions: [], medications: [], observations: [], allergies: [] },
  },
  {
    id: "card-1420",
    time: "2:20 PM",
    name: "Adelaide Murchison",
    age: "91",
    sex: "F",
    visitType: "Device Check",
    context: "6mo",
    isPostHospital: false,
    briefingId: "card-device-check",
    bundle: { conditions: [], medications: [], observations: [], allergies: [] },
  },
  {
    id: "card-1440",
    time: "2:40 PM",
    name: "Vincent Halloran",
    age: "75",
    sex: "M",
    visitType: "Follow Up",
    context: "6mo",
    isPostHospital: false,
    briefingId: "card-routine-6mo-halloran",
    bundle: { conditions: [], medications: [], observations: [], allergies: [] },
  },
];

export default CARDIOLOGY_SCHEDULE;
