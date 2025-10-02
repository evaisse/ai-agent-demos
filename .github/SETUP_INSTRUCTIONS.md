# Setup Instructions for Contribution Workflow

This document provides quick setup instructions for the repository maintainer.

## Overview

This PR adds a complete contribution workflow that allows users to submit demo ideas via GitHub issues. Once approved, an automated workflow generates the demos using selected AI models and creates a pull request.

## Required Setup

### 1. Add Repository Secret

The workflow requires an OpenRouter API key to generate demos.

**Steps:**
1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - Name: `OPENROUTER_API_KEY`
   - Value: Your OpenRouter API key (get from https://openrouter.ai/)
4. Click **Add secret**

**Note:** Without this secret, the workflow will fail when trying to generate demos.

### 2. Verify Workflow Permissions

Ensure the workflow has necessary permissions:

1. Go to: **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select: **Read and write permissions**
4. Enable: **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

### 3. Optional: Configure Branch Protection

If you want to require reviews before merging auto-generated PRs:

1. Go to: **Settings** → **Branches**
2. Add or edit branch protection rule for `main` or `master`
3. Enable: **Require pull request reviews before merging**

## What's Included

### Files Added/Modified

**GitHub Templates:**
- `.github/ISSUE_TEMPLATE/demo-submission.yml` - Form-based issue template
- `.github/ISSUE_TEMPLATE/config.yml` - Issue template configuration
- `.github/pull_request_template.md` - PR template

**Workflows:**
- `.github/workflows/generate-demo.yml` - Main automation workflow

**Documentation:**
- `CONTRIBUTING.md` - Comprehensive contribution guide
- `.github/MAINTAINER_GUIDE.md` - Maintainer instructions
- `.github/WORKFLOW_TESTING.md` - Testing guide
- `README.md` - Updated with contribution section and badges

## How It Works

### User Flow

1. User clicks "Submit Demo Idea" badge or creates new issue
2. Fills form with:
   - Demo title
   - Prompt (max 200 characters)
   - Model selection (1-7 models)
   - Optional additional context
3. Submits issue with `demo-submission` label

### Maintainer Flow

1. Review the submission
2. Add `approved` label to trigger workflow
3. Workflow automatically:
   - Creates demo structure
   - Generates implementations with selected models
   - Updates viewer data
   - Creates PR with results
4. Review and merge PR

### Workflow Steps

```
Issue Created → Review → Add "approved" label → Workflow Triggers
  ↓
Parse issue body → Create demo → Generate with models
  ↓
Update viewer → Create PR → Comment on issue
  ↓
Review PR → Merge → Demo live!
```

## First Test

After setup, test the workflow:

1. **Create a test issue**:
   - Use the Demo Submission template
   - Title: "Test Demo"
   - Prompt: "a simple counter with increment and decrement buttons"
   - Select: OpenAI GPT-4o-mini

2. **Approve it**:
   - Add the `approved` label

3. **Monitor**:
   - Go to Actions tab
   - Watch the workflow run
   - Review the created PR

4. **Cleanup**:
   - Close test issue
   - Delete test PR/branch
   - Remove test demo directory if needed

## Customization Options

### Adjust Model List

To add/remove models, edit:
- `.github/ISSUE_TEMPLATE/demo-submission.yml` (checkboxes)
- `.github/workflows/generate-demo.yml` (model ID mapping)

### Change Prompt Limit

To change the 200 character limit:
- Edit line 73 in `.github/workflows/generate-demo.yml`

### Modify Workflow Trigger

Currently triggers on `approved` label. To change:
- Edit `jobs.generate-demo.if` condition in workflow file

## Monitoring

### Key Metrics to Watch

- Time to approve submissions
- Workflow success rate
- API costs/usage
- Generated demo quality
- User feedback

### Common Issues

1. **Workflow fails**: Check API key and quota
2. **Long generation time**: Normal with multiple models
3. **PR conflicts**: May need manual intervention
4. **Invalid prompts**: Add feedback in issue comments

## Community Management

### Approval Guidelines

Approve submissions that:
- ✅ Have clear, specific prompts
- ✅ Are feasible in single HTML file
- ✅ Don't request copyrighted content
- ✅ Follow prompt length limit
- ✅ Are appropriate and safe

Reject or request changes for:
- ❌ Vague or unclear prompts
- ❌ Requiring server-side features
- ❌ Requesting copyrighted material
- ❌ Inappropriate content
- ❌ Overly complex requirements

### Response Time

Try to review submissions within:
- Critical: 24 hours
- Standard: 48 hours
- Low priority: 1 week

## Support

If issues arise:
1. Check workflow logs in Actions tab
2. Review [WORKFLOW_TESTING.md](.github/WORKFLOW_TESTING.md)
3. Verify API key and permissions
4. Check OpenRouter API status

## Benefits

This workflow provides:
- 🎯 **Easy contributions** - No code knowledge needed
- ⚡ **Fast results** - Automated generation
- 🤖 **Multi-model comparison** - Test multiple AI models
- 📊 **Quality control** - Manual approval gate
- 🔄 **Reproducible** - Consistent generation process
- 📝 **Well documented** - Clear guidelines

## Next Steps

After merge:
1. Set up `OPENROUTER_API_KEY` secret
2. Test with a demo submission
3. Monitor first few real submissions
4. Gather community feedback
5. Iterate and improve

## Questions?

Refer to:
- [MAINTAINER_GUIDE.md](.github/MAINTAINER_GUIDE.md) - Detailed workflow management
- [WORKFLOW_TESTING.md](.github/WORKFLOW_TESTING.md) - Testing procedures
- [CONTRIBUTING.md](../CONTRIBUTING.md) - User-facing contribution guide

---

Ready to enable community contributions! 🚀
