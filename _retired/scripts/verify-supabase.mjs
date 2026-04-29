import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Tiny .env.local loader — this script is dev-only.
const envText = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const url = process.env.KAIROS_SUPABASE_URL;
const serviceKey = process.env.KAIROS_SUPABASE_SERVICE_KEY;
const anonKey = process.env.KAIROS_SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error('FAIL: missing env vars');
  process.exit(1);
}

const server = createClient(url, serviceKey, { auth: { persistSession: false } });
const browser = createClient(url, anonKey);

const { data: serverData, error: serverErr } = await server
  .from('kairos_investigations').select('id').limit(1);
if (serverErr) {
  console.error('FAIL server client:', serverErr.message);
  process.exit(1);
}
console.log(`OK server client: kairos_investigations rows=${serverData.length}`);

const { data: anonData, error: anonErr } = await browser
  .from('kairos_investigations').select('id').limit(1);
if (anonErr) {
  console.log(`OK anon blocked by RLS: ${anonErr.message}`);
} else if (anonData.length === 0) {
  console.log('OK anon returns empty (RLS-filtered, no policy means no rows visible)');
} else {
  console.error('FAIL anon should not see data');
  process.exit(1);
}
