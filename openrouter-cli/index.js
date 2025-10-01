#!/usr/bin/env node

import { program } from 'commander';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

dotenv.config();

function validateConfig(apiKey, apiUrl) {
  if (!apiKey) {
    console.error('Error: OpenRouter API key is required.');
    console.error('Provide it via --api-key, OPENROUTER_API_KEY env variable, or .env file');
    process.exit(1);
  }
  if (!apiUrl) {
    console.error('Error: OpenRouter API URL is required.');
    console.error('Provide it via --api-url, OPENROUTER_API_URL env variable, or .env file');
    process.exit(1);
  }
}

async function loadCachedModels() {
  try {
    const cacheFile = path.resolve('openrouter-models.json');
    const data = await fs.readFile(cacheFile, 'utf-8');
    const cache = JSON.parse(data);
    
    // Check if cache is older than 24 hours
    const cacheAge = Date.now() - new Date(cache.timestamp).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (cacheAge < maxAge) {
      console.log('📦 Using cached models data...\n');
      return cache.models;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function saveCachedModels(models) {
  try {
    const cacheFile = path.resolve('openrouter-models.json');
    const cache = {
      timestamp: new Date().toISOString(),
      models: models,
      count: models.length
    };
    
    await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2), 'utf-8');
    console.log(`💾 Cached ${models.length} models to openrouter-models.json\n`);
  } catch (error) {
    console.warn('⚠️  Failed to cache models:', error.message);
  }
}

async function fetchAvailableModels(apiKey, useCache = true) {
  // Try to load from cache first
  if (useCache) {
    const cachedModels = await loadCachedModels();
    if (cachedModels) {
      return cachedModels;
    }
  }
  
  try {
    console.log('🔍 Fetching available models from OpenRouter...\n');
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/openrouter-cli',
        'X-Title': 'OpenRouter CLI'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    
    // Cache the models for future use
    await saveCachedModels(data.data);
    
    return data.data;
  } catch (error) {
    console.error('Failed to fetch models:', error.message);
    
    // Try to fall back to cache even if it's old
    const cachedModels = await loadCachedModels();
    if (cachedModels) {
      console.log('📦 Falling back to cached models (may be outdated)...\n');
      return cachedModels;
    }
    
    process.exit(1);
  }
}

function displayModels(models) {
  console.log('📋 Available Models on OpenRouter\n');
  console.log('=' .repeat(100));
  
  const sortedModels = models.sort((a, b) => {
    const providerA = a.id.split('/')[0];
    const providerB = b.id.split('/')[0];
    if (providerA !== providerB) return providerA.localeCompare(providerB);
    return a.id.localeCompare(b.id);
  });

  let currentProvider = '';
  
  sortedModels.forEach(model => {
    const provider = model.id.split('/')[0];
    
    if (provider !== currentProvider) {
      currentProvider = provider;
      console.log(`\n🏢 ${provider.toUpperCase()}`);
      console.log('-'.repeat(100));
    }
    
    const pricing = model.pricing;
    const promptPrice = pricing?.prompt ? `$${(parseFloat(pricing.prompt) * 1000000).toFixed(2)}` : 'N/A';
    const completionPrice = pricing?.completion ? `$${(parseFloat(pricing.completion) * 1000000).toFixed(2)}` : 'N/A';
    const contextLength = model.context_length || 'N/A';
    
    console.log(`  📌 ${model.id}`);
    console.log(`     Name: ${model.name}`);
    console.log(`     Context: ${contextLength.toLocaleString()} tokens`);
    console.log(`     Pricing: Input: ${promptPrice} | Output: ${completionPrice} (per 1M tokens)`);
    
    if (model.description) {
      console.log(`     Description: ${model.description.substring(0, 100)}...`);
    }
  });
  
  console.log('\n' + '='.repeat(100));
  console.log(`\nTotal models available: ${models.length}`);
  console.log('\nFor more details, visit: https://openrouter.ai/models');
}

async function getModelInfo(apiKey, modelId) {
  try {
    // Try to get from cache first
    const cachedModels = await loadCachedModels();
    if (cachedModels) {
      const model = cachedModels.find(m => m.id === modelId);
      if (model) {
        return model;
      }
    }
    
    // Fall back to API call
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/openrouter-cli',
        'X-Title': 'OpenRouter CLI'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const model = data.data.find(m => m.id === modelId);
    return model || null;
  } catch (error) {
    return null;
  }
}

async function callOpenRouter(apiKey, apiUrl, model, prompt, systemPrompt) {
  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });

  const requestBody = {
    model: model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 2000
  };

  const startTime = performance.now();

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/openrouter-cli',
        'X-Title': 'OpenRouter CLI'
      },
      body: JSON.stringify(requestBody)
    });

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      id: data.id,
      created: data.created,
      duration: duration,
      rawResponse: data
    };
  } catch (error) {
    console.error('Failed to call OpenRouter API:', error.message);
    process.exit(1);
  }
}

async function generateReport(response, modelInfo, prompt, systemPrompt, options) {
  const report = {
    timestamp: new Date().toISOString(),
    execution: {
      duration_seconds: response.duration.toFixed(3),
      model_used: response.model,
      model_requested: options.model
    },
    tokens: {
      prompt_tokens: response.usage?.prompt_tokens || 0,
      completion_tokens: response.usage?.completion_tokens || 0,
      total_tokens: response.usage?.total_tokens || 0
    },
    cost: {
      currency: 'USD',
      prompt_cost: 0,
      completion_cost: 0,
      total_cost: 0
    },
    model_card: {
      id: modelInfo?.id || options.model,
      name: modelInfo?.name || 'Unknown',
      description: modelInfo?.description || 'No description available',
      context_length: modelInfo?.context_length || 'Unknown',
      architecture: modelInfo?.architecture || {},
      pricing: modelInfo?.pricing || {},
      top_provider: modelInfo?.top_provider || {}
    },
    request: {
      prompt: prompt,
      system_prompt: systemPrompt || null,
      temperature: 0.7,
      max_tokens: 2000
    },
    response_metadata: {
      id: response.id,
      created: response.created,
      object: response.rawResponse.object || 'chat.completion'
    }
  };

  if (modelInfo?.pricing) {
    const promptPrice = parseFloat(modelInfo.pricing.prompt || 0);
    const completionPrice = parseFloat(modelInfo.pricing.completion || 0);
    
    report.cost.prompt_cost = (response.usage?.prompt_tokens || 0) * promptPrice;
    report.cost.completion_cost = (response.usage?.completion_tokens || 0) * completionPrice;
    report.cost.total_cost = report.cost.prompt_cost + report.cost.completion_cost;
    
    report.cost.prompt_cost = parseFloat(report.cost.prompt_cost.toFixed(6));
    report.cost.completion_cost = parseFloat(report.cost.completion_cost.toFixed(6));
    report.cost.total_cost = parseFloat(report.cost.total_cost.toFixed(6));
  }

  return report;
}

async function saveResponseMarkdown(content, model, prompt, usage, duration, outputDir) {
  const markdown = `# OpenRouter API Response

## Metadata
- **Model**: ${model}
- **Timestamp**: ${new Date().toISOString()}
- **Duration**: ${duration.toFixed(3)} seconds

## Token Usage
- **Prompt Tokens**: ${usage?.prompt_tokens || 'N/A'}
- **Completion Tokens**: ${usage?.completion_tokens || 'N/A'}
- **Total Tokens**: ${usage?.total_tokens || 'N/A'}

## Prompt
\`\`\`
${prompt}
\`\`\`

## Response
${content}

---
*Generated by OpenRouter CLI*`;

  const mdPath = path.join(outputDir, 'RESPONSE.md');
  await fs.writeFile(mdPath, markdown, 'utf-8');
  console.log(`📝 Response saved to: ${mdPath}`);
}

function generateHTML(content, model, prompt, report) {
  const timestamp = new Date().toISOString();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenRouter API Response</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            padding: 2rem;
        }
        h1 {
            color: #1a202c;
            margin-bottom: 1.5rem;
            font-size: 2rem;
        }
        .metadata {
            background: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 1rem;
            margin-bottom: 2rem;
            border-radius: 4px;
        }
        .metadata p {
            margin: 0.5rem 0;
            color: #4a5568;
        }
        .metadata strong {
            color: #2d3748;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
        }
        .metric-value {
            font-size: 1.5rem;
            font-weight: bold;
        }
        .metric-label {
            font-size: 0.875rem;
            opacity: 0.9;
        }
        .prompt-section, .response-section {
            margin-bottom: 2rem;
        }
        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 1rem;
        }
        .content-box {
            background: #f9fafb;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: #2d3748;
            line-height: 1.6;
        }
        .response-content {
            background: white;
            border: 2px solid #667eea;
        }
        code {
            background: #edf2f7;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #2d3748;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
        }
        pre code {
            background: transparent;
            padding: 0;
            color: inherit;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 OpenRouter API Response</h1>
        
        <div class="metadata">
            <p><strong>Model:</strong> ${model}</p>
            <p><strong>Generated:</strong> ${timestamp}</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${report?.tokens?.total_tokens || 'N/A'}</div>
                <div class="metric-label">Total Tokens</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report?.execution?.duration_seconds || 'N/A'}s</div>
                <div class="metric-label">Duration</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$${report?.cost?.total_cost?.toFixed(4) || '0.0000'}</div>
                <div class="metric-label">Total Cost</div>
            </div>
        </div>
        
        <div class="prompt-section">
            <div class="section-title">📝 Prompt</div>
            <div class="content-box">${escapeHtml(prompt)}</div>
        </div>
        
        <div class="response-section">
            <div class="section-title">💬 Response</div>
            <div class="content-box response-content">${formatContent(content)}</div>
        </div>
    </div>
</body>
</html>`;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatContent(text) {
  text = escapeHtml(text);
  
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });
  
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  text = text.replace(/\n/g, '<br>');
  
  return text;
}

async function saveOutput(html, outputPath) {
  try {
    const resolvedPath = path.resolve(outputPath);
    const dir = path.dirname(resolvedPath);
    
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(resolvedPath, html, 'utf-8');
    console.log(`✅ HTML output saved to: ${resolvedPath}`);
  } catch (error) {
    console.error('Failed to save output:', error.message);
    process.exit(1);
  }
}

program
  .name('openrouter-cli')
  .description('CLI tool to call OpenRouter API and generate HTML output')
  .version('1.0.0')
  .option('-p, --prompt <prompt>', 'The prompt to send to the model')
  .option('-o, --output <path>', 'Output path for the HTML file')
  .option('-m, --model <model>', 'Model to use', process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-3.5-turbo')
  .option('-s, --system <prompt>', 'System prompt for the model')
  .option('--api-key <key>', 'OpenRouter API key (overrides env variable)')
  .option('--api-url <url>', 'OpenRouter API URL (overrides env variable)')
  .option('--list-models', 'List all available models from OpenRouter API')
  .option('--fetch-models', 'Fetch and display all available models from API')
  .option('--refresh-cache', 'Force refresh of model cache')
  .parse();

const options = program.opts();

const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
const apiUrl = options.apiUrl || process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';

if (options.listModels || options.fetchModels) {
  validateConfig(apiKey, apiUrl);
  const useCache = !options.refreshCache;
  const models = await fetchAvailableModels(apiKey, useCache);
  displayModels(models);
  process.exit(0);
}

if (!options.prompt || !options.output) {
  console.error('Error: Both --prompt and --output are required');
  program.help();
  process.exit(1);
}

validateConfig(apiKey, apiUrl);

console.log(`🚀 Calling OpenRouter API...`);
console.log(`📍 Model: ${options.model}`);

const modelInfo = await getModelInfo(apiKey, options.model);

const response = await callOpenRouter(
  apiKey,
  apiUrl,
  options.model,
  options.prompt,
  options.system
);

const outputDir = path.dirname(path.resolve(options.output));

const report = await generateReport(
  response,
  modelInfo,
  options.prompt,
  options.system,
  options
);

const reportPath = path.join(outputDir, 'report.json');
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
console.log(`📊 Report saved to: ${reportPath}`);

await saveResponseMarkdown(
  response.content,
  response.model,
  options.prompt,
  response.usage,
  response.duration,
  outputDir
);

const html = generateHTML(response.content, options.model, options.prompt, report);
await saveOutput(html, options.output);

console.log(`\n📈 Performance Metrics:`);
console.log(`   ⏱️  Duration: ${response.duration.toFixed(3)} seconds`);
console.log(`   📝 Prompt Tokens: ${response.usage?.prompt_tokens || 'N/A'}`);
console.log(`   💬 Completion Tokens: ${response.usage?.completion_tokens || 'N/A'}`);
console.log(`   📊 Total Tokens: ${response.usage?.total_tokens || 'N/A'}`);
if (report.cost.total_cost > 0) {
  console.log(`   💰 Total Cost: $${report.cost.total_cost.toFixed(6)}`);
}