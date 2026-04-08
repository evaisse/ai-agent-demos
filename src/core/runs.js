import fs from 'fs/promises';
import path from 'path';

export async function listRunDirs(rootDir, suite = null) {
  const runsDir = path.join(rootDir, 'results', 'runs');
  const entries = await safeReadDir(runsDir);
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(runsDir, entry.name))
    .filter((dir) => !suite || path.basename(dir).startsWith(`${suite}__`))
    .sort();
}

export async function loadRun(runDir) {
  const raw = JSON.parse(await fs.readFile(path.join(runDir, 'run.json'), 'utf-8'));
  return {
    ...raw,
    runDir,
  };
}

export async function loadRunFromOption(rootDir, runOption) {
  const runDir = path.isAbsolute(runOption) ? runOption : path.join(rootDir, runOption);
  return loadRun(runDir);
}

export async function resolveRunDirsFromOption(rootDir, runOption, runsOption) {
  const raw = [
    ...(runOption ? [runOption] : []),
    ...(runsOption || []),
  ];

  return raw.map((entry) => (path.isAbsolute(entry) ? entry : path.join(rootDir, entry)));
}

async function safeReadDir(dirPath) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}
