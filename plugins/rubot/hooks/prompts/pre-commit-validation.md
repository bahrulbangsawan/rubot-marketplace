# Pre-Commit Validation Hook

This hook intercepts git commit commands to ensure validation has passed before committing.

## Trigger Condition

This hook activates when:
- Tool: `Bash`
- Command contains: `git commit`

## Validation Logic

When a git commit is detected, check:

1. **Check if rubot workspace exists**:
   - Look for `.claude/rubot/` directory
   - If not exists, allow commit (non-rubot project)

2. **Check validation report**:
   - Read `.claude/rubot/validation-report.md`
   - Look for validation status

3. **Decision Matrix**:

| Condition | Action |
|-----------|--------|
| No rubot workspace | ALLOW - not a rubot project |
| Validation PASS | ALLOW - proceed with commit |
| Validation FAIL | BLOCK - must fix issues first |
| No validation report | WARN - recommend running /rubot-check |

## Block Message

If validation failed, respond with:

```
COMMIT BLOCKED: Validation has not passed.

The validation report at .claude/rubot/validation-report.md shows failures.

To proceed:
1. Run `/rubot-check` to see current issues
2. Fix all reported errors
3. Run `/rubot-check` again until validation passes
4. Then retry the commit

To bypass (not recommended):
- User can explicitly request to skip validation
```

## Allow Message

If validation passed:

```
Pre-commit check: Validation PASSED
Proceeding with commit...
```

## Implementation Notes

- Only check `.claude/rubot/validation-report.md` if it exists
- Parse the report for `## Summary` section and status
- Look for keywords: "PASS", "FAIL", "passed", "failed"
- If report is stale (>24h), warn but allow
