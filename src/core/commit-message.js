export function buildCommitMessageFromRun(run, overrides = {}) {
  const type = overrides.type || run.commit?.type || 'chore';
  const scope = overrides.scope || run.commit?.scope || 'runs';
  return `${type}(${scope}): add ${run.suite} ${run.case.id} results for ${run.model.id}`;
}

export function buildCommitMessageFromRuns(runs, overrides = {}) {
  if (runs.length === 1) {
    return buildCommitMessageFromRun(runs[0], overrides);
  }

  const firstRun = runs[0];
  const type = overrides.type || 'chore';
  const scope = overrides.scope || 'runs';
  const suites = new Set(runs.map((run) => run.suite));
  const models = new Set(runs.map((run) => run.model.id));

  if (models.size === 1 && suites.size === 1) {
    return `${type}(${scope}): add ${runs.length} ${firstRun.suite} benchmark runs for ${firstRun.model.id}`;
  }

  return `${type}(${scope}): add ${runs.length} benchmark run artifacts`;
}
