import fs from 'fs/promises';
import path from 'path';
import { confirm } from '@inquirer/prompts';
import { findCasePaths, loadCase } from '../core/case-loader.js';
import { buildCommitMessageFromRuns } from '../core/commit-message.js';
import { buildExecutionPlan, summarizePlan } from '../core/execution-plan.js';
import { splitModelId } from '../core/ids.js';
import { submitModalJob, getModalJobStatus, downloadModalJobResult, createModalClient } from '../modal/client.js';
import { buildModalPayload } from '../modal/payload.js';
import { runJobsWithConcurrency } from '../modal/queue.js';
import { normalizeUsage } from '../opencode/usage-normalizer.js';
import { getPlanOutputDir, getRunOutputDir } from '../core/output-paths.js';
import { resolveRunConfig } from '../core/run-config.js';
import { validateUiRun } from '../validation/ui-smoke.js';
import { commitRuns } from '../git/commit-run.js';

export async function runCommand(options) {
  const rootDir = process.cwd();
  const availableCasePaths = await findCasePaths(rootDir, options.suite || null);
  const availableCases = await Promise.all(availableCasePaths.map((casePath) => loadCase(casePath)));
  const resolvedConfig = await resolveRunConfig(options, {
    rootDir,
    availableCases,
  });

  const plan = buildExecutionPlan(resolvedConfig);
  const planOutputDir = getPlanOutputDir(rootDir, plan.planId);
  await fs.mkdir(planOutputDir, { recursive: true });
  await fs.writeFile(path.join(planOutputDir, 'execution-plan.json'), JSON.stringify(plan, null, 2), 'utf-8');

  const planSummary = summarizePlan(plan);

  if (!resolvedConfig.json) {
    console.log(`Plan: ${plan.planId}`);
    console.log(`Jobs: ${plan.jobs.length}`);
    console.log(`Parallel: ${plan.parallel ? 'yes' : 'no'}`);
    console.log(`Concurrency: ${plan.concurrency}`);
    console.log(`Cases: ${planSummary.caseCount}`);
    console.log(`Models: ${planSummary.modelCount}`);
  }

  if (resolvedConfig.dryRun) {
    if (resolvedConfig.json) {
      console.log(JSON.stringify({ plan, summary: planSummary, results: [] }, null, 2));
      return;
    }
    console.log('Dry run requested, no jobs submitted.');
    return;
  }

  if (!resolvedConfig.yes) {
    const shouldLaunch = await confirm({
      message: `Launch ${plan.jobs.length} job(s) now?`,
      default: true,
    });

    if (!shouldLaunch) {
      console.log('Run cancelled.');
      return;
    }
  }

  const client = createModalClient({
    rootDir,
    mockModal: resolvedConfig.mockModal,
    modalEnv: resolveModalEnv(resolvedConfig.mockModal),
  });

  const results = [];
  let globalCostUsd = 0;

  const worker = async (job) => {
    if (resolvedConfig.globalBudgetUsd && globalCostUsd >= resolvedConfig.globalBudgetUsd) {
      return {
        runId: job.runId,
        status: 'cancelled',
        skipped: true,
        reason: 'Global budget already exceeded',
      };
    }

    const loadedCase = resolvedConfig.caseMap.get(job.casePath);
    const payload = await buildModalPayload(job, resolvedConfig, loadedCase);
    const submission = await submitModalJob(client, payload);
    const modalStatus = await getModalJobStatus(client, submission.modalJobId);
    const runDir = getRunOutputDir(rootDir, job.runId);
    const downloaded = await downloadModalJobResult(client, submission.modalJobId, runDir, {
      job,
      loadedCase,
      modalStatus,
    });

    const normalizedUsage = normalizeUsage(downloaded.apiUsage || {});
    globalCostUsd += normalizedUsage.cost_usd || 0;

    const validation = await validateUiRun(runDir, loadedCase);
    const runPayload = {
      schema_version: '1.0',
      run_id: job.runId,
      plan_id: plan.planId,
      harness_version: '1.0',
      case_version: loadedCase.caseVersion,
      suite: loadedCase.suite,
      case: {
        id: loadedCase.id,
        title: loadedCase.title,
        path: path.relative(rootDir, loadedCase.casePath),
      },
      model: {
        id: job.modelId,
        ...splitModelId(job.modelId),
      },
      runner: {
        type: 'modal',
        mock: resolvedConfig.mockModal,
        backend: resolvedConfig.mockModal ? 'mock' : 'python-sdk',
      },
      input: {
        timeout_seconds: job.timeoutSeconds,
        max_turns: job.maxTurns,
        budget_usd: job.budgetUsd || null,
        parameter_sources: resolvedConfig.parameterSources,
      },
      status: validation.passed ? downloaded.status : 'validation_failed',
      timing: downloaded.timing,
      usage: normalizedUsage,
      agent: downloaded.agent,
      artifacts: downloaded.artifacts,
      validation,
      git: {
        recommended_commit_message: buildCommitMessageFromRuns([
          {
            suite: loadedCase.suite,
            case: { id: loadedCase.id },
            model: { id: job.modelId },
          },
        ]),
      },
      errors: downloaded.errors || [],
    };

    await fs.writeFile(path.join(runDir, 'run.json'), JSON.stringify(runPayload, null, 2), 'utf-8');

    return {
      runId: job.runId,
      status: runPayload.status,
      outputDir: runDir,
      costUsd: runPayload.usage.cost_usd,
      durationMs: runPayload.timing.duration_ms,
      validationPassed: validation.passed,
    };
  };

  const workerResults = await runJobsWithConcurrency(plan.jobs, worker, {
    concurrency: plan.parallel ? plan.concurrency : 1,
    failFast: resolvedConfig.failFast,
    onUpdate: (event) => {
      if (!resolvedConfig.json) {
        console.log(`[${event.state}] ${event.jobId}`);
      }
    },
  });

  results.push(...workerResults);

  const summary = {
    plan_id: plan.planId,
    total_jobs: results.length,
    completed: results.filter((item) => item.status === 'success').length,
    failed: results.filter((item) => item.status === 'runtime_error' || item.status === 'validation_failed').length,
    timed_out: results.filter((item) => item.status === 'timeout').length,
    cancelled: results.filter((item) => item.status === 'cancelled').length,
    cost_usd: Number(globalCostUsd.toFixed(6)),
  };

  await fs.writeFile(path.join(planOutputDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf-8');

  if (resolvedConfig.json) {
    console.log(JSON.stringify({ plan, summary, results }, null, 2));
    return;
  }

  console.log('Summary');
  console.log(`  Success: ${summary.completed}`);
  console.log(`  Failed: ${summary.failed}`);
  console.log(`  Timed out: ${summary.timed_out}`);
  console.log(`  Cancelled: ${summary.cancelled}`);
  console.log(`  Cost: $${summary.cost_usd.toFixed(4)}`);

  const successfulRunDirs = results.filter((item) => item.status === 'success').map((item) => item.outputDir);

  if (successfulRunDirs.length === 0 || !resolvedConfig.commit || resolvedConfig.commitMode === 'never') {
    return;
  }

  if (resolvedConfig.commitMode === 'ask' && !resolvedConfig.yes) {
    const shouldCommit = await confirm({
      message: `Commit ${successfulRunDirs.length} successful run(s)?`,
      default: true,
    });

    if (!shouldCommit) {
      return;
    }
  }

  const runJsons = await Promise.all(successfulRunDirs.map(async (runDir) => JSON.parse(await fs.readFile(path.join(runDir, 'run.json'), 'utf-8'))));
  const commitMessage = buildCommitMessageFromRuns(runJsons);
  await commitRuns({ runDirs: successfulRunDirs, message: commitMessage, dryRun: false });
  console.log(`Created commit: ${commitMessage}`);
}

function resolveModalEnv(mockModal) {
  if (mockModal) {
    return {};
  }

  const requiredEnvNames = ['MODAL_TOKEN_ID', 'MODAL_TOKEN_SECRET'];
  const missing = requiredEnvNames.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing Modal credentials: ${missing.join(', ')}. Set them in your shell or use --mock-modal.`);
  }

  return Object.fromEntries(requiredEnvNames.map((name) => [name, process.env[name]]));
}
