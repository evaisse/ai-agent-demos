import path from 'path';

export function getRunOutputDir(rootDir, runId) {
  return path.join(rootDir, 'results', 'runs', runId);
}

export function getPlanOutputDir(rootDir, planId) {
  return path.join(rootDir, 'results', 'plans', planId);
}
