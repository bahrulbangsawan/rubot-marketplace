---
name: rubot-init
description: Initialize or sync the rubot workspace with project configuration
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - AskUserQuestion
  - mcp__neon__list_projects
  - mcp__neon__get_database_tables
---

You are initializing or syncing the rubot workspace for this project.

## Initialization Process

### Step 1: Detect Project Information

Gather project information by examining:

```bash
# Get project name from package.json
cat package.json 2>/dev/null | grep '"name"' | head -1

# Check for project type indicators
ls -la package.json tsconfig.json wrangler.toml 2>/dev/null

# Detect framework/stack
cat package.json 2>/dev/null | grep -E "(elysia|drizzle|trpc|tanstack|react|next|vue)" | head -10
```

### Step 2: Scan Directory Structure

Map the project structure:

```bash
# List top-level directories
ls -d */ 2>/dev/null

# Find key configuration files
find . -maxdepth 2 -name "*.config.*" -o -name "*.json" 2>/dev/null | head -20

# Check for existing CLAUDE.md or AGENTS.md
ls -la CLAUDE.md AGENTS.md 2>/dev/null
```

### Step 3: Create Workspace Directory

```bash
mkdir -p .claude/rubot
```

### Step 4: Generate CLAUDE.md

Create or update `CLAUDE.md` in the project root with:

```markdown
# Project: {PROJECT_NAME}

## Quick Reference

- **Install**: `bun install`
- **Dev**: `bun run dev`
- **Build**: `bun run build`
- **Validate**: `bun run validate`

## Stack

{Detected stack components from package.json}

## Key Directories

| Path | Purpose |
|------|---------|
| `src/` | Source code |
| `app/` | Application routes (if TanStack/Next) |
| `components/` | UI components |
| `lib/` | Utilities and helpers |

## Code Style

- Formatter: Biome
- Naming: camelCase for functions, PascalCase for components
- Imports: Use path aliases (@/ prefix)

## Before Committing

Always run: `bun run validate`
```

Customize based on detected project structure.

### Step 5: Generate AGENTS.md

Create or update `AGENTS.md` in the project root with:

```markdown
# AGENTS.md (Root)

> **Purpose**: Universal guidance for AI agents. Keep this lightweight.
> **Hierarchy**: Nearest AGENTS.md wins. Check subdirectories for specific guidance.

## Project Overview

**Name**: {PROJECT_NAME}
**Type**: {PROJECT_TYPE}
**Stack**: {PRIMARY_STACK}

## Quick Start

\`\`\`bash
bun install      # Install dependencies
bun run dev      # Start development
bun run build    # Build for production
bun run validate # Lint & typecheck
\`\`\`

## Directory Map

| Path | Purpose | Has AGENTS.md |
|------|---------|---------------|
| `src/` | Source code | No |
| `app/` | Routes/pages | No |
| `components/` | UI components | No |
| `lib/` | Utilities | No |

> **Rule**: Always check for `AGENTS.md` in the directory you're working in.

## Universal Rules

### DO
- Read nearest `AGENTS.md` before making changes
- Run `bun run validate` before committing
- Follow existing patterns in the file you're editing

### DON'T
- Create new files without checking existing structure
- Add dependencies without checking package.json
- Ignore TypeScript/linter errors
- Over-engineer simple solutions

## Code Style

- **Formatting**: Biome
- **Naming**: camelCase for functions, PascalCase for components
```

### Step 6: Generate rubot.local.md

Read the template and customize it for the project:

```bash
# Read template
cat ~/.claude/plugins/rubot/templates/rubot.local.md.template
```

Create `.claude/rubot/rubot.local.md` with:

1. **Project metadata**: name, type, repository
2. **Environment**: bun/node versions, tooling
3. **Stack detection**: frameworks and libraries found
4. **Database tables**: if using Neon MCP, query actual tables
5. **Registered agents**: list of applicable agents
6. **Validation rules**: project-specific constraints

### Step 7: NeonDB Integration (Optional)

If the Neon MCP server is available:

```
mcp__neon__list_projects
mcp__neon__get_database_tables
```

Update `.claude/rubot/rubot.local.md` with discovered tables.

### Step 8: Verify Environment

Confirm the detected environment:

```bash
# Check tool versions
bun --version
node --version
wrangler --version 2>/dev/null || echo "wrangler not installed"

# Verify validate command exists
cat package.json | grep '"validate"'
```

### Step 9: Review Agent Applicability

Use AskUserQuestion to confirm agent configuration:

```
AskUserQuestion({
  questions: [{
    question: "Which of these agents should be INACTIVE for this project?",
    header: "Agents",
    options: [
      { label: "seo-master", description: "Skip if this is a dashboard/internal app (not public-facing)" },
      { label: "cloudflare", description: "Skip if not deploying to Cloudflare Workers" },
      { label: "chart-master", description: "Skip if project has no data visualizations" },
      { label: "All agents active", description: "Keep all agents active for this project" }
    ],
    multiSelect: true
  }]
})
```

Update `.claude/rubot/rubot.local.md` with inactive agents.

## Boilerplate Cleanup (Optional)

After initialization, ask the user if they want boilerplate cleanup:

```
AskUserQuestion({
  questions: [{
    question: "Would you like to clean up template boilerplate from this project?",
    header: "Cleanup",
    options: [
      { label: "Yes - full cleanup", description: "Rename auth routes, remove ASCII art, simplify README" },
      { label: "No - keep as is", description: "Leave all boilerplate in place" }
    ],
    multiSelect: false
  }]
})
```

If yes:
- Rename auth routes: sign-in → login, sign-up → register
- Remove ASCII art from index page
- Simplify README.md

## Completion

After initialization:

1. Confirm files were created:
   - `CLAUDE.md`
   - `AGENTS.md`
   - `.claude/rubot/rubot.local.md`

2. Highlight any missing configurations:
   - NeonDB connection (if applicable)
   - Wrangler setup (if deploying to Cloudflare)
   - Environment variables

3. Suggest next steps:
   ```
   Run `bun run validate` to verify the setup
   Then use `/rubot-plan` to start planning your first task
   ```
