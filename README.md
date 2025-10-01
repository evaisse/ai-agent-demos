# AI Agent Demos

Compare usage of AI LLMs - Interactive demo viewer for comparing outputs from different language models.

## Features

- 🎯 Side-by-side comparison of AI model outputs
- 📝 View prompts used for each demo
- 🚀 Easy navigation between demos and models
- 📱 Responsive design for all devices

## Live Demo

Visit the live demo at: `https://[your-github-username].github.io/ai-agent-demos/`

## Local Development

1. Clone the repository
2. Navigate to the pages directory and serve with a local server:
   ```bash
   cd pages
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080/` in your browser

## GitHub Pages Deployment

The project is automatically deployed to GitHub Pages when pushing to the main/master branch.

To enable GitHub Pages for your fork:
1. Go to Settings > Pages in your GitHub repository
2. Select "GitHub Actions" as the source
3. Push to main/master branch to trigger deployment

## Project Structure

```
ai-agent-demos/
├── pages/                    # Deployed to GitHub Pages
│   ├── index.html           # Landing page
│   ├── demo-preview.html    # Demo viewer application
│   └── demos/               # Demo content
│       └── [demo-name]/
│           ├── PROMPT.md    # Prompt used for the demo
│           └── results/     # Model outputs
│               └── [model].html
└── .github/
    └── workflows/           # GitHub Actions
        └── deploy-pages.yml

```

## Adding New Demos

1. Create a new folder in `pages/demos/your-demo-name/`
2. Add a `PROMPT.md` file with the prompt used
3. Add result HTML files in `pages/demos/your-demo-name/results/`
4. Update the `demoData` object in `pages/demo-preview.html`
