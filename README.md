# AI Demo Generator

A powerful CLI tool to create and manage AI-powered HTML demos using the OpenRouter API. Generate interactive demos with multiple AI models and view them in a beautiful, organized interface.

Credits for many prompts to : [@evotionai](https://www.instagram.com/evotionai/reel/)



## 🚀 Features

- **Create Demos**: Generate demo prompts with titles and organized structure
- **Multi-Model Generation**: Test the same prompt across different AI models with interactive selection
- **Parallel Processing**: Run multiple models simultaneously for faster generation
- **Automatic Continuation**: Detect and continue truncated responses without user intervention
- **Failure Tracking & Repair**: Automatically track failed generations and retry them later
- **Interactive Viewer**: Browse demos with a beautiful, mobile-optimized web interface
- **Smart Navigation**: Random demo selection, next/previous navigation with responsive controls
- **Comprehensive Metrics**: Track tokens, costs, performance, and model details
- **Force Regeneration**: Overwrite existing demos when needed

## 📦 Installation

```bash
npm install
```

Set up your OpenRouter API key in `.env`:
```bash
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY
```

## 🎯 Quick Start

### 1. Create a Demo
```bash
npm run create -- -t "Snake Game" -p "Create a classic snake game using HTML5 canvas with smooth animations and score tracking"
```

### 2. Generate Demo with AI Model(s)
```bash
# Single model
npm run generate -- -d snake-game -m openai/gpt-3.5-turbo

# Interactive multi-model selection
npm run generate -- -d snake-game

# Parallel processing with multiple models
npm run generate -- -d snake-game --parallel
```

### 3. Generate the Viewer
```bash
npm run generate-viewer
```

## 📋 Commands

### Create Demo
```bash
npm run create -- -t "Demo Title" -p "Your prompt description"
```

Creates a new demo directory with:
- `pages/demos/{slug}/PROMPT.md` - The AI prompt
- `pages/demos/{slug}/README.md` - Demo documentation

### Generate Demo
```bash
npm run generate -- -d demo-slug [options]

# Single model generation
npm run generate -- -d snake-game -m openai/gpt-4-turbo

# Interactive multi-model selection (checkbox interface)
npm run generate -- -d snake-game

# Parallel processing for faster generation
npm run generate -- -d snake-game --parallel

# Force regeneration and set max tokens
npm run generate -- -d snake-game -m anthropic/claude-3-5-sonnet --force --max-tokens 8000
```

**Options:**
- `-m, --model <model>` - Specific model to use
- `--parallel` - Run multiple models simultaneously
- `--force` - Overwrite existing demos
- `--max-tokens <number>` - Maximum tokens for generation
- `--no-continue` - Disable automatic continuation of truncated responses

Generates:
- `pages/demos/{slug}/{model}/index.html` - The generated demo
- `pages/demos/{slug}/{model}/results.json` - Comprehensive metrics
- `pages/demos/{slug}/{model}/RESPONSE.md` - Raw AI response
- `pages/demos/{slug}/{model}/report.json` - Detailed analysis report
- `pages/demos/{slug}/{model}/report.html` - Visual analysis report

### Generate Viewer Data
```bash
npm run generate-viewer

# Custom output directory
npm run generate-viewer -- -o custom/path/
```

Updates the `pages/demos.json` file that the static viewer loads from. The viewer at `pages/index.html` features:
- Demo selector dropdown
- Model selector for each demo
- Metrics drawer with detailed information
- Responsive design
- Automatic refresh from JSON data

### Continue Generation
```bash
npm run continue-generation -- -d demo-slug -m model-name

# Example: Continue a truncated response
npm run continue-generation -- -d snake-game -m openai/gpt-4-turbo
```

Manually continue a truncated response for a specific demo and model.

### Regenerate Demos
```bash
npm run regen-demo

# Interactive selection of demos to regenerate
npm run regen-demo -- --interactive
```

Regenerate existing demos with updated models or settings.

### Repair Failed Demos
```bash
npm run repair

# Repair all failed demos without confirmation
npm run repair -- --all

# Repair with parallel processing
npm run repair -- --parallel
```

Automatically retry demo generations that previously failed. The system tracks failures in `pages/repairs.json` and allows you to retry them interactively or in batch.

### List Demos
```bash
npm run list-demos
```

Shows all available demos and their generation status.

## 📁 Directory Structure

```
pages/
├── index.html                    # Static viewer (loads from demos.json)
├── demos.json                   # Generated demo metadata
└── demos/
    └── demo-name/
        ├── PROMPT.md             # Original prompt
        ├── README.md             # Demo documentation
        ├── openai/
        │   └── gpt-3.5-turbo/
        │       ├── index.html    # Generated demo
        │       ├── results.json  # Metrics & model info
        │       └── RESPONSE.md   # Raw response
        └── anthropic/
            └── claude-3-5-sonnet/
                ├── index.html
                ├── results.json
                └── RESPONSE.md
```

## 🎨 Viewer Features

The static viewer (`pages/index.html`) provides:

### Demo Navigation
- **Demo Selector**: Choose from all available demos (loaded from `demos.json`)
- **Model Selector**: Switch between different AI model results
- **Random Button**: Instantly jump to a random demo and model combination
- **Next/Previous Navigation**: Navigate sequentially through demos
- **Live Preview**: View demos in an embedded iframe
- **Refresh Button**: Reload demo data from JSON file

### Mobile-Optimized Interface
- **Responsive Controls**: Mobile-first design with collapsible navigation
- **Burger Menu**: Access all controls through a dropdown on mobile devices
- **Touch-Friendly**: Large touch targets and intuitive gestures
- **Auto-Close Dropdown**: Smooth interaction with automatic menu closure

### Information Drawer
- **Performance Metrics**: Tokens, duration, cost breakdown
- **Model Information**: Provider details, context length, pricing
- **Generation Details**: Timestamp, parameters, raw prompt
- **Visual Cards**: Colorful metric displays
- **Analysis Reports**: Detailed HTML reports for each generation

### Static Architecture
- **No Server Required**: Pure client-side HTML/CSS/JavaScript
- **JSON Data Loading**: Fetches demo metadata from `demos.json`
- **Query String Navigation**: URL-based state management with browser history
- **Error Handling**: Graceful fallback when JSON file is missing
- **Mobile Friendly**: Responsive design for all devices with 768px breakpoint

## 💰 Cost Tracking

Each `results.json` includes detailed cost information:
- Prompt token cost
- Completion token cost  
- Total cost in USD
- Model pricing details

## 🔧 Available Models

Popular models supported through OpenRouter:
- `openai/gpt-3.5-turbo`
- `openai/gpt-4-turbo`
- `anthropic/claude-3-haiku`
- `anthropic/claude-3-5-sonnet`
- `google/gemini-pro`
- `meta-llama/llama-3.1-8b-instruct`

See [OpenRouter Models](https://openrouter.ai/models) for the complete list.

## 🛠️ Development

### NPM Scripts
```bash
npm run demo                  # Run CLI help
npm run create               # Create demo command
npm run generate             # Generate demo command (with multi-model support)
npm run continue-generation  # Continue truncated responses
npm run regen-demo          # Regenerate existing demos
npm run repair              # Retry failed demo generations
npm run generate-viewer      # Generate viewer command
npm run list-demos          # List demos command
npm run serve               # Start preview server
```

### Direct Node.js Commands (Alternative)
```bash
node src/cli.js create -t "Title" -p "Prompt"
node src/cli.js generate -d demo-slug [options]
node src/cli.js continue-generation -d demo-slug -m model-name
node src/cli.js regen-demo
node src/cli.js repair
node src/cli.js generate-viewer
node src/cli.js list-demos
node src/cli.js serve
```

### Environment Variables
- `OPENROUTER_API_KEY` - Your OpenRouter API key (required)
- `OPENROUTER_API_URL` - API endpoint (optional)
- `OPENROUTER_DEFAULT_MODEL` - Default model (optional)

## 📝 Example Workflow

```bash
# 1. Create a physics simulation demo
npm run create -- \
  -t "Bouncing Balls" \
  -p "Create a physics simulation with 20 colorful balls bouncing in a container with realistic gravity and collision detection"

# 2. Test with multiple models (parallel processing)
npm run generate -- -d bouncing-balls --parallel

# Or test individual models
npm run generate -- -d bouncing-balls -m openai/gpt-4-turbo
npm run generate -- -d bouncing-balls -m anthropic/claude-3-5-sonnet
npm run generate -- -d bouncing-balls -m google/gemini-pro

# 3. Generate the viewer to compare results
npm run generate-viewer

# 4. Open pages/index.html in your browser to explore!
```

## 📂 Project Structure

```
ai-demo-generator/
├── src/
│   ├── cli.js              # Main CLI application
│   └── index.js            # OpenRouter API client
├── pages/
│   ├── index.html          # Generated viewer (after running generate-viewer)
│   └── demos/              # All generated demos
├── package.json            # Dependencies and scripts
├── .env.example           # Environment variables template
└── README.md              # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with multiple demos and models
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.