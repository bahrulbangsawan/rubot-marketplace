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

Provide user with:
- Updated commit count
- CI status
- Any review comments that need attention
- Link to PR for reference
