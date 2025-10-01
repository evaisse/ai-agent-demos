#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

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

// Utility function to run OpenRouter CLI
function runOpenRouterCLI(prompt, model, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      'src/index.js',
      '--prompt', prompt,
      '--model', model,
      '--output', outputPath
    ];
    
    console.log(`🤖 Generating with model: ${model}`);
    
    const child = spawn('node', args, {
      cwd: path.dirname(__dirname),
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
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
      
      // Generate demo using OpenRouter CLI
      await runOpenRouterCLI(prompt, model, outputPath);
      
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
  .description('Generate the demo viewer at pages/index.html')
  .option('-o, --output <path>', 'Output path for viewer', 'pages/index.html')
  .action(async (options) => {
    try {
      const { output } = options;
      const outputPath = path.join(path.dirname(__dirname), output);
      
      console.log(`🎨 Generating demo viewer...`);
      
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
                htmlPath: path.relative(path.dirname(outputPath), htmlPath),
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
              prompt: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
              models: models
            });
          }
        }
      } catch (error) {
        console.warn('⚠️  Could not scan demos directory:', error.message);
      }
      
      // Generate HTML viewer
      const viewerHTML = generateViewerHTML(demos);
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Write viewer HTML
      await fs.writeFile(outputPath, viewerHTML, 'utf-8');
      
      console.log(`✅ Viewer generated successfully!`);
      console.log(`📂 Location: ${outputPath}`);
      console.log(`🎯 Found ${demos.length} demo(s) with generated content`);
      
      if (demos.length === 0) {
        console.log('');
        console.log('💡 Tip: Generate some demos first:');
        console.log('   node cli.js create-demo -t "My Demo" -p "Create a demo..."');
        console.log('   node cli.js generate-demo -d my-demo -m openai/gpt-3.5-turbo');
      }
      
    } catch (error) {
      console.error('❌ Failed to generate viewer:', error.message);
      process.exit(1);
    }
  });

// Function to generate the viewer HTML
function generateViewerHTML(demos) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Demo Viewer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f8fafc;
            height: 100vh;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            position: relative;
        }
        
        .header h1 {
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .controls {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .demo-selector, .model-selector {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.9rem;
        }
        
        .demo-selector option, .model-selector option {
            background: #4c51bf;
            color: white;
        }
        
        .info-btn {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.2s;
        }
        
        .info-btn:hover {
            background: rgba(255,255,255,0.3);
        }
        
        .main-content {
            display: flex;
            height: calc(100vh - 80px);
        }
        
        .demo-frame {
            flex: 1;
            background: white;
            border: none;
            width: 100%;
            height: 100%;
        }
        
        .sidebar {
            width: 400px;
            background: white;
            border-left: 1px solid #e2e8f0;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            overflow-y: auto;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
        }
        
        .sidebar.open {
            transform: translateX(0);
        }
        
        .sidebar-header {
            padding: 1.5rem;
            border-bottom: 1px solid #e2e8f0;
            background: #f8fafc;
        }
        
        .sidebar-content {
            padding: 1.5rem;
        }
        
        .metric-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
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
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 0.25rem;
        }
        
        .metric-label {
            font-size: 0.8rem;
            opacity: 0.9;
        }
        
        .section {
            margin-bottom: 1.5rem;
        }
        
        .section-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #2d3748;
        }
        
        .section-content {
            background: #f7fafc;
            padding: 1rem;
            border-radius: 6px;
            font-size: 0.9rem;
            line-height: 1.5;
        }
        
        .no-demo {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            color: #718096;
        }
        
        .no-demo-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        
        .close-btn {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            color: #718096;
            font-size: 1.5rem;
            cursor: pointer;
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        }
        
        .close-btn:hover {
            background: #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 AI Demo Viewer</h1>
        <div class="controls">
            <select class="demo-selector" id="demoSelector">
                <option value="">Select a demo...</option>
                ${demos.map(demo => `<option value="${demo.name}">${demo.title}</option>`).join('')}
            </select>
            <select class="model-selector" id="modelSelector" disabled>
                <option value="">Select a model...</option>
            </select>
            <button class="info-btn" id="infoBtn" disabled>ℹ️ Info</button>
        </div>
    </div>
    
    <div class="main-content">
        <iframe class="demo-frame" id="demoFrame" src="about:blank"></iframe>
        
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <button class="close-btn" id="closeBtn">×</button>
                <h3 id="sidebarTitle">Demo Information</h3>
                <p id="sidebarModel" style="color: #718096; font-size: 0.9rem; margin-top: 0.5rem;"></p>
            </div>
            <div class="sidebar-content" id="sidebarContent">
                <!-- Content will be populated by JavaScript -->
            </div>
        </div>
    </div>
    
    <div class="no-demo" id="noDemo">
        <div class="no-demo-icon">🎨</div>
        <h2>No Demo Selected</h2>
        <p>Choose a demo from the dropdown above to start exploring!</p>
    </div>

    <script>
        const demos = ${JSON.stringify(demos, null, 2)};
        
        const demoSelector = document.getElementById('demoSelector');
        const modelSelector = document.getElementById('modelSelector');
        const infoBtn = document.getElementById('infoBtn');
        const demoFrame = document.getElementById('demoFrame');
        const sidebar = document.getElementById('sidebar');
        const noDemo = document.getElementById('noDemo');
        const sidebarTitle = document.getElementById('sidebarTitle');
        const sidebarModel = document.getElementById('sidebarModel');
        const sidebarContent = document.getElementById('sidebarContent');
        const closeBtn = document.getElementById('closeBtn');
        
        let currentDemo = null;
        let currentModel = null;
        
        demoSelector.addEventListener('change', function() {
            const demoName = this.value;
            if (demoName) {
                currentDemo = demos.find(d => d.name === demoName);
                updateModelSelector();
                hideDemo();
            } else {
                currentDemo = null;
                updateModelSelector();
                hideDemo();
            }
        });
        
        modelSelector.addEventListener('change', function() {
            const modelName = this.value;
            if (modelName && currentDemo) {
                currentModel = currentDemo.models.find(m => m.name === modelName);
                showDemo();
            } else {
                currentModel = null;
                hideDemo();
            }
        });
        
        infoBtn.addEventListener('click', function() {
            if (currentModel) {
                showSidebar();
            }
        });
        
        closeBtn.addEventListener('click', function() {
            hideSidebar();
        });
        
        function updateModelSelector() {
            modelSelector.innerHTML = '<option value="">Select a model...</option>';
            
            if (currentDemo) {
                currentDemo.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = model.name;
                    modelSelector.appendChild(option);
                });
                modelSelector.disabled = false;
            } else {
                modelSelector.disabled = true;
            }
            
            infoBtn.disabled = !currentDemo;
        }
        
        function showDemo() {
            if (currentModel) {
                demoFrame.src = currentModel.htmlPath;
                demoFrame.style.display = 'block';
                noDemo.style.display = 'none';
                infoBtn.disabled = false;
            }
        }
        
        function hideDemo() {
            demoFrame.style.display = 'none';
            noDemo.style.display = 'flex';
            hideSidebar();
        }
        
        function showSidebar() {
            if (!currentModel || !currentModel.results) return;
            
            const results = currentModel.results;
            sidebarTitle.textContent = currentDemo.title;
            sidebarModel.textContent = currentModel.name;
            
            const metricsHTML = \`
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-value">\${results.tokens?.total_tokens || 'N/A'}</div>
                        <div class="metric-label">Total Tokens</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">\${results.execution?.duration_seconds || 'N/A'}s</div>
                        <div class="metric-label">Duration</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$\${results.cost?.total_cost?.toFixed(4) || '0.0000'}</div>
                        <div class="metric-label">Total Cost</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">\${results.model_card?.context_length || 'N/A'}</div>
                        <div class="metric-label">Context Length</div>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Prompt</div>
                    <div class="section-content">\${currentDemo.prompt}</div>
                </div>
                
                <div class="section">
                    <div class="section-title">Model Information</div>
                    <div class="section-content">
                        <strong>Name:</strong> \${results.model_card?.name || 'Unknown'}<br>
                        <strong>ID:</strong> \${results.model_card?.id || 'Unknown'}<br>
                        <strong>Provider:</strong> \${results.model_card?.top_provider?.name || 'Unknown'}
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Token Breakdown</div>
                    <div class="section-content">
                        <strong>Prompt Tokens:</strong> \${results.tokens?.prompt_tokens || 0}<br>
                        <strong>Completion Tokens:</strong> \${results.tokens?.completion_tokens || 0}<br>
                        <strong>Total Tokens:</strong> \${results.tokens?.total_tokens || 0}
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Cost Breakdown</div>
                    <div class="section-content">
                        <strong>Prompt Cost:</strong> $\${results.cost?.prompt_cost?.toFixed(6) || '0.000000'}<br>
                        <strong>Completion Cost:</strong> $\${results.cost?.completion_cost?.toFixed(6) || '0.000000'}<br>
                        <strong>Total Cost:</strong> $\${results.cost?.total_cost?.toFixed(6) || '0.000000'}
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Generation Info</div>
                    <div class="section-content">
                        <strong>Generated:</strong> \${new Date(results.timestamp).toLocaleString()}<br>
                        <strong>Duration:</strong> \${results.execution?.duration_seconds || 'N/A'} seconds<br>
                        <strong>Temperature:</strong> \${results.request?.temperature || 'N/A'}
                    </div>
                </div>
            \`;
            
            sidebarContent.innerHTML = metricsHTML;
            sidebar.classList.add('open');
        }
        
        function hideSidebar() {
            sidebar.classList.remove('open');
        }
        
        // Initialize
        if (demos.length === 0) {
            hideDemo();
        }
    </script>
</body>
</html>`;
}

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