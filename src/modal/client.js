import fs from 'fs/promises';
import path from 'path';

export function createModalClient(config) {
  return {
    rootDir: config.rootDir,
    mockModal: config.mockModal,
  };
}

export async function submitModalJob(client, payload) {
  if (!client.mockModal) {
    throw new Error('Real Modal backend is not configured yet. Use --mock-modal for the scaffold flow.');
  }

  return {
    modalJobId: payload.runId,
    payload,
  };
}

export async function getModalJobStatus(client, modalJobId) {
  return {
    modalJobId,
    state: 'completed',
  };
}

export async function downloadModalJobResult(client, modalJobId, outputDir, context) {
  if (!client.mockModal) {
    throw new Error('Real Modal result download is not configured yet.');
  }

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
