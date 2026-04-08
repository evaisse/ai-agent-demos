import path from 'path';

export async function buildModalPayload(job, resolvedConfig, loadedCase) {
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
    mockModal: resolvedConfig.mockModal,
  };
}
