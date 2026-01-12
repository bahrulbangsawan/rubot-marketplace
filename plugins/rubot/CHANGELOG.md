# Changelog

All notable changes to the rubot plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.9.0] - 2025-01-12

### Added

- **Comprehensive SEO Toolkit** - Full SEO implementation with Chrome DevTools MCP integration
  - 5 new SEO skills: `seo-audit`, `schema-markup`, `core-web-vitals`, `social-sharing`, `crawl-config`
  - 7 new SEO commands for auditing and generation
  - 3 new SEO hooks for automated validation

- **New SEO Skills (5)**:
  - `seo-audit` - Comprehensive SEO auditing methodology with Chrome DevTools integration
  - `schema-markup` - Schema.org JSON-LD implementation patterns for all content types
  - `core-web-vitals` - LCP, INP, CLS measurement and optimization strategies
  - `social-sharing` - Open Graph and Twitter Card meta tag implementation
  - `crawl-config` - robots.txt and sitemap.xml generation patterns

- **New SEO Commands (7)**:
  - `/seo-audit` - Full SEO audit with Chrome DevTools live inspection
  - `/seo-check-schema` - Validate structured data and JSON-LD markup
  - `/seo-check-og` - Check Open Graph and Twitter Card meta tags
  - `/seo-check-vitals` - Audit Core Web Vitals with performance tracing
  - `/seo-generate-robots` - Generate robots.txt with environment awareness
  - `/seo-generate-sitemap` - Generate sitemap.xml from project routes
  - `/seo-generate-favicons` - Set up complete favicon structure and meta tags

- **New SEO Hooks (3)**:
  - `seo-meta-check` (PostToolUse/Write) - Validates SEO meta tags after page/route creation
  - `seo-image-check` (PostToolUse/Write) - Checks image alt text and dimensions for accessibility
  - `seo-build-check` (PreToolUse/Bash) - Pre-deployment SEO checklist reminder

- **Chrome DevTools MCP Integration** for seo-master agent:
  - Live page navigation and snapshot capture
  - JavaScript evaluation for SEO data extraction
  - Performance tracing for Core Web Vitals measurement
  - Network request analysis
  - Console message monitoring

### Changed

- Updated plugin version to 2.9.0
- Updated command count from 13 to 20
- Updated hook count from 5 to 8
- Updated skill count from 13 to 18
- Enhanced seo-master agent with Chrome DevTools MCP tools
- Added comprehensive SEO keywords to plugin.json

## [2.8.0] - 2025-01-11

### Added

- **New Commands (4)**:
  - `/rubot-status` - View current rubot workspace status and workflow progress
  - `/rubot-reset` - Reset rubot workspace to clean state
  - `/rubot-help` - Display rubot plugin help and available commands
  - `/rubot-review` - Autonomous code review, codebase analysis, and bug fix workflow

- **New Skills (4)**:
  - `drizzle-orm` - Type-safe database operations with Drizzle ORM
  - `elysiajs` - High-performance HTTP servers with ElysiaJS
  - `biome` - Fast linting and formatting with Biome
  - `cloudflare-workers` - Edge computing with Cloudflare Workers

### Changed

- Updated plugin version to 2.8.0
- Updated command count from 9 to 13
- Updated skill count from 9 to 13
- Enhanced marketplace.json with comprehensive component listings

## [2.7.0] - 2025-01-11

### Removed

- **All scripts from `scripts/` directory** - Scripts have been removed in favor of inline validation instructions
  - Removed `env_checker.sh` - Environment checks now inline in commands
  - Removed `css_validator.py` - CSS validation now handled by theme-master agent
  - Removed `responsive_audit.py` - Responsive audits now handled by responsive-master agent
  - Removed `seo_audit.py` - SEO audits now handled by seo-master agent
  - Removed `registry_validator.py` - Registry validation now inline in rubot-check
  - Removed `agent_manager.py` - Agent management now manual
  - Removed `generate_agents_md.py` - Workspace generation now inline in rubot-init

### Changed

- **`/rubot-check`** - Rewritten to use inline bash commands and agent invocations instead of external scripts
- **`/rubot-init`** - Rewritten with inline file generation instructions instead of Python script
- **`env-check` skill** - Updated to provide inline bash commands for environment validation
- Updated README.md to remove scripts documentation section
- Updated marketplace.json to remove scripts component

## [2.6.0] - 2024-12-31

### Added

- **New Agent: `lazy-load-master`** - Code splitting, lazy loading, dynamic imports specialist
  - Handles performance optimization via code splitting
  - Dynamic import patterns for routes and components
  - Bundle size optimization strategies

### Fixed

- **Critical #1: Agent count mismatch** - Updated rubot.md command from 13 to 15 agents
- **Critical #2: Circular dependency** - Removed "invoke shadcn-ui-designer" from dashboard-master
  - Sub-agents now correctly understand they are INVOKED BY parent, not invoking parent
- **Critical #3: Non-existent agent reference** - Replaced "auth-specialist" with "backend-master" in tanstack.md
- **Critical #4: Framework contradiction** - Fixed theme-master example from Next.js to TanStack Start
- **Backend framework standardization** - Changed all Hono references to ElysiaJS in tanstack.md

### Changed

- Updated plugin version to 2.6.0
- Updated agent count to 15 specialist subagents
- Added `lazy-load`, `code-splitting`, `dynamic-imports` keywords to plugin.json
- Generated AUDIT-REPORT.md with comprehensive system consistency analysis

## [2.5.1] - 2024-12-31

### Added

- **New Script: `registry_validator.py`** - Validates components.json against registry template
  - Scans project's components.json file
  - Compares against templates/components.json.template
  - Validates all 20 mandatory registries are present
  - Checks registry URL correctness
  - Validates basic structure (schema, style, tsx, tailwind, aliases)
  - Supports --show-fix flag to display fix snippet
  - Supports --json flag for JSON output

- **Integrated registry_validator.py into `/rubot-check`** workflow
  - Added as Step 4 in validation process
  - Updated validation-report.md.template with Registry Validation section
  - Renumbered remaining steps (5-11)

## [2.5.0] - 2024-12-31

### Added

- **Frontend Ownership Rule** - shadcn-ui-designer is now the SINGLE OWNER of all frontend/UI work
  - Other agents are NOT allowed to craft frontend components, layouts, or UI logic
  - This is a global, non-negotiable rule across all rubot orchestrations

- **UI Team Structure** - Established sub-agent hierarchy under shadcn-ui-designer:
  - `responsive-master` - Sub-agent for responsive layout validation
  - `theme-master` - Sub-agent for OKLCH theming and CSS variables
  - `dashboard-master` - Sub-agent for dashboard/admin architecture
  - `chart-master` - Sub-agent for data visualization

- **Mandatory Registries** - 20 official shadcn-compatible registries enforced:
  - @reui, @formcn, @abui, @better-upload, @assistant-ui, @billingsdk
  - @coss, @diceui, @hextaui, @kibo-ui, @kokonutui, @lucide-animated
  - @magicui, @manifest, @plate, @react-bits, @shadcn-editor, @tour
  - @uitripled, @wandry-ui

### Changed

- Updated plugin version to 2.5.0
- Added `shadcn-registries`, `frontend-ownership`, `ui-team` keywords to plugin.json
- Updated responsive-master, theme-master, dashboard-master, chart-master as sub-agents
- Added MCP & Registry Enforcement section to shadcn-ui-designer

## [2.4.0] - 2024-12-31

### Added

- **New Agent: `plan-supervisor`** - Single-purpose supervisory agent for plan.md maintenance
  - Monitors all agent outputs and code changes
  - Updates plan.md with accurate completion status
  - Checks off tasks only after explicit verification
  - Does NOT implement features, modify code, or create tasks
  - Operates with minimal model (haiku) for efficiency
  - Enforces agent notification contract for task completion

### Changed

- Updated plugin version to 2.4.0
- Increased subagent count from 13 to 14
- Added `plan-supervisor`, `plan-tracking`, `task-completion` keywords to plugin.json

## [2.3.0] - 2024-12-31

### Added

- **New Skill: `url-state-management`** - Comprehensive URL state management with nuqs
  - TanStack Start/Router integration patterns
  - Built-in and custom parser documentation
  - Tabs & navigation patterns with history navigation
  - Filters & search with debounce, multi-select, range filters
  - Pagination with page size and reset on filter change
  - Sorting with select dropdowns and sortable table headers
  - View mode toggles (grid/list/table)
  - SSR & hydration safety patterns with Suspense boundaries
  - Integration with TanStack Router validateSearch

### Changed

- Updated plugin version to 2.3.0
- Added `nuqs`, `url-state-management`, `search-params`, `query-params` keywords to plugin.json
- Updated README skills section to list all 11 domain-specific skill sets

## [2.2.0] - 2024-12-31

### Added

- **New Command: `/rubot-new-repo`** - Create a new GitHub repository with initial commit and push using `gh` CLI
  - Verifies GitHub CLI authentication
  - Gathers repository information (name, visibility, description)
  - Initializes git repository if needed
  - Creates proper `.gitignore` for Node.js projects
  - Checks for sensitive files before committing
  - Creates initial commit with conventional commit message
  - Creates GitHub repository via `gh repo create`
  - Pushes to remote with `main` branch
  - Opens repository in browser after creation

- **New Templates** for workflow documents:
  - `README.md.template` - Project README template for boilerplate cleanup during `/rubot-init`
  - `plan.md.template` - Execution plan template with task checklists for `/rubot-plan`
  - `validation-report.md.template` - Validation results report template for `/rubot-check`

- **Plan Archival System** - Completed plans are automatically renamed with timestamp
  - Format: `YYYY-MM-DDTHH:mm:ss-plan.md`
  - Preserves plan history for reference
  - Triggered when all checkboxes in plan are marked complete

- **Boilerplate Cleanup** in `/rubot-init`:
  - Scan for ASCII art, demo content, placeholder text
  - Route renaming: `/sign-in` → `/login`, `/sign-up` → `/register`
  - Component cleanup (navbar, header, footer simplification)
  - Index page transformation to minimal text-only
  - README.md rewrite with project-specific content

### Changed

- Updated command count from 8 to 9 slash commands
- Renamed `indexcss-example.css` to `index.css.template` for consistency
- Updated all command files to reference new templates
- Enhanced `/rubot-execute` with plan completion detection and archival logic
- Enhanced `/rubot-check` with template-based report generation
- Enhanced `/rubot-plan` with template-based plan generation

### Fixed

- **Agent count mismatch** - Corrected plugin.json from "14" to "13 specialist subagents"
- **Wrong MCP tool names** - Fixed `mcp__context7__get-library-docs` → `mcp__context7__query-docs` in:
  - `agents/shadcn-ui-designer.md`
  - `agents/tanstack.md`
- **Non-existent MCP reference** - Replaced `mcp__web-search-prime__webSearchPrime` with `mcp__exa__web_search_exa`
- **Missing file reference** - Fixed `@tablecn.md` reference in shadcn-ui-designer.md
- **Misplaced file** - Moved CSS example file from `agents/` to `templates/`

## [2.1.0] - 2024-12-30

### Added

- Environment checker script (`env_checker.sh`)
- CSS validator script (`css_validator.py`)
- Responsive audit script (`responsive_audit.py`)
- SEO audit script (`seo_audit.py`)
- Agent manager script (`agent_manager.py`)

### Changed

- Enhanced validation workflow with multiple audit scripts
- Added script documentation to README

## [2.0.0] - 2024-12-29

### Added

- Complete workflow command set:
  - `/rubot-init` - Workspace initialization
  - `/rubot-plan` - Execution planning
  - `/rubot-execute` - Plan execution
  - `/rubot-check` - Validation phase
  - `/rubot-commit` - Git commit phase
  - `/rubot-new-pr` - PR creation
  - `/rubot-push-pr` - PR update
- Orchestration skill with domain classification
- Environment check skill
- Workspace configuration template (`rubot.local.md.template`)

### Changed

- Restructured as complete workflow orchestration system
- Added 13 specialist subagents for domain expertise

## [1.0.0] - 2024-12-28

### Added

- Initial release of rubot plugin
- Main `/rubot` command for multi-agent orchestration
- Basic agent coordination system
