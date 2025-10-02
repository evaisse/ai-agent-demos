# Contribution Workflow Diagram

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER SUBMISSION                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Click "Submit   │
                    │   Demo Idea"     │
                    │   (GitHub Issue) │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Fill Form:     │
                    │  • Title         │
                    │  • Prompt (≤200) │
                    │  • Select Models │
                    │  • Context       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Issue Created   │
                    │  with labels:    │
                    │  • demo-         │
                    │    submission    │
                    │  • needs-review  │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MAINTAINER REVIEW                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Review Issue   │
                    │   • Check title  │
                    │   • Validate     │
                    │     prompt       │
                    │   • Verify no    │
                    │     copyright    │
                    └──────────────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
            ┌────────────┐      ┌────────────────┐
            │   Reject   │      │  Add "approved"│
            │  or Ask    │      │     Label      │
            │  Changes   │      └────────────────┘
            └────────────┘               │
                    │                    │
                    ▼                    ▼
            ┌────────────┐      ┌────────────────┐
            │   Close    │      │ Workflow       │
            │  or Update │      │ Triggers       │
            │   Issue    │      │ Automatically  │
            └────────────┘      └────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATED WORKFLOW                            │
└─────────────────────────────────────────────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌────────────┐      ┌────────────┐      ┌────────────┐
            │   Checkout │      │  Setup     │      │  Install   │
            │   Repo     │      │  Node.js   │      │  npm deps  │
            └────────────┘      └────────────┘      └────────────┘
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         ▼
                                ┌────────────────┐
                                │  Parse Issue   │
                                │  Body:         │
                                │  • Extract     │
                                │    title       │
                                │  • Extract     │
                                │    prompt      │
                                │  • Parse       │
                                │    models      │
                                │  • Validate    │
                                └────────────────┘
                                         │
                                         ▼
                                ┌────────────────┐
                                │  Create Demo   │
                                │  Structure:    │
                                │  npm run       │
                                │  create-demo   │
                                └────────────────┘
                                         │
                                         ▼
                    ┌────────────────────┴─────────────────────┐
                    │     For Each Selected Model:             │
                    │  ┌────────────────────────────────────┐  │
                    │  │  Generate Implementation:          │  │
                    │  │  npm run generate-demo             │  │
                    │  │  --demo <slug>                     │  │
                    │  │  --model <model-id>                │  │
                    │  │                                    │  │
                    │  │  • Call OpenRouter API             │  │
                    │  │  • Extract HTML from response      │  │
                    │  │  • Save to pages/demos/...         │  │
                    │  │  • Generate metrics & report       │  │
                    │  └────────────────────────────────────┘  │
                    └──────────────────────────────────────────┘
                                         │
                                         ▼
                                ┌────────────────┐
                                │  Update Viewer │
                                │  Data:         │
                                │  npm run       │
                                │  generate-     │
                                │  viewer        │
                                └────────────────┘
                                         │
                                         ▼
                                ┌────────────────┐
                                │  Create Pull   │
                                │  Request:      │
                                │  • Branch name │
                                │  • Commit msg  │
                                │  • PR body     │
                                │  • Link issue  │
                                └────────────────┘
                                         │
                                         ▼
                                ┌────────────────┐
                                │  Comment on    │
                                │  Issue with    │
                                │  PR Link       │
                                └────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PR REVIEW & MERGE                           │
└─────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
                                ┌────────────────┐
                                │  Maintainer    │
                                │  Reviews PR:   │
                                │  • Check demos │
                                │  • Test in     │
                                │    browser     │
                                │  • Verify      │
                                │    metrics     │
                                └────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
            ┌────────────┐                            ┌────────────┐
            │  Request   │                            │   Merge    │
            │  Changes   │                            │     PR     │
            └────────────┘                            └────────────┘
                    │                                         │
                    ▼                                         ▼
            ┌────────────┐                            ┌────────────┐
            │  Workflow  │                            │  Demo Live │
            │  Re-runs   │                            │  in Viewer │
            │  (optional)│                            └────────────┘
            └────────────┘                                    │
                                                              ▼
                                                     ┌────────────┐
                                                     │  Users can │
                                                     │  view and  │
                                                     │  compare   │
                                                     │  results   │
                                                     └────────────┘
```

## Timeline Estimates

| Stage                    | Time          | Notes                        |
|--------------------------|---------------|------------------------------|
| User Submission          | 2-5 min       | Fill issue form              |
| Maintainer Review        | 1-48 hrs      | Manual review                |
| Workflow Execution       | 2-15 min      | Depends on # of models       |
| - Checkout & Setup       | 30 sec        | -                            |
| - Parse & Validate       | 5 sec         | -                            |
| - Create Demo            | 5 sec         | -                            |
| - Generate (per model)   | 30-90 sec     | API call time                |
| - Update Viewer          | 5 sec         | -                            |
| - Create PR              | 10 sec        | -                            |
| PR Review & Merge        | Hours-Days    | Manual review                |
| **Total (1 model)**      | **~2-3 min**  | Automated portion            |
| **Total (7 models)**     | **~10-15 min**| Automated portion            |

## Key Decision Points

### 1. User Submission
- ✅ Form valid?
- ✅ Models selected?
- ✅ Guidelines accepted?

### 2. Maintainer Review
- ✅ Prompt clear and feasible?
- ✅ Under 200 characters?
- ✅ No copyrighted content?
- ✅ Appropriate and safe?

### 3. Workflow Execution
- ✅ Issue body parsed correctly?
- ✅ Demo structure created?
- ✅ All models generated successfully?
- ✅ Viewer data updated?

### 4. PR Review
- ✅ Generated HTML works?
- ✅ Metrics calculated correctly?
- ✅ No errors in console?
- ✅ Meets quality standards?

## Error Handling

```
Issue Created
    │
    ▼
Workflow Triggered ──────┐
    │                    │ (Failure)
    ▼                    ▼
Success           ┌────────────┐
    │             │  Comment   │
    ▼             │  on Issue  │
PR Created        │  with      │
                  │  Error     │
                  │  Details   │
                  └────────────┘
                        │
                        ▼
                  ┌────────────┐
                  │  User or   │
                  │  Maintainer│
                  │  Fixes     │
                  └────────────┘
                        │
                        ▼
                  ┌────────────┐
                  │  Re-trigger│
                  │  Workflow  │
                  └────────────┘
```

## Integration Points

### With Existing System
- ✅ Uses existing CLI commands (`create-demo`, `generate-demo`, `generate-viewer`)
- ✅ Follows existing directory structure (`pages/demos/{slug}/{model}/`)
- ✅ Maintains existing file formats (PROMPT.md, report.json, etc.)
- ✅ Updates existing viewer (demos.json)

### With GitHub Features
- ✅ Issue templates (YAML forms)
- ✅ GitHub Actions workflows
- ✅ Pull requests API
- ✅ Issue comments API
- ✅ Repository secrets

## Scalability Considerations

| Aspect          | Current State | Scalability         |
|-----------------|---------------|---------------------|
| Issue creation  | Manual form   | ∞ (GitHub limited)  |
| Approval        | Manual label  | Requires maintainer |
| Generation      | Automated     | Rate limited by API |
| Models/demo     | 1-7           | Parallel possible   |
| Concurrent runs | 1             | Can enable parallel |
| Storage         | Git repo      | Git LFS for large   |

## Security

```
Issue Input
    ├─► Prompt validation (200 char limit)
    ├─► Model validation (whitelist)
    ├─► No direct code execution
    └─► Manual approval gate
            │
            ▼
    API Key (Secret)
    ├─► Stored securely
    ├─► Not exposed in logs
    └─► Used server-side only
            │
            ▼
    Generated Content
    ├─► Reviewed before merge
    ├─► Sandboxed in viewer
    └─► No server execution
```
