import { confirm } from '@inquirer/prompts';
import { buildCommitMessageFromRuns } from '../core/commit-message.js';
import { listRunDirs, loadRun, resolveRunDirsFromOption } from '../core/runs.js';
import { commitRuns } from '../git/commit-run.js';

export async function commitCommand(options) {
  const rootDir = process.cwd();
  const runDirs = await resolveRunDirsFromOption(rootDir, options.run, options.runs || []);

  if (runDirs.length === 0) {
    throw new Error('No run directories selected for commit.');
  }

  const runs = await Promise.all(runDirs.map((dir) => loadRun(dir)));
  const message = options.message || buildCommitMessageFromRuns(runs, {
    type: options.type,
    scope: options.scope,
  });

  if (options.dryRun) {
    console.log(message);
    return;
  }

  if (!options.yes) {
    const shouldCommit = await confirm({
      message: `Create commit for ${runDirs.length} run(s)?`,
      default: true,
    });

    if (!shouldCommit) {
      console.log('Commit cancelled.');
      return;
    }
  }

  await commitRuns({ runDirs, message, dryRun: false });
  console.log(`Created commit: ${message}`);
}
