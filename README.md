# AI Demo Generator

A powerful CLI tool to create and manage AI-powered HTML demos using the OpenRouter API. Generate interactive demos with multiple AI models and view them in a beautiful, organized interface.

## 🚀 Features

- **Create Demos**: Generate demo prompts with titles and organized structure
- **Multi-Model Generation**: Test the same prompt across different AI models
- **Interactive Viewer**: Browse demos with a beautiful web interface
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
npm run create-demo -- -t "Snake Game" -p "Create a classic snake game using HTML5 canvas with smooth animations and score tracking"
```

### 2. Generate Demo with AI Model
```bash
npm run generate-demo -- -d snake-game -m openai/gpt-3.5-turbo
```

### 3. Generate the Viewer
```bash
npm run generate-viewer
```

## 📋 Commands

### Create Demo
```bash
npm run create-demo -- -t "Demo Title" -p "Your prompt description"
```

Creates a new demo directory with:
- `pages/demos/{slug}/PROMPT.md` - The AI prompt
- `pages/demos/{slug}/README.md` - Demo documentation

### Generate Demo
```bash
npm run generate-demo -- -d demo-slug -m model-name [--force]

# Examples
npm run generate-demo -- -d snake-game -m openai/gpt-4-turbo
npm run generate-demo -- -d snake-game -m anthropic/claude-3-5-sonnet --force
```

Generates:
- `pages/demos/{slug}/{model}/index.html` - The generated demo
- `pages/demos/{slug}/{model}/results.json` - Comprehensive metrics
- `pages/demos/{slug}/{model}/RESPONSE.md` - Raw AI response

### Generate Viewer
```bash
npm run generate-viewer

# Custom output path
npm run generate-viewer -- -o custom/path/viewer.html
```

Creates an interactive viewer at `pages/index.html` with:
- Demo selector dropdown
- Model selector for each demo
- Metrics drawer with detailed information
- Responsive design

### List Demos
```bash
npm run list-demos
```

Shows all available demos and their generation status.

## 📁 Directory Structure

```
pages/
├── index.html                    # Generated viewer
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

The generated viewer (`pages/index.html`) provides:

### Demo Navigation
- **Demo Selector**: Choose from all available demos
- **Model Selector**: Switch between different AI model results
- **Live Preview**: View demos in an embedded iframe

### Information Drawer
- **Performance Metrics**: Tokens, duration, cost breakdown
- **Model Information**: Provider details, context length, pricing
- **Generation Details**: Timestamp, parameters, raw prompt
- **Visual Cards**: Colorful metric displays

### Responsive Design
- **Clean Interface**: Modern, professional styling
- **Sliding Drawer**: Smooth animations for detailed information
- **Mobile Friendly**: Works on desktop and mobile devices

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
npm run create-demo          # Create demo command
npm run generate-demo        # Generate demo command
npm run generate-viewer      # Generate viewer command
npm run list-demos          # List demos command
```

### Direct Node.js Commands (Alternative)
```bash
node src/cli.js create-demo -t "Title" -p "Prompt"
node src/cli.js generate-demo -d demo-slug -m model-name
node src/cli.js generate-viewer
node src/cli.js list-demos
```

### Environment Variables
- `OPENROUTER_API_KEY` - Your OpenRouter API key (required)
- `OPENROUTER_API_URL` - API endpoint (optional)
- `OPENROUTER_DEFAULT_MODEL` - Default model (optional)

## 📝 Example Workflow

```bash
# 1. Create a physics simulation demo
npm run create-demo -- \
  -t "Bouncing Balls" \
  -p "Create a physics simulation with 20 colorful balls bouncing in a container with realistic gravity and collision detection"

# 2. Test with multiple models
npm run generate-demo -- -d bouncing-balls -m openai/gpt-4-turbo
npm run generate-demo -- -d bouncing-balls -m anthropic/claude-3-5-sonnet
npm run generate-demo -- -d bouncing-balls -m google/gemini-pro

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