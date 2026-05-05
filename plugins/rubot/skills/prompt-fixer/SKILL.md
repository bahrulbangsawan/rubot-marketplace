---
name: prompt-fixer
version: 3.3.0
description: |
  Rewrites vague prompts into a strict task-based execution plan (MAIN PROBLEM / GOALS / CONTEXT / mandatory RULES / numbered TASKs with ID, AGENT, ISSUES, FILE RELATED, SOLUTION / PARALLEL EXECUTION PLAN / VERIFICATION / EXECUTION). Runs parallel Explore agents, discovers connected MCPs, installed skills, and available subagents, analyzes tasks for parallel agent execution, recommends them, enforces engineering rules from rule banks, then asks the user to choose between task-list execution (TaskCreate + TodoWrite, parallel where possible), plan mode (EnterPlanMode), or cancel. Output is a single copy-ready prompt — no preamble, no commentary.
  MUST activate for: "fix my prompt", "improve this prompt", "rewrite this prompt", "make this prompt better", "this prompt is too vague", "help me write a better prompt", "prompt engineering", "how should I ask Claude to", "rephrase this for Claude", or when the user provides a clearly vague instruction and asks for help making it more specific.
  Also activate when: "Claude keeps doing the wrong thing", "Claude doesn't understand what I want", "how do I get better results", "why does Claude keep failing", or the user references the `/rubot-fix-prompt` command.
  Do NOT activate for: actually executing the rewritten prompt, general coding tasks, SEO audits, design audits, security audits, environment checks, or any task where the user wants implementation rather than prompt improvement.
  Covers: prompt rewriting, prompt engineering, vague-to-specific transformation, strict task-based output format, mandatory RULES enforcement, per-task AGENT assignment, parallel agent execution analysis, dependency-aware grouping, verification injection, file path scoping, phased execution, codebase-aware enrichment, skill recommendation, MCP recommendation, subagent recommendation, user-chosen execution (task list / plan mode / cancel), TodoWrite + TaskCreate orchestration with parallel fan-out.
agents:
  - debug-master
---

# Prompt Fixer Skill

Rewrite vague prompts into a strict, technical, todo-based instruction with mandatory engineering rules. Grounded in parallel codebase research. Single copy-ready output. No commentary.

## Goal

Produce a prompt that:
1. Names the problem in one sentence.
2. Lists measurable goals.
3. Surfaces installed skills, connected MCPs, and available subagents.
4. Enforces engineering rules from rule banks.
5. Decomposes work into numbered TASKs with stable IDs.
6. Pins each task to real files and concrete solutions.
7. Assigns an AGENT per task and analyzes which tasks can execute in parallel vs. sequentially.
8. Includes runnable verification.
9. Defers execution to the user via a 3-option `AskUserQuestion`: task-list execution (parallel where possible, sequential where dependent), plan mode, or cancel.

## Tool Strategy

### Discovery (run BEFORE rewriting, in parallel)

| Tool | Purpose |
|------|---------|
| `Agent` (`Explore`) | Codebase map: framework, paths, reference files |
| `Agent` (`Explore`) | Find similar existing implementation |
| `ListMcpResourcesTool` | Connected MCPs (figma, shadcn, notion, drive, sandbox) |
| `Bash` | List skills in `plugins/rubot/skills/`, `.claude/skills/`, `~/.claude/skills/` |
| `Bash` | List available subagents in `plugins/rubot/agents/`, `.claude/agents/`, `~/.claude/agents/` (for per-task `AGENT:` assignment) |
| `Read` | `package.json` / `wrangler.toml` / `pyproject.toml` |
| `WebFetch` | Doc/design URL only if user provided one |
| `TeamCreate` | Optional fan-out, requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |

### Decision (run AFTER displaying the rewritten prompt)

| Tool | Purpose |
|------|---------|
| `AskUserQuestion` | Single 3-option prompt: task-list execution / plan mode / cancel |

### Execution path A — task-list execution (with parallel fan-out)

| Tool | Purpose |
|------|---------|
| `TodoWrite` | One pending todo per `TASK-NNN` for visible progress; include `[GROUP N · AGENT: <name>]` prefix per todo so the parallel plan is visible |
| `TaskCreate` | Spawn one subagent per TASK-NNN with the full task body + RULES; **fan out parallel groups in a single message with multiple `TaskCreate` calls** |
| `TaskList` | Poll the queue when checking status |
| `TaskGet` | Inspect a specific task's output or final state |
| `TaskUpdate` | Adjust task scope or instructions mid-flight (rare) |
| `TaskStop` | Halt the active task on user interrupt |

### Execution path B — plan mode

| Tool | Purpose |
|------|---------|
| `EnterPlanMode` | Hand the rewritten prompt to plan mode and wait for approval |

Rules:
- Never invent file paths. Discovery is the only source.
- Never recommend skills that aren't installed.
- Never recommend MCPs that aren't connected.
- Never recommend subagents that aren't installed (verify against the discovery list).
- Never auto-enter plan mode and never auto-create tasks. The 3-option `AskUserQuestion` is mandatory.
- The `PARALLEL EXECUTION PLAN` block is mandatory. When a single task exists, list it as `Group 1 (sequential): TASK-001`. When multiple tasks exist, analyze dependencies and group them.

## Strict Output Format

Output ONLY this template inside a fenced code block. No preamble. No commentary.

```
MAIN PROBLEM: <one-sentence problem statement>

GOALS:
- <measurable outcome>
- <measurable outcome>
- <measurable outcome>

CONTEXT:
- Framework: <detected framework + version>
- Activate skills: `<skill1>`, `<skill2>`
- Use MCP: `<mcp>` via `<tool>` for <purpose>
- Available subagents: `<agent1>`, `<agent2>` (only those discovered)
- Reference: `<path>` (existing pattern to follow)

RULES:
- <universal rule>
- <universal rule>
- <domain rule, if applicable>
- <domain rule, if applicable>

1. <Imperative Title>
-> TASK ID: TASK-001
-> AGENT: <agent-name from discovery, e.g. general-purpose, Explore, frontend-master>
-> ISSUES: <specific symptom, current state, line numbers if known>
-> FILE RELATED: `<path>:<line-range>` or "new file: <path>"
-> SOLUTION: <technical, step-by-step; max 3 steps>

2. <Imperative Title>
-> TASK ID: TASK-002
-> AGENT: <agent-name>
-> ISSUES: <...>
-> FILE RELATED: <...>
-> SOLUTION: <...>

PARALLEL EXECUTION PLAN:
- Group 1 (parallel): TASK-001, TASK-002 — independent file scopes, no shared state
- Group 2 (sequential after Group 1): TASK-003 — depends on TASK-001 schema change
- Group 3 (parallel after Group 2): TASK-004, TASK-005 — independent once schema is in place

VERIFICATION:
- <test command / build check / screenshot diff / a11y scan>
- <metric or condition that confirms done>

EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).
```

After displaying the block, immediately call `AskUserQuestion` with the 3-option decision prompt (see "Decision Prompt" section).

### Format Rules (non-negotiable)

| Field | Rule |
|-------|------|
| `MAIN PROBLEM` | One sentence. Present tense. Names the gap. |
| `GOALS` | Bulleted. Measurable outcomes only. No "make it nicer." |
| `CONTEXT` | Omit empty lines. Drop block if all empty. `Available subagents` line lists ONLY agents discovered in `plugins/rubot/agents/`, `.claude/agents/`, or `~/.claude/agents/` (plus the always-available `general-purpose`, `Explore`, `Plan`). |
| `RULES` | **Mandatory.** Never omitted, never empty. Universal bank always included. Domain banks added by task signal. Minimum 4 rules. |
| Task numbering | Sequential from 1. |
| `TASK ID` | `TASK-NNN` zero-padded. Stable across edits. |
| `AGENT` | **Mandatory per task.** Single agent name from discovery. Default to `general-purpose` if no specialist matches. Use `Explore` for read-only analysis tasks. |
| Title | Imperative form ("Replace arbitrary values", not "Arbitrary values fix"). |
| `ISSUES` | Specific. Cite line numbers, current state, error text. |
| `FILE RELATED` | Real path. Line range when narrowable. `"new file: <path>"` when creating. |
| `SOLUTION` | Imperative. ≤3 steps. No prose paragraphs. |
| `PARALLEL EXECUTION PLAN` | **Mandatory.** Groups every TASK-NNN exactly once. Each group is either `(parallel)` (independent) or `(sequential after Group N)` (dependent). Single-task plans: one group, marked `(sequential)`. |
| `VERIFICATION` | At least one runnable check. |
| `EXECUTION` | Always the deferred line: `EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).` |
| Decision prompt | Mandatory `AskUserQuestion` call after the code block (see "Decision Prompt"). |

### Forbidden in Output

- `Original Prompt` section
- `Issues Identified` section
- `Why This Is Better` section
- Empty or missing `RULES` block
- Empty or missing `PARALLEL EXECUTION PLAN` block
- Missing `AGENT:` line on any task
- Any preamble, commentary, or explanation outside the template
- A custom `EXECUTION` line that auto-selects plan mode or task execution — the choice is always the user's via the decision prompt
- A `reply 'go' to execute.` closing line (replaced by the `AskUserQuestion` decision prompt)

## Decision Prompt (mandatory)

After emitting the rewritten prompt code block, call `AskUserQuestion` exactly once with these three options:

```
AskUserQuestion:
  question: "How do you want to proceed?"
  header: "Prompt Ready"
  options:
    - label: "Create tasks list and execute"
      description: "Convert TASK-NNN entries into TaskCreate/TodoWrite items and run them in order"
    - label: "Create plan using EnterPlanMode"
      description: "Enter plan mode, present the plan, and wait for approval before any code change"
    - label: "Cancel"
      description: "Stop here — keep the rewritten prompt only"
  multiSelect: false
```

### Branch — "Create tasks list and execute"

1. Call `TodoWrite` once with one `pending` todo per TASK-NNN.
   - `content` = `[GROUP N · AGENT: <agent>] <imperative title>` (e.g. `[GROUP 1 · AGENT: frontend-master] Replace arbitrary Tailwind values with tokens`).
   - `activeForm` = present-progressive form (e.g. `Replacing arbitrary Tailwind values with tokens`).
   - The group prefix makes the parallel plan visible to the user during execution.
2. Walk the `PARALLEL EXECUTION PLAN` group-by-group, in order:
   - For a `(parallel)` group: send **one message containing multiple `TaskCreate` calls** — one per TASK-NNN in the group, each using the per-task `AGENT` value as `subagent_type`. Wait for the entire group to finish before starting the next group.
   - For a `(sequential)` group or `(sequential after Group N)` group: send `TaskCreate` calls one at a time, each with its per-task `AGENT` value.
   - Each `TaskCreate` prompt = full task body (TASK ID + AGENT + ISSUES + FILE RELATED + SOLUTION) + the global RULES block.
3. Track progress:
   - Mark each TodoWrite item `in_progress` immediately before its `TaskCreate` fires and `completed` immediately after the agent reports success.
   - For parallel groups, multiple items may be `in_progress` at once — that is the point.
   - Use `TaskList` for queue overview, `TaskGet` for a specific task's output, `TaskUpdate` to adjust scope mid-flight.
4. On user interrupt or scope change, call `TaskStop` to halt the active task(s).
5. After the final group succeeds, run the `VERIFICATION` checks and report results.

### Branch — "Create plan using EnterPlanMode"

- Call `EnterPlanMode` and feed the rewritten prompt as plan input.
- The plan presented to the user MUST surface the `PARALLEL EXECUTION PLAN` block so they can see which tasks fan out and which run sequentially before approving.
- Wait for explicit plan approval before any code change.

### Branch — "Cancel"

- Stop. Do not call `TodoWrite`, `TaskCreate`, or `EnterPlanMode`.
- Leave the rewritten prompt visible so the user can copy it.

## Rule Banks

`RULES` is mandatory in every output. Assemble from these banks:

### Universal (always include)

- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- Fix root causes; never suppress errors.
- No regressions: existing tests must pass after every change.

### Frontend (add when task signal: UI / component / page / style / responsive / a11y)

- Follow the existing design system: tokens from `index.css` (colors, spacing, radius, typography). No arbitrary Tailwind values (`p-[13px]`, `text-[15px]`, `bg-[#aaa]`).
- Mobile-first responsive: design xs, scale up via sm/md/lg.
- WCAG 2.2 AA: ARIA on interactive elements, keyboard navigation, visible focus, contrast ≥4.5:1.
- UX visibility: render loading, error, empty, and success states explicitly — no silent failures.
- Reuse `shadcn/ui` primitives before building custom components.

### Backend (add when task signal: API / route / server / database)

- Validate all input at the boundary with Zod (or framework equivalent).
- Parameterized queries — never string-concatenated SQL.
- Secure cookies: `HttpOnly`, `Secure`, `SameSite=Lax|Strict`.
- Structured error responses — never leak stack traces.

### Security (add when task signal: auth / secrets / crypto)

- Constant-time comparison for secrets and password hashes.
- Never log secrets, tokens, or PII.
- Use platform crypto (`crypto.subtle`, `bcrypt`) — no hand-rolled crypto.

### Selection logic

- Universal → always.
- Frontend → triggered by: "UI", "component", "page", "style", "design", "responsive", "mobile", "Tailwind", "shadcn", "carousel", "card", "form", "modal", "accessibility", "a11y", "WCAG", "ARIA", "keyboard".
- Backend → triggered by: "API", "endpoint", "route", "server", "database", "schema", "migration", "query", "model".
- Security → triggered by: "auth", "login", "password", "session", "token", "secret", "crypto", "hash", "encrypt", "JWT", "OAuth".
- Multiple banks may apply — combine. Deduplicate overlapping rules.

## Transformation Patterns

### Pattern 1 — Verification

Encode "how do we know it's correct?" into the `VERIFICATION` block. Always runnable: test command, build, screenshot diff, axe-core, lighthouse, curl + grep, etc.

### Pattern 2 — Real Paths

Every `FILE RELATED` value must come from discovery. Add line ranges (`src/foo.ts:42-58`) when narrowable.

### Pattern 3 — Reference Pattern

The second Explore agent surfaces a similar implementation. Pin it in `CONTEXT.Reference` so Claude follows the existing convention.

### Pattern 4 — Symptom + Root-Cause Hint

`ISSUES` field: describe symptom + likely cause + observable trigger. Example: `"Login fails after 30min idle. Likely token-refresh race in src/auth/refresh.ts:88. Reproduces with backgrounded tab."`

### Pattern 5 — Phase via TASK Decomposition

Multi-file or architectural work → multiple TASKs. One TASK = one logical change. The numbered list IS the phased plan.

### Pattern 6 — Output Format Templating

When the deliverable is a report/config/structured output, embed the template inside the relevant `SOLUTION` block.

### Pattern 7 — Rich Context

In `ISSUES` or `SOLUTION`, use `@<path>` refs, paste error text, paste expected output. Use `[YOUR: ...]` placeholders for user-supplied context (screenshots, secrets, error logs).

### Pattern 8 — Recommend Installed Skills

Match task signal → skill from discovery list. Add to `CONTEXT.Activate skills`. Common matches:

| Task signal | Skill |
|-------------|-------|
| responsive, mobile, breakpoints, overflow | `responsive-design` |
| cards inconsistent, carousel broken, button drift | `component-consistency` |
| color tokens, `text-[15px]`, arbitrary values, OKLCH | `design-tokens` |
| accessibility, ARIA, keyboard, contrast, focus | `wcag-fix` |
| security audit, OWASP, vuln check | `owasp-asvs-audit` (or specific V1-V17) |
| SEO audit, meta tags | `seo-audit` |
| AI search, citability, GEO, llms.txt | `geo-audit` |
| Cloudflare Workers / DO / Agents SDK / queues | `workers-best-practices`, `durable-objects`, `agents-sdk`, `wrangler` |
| LCP, INP, CLS, "make it faster" | `web-perf`, `performance` |
| Figma-to-code, pixel-perfect | `figma-slicing` |
| `settings.json`, hooks, env, permissions | `update-config` |
| CLAUDE.md audit | `claude-md-improver` |
| Agentation feedback toolbar | `agentation` |

Skip if discovery did not surface the skill in the user's environment.

### Pattern 9 — Recommend Connected MCPs

Match task signal → MCP from `ListMcpResourcesTool` output. Add to `CONTEXT.Use MCP`. Common matches:

| Task signal | MCP + tool |
|-------------|------------|
| Figma node extraction, design handoff | `figma` MCP |
| shadcn component install / lookup | `shadcn` MCP (`get_add_command_for_items`, `view_items_in_registries`, `search_items_in_registries`) |
| Notion / Drive / Gmail / Calendar context | `claude_ai_Notion`, `claude_ai_Google_Drive`, `claude_ai_Gmail`, `claude_ai_Google_Calendar` |
| Sandboxed code execution | `Polar-Sandbox` MCP |

Skip if MCP not connected.

### Pattern 10 — User Chooses Execution

Always emit the deferred `EXECUTION:` line and the 3-option `AskUserQuestion` decision prompt. Do not auto-enter plan mode and do not auto-create tasks.

The user picks:
- **Create tasks list and execute** → `TodoWrite` + per-TASK `TaskCreate`, tracked via `TaskList` / `TaskGet` / `TaskUpdate` / `TaskStop`.
- **Create plan using EnterPlanMode** → `EnterPlanMode` with the rewritten prompt as input.
- **Cancel** → no execution, prompt remains visible to copy.

For trivial single-line changes, the user typically picks "Cancel" and applies the edit themselves — but the choice is theirs, not yours.

### Pattern 11 — Parallel Agent Execution Analysis

Every rewrite analyzes which tasks can run in parallel and which must wait. The output reflects the decision in two places: the per-task `AGENT:` field and the `PARALLEL EXECUTION PLAN` block.

#### Step A — Assign an AGENT per task

Match the task signal to a discovered subagent. Default to `general-purpose` when no specialist matches. Common matches:

| Task signal | AGENT |
|-------------|-------|
| Read-only inspection / "find all X" / "where is Y" | `Explore` |
| UI / component / Tailwind / shadcn / responsive / a11y | `frontend-master` (or `shadcn-ui-designer`, `responsive-master`, `theme-master` — pick the most specific) |
| API / route / server / endpoint | `backend-master` |
| Database / schema / migration / Drizzle | `database-master` |
| Deployment / CI / Cloudflare / wrangler | `deployment-master` |
| Tests / Vitest / Playwright | `testing-master` |
| SEO / meta / structured data | `seo-master` |
| Bug hunt / root cause | `debug-master` |
| Anything else | `general-purpose` |

Only list agents the discovery step actually surfaced. Never invent.

#### Step B — Determine parallel-vs-sequential dependency

Two tasks can run in parallel when ALL of the following hold:
1. They edit disjoint files (no shared file path, no shared symbol).
2. Neither depends on the other's output (e.g. one creates a type that the other imports → sequential).
3. They do not share schema, route, or config state being mutated.

Tasks must run sequentially when:
1. Task B reads or extends Task A's new file/type/schema.
2. Tasks edit overlapping line ranges in the same file.
3. Task B's verification depends on Task A's change being live (e.g. migration first, then query update).

#### Step C — Group and emit `PARALLEL EXECUTION PLAN`

Group all TASK-NNN entries into ordered groups. Each task appears in exactly one group. Format:

```
PARALLEL EXECUTION PLAN:
- Group 1 (parallel): TASK-001, TASK-002 — independent file scopes
- Group 2 (sequential after Group 1): TASK-003 — consumes TASK-001 schema
- Group 3 (parallel after Group 2): TASK-004, TASK-005 — independent verification suites
```

Single-task plan:

```
PARALLEL EXECUTION PLAN:
- Group 1 (sequential): TASK-001
```

When in doubt about independence, default to sequential — false parallelism causes merge conflicts and broken builds. The reason ("independent file scopes", "consumes TASK-001 schema", "shared route handler") goes inline so reviewers can challenge the grouping.

#### Step D — Honor the plan during execution

When the user picks "Create tasks list and execute":
- Read `PARALLEL EXECUTION PLAN` group-by-group.
- For a parallel group → fan out TaskCreate in a single message with multiple tool calls.
- For a sequential group → fire TaskCreate calls one at a time.
- Never skip a group boundary — if Group 2 says "sequential after Group 1", wait for every Group 1 task to finish first.

When the user picks plan mode, the plan content must surface the parallel grouping so the user can review fan-out before approving.

## Examples

### Vague: `make the dashboard look better`

```
MAIN PROBLEM: Dashboard mixes hardcoded Tailwind values and inconsistent spacing across breakpoints, breaking visual hierarchy.

GOALS:
- All spacing/typography/radius values pulled from index.css tokens.
- Card grid renders consistently across xs/sm/md/lg breakpoints.
- No visual regressions vs. the current screenshot.

CONTEXT:
- Framework: Next.js 15 (App Router) + Tailwind CSS 4
- Activate skills: `design-tokens`, `responsive-design`, `component-consistency`
- Available subagents: `theme-master`, `responsive-master`, `shadcn-ui-designer`, `frontend-master`, `general-purpose`
- Reference: `src/components/widgets/HotDogWidget.tsx` (token-compliant pattern)

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- No regressions: existing tests must pass.
- Follow the existing design system: tokens from `index.css` (colors, spacing, radius, typography). No arbitrary Tailwind values (`p-[13px]`, `text-[15px]`, `bg-[#aaa]`).
- Mobile-first responsive: design xs, scale up via sm/md/lg.
- WCAG 2.2 AA: ARIA on interactive elements, keyboard navigation, visible focus, contrast ≥4.5:1.
- UX visibility: render loading, error, empty, and success states explicitly.
- Reuse `shadcn/ui` primitives before building custom components.

1. Replace arbitrary Tailwind values with tokens
-> TASK ID: TASK-001
-> AGENT: theme-master
-> ISSUES: src/pages/dashboard.tsx contains `p-[13px]`, `text-[15px]`, `rounded-[12px]` — bypasses --spacing/--font-sans/--radius.
-> FILE RELATED: `src/pages/dashboard.tsx:24-180`
-> SOLUTION:
   1. Replace arbitrary brackets with token classes (p-3, text-base, rounded-lg).
   2. Verify token names match index.css :root definitions.
   3. Run `bun run build` — no Tailwind warnings.

2. Align card grid breakpoints
-> TASK ID: TASK-002
-> AGENT: responsive-master
-> ISSUES: Cards collapse to 1 column at md but parent container stays at max-w-7xl, leaving dead space.
-> FILE RELATED: `src/pages/dashboard.tsx:62-95`
-> SOLUTION:
   1. Mobile-first grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3.
   2. Set container to max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8.
   3. Match HotDogWidget card padding pattern.

3. Normalize typography scale
-> TASK ID: TASK-003
-> AGENT: frontend-master
-> ISSUES: Heading levels jump h1 → h3 → h2 in dashboard sections.
-> FILE RELATED: `src/pages/dashboard.tsx:24-58`
-> SOLUTION:
   1. Reorder to h1 → h2 → h3.
   2. Apply existing text-display/text-heading/text-body classes.

PARALLEL EXECUTION PLAN:
- Group 1 (parallel): TASK-001, TASK-002, TASK-003 — all touch dashboard.tsx but on disjoint line ranges (24-180 token swap, 62-95 grid container, 24-58 heading order); each agent works on a different concern. Coordinate by writing back through the same TodoWrite list.
- Note: if line ranges overlap during execution, fall back to sequential — token swap first, then grid, then headings.

VERIFICATION:
- Take a screenshot before and after, diff side-by-side, list deltas.
- Run `bun run build` — exit 0.
- Run `bun run lint` — no new warnings.

EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).
```

### Vague: `add authentication`

```
MAIN PROBLEM: App has no auth — every route is public, no session handling, no logout.

GOALS:
- Email/password login at /login.
- Protected routes redirect unauthenticated users to /login.
- Server-side session with secure HttpOnly cookie.
- Tests cover login success, login failure, protected access while logged out, logout.

CONTEXT:
- Framework: Vite + React 19 + TanStack Router
- Activate skills: `owasp-authentication`, `owasp-session-management`
- Available subagents: `backend-master`, `frontend-master`, `database-master`, `testing-master`, `general-purpose`
- Reference: `src/routes/index.tsx` (existing route pattern)

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- Fix root causes; never suppress errors.
- No regressions: existing tests must pass.
- Validate all input at the boundary with Zod.
- Secure cookies: `HttpOnly`, `Secure`, `SameSite=Lax`.
- Structured error responses — never leak stack traces.
- Constant-time comparison for password hashes.
- Never log secrets, tokens, or PII.
- Use platform crypto (`bcrypt` for password hashing) — no hand-rolled crypto.

1. Define session storage schema
-> TASK ID: TASK-001
-> AGENT: backend-master
-> ISSUES: No session table or cookie infrastructure exists.
-> FILE RELATED: "new file: src/server/session.ts"
-> SOLUTION:
   1. Define Session = { id, userId, expiresAt }.
   2. Use HttpOnly + SameSite=Lax + Secure cookie named "sid".
   3. Rotate session on login.

2. Build /login route + form
-> TASK ID: TASK-002
-> AGENT: frontend-master
-> ISSUES: No login UI.
-> FILE RELATED: "new file: src/routes/login.tsx"
-> SOLUTION:
   1. Mirror src/routes/index.tsx route export pattern.
   2. POST handler validates credentials with Zod, sets cookie, redirects to /.
   3. Bcrypt password compare, constant-time.

3. Add route guard for protected paths
-> TASK ID: TASK-003
-> AGENT: frontend-master
-> ISSUES: All routes accessible without auth.
-> FILE RELATED: `src/router.tsx:18-44`
-> SOLUTION:
   1. Add beforeLoad guard that checks session cookie.
   2. Redirect to /login when missing/expired.
   3. Whitelist /login and /signup.

4. Logout endpoint
-> TASK ID: TASK-004
-> AGENT: backend-master
-> ISSUES: No way to invalidate session.
-> FILE RELATED: "new file: src/routes/logout.ts"
-> SOLUTION:
   1. POST /logout deletes session row + clears cookie.
   2. Redirect to /login.

PARALLEL EXECUTION PLAN:
- Group 1 (sequential): TASK-001 — defines the Session type and cookie helpers consumed by every other task.
- Group 2 (parallel after Group 1): TASK-002, TASK-004 — both consume the session helper but write to different new files (`src/routes/login.tsx`, `src/routes/logout.ts`).
- Group 3 (sequential after Group 2): TASK-003 — guards rely on /login and /logout existing before the redirect logic can be tested.

VERIFICATION:
- Run `bun run test src/server/session.test.ts` — all 4 cases pass.
- Manual: log in, refresh, access /dashboard, log out, attempt /dashboard → redirected.
- Run `bun run build` — exit 0.

EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).
```

### Vague: `fix the bug`

```
MAIN PROBLEM: [YOUR: paste symptom + reproduction steps + error text]

GOALS:
- Failing test reproduces the bug.
- Root cause fixed (not symptom suppressed).
- Test passes.
- Full suite still green.

CONTEXT:
- Framework: <detected>
- Available subagents: `debug-master`, `testing-master`, `general-purpose`
- Reference: `<file>` (likely origin from Explore agent)

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- Fix root causes; never suppress errors.
- No regressions: existing tests must pass.

1. Reproduce
-> TASK ID: TASK-001
-> AGENT: testing-master
-> ISSUES: Bug is not deterministically reproducible in tests.
-> FILE RELATED: "new file: <test path matching origin>"
-> SOLUTION:
   1. Write a failing test that triggers the symptom.
   2. Confirm it fails for the documented reason.

2. Fix root cause
-> TASK ID: TASK-002
-> AGENT: debug-master
-> ISSUES: <root cause hypothesis from Explore agent>
-> FILE RELATED: `<path>:<line>`
-> SOLUTION:
   1. Patch the underlying logic.
   2. No try/catch suppression.
   3. Add inline comment only if WHY is non-obvious.

PARALLEL EXECUTION PLAN:
- Group 1 (sequential): TASK-001 — establishes the failing test that anchors the fix.
- Group 2 (sequential after Group 1): TASK-002 — depends on TASK-001's test to verify the fix flips red → green.

VERIFICATION:
- Failing test from TASK-001 passes.
- `bun run test` — full suite green.

EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).
```

### Vague: `rename foo to bar in src/utils.ts`

```
MAIN PROBLEM: Identifier `foo` is misnamed and should be `bar` for clarity.

GOALS:
- All references updated, no dangling old name.

CONTEXT:
- Framework: <detected>
- Available subagents: `general-purpose`, `Explore`

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- No regressions: existing tests must pass.

1. Rename identifier
-> TASK ID: TASK-001
-> AGENT: general-purpose
-> ISSUES: `foo` exported from src/utils.ts and consumed by N callers.
-> FILE RELATED: `src/utils.ts` + all importers
-> SOLUTION:
   1. Rename declaration in src/utils.ts.
   2. Update all imports (rg "foo" -l).

PARALLEL EXECUTION PLAN:
- Group 1 (sequential): TASK-001 — single atomic rename, no fan-out possible.

VERIFICATION:
- `bun run build` — exit 0.
- `rg "foo" src/` — no matches.

EXECUTION: Awaiting user choice — task-list execution (parallel where independent, sequential where dependent), plan mode, or cancel (see prompt below).
```

## Anti-Patterns

- Don't invent file paths.
- Don't recommend uninstalled skills, unconnected MCPs, or undiscovered subagents.
- Don't auto-enter plan mode or auto-create tasks. Always show the 3-option decision prompt.
- Don't pad single-line tasks into multi-task plans.
- Don't include `Original Prompt` / `Issues Identified` / `Why This Is Better` — ever.
- Don't omit the `RULES` block — it is mandatory in every output.
- Don't omit the `AGENT:` field on any task — it drives parallel execution.
- Don't omit the `PARALLEL EXECUTION PLAN` block — even single-task plans must declare `Group 1 (sequential)`.
- Don't claim parallelism between tasks that touch the same file or share schema/types — default to sequential when uncertain.
- Don't write prose `SOLUTION` blocks. Imperative steps only.
- Don't use `ALWAYS` / `NEVER` excessively in `SOLUTION`. State the action.
- Don't skip `TodoWrite` when the user picks task-list execution — visible progress with `[GROUP N · AGENT: <name>]` prefixes is the point.
- Don't fan out parallel `TaskCreate` calls in separate messages — group them in a single message so they actually run concurrently.

## When NOT to Rewrite

| Prompt category | Action |
|-----------------|--------|
| Exploration ("what could we improve?") | Reply: open-ended is the point. Do not rewrite. |
| Learning ("explain how X works") | Reply: specificity would limit the answer. Do not rewrite. |
| Already-specific ("rename foo to bar in src/utils.ts") | Reply: `Prompt is already specific. No rewrite needed.` Stop. |

## References

- Tools Reference: https://code.claude.com/docs/en/tools-reference
- Best Practices: https://code.claude.com/docs/en/best-practices
- Subagents: https://code.claude.com/docs/en/sub-agents
- Common Workflows: https://code.claude.com/docs/en/common-workflows
