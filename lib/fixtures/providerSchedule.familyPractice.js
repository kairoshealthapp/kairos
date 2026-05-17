// Provider surface — family practice day-in-the-life schedule fixtures.
// 7 visits, demonstration data only. All names fictional.
//
// Each row carries an inline `bundle` descriptor with conditions /
// medications / observations / allergies — enough for the clinical
// engine rules to actually fire against the patient. The runner is
// app/provider/lib/runAllRules.js; the bundle shape is assembled at
// render time by app/provider/lib/buildBundle.js.

const FAMILY_PRACTICE_SCHEDULE = [
  {
    id: "fp-0840",
    time: "8:40 AM",
    name: "Albert Ridgway",
    age: "67",
    sex: "M",
    visitType: "Follow Up",
    context: "HTN + T2DM 3mo",
    isPostHospital: false,
    briefingId: "fp-htn-t2dm-tobacco",
    bundle: {
      conditions: [
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2018-03-12" },
        { code: "E11.9", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Type 2 diabetes mellitus without complications", status: "active", onsetDate: "2019-08-04" },
        { code: "F17.210", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Nicotine dependence, cigarettes, uncomplicated", status: "active", onsetDate: "1985-01-01" },
        { code: "E78.5", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Hyperlipidemia, unspecified", status: "active", onsetDate: "2019-08-04" },
      ],
      medications: [
        { rxnormCode: "29046", name: "lisinopril 20 MG Oral Tablet", genericName: "lisinopril", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2018-03-15" },
        { rxnormCode: "6809", name: "metformin 1000 MG Oral Tablet", genericName: "metformin", dose: "1000 mg twice daily", route: "oral", status: "active", prescribedDate: "2019-08-10" },
        { rxnormCode: "83367", name: "atorvastatin 40 MG Oral Tablet", genericName: "atorvastatin", dose: "40 mg daily", route: "oral", status: "active", prescribedDate: "2019-08-10" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 158, unit: "mmHg", effectiveDate: "2026-04-22", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 96, unit: "mmHg", effectiveDate: "2026-04-22", category: "vital-signs" },
        { loincCode: "4548-4", display: "Hemoglobin A1c", value: 8.9, unit: "%", effectiveDate: "2026-04-22", category: "laboratory" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 145, unit: "mg/dL", effectiveDate: "2026-04-22", category: "laboratory" },
        { loincCode: "98979-8", display: "Glomerular filtration rate by CKD-EPI 2021", value: 68, unit: "mL/min/1.73m2", effectiveDate: "2026-04-22", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "fp-0900",
    time: "9:00 AM",
    name: "Marlene Tipton",
    age: "58",
    sex: "F",
    visitType: "Annual Physical",
    context: "screening due",
    isPostHospital: false,
    briefingId: "fp-annual-screening-58f",
    bundle: {
      conditions: [
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2021-09-30" },
      ],
      medications: [
        { rxnormCode: "5487", name: "hydrochlorothiazide 25 MG Oral Tablet", genericName: "hydrochlorothiazide", dose: "25 mg daily", route: "oral", status: "active", prescribedDate: "2021-10-04" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 138, unit: "mmHg", effectiveDate: "2026-04-30", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 82, unit: "mmHg", effectiveDate: "2026-04-30", category: "vital-signs" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 178, unit: "mg/dL", effectiveDate: "2026-04-30", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "fp-0920",
    time: "9:20 AM",
    name: "Hollis McCray",
    age: "71",
    sex: "M",
    visitType: "Follow Up",
    context: "uncontrolled HTN",
    isPostHospital: false,
    briefingId: "fp-uncontrolled-htn-71m",
    bundle: {
      conditions: [
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2014-06-11" },
        { code: "M19.90", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Unspecified osteoarthritis", status: "active", onsetDate: "2019-02-14" },
      ],
      medications: [
        { rxnormCode: "17767", name: "amlodipine 5 MG Oral Tablet", genericName: "amlodipine", dose: "5 mg daily", route: "oral", status: "active", prescribedDate: "2014-06-15" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 162, unit: "mmHg", effectiveDate: "2026-05-02", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 98, unit: "mmHg", effectiveDate: "2026-05-02", category: "vital-signs" },
      ],
      allergies: [],
    },
  },
  {
    id: "fp-0940",
    time: "9:40 AM",
    name: "Karen Brushwood",
    age: "50",
    sex: "F",
    visitType: "Annual Physical",
    context: "newly 50",
    isPostHospital: false,
    briefingId: "fp-annual-newly-50",
    bundle: {
      conditions: [
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2023-04-18" },
      ],
      medications: [
        { rxnormCode: "5487", name: "hydrochlorothiazide 12.5 MG Oral Tablet", genericName: "hydrochlorothiazide", dose: "12.5 mg daily", route: "oral", status: "active", prescribedDate: "2023-04-20" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 132, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 82, unit: "mmHg", effectiveDate: "2026-05-04", category: "vital-signs" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 122, unit: "mg/dL", effectiveDate: "2026-05-04", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "fp-1000",
    time: "10:00 AM",
    name: "Trevor Hampshire",
    age: "45",
    sex: "M",
    visitType: "Annual Physical",
    context: "newly 45",
    isPostHospital: false,
    briefingId: "fp-annual-newly-45",
    bundle: {
      conditions: [],
      medications: [],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 124, unit: "mmHg", effectiveDate: "2026-05-08", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 76, unit: "mmHg", effectiveDate: "2026-05-08", category: "vital-signs" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 138, unit: "mg/dL", effectiveDate: "2026-05-08", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "fp-1020",
    time: "10:20 AM",
    name: "Yvette Daugherty",
    age: "62",
    sex: "F",
    visitType: "Follow Up",
    context: "T2DM A1c 10.2",
    isPostHospital: false,
    briefingId: "fp-t2dm-uncontrolled",
    bundle: {
      conditions: [
        { code: "E11.22", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Type 2 diabetes mellitus with diabetic chronic kidney disease", status: "active", onsetDate: "2017-10-12" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2015-04-06" },
        { code: "E78.5", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Hyperlipidemia, unspecified", status: "active", onsetDate: "2017-10-12" },
      ],
      medications: [
        { rxnormCode: "6809", name: "metformin 1000 MG Oral Tablet", genericName: "metformin", dose: "1000 mg twice daily", route: "oral", status: "active", prescribedDate: "2017-10-15" },
        { rxnormCode: "29046", name: "lisinopril 10 MG Oral Tablet", genericName: "lisinopril", dose: "10 mg daily", route: "oral", status: "active", prescribedDate: "2015-04-10" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 136, unit: "mmHg", effectiveDate: "2026-05-06", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 84, unit: "mmHg", effectiveDate: "2026-05-06", category: "vital-signs" },
        { loincCode: "4548-4", display: "Hemoglobin A1c", value: 10.2, unit: "%", effectiveDate: "2026-05-06", category: "laboratory" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 168, unit: "mg/dL", effectiveDate: "2026-05-06", category: "laboratory" },
        { loincCode: "98979-8", display: "Glomerular filtration rate by CKD-EPI 2021", value: 52, unit: "mL/min/1.73m2", effectiveDate: "2026-05-06", category: "laboratory" },
        { loincCode: "9318-7", display: "Albumin/Creatinine [Mass Ratio] in Urine", value: 84, unit: "mg/g", effectiveDate: "2026-05-06", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "fp-1040",
    time: "10:40 AM",
    name: "Loretta Birch",
    age: "56",
    sex: "F",
    visitType: "Follow Up",
    context: "HLD + HTN 6mo",
    isPostHospital: false,
    briefingId: "fp-hld-htn-6mo",
    bundle: {
      conditions: [
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2017-11-22" },
        { code: "E78.5", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Hyperlipidemia, unspecified", status: "active", onsetDate: "2017-11-22" },
      ],
      medications: [
        { rxnormCode: "29046", name: "lisinopril 10 MG Oral Tablet", genericName: "lisinopril", dose: "10 mg daily", route: "oral", status: "active", prescribedDate: "2017-12-01" },
        { rxnormCode: "83367", name: "atorvastatin 20 MG Oral Tablet", genericName: "atorvastatin", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2017-12-01" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 142, unit: "mmHg", effectiveDate: "2026-05-11", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 88, unit: "mmHg", effectiveDate: "2026-05-11", category: "vital-signs" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 96, unit: "mg/dL", effectiveDate: "2026-05-11", category: "laboratory" },
      ],
      allergies: [],
    },
  },
];

export default FAMILY_PRACTICE_SCHEDULE;
