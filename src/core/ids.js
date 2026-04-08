export function buildRunId({ suite, caseId, modelId, runIndex, timestamp }) {
  const safeTimestamp = timestamp.replace(/[:.]/g, '-');
  const modelSlug = modelId.replace(/\//g, '__');
  return `${suite}__${caseId}__${modelSlug}__run${String(runIndex).padStart(2, '0')}__${safeTimestamp}`;
}

export function buildPlanId({ suite, timestamp }) {
  const safeTimestamp = timestamp.replace(/[:.]/g, '-');
  return `${suite}__${safeTimestamp}`;
}

export function splitModelId(modelId) {
  const [provider, ...rest] = modelId.split('/');
  return {
    provider,
    name: rest.join('/'),
  };
}
