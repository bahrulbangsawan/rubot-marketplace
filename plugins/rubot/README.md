# rubot

**Strict Multi-Agent Orchestration Governor v2.6.0**

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

## Registered Subagents (15 Total)

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
| seo-master | SEO, structured data, metadata (user-confirmed) | Independent |
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

- **Commands**: 9 slash commands for complete workflow orchestration
  - `/rubot` - Main orchestration entry point
  - `/rubot-init` - Workspace initialization
  - `/rubot-plan` - Execution planning
  - `/rubot-execute` - Plan execution
  - `/rubot-check` - Validation phase
  - `/rubot-commit` - Git commit phase
  - `/rubot-new-pr` - PR creation
  - `/rubot-push-pr` - PR update
  - `/rubot-new-repo` - Repository creation
- **Agent**: `rubot` - Proactive orchestrator that coordinates all subagents
- **Skills**: 11 domain-specific skill sets
  - `orchestration` - Domain classification and coordination knowledge
  - `env-check` - Environment validation
  - `rbac-auth` - Role-based access control implementation
  - `tanstack-router` - TanStack Router patterns
  - `tanstack-query` - TanStack Query patterns
  - `tanstack-form` - TanStack Form patterns
  - `tanstack-table` - TanStack Table patterns
  - `tanstack-db` - TanStack DB / local-first patterns
  - `url-state-management` - URL state with nuqs (tabs, filters, pagination, sorting)
- **Templates**: Markdown templates for generated documents
- **Scripts**: Python management utilities

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

## Scripts

### env_checker.sh

Environment validation script for modern web projects. Validates local tooling and stack readiness.

**Checks:**
- Critical tooling (bun, node, git)
- Optional tooling (wrangler, gh)
- Version information
- Wrangler authentication and configuration
- Configuration files (package.json, lockfiles, env files)
- Project stack detection (ElysiaJS, Drizzle, tRPC, Zod, Neon, TanStack)
- Validate script execution

**Usage:**
```bash
cd ~/.claude/plugins/rubot/scripts
./env_checker.sh                     # current directory
./env_checker.sh /path/to/project    # specific project
```

**Exit Codes:**
- `0` - All checks passed
- `1` - Critical failure (missing required tooling)
- `2` - Non-critical failures (missing optional components)

### agent_manager.py

Agent management utility for the rubot plugin.

**Commands:**
- `list` - List all agents in the folder
- `check` - Validate agent structure and required fields
- `add` - Add new agents to rubot plugin
- `sync` - Sync agents from source folder to rubot
- `validate` - Validate agent frontmatter and system prompts
- `report` - Generate agent capability report

**Usage:**
```bash
cd ~/.claude/plugins/rubot/scripts
python3 agent_manager.py list
python3 agent_manager.py check
python3 agent_manager.py sync              # syncs from ~/.claude/agents/ by default
python3 agent_manager.py sync --dry-run    # preview what would be synced
python3 agent_manager.py report
```

### css_validator.py

Validates project `index.css` against theme-master agent rules for shadcn/ui + Tailwind CSS theming.

**Validates:**
- Three-block structure (`:root`, `.dark`, `@theme inline`)
- All 33 required color tokens in light/dark modes
- OKLCH color format compliance
- Typography, shadow, and radius tokens
- `@theme inline` Tailwind mappings
- Correct block ordering

**Usage:**
```bash
cd ~/.claude/plugins/rubot/scripts
python3 css_validator.py /path/to/project
python3 css_validator.py .                          # current directory
python3 css_validator.py --file /path/to/custom.css .  # specific file
```

**Auto-detection locations:**
- `<project>/index.css`
- `<project>/src/index.css`
- `<project>/app/index.css`
- `<project>/styles/index.css`
- `<project>/src/styles/index.css`
- `<project>/src/app/index.css`

### responsive_audit.py

Static responsive audit for Tailwind CSS codebases. Enforces strict responsive standards and detects anti-patterns.

**Audit Scope:**
- Breakpoint compliance (only sm, md, lg, xl allowed)
- Breakpoint order violations (mobile-first enforcement)
- Hardcoded pixel values detection
- Layout anti-patterns (absolute/fixed without responsive, h-screen issues)
- Responsive coverage gaps (grid/flex without breakpoint variants)
- Flex/Grid pattern enforcement
- Inline style and CSS violations

**Usage:**
```bash
cd ~/.claude/plugins/rubot/scripts
python3 responsive_audit.py /path/to/project
python3 responsive_audit.py .                    # current directory
python3 responsive_audit.py . --json             # JSON output
python3 responsive_audit.py . --json --output report.json
```

**Exit Codes:**
- `0` - No violations
- `1` - Warnings only
- `2` - Critical violations

**Scanned file types:** `.tsx`, `.jsx`, `.ts`, `.js`, `.html`, `.mdx`

### seo_audit.py

Technical SEO audit script for websites. Performs comprehensive SEO analysis via HTTP requests.

**⚠️ User Confirmation Required**: Before running this audit, always confirm with the user that their project needs SEO. Dashboards, admin panels, and authenticated applications should NOT be indexed by search engines or AI crawlers for security reasons. For such projects, recommend implementing anti-indexing measures instead.

**Audit Scope:**
- Page accessibility and HTTP status
- Metadata validation (title, description, robots)
- Canonical link verification
- Open Graph and Twitter Card tags
- robots.txt analysis and syntax validation
- sitemap.xml validation and URL counting
- Redirect chain detection
- Noindex directive detection
- Blocked paths analysis

**Requirements:**
```bash
pip install requests beautifulsoup4
```

**Usage:**
```bash
cd ~/.claude/plugins/rubot/scripts
python3 seo_audit.py https://example.com
python3 seo_audit.py https://example.com --json
python3 seo_audit.py https://example.com --output report.json
```

**Exit Codes:**
- `0` - No critical failures
- `1` - Critical SEO issues detected
- `2` - Execution error

### registry_validator.py

Validates project `components.json` against the rubot registry template. Ensures all 20 mandatory shadcn-compatible registries are configured.

**Validates:**
- Presence of all mandatory registries from template
- Registry URL correctness
- Basic components.json structure (schema, style, tsx, tailwind, aliases)
- Recommended alias configuration

**Mandatory Registries (20 total):**
- @reui, @formcn, @abui, @better-upload, @assistant-ui, @billingsdk
- @coss, @diceui, @hextaui, @kibo-ui, @kokonutui, @lucide-animated
- @magicui, @manifest, @plate, @react-bits, @shadcn-editor, @tour
- @uitripled, @wandry-ui

**Usage:**
```bash
cd ~/.claude/plugins/rubot/scripts
python3 registry_validator.py /path/to/project
python3 registry_validator.py .                          # current directory
python3 registry_validator.py . --show-fix               # show fix snippet
python3 registry_validator.py . --json                   # JSON output
python3 registry_validator.py --file /path/to/custom.json .
```

**Exit Codes:**
- `0` - All registries present and correct
- `1` - Missing or misconfigured registries
