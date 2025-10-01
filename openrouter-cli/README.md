# OpenRouter CLI

A command-line tool to interact with OpenRouter API and generate HTML output.

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and add your OpenRouter API key:

```bash
cp .env.example .env
```

Edit `.env` with your API key:
```
OPENROUTER_API_KEY=your-api-key-here
```

## Usage

### Basic usage:
```bash
node index.js --prompt "Write a hello world in Python" --output output.html
```

### With specific model:
```bash
node index.js --prompt "Explain quantum computing" --model openai/gpt-4 --output quantum.html
```

### With system prompt:
```bash
node index.js --prompt "Write a function to sort an array" --system "You are an expert programmer" --output code.html
```

### Override API settings via CLI:
```bash
node index.js --prompt "Test prompt" --output test.html --api-key YOUR_KEY --api-url https://custom.endpoint.com
```

### List available models (with live API data):
```bash
node index.js --list-models
# or
node index.js --fetch-models
```

## Command Options

- `-p, --prompt <prompt>` (required): The prompt to send to the model
- `-o, --output <path>` (required): Output path for the HTML file
- `-m, --model <model>`: Model to use (default: openai/gpt-3.5-turbo)
- `-s, --system <prompt>`: System prompt for the model
- `--api-key <key>`: Override API key from environment
- `--api-url <url>`: Override API URL from environment
- `--list-models`: Fetch and display all available models from OpenRouter API
- `--fetch-models`: Same as --list-models
- `--refresh-cache`: Force refresh of model cache (bypass 24-hour cache)

## Output Files

When you run a prompt, the CLI generates multiple output files in the same directory as the HTML output:

1. **HTML file** (specified with `-o`): Styled response with metrics
2. **report.json**: Comprehensive metrics and model information
3. **RESPONSE.md**: Raw response in markdown format
4. **openrouter-models.json**: Cached model data (auto-generated when fetching models)

### report.json contains:
- Execution metrics (duration, tokens, cost)
- Model card information (name, description, pricing)
- Request details (prompt, system prompt, temperature)
- Response metadata (API response ID, timestamp)

## Environment Variables

- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `OPENROUTER_API_URL`: API endpoint (default: https://openrouter.ai/api/v1/chat/completions)
- `DEFAULT_MODEL`: Default model to use (default: openai/gpt-3.5-turbo)

## Features

- 🔍 **Live Model Listing**: Fetch real-time model data from OpenRouter API
- 📦 **Smart Caching**: Auto-cache model data for 24 hours to improve performance
- 📊 **Comprehensive Reporting**: Get detailed metrics about tokens, cost, and performance
- 📝 **Multiple Output Formats**: HTML, JSON report, and Markdown response
- 💰 **Cost Tracking**: Automatic calculation of prompt and completion costs
- ⏱️ **Performance Monitoring**: Track API response times
- 🎨 **Beautiful HTML Output**: Styled response viewer with embedded metrics
- 🚀 **Optimized Performance**: Uses cached model data when available to speed up requests