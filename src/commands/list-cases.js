import path from 'path';
import { findCasePaths, loadCase } from '../core/case-loader.js';

export async function listCasesCommand(options) {
  const rootDir = process.cwd();
  const casePaths = await findCasePaths(rootDir, options.suite || null);
  const cases = await Promise.all(casePaths.map((casePath) => loadCase(casePath)));
  const payload = cases.map((entry) => ({
    id: entry.id,
    suite: entry.suite,
    title: entry.title,
    casePath: path.relative(rootDir, entry.casePath),
    timeoutSeconds: entry.timeoutSeconds,
    maxTurns: entry.maxTurns,
  }));

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (payload.length === 0) {
    console.log('No benchmark cases found.');
    return;
  }

  payload.forEach((entry) => {
    console.log(`${entry.suite}/${entry.id}`);
    console.log(`  Title: ${entry.title}`);
    console.log(`  Path: ${entry.casePath}`);
    console.log(`  Timeout: ${entry.timeoutSeconds}s`);
    console.log(`  Max turns: ${entry.maxTurns}`);
  });
}
