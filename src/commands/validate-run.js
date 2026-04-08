import fs from 'fs/promises';
import path from 'path';
import { loadRunFromOption } from '../core/runs.js';
import { validateUiRun } from '../validation/ui-smoke.js';

export async function validateRunCommand(options) {
  const rootDir = process.cwd();
  const run = await loadRunFromOption(rootDir, options.run);
  const validation = await validateUiRun(run.runDir, run.case);
  const validationDir = path.join(run.runDir, 'validation');
  await fs.mkdir(validationDir, { recursive: true });
  await fs.writeFile(path.join(validationDir, 'validation.json'), JSON.stringify(validation, null, 2), 'utf-8');

  const updatedRun = {
    ...run,
    validation,
  };

  await fs.writeFile(path.join(run.runDir, 'run.json'), JSON.stringify(updatedRun, null, 2), 'utf-8');

  if (options.json) {
    console.log(JSON.stringify(validation, null, 2));
    return;
  }

  console.log(`Validation ${validation.passed ? 'passed' : 'failed'} for ${path.basename(run.runDir)}`);
}
