// Provider surface — internal medicine day-in-the-life schedule fixtures.
// 7 visits, demonstration data only. All names fictional.
//
// Each row carries an inline `bundle` descriptor with conditions /
// medications / observations / allergies so cross-clinic rules fire.
// Whitestone (im-0840) is the IM tour anchor patient and carries the
// fullest clinical picture.

const INTERNAL_MEDICINE_SCHEDULE = [
  {
    id: "im-0840",
    time: "8:40 AM",
    name: "Howard Whitestone",
    age: "71",
    sex: "M",
    visitType: "Post Hospital F/U",
    context: "HFrEF + multimorbid",
    isPostHospital: true,
    briefingId: "im-chf-exac",
    bundle: {
      conditions: [
        { code: "I50.22", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Chronic systolic (congestive) heart failure", status: "active", onsetDate: "2024-11-08" },
        { code: "E11.22", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Type 2 diabetes mellitus with diabetic chronic kidney disease", status: "active", onsetDate: "2018-04-22" },
        { code: "N18.31", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Chronic kidney disease, stage 3a", status: "active", onsetDate: "2023-06-12" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2012-02-10" },
        { code: "E78.5", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Hyperlipidemia, unspecified", status: "active", onsetDate: "2018-04-22" },
        { code: "M19.90", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Unspecified osteoarthritis", status: "active", onsetDate: "2017-09-30" },
      ],
      medications: [
        { rxnormCode: "202363", name: "furosemide 40 MG Oral Tablet", genericName: "furosemide", dose: "40 mg daily", route: "oral", status: "active", prescribedDate: "2024-11-16" },
        { rxnormCode: "200031", name: "carvedilol 25 MG Oral Tablet", genericName: "carvedilol", dose: "25 mg BID", route: "oral", status: "active", prescribedDate: "2024-11-16" },
        { rxnormCode: "29046", name: "lisinopril 20 MG Oral Tablet", genericName: "lisinopril", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2024-11-16" },
        { rxnormCode: "298869", name: "eplerenone 50 MG Oral Tablet", genericName: "eplerenone", dose: "50 mg daily", route: "oral", status: "active", prescribedDate: "2024-11-16" },
        { rxnormCode: "83367", name: "atorvastatin 40 MG Oral Tablet", genericName: "atorvastatin", dose: "40 mg daily", route: "oral", status: "active", prescribedDate: "2018-05-01" },
        { rxnormCode: "6809", name: "metformin 1000 MG Oral Tablet", genericName: "metformin", dose: "1000 mg twice daily", route: "oral", status: "active", prescribedDate: "2018-04-25" },
      ],
      observations: [
        { loincCode: "10230-1", display: "Left ventricular ejection fraction", value: 28, unit: "%", effectiveDate: "2024-11-12", category: "imaging" },
        { loincCode: "98979-8", display: "Glomerular filtration rate by CKD-EPI 2021", value: 48, unit: "mL/min/1.73m2", effectiveDate: "2026-05-04", category: "laboratory" },
        { loincCode: "9318-7", display: "Albumin/Creatinine [Mass Ratio] in Urine", value: 92, unit: "mg/g", effectiveDate: "2026-05-04", category: "laboratory" },
        { loincCode: "4548-4", display: "Hemoglobin A1c", value: 7.4, unit: "%", effectiveDate: "2026-05-04", category: "laboratory" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 88, unit: "mg/dL", effectiveDate: "2026-05-04", category: "laboratory" },
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 122, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 76, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
      ],
      allergies: [
        { display: "NSAIDs — GI bleed risk noted on prior admission", severity: "moderate" },
      ],
    },
  },
  {
    id: "im-0900",
    time: "9:00 AM",
    name: "Sandra Beauchamp",
    age: "64",
    sex: "F",
    visitType: "Follow Up",
    context: "DM2 + CKD 3mo",
    isPostHospital: false,
    briefingId: "im-dm2-ckd-3mo",
    bundle: {
      conditions: [
        { code: "E11.22", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Type 2 diabetes mellitus with diabetic chronic kidney disease", status: "active", onsetDate: "2019-03-04" },
        { code: "N18.31", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Chronic kidney disease, stage 3a", status: "active", onsetDate: "2024-04-18" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2016-10-22" },
      ],
      medications: [
        { rxnormCode: "6809", name: "metformin 1000 MG Oral Tablet", genericName: "metformin", dose: "1000 mg twice daily", route: "oral", status: "active", prescribedDate: "2019-03-08" },
        { rxnormCode: "29046", name: "lisinopril 20 MG Oral Tablet", genericName: "lisinopril", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2016-10-25" },
      ],
      observations: [
        { loincCode: "98979-8", display: "Glomerular filtration rate by CKD-EPI 2021", value: 52, unit: "mL/min/1.73m2", effectiveDate: "2026-04-20", category: "laboratory" },
        { loincCode: "9318-7", display: "Albumin/Creatinine [Mass Ratio] in Urine", value: 145, unit: "mg/g", effectiveDate: "2026-04-20", category: "laboratory" },
        { loincCode: "4548-4", display: "Hemoglobin A1c", value: 8.1, unit: "%", effectiveDate: "2026-04-20", category: "laboratory" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 152, unit: "mg/dL", effectiveDate: "2026-04-20", category: "laboratory" },
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 138, unit: "mmHg", effectiveDate: "2026-04-20", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 84, unit: "mmHg", effectiveDate: "2026-04-20", category: "vital-signs" },
      ],
      allergies: [],
    },
  },
  {
    id: "im-1000",
    time: "10:00 AM",
    name: "Stanley Wojciechowski",
    age: "79",
    sex: "M",
    visitType: "Follow Up",
    context: "AFib + HTN 1mo",
    isPostHospital: false,
    briefingId: "im-multichronic-1mo",
    bundle: {
      conditions: [
        { code: "I48.91", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Unspecified atrial fibrillation", status: "active", onsetDate: "2022-09-14" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2008-05-02" },
        { code: "E78.5", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Hyperlipidemia, unspecified", status: "active", onsetDate: "2015-01-10" },
      ],
      medications: [
        { rxnormCode: "1364430", name: "aspirin 81 MG Oral Tablet", genericName: "aspirin", dose: "81 mg daily", route: "oral", status: "active", prescribedDate: "2022-09-20" },
        { rxnormCode: "29046", name: "lisinopril 20 MG Oral Tablet", genericName: "lisinopril", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2008-05-10" },
        { rxnormCode: "83367", name: "atorvastatin 20 MG Oral Tablet", genericName: "atorvastatin", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2015-01-15" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 144, unit: "mmHg", effectiveDate: "2026-05-08", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 86, unit: "mmHg", effectiveDate: "2026-05-08", category: "vital-signs" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 102, unit: "mg/dL", effectiveDate: "2026-05-08", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "im-1040",
    time: "10:40 AM",
    name: "Lillian Ostrowski",
    age: "68",
    sex: "F",
    visitType: "Post Hospital Visit",
    context: "UTI + sepsis + AKI",
    isPostHospital: true,
    briefingId: "im-uti-sepsis-aki",
    bundle: {
      conditions: [
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2014-04-22" },
        { code: "N17.9", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Acute kidney failure, unresolved", status: "resolved", onsetDate: "2026-04-28" },
      ],
      medications: [
        { rxnormCode: "29046", name: "lisinopril 10 MG Oral Tablet", genericName: "lisinopril", dose: "10 mg daily", route: "oral", status: "active", prescribedDate: "2014-04-25" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 128, unit: "mmHg", effectiveDate: "2026-05-09", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 78, unit: "mmHg", effectiveDate: "2026-05-09", category: "vital-signs" },
        { loincCode: "98979-8", display: "Glomerular filtration rate by CKD-EPI 2021", value: 72, unit: "mL/min/1.73m2", effectiveDate: "2026-05-09", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "im-1100",
    time: "11:00 AM",
    name: "Edgar Threlkeld",
    age: "73",
    sex: "M",
    visitType: "Medicare Wellness Visit",
    context: "",
    isPostHospital: false,
    briefingId: "im-medicare-wellness",
    bundle: {
      conditions: [
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2011-02-04" },
        { code: "E78.5", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Hyperlipidemia, unspecified", status: "active", onsetDate: "2014-08-30" },
      ],
      medications: [
        { rxnormCode: "17767", name: "amlodipine 10 MG Oral Tablet", genericName: "amlodipine", dose: "10 mg daily", route: "oral", status: "active", prescribedDate: "2011-02-08" },
        { rxnormCode: "83367", name: "atorvastatin 20 MG Oral Tablet", genericName: "atorvastatin", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2014-09-04" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 130, unit: "mmHg", effectiveDate: "2026-05-12", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 78, unit: "mmHg", effectiveDate: "2026-05-12", category: "vital-signs" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 88, unit: "mg/dL", effectiveDate: "2026-05-12", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "im-1300",
    time: "1:00 PM",
    name: "Helen Krzyzanowski",
    age: "81",
    sex: "F",
    visitType: "Follow Up",
    context: "HFpEF + HTN 1mo",
    isPostHospital: false,
    briefingId: "im-routine-1mo-krzyzanowski",
    bundle: {
      conditions: [
        { code: "I50.32", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Chronic diastolic (congestive) heart failure", status: "active", onsetDate: "2023-07-19" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2002-12-12" },
        { code: "E11.9", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Type 2 diabetes mellitus without complications", status: "active", onsetDate: "2018-08-04" },
      ],
      medications: [
        { rxnormCode: "202363", name: "furosemide 20 MG Oral Tablet", genericName: "furosemide", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2023-07-22" },
        { rxnormCode: "29046", name: "lisinopril 10 MG Oral Tablet", genericName: "lisinopril", dose: "10 mg daily", route: "oral", status: "active", prescribedDate: "2002-12-15" },
        { rxnormCode: "6809", name: "metformin 500 MG Oral Tablet", genericName: "metformin", dose: "500 mg BID", route: "oral", status: "active", prescribedDate: "2018-08-08" },
      ],
      observations: [
        { loincCode: "10230-1", display: "Left ventricular ejection fraction", value: 58, unit: "%", effectiveDate: "2023-07-19", category: "imaging" },
        { loincCode: "98979-8", display: "Glomerular filtration rate by CKD-EPI 2021", value: 62, unit: "mL/min/1.73m2", effectiveDate: "2026-05-11", category: "laboratory" },
        { loincCode: "4548-4", display: "Hemoglobin A1c", value: 7.1, unit: "%", effectiveDate: "2026-05-11", category: "laboratory" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 96, unit: "mg/dL", effectiveDate: "2026-05-11", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "im-1340",
    time: "1:40 PM",
    name: "Patricia Henneberry",
    age: "67",
    sex: "F",
    visitType: "Follow Up",
    context: "osteoporosis 6mo",
    isPostHospital: false,
    briefingId: "im-osteo-6mo",
    bundle: {
      conditions: [
        { code: "M81.0", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Age-related osteoporosis without current pathological fracture", status: "active", onsetDate: "2023-02-08" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2017-06-15" },
      ],
      medications: [
        { rxnormCode: "29046", name: "lisinopril 10 MG Oral Tablet", genericName: "lisinopril", dose: "10 mg daily", route: "oral", status: "active", prescribedDate: "2017-06-18" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 134, unit: "mmHg", effectiveDate: "2026-05-13", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 80, unit: "mmHg", effectiveDate: "2026-05-13", category: "vital-signs" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 142, unit: "mg/dL", effectiveDate: "2026-05-13", category: "laboratory" },
      ],
      allergies: [],
    },
  },
];

export default INTERNAL_MEDICINE_SCHEDULE;
