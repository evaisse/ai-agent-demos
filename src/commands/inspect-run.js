import path from 'path';
import { loadRunFromOption } from '../core/runs.js';

export async function inspectRunCommand(options) {
  const rootDir = process.cwd();
  const run = await loadRunFromOption(rootDir, options.run);

  if (options.json) {
    console.log(JSON.stringify(run, null, 2));
    return;
  }

  console.log(`Run: ${path.basename(run.runDir)}`);
  console.log(`Status: ${run.status}`);
  console.log(`Suite: ${run.suite}`);
  console.log(`Case: ${run.case?.id || 'unknown'}`);
  console.log(`Model: ${run.model?.id || 'unknown'}`);
  console.log(`Duration: ${run.timing?.duration_ms || 0}ms`);
  console.log(`Cost: $${(run.usage?.cost_usd || 0).toFixed(4)}`);
  console.log(`Validation passed: ${run.validation?.passed ? 'yes' : 'no'}`);

  if (Array.isArray(run.artifacts) && run.artifacts.length > 0) {
    console.log('Artifacts:');
    run.artifacts.forEach((artifact) => {
      console.log(`  - ${artifact.path}`);
    });
  }
}
