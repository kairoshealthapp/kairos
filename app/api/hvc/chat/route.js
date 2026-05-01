import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { CORE_KNOWLEDGE, REFERENCE_EPIC, REFERENCE_DIRECTORY, REFERENCE_DOSE_TIERS } from './knowledge';
import { scrubPHI, scrubObject, auditPHI } from '@/lib/hvc/phiGuard';

// Contact method resolution — deterministic preprocessing
function resolveContactMethod(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') return null;
  var lower = userMessage.toLowerCase();

  var phonePatterns = ['called', 'phoned', 'phone call', 'spoke with', 'spoke to', 'talked to', 'talked with', 'via phone', 'by phone', 'over the phone'];
  var mychartPatterns = ['mychart', 'my chart', 'messaged', 'sent message', 'via mychart', 'mc message', 'portal message'];

  var hasPhone = false;
  var hasMychart = false;

  for (var i = 0; i < phonePatterns.length; i++) {
    if (lower.indexOf(phonePatterns[i]) !== -1) { hasPhone = true; break; }
  }
  for (var j = 0; j < mychartPatterns.length; j++) {
    if (lower.indexOf(mychartPatterns[j]) !== -1) { hasMychart = true; break; }
  }

  if (hasPhone && !hasMychart) return 'phone';
  if (hasMychart && !hasPhone) return 'MyChart';
  if (hasPhone && hasMychart) return 'both';
  return null;
}

// Contact placeholder postprocessor — catches any surviving [phone/MyChart] placeholders
function fixContactPlaceholder(responseText, userMessage) {
  if (!responseText || typeof responseText !== 'string') return responseText;

  var placeholders = [
    /\[phone\/MyChart\]/gi,
    /\[phone or MyChart\]/gi,
    /\[MyChart\/phone\]/gi,
    /\[via phone\/MyChart\]/gi,
    /\(phone\/MyChart\)/gi
  ];

  var resolved = resolveContactMethod(userMessage);
  if (!resolved || resolved === 'both') return responseText;

  var replacement = resolved === 'phone' ? 'phone' : 'MyChart';

  var fixed = responseText;
  for (var i = 0; i < placeholders.length; i++) {
    fixed = fixed.replace(placeholders[i], replacement);
  }

  return fixed;
}

// CORS — restrict to HVC app origin
function getCorsHeaders(request) {
  var origin = (request && request.headers.get('origin')) || '';
  var isAllowed = origin === 'https://hvc.firekraker.net' || /^https:\/\/hvc[a-z0-9-]*\.vercel\.app$/.test(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://hvc.firekraker.net',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

const anthropic = new Anthropic({
  apiKey: process.env.KAIROS_ANTHROPIC_KEY,
});

// Lazy init so Next 14 build-time module evaluation doesn't crash when env
// vars are absent. createClient is invoked on first property access.
let _supabaseClient = null;
const supabase = new Proxy({}, {
  get: function(_, prop) {
    if (!_supabaseClient) {
      _supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
      );
    }
    const v = _supabaseClient[prop];
    return typeof v === 'function' ? v.bind(_supabaseClient) : v;
  }
});

var PRICING_OPUS = {
  input: 5.00 / 1000000,
  output: 25.00 / 1000000,
  cache_read: 0.50 / 1000000,
  cache_creation: 6.25 / 1000000,
};

var PRICING_SONNET = {
  input: 3.00 / 1000000,
  output: 15.00 / 1000000,
  cache_read: 0.30 / 1000000,
  cache_creation: 3.75 / 1000000,
};

// Rate limiting - 30 requests/min per IP
var rateLimitMap = new Map();
var RATE_LIMIT_MAX = 30;
var RATE_LIMIT_WINDOW = 60000;
setInterval(function() {
  var now = Date.now();
  rateLimitMap.forEach(function(_, key) {
    var entry = rateLimitMap.get(key);
    if (now - entry.windowStart > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
    }
  });
}, 60000);

function checkRateLimit(ip) {
  var now = Date.now();
  var entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

var MAX_RETRIES = 2;
var BASE_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

async function callWithRetry(createFn) {
  var lastError = null;
  for (var attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await createFn();
    } catch (err) {
      lastError = err;
      var status = err && err.status ? err.status : (err && err.statusCode ? err.statusCode : 0);
      var isRetryable = status === 429 || status === 529;
      if (!isRetryable || attempt === MAX_RETRIES) {
        throw err;
      }
      var delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn('[Retry] Attempt ' + (attempt + 1) + '/' + MAX_RETRIES + ' failed (' + status + '). Retrying in ' + (delayMs / 1000) + 's...');
      await sleep(delayMs);
    }
  }
  throw lastError;
}

var OPUS_CHAIN = [
  { id: 'claude-opus-4-7', label: 'Opus 4.7', retries: 3, baseDelayMs: 1000, effort: 'xhigh' },
  { id: 'claude-opus-4-6', label: 'Opus 4.6', retries: 0 },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', retries: 0 },
];

var SONNET_CHAIN = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-opus-4-6', label: 'Opus 4.6' },
];

function detectWorkflowTier(messages) {
  var lastMsg = '';
  for (var i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      if (typeof messages[i].content === 'string') {
        lastMsg = messages[i].content.toLowerCase();
      } else if (Array.isArray(messages[i].content)) {
        for (var j = 0; j < messages[i].content.length; j++) {
          if (messages[i].content[j].type === 'text') {
            lastMsg = messages[i].content[j].text.toLowerCase();
          }
        }
      }
      break;
    }
  }

  var opusKeywords = [
    'triage', 'sbar', 'calling with', 'patient calling', 'complaining of',
    'symptoms', 'chest pain', 'shortness of breath', 'sob', 'syncope',
    'palpitations', 'edema', 'dizziness', 'dizzy',
    'inr', 'coumadin', 'warfarin', 'anticoagulation', 'coumadin clinic',
    'bp log', 'blood pressure log', 'bp readings', 'home bp'
  ];

  for (var k = 0; k < opusKeywords.length; k++) {
    if (lastMsg.indexOf(opusKeywords[k]) !== -1) {
      return 'opus';
    }
  }

  for (var m = messages.length - 1; m >= 0; m--) {
    if (messages[m].role === 'user' && Array.isArray(messages[m].content)) {
      for (var n = 0; n < messages[m].content.length; n++) {
        if (messages[m].content[n].type === 'image') {
          return 'opus';
        }
      }
      break;
    }
  }

  return 'sonnet';
}

async function callWithModelFallback(systemBlocks, apiMessages, modelChain) {
  var lastError = null;
  for (var i = 0; i < modelChain.length; i++) {
    var currentModel = modelChain[i];
    try {
      console.log('[Model] Trying ' + currentModel.label + ' (' + currentModel.id + ')...');
      var modelId = currentModel.id;
      var response = await callWithRetry(function() {
        return anthropic.messages.create({
          model: modelId,
          max_tokens: 8192,
          system: systemBlocks,
          messages: apiMessages,
        });
      });
      console.log('[Model] Success: ' + currentModel.label);
      return { response: response, model: currentModel };
    } catch (err) {
      lastError = err;
      var status = err && err.status ? err.status : 0;
      console.warn('[Model] ' + currentModel.label + ' failed (' + status + '): ' + err.message);
    }
  }
  throw lastError;
}

async function logPhiIncident(route, auditResult) {
  if (!auditResult.found) return;
  try {
    await supabase.from('phi_incidents').insert({
      route: route,
      patterns_caught: auditResult.types,
      count: auditResult.count,
    });
  } catch (err) {
    console.error('[PHI Incident Log Failed]', err.message);
  }
}

var CHAT_MODE_PREFIX = 'CHAT MODE \u2014 ROUTING & FORMATTING INSTRUCTIONS\n' +
'==============================================\n\n' +
'You are in CHAT MODE. The user (Brandon Sterne, RN BSN, at Heart & Vascular Clinic) will send you free-form clinical text. Your job:\n\n' +
'1. IDENTIFY the workflow type from context clues:\n' +
'   - provider_callback: Patient callbacks about test results, provider messages, phone calls to patients about results\n' +
'   - coumadin_clinic: INR results, warfarin dosing, anticoagulation management\n' +
'   - mychart: Responding to or triaging patient MyChart messages\n' +
'   - checkout_orders: Processing checkout order sheets from provider\n' +
'   - med_refill: Medication refill requests, pharmacy calls\n' +
'   - triage: Patient calling with symptoms, complaints, or concerns requiring nursing assessment\n' +
'   - general: Does not clearly fit a workflow (questions, clarifications, general conversation)\n\n' +
'2. GENERATE ONLY what Brandon asks for. The three output types are:\n' +
'   - SCRIPT: Plain-language talking points for explaining information to the patient on the phone.\n' +
'   - RN NOTE: Nursing documentation for Epic. Professional, medical terminology, lean format.\n' +
'   - MYCHART MESSAGE: Patient-friendly message signed "Brandon Sterne, RN BSN / Cardiology Associates" -- do NOT include clinic phone numbers.\n' +
'   If Brandon asks for a script, give ONLY the script. If he asks for a note, give ONLY the note. If he asks for a MyChart message, give ONLY the MyChart message. If he asks for multiple, give only those. NEVER produce outputs he did not request.\n' +
'   If Brandon does not specify what he wants, ASK him. Do not assume. Do not give all three.\n\n' +
'NEVER FABRICATE PATIENT RESPONSES (HARD RULE -- PATIENT SAFETY):\n' +
'- If Brandon did not supply what the patient said, do NOT invent responses.\n' +
'- NEVER write "denies X, Y, Z" or "patient confirms..." or "patient reports..." or "verbalized understanding" unless Brandon explicitly provided those answers in the conversation.\n' +
'- If questions are being SENT to the patient via MyChart, document them as PENDING: "Patient notified via MyChart. Awaiting response to assessment questions."\n' +
'- If Peterson asks to confirm something and a MyChart message is requested, put those questions IN the MyChart message. In the RN note, write that questions were sent, awaiting response.\n' +
'- Do NOT assume the patient denied symptoms just because Peterson asked to check for them.\n' +
'- Fabricating assessment findings in a medical record is a patient safety issue. Zero exceptions.\n\n' +
'WRITE WITH WHAT YOU HAVE (HARD RULE):\n' +
'- When Brandon pastes a result note from Peterson and asks for an RN note or MyChart message, WRITE IT with the information provided.\n' +
'- Do NOT ask for medications, symptoms, or additional context unless the note literally cannot be written without it.\n' +
'- If Peterson says "no change in treatment" -- that is the action. Document it. You do not need the med list to write the note.\n' +
'- If Peterson does not mention symptoms -- there are no symptoms to document. Do not ask.\n' +
'- A simple result callback (labs normal, no changes) should NEVER trigger clarifying questions. Just write the note.\n' +
'- When in doubt, WRITE THE NOTE. Brandon will revise if needed. Asking unnecessary questions slows down a busy clinic.\n\n' +
'CONTACT METHOD RULE (HARD RULE -- ZERO EXCEPTIONS):\n' +
'- If Brandon asks for a MyChart message, the contact method IS MyChart. Write "Patient notified via MyChart" in the RN note. Do NOT write "Patient contacted via [phone/MyChart]." Do NOT ask "Called or MyChart?"\n' +
'- If Brandon asks for a script (phone call), the contact method is phone.\n' +
'- Only ask contact method if Brandon requests ONLY an RN note with no script or MyChart message.\n' +
'- NEVER ask "Called or MyChart?" as a standalone response. Just write the note.\n' +
'- If the contact method is unclear, use the bracket placeholder "Patient contacted via [phone/MyChart]." and Brandon will delete the one that does not apply. This is faster than asking.\n\n' +
'COUMADIN CLINIC: Brandon runs this independently per RN anticoagulation protocol. INR MyChart messages do NOT reference Peterson. Brandon reviews INRs, not Peterson.\n\n' +
'RESULT NOTIFICATION CLOSURE:\n' +
'- When Brandon is notifying a patient of test results, the communication loop is CLOSED once the message is sent.\n' +
'- Do NOT add "awaiting response" or "will follow up with patient response" or "pending patient reply" at the end of notes when Brandon is simply communicating results.\n' +
'- The only time "awaiting response" is appropriate is if Brandon EXPLICITLY says he asked the patient a question and is waiting for their answer.\n' +
'- Result callbacks via MyChart are one-directional notifications. The results have been communicated, the task is complete. Document it as complete.\n' +
'- In RN notes for result notifications, end with "Patient notified via MyChart." or "Patient notified via phone." Period. Done.\n\n' +
'CRITICAL -- CLEAN OUTPUT ONLY:\n' +
'- Your response must contain ONLY the clinical documentation requested. Nothing else.\n' +
'- NEVER add commentary, suggestions, questions, or explanations after the note.\n' +
'- NEVER say things like "Would you like me to..." or "Let me know if..." or "I can also..." after the clinical output.\n' +
'- NEVER add meta-text like "Here is your note:" or "Draft script:" before the output.\n' +
'- The reason: Brandon copies your ENTIRE response and pastes it directly into Epic. Any AI commentary will end up in the medical record. This is a patient safety issue.\n' +
'- If you have a question or need clarification, that should be your ENTIRE response -- do not mix questions with clinical output.\n\n' +
'3. At the VERY END of your response (after ALL clinical content), on a new line, include this metadata tag:\n' +
'   <<WORKFLOW:workflow_type>>\n' +
'   If you can identify a patient code in HVC-XXXXL format, also include:\n' +
'   <<PATIENT:HVC-XXXX>>\n' +
'   These metadata tags are automatically stripped before display.\n\n' +
'SCOPE OF PRACTICE:\n' +
'- All advice and documentation must be RN-centric. Stay within nursing scope of practice.\n' +
'- Never provide physician-level medical advice, diagnoses, or treatment decisions.\n' +
'- NEVER say "this is what should be done" or dictate treatment plans. That is the provider role, not yours.\n' +
'- NEVER recommend starting, stopping, or changing medications. NEVER recommend procedures or tests.\n' +
'- NEVER phrase anything as "consider doing X" or "recommend X" or "suggest X" to a provider. Providers do not need nursing advice on medical decisions.\n' +
'- You may notice patterns, flag abnormals, point things out, and ask clarifying questions -- that is good nursing.\n' +
'- Frame actions as "per provider orders," "per protocol," or "will notify provider" as appropriate.\n' +
'- When clinical judgment is needed beyond RN scope, flag it for provider review -- do not make the decision.\n' +
'- Even when Brandon gives extra context or goes off-script, stay in nursing lane. Do not escalate to medical recommendations.\n\n' +
'MEDICATION LIST HANDLING:\n' +
'- When Brandon shares a medication list from Epic, do NOT assume the patient is currently taking all listed medications.\n' +
'- Many medications on the list may not be reconciled and could be outdated.\n' +
'- Use language like "med list states..." or "per med list..." rather than "patient is on..." or "currently taking..."\n' +
'- Example: "Med list states metoprolol 50mg BID" NOT "Patient is on metoprolol 50mg BID"\n\n' +
'PROVIDER NAME HANDLING:\n' +
'- Heart & Vascular Clinic staff names (Peterson, Vassilakos, Engelbrecht, Powell, Sterne, Henningsen, Bjorklund, etc.) may be used freely.\n' +
'- If Brandon provides a specific outside provider name (e.g., "Dr. Smith said..." or "per Dr. Jones"), USE THAT NAME as given. Do not replace it.\n' +
'- When summarizing or generating documentation where the outside provider name was NOT provided by Brandon, use their specialty title instead:\n' +
'  - "Referred to nephrologist" instead of guessing a name\n' +
'  - "Per hematologist recommendations"\n' +
'  - "Electrophysiologist to evaluate"\n' +
'  - "PCP notified"\n\n' +
'HISTORICAL SUMMARIES:\n' +
'- When patient history is relevant, provide a smart, succinct summary.\n' +
'- Focus ONLY on what is needed by cardiology and the cardiologist to perform optimal care.\n' +
'- Short is better. Busy clinic, busy providers. Cut anything that does not directly serve the cardiac care picture.\n\n' +
'DATE AND TIMELINE ACCURACY:\n' +
'- When Brandon pastes a message thread, chart notes, or any content with multiple dates, FIRST reconstruct the timeline in chronological order BEFORE writing any output.\n' +
'- Read every date and every relative date reference ("yesterday," "last week," "seen today") and resolve them to actual dates based on the note dates.\n' +
'- Do NOT skim and assume. Do NOT carry forward a wrong date from a previous draft.\n' +
'- If dates are ambiguous or conflicting, ask Brandon to clarify BEFORE writing the note.\n' +
'- This is a clinical document. Wrong dates in a medical record are dangerous. Get it right the first time.\n\n' +
'COUMADIN/INR FORMAT ENFORCEMENT:\n' +
'- The Coumadin clinic note format is defined in the clinical knowledge base below. You MUST follow it exactly every time.\n' +
'- Do NOT improvise, restructure, or claim you do not know the format. It is provided to you on every call.\n' +
'- The format is: Header, INR value/goal/status, Trend, Dose line with TWD, clinical context (if prior notes available), patient notification, next INR timeframe.\n' +
'- If you are unsure, re-read the knowledge base section on Coumadin/INR notes before generating.\n' +
'- Coumadin clinic notes are ALWAYS an RN note. Never ask "What output do you need?" Just write the note.\n' +
'- If Brandon gives you INR data and history, that is a coumadin clinic encounter. Write the note immediately.\n\n' +
'CRITICAL FORMATTING RULES:\n' +
'- ABSOLUTELY NO MARKDOWN IN OUTPUT for nurse notes and scripts. No asterisks (*), no double asterisks (**text**), no headers (#), no underscores (_text_), no triple dashes (---), no backticks. Output is pasted directly into Epic. Any markdown characters in nurse notes are a formatting error.\n' +
'- MyChart messages may use **bold** markdown for section headers like **Results Summary:** and **Treatment Plan:** and for the signature line **Brandon Sterne, RN BSN / Cardiology Associates**. Bold must use double asterisks (**text**). The signature MUST always be bold. Nurse notes remain plain text only -- no markdown.\n' +
'- Use PLAIN TEXT only for nurse notes. No bullet points (* or -) UNLESS the note format calls for lean bullet-style.\n' +
'- Write documentation exactly as it should appear when pasted into Epic.\n' +
'- Never use em dashes unless absolutely necessary.\n' +
'- Scripts: plain language, no bold.\n' +
'- Nurse Notes: professional Epic documentation, medical terminology, no signature line (name is in the header), no date stamps.\n' +
'- MyChart Messages: patient-friendly language, signed "Brandon Sterne, RN BSN / Cardiology Associates" -- do NOT include clinic phone numbers.\n' +
'- Be concise. Brandon is moving fast in a clinical setting.\n' +
'- Do not add unnecessary pleasantries or explanations -- just deliver the documentation.\n\n' +
'CONVERSATION BEHAVIOR:\n' +
'- If the user message is unclear, ask a brief clarifying question (tag as general).\n' +
'- If the user sends a follow-up or revision request, revise your previous output accordingly.\n' +
'- For Provider Callback with questions: If Brandon asks ONLY for a script, give script only and wait for answers. But if Brandon explicitly asks for "RN note and MyChart message" (or both), write both now. The RN note documents that questions were sent via MyChart, and the MyChart message contains the questions. Do not force the wait-for-answers pattern when Brandon has explicitly asked for both outputs.\n\n' +
'ANTI-HALLUCINATION RULE:\n' +
'- Before answering any technical question about medications, lab values, or clinical protocols, verify against the knowledge base.\n' +
'- If the information is not in the knowledge base, say so explicitly. Never invent clinical details.\n\n' +
'ERROR HANDLING:\n' +
'- If the API encounters an error or times out, tell Brandon clearly: "I hit an error processing that. Try again or rephrase." Do not fabricate a response.\n\n' +
'COUMADIN CLINIC RULE:\n' +
'- When INR is within therapeutic range, NEVER change, adjust, simplify, or standardize the warfarin dose. Document the current dose exactly as prescribed, unchanged.\n' +
'- Dose changes are only considered when INR is OUT of range.\n' +
'- Brandon preference for non-alternating doses only applies when a dose change is actually warranted.\n\n' +
'CONTACT METHOD DETECTION:\n' +
'- If the user mentions calling, phoning, spoke with, talked to, or reached the patient, write "Patient contacted via phone." in the RN note.\n' +
'- If the user mentions MyChart or message, write "Patient contacted via MyChart." in the RN note.\n' +
'- NEVER use the placeholder [phone/MyChart] when the user has already stated the contact method.\n\n' +
'OUTPUT FORMAT:\n' +
'- All output must be paste-ready for Epic. No markdown symbols (no asterisks, no hashtags, no backticks).\n' +
'- If emphasis is needed, use CAPS or simply write clearly.\n' +
'- Zero formatting that requires removal after pasting.\n\n' +
'COMPLETENESS RULE:\n' +
'When the user pastes results from Peterson, identify every distinct finding, component, test section, or numbered item in the source. The nurse note AND the MyChart message must address EACH finding separately. Never collapse multiple findings into one statement. Never drop a finding because the overall result is "negative" or "normal." If Peterson\'s results contain a nuclear stress test with both a stress/EKG portion AND a nuclear imaging portion, both must be described in both the nurse note and the MyChart message -- they are separate findings even when both are negative.\n' +
'Before writing output, list internally every finding in Peterson\'s results. Verify the output covers each one.\n\n' +
'NURSE NOTE HEADER (HARD RULE -- NO EXCEPTIONS):\n' +
'- EVERY nurse note MUST start with: Nurse Note - Brandon Sterne RN BSN\n' +
'- This header goes on its own line, before any note content.\n' +
'- No exceptions. Every single note. Every workflow.\n\n' +
'NOW APPLY THE FOLLOWING CLINICAL KNOWLEDGE BASE:\n' +
'==============================================\n\n';

export async function POST(request) {
  try {
    // Env var validation
    var missingEnv = [];
    if (!process.env.KAIROS_ANTHROPIC_KEY) missingEnv.push('KAIROS_ANTHROPIC_KEY');
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) missingEnv.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_KEY) missingEnv.push('SUPABASE_SERVICE_KEY');
    if (missingEnv.length > 0) {
      return NextResponse.json({ error: 'Missing required env var: ' + missingEnv.join(', ') }, { status: 500 });
    }

    // Rate limit check
    var forwarded = request.headers.get('x-forwarded-for');
    var ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      );
    }

    var body = await request.json();
    var messages = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Input validation
    for (var vi = 0; vi < messages.length; vi++) {
      var msgContent = messages[vi].content;
      if (typeof msgContent === 'string') {
        if (!msgContent.trim()) {
          return NextResponse.json({ error: 'Messages must not be empty' }, { status: 400 });
        }
        if (msgContent.length > 100000) {
          return NextResponse.json({ error: 'Message exceeds maximum length of 100000 characters' }, { status: 400 });
        }
      } else if (Array.isArray(msgContent)) {
        for (var vj = 0; vj < msgContent.length; vj++) {
          if (msgContent[vj].type === 'text') {
            if (typeof msgContent[vj].text !== 'string') {
              return NextResponse.json({ error: 'Message text must be a string' }, { status: 400 });
            }
            if (msgContent[vj].text.length > 100000) {
              return NextResponse.json({ error: 'Message exceeds maximum length of 100000 characters' }, { status: 400 });
            }
          }
        }
      } else {
        return NextResponse.json({ error: 'Message content must be a string or array' }, { status: 400 });
      }
    }

    var phiCaughtServer = false;
    var scrubbedMessages = messages.map(function(m) {
      if (m.role === 'user') {
        if (Array.isArray(m.content)) {
          var scrubbed = m.content.map(function(block) {
            if (block.type === 'text') {
              var audit = auditPHI(block.text);
              if (audit.found) {
                phiCaughtServer = true;
                logPhiIncident('/api/chat', audit);
                console.warn('[PHI Guard] Caught ' + audit.count + ' item(s) in image msg: [' + audit.types.join(', ') + ']');
              }
              return { type: 'text', text: scrubPHI(block.text) };
            }
            return block;
          });
          return { role: m.role, content: scrubbed };
        }
        var audit = auditPHI(m.content);
        if (audit.found) {
          phiCaughtServer = true;
          logPhiIncident('/api/chat', audit);
          console.warn('[PHI Guard] Caught ' + audit.count + ' item(s): [' + audit.types.join(', ') + ']');
        }
        return { role: m.role, content: scrubPHI(m.content) };
      }
      return m;
    });

    var adminOverride = '';
    try {
      var settingsResult = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'system_prompt')
        .single();
      if (settingsResult.data && settingsResult.data.value) {
        adminOverride = settingsResult.data.value;
      }
    } catch (err) {
      console.log('No admin override:', err.message);
    }

    // Keyword routing -- append reference sections only when needed
    var lastUserMsgOriginal = '';
    var lastUserMsg = '';
    for (var mi = scrubbedMessages.length - 1; mi >= 0; mi--) {
      if (scrubbedMessages[mi].role === 'user') {
        lastUserMsgOriginal = scrubbedMessages[mi].content || '';
        lastUserMsg = lastUserMsgOriginal.toLowerCase();
        break;
      }
    }
    var appendedKnowledge = '';

    // Epic order entry: order, put in, how to enter/search, cath prep, refill, scenarios
    var isOrderQuery = lastUserMsg.indexOf('order') !== -1 ||
      lastUserMsg.indexOf('put in') !== -1 ||
      lastUserMsg.indexOf('how do i enter') !== -1 ||
      lastUserMsg.indexOf('how do i search') !== -1 ||
      lastUserMsg.indexOf('cath prep') !== -1 ||
      lastUserMsg.indexOf('heart cath') !== -1 ||
      lastUserMsg.indexOf('refill protocol') !== -1 ||
      lastUserMsg.indexOf('in basket') !== -1 ||
      lastUserMsg.indexOf('anticoag encounter') !== -1 ||
      lastUserMsg.indexOf('enroll') !== -1;
    if (isOrderQuery) {
      appendedKnowledge = appendedKnowledge + '\n\n' + REFERENCE_EPIC;
    }

    // Provider directory: phone/fax/number/referral/contact lookup
    // Broad matching — false positives are fine (costs a few extra tokens)
    // False negatives mean Brandon can't find contacts mid-clinic
    var isDirectoryQuery =
      // Contact words
      lastUserMsg.indexOf('contact') !== -1 ||
      lastUserMsg.indexOf('phone') !== -1 ||
      lastUserMsg.indexOf('fax') !== -1 ||
      lastUserMsg.indexOf('number') !== -1 ||
      lastUserMsg.indexOf('reach') !== -1 ||
      lastUserMsg.indexOf('pager') !== -1 ||
      // Referral words
      lastUserMsg.indexOf('refer') !== -1 ||
      lastUserMsg.indexOf('referral') !== -1 ||
      lastUserMsg.indexOf('send to') !== -1 ||
      lastUserMsg.indexOf('transfer to') !== -1 ||
      lastUserMsg.indexOf('send records') !== -1 ||
      // Directory words
      lastUserMsg.indexOf('directory') !== -1 ||
      lastUserMsg.indexOf('who is') !== -1 ||
      lastUserMsg.indexOf('who do') !== -1 ||
      // Action phrases
      lastUserMsg.indexOf('get ahold') !== -1 ||
      lastUserMsg.indexOf('how do i reach') !== -1 ||
      lastUserMsg.indexOf('how to reach') !== -1 ||
      lastUserMsg.indexOf('fax to') !== -1 ||
      lastUserMsg.indexOf('call about') !== -1 ||
      // Provider title patterns
      lastUserMsg.indexOf('dr.') !== -1 ||
      lastUserMsg.indexOf('dr ') !== -1 ||
      lastUserMsg.indexOf(' md') !== -1 ||
      lastUserMsg.indexOf(' do') !== -1 ||
      lastUserMsg.indexOf(' np') !== -1 ||
      lastUserMsg.indexOf(' anp') !== -1 ||
      lastUserMsg.indexOf(' pa-c') !== -1 ||
      lastUserMsg.indexOf(' arnp') !== -1 ||
      lastUserMsg.indexOf(' fnp') !== -1 ||
      lastUserMsg.indexOf(' dpm') !== -1 ||
      lastUserMsg.indexOf(' aud') !== -1 ||
      lastUserMsg.indexOf(' cnm') !== -1 ||
      // Provider last names from directory
      lastUserMsg.indexOf('ballard') !== -1 ||
      lastUserMsg.indexOf('efstratiadis') !== -1 ||
      lastUserMsg.indexOf('morrison') !== -1 ||
      lastUserMsg.indexOf('virk') !== -1 ||
      lastUserMsg.indexOf('lamberth') !== -1 ||
      lastUserMsg.indexOf('phippen') !== -1 ||
      lastUserMsg.indexOf('murr') !== -1 ||
      lastUserMsg.indexOf('kriete') !== -1 ||
      lastUserMsg.indexOf('rusten') !== -1 ||
      lastUserMsg.indexOf('chafton') !== -1 ||
      lastUserMsg.indexOf('waterworth') !== -1 ||
      lastUserMsg.indexOf('deveney') !== -1 ||
      lastUserMsg.indexOf('mazzeo') !== -1 ||
      lastUserMsg.indexOf('roshan') !== -1 ||
      lastUserMsg.indexOf('maedgen') !== -1 ||
      lastUserMsg.indexOf('moravec') !== -1 ||
      lastUserMsg.indexOf('voight') !== -1 ||
      lastUserMsg.indexOf('rowden') !== -1 ||
      lastUserMsg.indexOf('huang') !== -1 ||
      lastUserMsg.indexOf('pajeau') !== -1 ||
      lastUserMsg.indexOf('shockley') !== -1 ||
      lastUserMsg.indexOf('witham') !== -1 ||
      lastUserMsg.indexOf('abebe') !== -1 ||
      lastUserMsg.indexOf('zahoor') !== -1 ||
      lastUserMsg.indexOf('moshirzadeh') !== -1 ||
      lastUserMsg.indexOf('heincker') !== -1 ||
      lastUserMsg.indexOf('phinney') !== -1 ||
      lastUserMsg.indexOf('potter') !== -1 ||
      lastUserMsg.indexOf('youlo') !== -1 ||
      lastUserMsg.indexOf('clayton') !== -1 ||
      lastUserMsg.indexOf('knox') !== -1 ||
      lastUserMsg.indexOf('kunkel') !== -1 ||
      lastUserMsg.indexOf('cowell') !== -1 ||
      lastUserMsg.indexOf('emmett') !== -1 ||
      lastUserMsg.indexOf('french') !== -1 ||
      lastUserMsg.indexOf('knetzer') !== -1 ||
      lastUserMsg.indexOf('garrison') !== -1 ||
      lastUserMsg.indexOf('johnson') !== -1 ||
      lastUserMsg.indexOf('pearson') !== -1 ||
      lastUserMsg.indexOf('gautam') !== -1 ||
      lastUserMsg.indexOf('soberano') !== -1 ||
      lastUserMsg.indexOf('spencer') !== -1 ||
      lastUserMsg.indexOf('swanson') !== -1 ||
      lastUserMsg.indexOf('lisenbe') !== -1 ||
      lastUserMsg.indexOf('lebedowicz') !== -1 ||
      lastUserMsg.indexOf('toebben') !== -1 ||
      lastUserMsg.indexOf('wiseman') !== -1 ||
      lastUserMsg.indexOf('becerril') !== -1 ||
      lastUserMsg.indexOf('harden') !== -1 ||
      lastUserMsg.indexOf('knobbe') !== -1 ||
      lastUserMsg.indexOf('ratchford') !== -1 ||
      lastUserMsg.indexOf('alvarado') !== -1 ||
      lastUserMsg.indexOf('freeman') !== -1 ||
      lastUserMsg.indexOf('schroeder') !== -1 ||
      lastUserMsg.indexOf('ulrich') !== -1 ||
      lastUserMsg.indexOf('sadler') !== -1 ||
      lastUserMsg.indexOf('coble') !== -1 ||
      lastUserMsg.indexOf('feeler') !== -1 ||
      lastUserMsg.indexOf('fleener') !== -1 ||
      lastUserMsg.indexOf('armstrong') !== -1 ||
      lastUserMsg.indexOf('bourne') !== -1 ||
      lastUserMsg.indexOf('floyd') !== -1 ||
      lastUserMsg.indexOf('fryer') !== -1 ||
      lastUserMsg.indexOf('hurley') !== -1 ||
      lastUserMsg.indexOf('blanc') !== -1 ||
      lastUserMsg.indexOf('martin') !== -1 ||
      lastUserMsg.indexOf('fulton') !== -1 ||
      lastUserMsg.indexOf('headrick') !== -1 ||
      lastUserMsg.indexOf('brawley') !== -1 ||
      lastUserMsg.indexOf('bland') !== -1 ||
      lastUserMsg.indexOf('gorrell') !== -1 ||
      lastUserMsg.indexOf("o'malley") !== -1 ||
      lastUserMsg.indexOf('durbin') !== -1 ||
      lastUserMsg.indexOf('mcbride') !== -1 ||
      lastUserMsg.indexOf('priest') !== -1 ||
      lastUserMsg.indexOf('davis') !== -1 ||
      lastUserMsg.indexOf('shams') !== -1 ||
      lastUserMsg.indexOf('allen') !== -1 ||
      lastUserMsg.indexOf('crawshaw') !== -1 ||
      lastUserMsg.indexOf('myers') !== -1 ||
      lastUserMsg.indexOf('gifford') !== -1 ||
      lastUserMsg.indexOf('sinha') !== -1 ||
      lastUserMsg.indexOf('zaman') !== -1 ||
      lastUserMsg.indexOf('bayless') !== -1 ||
      lastUserMsg.indexOf('watkins') !== -1 ||
      lastUserMsg.indexOf('sanchez') !== -1 ||
      lastUserMsg.indexOf('bach') !== -1 ||
      lastUserMsg.indexOf('hartupee') !== -1 ||
      lastUserMsg.indexOf('lasala') !== -1 ||
      lastUserMsg.indexOf('vader') !== -1 ||
      lastUserMsg.indexOf('prabhu') !== -1 ||
      lastUserMsg.indexOf('masood') !== -1 ||
      lastUserMsg.indexOf('cuculich') !== -1 ||
      lastUserMsg.indexOf('faddis') !== -1 ||
      lastUserMsg.indexOf('cooper') !== -1 ||
      lastUserMsg.indexOf('glenn') !== -1 ||
      lastUserMsg.indexOf('zajarias') !== -1 ||
      lastUserMsg.indexOf('sintek') !== -1 ||
      lastUserMsg.indexOf('kaneko') !== -1 ||
      lastUserMsg.indexOf('chakinala') !== -1 ||
      lastUserMsg.indexOf('gdowski') !== -1 ||
      lastUserMsg.indexOf('reiss') !== -1 ||
      lastUserMsg.indexOf('oak') !== -1 ||
      lastUserMsg.indexOf('peterson') !== -1 ||
      lastUserMsg.indexOf('leidenfrost') !== -1 ||
      lastUserMsg.indexOf('reidy') !== -1 ||
      lastUserMsg.indexOf('shapiro') !== -1 ||
      lastUserMsg.indexOf('kao') !== -1 ||
      lastUserMsg.indexOf('krishnaswamy') !== -1 ||
      lastUserMsg.indexOf('wilson') !== -1 ||
      lastUserMsg.indexOf('saba') !== -1 ||
      lastUserMsg.indexOf('patel') !== -1 ||
      lastUserMsg.indexOf('mahata') !== -1 ||
      lastUserMsg.indexOf('lee') !== -1 ||
      lastUserMsg.indexOf('bauer') !== -1 ||
      lastUserMsg.indexOf('seeck') !== -1 ||
      lastUserMsg.indexOf('speck') !== -1 ||
      lastUserMsg.indexOf('batchu') !== -1 ||
      lastUserMsg.indexOf('thompson') !== -1 ||
      lastUserMsg.indexOf('karuparthia') !== -1 ||
      lastUserMsg.indexOf('ali') !== -1 ||
      lastUserMsg.indexOf('zhu') !== -1 ||
      lastUserMsg.indexOf('mella') !== -1 ||
      lastUserMsg.indexOf('coulter') !== -1 ||
      lastUserMsg.indexOf('phillips') !== -1 ||
      lastUserMsg.indexOf('fern') !== -1 ||
      lastUserMsg.indexOf('abraman') !== -1 ||
      lastUserMsg.indexOf('al-sayyed') !== -1 ||
      lastUserMsg.indexOf('baker') !== -1 ||
      lastUserMsg.indexOf('trikalinos') !== -1 ||
      lastUserMsg.indexOf('aleto') !== -1 ||
      lastUserMsg.indexOf('orizu') !== -1 ||
      lastUserMsg.indexOf('hartog') !== -1 ||
      lastUserMsg.indexOf('buschman') !== -1 ||
      lastUserMsg.indexOf('patrick') !== -1 ||
      lastUserMsg.indexOf('almasalmeh') !== -1 ||
      lastUserMsg.indexOf('stegeman') !== -1 ||
      lastUserMsg.indexOf('vorhies') !== -1 ||
      // Facility and location names from directory
      lastUserMsg.indexOf('phelps') !== -1 ||
      lastUserMsg.indexOf('barnes') !== -1 ||
      lastUserMsg.indexOf('bjc') !== -1 ||
      lastUserMsg.indexOf('bjh') !== -1 ||
      lastUserMsg.indexOf('wash u') !== -1 ||
      lastUserMsg.indexOf('washington u') !== -1 ||
      lastUserMsg.indexOf('st. luke') !== -1 ||
      lastUserMsg.indexOf('saint luke') !== -1 ||
      lastUserMsg.indexOf('cleveland clinic') !== -1 ||
      lastUserMsg.indexOf('mercy') !== -1 ||
      lastUserMsg.indexOf('ssm') !== -1 ||
      lastUserMsg.indexOf('missouri baptist') !== -1 ||
      lastUserMsg.indexOf('mo baptist') !== -1 ||
      lastUserMsg.indexOf('cox') !== -1 ||
      lastUserMsg.indexOf('umc') !== -1 ||
      lastUserMsg.indexOf('ummc') !== -1 ||
      lastUserMsg.indexOf('university hospital') !== -1 ||
      lastUserMsg.indexOf('columbia va') !== -1 ||
      lastUserMsg.indexOf('st. james va') !== -1 ||
      lastUserMsg.indexOf('waynesville va') !== -1 ||
      lastUserMsg.indexOf('fort leonard wood') !== -1 ||
      lastUserMsg.indexOf('leonard wood') !== -1 ||
      lastUserMsg.indexOf('glwach') !== -1 ||
      lastUserMsg.indexOf('lake regional') !== -1 ||
      lastUserMsg.indexOf('salem hospital') !== -1 ||
      lastUserMsg.indexOf('salem memorial') !== -1 ||
      lastUserMsg.indexOf('texas county') !== -1 ||
      lastUserMsg.indexOf('tcmh') !== -1 ||
      lastUserMsg.indexOf('veterans home') !== -1 ||
      lastUserMsg.indexOf('capital region') !== -1 ||
      lastUserMsg.indexOf('missouri heart') !== -1 ||
      lastUserMsg.indexOf('missouri vein') !== -1 ||
      lastUserMsg.indexOf('bailey') !== -1 ||
      lastUserMsg.indexOf('rayus') !== -1 ||
      lastUserMsg.indexOf('midwest imaging') !== -1 ||
      lastUserMsg.indexOf('jcmg') !== -1 ||
      lastUserMsg.indexOf('labcorp') !== -1 ||
      lastUserMsg.indexOf('quest') !== -1 ||
      lastUserMsg.indexOf('lincare') !== -1 ||
      lastUserMsg.indexOf('aerocare') !== -1 ||
      lastUserMsg.indexOf('alaris') !== -1 ||
      lastUserMsg.indexOf('tactile') !== -1 ||
      lastUserMsg.indexOf('theracon') !== -1 ||
      lastUserMsg.indexOf('ayria') !== -1 ||
      lastUserMsg.indexOf('sinks pharmacy') !== -1 ||
      lastUserMsg.indexOf('express scripts') !== -1 ||
      lastUserMsg.indexOf('four rivers') !== -1 ||
      lastUserMsg.indexOf('jones eye') !== -1 ||
      lastUserMsg.indexOf('meramec') !== -1 ||
      lastUserMsg.indexOf('magical smiles') !== -1 ||
      lastUserMsg.indexOf('dixon') !== -1 ||
      // Specialty/department keywords
      lastUserMsg.indexOf('cardiology') !== -1 ||
      lastUserMsg.indexOf('electrophysiology') !== -1 ||
      lastUserMsg.indexOf('ep ') !== -1 ||
      lastUserMsg.indexOf(' ep') !== -1 ||
      lastUserMsg.indexOf('vascular') !== -1 ||
      lastUserMsg.indexOf('nephrology') !== -1 ||
      lastUserMsg.indexOf('neurology') !== -1 ||
      lastUserMsg.indexOf('pulmonology') !== -1 ||
      lastUserMsg.indexOf('oncology') !== -1 ||
      lastUserMsg.indexOf('hematology') !== -1 ||
      lastUserMsg.indexOf('urology') !== -1 ||
      lastUserMsg.indexOf('orthopedic') !== -1 ||
      lastUserMsg.indexOf('podiatry') !== -1 ||
      lastUserMsg.indexOf('rheumatology') !== -1 ||
      lastUserMsg.indexOf('endocrinology') !== -1 ||
      lastUserMsg.indexOf('gastro') !== -1 ||
      lastUserMsg.indexOf('gi ') !== -1 ||
      lastUserMsg.indexOf('bariatric') !== -1 ||
      lastUserMsg.indexOf('dermatology') !== -1 ||
      lastUserMsg.indexOf('sleep medicine') !== -1 ||
      lastUserMsg.indexOf('valve clinic') !== -1 ||
      lastUserMsg.indexOf('heart failure') !== -1 ||
      lastUserMsg.indexOf('cardiac rehab') !== -1 ||
      lastUserMsg.indexOf('cardiac rehabilitation') !== -1 ||
      lastUserMsg.indexOf('therapy pros') !== -1 ||
      lastUserMsg.indexOf('st james') !== -1 ||
      lastUserMsg.indexOf('cath lab') !== -1 ||
      lastUserMsg.indexOf('radiology') !== -1 ||
      lastUserMsg.indexOf('scheduling') !== -1 ||
      lastUserMsg.indexOf('medical records') !== -1 ||
      lastUserMsg.indexOf('home health') !== -1 ||
      lastUserMsg.indexOf('pharmacy') !== -1 ||
      lastUserMsg.indexOf('wound') !== -1 ||
      lastUserMsg.indexOf('pain management') !== -1 ||
      lastUserMsg.indexOf('senior care') !== -1 ||
      lastUserMsg.indexOf('pediatric') !== -1 ||
      lastUserMsg.indexOf('women') !== -1 ||
      lastUserMsg.indexOf('maternity') !== -1 ||
      lastUserMsg.indexOf('rfs') !== -1;
    if (isDirectoryQuery) {
      appendedKnowledge = appendedKnowledge + '\n\n' + REFERENCE_DIRECTORY;
    }

    // Dose tiers: dose/dosing keywords NOT in coumadin/warfarin/INR context
    var isCoumadinContext = lastUserMsg.indexOf('inr') !== -1 ||
      lastUserMsg.indexOf('coumadin') !== -1 ||
      lastUserMsg.indexOf('warfarin') !== -1 ||
      lastUserMsg.indexOf('anticoag') !== -1;
    var isDoseQuery = (lastUserMsg.indexOf('dose') !== -1 || lastUserMsg.indexOf('dosing') !== -1) && !isCoumadinContext;
    if (isDoseQuery) {
      appendedKnowledge = appendedKnowledge + '\n\n' + REFERENCE_DOSE_TIERS;
    }

    var knowledgeSection = CORE_KNOWLEDGE + appendedKnowledge;
    var fullSystemPrompt = 'TODAY IS: ' + new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Chicago' }) + '\n\n' + CHAT_MODE_PREFIX + knowledgeSection;

    // Contact method preprocessing — resolve from user input and append as fact
    var contactMethod = resolveContactMethod(lastUserMsgOriginal);
    var contactFact = '';
    if (contactMethod === 'phone') {
      contactFact = '\n\nRESOLVED CONTEXT: Contact method is PHONE. Write "Patient contacted via phone" -- do not use a placeholder.';
    } else if (contactMethod === 'MyChart') {
      contactFact = '\n\nRESOLVED CONTEXT: Contact method is MyChart. Write "Patient contacted via MyChart" -- do not use a placeholder.';
    } else if (contactMethod === 'both') {
      contactFact = '\n\nRESOLVED CONTEXT: User mentioned both phone and MyChart. Use whichever fits the documentation context.';
    }
    if (contactFact) {
      fullSystemPrompt = fullSystemPrompt + contactFact;
    }

    if (adminOverride) {
      fullSystemPrompt += '\n\n=== ADMIN OVERRIDES ===\nThe following additional instructions take precedence over the knowledge base above when they conflict:\n\n' + adminOverride;
    }

    var apiMessages = scrubbedMessages.map(function(m) {
      return {
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      };
    });

    var systemBlocks = [
      {
        type: 'text',
        text: fullSystemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ];

    var tier = detectWorkflowTier(messages);
    var modelChain = tier === 'opus' ? OPUS_CHAIN : SONNET_CHAIN;
    console.log('[Tier] Detected: ' + tier + ' (' + modelChain[0].label + ' primary)');

    var result;
    try {
      result = await callWithModelFallback(systemBlocks, apiMessages, modelChain);
    } catch (allFailedErr) {
      console.error('[Chat] All models failed:', allFailedErr.message);
      return NextResponse.json(
        {
          error: 'servers_busy',
          message: 'All Claude models are overloaded right now. Please wait a moment and try again.',
          details: allFailedErr.message,
          retryable: true,
        },
        { status: 503 }
      );
    }

    var response = result.response;
    var usedModel = result.model;

    var rawOutput = response.content[0] ? response.content[0].text || '' : '';

    var workflowMatch = rawOutput.match(/<<WORKFLOW:(\w+)>>/);
    var patientMatch = rawOutput.match(/<<PATIENT:(HVC-\w+)>>/);
    var workflow = workflowMatch ? workflowMatch[1] : 'general';
    var patientCode = patientMatch ? patientMatch[1] : null;

    var cleanOutput = rawOutput
      .replace(/\n?<<WORKFLOW:\w+>>/g, '')
      .replace(/\n?<<PATIENT:HVC-\w+>>/g, '')
      .trim();

    // Postprocess — fix any surviving contact method placeholders
    cleanOutput = fixContactPlaceholder(cleanOutput, lastUserMsgOriginal);

    var scrubbedOutput = scrubPHI(cleanOutput);

    var usage = response.usage || {};
    console.log(
      '[Chat] Model: ' + usedModel.label + ' | Workflow: ' + workflow +
      ' | Patient: ' + (patientCode || 'N/A') +
      ' | Input: ' + (usage.input_tokens || 0) +
      ' | Output: ' + (usage.output_tokens || 0) +
      ' | Cache Read: ' + (usage.cache_read_input_tokens || 0) +
      ' | Cache Create: ' + (usage.cache_creation_input_tokens || 0) +
      (phiCaughtServer ? ' | PHI scrubbed server-side' : '')
    );

    try {
      var inputTokens = usage.input_tokens || 0;
      var outputTokens = usage.output_tokens || 0;
      var cacheRead = usage.cache_read_input_tokens || 0;
      var cacheCreation = usage.cache_creation_input_tokens || 0;
      var regularInput = Math.max(0, inputTokens - cacheRead - cacheCreation);
      var isOpusModel = usedModel.id.indexOf('opus') !== -1;
      var pricing = isOpusModel ? PRICING_OPUS : PRICING_SONNET;
      var cost =
        (regularInput * pricing.input) +
        (outputTokens * pricing.output) +
        (cacheRead * pricing.cache_read) +
        (cacheCreation * pricing.cache_creation);
      await supabase.from('api_usage').insert({
        workflow: workflow || 'unknown',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_read_tokens: cacheRead,
        cache_creation_tokens: cacheCreation,
        cost_usd: Math.round(cost * 1000000) / 1000000,
      });
    } catch (logError) {
      console.error('Failed to log usage:', logError);
    }

    // Cross-project tracker
    try {
      var trackerUrl = process.env.TRACKER_SUPABASE_URL;
      var trackerKey = process.env.TRACKER_SUPABASE_KEY;
      if (trackerUrl && trackerKey) {
        var trackerInputTokens = usage.input_tokens || 0;
        var trackerOutputTokens = usage.output_tokens || 0;
        var trackerCost = (trackerInputTokens * 15.00 / 1000000) + (trackerOutputTokens * 75.00 / 1000000);
        var trackerResp = await fetch(trackerUrl + '/rest/v1/api_usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': trackerKey,
            'Authorization': 'Bearer ' + trackerKey,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            app_id: 'HVC-Clinic',
            model: usedModel.id,
            prompt_tokens: trackerInputTokens,
            completion_tokens: trackerOutputTokens,
            estimated_cost_usd: Math.round(trackerCost * 1000000) / 1000000,
          }),
        });
        if (!trackerResp.ok) {
          var trackerErrBody = await trackerResp.text();
          console.error('[HVC Tracker] Insert failed:', trackerResp.status, trackerErrBody);
        }
      }
    } catch (e) {
      console.error('[HVC Tracker] Error:', e.message);
    }

    if (workflow !== 'general' && workflow !== 'error') {
      try {
        var lastUser = scrubbedMessages.filter(function(m) { return m.role === 'user'; }).pop();
        var lastUserMsg = '';
        if (lastUser) {
          if (Array.isArray(lastUser.content)) {
            var textBlocks = lastUser.content.filter(function(b) { return b.type === 'text'; });
            lastUserMsg = textBlocks.map(function(b) { return b.text; }).join(' ');
          } else {
            lastUserMsg = lastUser.content || '';
          }
        }
        await supabase.from('encounters').insert({
          patient_code: patientCode || 'CHAT-' + Date.now().toString(36).toUpperCase(),
          workflow: workflow,
          subtype: null,
          fields: scrubObject({ chat_input: lastUserMsg, mode: 'chat' }),
          output: scrubbedOutput,
        });
      } catch (err) {
        console.error('Encounter save failed:', err.message);
      }
    }

    return NextResponse.json({
      output: scrubbedOutput,
      workflow: workflow,
      patientCode: patientCode,
      model: usedModel.label,
      tier: tier,
      usage: {
        input_tokens: usage.input_tokens || 0,
        output_tokens: usage.output_tokens || 0,
        cache_read: usage.cache_read_input_tokens || 0,
        cache_creation: usage.cache_creation_input_tokens || 0,
      },
    }, { headers: getCorsHeaders(request) });
  } catch (err) {
    console.error('[Chat API Error]', err);
    return NextResponse.json(
      { error: 'Failed to generate response', details: err.message },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}
