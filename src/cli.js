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