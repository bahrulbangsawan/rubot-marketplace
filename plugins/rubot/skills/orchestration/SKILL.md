---
name: orchestration
version: 2.8.0
description: |
  Multi-agent orchestration governor for coordinating specialist agents across domains. MUST activate when a task spans 2+ domains (database + API + UI, deployment + testing, etc.), when agents disagree or produce conflicting recommendations, when the user asks "which agent should I use/handle this", or when building a unified execution plan, risk matrix, or agent sequence. Also activate for: "coordinate the implementation", "create an execution plan", "agent responsibilities", "in what order", "which one wins", multi-step features (e.g., "add booking with table, endpoint, and form"), cross-agent validation, post-implementation verification pipelines, and any request that names 3+ concerns (SSR + responsive + database). Do NOT activate for single-domain tasks like "add a column", "fix a TypeScript error", "write a useQuery hook", or "deploy the worker" -- those go directly to their specialist agent.

  Covers: domain classification, agent selection, task routing, multi-agent coordination, conflict resolution, sequential invocation order, execution plan generation, risk matrices, and cross-agent validation.
agents:
  - rubot
---

# Multi-Agent Orchestration Knowledge

> Coordinate specialist agents for deterministic, conflict-free multi-domain task execution

## When to Use

- User asks "which agent should I use for X" or needs help selecting the right agent
- Task spans multiple domains (database + API + UI, deployment + testing, etc.)
- You need to determine the correct invocation order for a multi-step feature
- Two or more agents produce conflicting recommendations that need resolution
- User describes a complex feature that requires coordinated agent effort
- You need to build a unified execution plan from multiple agent consultations
- Task routing is ambiguous and domain classification is needed
- Post-implementation validation requires coordinating verification agents

## Quick Reference

| Agent | Domain | Role |
|-------|--------|------|
| backend-master | API, tRPC, ElysiaJS, Drizzle | Backend logic and validation |
| chart-master | ECharts, data visualization | Charts (sub-agent of shadcn-ui-designer) |
| cloudflare | Workers, R2, D1, Wrangler | Deployment and package installation |
| dashboard-master | Dashboard, sidebar, admin | Dashboard architecture (sub-agent) |
| debug-master | TypeScript, Biome, lint | Error diagnosis and verification |
| hydration-solver | SSR, hydration, streaming | Hydration fix and SSR patterns |
| lazy-load-master | Code splitting, dynamic imports | Bundle optimization |
| neon-master | PostgreSQL, NeonDB, migrations | Database schema and queries |
| plan-supervisor | plan.md tracking | Task completion status |
| qa-tester | agent-browser, feature testing | Functional verification |
| responsive-master | Tailwind responsive, breakpoints | Layout validation (sub-agent) |
| seo-master | SEO, schema markup, crawlability | SEO implementation (user-confirmed) |
| shadcn-ui-designer | shadcn/ui, Tailwind, forms | Frontend owner and UI team lead |
| tanstack | Router/Query/Form/Table/DB | Full-stack TypeScript patterns |
| theme-master | OKLCH, CSS variables, dark mode | Theming (sub-agent) |

## Core Principles

1. **Sequential Invocation Order Matters** — Context propagates forward: each agent builds on previous agents' outputs. Database schema informs API design, which informs UI structure. Invoking out of order means later agents lack the context they need, producing incompatible outputs.

2. **Frontend Ownership is Singular** — shadcn-ui-designer owns all UI implementation because split ownership causes inconsistent styling, duplicated components, and broken responsive behavior. Other agents provide data and logic; one agent renders it all.

3. **Conflict Resolution Requires Human Input** — When agents disagree (performance vs UX, normalized vs denormalized schema), these represent genuine trade-offs with no objectively correct answer. Auto-resolving masks important decisions the user should make.

4. **Every Domain Gets Consulted** — Skipping an agent for a "simple" task misses cross-domain implications. A "simple" UI change may affect SSR, responsiveness, and accessibility. The cost of consultation is low; the cost of a missed edge case is high.

5. **Verification is Non-Negotiable** — debug-master, qa-tester, and plan-supervisor run after every implementation. Catching issues during verification is cheap; fixing them in production is expensive.

## Documentation Verification

Before orchestrating any multi-agent workflow, gather current information:

1. **Verify current library APIs** (if Context7 MCP is available):
   - Use `mcp__context7__resolve-library-id` and `mcp__context7__query-docs` for specific technology patterns
   - If Context7 is not available, use WebSearch or WebFetch to check current documentation

2. **Research integration patterns** (if Exa MCP is available):
   - Use `mcp__exa__web_search_exa` for latest patterns
   - If Exa is not available, use WebSearch as a fallback

3. **Clarify with user** via AskUserQuestion:
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
| test, QA, agent-browser | Testing | qa-tester |
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
| WCAG, accessibility, a11y, screen reader, keyboard navigation, focus management, aria, alt text | Accessibility | seo-master, responsive-master, shadcn-ui-designer |
| navbar, footer, global layout, site header, site footer, page wrapper, shared layout, persistent navigation | Layout Structure | shadcn-ui-designer, responsive-master |

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
| "Add navbar and footer" | shadcn-ui-designer, responsive-master |
| "Create global layout" | shadcn-ui-designer, responsive-master |
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

## Frontend Ownership Rule

**shadcn-ui-designer owns all frontend/UI implementation.** This ensures design consistency — when multiple agents touch the UI independently, you get inconsistent styling, duplicated components, and broken responsive behavior.

| Rule | Description |
|------|-------------|
| Frontend Authority | Frontend/UI tasks are delegated to shadcn-ui-designer |
| No Direct UI | Other agents provide data and logic; shadcn-ui-designer handles the UI |
| Sub-agent Hierarchy | responsive-master, theme-master, dashboard-master, chart-master work under shadcn-ui-designer's coordination |

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

### lazy-load-master
- **Expertise**: Code splitting, lazy loading, dynamic imports, bundle size optimization
- **Produces**: Lazy loading patterns, React.lazy implementations, dynamic import strategies, bundle analysis
- **Constraints**: Performance-focused, must maintain SSR compatibility, hydration-safe patterns

### neon-master
- **Expertise**: PostgreSQL, NeonDB, schema design, migrations, indexing
- **Produces**: Schema definitions, migration files, query optimization, constraint designs
- **Constraints**: Normalized schemas, proper indexes, reversible migrations

### plan-supervisor
- **Expertise**: Plan.md maintenance, task completion tracking, verification
- **Produces**: Updated plan.md with accurate completion status
- **Constraints**: Read-only for all files except plan.md checkboxes, no assumptions, no implementation

### qa-tester
- **Expertise**: agent-browser, feature testing, debugging
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
- **User Confirmation Required**: Must verify with user before implementation. Dashboards, admin panels, and authenticated apps should NOT be indexed for security.

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

Context propagates forward through this sequence — each phase builds on the outputs of the previous one. Invoking out of order means agents lack the context they need.

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

3. **Verification Agents** (validate the solution) - run after implementation
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
**Agent A**: [agent-name] — Position: [what they recommend] — Rationale: [why]
**Agent B**: [agent-name] — Position: [what they recommend] — Rationale: [why]
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
#### Step 2: [Action] ...
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
- [ ] No type errors / No lint violations
### From qa-tester
- [ ] Feature works as expected
- [ ] No console errors / Network requests succeed
- [ ] Responsive behavior verified
### From [other relevant agents]
- [ ] [Domain-specific verification items]
```

## Orchestration Anti-Patterns

### Anti-Patterns

These patterns lead to poor outcomes because they bypass the consensus-building that makes orchestration valuable:

1. **Skipping agents for "simple" tasks** — What looks simple often has cross-domain implications. A "simple" UI change may affect SSR, responsiveness, and accessibility.
2. **Auto-resolving conflicts** — Conflicts represent genuine trade-offs. The user needs to make the call on which priority wins.
3. **Implementing during orchestration** — Rubot coordinates and plans; agents implement. Mixing the two creates unreviewed changes.
4. **Proceeding with partial consultation** — Missing an agent's input means missing their domain expertise.
5. **Ignoring agent constraints** — Constraints exist because of real technical limitations (e.g., Workers size limits, hydration determinism).
6. **Rushing to solution** — Quick solutions often miss edge cases that agents would catch.

### Warning Signs

If you notice these thought patterns, pause and reconsider — they usually indicate a shortcut that will cost more time later:

- "Let's just quickly..." — Speed now often means rework later
- "This is obvious..." — Obvious tasks still benefit from domain expertise
- "We can skip X because..." — Skipping consultation leads to missed edge cases
- "I'll implement and verify later..." — Verification during planning catches issues cheaply; fixing post-implementation is expensive

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Wrong agent selected for task | Domain keywords matched incorrectly or task is ambiguous | Re-check the Domain Classification Reference table; look for secondary keywords that indicate the true domain |
| Agents give conflicting advice | Genuine trade-off between domains (e.g., performance vs UX) | Use the Conflict Presentation Template to surface both positions; ask the user to decide |
| Too many agents invoked for a simple task | Task was over-classified as multi-domain | Verify the task truly spans multiple domains; single-domain tasks need only their primary agent plus verification |
| Agent output is incompatible with previous agent | Invocation order was wrong; context did not propagate | Re-invoke agents in the correct Sequential Invocation Order so each builds on prior outputs |
| SEO agent applied to admin panel | Missing user confirmation step | Always confirm with user before invoking seo-master; dashboards and authenticated apps should NOT be indexed |
| Sub-agent acts independently of shadcn-ui-designer | Frontend ownership rule was bypassed | Route all UI work through shadcn-ui-designer; sub-agents (chart-master, responsive-master, etc.) operate under its coordination |
| Plan.md not updated after implementation | plan-supervisor was skipped in verification phase | Always run all three verification agents: debug-master, qa-tester, plan-supervisor |
| Agent recommends deprecated API | Documentation was not verified before orchestration | Run Documentation Verification step first; use Context7 or WebSearch to confirm current APIs |

## Constraints

- Rubot orchestrates and coordinates; it does NOT implement code directly
- All UI implementation must go through shadcn-ui-designer (frontend ownership rule)
- seo-master requires explicit user confirmation before invocation
- Verification agents (debug-master, qa-tester, plan-supervisor) are mandatory after every implementation
- Conflicts between agents must be presented to the user; never auto-resolve trade-offs
- Agents must be invoked in sequential order (Domain Analysis, then Implementation, then Verification)
- plan-supervisor is read-only for all files except plan.md checkboxes
- qa-tester performs testing only; it delegates fixes to the appropriate specialist agent

## Verification Checklist

Before finalizing any orchestration workflow, confirm:

- [ ] All relevant domains identified using the Domain Classification Reference
- [ ] Correct agents selected for each domain (no missing, no extras)
- [ ] User confirmation obtained for seo-master (if SEO is involved)
- [ ] Agents invoked in correct sequential order (Domain Analysis, Implementation, Verification)
- [ ] Frontend ownership rule respected (all UI routed through shadcn-ui-designer)
- [ ] No conflicts auto-resolved; all trade-offs presented to user
- [ ] Documentation verified for current APIs before agent invocation
- [ ] Execution plan generated with clear steps, responsible agents, and verification criteria
- [ ] All three verification agents scheduled: debug-master, qa-tester, plan-supervisor
- [ ] Anti-patterns checklist reviewed (no skipped agents, no rushed solutions)

## References

- Agent definitions: `AGENTS.md` in project root (generated by `/rubot-init`)
- Plan tracking: `plan.md` in project root (managed by plan-supervisor)
- shadcn/ui registries: Loaded via `mcp__shadcn__list_items_in_registries`
- Context7 docs: `mcp__context7__resolve-library-id` and `mcp__context7__query-docs`
- Exa search: `mcp__exa__web_search_exa` for latest integration patterns
