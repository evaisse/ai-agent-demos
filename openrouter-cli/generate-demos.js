#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const DEMOS_DIR = path.join(__dirname, '../pages/demos');
const MODELS = [
  'openai/gpt-3.5-turbo',
  'openai/gpt-4-turbo',
  'anthropic/claude-3-haiku',
  'anthropic/claude-3-5-sonnet', 
  'google/gemini-pro',
  'meta-llama/llama-3.1-8b-instruct'
];

async function ensureDirectory(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Failed to create directory ${dir}:`, error.message);
  }
}

async function loadPrompt(demoPath) {
  const promptPath = path.join(demoPath, 'PROMPT.md');
  
  try {
    const content = await fs.readFile(promptPath, 'utf-8');
    return content;
  } catch (error) {
    console.warn(`⚠️  No PROMPT.md found for ${path.basename(demoPath)}, skipping...`);
    return null;
  }
}

async function runOpenRouterCLI(prompt, model, outputPath) {
  return new Promise((resolve, reject) => {
    const modelDir = model.replace('/', '-');
    const outputDir = path.join(outputPath, model);
    
    // Ensure output directory exists
    fs.mkdir(outputDir, { recursive: true }).then(() => {
      const args = [
        '../index.js',
        '--prompt', prompt,
        '--model', model,
        '--output', path.join(outputDir, 'index.html')
      ];
      
      console.log(`  🤖 Running model: ${model}`);
      
      const child = spawn('node', args, {
        cwd: __dirname,
        env: { ...process.env }
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', async (code) => {
        if (code !== 0) {
          console.error(`    ❌ Failed with code ${code}`);
          console.error(stderr);
          reject(new Error(`Process exited with code ${code}`));
        } else {
          console.log(`    ✅ Completed successfully`);
          
          // Move report.json to results.json
          try {
            const reportPath = path.join(outputDir, 'report.json');
            const resultsPath = path.join(outputDir, 'results.json');
            
            // Read the report
            const reportContent = await fs.readFile(reportPath, 'utf-8');
            const report = JSON.parse(reportContent);
            
            // Enhance with additional metadata
            report.demo_info = {
              demo_name: path.basename(path.dirname(outputDir)),
              generated_at: new Date().toISOString(),
              cli_version: '1.0.0'
            };
            
            // Save as results.json
            await fs.writeFile(resultsPath, JSON.stringify(report, null, 2));
            
            // Remove the original report.json
            await fs.unlink(reportPath).catch(() => {});
            
            // Keep RESPONSE.md as is
            
          } catch (error) {
            console.warn(`    ⚠️  Could not process report files: ${error.message}`);
          }
          
          resolve({ model, success: true, output: stdout });
        }
      });
      
      child.on('error', (error) => {
        console.error(`    ❌ Error: ${error.message}`);
        reject(error);
      });
    }).catch(reject);
  });
}

async function processDemos(specificDemo = null) {
  console.log('🚀 Starting demo generation process...\n');
  
  // Get all demo directories
  const entries = await fs.readdir(DEMOS_DIR, { withFileTypes: true });
  const demos = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  
  const demosToProcess = specificDemo 
    ? demos.filter(d => d === specificDemo)
    : demos;
  
  if (demosToProcess.length === 0) {
    console.error(`❌ No demos found to process`);
    return;
  }
  
  console.log(`📂 Found ${demosToProcess.length} demo(s) to process\n`);
  
  for (const demo of demosToProcess) {
    console.log(`\n📦 Processing demo: ${demo}`);
    console.log('=' .repeat(50));
    
    const demoPath = path.join(DEMOS_DIR, demo);
    
    // Load the prompt
    const prompt = await loadPrompt(demoPath);
    
    if (!prompt) {
      continue;
    }
    
    // Process each model
    for (const model of MODELS) {
      try {
        await runOpenRouterCLI(prompt, model, demoPath);
      } catch (error) {
        console.error(`  ❌ Failed to process ${model}: ${error.message}`);
      }
    }
    
    console.log(`✅ Completed processing ${demo}\n`);
  }
  
  console.log('\n🎉 All demos processed successfully!');
}

// Parse command line arguments
const args = process.argv.slice(2);
const demoName = args[0];

// Check for API key
if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ Error: OPENROUTER_API_KEY environment variable is not set');
  console.error('Please set it in your .env file or environment');
  process.exit(1);
}

// Run the process
processDemos(demoName).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});