# rubot

**Strict Multi-Agent Orchestration Governor v2.9.0**

`rubot` enforces deterministic, mandatory multi-agent consultation for all significant tasks in complex Claude Code projects. It acts as a project manager ensuring no decision is made without consensus from all relevant domain experts.

## Installation

First, add this marketplace to Claude Code:

```
/plugin marketplace add bahrulbangsawan/rubot-marketplace
```

Then install the rubot plugin:

```
/plugin install rubot@rubot-marketplace
```

After installation, restart Claude Code or run `/rubot-init` to initialize the plugin workspace.

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

## Command Examples

### Workflow Commands

#### `/rubot` - Main Orchestration Governor

Invoke the multi-agent orchestration system for complex tasks.

**Example:**
```
/rubot Implement user authentication with JWT tokens and role-based access control
```

**Expected Result:**
```
## Domain Classification
Primary: backend-master, neon-master
Secondary: tanstack, debug-master, qa-tester

## Consolidated Root-Cause Analysis
- Authentication requires: JWT token generation, refresh token rotation, secure storage
- RBAC requires: roles table, permissions table, user-role junction
- Frontend requires: auth context, protected routes, token refresh interceptor

## Cross-Agent Risk Matrix
| Agent | Concern | Mitigation |
|-------|---------|------------|
| backend-master | Token expiry handling | Implement refresh token rotation |
| neon-master | Role permission queries | Add composite indexes |
| tanstack | SSR auth state | Use cookie-based tokens for SSR |

## Unified Execution Plan
1. [neon-master] Create auth schema (users, roles, permissions, sessions)
2. [backend-master] Implement JWT service with refresh tokens
3. [backend-master] Create auth endpoints (login, logout, refresh)
4. [tanstack] Add auth context and protected route wrapper
5. [debug-master] Validate type safety across auth flow
6. [qa-tester] Test auth flows with Playwright

## Validation Checklist
- [ ] Token generation works correctly
- [ ] Refresh token rotation prevents reuse
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based permissions enforced on API endpoints
```

---

#### `/rubot-init` - Initialize Workspace

Set up the rubot workspace for a new or existing project.

**Example:**
```
/rubot-init
```

**Expected Result:**
```
## Rubot Workspace Initialization

✓ Created .claude/rubot/ directory
✓ Generated rubot.local.md configuration

### Project Configuration Detected:
- Framework: TanStack Start
- Package Manager: bun
- Database: NeonDB with Drizzle
- UI: shadcn/ui

### Optional: Boilerplate Cleanup
Would you like to clean up template boilerplate?
- [ ] Remove ASCII art and demo content
- [ ] Rename routes (/sign-in → /login)
- [ ] Simplify header/footer components
- [ ] Rewrite README.md

[Yes] [No] [Skip for now]
```

---

#### `/rubot-plan` - Generate Execution Plan

Create a structured plan for implementing a feature or fix.

**Example:**
```
/rubot-plan Add a dashboard with analytics charts showing user activity
```

**Expected Result:**
```
## Execution Plan: Analytics Dashboard

**Status:** Pending Approval
**Generated:** 2025-01-12T10:30:00

### Domain Classification
- Primary: dashboard-master, chart-master
- Secondary: shadcn-ui-designer, backend-master, neon-master

### Tasks

#### Phase 1: Database & API
- [ ] [neon-master] Create analytics_events table with indexes
- [ ] [backend-master] Implement /api/analytics endpoints
  - GET /api/analytics/users - User activity metrics
  - GET /api/analytics/events - Event timeline data

#### Phase 2: Dashboard UI
- [ ] [dashboard-master] Create dashboard layout with sidebar
- [ ] [chart-master] Implement line chart for user signups
- [ ] [chart-master] Implement bar chart for daily active users
- [ ] [responsive-master] Ensure mobile responsiveness

#### Phase 3: Validation
- [ ] [debug-master] Run type checking and linting
- [ ] [qa-tester] Test dashboard interactions

### Approval
- [ ] I approve this plan for execution

---
To execute: `/rubot-execute`
```

---

#### `/rubot-execute` - Execute Approved Plan

Run the implementation steps from an approved plan.

**Example:**
```
/rubot-execute
```

**Expected Result:**
```
## Executing Plan: Analytics Dashboard

### Phase 1: Database & API
[neon-master] Creating analytics_events table...
✓ Created src/db/schema/analytics.ts
✓ Generated migration 0005_add_analytics_events.sql
✓ Applied migration successfully

[backend-master] Implementing API endpoints...
✓ Created src/server/routes/analytics.ts
✓ Added routes to src/server/index.ts

### Phase 2: Dashboard UI
[dashboard-master] Creating dashboard layout...
✓ Created src/routes/dashboard/index.tsx
✓ Created src/routes/dashboard/-components/sidebar.tsx

[chart-master] Implementing charts...
✓ Created src/components/charts/user-signups-chart.tsx
✓ Created src/components/charts/daily-active-users-chart.tsx

[responsive-master] Validating responsiveness...
✓ All breakpoints verified (mobile, tablet, desktop)

### Phase 3: Validation
[debug-master] Running validation...
✓ TypeScript: No errors
✓ Biome: All checks passed

## Execution Complete
All 8 tasks completed successfully.
Run `/rubot-check` to perform full validation.
```

---

#### `/rubot-check` - Run Validation

Perform comprehensive validation of all changes.

**Example:**
```
/rubot-check
```

**Expected Result:**
```
## Validation Report
**Generated:** 2025-01-12T11:00:00

### 1. TypeScript Validation
✓ No type errors found
  Checked 45 files

### 2. Biome Linting
✓ All checks passed
  - 0 errors
  - 0 warnings

### 3. Build Validation
✓ Build completed successfully
  - Bundle size: 245KB (gzipped)
  - No build warnings

### 4. Registry Validation
✓ components.json valid
  - All 20 registries configured
  - Schema version correct

### 5. Database Schema
✓ Schema in sync with migrations
  - 5 migrations applied
  - No pending changes

### 6. Test Results
✓ All tests passing
  - 12 unit tests
  - 5 integration tests

### Summary
| Check | Status |
|-------|--------|
| TypeScript | ✓ Pass |
| Biome | ✓ Pass |
| Build | ✓ Pass |
| Registry | ✓ Pass |
| Database | ✓ Pass |
| Tests | ✓ Pass |

**Ready for commit.** Run `/rubot-commit` to proceed.
```

---

#### `/rubot-commit` - Create Git Commit

Create a conventional commit for the current changes.

**Example:**
```
/rubot-commit
```

**Expected Result:**
```
## Git Commit

### Changes Summary
- 8 files added
- 3 files modified
- 892 insertions, 12 deletions

### Generated Commit Message
```
feat(dashboard): add analytics dashboard with user activity charts

- Add analytics_events table with proper indexes
- Implement /api/analytics endpoints for metrics
- Create dashboard layout with sidebar navigation
- Add line chart for user signups over time
- Add bar chart for daily active users
- Ensure responsive design across all breakpoints

Generated with AI

Co-Authored-By: RuBot <https://github.com/bahrulbangsawan/rubot-marketplace>
```

### Commit Created
[main a1b2c3d] feat(dashboard): add analytics dashboard with user activity charts
 11 files changed, 892 insertions(+), 12 deletions(-)

Your branch is ahead of 'origin/main' by 1 commit.
```

---

#### `/rubot-new-pr` - Create Pull Request

Create a new PR on GitHub using the gh CLI.

**Example:**
```
/rubot-new-pr
```

**Expected Result:**
```
## Creating Pull Request

### Branch Status
Current branch: feature/analytics-dashboard
Base branch: main
Commits ahead: 3

### PR Details
**Title:** feat(dashboard): add analytics dashboard with user activity charts

**Body:**
## Summary
- Add analytics dashboard with real-time user metrics
- Implement line and bar charts for data visualization
- Create responsive sidebar navigation

## Changes
- `src/db/schema/analytics.ts` - Analytics event schema
- `src/server/routes/analytics.ts` - API endpoints
- `src/routes/dashboard/` - Dashboard pages and components
- `src/components/charts/` - ECharts implementations

## Test Plan
- [ ] Verify charts render with mock data
- [ ] Test responsive layout on mobile
- [ ] Confirm API endpoints return correct data

### PR Created
✓ https://github.com/user/project/pull/42

Opening in browser...
```

---

#### `/rubot-push-pr` - Update Existing PR

Push new commits to an active pull request.

**Example:**
```
/rubot-push-pr
```

**Expected Result:**
```
## Updating Pull Request

### Current PR
PR #42: feat(dashboard): add analytics dashboard with user activity charts
Status: Open
Reviews: 1 change requested

### New Commits
- a1b2c3d fix: address review feedback on chart colors
- d4e5f6g refactor: extract chart config to constants

### Pushing Changes
✓ Pushed 2 commits to feature/analytics-dashboard

### Re-running Validation
✓ TypeScript: Pass
✓ Biome: Pass
✓ Build: Pass
✓ Tests: Pass

### PR Updated
https://github.com/user/project/pull/42
Ready for re-review.
```

---

#### `/rubot-new-repo` - Create GitHub Repository

Initialize a new GitHub repository with proper setup.

**Example:**
```
/rubot-new-repo
```

**Expected Result:**
```
## Create GitHub Repository

### Repository Details
? Repository name: my-awesome-project
? Visibility: Public
? Description: A TanStack Start application with analytics

### Pre-flight Checks
✓ GitHub CLI authenticated (user: johndoe)
✓ Git initialized locally
✓ .gitignore exists (Node.js template)
✓ No sensitive files detected

### Creating Repository
✓ Initial commit created
✓ Repository created on GitHub
✓ Remote 'origin' added
✓ Pushed to main branch

### Repository Ready
https://github.com/johndoe/my-awesome-project

Opening in browser...
```

---

#### `/rubot-status` - View Workspace Status

Check the current state of the rubot workspace.

**Example:**
```
/rubot-status
```

**Expected Result:**
```
## Rubot Workspace Status

### Workspace
Location: .claude/rubot/
Initialized: 2025-01-10T09:00:00

### Current Plan
File: plan.md
Title: Analytics Dashboard Implementation
Status: In Progress
Progress: 6/8 tasks completed (75%)

### Pending Tasks
- [ ] [debug-master] Run type checking and linting
- [ ] [qa-tester] Test dashboard interactions

### Last Validation
File: validation-report.md
Generated: 2025-01-12T10:45:00
Result: All checks passed

### Git Status
Branch: feature/analytics-dashboard
Commits ahead: 2
Uncommitted changes: 3 files modified

### Archived Plans
- 2025-01-08T14:30:00-plan.md (Auth System)
- 2025-01-05T11:00:00-plan.md (Database Setup)
```

---

#### `/rubot-reset` - Reset Workspace

Clear the workspace to start fresh.

**Example:**
```
/rubot-reset
```

**Expected Result:**
```
## Reset Rubot Workspace

### Current State
- Active plan: Analytics Dashboard (75% complete)
- Validation report: 2025-01-12T10:45:00
- Archived plans: 2

### Warning
This will:
- Archive the current plan.md (if exists)
- Clear validation-report.md
- Reset workspace state

Archived plans will be preserved.

### Confirm Reset?
[Yes, reset workspace] [Cancel]

---

✓ Archived current plan to 2025-01-12T11:30:00-plan.md
✓ Cleared validation-report.md
✓ Workspace reset complete

Ready for new task. Run `/rubot-plan` to start.
```

---

#### `/rubot-help` - Display Help

Show available commands and usage information.

**Example:**
```
/rubot-help
```

**Expected Result:**
```
## Rubot Plugin Help (v2.9.0)

### Workflow Commands
| Command | Description |
|---------|-------------|
| /rubot | Multi-agent orchestration for complex tasks |
| /rubot-init | Initialize workspace (run once per project) |
| /rubot-plan | Generate execution plan for a task |
| /rubot-execute | Execute the approved plan |
| /rubot-check | Run validation checks |
| /rubot-commit | Create git commit |
| /rubot-new-pr | Create pull request |
| /rubot-push-pr | Update existing PR |
| /rubot-new-repo | Create GitHub repository |
| /rubot-status | View workspace status |
| /rubot-reset | Reset workspace |
| /rubot-review | Autonomous code review |

### SEO Commands
| Command | Description |
|---------|-------------|
| /seo-audit | Full SEO audit with Chrome DevTools |
| /seo-check-schema | Validate JSON-LD markup |
| /seo-check-og | Check Open Graph tags |
| /seo-check-vitals | Audit Core Web Vitals |
| /seo-generate-robots | Generate robots.txt |
| /seo-generate-sitemap | Generate sitemap.xml |
| /seo-generate-favicons | Set up favicons |

### Recommended Workflow
1. /rubot-init → Initialize (once)
2. /rubot-plan <task> → Plan
3. /rubot-execute → Implement
4. /rubot-check → Validate
5. /rubot-commit → Commit
6. /rubot-new-pr → Create PR

### Documentation
Full docs: ~/.claude/plugins/rubot/README.md
```

---

#### `/rubot-review` - Autonomous Code Review

Perform comprehensive code review and analysis.

**Example:**
```
/rubot-review
```

**Expected Result:**
```
## Autonomous Code Review

### Scanning Codebase...
Analyzing 156 files across 12 directories

### Issues Found

#### Critical (2)
1. **SQL Injection Risk** - `src/server/routes/users.ts:45`
   ```typescript
   // Current (vulnerable)
   db.execute(`SELECT * FROM users WHERE id = ${userId}`)

   // Suggested fix
   db.execute(sql`SELECT * FROM users WHERE id = ${userId}`)
   ```

2. **Missing Auth Check** - `src/server/routes/admin.ts:23`
   ```typescript
   // Missing middleware
   router.get('/admin/users', async (ctx) => { ... })

   // Should be
   router.get('/admin/users', requireRole('admin'), async (ctx) => { ... })
   ```

#### Warnings (5)
1. Unused import - `src/components/Button.tsx:3`
2. Missing error boundary - `src/routes/dashboard/index.tsx`
3. Console.log in production - `src/lib/api.ts:67`
4. Missing loading state - `src/routes/users/index.tsx:34`
5. Hardcoded API URL - `src/lib/config.ts:12`

#### Suggestions (3)
1. Consider memoizing expensive computation - `src/hooks/useAnalytics.ts:45`
2. Add index for frequently queried column - `src/db/schema/events.ts`
3. Extract repeated styles to component - `src/routes/dashboard/-components/`

### Auto-Fix Available
Would you like to automatically fix the 2 critical issues?
[Yes, fix critical issues] [Review manually] [Skip]
```

---

### SEO Commands

#### `/seo-audit` - Comprehensive SEO Audit

Perform full SEO audit using Chrome DevTools.

**Example:**
```
/seo-audit https://localhost:3000
```

**Expected Result:**
```
## SEO Audit Report
**URL:** https://localhost:3000
**Generated:** 2025-01-12T11:00:00

### Meta Tags
| Tag | Status | Value |
|-----|--------|-------|
| title | ✓ | My App - Dashboard |
| description | ✓ | Manage your analytics... (142 chars) |
| canonical | ✗ Missing | - |
| robots | ✓ | index, follow |

### Open Graph
| Property | Status | Value |
|----------|--------|-------|
| og:title | ✓ | My App - Dashboard |
| og:description | ✓ | Manage your analytics... |
| og:image | ✗ Missing | - |
| og:url | ✗ Missing | - |

### Structured Data
✗ No JSON-LD found on page

### Headings
- H1: 1 (✓ Good)
- H2: 4
- H3: 8
- Hierarchy: ✓ Valid

### Images
| Status | Count |
|--------|-------|
| With alt text | 12 |
| Missing alt | 3 ⚠️ |
| Missing dimensions | 2 ⚠️ |

### Core Web Vitals
| Metric | Value | Status |
|--------|-------|--------|
| LCP | 1.2s | ✓ Good |
| INP | 45ms | ✓ Good |
| CLS | 0.05 | ✓ Good |

### Recommendations
1. Add canonical URL tag
2. Add og:image and og:url meta tags
3. Add JSON-LD structured data
4. Add alt text to 3 images
5. Specify width/height on 2 images
```

---

#### `/seo-check-schema` - Validate Structured Data

Check JSON-LD schema markup on pages.

**Example:**
```
/seo-check-schema https://localhost:3000/blog/hello-world
```

**Expected Result:**
```
## Schema Markup Validation
**URL:** https://localhost:3000/blog/hello-world

### JSON-LD Found
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Hello World",
  "author": {
    "@type": "Person",
    "name": "John Doe"
  },
  "datePublished": "2025-01-12",
  "image": "https://example.com/image.jpg"
}
```

### Validation Results
| Property | Status | Notes |
|----------|--------|-------|
| @context | ✓ Valid | schema.org |
| @type | ✓ Valid | BlogPosting |
| headline | ✓ Valid | 11 characters |
| author | ✓ Valid | Person type |
| datePublished | ✓ Valid | ISO 8601 format |
| image | ✓ Valid | Absolute URL |
| dateModified | ⚠️ Missing | Recommended |
| publisher | ⚠️ Missing | Required for rich results |
| mainEntityOfPage | ⚠️ Missing | Recommended |

### Rich Results Eligibility
- Google Article: ⚠️ Partial (missing publisher)
- Google Breadcrumb: ✗ Not applicable

### Recommendations
1. Add `publisher` with Organization type
2. Add `dateModified` property
3. Add `mainEntityOfPage` with URL
```

---

#### `/seo-check-og` - Check Open Graph Tags

Validate social sharing meta tags.

**Example:**
```
/seo-check-og https://localhost:3000
```

**Expected Result:**
```
## Open Graph & Twitter Card Validation
**URL:** https://localhost:3000

### Open Graph Tags
| Property | Status | Value |
|----------|--------|-------|
| og:title | ✓ | My App - Analytics Dashboard |
| og:description | ✓ | Track your metrics in real-time |
| og:type | ✓ | website |
| og:url | ✗ Missing | - |
| og:image | ✗ Missing | - |
| og:site_name | ⚠️ Missing | Optional but recommended |

### Twitter Card Tags
| Property | Status | Value |
|----------|--------|-------|
| twitter:card | ✗ Missing | - |
| twitter:title | ✗ Missing | - |
| twitter:description | ✗ Missing | - |
| twitter:image | ✗ Missing | - |

### Preview
**Facebook/LinkedIn:**
┌─────────────────────────────────┐
│ [No image]                      │
│ MY APP - ANALYTICS DASHBOARD    │
│ Track your metrics in real-time │
│ localhost:3000                  │
└─────────────────────────────────┘

**Twitter:**
No Twitter Card configured

### Recommendations
1. Add og:url with canonical URL
2. Add og:image (1200x630px recommended)
3. Add twitter:card (summary_large_image)
4. Add twitter:image
5. Add og:site_name
```

---

#### `/seo-check-vitals` - Audit Core Web Vitals

Measure and analyze Core Web Vitals performance.

**Example:**
```
/seo-check-vitals https://localhost:3000
```

**Expected Result:**
```
## Core Web Vitals Audit
**URL:** https://localhost:3000
**Device:** Desktop (1920x1080)

### Performance Trace
Recording: 5.2 seconds
Page Load: 1.8 seconds

### Core Web Vitals
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| LCP | 1.2s | < 2.5s | ✓ Good |
| INP | 45ms | < 200ms | ✓ Good |
| CLS | 0.05 | < 0.1 | ✓ Good |

### LCP Analysis
**Element:** `<img src="/hero-image.webp">`
**Render Time:** 1.2s

Breakdown:
- TTFB: 180ms
- Resource Load: 650ms
- Render Delay: 370ms

### INP Analysis
**Longest Interaction:** Button click (45ms)
- Processing: 32ms
- Presentation: 13ms

### CLS Analysis
**Total Shift:** 0.05
Sources:
1. Image without dimensions: +0.03
2. Font swap: +0.02

### Insights
1. **Optimize LCP Image**
   - Current: 245KB PNG
   - Suggested: Convert to WebP (~80KB)
   - Add `fetchpriority="high"`

2. **Prevent CLS**
   - Add width/height to hero image
   - Use `font-display: optional` for custom fonts

### Performance Score: 92/100
```

---

#### `/seo-generate-robots` - Generate robots.txt

Create robots.txt with proper directives.

**Example:**
```
/seo-generate-robots
```

**Expected Result:**
```
## Generate robots.txt

### Project Analysis
- Framework: TanStack Start
- Environment: Production
- Auth Routes: /login, /register, /dashboard/*

### Generated robots.txt
```
# robots.txt for my-app
# Generated by rubot SEO toolkit

User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/
Disallow: /_build/
Disallow: /login
Disallow: /register

# Crawl-delay for polite crawling
Crawl-delay: 1

# Sitemaps
Sitemap: https://my-app.com/sitemap.xml

# Block AI training crawlers (optional)
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /
```

### File Created
✓ Created `public/robots.txt`

### Notes
- Protected routes (/dashboard, /admin) blocked
- API routes blocked from indexing
- Sitemap reference added
- AI crawler blocking included (optional)
```

---

#### `/seo-generate-sitemap` - Generate sitemap.xml

Create sitemap from project routes.

**Example:**
```
/seo-generate-sitemap
```

**Expected Result:**
```
## Generate sitemap.xml

### Route Discovery
Scanning: src/routes/

### Routes Found
| Route | Type | Include |
|-------|------|---------|
| / | Static | ✓ |
| /about | Static | ✓ |
| /blog | Static | ✓ |
| /blog/$slug | Dynamic | ✓ (needs data) |
| /pricing | Static | ✓ |
| /login | Auth | ✗ |
| /register | Auth | ✗ |
| /dashboard/* | Protected | ✗ |

### Generated sitemap.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://my-app.com/</loc>
    <lastmod>2025-01-12</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://my-app.com/about</loc>
    <lastmod>2025-01-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://my-app.com/blog</loc>
    <lastmod>2025-01-12</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://my-app.com/pricing</loc>
    <lastmod>2025-01-05</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### File Created
✓ Created `public/sitemap.xml`

### Dynamic Routes
The following routes need data fetching for sitemap:
- /blog/$slug - Fetch all blog posts from database

Would you like to generate a dynamic sitemap route?
[Yes, create dynamic sitemap] [Keep static only]
```

---

#### `/seo-generate-favicons` - Set Up Favicons

Create complete favicon structure.

**Example:**
```
/seo-generate-favicons
```

**Expected Result:**
```
## Favicon Setup

### Current Status
- favicon.ico: ✗ Missing
- apple-touch-icon: ✗ Missing
- web manifest: ✗ Missing

### Source Image Required
Please provide a source image (512x512 PNG recommended):
? Source image path: ./assets/logo.png

### Generating Favicons
✓ favicon.ico (16x16, 32x32, 48x48)
✓ favicon-16x16.png
✓ favicon-32x32.png
✓ apple-touch-icon.png (180x180)
✓ android-chrome-192x192.png
✓ android-chrome-512x512.png
✓ site.webmanifest

### Files Created
```
public/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
├── android-chrome-192x192.png
├── android-chrome-512x512.png
└── site.webmanifest
```

### Meta Tags to Add
Add to your `<head>`:
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0ea5e9">
```

### Web Manifest
```json
{
  "name": "My App",
  "short_name": "MyApp",
  "icons": [
    { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#0ea5e9",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

✓ Favicon setup complete!
```

---

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
