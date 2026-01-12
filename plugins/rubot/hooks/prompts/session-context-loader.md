# Session Context Loader Hook

This hook loads rubot workspace context at the start of each session to provide continuity.

## Trigger Condition

This hook activates when:
- Event: `SessionStart`
- A new Claude Code session begins

## Context Loading Process

1. **Check for rubot workspace**:
   ```
   Look for: .claude/rubot/rubot.local.md
   ```

2. **If workspace exists, load context**:
   - Read `.claude/rubot/rubot.local.md` for project configuration
   - Check for active plan at `.claude/rubot/plan.md`
   - Check for validation status at `.claude/rubot/validation-report.md`

3. **Present session context summary**:

## Session Context Summary Format

```
RUBOT WORKSPACE DETECTED

Project: [name from rubot.local.md]
Stack: [detected stack]

Active Plan: [Yes/No]
  - Status: [Pending/In Progress/Completed]
  - Tasks remaining: [count]

Last Validation: [timestamp or "Not run"]
  - Status: [PASS/FAIL/Unknown]

Quick Commands:
  /rubot-status  - View current workflow status
  /rubot-plan    - Create or view execution plan
  /rubot-execute - Execute the current plan
  /rubot-check   - Run validation checks
  /rubot-commit  - Commit changes

Inactive Agents: [list from rubot.local.md or "None"]
```

## Context Information to Extract

### From rubot.local.md

| Field | Description |
|-------|-------------|
| Project name | Name of the project |
| Stack | Detected frameworks |
| Inactive agents | Agents disabled for this project |
| Git rules | Commit conventions |
| Validation rules | Required checks |

### From plan.md (if exists)

| Field | Description |
|-------|-------------|
| Status | Current plan status |
| Task count | Total tasks |
| Completed | Completed tasks |
| Current phase | Active phase |

### From validation-report.md (if exists)

| Field | Description |
|-------|-------------|
| Timestamp | When validation ran |
| Status | PASS/FAIL |
| Error count | Number of failures |
| Warning count | Number of warnings |

## Skip Conditions

Skip context loading when:
- No `.claude/rubot/` directory exists
- This is a fresh project without rubot initialization
- User explicitly requested no context loading

## Implementation Notes

- Keep the summary concise (10-15 lines max)
- Highlight urgent items (failed validation, blocked tasks)
- Don't read full file contents, just metadata
- Cache context to avoid repeated file reads
- Gracefully handle missing files
