---
name: Environment Checker
description: |
  Validates local tooling and stack readiness for modern web projects. Checks tool availability (bun, node, wrangler, git, gh), version information, Wrangler readiness, project dependencies (ElysiaJS, Drizzle, tRPC, Zod, Neon, TanStack), and configuration files. Use when setting up a project, before deployment, or in CI pipelines.
version: 1.0.0
agents:
  - cloudflare
  - debug-master
---

# Environment Checker Skill

This skill provides comprehensive environment validation for the rubot orchestration workflow, ensuring all required tooling and stack components are properly configured before execution.

## Documentation Verification (MANDATORY)

Before running environment checks or troubleshooting:

1. **Use Context7 MCP** to verify current tool APIs:
   - `mcp__context7__resolve-library-id` with libraryName: "bun" or "wrangler"
   - `mcp__context7__query-docs` for specific configuration patterns

2. **Use Exa MCP** for latest tooling information:
   - `mcp__exa__web_search_exa` for "bun installation 2024" or "wrangler setup"
   - `mcp__exa__get_code_context_exa` for configuration examples

3. **Use AskUserQuestion** when requirements are unclear:
   - Target deployment platform (Cloudflare, Vercel, etc.)
   - Database provider (Neon, Supabase, etc.)
   - Required tooling versions

## Usage

Run the environment checker script:

```bash
~/.claude/plugins/rubot/scripts/env_checker.sh [project_path]
```

If no project path is provided, it defaults to the current working directory.

## Validation Categories

### 1. Tool Availability (Critical)

These tools are **required** - the script will fail fast if missing:

| Tool | Purpose | Installation |
|------|---------|--------------|
| `bun` | JavaScript runtime & package manager | https://bun.sh |
| `node` | Node.js runtime (fallback/compatibility) | https://nodejs.org |
| `git` | Version control | System package manager |

These tools are **optional** but recommended:

| Tool | Purpose | Installation |
|------|---------|--------------|
| `wrangler` | Cloudflare Workers CLI | `bun add -g wrangler` |
| `gh` | GitHub CLI | https://cli.github.com |

### 2. Version Information

Displays detected versions for:
- bun (e.g., v1.3.0)
- node (e.g., v24.10.0)
- wrangler (e.g., 4.42.2)

### 3. Wrangler Readiness

Checks for Cloudflare Workers deployment readiness:

| Check | Pass Condition |
|-------|----------------|
| Installation | `wrangler` command available |
| Authentication | `wrangler whoami` succeeds |
| Configuration | `wrangler.toml`, `.jsonc`, or `.json` exists |

### 4. Configuration Files

| File | Purpose | Required |
|------|---------|----------|
| `package.json` | Project manifest | Yes |
| `bun.lockb` / `bun.lock` | Dependency lockfile | Recommended |
| `wrangler.toml` | Cloudflare config | If deploying to CF |
| `drizzle.config.*` | Drizzle ORM config | If using Drizzle |
| `.env` / `.env.local` | Environment variables | Recommended |

### 5. Project Stack Detection

Detects presence of rubot-standard stack components in `package.json`:

| Component | Package Pattern |
|-----------|-----------------|
| ElysiaJS | `"elysia"` |
| Drizzle ORM | `"drizzle-orm"` |
| tRPC | `"@trpc/*"` |
| Zod | `"zod"` |
| Neon/PostgreSQL | `"@neondatabase/serverless"`, `"pg"`, `"postgres"` |
| TanStack | `"@tanstack/*"` |

Also checks for database connection environment variables (`DATABASE_URL`, `NEON_*`, `POSTGRES_*`).

### 6. Validate Command

If `package.json` defines a `validate` script, the checker:
1. Detects its presence
2. Displays the command definition
3. Executes `bun run validate`
4. Reports pass/fail status

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All checks passed |
| `1` | Critical failure (missing bun/node/git) |
| `2` | Non-critical failures (missing optional components) |

## Output Format

The script produces structured CLI output with colored status indicators:

```
[PASS] Check passed successfully
[FAIL] Check failed - must be resolved
[WARN] Warning - recommended to address
[INFO] Informational message
       → Remediation hint for failures/warnings
```

## Integration with Rubot Workflow

### In `/rubot-init`

Run env_checker first to ensure the development environment is ready:

```bash
~/.claude/plugins/rubot/scripts/env_checker.sh .
```

If exit code is 1 (critical failure), abort initialization.

### In `/rubot-check`

Include environment validation in the comprehensive check:

```markdown
## Environment Validation
- **Command**: `env_checker.sh`
- **Result**: [pass/fail]
- **Critical Issues**: [count]
- **Warnings**: [count]
```

### In CI Pipelines

Add to CI workflow for pre-deployment validation:

```yaml
- name: Validate Environment
  run: ~/.claude/plugins/rubot/scripts/env_checker.sh .
```

## Remediation Reference

### Missing bun

```bash
curl -fsSL https://bun.sh/install | bash
```

### Missing wrangler

```bash
bun add -g wrangler
wrangler login
```

### Missing lockfile

```bash
bun install
```

### Missing .env

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### Missing database connection

Add to `.env.local`:
```
DATABASE_URL=postgresql://user:pass@host/dbname
```

## Constraints

- **No network calls** except `wrangler whoami` for auth check
- **No secret output** - env files checked for presence only
- **Deterministic output** - same input produces same result
- **CI-safe** - works in headless environments
- **Fail-fast** - stops immediately on critical missing tools
