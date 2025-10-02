# Maintainer Guide

This guide explains how to manage demo submissions and the automated workflow.

## Demo Submission Workflow

### 1. Review Submissions

When a user creates a demo submission issue:

1. **Check the Issue Template**: Verify the submission includes:
   - Valid demo title
   - Prompt under 200 characters
   - At least one model selected
   - No copyrighted or harmful content

2. **Validate the Prompt**: Ensure the prompt is:
   - Clear and specific
   - Feasible to implement in a single HTML file
   - Not requesting external dependencies (except CDNJS)

### 2. Approve Submissions

To approve a demo submission:

1. **Add the `approved` label** to the issue
2. The GitHub Actions workflow will automatically:
   - Create the demo structure
   - Generate implementations for each selected model
   - Create a pull request with the results
   - Comment on the issue with the PR link

### 3. Review Generated Demos

When the workflow creates a PR:

1. **Review the generated demos**:
   - Check that HTML is properly extracted
   - Verify metrics are calculated correctly
   - Test demos in a browser if needed

2. **Merge the PR** to publish the demo to the viewer

### 4. Handle Failures

If the workflow fails:

1. **Check the workflow logs** for error details
2. **Common issues**:
   - API key missing or invalid (`OPENROUTER_API_KEY` secret)
   - Prompt too long (max 200 characters)
   - Model unavailable or rate limited
   - HTML extraction failed

3. **Fix and retry**:
   - Update secrets if needed
   - Ask submitter to revise prompt
   - Re-run the workflow manually

## Manual Demo Generation

You can manually trigger demo generation:

1. Go to **Actions** → **Generate Demo from Issue**
2. Click **Run workflow**
3. Enter the issue number
4. Optionally enable "Force regenerate" to overwrite existing demos

## Required Secrets

Ensure these secrets are configured in the repository:

- `OPENROUTER_API_KEY`: Your OpenRouter API key for generating demos

## Model Mapping

The workflow maps checkbox labels to model IDs:

- "OpenAI GPT-4o" → `openai/gpt-4o`
- "OpenAI GPT-4o-mini" → `openai/gpt-4o-mini`
- "Anthropic Claude 3.5 Sonnet" → `anthropic/claude-3.5-sonnet`
- "Anthropic Claude 3 Haiku" → `anthropic/claude-3-haiku`
- "Google Gemini Pro 1.5" → `google/gemini-pro-1.5`
- "Meta Llama 3.1 70B Instruct" → `meta-llama/llama-3.1-70b-instruct`
- "Meta Llama 3.1 8B Instruct" → `meta-llama/llama-3.1-8b-instruct`

## Workflow Permissions

The workflow requires:
- `contents: write` - To create branches and commit files
- `issues: write` - To comment on issues
- `pull-requests: write` - To create pull requests

## Best Practices

1. **Quick approval**: Try to review submissions within 24-48 hours
2. **Provide feedback**: Comment on issues if changes are needed
3. **Monitor costs**: Keep track of API usage from demo generation
4. **Regular maintenance**: Update model list as new models become available
5. **Quality control**: Ensure generated demos work correctly before merging
