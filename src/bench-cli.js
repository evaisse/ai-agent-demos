#!/usr/bin/env bun

import { Command } from 'commander';
import { runCommand } from './commands/run.js';
import { commitCommand } from './commands/commit.js';
import { listCasesCommand } from './commands/list-cases.js';
import { listModelsCommand } from './commands/list-models.js';
import { listRunsCommand } from './commands/list-runs.js';
import { inspectRunCommand } from './commands/inspect-run.js';
import { validateRunCommand } from './commands/validate-run.js';

const program = new Command();

program
  .name('bench')
  .description('Local benchmark runner for Modal + OpenCode + OpenRouter')
  .showHelpAfterError();

program
  .command('run')
  .description('Run one or more benchmark cases')
  .option('--case <path>', 'Benchmark case path')
  .option('--cases <paths...>', 'Benchmark case paths')
  .option('--suite <suite>', 'Benchmark suite')
  .option('--model <id>', 'OpenRouter model id')
  .option('--models <ids...>', 'OpenRouter model ids')
  .option('--openrouter-key <value>', 'OpenRouter API key value')
  .option('--openrouter-key-env <name>', 'Environment variable holding the OpenRouter API key')
  .option('--timeout <seconds>', 'Per-job timeout in seconds')
  .option('--max-turns <n>', 'Maximum agent turns per job')
  .option('--budget-usd <amount>', 'Per-job budget ceiling in USD')
  .option('--runs <n>', 'Number of runs per case/model combination', '1')
  .option('--parallel', 'Run jobs in parallel')
  .option('--concurrency <n>', 'Maximum parallel jobs', '2')
  .option('--global-budget-usd <amount>', 'Global budget ceiling in USD')
  .option('--fail-fast', 'Stop queueing new jobs after the first failure')
  .option('--dry-run', 'Print the execution plan without submitting jobs')
  .option('--commit', 'Offer to commit successful run outputs')
  .option('--commit-mode <mode>', 'Commit behavior: ask, auto, never', 'ask')
  .option('--json', 'Emit machine-readable summaries')
  .option('--yes', 'Skip interactive confirmations where possible')
  .option('--mock-modal', 'Use the built-in mock Modal runner instead of a real backend')
  .addHelpText('after', '\nAuthentication:\n  Set MODAL_TOKEN_ID and MODAL_TOKEN_SECRET before running against Modal.\n')
  .action(runCommand);

program
  .command('commit')
  .description('Commit one or more benchmark runs with a normalized message')
  .option('--run <path>', 'Run directory path')
  .option('--runs <paths...>', 'Run directory paths')
  .option('--type <type>', 'Conventional commit type override')
  .option('--scope <scope>', 'Conventional commit scope override')
  .option('--message <text>', 'Explicit commit message override')
  .option('--dry-run', 'Print the generated commit message without committing')
  .option('--yes', 'Skip interactive confirmation')
  .action(commitCommand);

program
  .command('list-cases')
  .description('List available benchmark cases')
  .option('--suite <suite>', 'Optional suite filter')
  .option('--json', 'Emit JSON')
  .action(listCasesCommand);

program
  .command('list-models')
  .description('List cached OpenRouter models')
  .option('--provider <provider>', 'Provider filter, e.g. openai')
  .option('--json', 'Emit JSON')
  .action(listModelsCommand);

program
  .command('list-runs')
  .description('List downloaded benchmark runs')
  .option('--suite <suite>', 'Optional suite filter')
  .option('--json', 'Emit JSON')
  .action(listRunsCommand);

program
  .command('inspect-run')
  .description('Inspect a single benchmark run')
  .requiredOption('--run <path>', 'Run directory path')
  .option('--json', 'Emit JSON')
  .action(inspectRunCommand);

program
  .command('validate-run')
  .description('Re-run local validation for a benchmark run')
  .requiredOption('--run <path>', 'Run directory path')
  .option('--json', 'Emit JSON')
  .action(validateRunCommand);

await program.parseAsync(process.argv);
