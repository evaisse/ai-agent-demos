# Contributing to AI Demo Generator

Thank you for your interest in contributing! This guide explains how to submit demo ideas and contribute to the project.

## 🎨 Submit a Demo Idea (Recommended for Most Contributors)

The easiest way to contribute is to submit a demo idea. Our automated workflow will handle the generation!

### How It Works

1. **Create an Issue**: [Submit a demo idea](../../issues/new?template=demo-submission.yml) using the Demo Submission template
2. **Fill the Form**:
   - **Demo Title**: Short, descriptive name (e.g., "Snake Game", "Todo App")
   - **Demo Prompt**: What you want to create (max 200 characters)
   - **Models**: Select which AI models should generate the demo
   - **Additional Context**: Optional details or requirements
3. **Wait for Review**: A maintainer will review your submission
4. **Automatic Generation**: Once approved, a GitHub Actions workflow will:
   - Create the demo structure
   - Generate implementations using selected models
   - Create a pull request with results
5. **Published**: After PR review and merge, your demo appears in the viewer!

### Example Submissions

**Good Examples:**
- Title: "Snake Game"
- Prompt: "a classic snake game with smooth animations and score tracking"
- Models: GPT-4o, Claude 3.5 Sonnet

**More Examples:**
- "a todo app with local storage and drag-and-drop sorting"
- "an interactive calculator with memory functions and history"
- "a physics simulation with bouncing balls and realistic gravity"
- "a color picker tool with hex, RGB, and HSL conversion"

### Prompt Guidelines

✅ **Do:**
- Keep prompts under 200 characters
- Be specific about functionality
- Mention visual requirements (animations, colors, etc.)
- Request single HTML file implementations
- Use CDNJS for external dependencies

❌ **Don't:**
- Request copyrighted content
- Ask for harmful or inappropriate content
- Require server-side functionality
- Expect multi-file projects
- Request specific brand names or trademarks

## 🔧 Code Contributions

### Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/evaisse/ai-agent-demos.git
cd ai-agent-demos

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY
```

### Testing Locally

```bash
# Create a test demo
npm run create-demo -- -t "Test Demo" -p "a simple counter app"

# Generate with a model
npm run generate-demo -- -d test-demo -m openai/gpt-4o-mini

# Generate viewer data
npm run generate-viewer

# Preview locally
npm run preview-server
```

### Making Changes

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make your changes**
4. **Test thoroughly**:
   - Test with multiple demos
   - Test with different models
   - Verify viewer updates correctly
5. **Commit with conventional commits**:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `chore:` for maintenance
6. **Push and create a pull request**

### Code Style

- Follow existing code patterns
- Use meaningful variable names
- Add comments only when necessary
- Keep functions focused and small
- Handle errors gracefully

### Pull Request Guidelines

- Provide a clear description of changes
- Reference related issues
- Include screenshots for UI changes
- Ensure all tests pass (when available)
- Keep changes focused and minimal

## 🐛 Bug Reports

Found a bug? Please [create an issue](../../issues/new) with:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)
- Screenshots if applicable

## 💡 Feature Requests

Have an idea for a new feature? [Open an issue](../../issues/new) describing:

- The problem you're trying to solve
- Proposed solution
- Alternative solutions considered
- Any implementation details

## 📝 Documentation

Documentation improvements are always welcome:

- Fix typos or unclear explanations
- Add examples or tutorials
- Improve code comments
- Update outdated information

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow community guidelines

## ❓ Questions?

- Check existing [issues](../../issues) and [discussions](../../discussions)
- Read the [README](README.md)
- Review [MAINTAINER_GUIDE](.github/MAINTAINER_GUIDE.md) for workflow details

## 🎯 What We're Looking For

**High Priority:**
- Interesting demo ideas
- Bug fixes and improvements
- Documentation enhancements
- Test coverage

**Medium Priority:**
- New CLI features
- Viewer improvements
- Performance optimizations

**Low Priority:**
- Style changes
- Refactoring (without clear benefit)

## 🚀 Quick Start Checklist

For demo submissions:
- [ ] Title is clear and descriptive
- [ ] Prompt is under 200 characters
- [ ] At least one model is selected
- [ ] No copyrighted/harmful content
- [ ] Guidelines confirmed

For code contributions:
- [ ] Code follows existing style
- [ ] Changes are well-tested
- [ ] Documentation is updated
- [ ] Commits follow conventions
- [ ] PR description is clear

---

Thank you for contributing to AI Demo Generator! 🎉
