# Dangerous Command Guard Hook

This hook intercepts potentially destructive bash commands and requires explicit user confirmation.

## Trigger Condition

This hook activates when:
- Tool: `Bash`
- Command matches dangerous patterns

## Dangerous Command Patterns

### BLOCK (Require Confirmation)

| Pattern | Risk Level | Reason |
|---------|------------|--------|
| `git push --force` | CRITICAL | Rewrites remote history |
| `git push -f` | CRITICAL | Rewrites remote history |
| `git reset --hard` | HIGH | Destroys uncommitted changes |
| `rm -rf /` | CRITICAL | System destruction |
| `rm -rf ~` | CRITICAL | Home directory destruction |
| `rm -rf *` | HIGH | Recursive deletion in current dir |
| `rm -rf .` | HIGH | Recursive deletion in current dir |
| `DROP DATABASE` | CRITICAL | Database destruction |
| `DROP TABLE` | HIGH | Table destruction |
| `TRUNCATE` | HIGH | Data destruction |
| `git branch -D` | MEDIUM | Force delete branch |
| `npm publish` | MEDIUM | Public package release |
| `wrangler delete` | HIGH | Production resource deletion |

### WARN (Proceed with Caution)

| Pattern | Reason |
|---------|--------|
| `git rebase` | History modification |
| `git cherry-pick` | Selective history |
| `npm install -g` | Global package installation |
| `chmod 777` | Insecure permissions |
| `sudo` | Elevated privileges |

## Response Format

### For BLOCK Commands

```
DANGEROUS COMMAND DETECTED

Command: [detected command]
Risk Level: [CRITICAL/HIGH/MEDIUM]
Reason: [why this is dangerous]

This command requires explicit user confirmation before execution.

To proceed, the user must explicitly confirm they understand the risks.
```

### For WARN Commands

```
CAUTION: Potentially risky command detected

Command: [detected command]
Concern: [why to be careful]

Proceeding with caution. Consider if this is truly necessary.
```

## Bypass Conditions

Allow dangerous commands when:
- User explicitly confirms with "yes, I understand the risks"
- Command is part of documented recovery procedure
- User has previously confirmed in the same session

## Special Cases

### Force Push Protection

For `git push --force`:
1. Check if pushing to `main` or `master` branch
2. If yes, ALWAYS block with extra warning
3. Suggest `--force-with-lease` as safer alternative

### Database Operations

For DROP/TRUNCATE:
1. Check if connected to production database
2. Require double confirmation for production
3. Suggest backup before proceeding

## Implementation Notes

- Parse the command string for pattern matching
- Use case-insensitive matching for SQL commands
- Check for aliases (e.g., `gp -f` for `git push -f`)
- Log all blocked commands for audit trail
