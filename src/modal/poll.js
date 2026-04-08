export async function waitForModalJob(client, modalJobId, options = {}) {
  return {
    modalJobId,
    state: 'completed',
    pollIntervalMs: options.pollIntervalMs || 1000,
  };
}
