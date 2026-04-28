import { createClient } from '@supabase/supabase-js';

let _serverClient = null;
let _browserClient = null;

export function getServerClient() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerClient called from client side — security violation');
  }
  if (!_serverClient) {
    const url = process.env.KAIROS_SUPABASE_URL;
    const key = process.env.KAIROS_SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error('KAIROS_SUPABASE_URL or KAIROS_SUPABASE_SERVICE_KEY missing from env');
    }
    _serverClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return _serverClient;
}

export function getBrowserClient() {
  if (!_browserClient) {
    const url = process.env.NEXT_PUBLIC_KAIROS_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_KAIROS_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('NEXT_PUBLIC_KAIROS_SUPABASE_URL or NEXT_PUBLIC_KAIROS_SUPABASE_ANON_KEY missing');
    }
    _browserClient = createClient(url, key);
  }
  return _browserClient;
}
