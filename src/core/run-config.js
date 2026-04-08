import { loadAvailableModels } from './openrouter-models.js';
import { promptForMissingRunConfig } from '../tui/wizard.js';
import { loadCase } from './case-loader.js';

export async function resolveRunConfig(cliOptions, context) {
  const partial = normalizeRunOptions(cliOptions);
  const availableModels = await loadAvailableModels(context.rootDir);
  const missing = collectMissingFields(partial);

  let merged = partial;
  if (missing.length > 0 && !cliOptions.yes) {
    const wizardAnswers = await promptForMissingRunConfig(partial, {
      availableCases: context.availableCases,
      availableModels,
    });
    merged = normalizeRunOptions({ ...partial, ...wizardAnswers });
  }

  const postMissing = collectMissingFields(merged);
  if (postMissing.length > 0) {
    throw new Error(`Missing required run options: ${postMissing.join(', ')}`);
  }

  const casePaths = [];
  if (merged.casePath) {
    casePaths.push(merged.casePath);
  }
  if (Array.isArray(merged.casePaths)) {
    casePaths.push(...merged.casePaths);
  }

  const caseMap = new Map();
  for (const casePath of Array.from(new Set(casePaths))) {
    caseMap.set(casePath, await loadCase(casePath));
  }

  return {
    ...merged,
    caseMap,
    parameterSources: buildParameterSources(cliOptions, partial, merged),
  };
}

export function normalizeRunOptions(rawOptions) {
  const modelIds = Array.from(new Set([
    ...(rawOptions.model ? [rawOptions.model] : []),
    ...((rawOptions.models || []).filter(Boolean)),
  ]));
  const casePaths = Array.from(new Set([
    ...(rawOptions.case ? [rawOptions.case] : []),
    ...((rawOptions.cases || []).filter(Boolean)),
  ]));

  return {
    suite: rawOptions.suite || null,
    casePath: casePaths[0] || null,
    casePaths,
    modelIds,
    openrouterKey: rawOptions.openrouterKey || null,
    openrouterKeyEnv: rawOptions.openrouterKeyEnv || 'OPENROUTER_API_KEY',
    timeoutSeconds: parseInteger(rawOptions.timeout, 900),
    maxTurns: parseInteger(rawOptions.maxTurns, 12),
    budgetUsd: parseFloatOrNull(rawOptions.budgetUsd),
    runs: parseInteger(rawOptions.runs, 1),
    parallel: Boolean(rawOptions.parallel),
    concurrency: parseInteger(rawOptions.concurrency, 2),
    globalBudgetUsd: parseFloatOrNull(rawOptions.globalBudgetUsd),
    failFast: Boolean(rawOptions.failFast),
    dryRun: Boolean(rawOptions.dryRun),
    commit: Boolean(rawOptions.commit),
    commitMode: rawOptions.commitMode || 'ask',
    json: Boolean(rawOptions.json),
    yes: Boolean(rawOptions.yes),
    mockModal: Boolean(rawOptions.mockModal),
  };
}

export function collectMissingFields(config) {
  const missing = [];
  if (!config.casePaths || config.casePaths.length === 0) {
    missing.push('case');
  }
  if (!config.modelIds || config.modelIds.length === 0) {
    missing.push('model');
  }
  return missing;
}

function parseInteger(value, defaultValue) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function parseFloatOrNull(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildParameterSources(cliOptions, partial, merged) {
  const sources = {};
  Object.keys(merged).forEach((key) => {
    if (cliOptions[key] !== undefined) {
      sources[key] = 'cli';
    } else if (partial[key] !== undefined && partial[key] !== null) {
      sources[key] = 'default';
    } else {
      sources[key] = 'wizard';
    }
  });
  return sources;
}
