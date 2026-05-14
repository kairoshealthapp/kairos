// ============================================================
// Kairos Clinical Engine — Core types
//
// Architecture: rules in code, not prompts.
// Every rule is a deterministic function (PatientBundle) => Finding[].
// ============================================================

export interface PatientDemographics {
  id: string;
  name: string;
  dob?: string;
  sex?: string;
}

export interface PatientCondition {
  code: string;
  codeSystem?: string;
  display?: string;
  status?: string;
  onsetDate?: string;
}

export interface PatientMedication {
  rxnormCode?: string;
  name: string;
  genericName?: string;
  dose?: string;
  route?: string;
  status?: string;
  prescribedDate?: string;
}

export interface PatientObservation {
  loincCode?: string;
  display?: string;
  value?: number;
  unit?: string;
  effectiveDate?: string;
  category?: string;
}

export interface PatientAllergy {
  code?: string;
  display?: string;
  severity?: string;
  reactionType?: string;
}

export interface PatientBundle {
  patient: PatientDemographics;
  conditions: PatientCondition[];
  medications: PatientMedication[];
  observations: PatientObservation[];
  allergies: PatientAllergy[];
}

export type FindingSeverity = 'gap' | 'warning' | 'critical' | 'info';
export type FindingStatus =
  | 'missing'
  | 'present'
  | 'contraindicated'
  | 'non-evidence-based'
  | 'interaction'
  | 'manual-review';

export interface FindingEvidence {
  conditionsExamined?: string[];
  medicationsExamined?: string[];
  observationsExamined?: string[];
  contraindicationReason?: string;
}

export interface Finding {
  ruleId: string;
  ruleName: string;
  severity: FindingSeverity;
  category: string;
  subcategory?: string;
  status: FindingStatus;
  summary: string;
  recommendation?: string;
  evidence: FindingEvidence;
  timestamp: string;
}

export type RuleFunction = (bundle: PatientBundle) => Finding[];
