'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// HVC Workflow — Epic-Stealth Design
// Mimics Epic In Basket look and feel
// ============================================

// ============================================
// PHI DETECTION ENGINE
// Only blocks items from the Patient ID box.
// Everything else passes through freely.
// ============================================

const scanForPHI = (text, patientInfoStr) => {
  if (!text || text.trim().length === 0) return [];
  if (!patientInfoStr || patientInfoStr.trim().length === 0) return [];
  var terms = buildPatientScrubTerms(patientInfoStr);
  var findings = [];
  var m;
  // Scan for patient names
  terms.names.forEach(function(name) {
    if (!name || name.length < 2) return;
    var escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var nr = new RegExp('\\b' + escaped + '\\b', 'gi');
    while ((m = nr.exec(text)) !== null) {
      var alreadyCovered = findings.some(function(f) { return m.index >= f.start && m.index < f.end; });
      if (!alreadyCovered) {
        findings.push({ type: 'patient_id', match: m[0], start: m.index, end: m.index + m[0].length, replacement: '[Patient]' });
      }
    }
  });
  // Scan for DOB patterns
  terms.dobPatterns.forEach(function(dob) {
    var idx = 0;
    while ((idx = text.indexOf(dob, idx)) !== -1) {
      var alreadyCovered = findings.some(function(f) { return idx >= f.start && idx < f.end; });
      if (!alreadyCovered) {
        findings.push({ type: 'patient_id', match: dob, start: idx, end: idx + dob.length, replacement: '[DOB]' });
      }
      idx += dob.length;
    }
  });
  // Scan for literal strings (MRN numbers, phone numbers, IDs)
  terms.literals.forEach(function(lit) {
    var idx = 0;
    while ((idx = text.indexOf(lit, idx)) !== -1) {
      var alreadyCovered = findings.some(function(f) { return idx >= f.start && idx < f.end; });
      if (!alreadyCovered) {
        findings.push({ type: 'patient_id', match: lit, start: idx, end: idx + lit.length, replacement: '[ID]' });
      }
      idx += lit.length;
    }
  });
  findings.sort(function(a, b) { return a.start - b.start || b.end - a.end; });
  var deduped = [];
  for (var i = 0; i < findings.length; i++) {
    var f = findings[i];
    var dominated = false;
    for (var j = 0; j < deduped.length; j++) {
      if (f.start < deduped[j].end && f.end > deduped[j].start) { dominated = true; break; }
    }
    if (!dominated) deduped.push(f);
  }
  return deduped;
};

const PATIENT_ID_SKIP_WORDS = new Set(['male','female','man','woman','boy','girl','patient','pt','dob','age','yr','yrs','year','years','old','new','follow','up','followup','mrn','sex','gender','race','ethnicity','address','city','state','zip','phone','cell','home','work','fax','email','primary','secondary','emergency','contact','insurance','plan','group','id','number','no','date','of','birth','the','and','for','with']);

const addPhoneVariants = (phone, literals) => {
  var digits = phone.replace(/\D/g, '');
  literals.push(phone);
  if (digits.length === 10) {
    literals.push(digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6));
    literals.push('(' + digits.slice(0,3) + ') ' + digits.slice(3,6) + '-' + digits.slice(6));
    literals.push(digits.slice(0,3) + '.' + digits.slice(3,6) + '.' + digits.slice(6));
    literals.push(digits.slice(0,3) + ' ' + digits.slice(3,6) + ' ' + digits.slice(6));
    literals.push(digits);
  }
};

const buildPatientScrubTerms = (info) => {
  if (!info || info.trim().length === 0) return { names: [], dobPatterns: [], literals: [] };
  var names = [];
  var dobPatterns = [];
  var literals = [];
  var text = info;

  // 1. Extract MRN anywhere: "MRN: M000000000" or "MRN 12345"
  var mrnRe = /\bMRN\s*[:#]?\s*([A-Za-z]?\d{4,})/gi;
  var mm;
  while ((mm = mrnRe.exec(text)) !== null) {
    literals.push(mm[1]);
  }
  text = text.replace(/\bMRN\s*[:#]?\s*[A-Za-z]?\d{4,}/gi, ' ');

  // 2. Extract phone numbers: "Phone: 360-708-0226" or standalone
  var phoneRe = /(?:Phone\s*[:#]?\s*)?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/gi;
  while ((mm = phoneRe.exec(text)) !== null) {
    var numMatch = mm[0].match(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/);
    if (numMatch) addPhoneVariants(numMatch[0], literals);
  }
  text = text.replace(/(?:Phone\s*[:#]?\s*)?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/gi, ' ');

  // 3. Remove phone type tags: (H), (W), (C), (M)
  text = text.replace(/\([HWCM]\)/gi, ' ');

  // 4. Process remaining tokens
  var parts = text.split(/\s+/);
  parts.forEach(function(p) {
    if (!p) return;
    // Date pattern
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(p)) {
      var dateParts = p.split(/[\/\-]/);
      var month = dateParts[0];
      var day = dateParts[1];
      var year = dateParts[2];
      var fullYear = year.length === 2 ? (parseInt(year) > 50 ? '19' + year : '20' + year) : year;
      var shortYear = fullYear.slice(-2);
      var padMonth = month.length === 1 ? '0' + month : month;
      var padDay = day.length === 1 ? '0' + day : day;
      dobPatterns.push(padMonth + '/' + padDay + '/' + fullYear);
      dobPatterns.push(padMonth + '-' + padDay + '-' + fullYear);
      dobPatterns.push(padMonth + '/' + padDay + '/' + shortYear);
      dobPatterns.push(padMonth + '-' + padDay + '-' + shortYear);
      dobPatterns.push(month + '/' + day + '/' + fullYear);
      dobPatterns.push(month + '-' + day + '-' + fullYear);
      dobPatterns.push(month + '/' + day + '/' + shortYear);
      dobPatterns.push(fullYear + '-' + padMonth + '-' + padDay);
      return;
    }
    // Clean trailing punctuation
    var cleaned = p.replace(/[,;.:]+$/, '');
    if (cleaned.length < 2) return;
    // Skip common non-name tokens
    if (PATIENT_ID_SKIP_WORDS.has(cleaned.toLowerCase())) return;
    // Skip pure numbers
    if (/^\d+$/.test(cleaned)) return;
    // Skip age abbreviation: "y.o", "y.o."
    if (/^y\.?o\.?$/i.test(cleaned)) return;
    // Skip parenthetical tags
    if (/^\(.*\)$/.test(cleaned)) return;
    // Alphanumeric IDs (like M000000000)
    if (/^[A-Za-z]\d{4,}$/.test(cleaned)) {
      literals.push(cleaned);
      return;
    }
    // Everything else with letters is a name
    if (/[A-Za-z]/.test(cleaned)) {
      names.push(cleaned);
    }
  });
  literals = literals.filter(function(v, i, a) { return a.indexOf(v) === i; });
  return { names: names, dobPatterns: dobPatterns, literals: literals };
};

const scrubPatientInfo = (text, info) => {
  if (!text || !info || info.trim().length === 0) return text;
  var terms = buildPatientScrubTerms(info);
  var result = text;
  // Scrub DOB patterns first (longer matches first)
  terms.dobPatterns.sort(function(a, b) { return b.length - a.length; });
  terms.dobPatterns.forEach(function(dob) {
    while (result.indexOf(dob) !== -1) {
      result = result.split(dob).join('[DOB]');
    }
  });
  // Scrub literal strings (MRN numbers, phone numbers, IDs) — longer first
  terms.literals.sort(function(a, b) { return b.length - a.length; });
  terms.literals.forEach(function(lit) {
    while (result.indexOf(lit) !== -1) {
      result = result.split(lit).join('[ID]');
    }
  });
  // Scrub full name (all parts together)
  if (terms.names.length > 1) {
    var fullName = terms.names.join(' ');
    var fullNameRegex = new RegExp(fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(fullNameRegex, '[Patient]');
    // Also try reversed (Last, First)
    var reversed = terms.names[terms.names.length - 1] + ',? ' + terms.names[0];
    var revRegex = new RegExp(reversed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(revRegex, '[Patient]');
  }
  // Scrub individual name parts
  terms.names.forEach(function(name) {
    var nameRegex = new RegExp('\\b' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
    result = result.replace(nameRegex, '[Patient]');
  });
  // Clean up double-replacements like "[Patient] [Patient]"
  while (result.indexOf('[Patient] [Patient]') !== -1) {
    result = result.split('[Patient] [Patient]').join('[Patient]');
  }
  return result;
};

const cleanPHI = (text, findings) => {
  if (!findings || findings.length === 0) return text;
  const sorted = [...findings].sort((a, b) => b.start - a.start);
  let cleaned = text;
  for (const f of sorted) {
    cleaned = cleaned.substring(0, f.start) + f.replacement + cleaned.substring(f.end);
  }
  return cleaned;
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [phiFindings, setPhiFindings] = useState([]);
  const [attachedImage, setAttachedImage] = useState(null);
  const [patientInfo, setPatientInfo] = useState('');
  const [phiReviewOpen, setPhiReviewOpen] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);
  const [stealthPanel, setStealthPanel] = useState(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const [adminPrompt, setAdminPrompt] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [reviewData, setReviewData] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [expandedReview, setExpandedReview] = useState({});
  const [balance, setBalance] = useState(null);
  const [balanceDetail, setBalanceDetail] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (authenticated && inputRef.current) inputRef.current.focus();
  }, [authenticated]);

  const phiTimerRef = useRef(null);
  useEffect(() => {
    clearTimeout(phiTimerRef.current);
    if (!input.trim()) { setPhiFindings([]); return; }
    phiTimerRef.current = setTimeout(() => {
      setPhiFindings(scanForPHI(input, patientInfo));
    }, 300);
    return () => clearTimeout(phiTimerRef.current);
  }, [input, patientInfo]);

  useEffect(() => {
    if (authenticated) fetchBalance();
  }, [authenticated]);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/hvc/balance');
      if (res.ok) setBalance(await res.json());
    } catch {}
  };

  const handleAuth = async () => {
    try {
      const res = await fetch('/api/hvc/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', pin }),
      });
      const data = await res.json();
      if (data.valid) { setAuthenticated(true); setPinError(''); }
      else { setPinError('Invalid PIN'); setPin(''); }
    } catch { setPinError('Connection error'); }
  };

  function markdownToHtml(text) {
    var result = typeof text === 'string' ? text : '';
    result = result.replace(/&/g, '&amp;');
    result = result.replace(/</g, '&lt;');
    result = result.replace(/>/g, '&gt;');
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/\n/g, '<br>');
    return result;
  }

  const copyToClipboard = async (text, id, setter, html) => {
    const setFn = setter || setCopySuccess;
    try {
      if (html && navigator.clipboard && navigator.clipboard.write) {
        var blob = new Blob([html], { type: 'text/html' });
        var item = new ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([item]);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.focus(); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
      setFn(id); setTimeout(() => setFn(null), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setFn(id); setTimeout(() => setFn(null), 2000);
      } catch {
        try {
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
          document.body.appendChild(ta); ta.focus(); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta);
          setFn(id); setTimeout(() => setFn(null), 2000);
        } catch { alert('Copy failed.'); }
      }
    }
  };

  const handleCleanAll = () => {
    if (phiFindings.length === 0) return;
    setInput(cleanPHI(input, phiFindings));
    setPhiFindings([]); setPhiReviewOpen(false);
    if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px'; }
  };

  const handleRemoveFinding = (index) => {
    const f = phiFindings[index];
    const cleaned = input.substring(0, f.start) + f.replacement + input.substring(f.end);
    setInput(cleaned);
    setPhiFindings(scanForPHI(cleaned, patientInfo));
  };

  const handleTripleTap = () => {
    tapCountRef.current++;
    clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 600);
    if (tapCountRef.current >= 3) { setStealthMode(p => !p); setStealthPanel(null); tapCountRef.current = 0; }
  };

  const handleFileAttach = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Only image files supported.'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Image too large. Max 10MB.'); return; }
    const reader = new FileReader();
    reader.onload = function() {
      const b64 = reader.result.split(',')[1];
      setAttachedImage({ base64: b64, mediaType: file.type, name: file.name, preview: reader.result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && !attachedImage) return;
    if (loading) return;
    if (phiFindings.length > 0) {
      alert(phiFindings.length + ' PHI item(s) detected. Clean before sending.');
      return;
    }
    // Scrub patient-specific PHI before sending
    var scrubbed = scrubPatientInfo(trimmed, patientInfo);
    var userContent, displayText;
    displayText = scrubbed || '(attached photo)';
    if (attachedImage) {
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: attachedImage.mediaType, data: attachedImage.base64 } },
        { type: 'text', text: scrubbed || 'Please transcribe this handwritten document exactly as written, preserving the format. Output clean text ready to paste into a medical chart.' }
      ];
    } else {
      userContent = scrubbed;
    }
    var imgPreview = attachedImage ? attachedImage.preview : null;
    const userMsg = { role: 'user', content: userContent, displayContent: displayText, imagePreview: imgPreview };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages); setInput(''); setAttachedImage(null); setPhiFindings([]); setLoading(true);
    if (inputRef.current) inputRef.current.style.height = 'auto';
    try {
      // Cloudflare Worker route preserved for reference — kairos uses the in-repo route now:
      // const res = await fetch('https://hvc-chat.firekrakerproductions.workers.dev', {
      const res = await fetch('/api/hvc/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'servers_busy') {
          setMessages([...updatedMessages, { role: 'assistant', content: data.message || 'Claude servers are busy. Try again in a moment.', workflow: 'error' }]);
          setLoading(false); return;
        }
        throw new Error('API error: ' + res.status);
      }
      setMessages([...updatedMessages, { role: 'assistant', content: data.output, workflow: data.workflow || 'general', patientCode: data.patientCode || null, model: data.model || null, tier: data.tier || null }]);
      fetchBalance();
    } catch (err) {
      console.error('Send error:', err);
      setMessages([...updatedMessages, { role: 'assistant', content: 'Error generating response. Please try again.', workflow: 'error' }]);
    } finally { setLoading(false); if (inputRef.current) inputRef.current.focus(); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handleNewChat = () => { setMessages([]); setInput(''); setPatientInfo(''); setAttachedImage(null); setPhiFindings([]); setPhiReviewOpen(false); if (inputRef.current) inputRef.current.style.height = 'auto'; };

  const loadAdmin = async () => { setAdminLoading(true); try { const r = await fetch('/api/hvc/admin'); const d = await r.json(); setAdminPrompt(d.prompt || ''); } catch { setAdminPrompt('Error loading'); } setAdminLoading(false); };
  const saveAdmin = async () => { setAdminLoading(true); setAdminSaved(false); try { await fetch('/api/hvc/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: adminPrompt }) }); setAdminSaved(true); setTimeout(() => setAdminSaved(false), 2000); } catch { alert('Error saving'); } setAdminLoading(false); };
  const loadAnalytics = async () => { setAnalyticsLoading(true); try { const r = await fetch('/api/hvc/analytics'); setAnalyticsData(await r.json()); } catch { setAnalyticsData(null); } setAnalyticsLoading(false); };
  const loadReview = async () => { setReviewLoading(true); try { const r = await fetch('/api/hvc/review'); const d = await r.json(); setReviewData(d.encounters || []); } catch { setReviewData([]); } setReviewLoading(false); };

  const workflowLabel = (wf) => ({ provider_callback: 'Callback', coumadin_clinic: 'Coumadin', mychart: 'MyChart', checkout_orders: 'Checkout', med_refill: 'Refill', general: 'General', error: 'Error' }[wf] || wf);
  const workflowColor = (wf) => ({ provider_callback: '#1a73e8', coumadin_clinic: '#e8710a', mychart: '#0d652d', checkout_orders: '#7b1fa2', med_refill: '#c62828', general: '#5f6368', error: '#d93025' }[wf] || '#5f6368');

  const balanceColor = () => {
    if (!balance) return '#fff';
    const r = balance.remaining || 0;
    if (r < 5) return '#ff6b6b';
    if (r < 10) return '#ffd93d';
    return '#69db7c';
  };

  if (!authenticated) {
    return (
      <div style={ep.pinOuter}>
        <div style={ep.pinCenter}>
          <div style={ep.pinBox}>
            <div style={ep.pinTitle}>Sign In</div>
            <div style={ep.pinSubtitle}>Enter access code to continue</div>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} placeholder="••••" style={ep.pinInput} autoFocus />
            {pinError && <div style={ep.pinError}>{pinError}</div>}
            <button onClick={handleAuth} style={ep.pinBtn}>Log In</button>
          </div>
        </div>
      </div>
    );
  }

  const stealthItems = stealthMode ? [{ key: 'admin', label: 'System Prompt' }, { key: 'review', label: 'Completed Work' }, { key: 'analytics', label: 'Reports' }] : [];

  const handleSidebarClick = (key) => {
    setStealthPanel(key);
    if (key === 'admin') loadAdmin(); if (key === 'review') loadReview(); if (key === 'analytics') loadAnalytics();
  };

  function getModelLabel(msg) {
    if (msg.role !== 'assistant' || !msg.model) return null;
    var tier = msg.tier;
    var model = msg.model;
    var modelLower = model.toLowerCase();
    // Derive the per-message label dynamically from the actual model string or
    // worker-supplied label — avoids the old bug where Opus 4.5 fallback still
    // displayed as "Opus 4.6".
    var label = model;
    if (modelLower.indexOf('opus-4-7') !== -1 || modelLower === 'opus 4.7') {
      label = 'Opus 4.7';
    } else if (modelLower.indexOf('opus-4-6') !== -1 || modelLower.indexOf('opus-4-20250901') !== -1 || modelLower === 'opus 4.6') {
      label = 'Opus 4.6';
    } else if (modelLower.indexOf('opus-4-5') !== -1 || modelLower === 'opus 4.5') {
      label = 'Opus 4.5';
    } else if (modelLower.indexOf('sonnet-4-6') !== -1 || modelLower === 'sonnet 4.6') {
      label = 'Sonnet 4.6';
    } else if (modelLower.indexOf('sonnet') !== -1) {
      label = model;
    }
    // A call is "fallback" when the served model does not match the requested tier.
    var isFallback = false;
    if (tier === 'opus' && modelLower.indexOf('opus') === -1) isFallback = true;
    if (tier === 'sonnet' && modelLower.indexOf('sonnet') === -1) isFallback = true;
    // Tier headline labels match the migration: Opus tier routes to 4.7 with 4.6
    // fallback; Sonnet tier routes to 4.6.
    var tierName = (tier === 'sonnet') ? 'Sonnet 4.6' : 'Opus 4.7 (fallback: 4.6)';
    return { label: label, isFallback: isFallback, tierName: tierName };
  }

  const hasMessages = messages.length > 0;

  return (
    <div style={ep.app}>
      <div style={ep.topBar}>
        <div style={ep.topBarLeft}>
          <span style={ep.topBarLogo} onClick={handleTripleTap}>HVC</span>
          <span style={ep.topBarEnv}>Hyperspace – PHS MOB HEART AND VASC CLINIC – Production</span>
        </div>
        <div style={ep.topBarRight}>
          {balance && (
            <span onClick={() => stealthMode && setBalanceDetail(p => !p)} style={{ fontSize: '11px', color: balanceColor(), cursor: stealthMode ? 'pointer' : 'default', marginRight: '12px', fontWeight: '600' }}>
              ${(balance.remaining || 0).toFixed(2)}
            </span>
          )}
          <span style={ep.topBarSearch}>⌕ Search (Ctrl+Space)</span>
        </div>
      </div>
      <div style={ep.navBar}>
        <span style={ep.navItem}>In Basket</span><span style={ep.navSep}>|</span>
        <span style={ep.navItemDim}>Home</span><span style={ep.navItemDim}>Schedule</span><span style={ep.navItemDim}>Patient Lookup</span>
        {hasMessages && <button onClick={handleNewChat} style={ep.navNewBtn}>New Message</button>}
      </div>
      <div style={ep.actionBar}>
        <span style={ep.actionLabel}>Done</span><span style={ep.actionLabel}>Reply</span><span style={ep.actionLabel}>Forward</span><span style={ep.actionLabel}>Follow-up</span>
        {stealthPanel === 'admin' && <button onClick={saveAdmin} style={ep.actionBtnPrimary} disabled={adminLoading}>{adminSaved ? '✓ Saved' : 'Save Prompt'}</button>}
      </div>
      <div style={ep.filterBar}>
        <span style={ep.filterTag}>▼ Provider = Ballard, Steve R, NP</span>
        <span style={ep.filterItem}>⚙ Sort</span><span style={ep.filterItem}>▼ Filter</span>
      </div>
      <div style={ep.body}>
        <div style={ep.sidebar}>
          <div style={ep.sidebarSection}>
            <div style={ep.sidebarTitle}>My Messages</div>
            <div onClick={() => setStealthPanel(null)} style={{ ...ep.sidebarItem, fontWeight: !stealthPanel ? '700' : '400', backgroundColor: !stealthPanel ? '#e8f4f0' : 'transparent' }}>
              <span>Result Notes</span><span style={ep.sidebarCount}>{messages.filter(m => m.role === 'assistant').length > 0 ? messages.filter(m => m.role === 'assistant').length : ''}</span>
            </div>
          </div>
          {stealthMode && <div style={ep.sidebarSection}>
            <div style={ep.sidebarTitle}>Admin</div>
            {stealthItems.map(item => (
              <div key={item.key} onClick={() => handleSidebarClick(item.key)} style={{ ...ep.sidebarItem, fontWeight: stealthPanel === item.key ? '700' : '400', backgroundColor: stealthPanel === item.key ? '#e8f4f0' : 'transparent' }}><span>{item.label}</span></div>
            ))}
          </div>}
          <div style={ep.sidebarSection}><div style={ep.sidebarItem} onClick={() => {}}><span>⌕ Search</span></div></div>
        </div>
        <div style={ep.main}>
          {!stealthPanel && (
            <div style={ep.chatWrap}>
              {!hasMessages && <div style={ep.chatEmpty}><div style={ep.chatEmptyIcon}>💬</div><div style={ep.chatEmptyTitle}>Select a message to get started</div><div style={ep.chatEmptyHint}>Type a clinical task below to begin.</div></div>}
              {hasMessages && (
                <div style={ep.chatMessages}>
                  {messages.map((msg, i) => (
                    <div key={i} style={msg.role === 'user' ? ep.msgUser : ep.msgAssistant}>
                      {stealthMode && msg.role === 'assistant' && msg.workflow && msg.workflow !== 'error' && (
                        <div style={ep.workflowTag}><span style={{ ...ep.wfDot, backgroundColor: workflowColor(msg.workflow) }} />{workflowLabel(msg.workflow)}{msg.patientCode && <span style={ep.wfCode}> · {msg.patientCode}</span>}</div>
                      )}
                      {msg.imagePreview && <img src={msg.imagePreview} style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px', marginTop: '4px', marginBottom: '4px' }} alt="attached" />}
                      {msg.role === 'user'
                        ? <div style={ep.msgUserText}>{msg.displayContent || (typeof msg.content === 'string' ? msg.content : '(attached photo)')}</div>
                        : <div style={ep.msgAssistantText} dangerouslySetInnerHTML={{__html: markdownToHtml(typeof msg.content === 'string' ? msg.content : '')}} />}
                      {msg.role === 'assistant' && msg.workflow !== 'error' && <button onClick={() => copyToClipboard(msg.content, i, null, markdownToHtml(typeof msg.content === 'string' ? msg.content : ''))} style={ep.copyBtn}>{copySuccess === i ? '✓ Copied' : '⧉ Copy'}</button>}
                      {(function() { var ml = getModelLabel(msg); if (!ml) return null; if (ml.isFallback) return <span style={{ display: 'inline-block', marginTop: '2px' }}><span style={{ fontSize: '10px', color: '#e65100' }}>{ml.label}</span><br /><span style={{ fontSize: '8px', color: '#999' }}>{ml.tierName + ' servers busy — auto-switched, not an app issue'}</span></span>; return <span style={{ fontSize: '10px', color: '#888', marginTop: '2px', display: 'inline-block' }}>{ml.label}</span>; })()}
                    </div>
                  ))}
                  {loading && <div style={ep.msgAssistant}><div style={ep.loadingDots}><span style={ep.dot}>●</span><span style={{ ...ep.dot, animationDelay: '0.2s' }}>●</span><span style={{ ...ep.dot, animationDelay: '0.4s' }}>●</span></div></div>}
                  <div ref={messagesEndRef} />
                </div>
              )}
              {phiReviewOpen && phiFindings.length > 0 && (
                <div style={ep.phiPanel}>
                  <div style={ep.phiPanelHeader}>
                    <span style={ep.phiPanelTitle}>PHI Detected ({phiFindings.length})</span>
                    <div style={ep.phiPanelBtns}><button onClick={handleCleanAll} style={ep.phiCleanAllBtn}>Clean All</button><button onClick={() => setPhiReviewOpen(false)} style={ep.phiCloseBtn}>×</button></div>
                  </div>
                  <div style={ep.phiList}>
                    {phiFindings.map((f, i) => (
                      <div key={i} style={ep.phiItem}>
                        <span style={ep.phiTypeTag}>{f.type}</span>
                        <span style={ep.phiMatch}>{f.match}</span>
                        <span style={ep.phiArrow}>→</span>
                        <span style={ep.phiReplacement}>{f.replacement}</span>
                        <div style={ep.phiItemBtns}>
                          <button onClick={() => handleRemoveFinding(i)} style={ep.phiStripBtn} title="Replace this one">Strip</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={ep.chatInputWrap}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <input value={patientInfo} onChange={function(e) { setPatientInfo(e.target.value); }} placeholder="Patient name DOB (e.g. John Smith 4/2/1959)" style={{ flex: 1, border: '1px solid ' + (patientInfo.trim() ? '#4caf50' : '#c4c9cc'), borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontFamily: 'Segoe UI, system-ui, sans-serif', color: '#333', backgroundColor: patientInfo.trim() ? '#f1f8e9' : '#fff', outline: 'none' }} />
                  {patientInfo.trim() && <span style={{ fontSize: '10px', color: '#4caf50', flexShrink: 0 }}>PHI lock</span>}
                </div>
                {attachedImage && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '4px' }}><img src={attachedImage.preview} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '3px' }} alt="preview" /><span style={{ fontSize: '11px', color: '#555', flex: 1 }}>{attachedImage.name}</span><button onClick={() => setAttachedImage(null)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: '16px', padding: '0 4px', fontWeight: 'bold' }}>x</button></div>}
                <input type="file" ref={fileInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileAttach} />
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', flex: 1 }}>
                <button onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px 2px', color: '#666', flexShrink: 0 }} title="Attach photo">+</button>
                <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Type clinical task here..." style={{ ...ep.chatInput, borderColor: phiFindings.length > 0 ? '#c62828' : '#c4c9cc' }} rows={1} />
                </div>
                <div style={ep.chatBtnGroup}>
                  {phiFindings.length > 0 && <>
                    <button onClick={handleCleanAll} style={ep.phiCleanBtn} title="Remove all detected PHI">Clean ({phiFindings.length})</button>
                    <button onClick={() => setPhiReviewOpen(!phiReviewOpen)} style={ep.phiReviewBtn} title="Review PHI findings">Review</button>
                  </>}
                  <button onClick={handleNewChat} style={{ padding: '6px 12px', border: '1px solid #c4c9cc', background: '#fff', color: '#555', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', fontFamily: 'Segoe UI, system-ui, sans-serif', fontWeight: '500' }} title="Clear chat for new patient">New</button>
                  <button onClick={handleSend} disabled={(!input.trim() && !attachedImage) || loading || phiFindings.length > 0} style={{ ...ep.chatSendBtn, opacity: (input.trim() || attachedImage) && !loading && phiFindings.length === 0 ? 1 : 0.3 }}>Send</button>
                </div>
              </div>
            </div>
          )}
          {stealthPanel === 'admin' && <div style={ep.stealthContent}><div style={ep.stealthTitle}>System Prompt</div>{adminLoading ? <div style={ep.emptyText}>Loading...</div> : <textarea value={adminPrompt} onChange={e => setAdminPrompt(e.target.value)} style={ep.adminTextarea} rows={20} />}</div>}
          {stealthPanel === 'analytics' && (
            <div style={ep.stealthContent}><div style={ep.stealthTitle}>Reports</div>
              {analyticsLoading ? <div style={ep.emptyText}>Loading...</div> : analyticsData ? (
                <div style={ep.analyticsGrid}>
                  <div style={ep.statCard}><div style={ep.statNum}>{analyticsData.today || 0}</div><div style={ep.statLabel}>Today</div></div>
                  <div style={ep.statCard}><div style={ep.statNum}>{analyticsData.week || 0}</div><div style={ep.statLabel}>This Week</div></div>
                  <div style={ep.statCard}><div style={ep.statNum}>{analyticsData.month || 0}</div><div style={ep.statLabel}>This Month</div></div>
                  <div style={ep.statCard}><div style={ep.statNum}>{analyticsData.total || 0}</div><div style={ep.statLabel}>All Time</div></div>
                  {analyticsData.byWorkflow && <div style={ep.wfBreakdown}><div style={ep.wfBreakdownTitle}>By Workflow</div>{Object.entries(analyticsData.byWorkflow).map(([wf, count]) => <div key={wf} style={ep.wfBreakdownRow}><span style={{ color: workflowColor(wf) }}>{workflowLabel(wf)}</span><span style={ep.wfBreakdownCount}>{count}</span></div>)}</div>}
                </div>
              ) : <div style={ep.emptyText}>No analytics data</div>}
            </div>
          )}
          {stealthPanel === 'review' && (
            <div style={ep.stealthContent}><div style={ep.stealthTitle}>Today&apos;s Encounters</div>
              {reviewLoading ? <div style={ep.emptyText}>Loading...</div> : reviewData.length === 0 ? <div style={ep.emptyText}>No encounters today</div> : (
                <div>{reviewData.map((enc, i) => (
                  <div key={i} style={ep.reviewItem}>
                    <div style={ep.reviewRow} onClick={() => setExpandedReview(p => ({ ...p, [i]: !p[i] }))}>
                      <span style={{ color: workflowColor(enc.workflow), fontWeight: '600', minWidth: '70px' }}>{workflowLabel(enc.workflow)}</span>
                      <span style={ep.reviewCode}>{enc.patient_code}</span>
                      <span style={ep.reviewTime}>{new Date(enc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span style={ep.reviewChev}>{expandedReview[i] ? '▾' : '▸'}</span>
                    </div>
                    {expandedReview[i] && <div style={ep.reviewBody}><div style={ep.reviewText}>{enc.output}</div></div>}
                  </div>
                ))}</div>
              )}
            </div>
          )}
          {stealthMode && balanceDetail && balance && (
            <div style={{ position: 'fixed', top: '36px', right: '12px', background: '#fff', border: '1px solid ' + BORDER, borderRadius: '4px', padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 1000, fontSize: '12px', minWidth: '180px' }}>
              <div style={{ fontWeight: '700', marginBottom: '8px', color: TEXT_DARK }}>API Balance</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: TEXT_LIGHT }}>Starting:</span><span>${(balance.starting || 0).toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: TEXT_LIGHT }}>Spent:</span><span style={{ color: RED }}>${(balance.spent || 0).toFixed(4)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: '700' }}><span>Remaining:</span><span style={{ color: balanceColor() }}>${(balance.remaining || 0).toFixed(2)}</span></div>
              {balance.todayCount != null && <div style={{ borderTop: '1px solid ' + BORDER, marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: TEXT_LIGHT }}>Today:</span><span>{balance.todayCount} calls · ${(balance.todaySpent || 0).toFixed(4)}</span></div>}
              <button onClick={() => setBalanceDetail(false)} style={{ marginTop: '8px', width: '100%', padding: '3px', border: '1px solid ' + BORDER, background: '#f8f9fa', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', color: TEXT_LIGHT }}>Close</button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }`}</style>
    </div>
  );
}

const TEAL = '#006D5B';
const TEAL_DARK = '#005A4A';
const TEAL_LIGHT = '#e8f4f0';
const BORDER = '#c4c9cc';
const BG_GRAY = '#f0f1f2';
const TEXT_DARK = '#1a1a1a';
const TEXT_MED = '#4a4a4a';
const TEXT_LIGHT = '#717579';
const FONT = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
const RED = '#c62828';
const RED_LIGHT = '#ffebee';

const ep = {
  app: { minHeight: '100vh', backgroundColor: BG_GRAY, fontFamily: FONT, color: TEXT_DARK, display: 'flex', flexDirection: 'column', fontSize: '13px' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: TEAL, color: '#fff', padding: '4px 12px', height: '30px', fontSize: '12px' },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  topBarLogo: { fontWeight: '700', fontSize: '14px', cursor: 'default', userSelect: 'none', letterSpacing: '1px' },
  topBarEnv: { fontSize: '11px', opacity: 0.85 },
  topBarRight: { display: 'flex', alignItems: 'center' },
  topBarSearch: { fontSize: '11px', opacity: 0.7, cursor: 'default' },
  navBar: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: TEAL_DARK, color: '#fff', padding: '4px 12px', height: '28px', fontSize: '12px' },
  navItem: { fontWeight: '600', cursor: 'default' },
  navItemDim: { opacity: 0.6, cursor: 'default' },
  navSep: { opacity: 0.3 },
  navNewBtn: { marginLeft: 'auto', padding: '2px 10px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '11px', cursor: 'pointer', borderRadius: '3px', fontFamily: FONT },
  actionBar: { display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 12px', backgroundColor: '#e8eaec', borderBottom: '1px solid ' + BORDER, minHeight: '28px', flexWrap: 'wrap' },
  actionLabel: { fontSize: '12px', color: TEXT_MED, cursor: 'default', padding: '2px 6px' },
  actionBtn: { padding: '3px 10px', border: '1px solid ' + BORDER, background: '#fff', color: TEXT_DARK, fontSize: '12px', cursor: 'pointer', borderRadius: '3px', fontFamily: FONT },
  actionBtnPrimary: { padding: '3px 12px', border: '1px solid ' + TEAL, background: TEAL, color: '#fff', fontSize: '12px', cursor: 'pointer', borderRadius: '3px', fontFamily: FONT, fontWeight: '500' },
  filterBar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '3px 12px', backgroundColor: '#f5f6f7', borderBottom: '1px solid ' + BORDER, fontSize: '11px', color: TEXT_LIGHT },
  filterTag: { backgroundColor: '#d4edda', color: '#155724', padding: '1px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '500' },
  filterItem: { cursor: 'default' },
  body: { flex: 1, display: 'flex', overflow: 'hidden' },
  sidebar: { width: '200px', minWidth: '200px', backgroundColor: '#fff', borderRight: '1px solid ' + BORDER, overflow: 'auto', display: 'flex', flexDirection: 'column' },
  sidebarSection: { borderBottom: '1px solid ' + BORDER, padding: '6px 0' },
  sidebarTitle: { fontSize: '11px', fontWeight: '600', color: TEXT_LIGHT, padding: '4px 12px', textTransform: 'uppercase', letterSpacing: '0.3px' },
  sidebarItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', color: TEXT_DARK, borderRadius: '0', transition: 'background 0.1s' },
  sidebarCount: { fontSize: '12px', color: TEXT_LIGHT, fontWeight: '600' },
  main: { flex: 1, overflow: 'auto', backgroundColor: '#fff' },
  chatWrap: { display: 'flex', flexDirection: 'column', height: '100%' },
  chatEmpty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: TEXT_LIGHT },
  chatEmptyIcon: { fontSize: '48px', marginBottom: '12px', opacity: 0.4 },
  chatEmptyTitle: { fontSize: '15px', fontWeight: '500', color: TEXT_MED },
  chatEmptyHint: { fontSize: '12px', color: TEXT_LIGHT, marginTop: '6px' },
  chatMessages: { flex: 1, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  msgUser: { alignSelf: 'flex-end', maxWidth: '80%', padding: '8px 12px', backgroundColor: TEAL_LIGHT, borderRadius: '8px 8px 2px 8px', fontSize: '13px' },
  msgAssistant: { alignSelf: 'flex-start', maxWidth: '85%', padding: '8px 12px', backgroundColor: '#f8f9fa', border: '1px solid ' + BORDER, borderRadius: '2px 8px 8px 8px', fontSize: '13px' },
  msgUserText: { color: TEXT_DARK, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  msgAssistantText: { color: '#000000', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  workflowTag: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: TEXT_LIGHT, marginBottom: '4px', fontWeight: '500' },
  wfDot: { width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' },
  wfCode: { fontFamily: 'monospace', fontSize: '10px' },
  copyBtn: { display: 'inline-block', marginTop: '6px', padding: '2px 8px', border: '1px solid ' + BORDER, background: '#fff', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', color: TEXT_LIGHT, fontFamily: FONT },
  loadingDots: { display: 'flex', gap: '3px', padding: '2px 0' },
  dot: { fontSize: '10px', color: TEXT_LIGHT, animation: 'pulse 1.4s infinite both' },
  chatInputWrap: { display: 'flex', alignItems: 'flex-end', padding: '8px 12px', borderTop: '1px solid ' + BORDER, backgroundColor: '#f8f9fa', gap: '8px' },
  chatInput: { flex: 1, border: '1px solid ' + BORDER, borderRadius: '4px', padding: '6px 10px', fontSize: '13px', fontFamily: FONT, lineHeight: '1.4', resize: 'none', color: TEXT_DARK, backgroundColor: '#fff', outline: 'none', overflow: 'hidden', transition: 'border-color 0.2s' },
  chatBtnGroup: { display: 'flex', gap: '4px', alignItems: 'flex-end', flexShrink: 0 },
  chatSendBtn: { padding: '6px 16px', border: 'none', background: TEAL, color: '#fff', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', fontFamily: FONT, fontWeight: '500', transition: 'opacity 0.15s' },
  phiCleanBtn: { padding: '6px 10px', border: '1px solid ' + RED, background: RED, color: '#fff', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', fontFamily: FONT, fontWeight: '500', whiteSpace: 'nowrap' },
  phiReviewBtn: { padding: '6px 8px', border: '1px solid ' + BORDER, background: '#fff', color: TEXT_MED, fontSize: '11px', cursor: 'pointer', borderRadius: '4px', fontFamily: FONT, whiteSpace: 'nowrap' },
  phiPanel: { borderTop: '2px solid ' + RED, backgroundColor: RED_LIGHT, padding: '8px 12px', maxHeight: '200px', overflow: 'auto' },
  phiPanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  phiPanelTitle: { fontSize: '12px', fontWeight: '700', color: RED },
  phiPanelBtns: { display: 'flex', gap: '4px' },
  phiCleanAllBtn: { padding: '2px 10px', border: '1px solid ' + RED, background: RED, color: '#fff', fontSize: '11px', cursor: 'pointer', borderRadius: '3px', fontFamily: FONT, fontWeight: '500' },
  phiCloseBtn: { padding: '2px 8px', border: '1px solid ' + BORDER, background: '#fff', color: TEXT_MED, fontSize: '13px', cursor: 'pointer', borderRadius: '3px', fontFamily: FONT, lineHeight: '1' },
  phiList: { display: 'flex', flexDirection: 'column', gap: '4px' },
  phiItem: { display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 6px', backgroundColor: '#fff', borderRadius: '3px', border: '1px solid #eee', fontSize: '12px', flexWrap: 'wrap' },
  phiTypeTag: { fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: '#fff', backgroundColor: RED, padding: '1px 4px', borderRadius: '2px', flexShrink: 0 },
  phiMatch: { fontWeight: '600', color: RED, wordBreak: 'break-word' },
  phiArrow: { color: TEXT_LIGHT, flexShrink: 0 },
  phiReplacement: { color: TEAL, fontWeight: '500', fontStyle: 'italic' },
  phiItemBtns: { marginLeft: 'auto', display: 'flex', gap: '3px', flexShrink: 0 },
  phiStripBtn: { padding: '1px 6px', border: '1px solid ' + RED, background: '#fff', color: RED, fontSize: '10px', cursor: 'pointer', borderRadius: '2px', fontFamily: FONT },
  phiAllowBtn: { padding: '1px 6px', border: '1px solid ' + TEAL, background: '#fff', color: TEAL, fontSize: '10px', cursor: 'pointer', borderRadius: '2px', fontFamily: FONT },
  stealthContent: { padding: '12px 16px' },
  stealthTitle: { fontSize: '14px', fontWeight: '600', color: TEXT_DARK, marginBottom: '10px' },
  adminTextarea: { width: '100%', border: '1px solid ' + BORDER, borderRadius: '3px', padding: '8px', fontSize: '12px', fontFamily: 'monospace', lineHeight: '1.5', resize: 'vertical', color: TEXT_DARK, boxSizing: 'border-box', outline: 'none' },
  emptyText: { color: TEXT_LIGHT, fontSize: '13px', padding: '20px 0' },
  analyticsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' },
  statCard: { padding: '14px', background: BG_GRAY, borderRadius: '4px', textAlign: 'center', border: '1px solid ' + BORDER },
  statNum: { fontSize: '26px', fontWeight: '700', color: TEXT_DARK },
  statLabel: { fontSize: '11px', color: TEXT_LIGHT, marginTop: '3px' },
  wfBreakdown: { gridColumn: '1 / -1', padding: '10px', background: BG_GRAY, borderRadius: '4px', border: '1px solid ' + BORDER },
  wfBreakdownTitle: { fontSize: '11px', fontWeight: '700', color: TEXT_LIGHT, marginBottom: '6px' },
  wfBreakdownRow: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' },
  wfBreakdownCount: { fontWeight: '700', color: TEXT_DARK },
  reviewItem: { borderBottom: '1px solid #e8eaec' },
  reviewRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', cursor: 'pointer', fontSize: '12px' },
  reviewCode: { color: TEXT_LIGHT, fontSize: '11px', fontFamily: 'monospace' },
  reviewTime: { color: TEXT_LIGHT, fontSize: '11px', marginLeft: 'auto' },
  reviewChev: { color: TEXT_LIGHT, fontSize: '10px' },
  reviewBody: { padding: '8px 12px', backgroundColor: '#f8f9fa' },
  reviewText: { fontSize: '13px', lineHeight: '1.5', color: '#000000', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: FONT },
  pinOuter: { minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: BG_GRAY, fontFamily: FONT },
  pinHeader: { backgroundColor: TEAL, color: '#fff', padding: '6px 12px', fontSize: '12px' },
  pinHeaderText: { opacity: 0.9 },
  pinCenter: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pinBox: { textAlign: 'center', backgroundColor: '#fff', border: '1px solid ' + BORDER, borderRadius: '4px', padding: '32px 40px' },
  pinTitle: { fontSize: '18px', fontWeight: '600', color: TEXT_DARK, marginBottom: '4px' },
  pinSubtitle: { fontSize: '12px', color: TEXT_LIGHT, marginBottom: '20px' },
  pinInput: { display: 'block', margin: '0 auto 10px', padding: '8px 12px', fontSize: '16px', border: '1px solid ' + BORDER, borderRadius: '3px', textAlign: 'center', width: '160px', outline: 'none', fontFamily: FONT, color: TEXT_DARK },
  pinError: { color: RED, fontSize: '12px', marginBottom: '6px' },
  pinBtn: { padding: '6px 20px', border: 'none', background: TEAL, color: '#fff', fontSize: '13px', cursor: 'pointer', borderRadius: '3px', fontFamily: FONT, fontWeight: '500' },
};
