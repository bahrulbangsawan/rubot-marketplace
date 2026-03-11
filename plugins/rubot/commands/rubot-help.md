---
name: rubot-help
description: Display rubot plugin help and available commands
allowed-tools:
  - Read
  - Glob
---

You are in the HELP DISPLAY PHASE of the rubot orchestration workflow.

## Purpose

Display comprehensive help information about the rubot plugin, including:
- Available commands
- Workflow overview
- Agent descriptions
- Skill references
- Quick start guide

## Help Output

Display the following help information:

```
╔══════════════════════════════════════════════════════════════╗
║                         RUBOT HELP                            ║
║              Multi-Agent Orchestration Governor               ║
╚══════════════════════════════════════════════════════════════╝

OVERVIEW
────────────────────────────────────────────────────────────────
Rubot is a strict multi-agent orchestration system that enforces
mandatory consultation of specialist subagents before any task
is finalized. It produces consolidated analysis, cross-agent
risk matrices, unified execution plans, and validation checklists.

WORKFLOW
────────────────────────────────────────────────────────────────
The standard rubot workflow follows these phases:

  1. INIT      → /rubot-init     Initialize workspace
  2. PLAN      → /rubot-plan     Create execution plan
  3. EXECUTE   → /rubot-execute  Execute the plan
  4. CHECK     → /rubot-check    Run validations
  5. REVIEW    → /rubot-review   Code review and bug fix
  6. COMMIT    → /rubot-commit   Commit changes
  7. PR        → /rubot-new-pr   Create pull request
  8. UPDATE    → /rubot-push-pr  Push updates to PR

COMMANDS (29)
────────────────────────────────────────────────────────────────

  Core Workflow:
    /rubot-init       Initialize workspace (generates CLAUDE.md by default)
    /rubot-plan       Create structured execution plan
    /rubot-execute    Execute the approved plan
    /rubot-check      Run validation and verification
    /rubot-commit     Create git commit following project rules
    /rubot-review     Autonomous code review and bug fix

  Git & PR:
    /rubot-new-pr     Create new pull request
    /rubot-push-pr    Push updates to active PR
    /rubot-new-repo   Create new GitHub repository

  Testing & QA:
    /rubot-test-browser       E2E browser tests with agent-browser
    /rubot-wcag-audit         WCAG 2.2 accessibility audit
    /rubot-wcag-fix           Fix accessibility issues

  Security:
    /rubot-skills-security-check  ClawSec advisory scan and skill integrity check

  SEO - Audit:
    /rubot-seo-audit          Full SEO audit on a URL
    /rubot-seo-check-og       Validate Open Graph and Twitter Cards
    /rubot-seo-check-schema   Validate structured data (JSON-LD)
    /rubot-seo-check-vitals   Audit Core Web Vitals (LCP, INP, CLS)

  SEO - Generate:
    /rubot-seo-generate-robots    Generate robots.txt
    /rubot-seo-generate-sitemap   Generate sitemap.xml
    /rubot-seo-generate-favicons  Set up favicon structure

  Setup:
    /rubot-setup-agent-browser    Install agent-browser CLI
    /rubot-setup-cf-workers       Set up Cloudflare Workers deployment
    /rubot-setup-react-grab       Install react-grab for element inspection
    /rubot-setup-react-grab-mcp   Add MCP integration to react-grab
    /rubot-setup-localdb          Set up local PostgreSQL with Docker

  Workspace:
    /rubot-status     View workspace status
    /rubot-reset      Reset workspace to clean state
    /rubot-help       Display this help

  Orchestration:
    /rubot            Invoke full multi-agent orchestration

SPECIALIST AGENTS (15 Specialist Subagents)
────────────────────────────────────────────────────────────────

  Backend & Database:
    backend-master      ElysiaJS, tRPC, Zod APIs
    neon-master         PostgreSQL/NeonDB schemas

  Frontend & UI:
    shadcn-ui-designer  Component design and implementation
    dashboard-master    Dashboard layouts with sidebar
    chart-master        Apache ECharts visualizations
    theme-master        Tailwind/OKLCH theming
    responsive-master   Breakpoint compliance
    lazy-load-master    Loading states and skeletons

  Infrastructure:
    tanstack            Router, Query, Form, Table
    cloudflare          Workers deployment

  Quality & Debugging:
    debug-master        TypeScript/Biome error resolution
    hydration-solver    SSR/CSR mismatch diagnosis
    qa-tester           Browser testing with DevTools

  Orchestration:
    plan-supervisor     Plan status tracking

SKILLS
────────────────────────────────────────────────────────────────

  Stack Skills:
    drizzle-orm         Type-safe database operations
    elysiajs            High-performance HTTP servers
    biome               Fast linting and formatting
    cloudflare-workers  Edge computing deployment

  TanStack Skills:
    tanstack-router     File-based routing
    tanstack-query      Server state management
    tanstack-form       Type-safe forms
    tanstack-table      Headless data tables
    tanstack-db         Local-first reactive stores

  Feature Skills:
    url-state-management  URL-based state with nuqs
    rbac-auth             Role-based access control

WORKSPACE FILES
────────────────────────────────────────────────────────────────

  .claude/rubot/
    rubot.local.yaml         Project configuration
    plan.md                Execution plan
    validation-report.md   Validation results

QUICK START
────────────────────────────────────────────────────────────────

  New Project:
    1. /rubot-init          Set up workspace
    2. /rubot-plan          Create plan for your task
    3. /rubot-execute       Implement the plan
    4. /rubot-check         Verify implementation
    5. /rubot-review        Code review and bug fix
    6. /rubot-commit        Commit your changes
    7. /rubot-new-pr        Open pull request

  Existing PR:
    1. Make changes
    2. /rubot-check         Verify changes
    3. /rubot-review        Code review and bug fix
    4. /rubot-commit        Commit changes
    5. /rubot-push-pr       Push to PR

  Setup Tools:
    /rubot-setup-agent-browser    Install agent-browser CLI
    /rubot-setup-cf-workers       Set up Cloudflare Workers
    /rubot-setup-react-grab       Install react-grab
    /rubot-setup-react-grab-mcp   Add MCP to react-grab
    /rubot-setup-localdb          Set up local PostgreSQL

TIPS
────────────────────────────────────────────────────────────────

  • Always run /rubot-check before committing
  • Use /rubot-status to see current progress
  • The orchestrator enforces multi-agent review
  • Plan tasks are tracked automatically
  • Validation must pass before PR creation
  • Run /rubot-skills-security-check to scan for skill advisories

GETTING HELP
────────────────────────────────────────────────────────────────

  • /rubot-help             This help message
  • /rubot-status           Current workspace state
  • Ask about any agent     "What does chart-master do?"
  • Ask about any skill     "How do I use tanstack-router?"
```

## Dynamic Content

When displaying help, optionally check for:

1. **Current workspace state**:
   ```bash
   ls .claude/rubot/ 2>/dev/null
   ```
   If workspace exists, add context about current state.

2. **Available agents**:
   ```
   Glob for: plugins/rubot/agents/*.md
   ```
   List dynamically discovered agents.

3. **Available skills**:
   ```
   Glob for: plugins/rubot/skills/*/SKILL.md
   ```
   List dynamically discovered skills.

## Context-Aware Help

If user asks about specific topic, provide focused help:

### Command Help
```
/rubot-help init
```
→ Show detailed help for /rubot-init

### Agent Help
```
/rubot-help chart-master
```
→ Show chart-master agent description and usage

### Skill Help
```
/rubot-help drizzle-orm
```
→ Show drizzle-orm skill overview

### Workflow Help
```
/rubot-help workflow
```
→ Show detailed workflow explanation

## Implementation Notes

- Keep main help concise but comprehensive
- Use consistent formatting
- Group related items logically
- Provide quick reference for common tasks
- Include tips for effective usage
