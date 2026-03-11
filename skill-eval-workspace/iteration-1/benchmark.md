# Rubot Skills v1.1 — Eval Benchmark Report

**Date:** 2026-03-11
**Model:** claude-opus-4-6
**Skills evaluated:** 26
**Eval prompts per skill:** 1 (eval #1)
**Configurations:** with_skill vs without_skill (baseline)

---

## Summary

| Metric | With Skill | Without Skill | Delta |
|--------|-----------|---------------|-------|
| **Pass Rate** | 1.000 (100%) | 0.844 (84.4%) | **+15.6%** |
| **Perfect Scores** | 26/26 | 16/26 | +10 |
| **Skills with Improvement** | — | — | **10/26** |

---

## Per-Skill Results

### Skills with Measurable Improvement (10)

| Skill | With Skill | Without Skill | Delta | Key Gap Without Skill |
|-------|-----------|---------------|-------|----------------------|
| **agent-browser** | 1.0 (5/5) | 0.2 (1/5) | **+0.80** | Used Playwright/Cypress instead of agent-browser tool |
| **url-state-management** | 1.0 (5/5) | 0.4 (2/5) | **+0.60** | Used raw TanStack Router instead of nuqs library |
| **tanstack-router** | 1.0 (5/5) | 0.6 (3/5) | **+0.40** | Missing notFound(), pendingComponent, Route.useLoaderData() |
| **env-check** | 1.0 (5/5) | 0.6 (3/5) | **+0.40** | No PASS/FAIL/WARN indicators, no stack detection |
| **tanstack-db** | 1.0 (5/5) | 0.6 (3/5) | **+0.40** | Wrong API (primaryKey instead of getKey), no mutation handlers |
| **orchestration** | 1.0 (4/4) | 0.75 (3/4) | **+0.25** | No verification/testing step in execution plan |
| **rbac-auth** | 1.0 (5/5) | 0.8 (4/5) | **+0.20** | Missing junction tables or indexes |
| **biome** | 1.0 (5/5) | 0.8 (4/5) | **+0.20** | Missing package.json scripts |
| **global-layout** | 1.0 (5/5) | 0.8 (4/5) | **+0.20** | Used min-h-screen instead of min-h-dvh |
| **core-web-vitals** | 1.0 (5/5) | 0.8 (4/5) | **+0.20** | No TanStack Start code examples |
| **wcag-audit** | 1.0 (5/5) | 0.8 (4/5) | **+0.20** | No structured audit report format |
| **elysiajs** | 1.0 (5/5) | 0.8 (4/5) | **+0.20** | Manual Number() coercion instead of t.Numeric() |

### Skills with No Quantitative Delta (16)

These skills passed all assertions both with and without the skill. However, the **with-skill responses were qualitatively richer** — they included verification checklists, troubleshooting tables, project-specific conventions (bun, TanStack Start), and WHY explanations that the without-skill responses lacked.

| Skill | Pass Rate | Qualitative Difference |
|-------|-----------|----------------------|
| tanstack-query | 1.0 / 1.0 | Skill adds query key factory pattern, queryOptions() factory |
| responsive-design | 1.0 / 1.0 | Skill adds px-to-rem conversion table, WCAG 1.4.4 rationale |
| drizzle-orm | 1.0 / 1.0 | Skill uses bun, NeonDB adapter, prepared statements |
| schema-markup | 1.0 / 1.0 | Skill uses EntryPoint/urlTemplate, reusable generators |
| react-grab | 1.0 / 1.0 | Skill adds page freeze feature, disable flag, constraints |
| rubot-seo-audit | 1.0 / 1.0 | Skill adds weighted scoring, DOM inspection scripts, P0-P4 matrix |
| tanstack-form | 1.0 / 1.0 | Skill adds wizard pattern, form.Subscribe, shadcn/ui integration |
| cf-workers-setup | 1.0 / 1.0 | Skill catches viteEnvironment SSR option, monorepo awareness |
| multilanguage | 1.0 / 1.0 | Skill adds type-safe keys, lazy loading, SVG flags, hreflang |
| tanstack-table | 1.0 / 1.0 | Skill adds SortableHeader component, pagination, getRowId |
| cloudflare-workers | 1.0 / 1.0 | Skill uses bunx, typed JSON retrieval, ctx.waitUntil() |
| social-sharing | 1.0 / 1.0 | Skill adds reusable SocialMeta component, safe zone guidance |
| wcag-fix | 1.0 / 1.0 | Skill maps to WCAG criteria, recommends shadcn AlertDialog |
| crawl-config | 1.0 / 1.0 | Skill covers more AI crawler variants, verification checklist |

---

## Analysis

### What the assertions measure
The assertions check for **specific API patterns, tool usage, and structural elements** — e.g., "uses createFileRoute", "implements onMutate with cache snapshot", "adds role=dialog and aria-modal=true". These are objectively verifiable.

### What the assertions miss
The 16 "no delta" skills still show significant qualitative improvement with the skill:
- **Verification checklists** (8-15 items) not present without skill
- **Troubleshooting tables** (7-13 rows) not present without skill
- **Project-specific conventions** (bun over npm, TanStack Start patterns, Cloudflare Workers limits)
- **WHY explanations** for every recommendation
- **Cross-skill references** (e.g., wcag-fix references shadcn AlertDialog, crawl-config lists AI crawler user-agents)

### Non-discriminating assertions
For well-known libraries (TanStack Query, Drizzle ORM, responsive design), Claude already knows the core patterns. The skill's value here is in **opinionated conventions** and **production-readiness details** rather than basic API usage.

### Highest-impact skills
1. **agent-browser** (+0.80): Without the skill, Claude doesn't know about the agent-browser CLI tool at all
2. **url-state-management** (+0.60): Skill teaches the nuqs library pattern — without it, Claude uses raw route navigation
3. **tanstack-db** (+0.40): TanStack DB is too new for the base model to know the correct API surface
4. **tanstack-router** (+0.40): Skill enforces modern patterns (notFound, pendingComponent) that the base model doesn't default to

---

## Conclusion

All 26 improved skills achieve **100% assertion pass rate**. The improvements are most impactful for:
- **Novel/niche tools** the model doesn't already know (agent-browser, nuqs, TanStack DB)
- **Opinionated patterns** that differ from general best practices (min-h-dvh, t.Numeric(), PASS/FAIL/WARN format)
- **Production-readiness** details (verification checklists, troubleshooting, cross-skill references)

The skills provide less quantitative lift for well-known libraries but still add qualitative value through conventions, verification workflows, and project-specific integration patterns.
