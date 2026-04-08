import fs from 'fs/promises';
import path from 'path';

const REQUIRED_CASE_FILES = ['case.json', 'README.md', 'AGENTS.md'];

export async function findCasePaths(rootDir, suite = null) {
  const benchmarksDir = path.join(rootDir, 'benchmarks');
  const suiteEntries = await safeReadDir(benchmarksDir);
  const selectedSuites = suiteEntries.filter((entry) => entry.isDirectory() && (!suite || entry.name === suite));
  const casePaths = [];

  for (const suiteEntry of selectedSuites) {
    const suitePath = path.join(benchmarksDir, suiteEntry.name);
    const caseEntries = await safeReadDir(suitePath);
    caseEntries
      .filter((entry) => entry.isDirectory())
      .forEach((entry) => {
        casePaths.push(path.join(suitePath, entry.name));
      });
  }

  return casePaths.sort();
}

export async function loadCase(casePath) {
  const caseConfigPath = path.join(casePath, 'case.json');
  const raw = JSON.parse(await fs.readFile(caseConfigPath, 'utf-8'));
  await validateCaseFiles(casePath, raw);

  const promptFile = raw.prompt_file || raw.task_file || 'PROMPT.md';
  const promptText = await fs.readFile(path.join(casePath, promptFile), 'utf-8');

  return {
    id: raw.id,
    suite: raw.suite || inferSuiteFromPath(casePath),
    title: raw.title || raw.id,
    casePath,
    caseVersion: raw.case_version || '1.0',
    promptFile,
    promptText,
    timeoutSeconds: raw.timeout_seconds || 900,
    maxTurns: raw.max_turns || 12,
    expectedArtifacts: raw.expected_artifacts || [],
    validation: raw.validation || { mode: 'ui-smoke' },
    commit: raw.commit || { type: 'chore', scope: 'runs' },
    raw,
  };
}

export async function validateCaseFiles(casePath, caseConfig) {
  for (const fileName of REQUIRED_CASE_FILES) {
    await ensureFile(path.join(casePath, fileName));
  }

  const promptFile = caseConfig.prompt_file || caseConfig.task_file || 'PROMPT.md';
  await ensureFile(path.join(casePath, promptFile));
}

export function inferSuiteFromPath(casePath) {
  return path.basename(path.dirname(casePath));
}

async function ensureFile(filePath) {
  await fs.access(filePath);
}

async function safeReadDir(dirPath) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}
