import { buildPlanId, buildRunId } from './ids.js';

export function buildExecutionPlan(config) {
  const timestamp = new Date().toISOString();
  const cases = Array.from(config.caseMap.values());
  const inferredSuite = new Set(cases.map((entry) => entry.suite)).size === 1
    ? cases[0]?.suite
    : 'mixed';
  return {
    planId: buildPlanId({ suite: config.suite || inferredSuite || 'mixed', timestamp }),
    parallel: config.parallel,
    concurrency: config.parallel ? config.concurrency : 1,
    jobs: expandJobs({
      cases,
      models: config.modelIds,
      runs: config.runs,
      timeoutSeconds: config.timeoutSeconds,
      maxTurns: config.maxTurns,
      budgetUsd: config.budgetUsd,
      timestamp,
    }),
  };
}

export function expandJobs({ cases, models, runs, timeoutSeconds, maxTurns, budgetUsd, timestamp }) {
  const jobs = [];
  for (const loadedCase of cases) {
    for (const modelId of models) {
      for (let runIndex = 1; runIndex <= runs; runIndex += 1) {
        jobs.push({
          jobId: buildRunId({ suite: loadedCase.suite, caseId: loadedCase.id, modelId, runIndex, timestamp }),
          runId: buildRunId({ suite: loadedCase.suite, caseId: loadedCase.id, modelId, runIndex, timestamp }),
          casePath: loadedCase.casePath,
          caseId: loadedCase.id,
          suite: loadedCase.suite,
          modelId,
          runIndex,
          timeoutSeconds,
          maxTurns,
          budgetUsd,
        });
      }
    }
  }
  return jobs;
}

export function summarizePlan(plan) {
  return {
    jobCount: plan.jobs.length,
    caseCount: new Set(plan.jobs.map((job) => job.caseId)).size,
    modelCount: new Set(plan.jobs.map((job) => job.modelId)).size,
  };
}
