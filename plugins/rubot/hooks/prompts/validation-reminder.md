# Validation Reminder Hook

This hook reminds users to run validation before ending a session with uncommitted changes.

## Trigger Condition

This hook activates when:
- Event: `Stop`
- Session is about to end

## Reminder Logic

1. **Check for rubot workspace**:
   - Look for `.claude/rubot/` directory
   - If not exists, skip reminder

2. **Check for uncommitted changes**:
   - Run `git status --porcelain`
   - If output is empty, skip reminder

3. **Check validation status**:
   - Read `.claude/rubot/validation-report.md`
   - Check timestamp - is it recent?
   - Check status - did it pass?

4. **Decision Matrix**:

| Uncommitted Changes | Validation Status | Action |
|---------------------|-------------------|--------|
| No | Any | No reminder |
| Yes | Recent PASS | Gentle reminder to commit |
| Yes | Recent FAIL | Strong reminder to fix |
| Yes | Stale/None | Reminder to validate |

## Reminder Messages

### No Uncommitted Changes

No reminder needed.

### Uncommitted Changes, Validation Passed

```
SESSION ENDING - UNCOMMITTED CHANGES DETECTED

You have uncommitted changes and validation has passed.

Before ending:
  /rubot-commit - Commit your changes
  /rubot-new-pr - Create a pull request

Or run `git stash` to save changes for later.
```

### Uncommitted Changes, Validation Failed

```
SESSION ENDING - ACTION REQUIRED

You have uncommitted changes but validation has FAILED.

Before ending, consider:
1. Run /rubot-check to see current issues
2. Fix validation errors
3. Run /rubot-commit when ready

Leaving with failed validation may cause issues later.
```

### Uncommitted Changes, No Recent Validation

```
SESSION ENDING - VALIDATION RECOMMENDED

You have uncommitted changes but haven't run validation recently.

Before ending:
  /rubot-check - Verify your changes pass all checks
  /rubot-commit - Then commit your changes

This helps ensure code quality is maintained.
```

## Context to Include

When reminding, include:
- Number of modified files
- Number of new files
- Last validation timestamp (if exists)
- Current branch name

## Skip Conditions

Skip reminder when:
- No rubot workspace exists
- No uncommitted changes
- User is in a read-only exploration session
- Changes are only to `.claude/` workspace files

## Implementation Notes

- Keep reminders brief and actionable
- Don't block session end, just remind
- Provide quick command references
- Be helpful, not naggy
- Only show most relevant reminder (not multiple)
