# rubot

**Strict Multi-Agent Orchestration Governor v2.9.0**

`rubot` enforces deterministic, mandatory multi-agent consultation for all significant tasks in complex Claude Code projects. It acts as a project manager ensuring no decision is made without consensus from all relevant domain experts.

## Problem Solved

In multi-domain projects (backend, database, SSR, hydration, performance, responsiveness, QA, SEO, theming), decisions and implementations are often made without enforcing input from all required expert agents. This leads to:

- Missed root causes
- Conflicting implementations
- Undetected regressions
- Architectural drift
- Inconsistent theming
- Poor SEO implementation

## Solution

`rubot` acts as a **strict execution governor** that enforces deterministic, mandatory multi-agent orchestration before any solution is accepted.

## Registered Subagents (16 Total)

| Agent | Domain | Role |
|-------|--------|------|
| backend-master | ElysiaJS, tRPC, Drizzle, Zod | Independent |
| chart-master | Apache ECharts, data visualization | **Sub-agent of shadcn-ui-designer** |
| cloudflare | Workers, R2, D1, Wrangler, deployment | Independent |
| dashboard-master | Dashboard architecture, sidebar-first design | **Sub-agent of shadcn-ui-designer** |
| debug-master | TypeScript debugging, Biome, validation | Independent (always required) |
| hydration-solver | React SSR/hydration issues | Independent |
| lazy-load-master | Code splitting, lazy loading, dynamic imports | Independent |
| neon-master | PostgreSQL, NeonDB, schema design | Independent |
| plan-supervisor | Plan.md tracking, task completion verification | Independent (always required) |
| qa-tester | Playwright, Chrome DevTools testing | Independent (always required) |
| responsive-master | Tailwind responsive layouts | **Sub-agent of shadcn-ui-designer** |
| seo-master | SEO, Chrome DevTools auditing, Core Web Vitals | Independent (user-confirmed) |
| **shadcn-ui-designer** | **UI components, design system (FRONTEND OWNER)** | **Team Lead** |
| tanstack | TanStack Start/Router/Query full-stack | Independent |
| theme-master | Tailwind themes, OKLCH colors | **Sub-agent of shadcn-ui-designer** |

### Frontend Ownership Rule (GLOBAL)

**shadcn-ui-designer is the SINGLE OWNER of all frontend/UI implementation.**

- ALL frontend/UI tasks MUST be delegated to shadcn-ui-designer
- Other agents are NOT allowed to craft frontend components, layouts, or UI logic
- Sub-agents (responsive-master, theme-master, dashboard-master, chart-master) operate ONLY under shadcn-ui-designer authority

## Usage

### Slash Commands

| Command | Description |
|---------|-------------|
| `/rubot` | Invoke the main orchestration governor for multi-domain tasks |
| `/rubot-init` | Initialize or sync the rubot workspace configuration |
| `/rubot-plan` | Generate a structured execution plan with agent orchestration |
| `/rubot-execute` | Execute the approved plan from the workspace |
| `/rubot-check` | Run validation and invoke verification agents |
| `/rubot-commit` | Create a git commit following project rules |
| `/rubot-new-pr` | Create a new pull request using GitHub CLI |
| `/rubot-push-pr` | Push commits to active PR and re-run validations |
| `/rubot-new-repo` | Create a new GitHub repository with initial commit |
| `/rubot-status` | View current rubot workspace status and workflow progress |
| `/rubot-reset` | Reset rubot workspace to clean state |
| `/rubot-help` | Display rubot plugin help and available commands |
| `/rubot-review` | Autonomous code review, codebase analysis, and bug fix workflow |

### SEO Commands

| Command | Description |
|---------|-------------|
| `/seo-audit` | Comprehensive SEO audit with Chrome DevTools live inspection |
| `/seo-check-schema` | Validate structured data and JSON-LD schema markup |
| `/seo-check-og` | Check Open Graph and Twitter Card meta tags |
| `/seo-check-vitals` | Audit Core Web Vitals (LCP, INP, CLS) |
| `/seo-generate-robots` | Generate robots.txt with proper directives |
| `/seo-generate-sitemap` | Generate sitemap.xml from project routes |
| `/seo-generate-favicons` | Set up complete favicon structure and meta tags |

### Workflow

The recommended workflow is:

1. **`/rubot-init`** - Initialize workspace (run once per project, includes optional boilerplate cleanup)
2. **`/rubot-plan <task>`** - Analyze task and generate execution plan
3. **`/rubot-execute`** - Execute the approved plan
4. **`/rubot-check`** - Validate all changes pass checks
5. **`/rubot-commit`** - Commit the changes
6. **`/rubot-new-pr`** or **`/rubot-push-pr`** - Create or update PR

### Boilerplate Cleanup (Optional)

During `/rubot-init`, you can optionally clean up template boilerplate:

| Action | Description |
|--------|-------------|
| Scan for boilerplate | Detects ASCII art, demo content, placeholder text |
| Route renaming | `/sign-in` → `/login`, `/sign-up` → `/register` |
| Component cleanup | Removes/simplifies navbar, header, footer templates |
| Index page | Transforms to minimal text-only page |
| README rewrite | Generates project-specific README.md |

This is useful when starting from a template or boilerplate project.

### Explicit Invocation

```
/rubot Design and implement a user authentication system with database schema
```

### Proactive Triggering

The rubot agent automatically triggers on complex multi-domain tasks, ensuring all relevant agents are consulted.

## Output Contract

Every rubot orchestration produces:

1. **Consolidated Root-Cause Analysis** - Unified understanding from all agents
2. **Cross-Agent Risk & Constraint Matrix** - Potential conflicts and dependencies
3. **Final Unified Execution Plan** - Step-by-step implementation with agent assignments
4. **Validation & Verification Checklist** - What to verify after implementation

## Domain Classification

| Task Type | Primary Agents | Secondary Agents |
|-----------|----------------|------------------|
| Backend API/Logic | backend-master | tanstack, debug-master |
| Database/Schema | neon-master | backend-master, debug-master |
| SSR/Hydration | hydration-solver | tanstack, debug-master |
| Charts/Visualization | chart-master | shadcn-ui-designer, responsive-master |
| Dashboard/Admin | dashboard-master | shadcn-ui-designer, chart-master |
| SEO/Metadata | seo-master (user-confirmed) | tanstack, debug-master |
| Theming/Colors | theme-master | shadcn-ui-designer |
| Deployment | cloudflare | tanstack, debug-master |
| UI Components | shadcn-ui-designer | responsive-master, theme-master |
| Testing/QA | qa-tester | debug-master |
| Package Installation | cloudflare | debug-master |

## Enforcement Rules

- No direct implementation without agent consensus
- No partial or speculative solutions
- No silent assumptions or skipped validation
- `rubot` is the single authoritative coordinator
- Conflicts are escalated to user for resolution
- `debug-master` and `qa-tester` are ALWAYS required as final verification
- **SEO requires user confirmation**: Before running SEO audits or implementing SEO features, always ask if the project needs public discoverability. Dashboards, admin panels, and authenticated apps should NOT be indexed for security reasons.

## Components

- **Commands**: 20 slash commands for complete workflow orchestration
  - `/rubot` - Main orchestration entry point
  - `/rubot-init` - Workspace initialization
  - `/rubot-plan` - Execution planning
  - `/rubot-execute` - Plan execution
  - `/rubot-check` - Validation phase
  - `/rubot-commit` - Git commit phase
  - `/rubot-new-pr` - PR creation
  - `/rubot-push-pr` - PR update
  - `/rubot-new-repo` - Repository creation
  - `/rubot-status` - Workspace status
  - `/rubot-reset` - Workspace reset
  - `/rubot-help` - Help documentation
  - `/rubot-review` - Code review workflow
  - `/seo-audit` - SEO audit
  - `/seo-check-schema` - Schema validation
  - `/seo-check-og` - Open Graph validation
  - `/seo-check-vitals` - Core Web Vitals
  - `/seo-generate-robots` - robots.txt generation
  - `/seo-generate-sitemap` - sitemap.xml generation
  - `/seo-generate-favicons` - Favicon setup
- **Hooks**: 8 lifecycle hooks
  - `pre-commit-validation` - Blocks commits without validation
  - `dangerous-command-guard` - Guards destructive commands
  - `seo-build-check` - Pre-deployment SEO reminder
  - `auto-plan-update` - Suggests plan updates after edits
  - `seo-meta-check` - Validates SEO meta after page creation
  - `seo-image-check` - Checks image alt text and dimensions
  - `session-context-loader` - Loads workspace at session start
  - `validation-reminder` - Reminds about uncommitted changes
- **Agent**: `rubot` - Proactive orchestrator that coordinates all 16 subagents
- **Skills**: 18 domain-specific skill sets
  - `orchestration` - Domain classification and coordination knowledge
  - `env-check` - Environment validation
  - `rbac-auth` - Role-based access control implementation
  - `tanstack-router` - TanStack Router patterns
  - `tanstack-query` - TanStack Query patterns
  - `tanstack-form` - TanStack Form patterns
  - `tanstack-table` - TanStack Table patterns
  - `tanstack-db` - TanStack DB / local-first patterns
  - `url-state-management` - URL state with nuqs
  - `drizzle-orm` - Type-safe database operations
  - `elysiajs` - High-performance HTTP servers
  - `biome` - Fast linting and formatting
  - `cloudflare-workers` - Edge computing
  - `seo-audit` - Comprehensive SEO auditing with Chrome DevTools
  - `schema-markup` - Schema.org JSON-LD implementation
  - `core-web-vitals` - LCP, INP, CLS optimization
  - `social-sharing` - Open Graph and Twitter Cards
  - `crawl-config` - robots.txt and sitemap.xml
- **Templates**: Markdown templates for generated documents

## Templates

Located in `~/.claude/plugins/rubot/templates/`:

| Template | Purpose | Used By |
|----------|---------|---------|
| `rubot.local.md.template` | Workspace configuration | `/rubot-init` |
| `README.md.template` | Project README for boilerplate cleanup | `/rubot-init` |
| `plan.md.template` | Execution plan with checklists | `/rubot-plan` |
| `validation-report.md.template` | Validation results report | `/rubot-check` |
| `index.css.template` | CSS theme reference | `theme-master` |

### Plan Lifecycle & Archival

Plans follow this lifecycle:
1. **Created** - Plan generated with status "Pending Approval"
2. **Approved** - User marks approval checkbox
3. **In Progress** - During `/rubot-execute`
4. **Completed** - All checkboxes marked

When a plan is completed, `/rubot-execute` archives it by renaming:
```
.claude/rubot/plan.md → .claude/rubot/2024-12-31T14:30:45-plan.md
```

This preserves plan history for reference.

## Workspace Structure

When initialized, rubot creates:

```
.claude/rubot/
  rubot.local.md              # Project configuration
  plan.md                     # Current execution plan
  validation-report.md        # Latest validation results
  [timestamp]-plan.md         # Archived completed plans
```

## Installation

The plugin auto-discovers when placed in `~/.claude/plugins/rubot/`.
