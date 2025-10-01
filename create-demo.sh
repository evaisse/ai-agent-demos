#!/bin/bash

# Create a new demo with a PROMPT.md file

if [ -z "$1" ]; then
    echo "Usage: ./create-demo.sh <demo-name>"
    echo "Example: ./create-demo.sh snake-game"
    exit 1
fi

DEMO_NAME=$1
DEMO_DIR="pages/demos/$DEMO_NAME"

# Check if demo already exists
if [ -d "$DEMO_DIR" ]; then
    echo "❌ Demo '$DEMO_NAME' already exists!"
    exit 1
fi

# Create demo directory
mkdir -p "$DEMO_DIR"

# Create PROMPT.md template
cat > "$DEMO_DIR/PROMPT.md" << 'EOF'
Create a single HTML file that implements [YOUR DEMO DESCRIPTION HERE].

Requirements:
- Everything must be in a single index.html file
- Include all CSS inline in <style> tags
- Include all JavaScript inline in <script> tags
- Make it interactive and visually appealing
- Use modern web technologies (HTML5, CSS3, ES6+)

[ADD YOUR SPECIFIC REQUIREMENTS HERE]
EOF

# Create README.md for the demo
cat > "$DEMO_DIR/README.md" << EOF
# $DEMO_NAME Demo

## Description
[Add your demo description here]

## Models Tested
This demo will be tested with multiple AI models via OpenRouter API.

## Files Generated
- \`PROMPT.md\`: The prompt used to generate the demo
- \`{model}/index.html\`: Generated HTML for each model
- \`{model}/results.json\`: Performance metrics and model data
- \`{model}/RESPONSE.md\`: Raw response from the model
EOF

echo "✅ Demo '$DEMO_NAME' created successfully!"
echo ""
echo "📁 Demo directory: $DEMO_DIR"
echo ""
echo "Next steps:"
echo "1. Edit $DEMO_DIR/PROMPT.md with your specific prompt"
echo "2. Run: node openrouter-cli/generate-demos.js $DEMO_NAME"
echo ""
echo "To generate for all models, or test with a single model first:"
echo "node index.js --prompt \"\$(cat $DEMO_DIR/PROMPT.md)\" --model openai/gpt-3.5-turbo --output $DEMO_DIR/test.html"