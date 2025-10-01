#!/usr/bin/env node

import { program } from 'commander';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';

dotenv.config();

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
  const apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
  
  // Validate configuration
  validateConfig(apiKey, apiUrl);
  
  // Get model information
  const modelInfo = await getModelInfo(apiKey, model);
  
  // Call OpenRouter API
  const response = await callOpenRouter(apiKey, apiUrl, model, prompt, systemPrompt);
  
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
  
  // Generate and save HTML
  const html = generateHTML(response.content, model, prompt, report);
  await saveOutput(html, outputPath);
  
  console.log(`\n📈 Performance Metrics:`);
  console.log(`   ⏱️  Duration: ${response.duration.toFixed(3)} seconds`);
  console.log(`   📝 Prompt Tokens: ${response.usage?.prompt_tokens || 'N/A'}`);
  console.log(`   💬 Completion Tokens: ${response.usage?.completion_tokens || 'N/A'}`);
  console.log(`   📊 Total Tokens: ${response.usage?.total_tokens || 'N/A'}`);
  if (report.cost.total_cost > 0) {
    console.log(`   💰 Total Cost: $${report.cost.total_cost.toFixed(6)}`);
  }
}

// Command: create-demo
program
  .command('create-demo')
  .description('Create a new demo with title and prompt')
  .requiredOption('-t, --title <title>', 'Demo title')
  .requiredOption('-p, --prompt <prompt>', 'Demo prompt text')
  .action(async (options) => {
    try {
      const { title, prompt } = options;
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
      
      console.log(`✅ Demo created successfully!`);
      console.log(`📂 Location: ${demoDir}`);
      console.log(`📝 Prompt saved to: ${promptPath}`);
      console.log(`📖 README created: ${readmePath}`);
      console.log('');
      console.log(`Next step: Generate the demo with a model:`);
      console.log(`  npm run generate-demo -- -d ${slug} -m openai/gpt-3.5-turbo`);
      
    } catch (error) {
      console.error('❌ Failed to create demo:', error.message);
      process.exit(1);
    }
  });

// Command: generate-demo
program
  .command('generate-demo')
  .description('Generate HTML demo using OpenRouter API')
  .requiredOption('-d, --demo <demo>', 'Demo slug (directory name)')
  .requiredOption('-m, --model <model>', 'OpenRouter model to use (e.g., openai/gpt-3.5-turbo)')
  .option('-f, --force', 'Force regeneration if demo already exists')
  .action(async (options) => {
    try {
      const { demo, model, force } = options;
      const demoDir = path.join(path.dirname(__dirname), 'pages', 'demos', demo);
      const promptPath = path.join(demoDir, 'PROMPT.md');
      
      console.log(`🚀 Generating demo: ${demo} with model: ${model}`);
      
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
          console.error(`❌ Demo already exists for model '${model}'`);
          console.error(`   Location: ${outputPath}`);
          console.error('   Use --force to overwrite');
          process.exit(1);
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
      
      console.log(`✅ Demo generated successfully!`);
      console.log(`📂 Location: ${outputPath}`);
      console.log(`📊 Metrics: ${path.join(modelDir, 'results.json')}`);
      console.log(`📝 Response: ${path.join(modelDir, 'RESPONSE.md')}`);
      
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
      const outputDir = path.join(path.dirname(__dirname), output);
      const demosJsonPath = path.join(outputDir, 'demos.json');
      
      console.log(`🎨 Generating demo metadata...`);
      
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
                htmlPath: path.relative(outputDir, htmlPath),
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
        console.warn('⚠️  Could not scan demos directory:', error.message);
      }
      
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });
      
      // Generate and write demos.json
      await fs.writeFile(demosJsonPath, JSON.stringify(demos, null, 2), 'utf-8');
      console.log(`📋 Generated demos.json with ${demos.length} demo(s)`);
      
      console.log(`✅ Viewer data updated!`);
      console.log(`📋 Data: ${demosJsonPath}`);
      
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

// Setup program
program
  .name('ai-demo-cli')
  .description('AI Demo Generator - Create and manage AI-powered demos')
  .version('1.0.0');

program.parse();