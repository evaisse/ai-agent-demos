#!/usr/bin/env node

import { program } from 'commander';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { HttpsProxyAgent } from 'https-proxy-agent';
import http from 'http';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { spawn } from 'child_process';
import { createServer } from 'net';

dotenv.config();


const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'xxxx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));




// Utility function to create slug from title
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Utility function to check if directory exists
async function directoryExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

// OpenRouter API utility functions
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

// Get proxy configuration from environment variables
function getProxyAgent(url) {
  const isHttps = url.startsWith('https://');
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || 
                   process.env.HTTP_PROXY || process.env.http_proxy;
  
  if (proxyUrl && isHttps) {
    return new HttpsProxyAgent(proxyUrl);
  }
  
  return undefined;
}

// Centralized HTTP request function for all OpenRouter API calls
async function makeOpenRouterRequest(url, options = {}) {
  const {
    method = 'GET',
    body = null,
    apiKey = OPENROUTER_API_KEY,
    description = 'API Request'
  } = options;

  const requestBody = body ? JSON.stringify(body) : null;
  const requestSize = requestBody ? new Blob([requestBody]).size : 0;
  
  // Get proxy agent if proxy is configured
  const agent = getProxyAgent(url);
  
  // One-line debug log with proxy info
  const proxyInfo = agent ? ` via proxy` : '';
  console.log(`🔍 ${method} ${url} (${requestSize}b out)${proxyInfo} - ${description}`);
  
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': 'https://github.com/openrouter-cli',
    'X-Title': 'OpenRouter CLI'
  };
  
  if (requestBody) {
    headers['Content-Type'] = 'application/json';
  }
  
  const startTime = performance.now();

  try {
    const fetchOptions = {
      method,
      headers,
      body: requestBody
    };
    
    // Add agent if proxy is configured
    if (agent) {
      fetchOptions.agent = agent;
    }
    
    const response = await fetch(url, fetchOptions);

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    
    const responseText = await response.text();
    const responseSize = new Blob([responseText]).size;
    
    // One-line response log
    console.log(`✅ ${response.status} ${response.statusText} (${responseSize}b in, ${duration.toFixed(3)}s)`);

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseText,
      duration
    };
  } catch (error) {
    console.error(`Failed to make ${method} request to ${url}:`, error.message);
    throw error;
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

async function fetchAvailableModels(useCache = true) {
  // Try to load from cache first
  if (useCache) {
    const cachedModels = await loadCachedModels();
    if (cachedModels) {
      return cachedModels;
    }
  }
  
  try {
    console.log('🔍 Fetching available models from OpenRouter...');
    
    const url = `${OPENROUTER_API_URL}/models`;
    const response = await makeOpenRouterRequest(url, {
      // apiKey,
      description: 'Fetch Available Models'
    });

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${response.data}`);
    }

    const data = JSON.parse(response.data);
    
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

async function getModelInfo(modelId) {
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
    const url = `${OPENROUTER_API_URL}/models`;
    const response = await makeOpenRouterRequest(url, {
      // apiKey,
      description: 'Model Lookup'
    });

    if (!response.ok) {
      return null;
    }

    const data = JSON.parse(response.data);
    const model = data.data.find(m => m.id === modelId);
    return model || null;
  } catch (error) {
    return null;
  }
}

async function callOpenRouter(apiUrl, model, prompt, systemPrompt) {
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
    const response = await makeOpenRouterRequest(`${apiUrl}/chat/completions`, {
      method: 'POST',
      body: requestBody,
      description: 'Chat Completion'
    });

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${response.data}`);
    }

    const data = JSON.parse(response.data);
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      id: data.id,
      created: data.created,
      duration: response.duration,
      rawResponse: data
    };
  } catch (error) {
    console.error('Failed to call OpenRouter API:', error.message);
    throw error;
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
    },
    raw_response: response.content
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

// Extract HTML code from AI response
function extractHTMLFromResponse(responseContent) {
  // First try to find HTML code blocks (```html...``` or ```...```)
  const htmlCodeBlockRegex = /```(?:html)?\s*\n?(<!DOCTYPE html[\s\S]*?<\/html>)\s*```/i;
  const match = responseContent.match(htmlCodeBlockRegex);
  
  if (match) {
    return match[1].trim();
  }
  
  // If no code block, look for HTML document starting with <!DOCTYPE html
  const doctypeRegex = /(<!DOCTYPE html[\s\S]*?<\/html>)/i;
  const doctypeMatch = responseContent.match(doctypeRegex);
  
  if (doctypeMatch) {
    return doctypeMatch[1].trim();
  }
  
  // If no <!DOCTYPE, look for <html> tag
  const htmlTagRegex = /(<html[\s\S]*?<\/html>)/i;
  const htmlTagMatch = responseContent.match(htmlTagRegex);
  
  if (htmlTagMatch) {
    return htmlTagMatch[1].trim();
  }
  
  // If still no match, look for any substantial HTML-like content
  const generalHtmlRegex = /(<[^>]+>[\s\S]*<\/[^>]+>)/;
  const generalMatch = responseContent.match(generalHtmlRegex);
  
  if (generalMatch) {
    // Wrap in basic HTML document structure
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Demo</title>
</head>
<body>
${generalMatch[1].trim()}
</body>
</html>`;
  }
  
  // Fallback: wrap entire response in basic HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Demo</title>
</head>
<body>
    <h1>Generated Content</h1>
    <pre>${escapeHtml(responseContent)}</pre>
</body>
</html>`;
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
    throw error;
  }
}

// Utility function to generate demo using OpenRouter API
async function generateDemoWithModel(prompt, model, outputPath, systemPrompt = null) {
  console.log(`🤖 Generating with model: ${model}`);
  
  // Get API configuration
  const apiKey = process.env.OPENROUTER_API_KEY;
  const apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter-proxy-h2dj.onrender.com/api/v1/chat/completions';
  
  // Validate configuration
  validateConfig(apiKey, apiUrl);
  
  // Get model information
  const modelInfo = await getModelInfo(model);
  
  // Call OpenRouter API
  const response = await callOpenRouter(apiUrl, model, prompt, systemPrompt);
  
  // Generate report
  const report = await generateReport(response, modelInfo, prompt, systemPrompt, { model });
  
  // Create output directory
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });
  
  // Save all outputs
  const reportPath = path.join(outputDir, 'report.json');
  const resultsPath = path.join(outputDir, 'results.json');
  
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  await fs.writeFile(resultsPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📊 Report saved to: ${reportPath}`);
  
  await saveResponseMarkdown(
    response.content,
    response.model,
    prompt,
    response.usage,
    response.duration,
    outputDir
  );
  
  // Extract and save HTML code from AI response
  const extractedHTML = extractHTMLFromResponse(response.content);
  await saveOutput(extractedHTML, outputPath);
  
  // Also save the formatted report as report.html for debugging/reference
  const reportHTML = generateHTML(response.content, model, prompt, report);
  const reportHtmlPath = path.join(outputDir, 'report.html');
  await saveOutput(reportHTML, reportHtmlPath);
  
  console.log(`\n📈 Performance Metrics:`);
  console.log(`   ⏱️  Duration: ${response.duration.toFixed(3)} seconds`);
  console.log(`   📝 Prompt Tokens: ${response.usage?.prompt_tokens || 'N/A'}`);
  console.log(`   💬 Completion Tokens: ${response.usage?.completion_tokens || 'N/A'}`);
  console.log(`   📊 Total Tokens: ${response.usage?.total_tokens || 'N/A'}`);
  if (report.cost.total_cost > 0) {
    console.log(`   💰 Total Cost: $${report.cost.total_cost.toFixed(6)}`);
  }
  
  // Auto-regenerate viewer data to include this new demo
  console.log(`\n🔄 Updating viewer data...`);
  try {
    await generateViewerData('pages', true); // Silent mode
    console.log(`✅ Viewer data updated automatically`);
  } catch (error) {
    console.warn(`⚠️  Could not update viewer data: ${error.message}`);
  }
}

// Find an available port starting from a given port
function findAvailablePort(startPort = 8900, maxAttempts = 100) {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;
    
    function tryPort(port) {
      if (attempts >= maxAttempts) {
        reject(new Error(`Could not find an available port after ${maxAttempts} attempts starting from ${startPort}`));
        return;
      }
      
      const server = createServer();
      
      server.listen(port, (err) => {
        if (err) {
          attempts++;
          currentPort++;
          tryPort(currentPort);
        } else {
          server.close(() => {
            resolve(port);
          });
        }
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          attempts++;
          currentPort++;
          tryPort(currentPort);
        } else {
          reject(err);
        }
      });
    }
    
    tryPort(currentPort);
  });
}

// Open URL in browser
function openBrowser(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'darwin') {
    command = 'open';
  } else if (platform === 'win32') {
    command = 'start';
  } else {
    command = 'xdg-open';
  }
  
  try {
    spawn(command, [url], { detached: true, stdio: 'ignore' });
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Could not open browser automatically: ${error.message}`));
  }
}

// Static server utility function
function startStaticServer(directory, port = 3000) {
  const server = http.createServer(async (req, res) => {
    try {
      // Parse URL and remove query parameters
      const url = new URL(req.url, `http://localhost:${port}`);
      let pathname = url.pathname;
      
      // Default to index.html for directory requests
      if (pathname.endsWith('/')) {
        pathname += 'index.html';
      }
      
      // Security: prevent directory traversal
      if (pathname.includes('..')) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request: Invalid path');
        return;
      }
      
      const filePath = path.join(directory, pathname);
      
      try {
        const stats = await stat(filePath);
        
        if (!stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }
        
        // Set content type based on file extension
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon'
        };
        
        const contentType = contentTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Cache-Control': 'no-cache'
        });
        
        // Stream the file
        const readStream = createReadStream(filePath);
        readStream.pipe(res);
        
        readStream.on('error', (err) => {
          console.error(`Error reading file ${filePath}:`, err.message);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
          }
        });
        
      } catch (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        } else {
          console.error(`Error accessing file ${filePath}:`, err.message);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        }
      }
    } catch (err) {
      console.error('Server error:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });
  
  return new Promise((resolve, reject) => {
    server.listen(port, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(server);
      }
    });
  });
}

// Generate viewer data (demos.json) - extracted from generate-viewer command
async function generateViewerData(outputDir = 'pages', silent = false) {
  try {
    const resolvedOutputDir = path.join(path.dirname(__dirname), outputDir);
    const demosJsonPath = path.join(resolvedOutputDir, 'demos.json');
    
    if (!silent) {
      console.log(`🎨 Generating demo metadata...`);
    }
    
    // Scan for demos and their generated models
    const demosDir = path.join(path.dirname(__dirname), 'pages', 'demos');
    const demos = [];
    
    try {
      const demoEntries = await fs.readdir(demosDir, { withFileTypes: true });
      
      for (const entry of demoEntries.filter(e => e.isDirectory())) {
        const demoName = entry.name;
        const demoPath = path.join(demosDir, demoName);
        const promptPath = path.join(demoPath, 'PROMPT.md');
        
        // Check if demo has PROMPT.md
        let prompt = '';
        try {
          prompt = await fs.readFile(promptPath, 'utf-8');
        } catch {
          continue; // Skip if no PROMPT.md
        }
        
        // Find all generated models
        const models = [];
        const modelEntries = await fs.readdir(demoPath, { withFileTypes: true });
        
        for (const modelEntry of modelEntries.filter(e => e.isDirectory())) {
          const modelName = modelEntry.name;
          const modelPath = path.join(demoPath, modelName);
          const htmlPath = path.join(modelPath, 'index.html');
          const resultsPath = path.join(modelPath, 'results.json');
          
          // Check if HTML and results exist
          try {
            await fs.access(htmlPath);
            let results = null;
            try {
              const resultsContent = await fs.readFile(resultsPath, 'utf-8');
              results = JSON.parse(resultsContent);
            } catch {
              // Results file doesn't exist or is invalid
            }
            
            models.push({
              name: modelName,
              htmlPath: path.relative(resolvedOutputDir, htmlPath),
              results: results
            });
          } catch {
            // HTML doesn't exist, skip this model
          }
        }
        
        if (models.length > 0) {
          demos.push({
            name: demoName,
            title: demoName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            prompt: prompt,
            models: models
          });
        }
      }
    } catch (error) {
      if (!silent) {
        console.warn('⚠️  Could not scan demos directory:', error.message);
      }
    }
    
    // Ensure output directory exists
    await fs.mkdir(resolvedOutputDir, { recursive: true });
    
    // Generate and write demos.json
    await fs.writeFile(demosJsonPath, JSON.stringify(demos, null, 2), 'utf-8');
    
    if (!silent) {
      console.log(`📋 Generated demos.json with ${demos.length} demo(s)`);
      console.log(`✅ Viewer data updated!`);
      console.log(`📋 Data: ${demosJsonPath}`);
    }
    
    return { demos, demosJsonPath };
  } catch (error) {
    if (!silent) {
      console.error('❌ Failed to generate viewer data:', error.message);
    }
    throw error;
  }
}

// Command: create-demo
program
  .command('create-demo')
  .description('Create a new demo with title and prompt')
  .option('-t, --title <title>', 'Demo title')
  .option('-p, --prompt <prompt>', 'Demo prompt text')
  .action(async (options) => {
    try {
      let { title, prompt } = options;
      
      // Interactive prompts if not provided
      if (!title || !prompt) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: '📝 Enter the demo title:',
            validate: (input) => input.trim() !== '' || 'Title is required',
            when: () => !title
          },
          {
            type: 'editor',
            name: 'prompt',
            message: '✏️  Enter the demo prompt (opens in editor):',
            default: 'In a single HTML file named index.html, create ',
            validate: (input) => input.trim() !== '' || 'Prompt is required',
            when: () => !prompt
          }
        ]);
        
        title = title || answers.title;
        prompt = prompt || answers.prompt;
      }
      
      // Ensure prompt has the correct prefix
      if (!prompt.startsWith('In a single HTML file named index.html, create')) {
        const confirmAnswer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'addPrefix',
            message: chalk.yellow('⚠️  Your prompt doesn\'t start with the standard prefix. Add it?'),
            default: true
          }
        ]);
        
        if (confirmAnswer.addPrefix) {
          prompt = 'In a single HTML file named index.html, create ' + prompt;
        }
      }
      
      const slug = createSlug(title);
      const demoDir = path.join(path.dirname(__dirname), 'pages', 'demos', slug);
      
      console.log(`📁 Creating demo: ${title} (${slug})`);
      
      // Check if demo already exists
      if (await directoryExists(demoDir)) {
        console.error(`❌ Demo '${slug}' already exists in ${demoDir}`);
        process.exit(1);
      }
      
      // Create demo directory
      await fs.mkdir(demoDir, { recursive: true });
      
      // Create PROMPT.md
      const promptPath = path.join(demoDir, 'PROMPT.md');
      await fs.writeFile(promptPath, prompt, 'utf-8');
      
      // Create README.md
      const readmePath = path.join(demoDir, 'README.md');
      const readmeContent = `# ${title}

## Description
${title} demo generated using AI models via OpenRouter API.

## Prompt
See \`PROMPT.md\` for the exact prompt used to generate this demo.

## Generated Models
Results will appear in model-specific subdirectories when generated.
`;
      await fs.writeFile(readmePath, readmeContent, 'utf-8');
      
      console.log(chalk.green(`\n✅ Demo created successfully!`));
      console.log(chalk.gray(`📂 Location: ${demoDir}`));
      console.log(chalk.gray(`📝 Prompt saved to: ${promptPath}`));
      console.log(chalk.gray(`📖 README created: ${readmePath}`));
      console.log('');
      console.log(chalk.cyan(`Next step: Generate the demo with a model:`));
      console.log(chalk.white(`  npm run generate-demo -- -d ${slug}`));
      console.log(chalk.gray(`  (You'll be prompted to select a model interactively)`));
      
    } catch (error) {
      console.error('❌ Failed to create demo:', error.message);
      process.exit(1);
    }
  });

// Command: generate-demo
program
  .command('generate-demo')
  .description('Generate HTML demo using OpenRouter API')
  .option('-d, --demo <demo>', 'Demo slug (directory name)')
  .option('-m, --model <model>', 'OpenRouter model to use (e.g., openai/gpt-3.5-turbo)')
  .option('-f, --force', 'Force regeneration if demo already exists')
  .action(async (options) => {
    try {
      let { demo, model, force } = options;
      
      // Interactive demo selection if not provided
      if (!demo) {
        const demosDir = path.join(path.dirname(__dirname), 'pages', 'demos');
        const demos = await fs.readdir(demosDir, { withFileTypes: true });
        const demoChoices = demos
          .filter(entry => entry.isDirectory())
          .map(entry => entry.name);
        
        if (demoChoices.length === 0) {
          console.log(chalk.yellow('⚠️  No demos found. Please create a demo first.'));
          console.log(chalk.gray('  Run: npm run create-demo'));
          process.exit(1);
        }
        
        const demoAnswer = await inquirer.prompt([
          {
            type: 'list',
            name: 'demo',
            message: '📁 Select a demo to generate:',
            choices: demoChoices,
            pageSize: 10
          }
        ]);
        demo = demoAnswer.demo;
      }
      
      // Interactive model selection if not provided
      if (!model) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
          console.error(chalk.red('❌ Error: OpenRouter API key is required.'));
          console.error(chalk.yellow('   Set it via OPENROUTER_API_KEY env variable or .env file'));
          process.exit(1);
        }
        
        const spinner = ora('Loading available models...').start();
        
        try {
          const models = await fetchAvailableModels(true);
          spinner.succeed('Models loaded!');
          
          // Group models by provider for better organization
          const modelsByProvider = {};
          models.forEach(m => {
            const provider = m.id.split('/')[0];
            if (!modelsByProvider[provider]) {
              modelsByProvider[provider] = [];
            }
            modelsByProvider[provider].push(m);
          });
          
          // Create choices with separators
          const modelChoices = [];
          const popularModels = [
            'openai/gpt-4o',
            'openai/gpt-4o-mini',
            'anthropic/claude-3.5-sonnet',
            'anthropic/claude-3-haiku',
            'google/gemini-pro-1.5',
            'meta-llama/llama-3.1-70b-instruct'
          ];
          
          // Add popular models first
          modelChoices.push(new inquirer.Separator(chalk.cyan('═══ Popular Models ═══')));
          popularModels.forEach(modelId => {
            const model = models.find(m => m.id === modelId);
            if (model) {
              const price = model.pricing?.prompt ? 
                `$${(parseFloat(model.pricing.prompt) * 1000000).toFixed(2)}/M` : 
                'N/A';
              modelChoices.push({
                name: `${model.id} ${chalk.gray(`(${price} tokens)`)}`,
                value: model.id,
                short: model.id
              });
            }
          });
          
          // Add all models grouped by provider
          modelChoices.push(new inquirer.Separator(chalk.cyan('═══ All Models by Provider ═══')));
          Object.keys(modelsByProvider).sort().forEach(provider => {
            modelChoices.push(new inquirer.Separator(chalk.yellow(`── ${provider.toUpperCase()} ──`)));
            modelsByProvider[provider].forEach(model => {
              const price = model.pricing?.prompt ? 
                `$${(parseFloat(model.pricing.prompt) * 1000000).toFixed(2)}/M` : 
                'N/A';
              modelChoices.push({
                name: `${model.id} ${chalk.gray(`(${price} tokens)`)}`,
                value: model.id,
                short: model.id
              });
            });
          });
          
          const modelAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'model',
              message: '🤖 Select a model to use:',
              choices: modelChoices,
              pageSize: 15,
              loop: false
            }
          ]);
          model = modelAnswer.model;
        } catch (error) {
          spinner.fail('Failed to load models');
          console.error(chalk.red(error.message));
          process.exit(1);
        }
      }
      
      const demoDir = path.join(path.dirname(__dirname), 'pages', 'demos', demo);
      const promptPath = path.join(demoDir, 'PROMPT.md');
      
      console.log(chalk.blue(`\n🚀 Generating demo: ${chalk.bold(demo)} with model: ${chalk.bold(model)}`))
      
      // Check if demo directory exists
      if (!await directoryExists(demoDir)) {
        console.error(`❌ Demo '${demo}' not found in ${demoDir}`);
        console.error('Available demos:');
        try {
          const demosDir = path.join(path.dirname(__dirname), 'pages', 'demos');
          const demos = await fs.readdir(demosDir, { withFileTypes: true });
          demos
            .filter(entry => entry.isDirectory())
            .forEach(entry => console.error(`  - ${entry.name}`));
        } catch {
          console.error('  No demos found');
        }
        process.exit(1);
      }
      
      // Check if PROMPT.md exists
      try {
        await fs.access(promptPath);
      } catch {
        console.error(`❌ PROMPT.md not found in demo directory: ${promptPath}`);
        process.exit(1);
      }
      
      // Create model-specific directory
      const modelDir = path.join(demoDir, model);
      const outputPath = path.join(modelDir, 'index.html');
      
      // Check if demo already exists and force is not set
      if (!force && await directoryExists(modelDir)) {
        try {
          await fs.access(outputPath);
          console.log(`⚠️  Demo already exists for model '${model}'`);
          console.log(`   Location: ${outputPath}`);
          
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: 'Do you want to overwrite the existing demo?',
              default: false
            }
          ]);
          
          if (!overwrite) {
            console.log(chalk.yellow('Demo generation cancelled.'));
            process.exit(0);
          }
        } catch {
          // File doesn't exist, continue
        }
      }
      
      // Create model directory
      await fs.mkdir(modelDir, { recursive: true });
      
      // Read prompt
      const prompt = await fs.readFile(promptPath, 'utf-8');
      
      // Generate demo using direct function call
      await generateDemoWithModel(prompt, model, outputPath);
      
      console.log(chalk.green(`\n✅ Demo generated successfully!`));
      console.log(chalk.gray(`📄 Generated HTML: ${outputPath}`));
      console.log(chalk.gray(`📊 Metrics: ${path.join(modelDir, 'results.json')}`));
      console.log(chalk.gray(`📝 Full Response: ${path.join(modelDir, 'RESPONSE.md')}`));
      console.log(chalk.gray(`📋 Detailed Report: ${path.join(modelDir, 'report.html')}`));
      
      // Ask if user wants to start preview server
      const { startPreview } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'startPreview',
          message: 'Would you like to start the preview server and view the demo?',
          default: true
        }
      ]);
      
      if (startPreview) {
        console.log(chalk.cyan('\n🚀 Starting preview server...'));
        const previewUrl = `http://localhost:8900/?demo=${demo}&model=${model.replace('/', '-')}`;
        const pagesDir = path.join(path.dirname(__dirname), 'pages');
        await startStaticServer(pagesDir, 8900, previewUrl);
      } else {
        console.log('');
        console.log(chalk.cyan(`Next steps:`));
        console.log(chalk.white(`  1. Open the generated demo: open "${outputPath}"`));
        console.log(chalk.white(`  2. Preview all demos: npm run preview-server`));
        console.log(chalk.white(`  3. Try another model: npm run generate-demo -- -d ${demo}`));
      }
      
    } catch (error) {
      console.error('❌ Failed to generate demo:', error.message);
      process.exit(1);
    }
  });

// Command: generate-viewer
program
  .command('generate-viewer')
  .description('Generate the demos.json file for the static viewer')
  .option('-o, --output <path>', 'Output directory for viewer files', 'pages')
  .action(async (options) => {
    try {
      const { output } = options;
      const { demos } = await generateViewerData(output, false);
      
      if (demos.length === 0) {
        console.log('');
        console.log('💡 Tip: Generate some demos first:');
        console.log('   npm run create-demo -- -t "My Demo" -p "Create a demo..."');
        console.log('   npm run generate-demo -- -d my-demo -m openai/gpt-3.5-turbo');
      } else {
        console.log('');
        console.log('🌐 Open pages/index.html in your browser to explore the demos!');
      }
      
    } catch (error) {
      console.error('❌ Failed to generate viewer data:', error.message);
      process.exit(1);
    }
  });


// Command: list-demos
program
  .command('list-demos')
  .description('List all available demos')
  .action(async () => {
    try {
      const demosDir = path.join(path.dirname(__dirname), 'pages', 'demos');
      console.log('📂 Available demos:\n');
      
      const entries = await fs.readdir(demosDir, { withFileTypes: true });
      const demos = entries.filter(entry => entry.isDirectory());
      
      if (demos.length === 0) {
        console.log('  No demos found.\n');
        console.log('💡 Create a demo with:');
        console.log('   node cli.js create-demo -t "Demo Title" -p "Your prompt..."');
        return;
      }
      
      for (const demo of demos) {
        const demoPath = path.join(demosDir, demo.name);
        const promptPath = path.join(demoPath, 'PROMPT.md');
        
        console.log(`  📌 ${demo.name}`);
        
        try {
          await fs.access(promptPath);
          console.log('     ✅ Has PROMPT.md');
        } catch {
          console.log('     ❌ Missing PROMPT.md');
        }
        
        // Count generated models
        try {
          const modelEntries = await fs.readdir(demoPath, { withFileTypes: true });
          const modelDirs = modelEntries.filter(entry => entry.isDirectory());
          
          let generatedCount = 0;
          for (const modelDir of modelDirs) {
            const htmlPath = path.join(demoPath, modelDir.name, 'index.html');
            try {
              await fs.access(htmlPath);
              generatedCount++;
            } catch {
              // HTML doesn't exist
            }
          }
          
          console.log(`     🤖 ${generatedCount} model(s) generated`);
          
          if (generatedCount > 0) {
            console.log(`     📊 Models: ${modelDirs.map(d => d.name).join(', ')}`);
          }
          
        } catch {
          console.log('     🤖 0 models generated');
        }
        
        console.log('');
      }
      
    } catch (error) {
      console.error('❌ Failed to list demos:', error.message);
      process.exit(1);
    }
  });

// Command: list-models
program
  .command('list-models')
  .description('List all available models on OpenRouter')
  .option('--no-cache', 'Force refresh from API (bypass cache)')
  .action(async (options) => {
    try {
      // Get API configuration
      const apiKey = process.env.OPENROUTER_API_KEY;
      
      if (!apiKey) {
        console.error('❌ Error: OpenRouter API key is required.');
        console.error('   Set it via OPENROUTER_API_KEY env variable or .env file');
        process.exit(1);
      }
      
      // Fetch models
      const models = await fetchAvailableModels(options.cache);
      
      // Display models
      displayModels(models);
      
    } catch (error) {
      console.error('❌ Failed to list models:', error.message);
      process.exit(1);
    }
  });

// Command: preview-server
program
  .command('preview-server')
  .description('Start a static file server to preview demos')
  .option('-p, --port <port>', 'Specific port to serve on (if not specified, auto-finds from 8900+)')
  .option('-d, --directory <path>', 'Directory to serve', 'pages')
  .option('--no-open', 'Do not open browser automatically')
  .action(async (options) => {
    try {
      let port;
      const directory = path.resolve(options.directory);
      
      // If port is specified, use it; otherwise find an available port starting from 8081
      if (options.port) {
        port = parseInt(options.port, 10);
      } else {
        console.log(chalk.cyan(`🔍 Finding available port starting from 8900...`));
        port = await findAvailablePort(8900);
        console.log(chalk.green(`✅ Found available port: ${port}`));
      }
      
      // Check if directory exists
      try {
        const stats = await stat(directory);
        if (!stats.isDirectory()) {
          console.error(chalk.red(`❌ Error: ${directory} is not a directory`));
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error: Directory ${directory} does not exist`));
        process.exit(1);
      }
      
      console.log(chalk.cyan(`🚀 Starting static server...`));
      console.log(chalk.gray(`   Directory: ${directory}`));
      console.log(chalk.gray(`   Port: ${port}`));
      
      const server = await startStaticServer(directory, port);
      const url = `http://localhost:${port}`;
      
      console.log(chalk.green(`\n✅ Server running!`));
      console.log(chalk.white(`🌐 Open your browser to: ${chalk.bold(url)}`));
      console.log(chalk.gray(`📁 Serving files from: ${directory}`));
      
      // Open browser automatically unless --no-open was specified
      if (options.open !== false) {
        console.log(chalk.cyan(`🚀 Opening browser...`));
        openBrowser(url);
      }
      
      console.log(chalk.yellow(`\n⏹️  Press Ctrl+C to stop the server\n`));
      
      // Track shutdown state to prevent multiple shutdowns
      let isShuttingDown = false;
      
      // Handle graceful shutdown
      const handleShutdown = (signal) => {
        if (isShuttingDown) {
          return; // Prevent multiple shutdown attempts
        }
        isShuttingDown = true;
        
        console.log(chalk.yellow(`\n⏹️  Shutting down server...`));
        server.close(() => {
          console.log(chalk.green('✅ Server stopped'));
          process.exit(0);
        });
        
        // Force exit if server doesn't close within 5 seconds
        setTimeout(() => {
          console.log(chalk.red('⚠️  Force stopping server...'));
          process.exit(1);
        }, 5000);
      };
      
      // Use process.once to ensure handlers are only added once
      process.once('SIGINT', () => handleShutdown('SIGINT'));
      process.once('SIGTERM', () => handleShutdown('SIGTERM'));
      
    } catch (error) {
      if (error.code === 'EADDRINUSE' && options.port) {
        console.error(chalk.red(`❌ Error: Port ${options.port} is already in use`));
        console.error(chalk.yellow(`   Try omitting --port to auto-find an available port`));
      } else if (error.message.includes('Could not find an available port')) {
        console.error(chalk.red(`❌ Error: ${error.message}`));
        console.error(chalk.yellow(`   Try specifying a port manually with: --port <number>`));
      } else {
        console.error(chalk.red('❌ Failed to start server:'), error.message);
      }
      process.exit(1);
    }
  });

// Setup program
program
  .name('ai-demo-cli')
  .description('AI Demo Generator - Create and manage AI-powered demos')
  .version('1.0.0');

program.parse();