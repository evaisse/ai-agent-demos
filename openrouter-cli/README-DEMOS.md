# Demo Generation with OpenRouter CLI

This document explains how to generate AI-powered demos using multiple models via the OpenRouter API.

## Directory Structure

For each demo, the following structure will be created:

```
pages/demos/
└── demo-name/
    ├── PROMPT.md                    # The prompt for the demo
    ├── openai/
    │   └── gpt-3.5-turbo/
    │       ├── index.html          # Generated HTML demo
    │       ├── results.json         # Comprehensive metrics and data
    │       └── RESPONSE.md          # Raw response in markdown
    ├── anthropic/
    │   └── claude-3-5-sonnet/
    │       ├── index.html
    │       ├── results.json
    │       └── RESPONSE.md
    └── google/
        └── gemini-pro/
            ├── index.html
            ├── results.json
            └── RESPONSE.md
```

## Usage

### Generate all demos with all models:
```bash
node openrouter-cli/generate-demos.js
```

### Generate a specific demo:
```bash
node openrouter-cli/generate-demos.js physics-20-balls
```

## Creating a New Demo

1. Create a new directory under `pages/demos/`:
```bash
mkdir pages/demos/your-demo-name
```

2. Create a `PROMPT.md` file with your prompt:
```bash
echo "Your prompt here" > pages/demos/your-demo-name/PROMPT.md
```

3. Run the generation:
```bash
node openrouter-cli/generate-demos.js your-demo-name
```

## Default Models

The script uses the following models by default:
- `openai/gpt-3.5-turbo`
- `openai/gpt-4-turbo`
- `anthropic/claude-3-haiku`
- `anthropic/claude-3-5-sonnet`
- `google/gemini-pro`
- `meta-llama/llama-3.1-8b-instruct`

To modify the models, edit the `MODELS` array in `openrouter-cli/generate-demos.js`.

## results.json Structure

Each `results.json` file contains:
- **timestamp**: When the demo was generated
- **execution**: Duration and model information
- **tokens**: Token usage breakdown
- **cost**: Detailed cost calculation
- **model_card**: Complete model information
- **request**: Original prompt and parameters
- **response_metadata**: API response metadata
- **raw_response**: The complete generated content
- **demo_info**: Demo-specific metadata

## Requirements

- Node.js 18+
- OpenRouter API key in `.env` file:
```
OPENROUTER_API_KEY=your-key-here
```

## Troubleshooting

- **API Key Error**: Make sure `OPENROUTER_API_KEY` is set in your `.env` file
- **Model Not Found**: Check the model ID is correct on https://openrouter.ai/models
- **Rate Limiting**: The script processes models sequentially to avoid rate limits