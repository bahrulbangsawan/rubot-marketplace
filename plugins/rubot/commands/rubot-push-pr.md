---
name: rubot-push-pr
description: Push new commits to active pull request and re-run validations
allowed-tools:
  - Task
  - Read
  - Bash
  - AskUserQuestion
---

You are in the PULL REQUEST UPDATE PHASE of the rubot orchestration workflow.

## Prerequisites

1. **Verify active PR exists**:
   ```bash
   gh pr view --json number,title,state
   ```
   - If no PR exists, inform user to run `/rubot-new-pr` first
   - If PR is closed/merged, inform user

2. **Check for uncommitted changes**:
   ```bash
   git status
   ```
   - If uncommitted changes exist, inform user to run `/rubot-commit` first

3. **Load workspace configuration**:
   - Read `.claude/rubot/rubot.local.md` for project rules

## Update Process

### Step 1: Re-run Validations

Before pushing, re-run validation:

```bash
bun run validate
```

If validation fails:
1. Stop the push
2. Inform user of failures
3. Suggest running `/rubot-check` to fix issues

### Step 2: Invoke Verification Agents

Use Task tool to invoke key verification agents:

**debug-master**:
```
Task tool:
  subagent_type: "debug-master"
  prompt: |
    Quick validation check before PR push:
    1. Run `bun run validate`
    2. Check for type errors
    3. Check for lint violations

    Return pass/fail status.
```

### Step 3: Push Commits

If validation passes:
```bash
git push
```

### Step 4: Update PR Body (Optional)

Check if PR body needs updating based on new changes:

```bash
gh pr view --json body
```

If significant changes were made, offer to update PR body:
```bash
gh pr edit --body "$(cat <<'EOF'
<updated PR body>
EOF
)"
```

### Step 5: Add Comment to PR

Add a comment summarizing the new push:

```bash
gh pr comment --body "$(cat <<'EOF'
## Update Summary

**Commits pushed**: [count]

### Changes
- [change 1]
- [change 2]

### Validation
- `bun run validate`: PASS
- Type errors: 0
- Lint violations: 0

---
<generated with Claude Code>
EOF
)"
```

### Step 6: Check CI Status

```bash
gh pr checks
```

Report CI status to user:
- All checks passing
- Pending checks
- Failed checks (with details)

## Enforcement Rules

- Do NOT push if validation fails
- Do NOT push without commits ahead of remote
- Do NOT force push unless explicitly requested
- ALWAYS re-run validation before push
- ALWAYS document the push in PR comments

## Handling Failed CI

If CI checks fail after push:
1. Analyze failure from `gh pr checks`
2. Identify the issue
3. Offer to fix and re-push
4. Guide user through resolution

## Force Push Warning

If user requests force push:
1. Warn about rewriting history
2. Confirm this is intentional
3. Check if others are working on the PR
4. Only proceed with explicit confirmation

```bash
# Only with explicit user confirmation
git push --force-with-lease
```

## After Push

**ALWAYS** use AskUserQuestion after successful push:

```
AskUserQuestion({
  questions: [{
    question: "Push successful! [X] commit(s) pushed to PR #[number]. What would you like to do next?",
    header: "Next Step",
    options: [
      {
        label: "View PR in browser (Recommended)",
        description: "Open the PR on GitHub to check CI status and reviews"
      },
      {
        label: "Check CI status",
        description: "Run gh pr checks to see current CI status"
      },
      {
        label: "View review comments",
        description: "Check if there are any review comments to address"
      },
      {
        label: "Continue working",
        description: "Make more changes and push again later"
      },
      {
        label: "Done for now",
        description: "End here - I'll monitor the PR manually"
      }
    ],
    multiSelect: false
  }]
})
```

**Based on user response:**

- **"View PR in browser"**: Run `gh pr view --web`
- **"Check CI status"**: Run `gh pr checks` and display results
- **"View review comments"**: Run `gh pr view --comments` and summarize
- **"Continue working"**: Inform user they can push more commits with `/rubot-push-pr`
- **"Done for now"**: Display PR URL and exit

Provide user with:
- Updated commit count
- CI status
- Any review comments that need attention
- Link to PR for reference
