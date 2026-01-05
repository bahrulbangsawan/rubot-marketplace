---
name: rubot-new-pr
description: Create a new pull request using GitHub CLI
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

You are in the PULL REQUEST CREATION PHASE of the rubot orchestration workflow.

## Prerequisites

1. **Verify commit exists**:
   ```bash
   git log -1 --oneline
   ```
   - If no commits ahead of remote, inform user to run `/rubot-commit` first

2. **Check validation status**:
   - Read `.claude/rubot/validation-report.md`
   - Validation must have passed

3. **Load PR rules**:
   - Read `.claude/rubot/rubot.local.md` for PR conventions
   - Check for PR templates in `.github/PULL_REQUEST_TEMPLATE.md`

4. **Verify GitHub CLI**:
   ```bash
   gh auth status
   ```
   - If not authenticated, guide user to run `gh auth login`

## PR Creation Process

### Step 1: Analyze Branch State

```bash
git branch --show-current
git log origin/main..HEAD --oneline
git diff origin/main...HEAD --stat
```

Gather:
- Current branch name
- Commits to be included
- Files changed

### Step 2: Load Context

Read:
- `.claude/rubot/plan.md` - execution plan for PR body
- `.claude/rubot/validation-report.md` - validation results

### Step 3: Generate PR Content

Create PR title and body:

**Title format**:
```
<type>(<scope>): <brief description>
```

**Body format**:
```markdown
## Summary
<1-3 bullet points summarizing changes>

## Changes
<detailed list from execution plan>

## Execution Plan
<link or embed the plan summary>

## Validation Results
- `bun run validate`: PASS
- Type errors: 0
- Lint violations: 0

## Test Plan
- [ ] <test case 1>
- [ ] <test case 2>

## Checklist
- [x] Code follows project conventions
- [x] Validation passes
- [x] Documentation updated (if applicable)
- [ ] Ready for review

---
<generated with Claude Code footer>
```

### Step 4: Confirm with User

Present PR details:
```
Branch: feature/auth-system
Base: main
Title: feat(auth): add user authentication flow

Body preview:
[summary of PR body]

Create this PR?
```

Use AskUserQuestion for any modifications.

### Step 5: Push Branch

Ensure branch is pushed to remote:
```bash
git push -u origin $(git branch --show-current)
```

### Step 6: Create PR

Use GitHub CLI to create the PR:
```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
<PR body>
EOF
)"
```

### Step 7: Verify PR Created

```bash
gh pr view --web
```

Return the PR URL to user.

## Enforcement Rules

- Do NOT create PR if validation failed
- Do NOT create PR without commits ahead of base
- Do NOT skip PR body with execution plan reference
- Do NOT push to protected branches directly
- ALWAYS include validation results in PR body

## PR Templates

If `.github/PULL_REQUEST_TEMPLATE.md` exists, incorporate its structure.

If `rubot.local.md` specifies PR conventions, follow them.

## After PR Creation

Provide user with:
- PR URL
- Suggested reviewers (if defined in rubot.local.md)
- Next steps (await review, address feedback)
