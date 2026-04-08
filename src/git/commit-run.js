import { spawn } from 'child_process';

export async function commitRuns({ runDirs, message, dryRun = false }) {
  if (dryRun) {
    return;
  }

  await stageRunFiles(runDirs);
  await runGitCommand(['commit', '-m', message]);
}

export async function stageRunFiles(runDirs) {
  if (!runDirs.length) {
    throw new Error('No run directories to stage.');
  }

  await runGitCommand(['add', ...runDirs]);
}

function runGitCommand(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`git ${args.join(' ')} failed with exit code ${code}`));
    });
    child.on('error', reject);
  });
}
