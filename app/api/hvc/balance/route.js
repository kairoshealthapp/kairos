import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// Calculate cost from token usage — model param determines pricing tier
export function calculateCost(usage, model) {
  var inputTokens = usage.input_tokens || 0;
  var outputTokens = usage.output_tokens || 0;
  var cacheReadTokens = usage.cache_read_input_tokens || 0;
  var cacheCreationTokens = usage.cache_creation_input_tokens || 0;

  var regularInput = Math.max(0, inputTokens - cacheReadTokens - cacheCreationTokens);

  var isOpus = model && model.indexOf('opus') !== -1;
  var pricing = isOpus ? PRICING_OPUS : PRICING_SONNET;

  var cost =
    (regularInput * pricing.input) +
    (outputTokens * pricing.output) +
    (cacheReadTokens * pricing.cache_read) +
    (cacheCreationTokens * pricing.cache_creation);

  return {
    cost: Math.round(cost * 1000000) / 1000000,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cache_read_tokens: cacheReadTokens,
    cache_creation_tokens: cacheCreationTokens,
  };
}

// GET — return current remaining balance
export async function GET() {
  try {
    var missingEnv = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) missingEnv.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_KEY) missingEnv.push('SUPABASE_SERVICE_KEY');
    if (missingEnv.length > 0) {
      return NextResponse.json({ error: 'Missing required env var: ' + missingEnv.join(', ') }, { status: 500 });
    }

    // Get starting balance
    var settingsResult = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'api_balance')
      .single();

    var settingsValue = (settingsResult.data && settingsResult.data.value) ? settingsResult.data.value : '41.20';
    var startingBalance = parseFloat(settingsValue);

    // Get total spent
    var usageResult = await supabase
      .from('api_usage')
      .select('cost_usd');

    var usageRows = usageResult.data || [];
    var totalSpent = 0;
    for (var i = 0; i < usageRows.length; i++) {
      totalSpent += parseFloat(usageRows[i].cost_usd || 0);
    }
    var remaining = startingBalance - totalSpent;

    // Get today's spend
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayResult = await supabase
      .from('api_usage')
      .select('cost_usd')
      .gte('created_at', today.toISOString());

    var todayRows = todayResult.data || [];
    var todaySpent = 0;
    for (var j = 0; j < todayRows.length; j++) {
      todaySpent += parseFloat(todayRows[j].cost_usd || 0);
    }

    var todayCalls = todayRows.length;

    return NextResponse.json({
      starting_balance: startingBalance,
      total_spent: Math.round(totalSpent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      today_spent: Math.round(todaySpent * 100) / 100,
      today_calls: todayCalls,
    });
  } catch (error) {
    console.error('Balance GET error:', error);
    return NextResponse.json({ error: 'Failed to get balance' }, { status: 500 });
  }
}

// POST — either log usage or set new balance
export async function POST(request) {
  try {
    var missingEnv = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) missingEnv.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_KEY) missingEnv.push('SUPABASE_SERVICE_KEY');
    if (missingEnv.length > 0) {
      return NextResponse.json({ error: 'Missing required env var: ' + missingEnv.join(', ') }, { status: 500 });
    }

    var body = await request.json();

    // Set new starting balance
    if (body.action === 'set_balance') {
      var setResult = await supabase
        .from('app_settings')
        .upsert({ key: 'api_balance', value: String(body.amount) })
        .select();

      if (setResult.error) throw setResult.error;
      return NextResponse.json({ success: true, balance: body.amount });
    }

    // Log API usage
    if (body.action === 'log_usage') {
      var costResult = calculateCost(body.usage, body.model || '');

      var insertResult = await supabase
        .from('api_usage')
        .insert({
          workflow: body.workflow || 'unknown',
          input_tokens: costResult.input_tokens,
          output_tokens: costResult.output_tokens,
          cache_read_tokens: costResult.cache_read_tokens,
          cache_creation_tokens: costResult.cache_creation_tokens,
          cost_usd: costResult.cost,
        });

      if (insertResult.error) throw insertResult.error;
      return NextResponse.json({ success: true, cost: costResult.cost });
    }

    // Add funds (when you top up your Anthropic account)
    if (body.action === 'add_funds') {
      var fundsResult = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'api_balance')
        .single();

      var currentValue = (fundsResult.data && fundsResult.data.value) ? fundsResult.data.value : '0';
      var current = parseFloat(currentValue);
      var newBalance = current + parseFloat(body.amount);

      await supabase
        .from('app_settings')
        .upsert({ key: 'api_balance', value: String(newBalance) });

      return NextResponse.json({ success: true, balance: newBalance });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Balance POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
