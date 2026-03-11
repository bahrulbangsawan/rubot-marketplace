---
name: env-check
version: 1.1.0
description: |
  Validates local development tooling, CLI versions, and stack readiness. Checks bun, node, wrangler, git, gh availability, version compatibility, lockfile format, Wrangler auth, and project dependency detection.
  MUST activate when user says: "check my setup", "is bun installed", "what version", "prerequisites check", "verify my tools", "which tools do I need", "environment setup", "dev environment ready", "setup not working", "can't find command", "command not found" (bun/node/wrangler/git). Also activate for: "bun: command not found", "lockfile version mismatch", "bun.lockb not working", "MODULE_NOT_FOUND but it's in package.json", "wrangler whoami returns error", "expired token", "node version is 20+", "bun 1.1+", "fresh Mac setup", "CI pipeline validate runner tools", "before running /rubot-init", and "why won't it build" when the root cause might be missing/outdated CLI tools. Do NOT activate for: adding env vars to wrangler.toml, writing health check endpoints, setting up biome.json, running drizzle-kit, deploying workers, checking .env variable values, installing npm packages, or responsive layout audits.

  Covers: tool availability, version checks (bun 1.1+, node 20+, wrangler 3/4), lockfile migration (bun.lockb to bun.lock), Wrangler auth readiness, stack detection, config file presence, and CI environment validation.
agents:
  - cloudflare
  - debug-master
---

# Environment Checker Skill
> Validate local tooling, versions, and stack readiness before a single line of code runs.

## When to Use

- **Project bootstrap** — run before `/rubot-init` to catch missing tools before they cause confusing failures
- **Pre-deployment gate** — verify Wrangler auth and config before pushing to Cloudflare Workers
- **Debugging build errors** — "module not found", version mismatch, or CLI-not-found errors often trace back to environment gaps
- **CI pipeline setup** — ensure runners have every required binary and correct versions
- **Onboarding new developers** — one command confirms the machine is ready

## Quick Reference

```bash
# Full environment check (copy-paste one-liner)
echo "=== Critical Tools ===" && \
(command -v bun && bun --version || echo "[FAIL] bun not found") && \
(command -v node && node --version || echo "[FAIL] node not found") && \
(command -v git && git --version || echo "[FAIL] git not found") && \
echo "=== Optional Tools ===" && \
(command -v wrangler && wrangler --version || echo "[WARN] wrangler not installed") && \
(command -v gh && gh --version || echo "[WARN] gh CLI not installed") && \
echo "=== Wrangler Auth ===" && \
(wrangler whoami 2>/dev/null || echo "[WARN] Wrangler not authenticated") && \
echo "=== Config Files ===" && \
ls -la package.json bun.lockb bun.lock wrangler.toml .env .env.local 2>/dev/null
```

## Core Principles

1. **Fail early, fail clearly** — a missing `bun` binary discovered during `bun run build` produces a generic shell error; discovering it during an explicit env-check produces an actionable message with install instructions. Early detection saves minutes-to-hours of debugging.
2. **Version compatibility matters** — Bun 1.0 vs 1.1+ introduced breaking changes in the module resolver and lockfile format (`bun.lockb` → `bun.lock`). Node 18 vs 20+ changed the default `fetch` global. Running the wrong major version leads to subtle, hard-to-Google failures.
3. **Wrangler readiness prevents deployment disasters** — deploying to Cloudflare Workers without valid auth or a correct `wrangler.toml` results in cryptic 10xxx error codes. Checking `wrangler whoami` before deploy is cheap; debugging a failed production deploy is not.
4. **Stack detection drives smart defaults** — knowing that a project uses Drizzle+Neon vs Prisma+Supabase lets other skills apply the right patterns automatically.

## Tool Availability

### Critical (validation fails if missing)

| Tool | Purpose | Min Version | Installation |
|------|---------|-------------|--------------|
| `bun` | JS runtime & package manager | 1.1.0+ | `curl -fsSL https://bun.sh/install \| bash` |
| `node` | Node.js runtime (compat/tooling) | 20.0.0+ | `fnm install 20` or https://nodejs.org |
| `git` | Version control | 2.30+ | System package manager |

### Optional (warning if missing)

| Tool | Purpose | Installation |
|------|---------|--------------|
| `wrangler` | Cloudflare Workers CLI | `bun add -g wrangler` then `wrangler login` |
| `gh` | GitHub CLI (PRs, issues, releases) | https://cli.github.com |

### Version Checks

```bash
bun --version        # expect 1.1.0+
node --version       # expect v20.0.0+
git --version        # expect 2.30+
wrangler --version 2>/dev/null  # expect 3.x or 4.x
gh --version 2>/dev/null
```

**Why versions matter:**
- **Bun <1.1** — old lockfile format (`bun.lockb`), missing workspace features, different module resolution. Projects using `bun.lock` (text-based) require 1.1+.
- **Node <20** — no built-in `fetch`, no stable `--watch`, missing `crypto.subtle` globals. Many modern libraries assume Node 20+.
- **Wrangler 3 vs 4** — config schema differences (`wrangler.toml` fields changed), different dev server behaviour. Check `wrangler.toml` compatibility header.

## Stack Detection

Identify what stack a project uses by inspecting config files and `package.json` dependencies.

### Config File Signatures

| File Present | Indicates |
|-------------|-----------|
| `wrangler.toml` / `wrangler.jsonc` | Cloudflare Workers deployment target |
| `drizzle.config.ts` / `drizzle.config.json` | Drizzle ORM with migrations |
| `biome.json` / `biome.jsonc` | Biome linter/formatter (not ESLint) |
| `tsconfig.json` | TypeScript project |
| `bun.lock` or `bun.lockb` | Bun as package manager |
| `.env.local` | Local environment overrides |

### Dependency Detection

```bash
# Detect stack components from package.json
cat package.json | grep -oE '"(elysia|drizzle-orm|@trpc/server|zod|@neondatabase/serverless|@tanstack/react-query|@tanstack/react-router|@tanstack/react-table|@tanstack/react-form|hono|pg|postgres)"' | sort -u
```

| Component | Package Pattern | What It Tells You |
|-----------|-----------------|-------------------|
| ElysiaJS | `"elysia"` | Bun-native HTTP framework |
| Drizzle ORM | `"drizzle-orm"` | Type-safe SQL with migrations |
| tRPC | `"@trpc/*"` | End-to-end type-safe API layer |
| Zod | `"zod"` | Schema validation (likely used by tRPC/forms) |
| Neon | `"@neondatabase/serverless"` | Serverless PostgreSQL via HTTP |
| TanStack | `"@tanstack/*"` | Router, query, table, or form |
| Hono | `"hono"` | Lightweight HTTP framework (CF Workers) |

### Database Connection Check

```bash
# Check for database env vars (presence only — never print values)
grep -lE "^(DATABASE_URL|NEON_|POSTGRES_)" .env .env.local 2>/dev/null && \
  echo "[PASS] Database env vars found" || \
  echo "[WARN] No database env vars in .env/.env.local"
```

## Wrangler Readiness

| Check | Command | Pass Condition | Why It Matters |
|-------|---------|----------------|----------------|
| Installed | `command -v wrangler` | Binary exists in PATH | Cannot deploy without it |
| Authenticated | `wrangler whoami` | Returns account name | Unauthenticated deploys fail with opaque errors |
| Configured | `ls wrangler.toml wrangler.jsonc wrangler.json 2>/dev/null` | At least one exists | Wrangler needs a config to know the worker name, routes, bindings |

## Configuration Files

| File | Purpose | Check |
|------|---------|-------|
| `package.json` | Project manifest & scripts | `test -f package.json` |
| `bun.lock` / `bun.lockb` | Dependency lockfile | `ls bun.lock* 2>/dev/null` |
| `wrangler.toml` | Cloudflare Workers config | `test -f wrangler.toml` |
| `drizzle.config.*` | Drizzle ORM config | `ls drizzle.config.* 2>/dev/null` |
| `.env` / `.env.local` | Environment variables | `ls .env* 2>/dev/null` |
| `biome.json` | Linter/formatter config | `test -f biome.json` |

### Validate Script Check

```bash
# Check if project defines a validate script
cat package.json | grep '"validate"' && echo "[INFO] Run: bun run validate"
```

## Remediation Steps

### Missing bun

```bash
# Install latest bun
curl -fsSL https://bun.sh/install | bash
# Reload shell
source ~/.bashrc  # or ~/.zshrc
# Verify
bun --version
```

**Common issue:** bun installed but not in PATH → add `export BUN_INSTALL="$HOME/.bun"` and `export PATH="$BUN_INSTALL/bin:$PATH"` to your shell profile.

### Wrong Node version

```bash
# Using fnm (recommended)
fnm install 20 && fnm use 20
# Using nvm
nvm install 20 && nvm use 20
# Verify
node --version  # should show v20.x.x+
```

**nvm/fnm conflict:** if both are installed, one may shadow the other. Check `which node` to confirm the active version manager is the one you expect.

### Missing or outdated wrangler

```bash
bun add -g wrangler
wrangler login          # opens browser for OAuth
wrangler whoami         # verify auth succeeded
```

### Missing lockfile

```bash
bun install  # generates bun.lock
```

**Note:** if you see `bun.lockb` (binary) instead of `bun.lock` (text), the project was created with Bun <1.1. Run `rm bun.lockb && bun install` to migrate to the text-based lockfile.

### Missing .env

```bash
cp .env.example .env.local
# Edit .env.local with actual values — never commit .env.local
```

### Missing database connection

Add to `.env.local`:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

For Neon specifically: copy the connection string from the Neon dashboard → Connection Details → Pooled connection string.

## Exit Criteria

| Status | Meaning | Action |
|--------|---------|--------|
| `[PASS]` | Check passed | No action needed |
| `[FAIL]` | Critical tool missing or wrong version | Must resolve before proceeding |
| `[WARN]` | Optional component missing | Recommended to address; may block specific workflows |
| `[INFO]` | Informational | No action needed |

## Integration with Rubot Workflow

### In `/rubot-init`
Run environment check first. If critical tools are missing, abort initialization and provide remediation steps with exact install commands.

### In `/rubot-check`
Include environment validation in the comprehensive report:
```
## Environment Validation
- **Result**: [pass/fail]
- **Critical Issues**: [count]
- **Warnings**: [count]
```

### In CI Pipelines
```yaml
- name: Validate Environment
  run: |
    command -v bun || exit 1
    command -v node || exit 1
    bun --version
    node --version
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `bun: command not found` | Bun not installed or not in PATH | Install bun; add `~/.bun/bin` to PATH |
| `error: lockfile version mismatch` | Bun version too old for `bun.lock` format | Upgrade bun: `bun upgrade` |
| `wrangler: command not found` | Wrangler not installed globally | `bun add -g wrangler` |
| `wrangler whoami` returns error | Not authenticated or token expired | `wrangler login` (re-authenticates via browser) |
| `node: command not found` after nvm install | Shell not reloaded | `source ~/.zshrc` or open new terminal |
| `fnm` and `nvm` conflicting | Both version managers installed | Remove one; check `which node` resolves correctly |
| `MODULE_NOT_FOUND` on known package | `node_modules` missing or stale | `rm -rf node_modules && bun install` |
| `.env` values not loading | Wrong filename or missing dotenv setup | Bun loads `.env` automatically; ensure file is `.env` or `.env.local` |
| `drizzle-kit: command not found` | Not in devDependencies | `bun add -D drizzle-kit` |
| Deployment fails with 10000-series error | Wrangler config mismatch or missing bindings | Check `wrangler.toml` bindings match dashboard settings |

## Constraints

- **No network calls** except `wrangler whoami` for auth check
- **No secret output** — env files checked for presence only, never print values
- **Deterministic output** — same environment produces same result
- **CI-safe** — works in headless environments without interactive prompts
- **Fail-fast** — stops immediately on critical missing tools
- **Read-only** — never installs or modifies anything; only reports status

## Verification Checklist

Before marking environment as ready, confirm every item:

- [ ] `bun --version` returns 1.1.0 or higher
- [ ] `node --version` returns v20.0.0 or higher
- [ ] `git --version` returns 2.30 or higher
- [ ] `package.json` exists in project root
- [ ] `bun.lock` or `bun.lockb` exists (dependencies installed)
- [ ] `node_modules/` directory exists and is non-empty
- [ ] `wrangler whoami` succeeds (if project deploys to CF Workers)
- [ ] `wrangler.toml` exists and has valid `name` field (if CF Workers project)
- [ ] `.env` or `.env.local` exists with required variables (if project needs env vars)
- [ ] `bun run validate` passes (if validate script defined in package.json)

## References

- Bun installation: https://bun.sh/docs/installation
- Bun lockfile migration (lockb → lock): https://bun.sh/blog/bun-lock-text-lockfile
- Node.js releases & EOL schedule: https://nodejs.org/en/about/previous-releases
- Wrangler CLI docs: https://developers.cloudflare.com/workers/wrangler
- fnm (Fast Node Manager): https://github.com/Schniz/fnm
- GitHub CLI: https://cli.github.com/manual
