# Workflow Testing Guide

This guide helps test the demo submission workflow.

## Prerequisites

Before testing, ensure:
1. `OPENROUTER_API_KEY` is set as a repository secret
2. GitHub Actions are enabled
3. Branch protection rules allow workflow commits

## Setting Up Secrets

Navigate to: **Settings** → **Secrets and variables** → **Actions**

Add the following repository secret:
- Name: `OPENROUTER_API_KEY`
- Value: Your OpenRouter API key

## Testing the Workflow

### Option 1: Test with Manual Workflow Dispatch

1. Go to **Actions** → **Generate Demo from Issue**
2. Click **Run workflow**
3. Enter an issue number (or create a test issue first)
4. Click **Run workflow**
5. Monitor the workflow execution

### Option 2: Test with Issue Submission

1. **Create a test issue**:
   - Go to **Issues** → **New issue**
   - Select "🎨 Demo Submission"
   - Fill in the form with test data

2. **Example Test Data**:
   ```
   Demo Title: Test Calculator
   Demo Prompt: a simple calculator with basic arithmetic operations
   Models: [x] OpenAI GPT-4o-mini
   ```

3. **Approve the issue**:
   - Add the `approved` label to the issue
   - The workflow should trigger automatically

4. **Monitor progress**:
   - Check the Actions tab for workflow runs
   - Wait for the workflow to complete
   - Review the created PR

### Expected Workflow Behavior

When triggered, the workflow should:

1. ✅ Parse the issue body correctly
2. ✅ Extract title, prompt, and selected models
3. ✅ Validate prompt length (max 200 chars)
4. ✅ Create demo structure using `npm run create-demo`
5. ✅ Generate demos for each selected model
6. ✅ Update viewer data with `npm run generate-viewer`
7. ✅ Create a pull request with the generated content
8. ✅ Comment on the issue with PR link

### Sample Issue Body Format

The issue template creates bodies in this format:

```markdown
### Demo Title

Test Calculator

### Demo Prompt

a simple calculator with basic arithmetic operations

### Models to Test

- [x] OpenAI GPT-4o-mini
- [ ] Anthropic Claude 3.5 Sonnet

### Additional Context (Optional)

_No response_

### Submission Guidelines

- [x] I understand the prompt will be publicly visible
- [x] I confirm this doesn't request any copyrighted or harmful content
```

### Testing Checklist

- [ ] Issue template displays correctly
- [ ] Form validation works (required fields)
- [ ] Workflow triggers on `approved` label
- [ ] Issue body is parsed correctly
- [ ] Demo structure is created
- [ ] Models generate successfully
- [ ] Viewer data is updated
- [ ] PR is created with correct content
- [ ] Issue receives success comment
- [ ] PR can be merged successfully

## Troubleshooting

### Workflow Not Triggering

**Cause**: Label not set or issue missing `demo-submission` label
**Solution**: 
- Ensure the issue was created with the demo submission template
- Add both `demo-submission` and `approved` labels

### API Key Error

**Cause**: `OPENROUTER_API_KEY` secret not set or invalid
**Solution**: 
- Check repository secrets settings
- Verify the API key is valid
- Re-run the workflow after updating

### Parsing Errors

**Cause**: Issue body format doesn't match expected pattern
**Solution**:
- Use the official issue template
- Don't manually edit issue body structure
- Check workflow logs for parsing details

### Generation Failures

**Cause**: Model unavailable or API rate limit
**Solution**:
- Check OpenRouter API status
- Verify model IDs are correct
- Wait and retry if rate limited

### PR Creation Failed

**Cause**: Git conflicts or permissions issue
**Solution**:
- Check workflow permissions in repository settings
- Ensure `contents: write` and `pull-requests: write` are granted
- Verify no branch protection conflicts

## Manual Testing Steps

You can manually test components:

### 1. Test Demo Creation
```bash
npm run create-demo -- -t "Test Demo" -p "a simple test"
```

### 2. Test Demo Generation
```bash
npm run generate-demo -- -d test-demo -m openai/gpt-4o-mini
```

### 3. Test Viewer Update
```bash
npm run generate-viewer
```

## Cleanup After Testing

After testing:
1. Close or delete test issues
2. Delete test demo branches
3. Remove test PRs (if not merged)
4. Clean up test demo directories if needed:
   ```bash
   rm -rf pages/demos/test-*
   ```

## Success Criteria

The workflow is working correctly when:
- ✅ Issues are created easily via template
- ✅ Approval triggers automatic generation
- ✅ All selected models generate successfully
- ✅ PRs are created with complete content
- ✅ Generated demos appear in viewer after merge
- ✅ No manual intervention needed (except approval)

## Performance Notes

Generation time depends on:
- Number of selected models (1-7)
- Model response times (typically 10-60 seconds per model)
- API rate limits
- Prompt complexity

Expected total workflow time:
- 1 model: ~2-3 minutes
- 3 models: ~5-8 minutes
- 7 models: ~10-15 minutes

## Next Steps

After successful testing:
1. Document any issues found
2. Update workflow if needed
3. Communicate workflow availability to community
4. Monitor first few real submissions
5. Gather feedback and iterate
