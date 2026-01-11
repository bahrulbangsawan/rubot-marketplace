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

Run environment checks using these bash commands:

```bash
# Check critical tools
echo "=== Critical Tools ===" && \
command -v bun && bun --version || echo "[FAIL] bun not found" && \
command -v node && node --version || echo "[FAIL] node not found" && \
command -v git && git --version || echo "[FAIL] git not found"

# Check optional tools
echo "=== Optional Tools ===" && \
command -v wrangler && wrangler --version || echo "[WARN] wrangler not installed" && \
command -v gh && gh --version || echo "[WARN] gh CLI not installed"

# Check wrangler authentication
echo "=== Wrangler Auth ===" && \
wrangler whoami 2>/dev/null || echo "[WARN] Wrangler not authenticated"

# Check configuration files
echo "=== Config Files ===" && \
ls -la package.json bun.lockb bun.lock wrangler.toml .env .env.local 2>/dev/null
```

## Validation Categories

### 1. Tool Availability (Critical)

These tools are **required** - validation will fail if missing:

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

Check versions with:
```bash
bun --version   # e.g., 1.3.0
node --version  # e.g., v24.10.0
wrangler --version 2>/dev/null  # e.g., 4.42.2
```

### 3. Wrangler Readiness

Check Cloudflare Workers deployment readiness:

| Check | Command | Pass Condition |
|-------|---------|----------------|
| Installation | `command -v wrangler` | Command exists |
| Authentication | `wrangler whoami` | Returns account info |
| Configuration | `ls wrangler.toml wrangler.jsonc wrangler.json` | At least one exists |

### 4. Configuration Files

| File | Purpose | Check Command |
|------|---------|---------------|
| `package.json` | Project manifest | `test -f package.json` |
| `bun.lockb` / `bun.lock` | Dependency lockfile | `ls bun.lock* 2>/dev/null` |
| `wrangler.toml` | Cloudflare config | `test -f wrangler.toml` |
| `drizzle.config.*` | Drizzle ORM config | `ls drizzle.config.* 2>/dev/null` |
| `.env` / `.env.local` | Environment variables | `ls .env* 2>/dev/null` |

### 5. Project Stack Detection

Detect rubot-standard stack components in `package.json`:

```bash
# Check for stack components
cat package.json | grep -E '"(elysia|drizzle-orm|@trpc/|zod|@neondatabase/|@tanstack/)"' | head -10
```

| Component | Package Pattern |
|-----------|-----------------|
| ElysiaJS | `"elysia"` |
| Drizzle ORM | `"drizzle-orm"` |
| tRPC | `"@trpc/*"` |
| Zod | `"zod"` |
| Neon/PostgreSQL | `"@neondatabase/serverless"`, `"pg"`, `"postgres"` |
| TanStack | `"@tanstack/*"` |

Also check for database connection environment variables:
```bash
grep -E "^(DATABASE_URL|NEON_|POSTGRES_)" .env .env.local 2>/dev/null
```

### 6. Validate Command

Check if `package.json` defines a `validate` script:

```bash
# Check for validate script
cat package.json | grep '"validate"'

# Run validation
bun run validate
```

## Exit Criteria

| Status | Meaning |
|--------|---------|
| Pass | All critical tools present, configuration valid |
| Fail | Missing bun/node/git or critical configuration |
| Warn | Missing optional components (wrangler, gh) |

## Output Format

Use these status indicators in reports:

```
[PASS] Check passed successfully
[FAIL] Check failed - must be resolved
[WARN] Warning - recommended to address
[INFO] Informational message
```

## Integration with Rubot Workflow

### In `/rubot-init`

Run environment check first to ensure the development environment is ready.

If critical tools are missing, abort initialization and provide remediation steps.

### In `/rubot-check`

Include environment validation in the comprehensive check:

```markdown
## Environment Validation
- **Result**: [pass/fail]
- **Critical Issues**: [count]
- **Warnings**: [count]
```

### In CI Pipelines

Add environment checks to CI workflow:

```yaml
- name: Validate Environment
  run: |
    command -v bun || exit 1
    command -v node || exit 1
    bun --version
    node --version
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
