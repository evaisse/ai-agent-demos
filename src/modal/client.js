import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

export function createModalClient(config) {
  return {
    rootDir: config.rootDir,
    mockModal: config.mockModal,
    modalEnv: config.modalEnv || {},
    modalBackendScript: path.join(config.rootDir, 'scripts', 'modal_backend.py'),
    jobs: new Map(),
  };
}

export async function submitModalJob(client, payload) {
  if (client.mockModal) {
    return {
      modalJobId: payload.runId,
      payload,
    };
  }

  const jobPromise = invokeModalBackend(client, payload);
  client.jobs.set(payload.runId, { payload, promise: jobPromise });

  return {
    modalJobId: payload.runId,
    payload,
  };
}

export async function getModalJobStatus(client, modalJobId) {
  if (client.mockModal) {
    return {
      modalJobId,
      state: 'completed',
    };
  }

  const job = client.jobs.get(modalJobId);
  if (!job) {
    throw new Error(`Unknown Modal job: ${modalJobId}`);
  }

  const result = await job.promise;
  return {
    modalJobId,
    state: result.status || 'runtime_error',
    result,
  };
}

export async function downloadModalJobResult(client, modalJobId, outputDir, context) {
  if (client.mockModal) {
    return downloadMockResult(modalJobId, outputDir, context);
  }

  const job = client.jobs.get(modalJobId);
  if (!job) {
    throw new Error(`Unknown Modal job: ${modalJobId}`);
  }

  const result = await job.promise;
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.join(outputDir, 'artifacts'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'validation'), { recursive: true });

  await fs.writeFile(path.join(outputDir, 'stdout.log'), result.stdout || '', 'utf-8');
  await fs.writeFile(path.join(outputDir, 'stderr.log'), result.stderr || '', 'utf-8');
  await fs.writeFile(path.join(outputDir, 'final-message.md'), result.finalMessage || '', 'utf-8');
  await fs.writeFile(path.join(outputDir, 'api-usage.json'), JSON.stringify(result.apiUsage || {}, null, 2), 'utf-8');

  if (Array.isArray(result.opencodeEvents)) {
    const jsonl = result.opencodeEvents.map((event) => JSON.stringify(event)).join('\n');
    await fs.writeFile(path.join(outputDir, 'opencode-events.jsonl'), jsonl ? `${jsonl}\n` : '', 'utf-8');
  }

  if (result.opencodeExport !== undefined) {
    await fs.writeFile(path.join(outputDir, 'opencode-export.json'), JSON.stringify(result.opencodeExport, null, 2), 'utf-8');
  }

  for (const [relativePath, artifact] of Object.entries(result.artifactContents || {})) {
    const destination = path.join(outputDir, relativePath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    if (artifact.encoding === 'base64') {
      await fs.writeFile(destination, Buffer.from(artifact.content, 'base64'));
    } else {
      await fs.writeFile(destination, artifact.content || '', 'utf-8');
    }
  }

  return {
    status: result.status,
    timing: result.timing,
    apiUsage: result.apiUsage,
    agent: result.agent,
    artifacts: result.artifacts,
    errors: result.errors || [],
  };
}

async function invokeModalBackend(client, payload) {
  await fs.access(client.modalBackendScript);

  return new Promise((resolve, reject) => {
    const child = spawn('python3', [client.modalBackendScript], {
      cwd: client.rootDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...client.modalEnv,
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to start Modal backend: ${error.message}`));
    });

    child.on('exit', (code) => {
      const parsed = tryParseLastJsonObject(stdout);
      if (code === 0 && parsed) {
        resolve(parsed);
        return;
      }

      if (parsed && parsed.status === 'runtime_error') {
        resolve({
          ...parsed,
          stdout,
          stderr: [stderr, ...(parsed.errors || [])].filter(Boolean).join('\n'),
        });
        return;
      }

      reject(new Error(`Modal backend failed with exit code ${code}. ${stderr || stdout}`.trim()));
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

function tryParseLastJsonObject(stdout) {
  const lines = stdout.trim().split('\n').reverse();
  for (const line of lines) {
    try {
      return JSON.parse(line);
    } catch {
      continue;
    }
  }
  return null;
}

async function downloadMockResult(modalJobId, outputDir, context) {

  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.join(outputDir, 'artifacts'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'validation'), { recursive: true });

  const html = buildMockHtml(context.loadedCase, context.job.modelId);
  await fs.writeFile(path.join(outputDir, 'artifacts', 'index.html'), html, 'utf-8');
  await fs.writeFile(path.join(outputDir, 'stdout.log'), `Mock Modal run completed for ${modalJobId}\n`, 'utf-8');
  await fs.writeFile(path.join(outputDir, 'stderr.log'), '', 'utf-8');
  await fs.writeFile(path.join(outputDir, 'final-message.md'), `Mock run completed for ${context.loadedCase.id} with ${context.job.modelId}.\n`, 'utf-8');

  const apiUsage = {
    tokens: {
      input: 1200,
      output: 3400,
      total: 4600,
    },
    cost_usd: 0.1842,
    api_calls: 4,
    tool_calls: 6,
    raw: {
      provider: 'mock-modal',
    },
  };

  await fs.writeFile(path.join(outputDir, 'api-usage.json'), JSON.stringify(apiUsage, null, 2), 'utf-8');

  return {
    status: 'success',
    timing: {
      started_at: new Date(Date.now() - 60000).toISOString(),
      ended_at: new Date().toISOString(),
      duration_ms: 60000,
    },
    apiUsage,
    agent: {
      system: 'opencode',
      loop_style: 'ralph-bounded',
      turns_completed: Math.min(context.job.maxTurns, 6),
      final_message_path: 'final-message.md',
    },
    artifacts: [
      {
        path: 'artifacts/index.html',
        type: 'html',
        required: true,
        exists: true,
      },
    ],
    errors: [],
  };
}

function buildMockHtml(loadedCase, modelId) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${loadedCase.title}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: system-ui, sans-serif;
      background: radial-gradient(circle at top, #1f2937, #0f172a);
      color: white;
    }
    .card {
      padding: 2rem;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      text-align: center;
      max-width: 48rem;
    }
  </style>
</head>
<body>
  <main class="card">
    <h1>${loadedCase.title}</h1>
    <p>This is a mock Modal output generated for <strong>${modelId}</strong>.</p>
    <p>Replace the mock client with a real Modal backend to execute OpenCode remotely.</p>
  </main>
</body>
</html>`;
}
