---
name: rubot-status
description: View current rubot workspace status and workflow progress
allowed-tools:
  - Read
  - Bash
  - Glob
---

You are in the STATUS VIEW PHASE of the rubot orchestration workflow.

## Purpose

Display a comprehensive status overview of the current rubot workspace including:
- Workspace initialization state
- Plan progress
- Validation status
- Git state
- Available next actions

## Status Check Process

### Step 1: Check Workspace Existence

```bash
ls -la .claude/rubot/ 2>/dev/null || echo "NO_WORKSPACE"
```

If no workspace exists:
```
RUBOT WORKSPACE NOT FOUND

No rubot workspace detected in this project.

To initialize:
  /rubot-init - Initialize rubot workspace with project detection

This will create:
  .claude/rubot/rubot.local.md  - Project configuration
  .claude/rubot/plan.md         - Execution plan (when created)
```

### Step 2: Load Workspace Configuration

If workspace exists, read:
- `.claude/rubot/rubot.local.md` - Project configuration

Extract:
- Project name
- Detected stack
- Inactive agents
- Custom rules

### Step 3: Check Plan Status

Read `.claude/rubot/plan.md` if it exists.

Calculate:
- Total tasks
- Completed tasks (lines with `- [x]`)
- Pending tasks (lines with `- [ ]`)
- Current phase
- Completion percentage

### Step 4: Check Validation Status

Read `.claude/rubot/validation-report.md` if it exists.

Extract:
- Last run timestamp
- Pass/Fail status
- Error count
- Warning count

### Step 5: Check Git Status

```bash
git branch --show-current
git status --porcelain | wc -l
git log -1 --format="%h %s" 2>/dev/null
```

Extract:
- Current branch
- Uncommitted changes count
- Last commit info

### Step 6: Check PR Status

```bash
gh pr view --json number,title,state 2>/dev/null || echo "NO_PR"
```

## Output Format

```
╔══════════════════════════════════════════════════════════════╗
║                    RUBOT WORKSPACE STATUS                     ║
╠══════════════════════════════════════════════════════════════╣
║ Project: [name]                                               ║
║ Stack: [detected frameworks]                                  ║
╠══════════════════════════════════════════════════════════════╣
║ PLAN STATUS                                                   ║
║ ──────────────────────────────────────────────────────────── ║
║ Status: [Active/Not Created/Completed]                        ║
║ Progress: [████████░░░░░░░░░░░░] 40% (4/10 tasks)            ║
║ Current Phase: [phase name]                                   ║
╠══════════════════════════════════════════════════════════════╣
║ VALIDATION STATUS                                             ║
║ ──────────────────────────────────────────────────────────── ║
║ Last Run: [timestamp or "Never"]                              ║
║ Status: [PASS ✓ / FAIL ✗]                                     ║
║ Errors: [count]  Warnings: [count]                            ║
╠══════════════════════════════════════════════════════════════╣
║ GIT STATUS                                                    ║
║ ──────────────────────────────────────────────────────────── ║
║ Branch: [branch name]                                         ║
║ Changes: [count] uncommitted files                            ║
║ Last Commit: [hash] [message]                                 ║
║ PR: [#number title] or [No active PR]                         ║
╠══════════════════════════════════════════════════════════════╣
║ QUICK ACTIONS                                                 ║
║ ──────────────────────────────────────────────────────────── ║
║ [Suggested next command based on state]                       ║
╚══════════════════════════════════════════════════════════════╝
```

## Quick Action Suggestions

Based on current state, suggest the most relevant next action:

| State | Suggested Action |
|-------|------------------|
| No plan exists | `/rubot-plan` - Create an execution plan |
| Plan exists, not started | `/rubot-execute` - Execute the plan |
| Plan in progress | `/rubot-execute` - Continue execution |
| Plan complete, not validated | `/rubot-check` - Run validation |
| Validation passed, changes uncommitted | `/rubot-commit` - Commit changes |
| Changes committed, no PR | `/rubot-new-pr` - Create pull request |
| PR exists, more changes | `/rubot-push-pr` - Push updates to PR |
| Everything complete | "All tasks complete! PR ready for review." |

## Compact Output Mode

For quick status checks, provide a compact single-line summary:

```
RUBOT: [project] | Plan: 4/10 (40%) | Validation: PASS | Git: 3 changes | PR: #42
```

## Error States

### Missing Configuration

```
⚠️  CONFIGURATION INCOMPLETE

Missing: rubot.local.md

Run /rubot-init to reconfigure the workspace.
```

### Stale Validation

```
⚠️  VALIDATION STALE

Last validation was [X hours/days] ago.
Changes have been made since then.

Run /rubot-check to re-validate.
```

### Uncommitted Changes with Failed Validation

```
⚠️  ACTION REQUIRED

You have uncommitted changes but validation has FAILED.

1. Run /rubot-check to see issues
2. Fix the issues
3. Run /rubot-commit when ready
```

## Implementation Notes

- Keep the output concise but informative
- Use visual progress bars for completion
- Color-code status (conceptually: green=good, yellow=warning, red=error)
- Always provide a clear next action
- Handle missing files gracefully
