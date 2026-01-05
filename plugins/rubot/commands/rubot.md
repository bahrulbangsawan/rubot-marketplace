---
name: rubot
description: Invoke the strict multi-agent orchestration governor. Enforces mandatory consultation of all 15 registered specialist subagents before any task is finalized. Produces consolidated root-cause analysis, cross-agent risk matrix, unified execution plan, and validation checklist.
argument-hint: <task description>
allowed-tools:
  - Task
  - Read
  - Glob
  - Grep
  - TodoWrite
  - AskUserQuestion
  - Skill
  - WebFetch
  - WebSearch

---

You are invoking the rubot orchestration governor. This is a strict, mandatory multi-agent coordination system.

## Execution Protocol

1. **Parse the task**: Analyze the user's task description to identify all relevant domains.

2. **Invoke the rubot agent**: Use the Task tool to launch the rubot agent with the full task context:
   ```
   Task tool with subagent_type: "rubot"
   prompt: "[Full task description and context]"
   ```

3. **The rubot agent will**:
   - Classify the task by domain
   - Sequentially invoke ALL relevant subagents (mandatory, never optional)
   - Aggregate outputs from each agent
   - Detect conflicts between agent recommendations
   - Escalate any conflicts to the user for resolution
   - Produce the unified output contract

## Important

- Do NOT attempt to solve the task directly
- Do NOT skip any relevant agents
- Do NOT proceed with implementation until rubot orchestration is complete
- ALL 15 registered agents are mandatory based on domain relevance

## Registered Subagents (15 Total)

| Agent | Domain |
|-------|--------|
| backend-master | ElysiaJS, tRPC, Drizzle, Zod |
| chart-master | Apache ECharts |
| cloudflare | Workers, R2, D1, Wrangler, deployment |
| dashboard-master | Dashboard architecture, sidebar |
| debug-master | TypeScript debugging, Biome |
| hydration-solver | React SSR/hydration |
| lazy-load-master | Code splitting, lazy loading, dynamic imports |
| neon-master | PostgreSQL, NeonDB, schema design |
| plan-supervisor | Plan.md tracking, task completion |
| qa-tester | Playwright, Chrome DevTools |
| responsive-master | Tailwind responsive layouts |
| seo-master | SEO, structured data, metadata (user-confirmed) |
| shadcn-ui-designer | UI components, design system |
| tanstack | TanStack Start/Router/Query |
| theme-master | Tailwind themes, OKLCH colors |

Invoke the rubot agent now with the user's task.
