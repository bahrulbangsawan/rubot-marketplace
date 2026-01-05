---
name: Multi-Agent Orchestration
description: |
  Provides domain classification, agent coordination patterns, and conflict resolution knowledge for the rubot orchestration governor. Use when coordinating multiple specialist agents, classifying tasks by domain, resolving inter-agent conflicts, or producing unified execution plans from multi-agent consultations.
version: 2.6.0
agents:
  - rubot
---

# Multi-Agent Orchestration Knowledge

This skill provides the knowledge base for coordinating the 15 registered specialist subagents in a deterministic, mandatory orchestration workflow.

## Documentation Verification (MANDATORY)

Before orchestrating any multi-agent workflow:

1. **Use Context7 MCP** to verify current library APIs:
   - `mcp__context7__resolve-library-id` with libraryName for any technology in the task
   - `mcp__context7__query-docs` for specific patterns agents will need

2. **Use Exa MCP** for latest integration patterns:
   - `mcp__exa__web_search_exa` for "multi-agent orchestration patterns 2024"
   - `mcp__exa__get_code_context_exa` for specific technology combinations

3. **Use AskUserQuestion** for orchestration clarification:
   - Priority between conflicting agent recommendations
   - Which features are critical vs nice-to-have
   - Acceptable trade-offs (performance vs UX, etc.)
   - SEO requirements confirmation (dashboards/admin panels should NOT be indexed)

## Domain Classification Reference

### Primary Domain Indicators

| Keyword/Pattern | Primary Domain | Required Agent(s) |
|-----------------|----------------|-------------------|
| API, endpoint, route, tRPC, procedure | Backend | backend-master |
| chart, graph, visualization, ECharts | Visualization | chart-master |
| deploy, Cloudflare, Workers, R2, D1, Wrangler | Deployment | cloudflare |
| dashboard, admin, analytics, sidebar | Dashboard | dashboard-master |
| error, bug, type error, validation, lint, Biome | Debugging | debug-master |
| SSR, hydration, server-render, streaming | Hydration | hydration-solver |
| database, schema, table, migration, query, PostgreSQL, Neon | Database | neon-master |
| test, QA, Playwright, DevTools | Testing | qa-tester |
| responsive, mobile, breakpoint, layout | Responsiveness | responsive-master |
| SEO, metadata, schema markup, robots.txt, sitemap | SEO | seo-master (user-confirmed) |
| UI, component, shadcn, button, dialog | UI | shadcn-ui-designer |
| useForm, form field, form validation, field array, form submit | Forms | tanstack, shadcn-ui-designer |
| TanStack, router, full-stack, loader, navigation, URL state, search params, route guard, nuqs | Full-stack | tanstack |
| useQuery, useMutation, queryClient, invalidate, cache, stale, refetch, prefetch | Data Fetching | tanstack |
| optimistic update, mutation, server state, query key, infinite scroll | Server State | tanstack, backend-master |
| theme, color, OKLCH, dark mode, CSS variables | Theming | theme-master |
| npm, bun, install, package, wrangler | Package Installation | cloudflare, debug-master |
| lazy load, code splitting, dynamic import, bundle size, React.lazy, Suspense | Performance | lazy-load-master |
| RBAC, permission, role, authorization, access control | Authorization | backend-master, neon-master |
| auth, authentication, login, session, JWT | Authentication | backend-master, tanstack |
| data table, DataTable, useReactTable, column, row model, sorting, filtering, pagination | Data Tables | tanstack, shadcn-ui-designer |
| virtual scroll, virtualized table, large dataset, 1000+ rows | Virtual Tables | tanstack, debug-master |
| server-side table, manual pagination, manual sorting, manual filtering | Server Tables | tanstack, backend-master, neon-master |
| collection, createCollection, useLiveQuery, local-first, reactive store | Client Store | tanstack |
| Electric, ElectricSQL, shape, real-time sync, Postgres sync | Electric Sync | tanstack, neon-master |
| PowerSync, offline-first, SQLite, local persistence | Offline Sync | tanstack, backend-master |
| optimistic mutation, transaction, isPersisted, rollback | Client Mutations | tanstack, shadcn-ui-designer |

### Multi-Domain Task Patterns

These task patterns ALWAYS require multiple agents:

| Task Pattern | Required Agents |
|--------------|-----------------|
| "Add feature with database" | neon-master, backend-master, tanstack, shadcn-ui-designer |
| "Build dashboard" | dashboard-master, shadcn-ui-designer, chart-master, responsive-master, tanstack |
| "Build admin panel" | dashboard-master, shadcn-ui-designer, neon-master, backend-master |
| "Fix performance issue" | debug-master, hydration-solver, tanstack, qa-tester |
| "Deploy to production" | cloudflare, debug-master, qa-tester |
| "Add authentication" | backend-master, neon-master, tanstack, shadcn-ui-designer |
| "Refactor component" | shadcn-ui-designer, responsive-master, debug-master |
| "Database migration" | neon-master, backend-master, debug-master |
| "SSR optimization" | hydration-solver, tanstack, debug-master |
| "Add SEO" | seo-master (user-confirmed), tanstack, debug-master |
| "Create theme" | theme-master, shadcn-ui-designer |
| "Install packages" | cloudflare, debug-master |
| "Wrangler setup" | cloudflare, debug-master |
| "Analytics dashboard" | dashboard-master, chart-master, tanstack, neon-master |
| "Add RBAC to app" | neon-master, backend-master, tanstack, shadcn-ui-designer, qa-tester |
| "Implement role management" | neon-master, backend-master, shadcn-ui-designer, debug-master |
| "Add permission-based UI" | shadcn-ui-designer, tanstack, backend-master, responsive-master |
| "Protect admin routes" | backend-master, tanstack, debug-master |
| "Add user roles" | neon-master, backend-master, shadcn-ui-designer |
| "Set up file-based routing" | tanstack, debug-master |
| "Add route guards" | tanstack, backend-master |
| "Implement URL state" | tanstack, shadcn-ui-designer |
| "Add nuqs URL state" | tanstack, shadcn-ui-designer, hydration-solver |
| "URL-driven tabs" | tanstack, shadcn-ui-designer |
| "URL filters" | tanstack, shadcn-ui-designer, backend-master |
| "URL pagination" | tanstack, shadcn-ui-designer, backend-master |
| "URL sorting" | tanstack, shadcn-ui-designer |
| "Configure SSR" | tanstack, hydration-solver, cloudflare |
| "Add route loaders" | tanstack, backend-master |
| "Fix navigation issues" | tanstack, debug-master |
| "Add data fetching" | tanstack, backend-master |
| "Implement caching" | tanstack, debug-master |
| "Add optimistic updates" | tanstack, shadcn-ui-designer |
| "Fix stale data" | tanstack, debug-master |
| "Implement infinite scroll" | tanstack, shadcn-ui-designer, responsive-master |
| "Prefetch data" | tanstack, backend-master |
| "Cache invalidation" | tanstack, backend-master |
| "Server state management" | tanstack, backend-master, neon-master |
| "Create form" | tanstack, shadcn-ui-designer |
| "Add form validation" | tanstack, shadcn-ui-designer |
| "Multi-step form" | tanstack, shadcn-ui-designer, responsive-master |
| "Dynamic form fields" | tanstack, shadcn-ui-designer |
| "Form with file upload" | tanstack, backend-master, cloudflare |
| "Edit form with data" | tanstack, backend-master, shadcn-ui-designer |
| "Add data table" | tanstack, shadcn-ui-designer |
| "Sortable table" | tanstack, shadcn-ui-designer |
| "Table with filtering" | tanstack, shadcn-ui-designer |
| "Paginated table" | tanstack, shadcn-ui-designer, backend-master |
| "Server-side table" | tanstack, backend-master, neon-master |
| "Virtual table" | tanstack, debug-master |
| "Table with row selection" | tanstack, shadcn-ui-designer |
| "Editable table" | tanstack, shadcn-ui-designer |
| "Table with URL state" | tanstack, shadcn-ui-designer |
| "Export table data" | tanstack, backend-master |
| "Table with grouping" | tanstack, shadcn-ui-designer |
| "Table with bulk actions" | tanstack, shadcn-ui-designer, backend-master |
| "Add local-first data" | tanstack, backend-master |
| "Real-time sync" | tanstack, neon-master, cloudflare |
| "Offline support" | tanstack, backend-master, qa-tester |
| "Setup TanStack DB" | tanstack, debug-master |
| "Add live queries" | tanstack, shadcn-ui-designer |
| "Migrate from Query to DB" | tanstack, debug-master |
| "Electric sync setup" | tanstack, neon-master, cloudflare |
| "PowerSync setup" | tanstack, backend-master, neon-master |
| "Cross-collection queries" | tanstack, neon-master |
| "Optimistic mutations" | tanstack, shadcn-ui-designer |
| "Collection with transactions" | tanstack, backend-master |

## Frontend Ownership Rule (GLOBAL)

**shadcn-ui-designer is the SINGLE OWNER of all frontend/UI implementation.**

| Rule | Description |
|------|-------------|
| Frontend Authority | ALL frontend/UI tasks MUST be delegated to shadcn-ui-designer |
| No Direct UI | Other agents are NOT allowed to craft frontend components, layouts, or UI logic |
| Sub-agent Hierarchy | responsive-master, theme-master, dashboard-master, chart-master operate ONLY under shadcn-ui-designer |

### UI Team Structure

```
shadcn-ui-designer (Team Lead - Frontend Owner)
├── responsive-master (Layout validation)
├── theme-master (Theming, CSS variables)
├── dashboard-master (Dashboard architecture)
└── chart-master (Data visualization)
```

## Agent Capability Matrix

### backend-master
- **Expertise**: ElysiaJS, tRPC, Drizzle ORM, Zod validation
- **Produces**: API designs, procedure definitions, middleware patterns, validation schemas
- **Constraints**: Type-safe, no frontend concerns, production-ready

### chart-master (Sub-agent of shadcn-ui-designer)
- **Expertise**: Apache ECharts, data visualization, SSR-safe charts
- **Produces**: Chart implementations, modular imports, responsive charts
- **Constraints**: SSR-safe, hydration-safe, modular imports only, operates under shadcn-ui-designer authority

### cloudflare
- **Expertise**: Workers, R2, D1, Wrangler, deployment, package installation
- **Produces**: wrangler.toml, deployment scripts, binding configs
- **Constraints**: Documentation-first, Wrangler CLI, no other clouds

### dashboard-master (Sub-agent of shadcn-ui-designer)
- **Expertise**: Dashboard architecture, sidebar-first design, shadcn/ui Sidebar
- **Produces**: Dashboard layouts, navigation hierarchies, data-driven interfaces
- **Constraints**: Must use shadcn/ui Sidebar, operates under shadcn-ui-designer authority

### debug-master
- **Expertise**: TypeScript errors, Biome, static analysis, root-cause analysis
- **Produces**: Error diagnoses, validated fixes, verification checklists
- **Constraints**: Must run validation, no workarounds without root cause

### hydration-solver
- **Expertise**: React SSR, hydration mismatches, streaming SSR, TanStack SSR
- **Produces**: Hydration fixes, SSR patterns, determinism analysis
- **Constraints**: No speculation, documentation-backed solutions

### neon-master
- **Expertise**: PostgreSQL, NeonDB, schema design, migrations, indexing
- **Produces**: Schema definitions, migration files, query optimization, constraint designs
- **Constraints**: Normalized schemas, proper indexes, reversible migrations

### plan-supervisor
- **Expertise**: Plan.md maintenance, task completion tracking, verification
- **Produces**: Updated plan.md with accurate completion status
- **Constraints**: Read-only for all files except plan.md checkboxes, no assumptions, no implementation

### qa-tester
- **Expertise**: Playwright, Chrome DevTools, feature testing, debugging
- **Produces**: Test reports, error investigations, verification results
- **Constraints**: No UI modifications, testing only, delegate fixes

### responsive-master (Sub-agent of shadcn-ui-designer)
- **Expertise**: Tailwind responsive, 4-tier breakpoint system, mobile-first
- **Produces**: Responsive audits, breakpoint fixes, layout corrections
- **Constraints**: Strict breakpoint compliance, no arbitrary values, operates under shadcn-ui-designer authority

### seo-master
- **Expertise**: SEO, structured data, schema markup, crawlability, AI crawlers
- **Produces**: robots.txt, sitemap.xml, JSON-LD, metadata optimization
- **Constraints**: Evidence-based only, no black-hat techniques
- **⚠️ User Confirmation Required**: Must verify with user before implementation. Dashboards, admin panels, and authenticated apps should NOT be indexed for security.

### shadcn-ui-designer (FRONTEND OWNER - Team Lead)
- **Expertise**: shadcn/ui, Tailwind, design systems, TanStack Form, 20 mandatory registries
- **Produces**: UI components, styling, forms, accessibility, coordinated UI from sub-agents
- **Constraints**: Must load shadcn-ui skill, design system compliance, MCP registry enforcement
- **Sub-agents**: responsive-master, theme-master, dashboard-master, chart-master

### tanstack
- **Expertise**: TanStack Start/Router/Query/Form/Table/DB, full-stack TypeScript, server state management, form handling, data tables, local-first reactive stores
- **Produces**: Router config, loaders, server functions, query patterns, mutations, cache strategies, optimistic updates, form validation, field arrays, table columns, row models, virtual scrolling, collections, live queries, transactions, sync configurations
- **Constraints**: Type-safe, Cloudflare-ready, UI delegation to shadcn-ui-designer, Query for server state, Form for form state (not useState), Table for data grids, DB for local-first reactive data

### theme-master (Sub-agent of shadcn-ui-designer)
- **Expertise**: OKLCH color system, CSS custom properties, shadcn/ui theming
- **Produces**: Complete CSS theme files with light/dark mode, chart colors, sidebar tokens
- **Constraints**: ONLY output CSS, OKLCH format required, no explanations, operates under shadcn-ui-designer authority

## Sequential Invocation Order

For maximum context propagation, invoke agents in this order:

1. **Domain Analysis Agents** (understand the problem)
   - neon-master (if database involved)
   - backend-master (if API involved)
   - tanstack (if full-stack coordination needed)
   - seo-master (if SEO/metadata involved - requires user confirmation first)

2. **Implementation Agents** (define the solution)
   - dashboard-master (if dashboard/admin involved)
   - shadcn-ui-designer (if UI involved)
   - theme-master (if theming involved)
   - chart-master (if visualization involved)
   - responsive-master (if layout involved)
   - hydration-solver (if SSR involved)
   - cloudflare (if deployment or package installation involved)

3. **Verification Agents** (validate the solution) - ALWAYS LAST
   - debug-master (mandatory - verifies no errors)
   - qa-tester (mandatory - verifies functionality)
   - plan-supervisor (mandatory - updates plan.md completion status)

## Conflict Resolution Patterns

### Common Conflict Types

1. **UX vs Performance**
   - shadcn-ui-designer wants rich interactions
   - responsive-master or debug-master flags performance impact
   - Resolution: Ask user to prioritize or implement conditional behavior

2. **Schema vs API**
   - neon-master designs normalized schema
   - backend-master needs denormalized for performance
   - Resolution: Ask user, consider views or query optimization

3. **SSR vs Client Features**
   - hydration-solver requires determinism
   - shadcn-ui-designer wants dynamic client features
   - Resolution: Proper client-only guards, hydration boundaries

4. **Deployment vs Features**
   - cloudflare has Workers size limits
   - Other agents add dependencies increasing bundle
   - Resolution: Code splitting, lazy loading, or feature reduction

### Conflict Presentation Template

```markdown
## Conflict Detected

**Domain**: [e.g., Performance vs UX]

**Agent A**: [agent-name]
**Position**: [what they recommend]
**Rationale**: [why]

**Agent B**: [agent-name]
**Position**: [what they recommend]
**Rationale**: [why]

**Options**:
1. [Option favoring Agent A]
2. [Option favoring Agent B]
3. [Compromise option if available]

**Recommendation**: [If one option is clearly better, state it]
```

## Output Contract Templates

### Consolidated Root-Cause Analysis Template

```markdown
## Root-Cause Analysis

### Problem Statement
[What is the core issue, synthesized from all agent inputs]

### Contributing Factors
| Factor | Identified By | Severity |
|--------|---------------|----------|
| ... | [agent] | High/Medium/Low |

### Root Cause
[The fundamental issue that, if fixed, resolves the problem]

### Evidence
[Supporting observations from multiple agents]
```

### Risk Matrix Template

```markdown
## Cross-Agent Risk Matrix

| Risk | Source Agent | Probability | Impact | Mitigation |
|------|--------------|-------------|--------|------------|
| [Risk description] | [agent] | High/Med/Low | High/Med/Low | [How to address] |
```

### Execution Plan Template

```markdown
## Unified Execution Plan

### Prerequisites
- [ ] [Prerequisite with responsible agent]

### Implementation Steps

#### Step 1: [Action]
- **Responsible Agent**: [agent-name]
- **Details**: [What to do]
- **Verification**: [How to verify completion]

#### Step 2: [Action]
...

### Post-Implementation
- [ ] Run debug-master verification
- [ ] Run qa-tester validation
- [ ] Update documentation
```

### Validation Checklist Template

```markdown
## Validation Checklist

### From debug-master
- [ ] `bun run validate` passes
- [ ] `bunx biome check .` passes
- [ ] No type errors
- [ ] No lint violations

### From qa-tester
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Network requests succeed
- [ ] Responsive behavior verified

### From [other relevant agents]
- [ ] [Domain-specific verification items]
```

## Orchestration Anti-Patterns

### NEVER Do These

1. **Skip agents for "simple" tasks** - All relevant agents are mandatory
2. **Auto-resolve conflicts** - Always escalate to user
3. **Implement during orchestration** - Rubot coordinates, doesn't implement
4. **Proceed with partial consultation** - All agents must respond
5. **Ignore agent constraints** - Each agent's rules are binding
6. **Rush to solution** - Proper orchestration takes time

### Warning Signs

- "Let's just quickly..." - Stop, follow the protocol
- "This is obvious..." - Still consult all relevant agents
- "We can skip X because..." - No, X is mandatory if relevant
- "I'll implement and verify later..." - No, verify during orchestration
