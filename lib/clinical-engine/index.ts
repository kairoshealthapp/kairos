// ============================================================
// Kairos Clinical Engine — public barrel
// ============================================================

export * from './types';
export * from './normalize';
export {
  gdmtHfrefRule,
  HFREF_CONDITION_CODES,
  GDMT_PILLARS,
  GDMT_BB_RXCUIS,
  GDMT_BB_GENERIC_NAMES,
  GDMT_BB_NON_EVIDENCE_BASED,
  GDMT_PILLAR_1_RXCUIS,
  GDMT_PILLAR_1_GENERIC_NAMES,
  CONTRAINDICATION_THRESHOLDS,
  EGFR_LOINC_CODES,
} from './rules/gdmt-hfref';
export {
  lpaScreeningRule,
  LPA_LOINC_CODES,
  LPA_ADULT_AGE_THRESHOLD,
} from './rules/lp-a-screening';
export {
  nsaidHfInteractionRule,
  NSAID_RXCUIS,
  NSAID_RXCUI_SET,
  NSAID_GENERIC_NAMES,
} from './rules/nsaid-hf-interaction';
export {
  apoBMeasurementRule,
  APOB_LOINC_CODES,
  LDL_LOINC_CODES,
  TG_LOINC_CODES,
  APOB_LDL_AT_GOAL_THRESHOLD,
  APOB_TG_ELEVATED_THRESHOLD,
  APOB_ADULT_AGE_THRESHOLD,
} from './rules/apo-b-measurement';
export {
  statinInitiationRule,
  STATIN_RXCUIS,
  STATIN_RXCUI_SET,
  STATIN_GENERIC_NAMES,
  STATIN_LDL_LOINC_CODES,
  STATIN_LDL_SEVERE_THRESHOLD,
  STATIN_DIABETES_AGE_MIN,
  STATIN_DIABETES_AGE_MAX,
} from './rules/statin-initiation';
export {
  afibAnticoagulationRule,
  calculateChaDsVasc,
  AFIB_ICD_CODES,
  ANTICOAGULANT_RXCUIS,
  ANTICOAGULANT_RXCUI_SET,
  ANTICOAGULANT_GENERIC_NAMES,
  CHADSVASC_HF_CODES,
  CHADSVASC_MALE_THRESHOLD,
  CHADSVASC_FEMALE_THRESHOLD,
} from './rules/afib-anticoagulation';
export {
  postMiBetaBlockerRule,
  getMostRecentMi,
  isWithinPostMiWindow,
  POST_MI_BB_TIMEFRAME_MONTHS,
} from './rules/post-mi-beta-blocker';
export {
  postMiAceiArbRule,
  POST_MI_ACEI_TIMEFRAME_MONTHS,
  POST_MI_ACEI_LVEF_HIGH_RISK_THRESHOLD,
} from './rules/post-mi-acei-arb';
export {
  t2dmSglt2iCkdRule,
  detectCkd,
  T2DM_CONDITION_CODE_PREFIX,
  UACR_LOINC_CODES,
  T2DM_CKD_SGLT2I_RXCUIS,
  T2DM_CKD_SGLT2I_RXCUI_SET,
  T2DM_CKD_SGLT2I_GENERIC_NAMES,
  T2DM_CKD_EGFR_CKD_LOWER,
  T2DM_CKD_EGFR_CKD_UPPER,
  T2DM_CKD_UACR_ELEVATED_THRESHOLD,
} from './rules/t2dm-sglt2i-ckd';
export {
  t2dmStatinRule,
  T2DM_STATIN_AGE_MIN,
  T2DM_STATIN_AGE_MAX,
} from './rules/t2dm-statin';
export {
  hfpefSglt2iRule,
  HFPEF_CONDITION_CODES,
  ANY_HF_CONDITION_CODES,
  LVEF_LOINC_CODES,
  HFPEF_LVEF_THRESHOLD,
  SGLT2I_RXCUIS,
  SGLT2I_RXCUI_SET,
  SGLT2I_GENERIC_NAMES,
  SGLT2I_EGFR_CONTRAINDICATION_THRESHOLD,
  T1DM_CONDITION_CODE_PREFIX,
} from './rules/hfpef-sglt2i';

// ── Phase 3 (Session 53) — Family Practice, Internal Medicine, Pulmonology ──
export {
  cbpHypertensionControlRule,
  CBP_HTN_ICD_PREFIXES,
  CBP_AGE_MIN,
  CBP_AGE_MAX,
  CBP_RECENCY_MONTHS,
  CBP_SYSTOLIC_THRESHOLD,
  CBP_DIASTOLIC_THRESHOLD,
  CBP_BP_PANEL_LOINC,
  CBP_SYSTOLIC_LOINC,
  CBP_DIASTOLIC_LOINC,
} from './rules/cbp-hypertension-control';
export {
  gsdGlycemicStatusRule,
  GSD_DM_ICD_PREFIXES,
  GSD_AGE_MIN,
  GSD_RECENCY_MONTHS,
  GSD_A1C_POOR_CONTROL_THRESHOLD,
  GSD_A1C_LOINC,
} from './rules/gsd-glycemic-status';
export {
  colColorectalScreeningRule,
  COL_AGE_MIN,
  COL_AGE_MAX,
  COL_FIT_FOBT_LOINC_CODES,
  COL_COLOGUARD_LOINC_CODES,
  COL_RECENCY_MONTHS,
  COL_TOTAL_COLECTOMY_ICD_PREFIXES,
} from './rules/col-e-colorectal-screening';
export {
  bcsBreastScreeningRule,
  BCS_AGE_MIN,
  BCS_AGE_MAX,
  BCS_RECENCY_MONTHS,
  BCS_MAMMOGRAPHY_LOINC_CODES,
  BCS_BILATERAL_MASTECTOMY_ICD_PREFIXES,
} from './rules/bcs-e-breast-screening';
export {
  ckdAceiArbRule,
  CKD_HTN_ICD_PREFIXES,
  CKD_ACEI_ARB_AGE_MIN,
} from './rules/ckd-acei-arb';
export {
  aisAdultImmunizationRule,
  AIS_AGE_MIN,
  AIS_FLU_CVX,
  AIS_TDAP_CVX,
  AIS_PNEUMOCOCCAL_CVX,
  AIS_ZOSTER_CVX,
  AIS_COVID_CVX,
  AIS_ZOSTER_AGE_MIN,
  AIS_PNEUMOCOCCAL_AGE_MIN,
  AIS_COVID_AGE_MIN,
  AIS_PNEUMO_HIGH_RISK_ICD_PREFIXES,
} from './rules/ais-e-adult-immunization';
export {
  osteoporosisScreeningRule,
  OSTEO_WOMEN_AGE_MIN,
  OSTEO_MEN_AGE_MIN,
  OSTEO_RECENCY_MONTHS,
  OSTEO_DEXA_LOINC_CODES,
  OSTEO_DIAGNOSIS_ICD_PREFIXES,
} from './rules/osteoporosis-screening';
export {
  depressionScreeningRule,
  DEPRESSION_AGE_MIN,
  DEPRESSION_RECENCY_MONTHS,
  DEPRESSION_PHQ2_POSITIVE_THRESHOLD,
  DEPRESSION_PHQ2_LOINC,
  DEPRESSION_PHQ9_LOINC,
} from './rules/depression-screening';
export {
  copdGoldAbeRule,
  classifyGold,
  COPD_ICD_PREFIX,
  COPD_LAMA_GENERIC_NAMES,
  COPD_LABA_GENERIC_NAMES,
  COPD_ICS_GENERIC_NAMES,
  COPD_SABA_GENERIC_NAMES,
  COPD_EXACERBATION_E_GROUP_THRESHOLD,
  COPD_EOS_ICS_THRESHOLD,
} from './rules/copd-gold-abe';
export {
  asthmaControllerRule,
  ASTHMA_ICD_PREFIX,
  ASTHMA_EXACERBATION_WINDOW_MONTHS,
} from './rules/asthma-controller';
export {
  lscLungCancerScreeningRule,
  LSC_AGE_MIN,
  LSC_AGE_MAX,
  LSC_PACK_YEARS_THRESHOLD,
  LSC_QUIT_WINDOW_YEARS,
  LSC_SMOKING_STATUS_LOINC,
  LSC_PACK_YEARS_LOINC,
  LSC_QUIT_DATE_LOINC,
} from './rules/lsc-lung-cancer-screening';
export {
  tscTobaccoCessationRule,
  TSC_AGE_MIN,
  TSC_RECENCY_MONTHS,
  TSC_SMOKING_STATUS_LOINC,
  TSC_COUNSELING_DISPLAY_TOKENS,
  TSC_PHARMACOTHERAPY_GENERICS,
} from './rules/tsc-e-tobacco-cessation';
