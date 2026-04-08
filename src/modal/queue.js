export async function runJobsWithConcurrency(jobs, worker, options = {}) {
  const concurrency = Math.max(1, options.concurrency || 1);
  const results = [];
  let index = 0;
  let shouldStop = false;

  async function runNext() {
    if (shouldStop) {
      return;
    }

    const currentIndex = index;
    index += 1;

    if (currentIndex >= jobs.length) {
      return;
    }

    const job = jobs[currentIndex];
    options.onUpdate?.({ state: 'queued', jobId: job.jobId });

    try {
      options.onUpdate?.({ state: 'running', jobId: job.jobId });
      const result = await worker(job);
      results[currentIndex] = result;
      options.onUpdate?.({ state: result.status || 'completed', jobId: job.jobId });
      if (options.failFast && result.status !== 'success') {
        shouldStop = true;
      }
    } catch (error) {
      results[currentIndex] = {
        runId: job.runId,
        status: 'runtime_error',
        error: error.message,
      };
      options.onUpdate?.({ state: 'runtime_error', jobId: job.jobId });
      if (options.failFast) {
        shouldStop = true;
      }
    }

    await runNext();
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, () => runNext()));
  return results.filter(Boolean);
}
