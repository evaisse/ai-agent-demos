export function normalizeUsage(rawUsagePayload) {
  const tokens = rawUsagePayload.tokens || {};
  return {
    tokens: {
      input: tokens.input || rawUsagePayload.input_tokens || 0,
      output: tokens.output || rawUsagePayload.output_tokens || 0,
      total: tokens.total || rawUsagePayload.total_tokens || 0,
    },
    cost_usd: rawUsagePayload.cost_usd || 0,
    api_calls: rawUsagePayload.api_calls || 0,
    tool_calls: rawUsagePayload.tool_calls || 0,
    raw: rawUsagePayload.raw || rawUsagePayload,
  };
}
