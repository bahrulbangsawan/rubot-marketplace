# Auto Plan Update Hook

This hook monitors file changes and suggests notifying plan-supervisor when relevant files are modified.

## Trigger Condition

This hook activates when:
- Tool: `Edit` or `Write`
- File modification completed successfully

## Logic Flow

1. **Check if rubot workspace exists**:
   - Look for `.claude/rubot/plan.md`
   - If not exists, skip (no active plan)

2. **Check if plan has active tasks**:
   - Read `.claude/rubot/plan.md`
   - Look for unchecked items `- [ ]`
   - If no unchecked items, skip (plan complete)

3. **Match file to plan tasks**:
   - Compare modified file path against plan's "Files to Modify" section
   - If file matches a planned task, suggest update

4. **Suggest plan-supervisor notification**:
   - If file modification relates to a plan task
   - Provide summary for plan-supervisor

## Response Format

When a relevant file is modified:

```
FILE CHANGE DETECTED

Modified: [file path]
Related Plan Task: [matched task from plan.md]

Consider notifying plan-supervisor to update task status.

To update the plan, invoke plan-supervisor with:
- Task: "[task description]"
- Summary: "[what was done]"
- Files: "[modified files]"
```

## Skip Conditions

Do NOT suggest plan updates for:
- Files in `node_modules/`
- Files in `.git/`
- Lock files (`bun.lockb`, `package-lock.json`)
- Build outputs (`dist/`, `.output/`, `.vinxi/`)
- Temporary files
- The plan.md file itself
- Validation reports

## File Categories

### Always Track

| File Pattern | Category |
|--------------|----------|
| `src/**/*.ts` | Source code |
| `src/**/*.tsx` | Components |
| `app/**/*` | Routes/pages |
| `lib/**/*` | Utilities |
| `components/**/*` | UI components |
| `*.config.*` | Configuration |
| `schema.ts` | Database schema |

### Never Track

| File Pattern | Reason |
|--------------|--------|
| `*.lock*` | Auto-generated |
| `*.log` | Logs |
| `.env*` | Environment |
| `node_modules/**` | Dependencies |
| `.claude/**` | Workspace |

## Implementation Notes

- Only activate when a plan.md exists
- Parse plan.md to extract file references
- Use fuzzy matching for file paths
- Don't auto-invoke plan-supervisor, just suggest
- Keep suggestions brief and actionable
