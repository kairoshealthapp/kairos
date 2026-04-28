// Shared drug-name → generic + drug-class lookup. Extracted in v5 from the
// v4 protocol applier because the med-rec engine needs the same primitives
// plus broader class coverage (SSRI, PPI, etc).
//
// Production swap point: an RxNorm class hierarchy lookup. v5 uses a
// hardcoded map for ~50 common drugs across cardiology, psych, and PCP
// territory.

const DRUG_CLASS_MAP = {
  // beta blockers
  metoprolol: "beta_blocker",
  atenolol: "beta_blocker",
  carvedilol: "beta_blocker",
  bisoprolol: "beta_blocker",
  propranolol: "beta_blocker",
  nadolol: "beta_blocker",
  labetalol: "beta_blocker",
  // CCB non-DHP
  diltiazem: "ccb_non_dhp",
  verapamil: "ccb_non_dhp",
  // CCB DHP
  amlodipine: "ccb_dhp",
  nifedipine: "ccb_dhp",
  // central alpha agonists
  clonidine: "central_alpha_agonist",
  methyldopa: "central_alpha_agonist",
  guanfacine: "central_alpha_agonist",
  // ACE / ARB
  lisinopril: "ace_inhibitor",
  enalapril: "ace_inhibitor",
  ramipril: "ace_inhibitor",
  losartan: "arb",
  valsartan: "arb",
  irbesartan: "arb",
  // diuretics
  furosemide: "loop_diuretic",
  bumetanide: "loop_diuretic",
  hydrochlorothiazide: "thiazide",
  chlorthalidone: "thiazide",
  spironolactone: "potassium_sparing_diuretic",
  // statins
  atorvastatin: "statin",
  rosuvastatin: "statin",
  simvastatin: "statin",
  pravastatin: "statin",
  lovastatin: "statin",
  // PCSK9
  evolocumab: "pcsk9_inhibitor",
  alirocumab: "pcsk9_inhibitor",
  // antiplatelets
  aspirin: "antiplatelet",
  clopidogrel: "antiplatelet",
  ticagrelor: "antiplatelet",
  prasugrel: "antiplatelet",
  // anticoagulants
  warfarin: "anticoagulant",
  apixaban: "anticoagulant",
  rivaroxaban: "anticoagulant",
  dabigatran: "anticoagulant",
  edoxaban: "anticoagulant",
  // thyroid
  levothyroxine: "thyroid_hormone",
  // antidiabetics
  metformin: "biguanide",
  glipizide: "sulfonylurea",
  glyburide: "sulfonylurea",
  glimepiride: "sulfonylurea",
  empagliflozin: "sglt2_inhibitor",
  dapagliflozin: "sglt2_inhibitor",
  canagliflozin: "sglt2_inhibitor",
  insulin: "insulin",
  // SSRI / SNRI
  sertraline: "ssri",
  citalopram: "ssri",
  escitalopram: "ssri",
  fluoxetine: "ssri",
  paroxetine: "ssri",
  duloxetine: "snri",
  venlafaxine: "snri",
  // PPI / H2
  pantoprazole: "ppi",
  omeprazole: "ppi",
  esomeprazole: "ppi",
  lansoprazole: "ppi",
  famotidine: "h2_blocker",
  ranitidine: "h2_blocker",
  // analgesics
  acetaminophen: "analgesic_apap",
  ibuprofen: "nsaid",
  naproxen: "nsaid",
  meloxicam: "nsaid",
  celecoxib: "nsaid",
  // opioids
  tramadol: "opioid",
  oxycodone: "opioid",
  hydrocodone: "opioid",
  morphine: "opioid",
  fentanyl: "opioid",
  // benzos
  alprazolam: "benzodiazepine",
  lorazepam: "benzodiazepine",
  clonazepam: "benzodiazepine",
  diazepam: "benzodiazepine",
  // gabapentinoids
  gabapentin: "gabapentinoid",
  pregabalin: "gabapentinoid",
  // sleep
  trazodone: "atypical_antidepressant",
  zolpidem: "z_drug",
  // supplements / OTC
  vitamin: "supplement",
  vitamind: "supplement",
  vitaminb12: "supplement",
  calcium: "supplement",
  magnesium: "supplement",
  fish_oil: "supplement",
  omega3: "supplement",
  turmeric: "supplement",
  melatonin: "supplement",
  coq10: "supplement",
};

const DRUG_ALIASES = {
  asa: "aspirin",
  toprol: "metoprolol",
  "toprol-xl": "metoprolol",
  lopressor: "metoprolol",
  coreg: "carvedilol",
  tenormin: "atenolol",
  zestril: "lisinopril",
  prinivil: "lisinopril",
  cozaar: "losartan",
  diovan: "valsartan",
  norvasc: "amlodipine",
  cardizem: "diltiazem",
  calan: "verapamil",
  catapres: "clonidine",
  aldomet: "methyldopa",
  intuniv: "guanfacine",
  lasix: "furosemide",
  bumex: "bumetanide",
  hctz: "hydrochlorothiazide",
  microzide: "hydrochlorothiazide",
  aldactone: "spironolactone",
  lipitor: "atorvastatin",
  crestor: "rosuvastatin",
  zocor: "simvastatin",
  pravachol: "pravastatin",
  plavix: "clopidogrel",
  brilinta: "ticagrelor",
  effient: "prasugrel",
  coumadin: "warfarin",
  jantoven: "warfarin",
  eliquis: "apixaban",
  xarelto: "rivaroxaban",
  pradaxa: "dabigatran",
  savaysa: "edoxaban",
  synthroid: "levothyroxine",
  levoxyl: "levothyroxine",
  glucophage: "metformin",
  glucotrol: "glipizide",
  jardiance: "empagliflozin",
  farxiga: "dapagliflozin",
  invokana: "canagliflozin",
  zoloft: "sertraline",
  celexa: "citalopram",
  lexapro: "escitalopram",
  prozac: "fluoxetine",
  paxil: "paroxetine",
  cymbalta: "duloxetine",
  effexor: "venlafaxine",
  protonix: "pantoprazole",
  prilosec: "omeprazole",
  nexium: "esomeprazole",
  prevacid: "lansoprazole",
  pepcid: "famotidine",
  zantac: "ranitidine",
  tylenol: "acetaminophen",
  apap: "acetaminophen",
  motrin: "ibuprofen",
  advil: "ibuprofen",
  aleve: "naproxen",
  mobic: "meloxicam",
  celebrex: "celecoxib",
  ultram: "tramadol",
  oxy: "oxycodone",
  oxycontin: "oxycodone",
  norco: "hydrocodone",
  vicodin: "hydrocodone",
  msir: "morphine",
  duragesic: "fentanyl",
  xanax: "alprazolam",
  ativan: "lorazepam",
  klonopin: "clonazepam",
  valium: "diazepam",
  neurontin: "gabapentin",
  lyrica: "pregabalin",
  desyrel: "trazodone",
  ambien: "zolpidem",
  repatha: "evolocumab",
  praluent: "alirocumab",
  // OTC / supplement common names — single tokens we'll see in patient self-reports
  d3: "vitamind",
  cholecalciferol: "vitamind",
  b12: "vitaminb12",
  cyanocobalamin: "vitaminb12",
  fishoil: "fish_oil",
  curcumin: "turmeric",
};

// Multi-word phrase aliases — checked before single-token tokenization. Keys
// are lowercased phrases; values are the canonical generic.
const PHRASE_ALIASES = [
  { pattern: /vitamin\s*d(?:\s*\d+)?/i, generic: "vitamind" },
  { pattern: /vitamin\s*b\s*12/i, generic: "vitaminb12" },
  { pattern: /fish\s*oil/i, generic: "fish_oil" },
  { pattern: /omega\s*-?\s*3/i, generic: "omega3" },
  { pattern: /turmeric(?:\s+capsule)?/i, generic: "turmeric" },
  { pattern: /baby\s*aspirin/i, generic: "aspirin" },
];

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .match(/[a-z][a-z0-9-]*/g) || [];
}

export function extractGenericFromText(text) {
  if (!text) return null;
  for (const { pattern, generic } of PHRASE_ALIASES) {
    if (pattern.test(text)) return generic;
  }
  const tokens = tokenize(text);
  for (const t of tokens) {
    if (DRUG_CLASS_MAP[t]) return t;
    if (DRUG_ALIASES[t]) return DRUG_ALIASES[t];
  }
  return null;
}

export function getDrugClass(generic) {
  if (!generic) return null;
  return DRUG_CLASS_MAP[generic] || null;
}

export function getDrugClassMap() {
  return DRUG_CLASS_MAP;
}
