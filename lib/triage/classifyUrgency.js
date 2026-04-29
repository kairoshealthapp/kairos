// Phase 3.1e — deterministic two-color urgency classifier.
// Returns "red" (emergent, needs immediate attention) or "calm" (everything else).
//
// Rules are first-pass derived from HVC's clinical knowledge base. A future
// phase wires the HVC chat route to classify cards on creation (LLM-based);
// for now, deterministic keyword + numeric-range rules are the source of
// truth for mock data and for any new card not yet classified.
//
// All matching is case-insensitive on the union of message.subject and
// message.body. Numeric labs are parsed from the same text.

const RED_KEYWORDS = /\b(urgent|stat|emergent|asap)\b/i;

// Symptom phrases that indicate a clinical emergency. Liberal on lightheaded
// presyncope phrasing because that's a known under-classified symptom.
const RED_SYMPTOMS =
  /\bchest pain|\bchest pressure|shortness of breath at rest|orthopnea|\bsyncope\b|near-syncope|near syncope|presyncope|orthostatic|stroke symptom|fast positive|severe headache|suicidal ideation|allergic reaction|anaphyl|lightheaded(?:ness)? (?:when|on) standing|standing.{0,12}lightheaded/i;

// Active bleeding / new significant symptom phrases used by INR rule.
const ACTIVE_BLEEDING =
  /active bleeding|gross bleeding|bleeding noted|easy bruising|new bruising|hematuria|melena|hematemesis|epistaxis/i;

function parseLab(text, regex) {
  const m = text.match(regex);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

// True if a negation word ("no", "denies", "without", etc.) appears in the
// preceding ~40 chars of the match index without a sentence terminator
// between them. Catches "no chest pain", "denies syncope", "No bleeding
// noted on the fax cover" — without over-stripping when a period resets.
function isNegatedAt(text, matchIndex) {
  const start = Math.max(0, matchIndex - 40);
  const before = text.slice(start, matchIndex);
  return /\b(?:no|none|denies|denied|denying|without|negative for|no signs of)\b[^.!?\n]*$/i.test(before);
}

function findUnnegated(text, regex) {
  const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
  const re = new RegExp(regex.source, flags);
  let m;
  while ((m = re.exec(text)) !== null) {
    if (!isNegatedAt(text, m.index)) return m;
  }
  return null;
}

export function classifyUrgency(card) {
  const subj = card?.message?.subject || "";
  const routing = card?.message?.epic_routing || "";
  const body = card?.message?.body || "";
  const text = (subj + " " + body).toLowerCase();

  // Rule A — explicit urgent/stat/emergent/asap in subject or routing.
  if (RED_KEYWORDS.test(subj) || RED_KEYWORDS.test(routing)) return "red";

  // Rule B — emergent chief-complaint or symptom phrase in subject or body.
  // Skip if negated ("no chest pain", "denies syncope").
  if (findUnnegated(text, RED_SYMPTOMS)) return "red";

  // Rule C — vital signs out of safe band (BP > 180/120 or < 90/60).
  // Match the FIRST plausible blood-pressure pattern. Skip values that are
  // clearly not BP (e.g. dose strings like "warfarin 7.5/2.5").
  const bp = text.match(/\b(\d{2,3})\s*\/\s*(\d{2,3})\b/);
  if (bp) {
    const sys = parseInt(bp[1], 10);
    const dia = parseInt(bp[2], 10);
    const looksLikeBP = sys >= 50 && sys <= 260 && dia >= 30 && dia <= 200;
    if (looksLikeBP) {
      if (sys > 180 || dia > 120) return "red";
      if (sys < 90 || dia < 60) return "red";
    }
  }

  // Rule D — critical labs from a NOTIFY card. Only fire when a lab name is
  // explicitly anchored, so we don't misread random numbers in the body.
  const k = parseLab(text, /(?:^|\s|\()(?:k\+?|potassium)\s*(\d+\.?\d*)/i);
  if (k !== null && (k > 5.5 || k < 3.0)) return "red";

  const na = parseLab(text, /(?:^|\s|\()(?:na\+?|sodium)\s*(\d+\.?\d*)/i);
  if (na !== null && (na > 150 || na < 130)) return "red";

  const hgb = parseLab(text, /(?:^|\s|\()(?:hgb|hb|hemoglobin)\s*(\d+\.?\d*)/i);
  if (hgb !== null && hgb < 8) return "red";

  // Rule E — INR card emergent thresholds.
  const isInrCard = card?.type === "inr" || /\binr\b/i.test(text);
  if (isInrCard) {
    const inr = parseLab(text, /\binr\s*(\d+\.?\d*)/i);
    if (inr !== null) {
      if (inr > 5.0) return "red";
      if (inr < 1.5 && /mechanical valve/i.test(text)) return "red";
    }
    if (findUnnegated(text, ACTIVE_BLEEDING)) return "red";
  }

  return "calm";
}

export default classifyUrgency;
