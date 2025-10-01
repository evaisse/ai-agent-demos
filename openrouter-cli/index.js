#!/usr/bin/env node

import { program } from 'commander';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

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

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Failed to call OpenRouter API:', error.message);
    process.exit(1);
  }
}

function generateHTML(content, model, prompt) {
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
  .option('-m, --model <model>', 'Model to use', process.env.DEFAULT_MODEL || 'openai/gpt-3.5-turbo')
  .option('-s, --system <prompt>', 'System prompt for the model')
  .option('--api-key <key>', 'OpenRouter API key (overrides env variable)')
  .option('--api-url <url>', 'OpenRouter API URL (overrides env variable)')
  .option('--list-models', 'List popular available models')
  .parse();

const options = program.opts();

if (options.listModels) {
  console.log(`
Popular OpenRouter Models:
--------------------------
openai/gpt-4
openai/gpt-4-turbo-preview
openai/gpt-3.5-turbo
anthropic/claude-3-opus
anthropic/claude-3-sonnet
anthropic/claude-3-haiku
google/gemini-pro
meta-llama/llama-3-70b-instruct
mistralai/mistral-large

For a complete list, visit: https://openrouter.ai/models
`);
  process.exit(0);
}

if (!options.prompt || !options.output) {
  console.error('Error: Both --prompt and --output are required');
  program.help();
  process.exit(1);
}

const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
const apiUrl = options.apiUrl || process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';

validateConfig(apiKey, apiUrl);

console.log(`🚀 Calling OpenRouter API...`);
console.log(`📍 Model: ${options.model}`);

const response = await callOpenRouter(
  apiKey,
  apiUrl,
  options.model,
  options.prompt,
  options.system
);

const html = generateHTML(response, options.model, options.prompt);

await saveOutput(html, options.output);