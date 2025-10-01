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

### List available models:
```bash
node index.js --list-models
```

## Command Options

- `-p, --prompt <prompt>` (required): The prompt to send to the model
- `-o, --output <path>` (required): Output path for the HTML file
- `-m, --model <model>`: Model to use (default: openai/gpt-3.5-turbo)
- `-s, --system <prompt>`: System prompt for the model
- `--api-key <key>`: Override API key from environment
- `--api-url <url>`: Override API URL from environment
- `--list-models`: Display popular available models

## Environment Variables

- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `OPENROUTER_API_URL`: API endpoint (default: https://openrouter.ai/api/v1/chat/completions)
- `DEFAULT_MODEL`: Default model to use (default: openai/gpt-3.5-turbo)