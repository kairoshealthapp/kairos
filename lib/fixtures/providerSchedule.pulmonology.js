// Provider surface — pulmonology day-in-the-life schedule fixtures.
// 7 visits, demonstration data only. All names fictional.
//
// Each row carries an inline `bundle` descriptor so cross-clinic rules
// fire on the column display. Okafor (pulm-0840) is the Pulm tour
// anchor patient.

const PULMONOLOGY_SCHEDULE = [
  {
    id: "pulm-0840",
    time: "8:40 AM",
    name: "Lawrence Okafor",
    age: "67",
    sex: "M",
    visitType: "Post Hospital Visit",
    context: "COPD exacerbation",
    isPostHospital: true,
    briefingId: "pulm-copd-exac",
    bundle: {
      conditions: [
        { code: "J44.1", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Chronic obstructive pulmonary disease with (acute) exacerbation", status: "active", onsetDate: "2019-05-02" },
        { code: "F17.210", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Nicotine dependence, cigarettes, uncomplicated", status: "active", onsetDate: "1980-01-01" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2016-03-04" },
        { code: "E11.9", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Type 2 diabetes mellitus without complications", status: "active", onsetDate: "2020-09-22" },
      ],
      medications: [
        { rxnormCode: "29046", name: "lisinopril 20 MG Oral Tablet", genericName: "lisinopril", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2016-03-08" },
        { rxnormCode: "6809", name: "metformin 1000 MG Oral Tablet", genericName: "metformin", dose: "1000 mg twice daily", route: "oral", status: "active", prescribedDate: "2020-09-26" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 146, unit: "mmHg", effectiveDate: "2026-05-05", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 88, unit: "mmHg", effectiveDate: "2026-05-05", category: "vital-signs" },
        { loincCode: "4548-4", display: "Hemoglobin A1c", value: 8.4, unit: "%", effectiveDate: "2026-05-05", category: "laboratory" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 156, unit: "mg/dL", effectiveDate: "2026-05-05", category: "laboratory" },
        { loincCode: "98979-8", display: "Glomerular filtration rate by CKD-EPI 2021", value: 78, unit: "mL/min/1.73m2", effectiveDate: "2026-05-05", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "pulm-0900",
    time: "9:00 AM",
    name: "Stephanie Brockton",
    age: "54",
    sex: "F",
    visitType: "Follow Up",
    context: "asthma 3mo",
    isPostHospital: false,
    briefingId: "pulm-asthma-3mo",
    bundle: {
      conditions: [
        { code: "J45.40", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Moderate persistent asthma, uncomplicated", status: "active", onsetDate: "2014-04-12" },
      ],
      medications: [],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 122, unit: "mmHg", effectiveDate: "2026-05-09", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 76, unit: "mmHg", effectiveDate: "2026-05-09", category: "vital-signs" },
      ],
      allergies: [],
    },
  },
  {
    id: "pulm-1000",
    time: "10:00 AM",
    name: "Cornelius Whitlock",
    age: "81",
    sex: "M",
    visitType: "Follow Up",
    context: "COPD + HTN 1mo",
    isPostHospital: false,
    briefingId: "pulm-routine-1mo-whitlock",
    bundle: {
      conditions: [
        { code: "J44.9", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Chronic obstructive pulmonary disease, unspecified", status: "active", onsetDate: "2014-09-04" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2003-07-12" },
        { code: "E78.5", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Hyperlipidemia, unspecified", status: "active", onsetDate: "2009-02-20" },
      ],
      medications: [
        { rxnormCode: "17767", name: "amlodipine 5 MG Oral Tablet", genericName: "amlodipine", dose: "5 mg daily", route: "oral", status: "active", prescribedDate: "2003-07-15" },
        { rxnormCode: "83367", name: "atorvastatin 20 MG Oral Tablet", genericName: "atorvastatin", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2009-02-25" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 152, unit: "mmHg", effectiveDate: "2026-05-12", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 92, unit: "mmHg", effectiveDate: "2026-05-12", category: "vital-signs" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 102, unit: "mg/dL", effectiveDate: "2026-05-12", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "pulm-1040",
    time: "10:40 AM",
    name: "Reginald Faulkner",
    age: "69",
    sex: "M",
    visitType: "Post Hospital Visit",
    context: "pneumonia + sepsis",
    isPostHospital: true,
    briefingId: "pulm-pna-sepsis",
    bundle: {
      conditions: [
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2010-03-04" },
        { code: "E11.9", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Type 2 diabetes mellitus without complications", status: "active", onsetDate: "2017-08-12" },
      ],
      medications: [
        { rxnormCode: "29046", name: "lisinopril 20 MG Oral Tablet", genericName: "lisinopril", dose: "20 mg daily", route: "oral", status: "active", prescribedDate: "2010-03-08" },
        { rxnormCode: "6809", name: "metformin 1000 MG Oral Tablet", genericName: "metformin", dose: "1000 mg twice daily", route: "oral", status: "active", prescribedDate: "2017-08-16" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 138, unit: "mmHg", effectiveDate: "2026-05-08", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 84, unit: "mmHg", effectiveDate: "2026-05-08", category: "vital-signs" },
        { loincCode: "4548-4", display: "Hemoglobin A1c", value: 7.8, unit: "%", effectiveDate: "2026-05-08", category: "laboratory" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 148, unit: "mg/dL", effectiveDate: "2026-05-08", category: "laboratory" },
      ],
      allergies: [],
    },
  },
  {
    id: "pulm-1120",
    time: "11:20 AM",
    name: "Aldo Saracino",
    age: "76",
    sex: "M",
    visitType: "Follow Up",
    context: "oxygen reassessment",
    isPostHospital: false,
    briefingId: "pulm-oxygen-reassess",
    bundle: {
      conditions: [
        { code: "J44.9", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Chronic obstructive pulmonary disease, unspecified", status: "active", onsetDate: "2011-10-18" },
        { code: "F17.210", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Nicotine dependence, cigarettes, uncomplicated", status: "active", onsetDate: "1975-01-01" },
      ],
      medications: [],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 136, unit: "mmHg", effectiveDate: "2026-05-13", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 80, unit: "mmHg", effectiveDate: "2026-05-13", category: "vital-signs" },
      ],
      allergies: [],
    },
  },
  {
    id: "pulm-1300",
    time: "1:00 PM",
    name: "Hector Vassilakis",
    age: "62",
    sex: "M",
    visitType: "Follow Up",
    context: "asthma + T2DM 6mo",
    isPostHospital: false,
    briefingId: "pulm-routine-6mo-vassilakis",
    bundle: {
      conditions: [
        { code: "J45.40", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Moderate persistent asthma, uncomplicated", status: "active", onsetDate: "2009-04-22" },
        { code: "E11.9", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Type 2 diabetes mellitus without complications", status: "active", onsetDate: "2019-06-10" },
      ],
      medications: [
        { rxnormCode: "6809", name: "metformin 1000 MG Oral Tablet", genericName: "metformin", dose: "1000 mg twice daily", route: "oral", status: "active", prescribedDate: "2019-06-14" },
      ],
      observations: [
        { loincCode: "4548-4", display: "Hemoglobin A1c", value: 7.9, unit: "%", effectiveDate: "2026-05-09", category: "laboratory" },
        { loincCode: "2089-1", display: "LDL cholesterol", value: 138, unit: "mg/dL", effectiveDate: "2026-05-09", category: "laboratory" },
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 130, unit: "mmHg", effectiveDate: "2026-05-09", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 80, unit: "mmHg", effectiveDate: "2026-05-09", category: "vital-signs" },
      ],
      allergies: [],
    },
  },
  {
    id: "pulm-1420",
    time: "2:20 PM",
    name: "Frederick Asante",
    age: "68",
    sex: "M",
    visitType: "Follow Up",
    context: "lung CA post-treatment",
    isPostHospital: false,
    briefingId: "pulm-lung-ca-followup",
    bundle: {
      conditions: [
        { code: "Z85.118", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Personal history of malignant neoplasm of bronchus and lung", status: "active", onsetDate: "2024-02-20" },
        { code: "I10", codeSystem: "http://hl7.org/fhir/sid/icd-10-cm", display: "Essential (primary) hypertension", status: "active", onsetDate: "2014-09-12" },
      ],
      medications: [
        { rxnormCode: "29046", name: "lisinopril 10 MG Oral Tablet", genericName: "lisinopril", dose: "10 mg daily", route: "oral", status: "active", prescribedDate: "2014-09-15" },
      ],
      observations: [
        { loincCode: "8480-6", display: "Systolic blood pressure", value: 128, unit: "mmHg", effectiveDate: "2026-05-10", category: "vital-signs" },
        { loincCode: "8462-4", display: "Diastolic blood pressure", value: 78, unit: "mmHg", effectiveDate: "2026-05-10", category: "vital-signs" },
      ],
      allergies: [],
    },
  },
];

export default PULMONOLOGY_SCHEDULE;
