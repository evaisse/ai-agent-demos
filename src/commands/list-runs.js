import path from 'path';
import { listRunDirs, loadRun } from '../core/runs.js';

export async function listRunsCommand(options) {
  const rootDir = process.cwd();
  const runDirs = await listRunDirs(rootDir, options.suite || null);
  const runs = await Promise.all(runDirs.map((dir) => loadRun(dir)));

  if (options.json) {
    console.log(JSON.stringify(runs, null, 2));
    return;
  }

  if (runs.length === 0) {
    console.log('No benchmark runs found.');
    return;
  }

  runs.forEach((run) => {
    console.log(path.basename(run.runDir));
    console.log(`  Status: ${run.status}`);
    console.log(`  Model: ${run.model?.id || 'unknown'}`);
    console.log(`  Duration: ${run.timing?.duration_ms || 0}ms`);
    console.log(`  Cost: $${(run.usage?.cost_usd || 0).toFixed(4)}`);
  });
}
