# Changelog

All notable changes to the rubot plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.13.0] - 2026-03-11

### Added

- **New Commands (11)**:
  - `/rubot-setup-cf-workers` - Set up Cloudflare Workers deployment — detects framework, installs wrangler, generates config
  - `/rubot-setup-react-grab` - Install react-grab for AI-assisted element inspection in React apps
  - `/rubot-setup-react-grab-mcp` - Add MCP server integration to react-grab for Claude Code
  - `/rubot-setup-localdb` - Set up local PostgreSQL Docker database with Drizzle ORM integration
  - `/rubot-test-browser` - Run E2E browser tests using agent-browser and dogfood exploratory testing
  - `/rubot-responsive-audit` - Audit and fix responsive layout issues across all breakpoints (xs/sm/md/lg)
  - `/rubot-wcag-audit` - Run WCAG 2.2 Level AA accessibility audit on a URL or codebase
  - `/rubot-wcag-fix` - Fix WCAG 2.2 accessibility issues across the codebase
  - `/rubot-global-layout` - Build a persistent global layout with shared Navbar and Footer wrapping all routes
  - `/rubot-multilanguage` - Implement full multilingual support with language switcher, localized routing, and bilingual copywriting
  - `/rubot-skills-security-check` - Run ClawSec security advisory scan, skill integrity verification, and guarded install checks

- **New Skills (7)**:
  - `responsive-design` - Mobile-first responsive layout design system with strict relative unit enforcement
  - `cf-workers-setup` - Cloudflare Workers deployment setup and configuration
  - `global-layout` - Persistent global layout with shared Navbar and Footer patterns
  - `react-grab` - AI-assisted element inspection for React apps
  - `wcag-audit` - WCAG 2.2 Level AA accessibility auditing
  - `wcag-fix` - Accessible component patterns and WCAG 2.2 fixes
  - `multilanguage` - Full i18n implementation with localized routing, translation system, and language switcher

- **Skill Evaluations** - Added `evals/` test directories to 18 existing skills for quality verification

- **Skill References** - Added `references/` documentation to `cloudflare-workers` and `schema-markup` skills

- **ClawSec Suite Integration** - Security advisory monitoring, skill integrity verification, and guarded install checks

### Changed

- Updated plugin version to 2.13.0
- Updated command count from 21 to 32
- Updated skill count from 19 to 26
- Workspace configuration template migrated from `rubot.local.md.template` to `rubot.local.yaml.template`
- Added Setup, Testing, Responsive/Layout, Accessibility, i18n, and Security command sections to README

## [2.12.0] - 2026-03-11

### Improved

- **`/rubot-init` command** - Major overhaul of workspace initialization
  - Added AskUserQuestion file selection: user can choose AGENTS.md only, CLAUDE.md only, or both
  - Added subfolder argument support: `/rubot-init src/` regenerates only that folder's AGENTS.md
  - Added merge logic for existing `rubot.local.yaml` — preserves user customizations (auth, scenarios, rules)
  - Added agent-browser installation check during environment verification
  - Added `qa-tester` to agent applicability toggle
  - Completion summary now reflects user's file selection choice

- **`rootAGENTS.md.template`** - Config-driven root AGENTS.md generator
  - Added config header referencing `rubot.local.yaml` as source of truth and `/rubot-init` as generator
  - Added `{GIT_REMOTE}` placeholder for repository URL
  - Added `rubot.local.yaml` to Key Files table
  - Added "Browser Testing" section with agent-browser commands, core workflow, and `{AGENT_BROWSER_SCENARIOS}` placeholder
  - Added "Rubot Commands" section with table of all key `/rubot-*` commands
  - Added "Update & Regenerate" section with self-documenting commands
  - Added footer notes pointing back to config source

- **`subAGENTS.md.template`** - Config-driven subfolder AGENTS.md generator
  - Added config header referencing `rubot.local.yaml` and `/rubot-init` generator
  - Added "Browser Testing" section scoped to subfolder route (`{FOLDER_ROUTE}`)
  - Added "Update & Regenerate" section with subfolder-specific regeneration (`/rubot-init {FOLDER_PATH}`)
  - Added browser test and update commands to Quick Reference table

- **Generated CLAUDE.md** - Now includes Browser Testing section and Rubot Commands table

### Changed

- Updated plugin version to 2.12.0
- Updated template count from 6 to 8 (added rootAGENTS.md.template, subAGENTS.md.template)

## [2.11.0] - 2026-03-11

### Added

- **New Command: `/rubot-setup-agent-browser`** - Install and configure agent-browser CLI for headless browser automation and AI agent testing
  - Supports global (npm), Homebrew (macOS), project-level, and npx installation methods
  - Handles Chromium download and Linux system dependency installation
  - Optional CLAUDE.md configuration for browser automation instructions
  - Custom browser executable support via flag or environment variable

- **New Skill: `agent-browser`** - Comprehensive CLI reference for headless browser automation
  - Full command reference: navigation, snapshots, screenshots, element interaction
  - Performance tracing and profiling commands
  - Responsive testing with viewport and device emulation
  - Console, error, and network request inspection
  - Dialog handling and offline mode simulation
  - Serverless usage patterns

### Changed

- Updated plugin version to 2.11.0
- Updated command count from 20 to 21
- Updated skill count from 18 to 19

## [2.10.0] - 2026-03-11

### Fixed

- **Agent count inconsistency** - Corrected all references from "15 agents" to "16 agents" across orchestration skill, rubot command, and rubot agent files
- **Missing `lazy-load-master` references** - Added lazy-load-master to rubot agent's registered subagents table and orchestration skill's agent capability matrix
- **Missing version fields** - Added `version: 1.0.0` and `agents:` fields to 4 skills: `drizzle-orm`, `elysiajs`, `biome`, `cloudflare-workers`
- **Missing version and agents fields** - Added `version: 1.0.0` and `agents:` fields to 5 SEO skills: `schema-markup`, `core-web-vitals`, `social-sharing`, `crawl-config`, `rubot-seo-audit`

### Improved

- **Skill descriptions** - Enhanced all 9 skill descriptions with broader keyword coverage for better triggering accuracy (e.g., "page is slow" now triggers `core-web-vitals`, "link preview not working" triggers `social-sharing`)
- **Command descriptions** - Expanded all 9 command descriptions with use-case context and trigger phrases for more reliable invocation
- **Orchestration skill description** - Added multi-domain task and agent sequencing trigger phrases
- **Orchestration skill version** - Bumped from v2.6.0 to v2.7.0 to reflect lazy-load-master addition

### Changed

- Marketplace version bumped to 2.10.0

## [2.9.0] - 2025-01-12

### Added

- **Comprehensive SEO Toolkit** - Full SEO implementation with browser automation
  - 5 new SEO skills: `rubot-seo-audit`, `schema-markup`, `core-web-vitals`, `social-sharing`, `crawl-config`
  - 7 new SEO commands for auditing and generation
  - 3 new SEO hooks for automated validation

- **New SEO Skills (5)**:
  - `rubot-seo-audit` - Comprehensive SEO auditing methodology
  - `schema-markup` - Schema.org JSON-LD implementation patterns for all content types
  - `core-web-vitals` - LCP, INP, CLS measurement and optimization strategies
  - `social-sharing` - Open Graph and Twitter Card meta tag implementation
  - `crawl-config` - robots.txt and sitemap.xml generation patterns

- **New SEO Commands (7)**:
  - `/rubot-seo-audit` - Full SEO audit
  - `/rubot-seo-check-schema` - Validate structured data and JSON-LD markup
  - `/rubot-seo-check-og` - Check Open Graph and Twitter Card meta tags
  - `/rubot-seo-check-vitals` - Audit Core Web Vitals with performance tracing
  - `/rubot-seo-generate-robots` - Generate robots.txt with environment awareness
  - `/rubot-seo-generate-sitemap` - Generate sitemap.xml from project routes
  - `/rubot-seo-generate-favicons` - Set up complete favicon structure and meta tags

- **New SEO Hooks (3)**:
  - `seo-meta-check` (PostToolUse/Write) - Validates SEO meta tags after page/route creation
  - `seo-image-check` (PostToolUse/Write) - Checks image alt text and dimensions for accessibility
  - `seo-build-check` (PreToolUse/Bash) - Pre-deployment SEO checklist reminder

- **agent-browser Integration** for browser automation:
  - Live page navigation and snapshot capture
  - JavaScript evaluation for SEO data extraction
  - Performance tracing and profiling
  - Network request tracking
  - Console message and error monitoring

### Changed

- Updated plugin version to 2.9.0
- Updated command count from 13 to 20
- Updated hook count from 5 to 8
- Updated skill count from 13 to 18
- Enhanced seo-master agent with agent-browser CLI integration
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
- Workspace configuration template (`rubot.local.yaml.template`)

### Changed

- Restructured as complete workflow orchestration system
- Added 13 specialist subagents for domain expertise

## [1.0.0] - 2024-12-28

### Added

- Initial release of rubot plugin
- Main `/rubot` command for multi-agent orchestration
- Basic agent coordination system
