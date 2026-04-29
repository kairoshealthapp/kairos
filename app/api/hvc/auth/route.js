import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Lazy init so Next 14 build-time module evaluation doesn't crash when env
// vars are absent. createClient is invoked on first property access.
var _supabaseClient = null;
var supabase = new Proxy({}, {
  get: function(_, prop) {
    if (!_supabaseClient) {
      _supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
      );
    }
    var v = _supabaseClient[prop];
    return typeof v === 'function' ? v.bind(_supabaseClient) : v;
  }
});

function hashPin(pin) {
  var salt = process.env.PIN_SALT;
  if (!salt) throw new Error('PIN_SALT environment variable is required');
  return crypto.createHash('sha256').update(salt + pin).digest('hex');
}

export async function POST(request) {
  try {
    var missingEnv = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) missingEnv.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_KEY) missingEnv.push('SUPABASE_SERVICE_KEY');
    if (!process.env.PIN_SALT) missingEnv.push('PIN_SALT');
    if (missingEnv.length > 0) {
      return Response.json({ error: 'Missing required env var: ' + missingEnv.join(', ') }, { status: 500 });
    }

    var body = await request.json();
    var action = body.action;
    var pin = body.pin;

    if (action === 'check') {
      var checkResult = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'pin_hash')
        .single();
      return Response.json({ exists: !!(checkResult.data && checkResult.data.value) });
    }

    if (action === 'setup') {
      if (!pin || pin.length < 4) {
        return Response.json({ error: 'PIN must be at least 4 digits' }, { status: 400 });
      }
      var hash = hashPin(pin);
      var setupResult = await supabase
        .from('app_settings')
        .upsert({ key: 'pin_hash', value: hash, updated_at: new Date().toISOString() });
      if (setupResult.error) {
        return Response.json({ error: setupResult.error.message }, { status: 500 });
      }
      return Response.json({ success: true });
    }

    if (action === 'verify') {
      if (!pin) {
        return Response.json({ valid: false, reason: 'no_pin_provided' });
      }
      var verifyHash = hashPin(pin);
      var verifyResult = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'pin_hash')
        .single();
      if (!verifyResult.data || !verifyResult.data.value) {
        // No PIN set yet - first PIN entered becomes the PIN
        var autoSetup = await supabase
          .from('app_settings')
          .upsert({ key: 'pin_hash', value: verifyHash, updated_at: new Date().toISOString() });
        if (autoSetup.error) {
          return Response.json({ error: autoSetup.error.message }, { status: 500 });
        }
        console.log('[Auth] First PIN set via auto-setup');
        return Response.json({ valid: true });
      }
      return Response.json({ valid: verifyResult.data.value === verifyHash });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
