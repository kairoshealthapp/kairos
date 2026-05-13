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
