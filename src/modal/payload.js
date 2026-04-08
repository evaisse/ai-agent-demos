import fs from 'fs/promises';
import path from 'path';

export async function buildModalPayload(job, resolvedConfig, loadedCase) {
  const workspaceFiles = await readWorkspaceFiles(loadedCase.casePath);
  return {
    runId: job.runId,
    suite: loadedCase.suite,
    caseId: loadedCase.id,
    casePath: path.relative(process.cwd(), loadedCase.casePath),
    modelId: job.modelId,
    timeoutSeconds: job.timeoutSeconds,
    maxTurns: job.maxTurns,
    budgetUsd: job.budgetUsd,
    prompt: loadedCase.promptText,
    expectedArtifacts: loadedCase.expectedArtifacts,
    openrouterKeyEnv: resolvedConfig.openrouterKeyEnv,
    openrouterKey: resolveOpenRouterKey(resolvedConfig),
    opencodeModel: `openrouter/${job.modelId}`,
    promptFile: loadedCase.promptFile,
    instruction: buildInstruction(loadedCase),
    workspaceFiles,
    mockModal: resolvedConfig.mockModal,
  };
}

async function readWorkspaceFiles(casePath) {
  const entries = await fs.readdir(casePath, { withFileTypes: true });
  const files = {};

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    const absolutePath = path.join(casePath, entry.name);
    files[entry.name] = await fs.readFile(absolutePath, 'utf-8');
  }

  return files;
}

function resolveOpenRouterKey(resolvedConfig) {
  if (resolvedConfig.openrouterKey) {
    return resolvedConfig.openrouterKey;
  }

  const key = process.env[resolvedConfig.openrouterKeyEnv];
  if (!key) {
    throw new Error(`Missing OpenRouter API key in environment variable ${resolvedConfig.openrouterKeyEnv}`);
  }

  return key;
}

function buildInstruction(loadedCase) {
  const promptFile = loadedCase.promptFile;
  const requiredArtifacts = loadedCase.expectedArtifacts.join(', ');
  return [
    `Read README.md, AGENTS.md, and ${promptFile} from the workspace before making changes.`,
    'Complete the benchmark task in build mode without waiting for further user confirmation.',
    `Write the required artifact(s) to the workspace root: ${requiredArtifacts}.`,
    'Do not add unnecessary extra files unless they are required by the task.',
  ].join(' ');
}
