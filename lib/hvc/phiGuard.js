// ============================================
// SERVER-SIDE PHI GUARD
// app/lib/phiGuard.js
//
// Shared module imported by all API routes.
// Runs BEFORE data reaches Claude or Supabase.
// ============================================

// --- Staff Names (preserved, never scrubbed) ---
const STAFF_NAMES = new Set([
  'Abby','Abebe','Abraman','Alan','Alec','Aleto','Ali','Allen',
  'Allison','Almasalmeh','Alvarado','Amar','Ameer','Andrea','Andrew','Angie',
  'Anita','Anooj','April','Ariella','Armstrong','Arun','Athina','Bach',
  'Baiter','Baker','Ballard','Barbie','Barton','Batchu','Bauer','Bayless',
  'Becerril','Becky','Blanc','Bland','Bohdan','Bourne','Brady','Brandon',
  'Brawley','Brett','Brian','Britt','Brittany','Bryan','Buschman','Candace',
  'Candy','Chafton','Chakinala','Chris','Christopher','Clayton','Coble','Cooper',
  'Coulter','Courtney','Cowell','Craig','Crawshaw','Crystal','Cuculich','Curtis',
  'Dan','Dana','David','Davis','Derrick','Deveney','Donni','Donny',
  'Durbin','Efstratiadis','Elliotte','Emily','Emmett','Faddis','Fawad','Feeler',
  'Fern','Field','Fleener','Floyd','Freeman','French','Fryer','Fulton',
  'Garner','Garrison','Gautam','Gdowski','Gifford','Glenn','Gorrell','Harden',
  'Harman','Hartog','Hartupee','Headrick','Heincker','Huang','Huckla','Hurley',
  'Indrajeet','Jason','Jasvindar','Jennifer','Jenny','Jeremy','Jinna','Joel',
  'John','Johnson','Jonas','Jordan','Jose','Joshua','Justin','Kan',
  'Kaneko','Kao','Karen','Karuparthia','Katie','Kelsey','Knetzer','Knobbe',
  'Knox','Kriete','Krishnaswamy','Kristen','Kristin','Kunkel','Lamberth','Larry',
  'Lasala','Lebedowicz','Lee','Leidenfost','Leidenfrost','Leon','Lisenbe','Logan',
  'Luis','Lynn','Maedgen','Mahata','Marc','Marcee','Marina','Mark',
  'Martin','Masood','Matt','Matthew','Mazzeo','McBride','Megan','Melissa',
  'Mella','Michael','Michele','Miriam','Mitchell','Moore','Moravec','Morrison',
  'Moshirzadeh','Mueen','Muhammad','Murr','Myers','Mylhan','Nasser','Nathan',
  'Nichole','Nikolaos','Nurelign',"O'Malley",'Oak','Orizu','Paige','Pajeau',
  'Patel','Patricia','Patrick','Paula','Pearson','Pecos','Peterson','Phillips',
  'Phinney','Phippen','Potter','Prabhu','Priest','Qamar','Rachel','Rachelle',
  'Ratchford','Rebecca','Reidy','Reiss','Richard','Robert','Ronald','Rosa',
  'Roshan','Rowden','Rusten','Saba','Sadler','Salli','Sanchez','Sandra',
  'Sara','Sasan','Schlesinger','Schroeder','Seeck','Shams','Shang','Shapiro',
  'Shawna','Sherry','Shockley','Shruti','Singh','Sinha','Sintek','Soberano',
  'Speck','Spencer','Stacie','Sterne','Steve','Steven','Stilianos','Sudhir',
  'Susan','Swanson','Sydney','Syed','Sylvester','Tasha','Terrance','Terrill',
  'Thompson','Tiffany','Toebben','Tony','Trikalinos','Ulrich','Vader','Victor',
  'Virk','Voight','Vorhies','Waterworth','Watkins','Wes','Wiggins','William',
  'Wilson','Wiseman','Witham','Yaqoob','Youlo','Zahoor','Zajarias','Zak',
  'Zaman','Zhu',
  'Mikayla','Larison','Travis','Duke','Saltzman','Mia','Seelig',
  'Missie','Jenkins','Kim','Roach','Samantha','Miller',
  'Elizabeth','Oyadomari','Dvorak','Amanda','McEntire','Ashley','Hoener',
  'Paula','Steve','Sterne','Virk','Stilianos',
]);

// --- Medical credentials that mark safe name ranges ---
const STAFF_TITLE_PATTERNS = [
  'Dr\\.', 'MD', 'DO', 'NP', 'ARNP', 'ANP', 'ANP-BC', 'FNP', 'FNP-C', 'FNP-BC',
  'CPNP', 'AOCNP', 'AGPCNP-BC', 'DNP', 'CNM', 'RN', 'BSN', 'LPN', 'CNA',
  'PA', 'PA-C', 'DPM', 'AuD', 'PhD', 'PharmD', 'RPh', 'RT', 'MA', 'CMA',
];

const staffTitleRegex = new RegExp(
  '(?:' + STAFF_TITLE_PATTERNS.join('|') + ')\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?', 'g'
);

// --- Clinical words that should NEVER be flagged as names ---
const CLINICAL_WORDS = new Set([
  'Normal','Stable','Negative','Positive','Active','Chronic','Acute','Mild',
  'Moderate','Severe','Left','Right','Upper','Lower','Complete','Partial',
  'Daily','Weekly','Monthly','History','Today','Yesterday','States','Reports',
  'Denies','Admits','Called','Telephone','Office','Home','Pending','Scheduled',
  'Ordered','Reviewed','Discussed','Continued','Discontinued','Increased',
  'Decreased','Started','Stopped','Recommended','Performed','Obtained',
  'Received','Confirmed','Notified','Advised','Instructed','Elevated',
  'Improved','Worsening','Unchanged','Resolved','Present','Absent','Bilateral',
  'Previous','Current','Recent','Follow','Prior','Known','New','Being','Seen',
  'Given','Told','Sent','Noted','Using','Taking','Having','Getting','Feeling',
  'Doing','Going','Coming','Sitting','Standing','Walking','Sleeping','Eating',
  'Drinking','Breathing','Living','Caring','Calling','Asking','Saying',
  'Reporting','Presenting','Requesting','Requiring','Needing','Showing',
  'Indicating','Demonstrating','Exhibiting','Tolerating','Managing',
  'Controlling','Maintaining','Experiencing','Describing','Complaining',
  'Endorsing','Expressing','Appearing','Looking','Seeming','Remaining',
  'Returning','Visiting','Attending','Arriving','Leaving','Staying','Resting',
  'Recovering',
  // Medical terms that look like names
  'Cardiac','Cardiology','Coronary','Atrial','Ventricular','Aortic','Mitral',
  'Tricuspid','Pulmonary','Systolic','Diastolic','Sinus','Rhythm','Ablation',
  'Catheterization','Echocardiogram','Stress','Nuclear','Holter','Monitor',
  'Pacemaker','Defibrillator','Stent','Bypass','Valve','Murmur','Stenosis',
  'Regurgitation','Insufficiency','Fibrillation','Flutter','Tachycardia',
  'Bradycardia','Hypertension','Hypotension','Angina','Infarction','Ischemia',
  'Heart','Failure','Ejection','Fraction','Warfarin','Coumadin','Heparin',
  'Aspirin','Plavix','Eliquis','Xarelto','Metoprolol','Lisinopril','Losartan',
  'Amlodipine','Atorvastatin','Rosuvastatin','Furosemide','Spironolactone',
  'Digoxin','Amiodarone','Diltiazem','Verapamil','Entresto','Jardiance',
  'Farxiga','Carvedilol','Hydralazine','Isosorbide','Nitrate',
  // Facility/location terms
  'Phelps','Health','Hospital','Clinic','Emergency','Department','Floor',
  'Unit','Room','Suite','Medical','Surgical','Intensive','Care','Outpatient',
  'Inpatient','Discharge','Admission','Transfer','Referral','Consultation',
  'Barnes','Jewish','Washington','University','Mercy','Missouri','Rolla',
  'Springfield','Columbia','Saint','Louis',
  // Lab/test names that look like proper nouns
  'Fisher','Weber','Doppler','Holter','Gram','French',
  // Cardiology abbreviations that must not be flagged
  'PVC','PVCs','PAC','PACs',
  // Common clinical abbreviations used at start of lines
  'Assessment','Plan','Subjective','Objective','Impression','Recommendation',
  'Diagnosis','Problem','Medication','Allergy','Vital','Sign','Lab','Result',
  'Imaging','Procedure','Test','Study','Report','Note','Chart','Record',
  // Temporal/contextual words
  'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday',
  'January','February','March','April','May','June','July','August',
  'September','October','November','December','Spring','Summer','Fall','Winter',
  'Morning','Afternoon','Evening','Night',
]);

// Short words that are never names
const SHORT_WORDS = new Set([
  'he','she','her','him','his','they','them','their','the','this','that','was',
  'has','had','who','will','may','can','per','for','with','from','into','over',
  'out','not','but','all','any','our','its','are','were','been','have','does',
  'did','than','then','also','very','just','only','more','most','some','such',
  'each','both','few','own','same','well','back','even','here','when','what',
  'how','why','too','now','new','old','one','two','use','way','day','got','let',
  'say','see','get','set','put','run','try','ask','end','yet','due','ago','via',
  'non','pre','sub','and','nor','so',
]);

// Street types for address detection
const STREET_TYPES = 'St(?:reet)?|Ave(?:nue)?|Blvd|Boulevard|Dr(?:ive)?|Ln|Lane|Ct|Court|Way|Pl(?:ace)?|Rd|Road|Cir(?:cle)?|Hwy|Highway|Pike|Trail|Tr|Terr(?:ace)?|Loop|Run|Path|Row|Pkwy|Parkway|Pass|Cove|Ridge|Crossing|Xing';

// ============================================
// CORE SCANNING FUNCTION
// ============================================

function scanForPHI(text) {
  if (!text || text.trim().length === 0) return [];

  const findings = [];
  let m;

  // --- Build safe ranges AND extract credentialed names ---
  // Names preceded by Dr., MD, DO, etc. are safe EVERYWHERE in the text,
  // not just at the position where the credential appears.
  // This ensures that if Brandon provides "Dr. Schmuckitelli" the name
  // passes through even when repeated without the "Dr." prefix.
  const safeRanges = [];
  const dynamicSafeNames = new Set();
  const tc = new RegExp(staffTitleRegex.source, 'gi');
  while ((m = tc.exec(text)) !== null) {
    safeRanges.push({ start: m.index, end: m.index + m[0].length });
    // Extract the name parts (after the credential) and add to safe set
    var nameOnly = m[0].replace(/^(?:Dr\.|MD|DO|NP|ARNP|ANP|ANP-BC|FNP|FNP-C|FNP-BC|CPNP|AOCNP|AGPCNP-BC|DNP|CNM|RN|BSN|LPN|CNA|PA|PA-C|DPM|AuD|PhD|PharmD|RPh|RT|MA|CMA)\s+/i, '').trim();
    if (nameOnly) {
      nameOnly.split(/\s+/).forEach(function(p) {
        if (p.length >= 3) dynamicSafeNames.add(p);
      });
    }
  }

  const isSafe = (s, e) => safeRanges.some(r => s >= r.start && e <= r.end);

  const isStaffName = (name) => {
    const parts = name.trim().split(/\s+/);
    return parts.some(p => {
      const cap = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
      return STAFF_NAMES.has(p) || STAFF_NAMES.has(cap) || dynamicSafeNames.has(p) || dynamicSafeNames.has(cap);
    });
  };

  const isClinicalWord = (word) => {
    if (!word) return false;
    const cap = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    return CLINICAL_WORDS.has(word) || CLINICAL_WORDS.has(cap) || SHORT_WORDS.has(word.toLowerCase());
  };

  // ==========================================
  // PATTERN 1: Honorific + Name (existing)
  // Mr./Mrs./Ms./Miss + Name (3+ chars)
  // NOTE: Honorific is strong enough signal that
  // the name can be lowercase ("mrs smith").
  // Prefix handles case via [Mm].
  // ==========================================
  const pnr = /\b([Mm]rs?\.?|[Mm]s\.?|[Mm]iss)\s+([A-Za-z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})?)\b/g;
  while ((m = pnr.exec(text)) !== null) {
    if (!isSafe(m.index, m.index + m[0].length) && !isStaffName(m[2]) && !isClinicalWord(m[2])) {
      findings.push({ type: 'name', match: m[0], start: m.index, end: m.index + m[0].length, replacement: '[Patient/Family Name]' });
    }
  }

  // ==========================================
  // PATTERN 2: Family context + Name (existing)
  // daughter/son/wife etc + Capitalized Name
  // NOTE: Case-insensitive on the prefix word only.
  // Name capture REQUIRES uppercase first letter.
  // ==========================================
  const fcr = /\b(?:[Dd]aughter|[Ss]on|[Ww]ife|[Hh]usband|[Ss]pouse|[Mm]other|[Ff]ather|[Ss]ister|[Bb]rother|[Cc]aregiver|[Gg]uardian|[Ff]riend|[Nn]eighbor|[Pp]artner|[Ff]iancee?|[Uu]ncle|[Aa]unt|[Gg]randson|[Gg]randdaughter|[Gg]randmother|[Gg]randfather|[Nn]ephew|[Nn]iece|[Cc]ousin|[Ii]n-law)\s+([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})?)\b/g;
  while ((m = fcr.exec(text)) !== null) {
    const nm = m[1];
    if (!isSafe(m.index, m.index + m[0].length) && !isStaffName(nm) && !isClinicalWord(nm)) {
      findings.push({ type: 'name', match: nm, start: m.index + m[0].length - nm.length, end: m.index + m[0].length, replacement: '[Name]' });
    }
  }

  // ==========================================
  // PATTERN 3: Patient-context + Name (NEW)
  // "Patient John Smith", "Pt Smith", "called Smith"
  // "spoke with Smith", "notified Smith"
  // NOTE: Prefix is case-insensitive via alternation.
  // Name capture REQUIRES uppercase first letter.
  // ==========================================
  const patientContextPrefixes = /\b(?:[Pp]atient|[Pp]t\.?|[Cc]alled|[Cc]ontacted|[Ss]poke\s+(?:with|to)|[Nn]otified|[Ii]nformed|[Aa]dvised|[Ii]nstructed|[Cc]ounseled|[Ee]ducated|[Dd]iscussed\s+with|[Rr]eviewed\s+with|[Ee]xplained\s+to)\s+([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})?)\b/g;
  while ((m = patientContextPrefixes.exec(text)) !== null) {
    const nm = m[1];
    if (!isStaffName(nm) && !isClinicalWord(nm)) {
      findings.push({ type: 'name', match: nm, start: m.index + m[0].length - nm.length, end: m.index + m[0].length, replacement: '[Patient Name]' });
    }
  }

  // ==========================================
  // PATTERN 4: Phone numbers — REMOVED
  // Phone numbers are needed in clinical workflows
  // (callback numbers, pharmacy, clinic lines)
  // ==========================================

  // ==========================================
  // PATTERN 5: DOB with context (existing)
  // MM/DD/YYYY near "dob", "date of birth", etc.
  // ==========================================
  const dobr = /\b(0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g;
  while ((m = dobr.exec(text)) !== null) {
    const before = text.substring(Math.max(0, m.index - 40), m.index).toLowerCase();
    if (before.includes('dob') || before.includes('date of birth') || before.includes('born') || before.includes('birthday') || before.includes('d.o.b') || before.includes('birth date')) {
      findings.push({ type: 'dob', match: m[0], start: m.index, end: m.index + m[0].length, replacement: '[DOB]' });
    }
  }

  // ==========================================
  // PATTERN 6: Dates that look like birthdates (NEW)
  // Any MM/DD/YYYY where year is 1920-2010
  // (plausible patient birth years) NOT near
  // clinical date context like "seen on", "visit"
  // ==========================================
  const birthDateR = /\b(0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])[\/\-](19[2-9]\d|200\d|201[0-5])\b/g;
  while ((m = birthDateR.exec(text)) !== null) {
    // Skip if already caught by DOB pattern above
    const alreadyCaught = findings.some(f => m.index >= f.start && m.index < f.end);
    if (alreadyCaught) continue;
    // Check context: is this near clinical date words? If so, skip.
    const before = text.substring(Math.max(0, m.index - 50), m.index).toLowerCase();
    const after = text.substring(m.index + m[0].length, Math.min(text.length, m.index + m[0].length + 30)).toLowerCase();
    const clinicalDateContext = ['seen on', 'visit', 'encounter', 'appointment', 'admitted', 'discharged', 'ordered', 'resulted', 'performed', 'collected', 'specimen', 'report date', 'service date', 'effective', 'signed'];
    const isClinicDate = clinicalDateContext.some(ctx => before.includes(ctx) || after.includes(ctx));
    if (!isClinicDate) {
      findings.push({ type: 'possible_dob', match: m[0], start: m.index, end: m.index + m[0].length, replacement: '[Date Redacted]' });
    }
  }

  // ==========================================
  // PATTERN 7: SSN (existing)
  // XXX-XX-XXXX
  // ==========================================
  const ssnr = /\b\d{3}-\d{2}-\d{4}\b/g;
  while ((m = ssnr.exec(text)) !== null) {
    // Avoid double-matching with phone numbers
    const alreadyCaught = findings.some(f => m.index >= f.start && m.index < f.end);
    if (!alreadyCaught) {
      findings.push({ type: 'ssn', match: m[0], start: m.index, end: m.index + m[0].length, replacement: '[SSN]' });
    }
  }

  // ==========================================
  // PATTERN 8: MRN (existing, expanded)
  // MRN, MR#, Medical Record, Acct#, FIN
  // ==========================================
  const mrnr = /\b(?:MRN|MR#|MR\s*#|Medical\s*Record\s*(?:Number|No\.?|#)?|Acct\s*#?|Account\s*(?:Number|No\.?|#)?|FIN|FIN\s*#?)\s*:?\s*\d{4,}\b/gi;
  while ((m = mrnr.exec(text)) !== null) {
    findings.push({ type: 'mrn', match: m[0], start: m.index, end: m.index + m[0].length, replacement: '[MRN/Account]' });
  }

  // ==========================================
  // PATTERN 9: Email addresses (NEW)
  // ==========================================
  const emailR = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g;
  while ((m = emailR.exec(text)) !== null) {
    findings.push({ type: 'email', match: m[0], start: m.index, end: m.index + m[0].length, replacement: '[Email]' });
  }

  // ==========================================
  // PATTERN 10: Street addresses (NEW)
  // Number + Street Name + Street Type
  // Optional: City, State ZIP
  // ==========================================
  const addrR = new RegExp(
    '\\b(\\d{1,6})\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)?)\\s+(?:' + STREET_TYPES + ')\\b' +
    '(?:[,.]?\\s+[A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)?)?(?:[,.]?\\s+[A-Z]{2})?(?:\\s+\\d{5}(?:-\\d{4})?)?',
    'gi'
  );
  while ((m = addrR.exec(text)) !== null) {
    findings.push({ type: 'address', match: m[0], start: m.index, end: m.index + m[0].length, replacement: '[Address]' });
  }

  // ==========================================
  // PATTERN 11: ZIP codes near address context (NEW)
  // 5-digit or 5+4 ZIP codes near state abbreviations
  // ==========================================
  const zipR = /\b[A-Z]{2}\s+(\d{5}(?:-\d{4})?)\b/g;
  while ((m = zipR.exec(text)) !== null) {
    const alreadyCaught = findings.some(f => m.index >= f.start && m.index + m[0].length <= f.end);
    if (!alreadyCaught) {
      findings.push({ type: 'zip', match: m[0], start: m.index, end: m.index + m[0].length, replacement: '[Location]' });
    }
  }

  // ==========================================
  // PATTERN 12: Insurance identifiers (NEW)
  // Policy#, Member ID, Group#, Subscriber ID
  // ==========================================
  const insR = /\b(?:Policy|Member\s*ID|Group|Subscriber\s*ID|Insurance\s*ID|Ins\s*ID|Plan\s*ID|Claim|Auth(?:orization)?)\s*(?:#|No\.?|Number)?\s*:?\s*[A-Z0-9]{4,20}\b/gi;
  while ((m = insR.exec(text)) !== null) {
    findings.push({ type: 'insurance', match: m[0], start: m.index, end: m.index + m[0].length, replacement: '[Insurance ID]' });
  }

  // ==========================================
  // PATTERN 13: MyChart username / portal ID (NEW)
  // ==========================================
  const portalR = /\b(?:Portal|Username|User\s*ID|Login)\s*[:=]\s*[A-Za-z0-9._\-]{4,30}\b/gi;
  while ((m = portalR.exec(text)) !== null) {
    findings.push({ type: 'portal_id', match: m[0], start: m.index, end: m.index + m[0].length, replacement: '[Portal ID]' });
  }

  // ==========================================
  // PATTERN 14: HVC patient codes — PRESERVE
  // These are our de-identified codes. Do NOT scrub.
  // ==========================================
  // (No action — just documenting that HVC-XXXXL codes pass through intentionally)

  // --- Deduplicate: sort by position, remove overlaps ---
  findings.sort((a, b) => a.start - b.start || b.end - a.end);
  const deduped = [];
  for (const f of findings) {
    if (!deduped.some(d => f.start < d.end && f.end > d.start)) {
      deduped.push(f);
    }
  }
  return deduped;
}

// ============================================
// SCRUB FUNCTION — applies replacements
// ============================================

function scrubText(text, findings) {
  if (!findings || findings.length === 0) return text;
  const sorted = [...findings].sort((a, b) => b.start - a.start);
  let scrubbed = text;
  for (const f of sorted) {
    scrubbed = scrubbed.substring(0, f.start) + f.replacement + scrubbed.substring(f.end);
  }
  return scrubbed;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Scan text for PHI and return findings array.
 * Each finding: { type, match, start, end, replacement }
 */
export function detectPHI(text) {
  return scanForPHI(text);
}

/**
 * Scrub all PHI from text. Returns clean string.
 * This is the main function API routes should call.
 */
export function scrubPHI(text) {
  if (!text || typeof text !== 'string') return text || '';
  const findings = scanForPHI(text);
  return scrubText(text, findings);
}

/**
 * Scrub PHI from all string values in an object (recursive).
 * Useful for scrubbing the `fields` JSON before Supabase insert.
 */
export function scrubObject(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') return scrubPHI(obj);
  if (Array.isArray(obj)) return obj.map(item => scrubObject(item));
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = scrubObject(value);
    }
    return cleaned;
  }
  return obj;
}

/**
 * Scan text and return a summary for incident logging.
 * Returns { found: boolean, count: number, types: string[] }
 * Does NOT include the actual PHI values — safe for logging.
 */
export function auditPHI(text) {
  if (!text || typeof text !== 'string') return { found: false, count: 0, types: [] };
  const findings = scanForPHI(text);
  if (findings.length === 0) return { found: false, count: 0, types: [] };
  const types = [...new Set(findings.map(f => f.type))];
  return {
    found: true,
    count: findings.length,
    types,
  };
}
