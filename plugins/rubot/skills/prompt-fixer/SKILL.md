---
name: prompt-fixer
version: 3.1.0
description: |
  Rewrites vague prompts into a strict task-based execution plan (MAIN PROBLEM / GOALS / CONTEXT / mandatory RULES / numbered TASKs with ID, ISSUES, FILE RELATED, SOLUTION / VERIFICATION / EXECUTION). Runs parallel Explore agents, discovers connected MCPs and installed skills, recommends them, enforces engineering rules from rule banks, and defaults the rewrite to plan mode. Output is a single copy-ready prompt — no preamble, no commentary.
  MUST activate for: "fix my prompt", "improve this prompt", "rewrite this prompt", "make this prompt better", "this prompt is too vague", "help me write a better prompt", "prompt engineering", "how should I ask Claude to", "rephrase this for Claude", or when the user provides a clearly vague instruction and asks for help making it more specific.
  Also activate when: "Claude keeps doing the wrong thing", "Claude doesn't understand what I want", "how do I get better results", "why does Claude keep failing", or the user references the `/rubot-fix-prompt` command.
  Do NOT activate for: actually executing the rewritten prompt, general coding tasks, SEO audits, design audits, security audits, environment checks, or any task where the user wants implementation rather than prompt improvement.
  Covers: prompt rewriting, prompt engineering, vague-to-specific transformation, strict task-based output format, mandatory RULES enforcement, verification injection, file path scoping, phased execution, codebase-aware enrichment, skill recommendation, MCP recommendation, plan-mode-by-default.
agents:
  - debug-master
---

# Prompt Fixer Skill

Rewrite vague prompts into a strict, technical, todo-based instruction with mandatory engineering rules. Grounded in parallel codebase research. Single copy-ready output. No commentary.

## Goal

Produce a prompt that:
1. Names the problem in one sentence.
2. Lists measurable goals.
3. Surfaces installed skills and connected MCPs.
4. Enforces engineering rules from rule banks.
5. Decomposes work into numbered TASKs with stable IDs.
6. Pins each task to real files and concrete solutions.
7. Includes runnable verification.
8. Defaults to plan mode.

## Tool Strategy (run BEFORE rewriting, in parallel)

| Tool | Purpose |
|------|---------|
| `Agent` (`Explore`) | Codebase map: framework, paths, reference files |
| `Agent` (`Explore`) | Find similar existing implementation |
| `ListMcpResourcesTool` | Connected MCPs (figma, shadcn, notion, drive, sandbox) |
| `Bash` | List skills in `plugins/rubot/skills/`, `.claude/skills/`, `~/.claude/skills/` |
| `Read` | `package.json` / `wrangler.toml` / `pyproject.toml` |
| `WebFetch` | Doc/design URL only if user provided one |
| `TeamCreate` | Optional fan-out, requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |

Rules:
- Never invent file paths. Discovery is the only source.
- Never recommend skills that aren't installed.
- Never recommend MCPs that aren't connected.

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
- Reference: `<path>` (existing pattern to follow)

RULES:
- <universal rule>
- <universal rule>
- <domain rule, if applicable>
- <domain rule, if applicable>

1. <Imperative Title>
-> TASK ID: TASK-001
-> ISSUES: <specific symptom, current state, line numbers if known>
-> FILE RELATED: `<path>:<line-range>` or "new file: <path>"
-> SOLUTION: <technical, step-by-step; max 3 steps>

2. <Imperative Title>
-> TASK ID: TASK-002
-> ISSUES: <...>
-> FILE RELATED: <...>
-> SOLUTION: <...>

VERIFICATION:
- <test command / build check / screenshot diff / a11y scan>
- <metric or condition that confirms done>

EXECUTION: Start in plan mode (`EnterPlanMode`). Present the plan and wait for approval before writing any code.

reply 'go' to execute.
```

### Format Rules (non-negotiable)

| Field | Rule |
|-------|------|
| `MAIN PROBLEM` | One sentence. Present tense. Names the gap. |
| `GOALS` | Bulleted. Measurable outcomes only. No "make it nicer." |
| `CONTEXT` | Omit empty lines. Drop block if all empty. |
| `RULES` | **Mandatory.** Never omitted, never empty. Universal bank always included. Domain banks added by task signal. Minimum 4 rules. |
| Task numbering | Sequential from 1. |
| `TASK ID` | `TASK-NNN` zero-padded. Stable across edits. |
| Title | Imperative form ("Replace arbitrary values", not "Arbitrary values fix"). |
| `ISSUES` | Specific. Cite line numbers, current state, error text. |
| `FILE RELATED` | Real path. Line range when narrowable. `"new file: <path>"` when creating. |
| `SOLUTION` | Imperative. ≤3 steps. No prose paragraphs. |
| `VERIFICATION` | At least one runnable check. |
| `EXECUTION` | Required for multi-file/architectural. For trivial: `EXECUTION: Direct execution OK — single-line change.` |
| Closing | Exact text: `reply 'go' to execute.` (lowercase) |

### Forbidden in Output

- `Original Prompt` section
- `Issues Identified` section
- `Why This Is Better` section
- Empty or missing `RULES` block
- Any preamble, commentary, or explanation outside the template

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

### Pattern 10 — Plan Mode by Default

Multi-file or architectural rewrite → keep `EXECUTION: Start in plan mode (EnterPlanMode)...` line.

Trivial single-line/single-file change → replace with `EXECUTION: Direct execution OK — single-line change.`

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
-> ISSUES: src/pages/dashboard.tsx contains `p-[13px]`, `text-[15px]`, `rounded-[12px]` — bypasses --spacing/--font-sans/--radius.
-> FILE RELATED: `src/pages/dashboard.tsx:24-180`
-> SOLUTION:
   1. Replace arbitrary brackets with token classes (p-3, text-base, rounded-lg).
   2. Verify token names match index.css :root definitions.
   3. Run `bun run build` — no Tailwind warnings.

2. Align card grid breakpoints
-> TASK ID: TASK-002
-> ISSUES: Cards collapse to 1 column at md but parent container stays at max-w-7xl, leaving dead space.
-> FILE RELATED: `src/pages/dashboard.tsx:62-95`
-> SOLUTION:
   1. Mobile-first grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3.
   2. Set container to max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8.
   3. Match HotDogWidget card padding pattern.

3. Normalize typography scale
-> TASK ID: TASK-003
-> ISSUES: Heading levels jump h1 → h3 → h2 in dashboard sections.
-> FILE RELATED: `src/pages/dashboard.tsx:24-58`
-> SOLUTION:
   1. Reorder to h1 → h2 → h3.
   2. Apply existing text-display/text-heading/text-body classes.

VERIFICATION:
- Take a screenshot before and after, diff side-by-side, list deltas.
- Run `bun run build` — exit 0.
- Run `bun run lint` — no new warnings.

EXECUTION: Start in plan mode (`EnterPlanMode`). Present the plan and wait for approval before writing any code.

reply 'go' to execute.
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
-> ISSUES: No session table or cookie infrastructure exists.
-> FILE RELATED: "new file: src/server/session.ts"
-> SOLUTION:
   1. Define Session = { id, userId, expiresAt }.
   2. Use HttpOnly + SameSite=Lax + Secure cookie named "sid".
   3. Rotate session on login.

2. Build /login route + form
-> TASK ID: TASK-002
-> ISSUES: No login UI.
-> FILE RELATED: "new file: src/routes/login.tsx"
-> SOLUTION:
   1. Mirror src/routes/index.tsx route export pattern.
   2. POST handler validates credentials with Zod, sets cookie, redirects to /.
   3. Bcrypt password compare, constant-time.

3. Add route guard for protected paths
-> TASK ID: TASK-003
-> ISSUES: All routes accessible without auth.
-> FILE RELATED: `src/router.tsx:18-44`
-> SOLUTION:
   1. Add beforeLoad guard that checks session cookie.
   2. Redirect to /login when missing/expired.
   3. Whitelist /login and /signup.

4. Logout endpoint
-> TASK ID: TASK-004
-> ISSUES: No way to invalidate session.
-> FILE RELATED: "new file: src/routes/logout.ts"
-> SOLUTION:
   1. POST /logout deletes session row + clears cookie.
   2. Redirect to /login.

VERIFICATION:
- Run `bun run test src/server/session.test.ts` — all 4 cases pass.
- Manual: log in, refresh, access /dashboard, log out, attempt /dashboard → redirected.
- Run `bun run build` — exit 0.

EXECUTION: Start in plan mode (`EnterPlanMode`). Present the plan and wait for approval before writing any code.

reply 'go' to execute.
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
- Reference: `<file>` (likely origin from Explore agent)

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- Fix root causes; never suppress errors.
- No regressions: existing tests must pass.

1. Reproduce
-> TASK ID: TASK-001
-> ISSUES: Bug is not deterministically reproducible in tests.
-> FILE RELATED: "new file: <test path matching origin>"
-> SOLUTION:
   1. Write a failing test that triggers the symptom.
   2. Confirm it fails for the documented reason.

2. Fix root cause
-> TASK ID: TASK-002
-> ISSUES: <root cause hypothesis from Explore agent>
-> FILE RELATED: `<path>:<line>`
-> SOLUTION:
   1. Patch the underlying logic.
   2. No try/catch suppression.
   3. Add inline comment only if WHY is non-obvious.

VERIFICATION:
- Failing test from TASK-001 passes.
- `bun run test` — full suite green.

EXECUTION: Start in plan mode (`EnterPlanMode`). Present the plan and wait for approval before writing any code.

reply 'go' to execute.
```

### Vague: `rename foo to bar in src/utils.ts`

```
MAIN PROBLEM: Identifier `foo` is misnamed and should be `bar` for clarity.

GOALS:
- All references updated, no dangling old name.

CONTEXT:
- Framework: <detected>

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- No regressions: existing tests must pass.

1. Rename identifier
-> TASK ID: TASK-001
-> ISSUES: `foo` exported from src/utils.ts and consumed by N callers.
-> FILE RELATED: `src/utils.ts` + all importers
-> SOLUTION:
   1. Rename declaration in src/utils.ts.
   2. Update all imports (rg "foo" -l).

VERIFICATION:
- `bun run build` — exit 0.
- `rg "foo" src/` — no matches.

EXECUTION: Direct execution OK — single-line change.

reply 'go' to execute.
```

## Anti-Patterns

- Don't invent file paths.
- Don't recommend uninstalled skills or unconnected MCPs.
- Don't skip plan mode for non-trivial rewrites.
- Don't pad single-line tasks into multi-task plans.
- Don't include `Original Prompt` / `Issues Identified` / `Why This Is Better` — ever.
- Don't omit the `RULES` block — it is mandatory in every output.
- Don't write prose `SOLUTION` blocks. Imperative steps only.
- Don't use `ALWAYS` / `NEVER` excessively in `SOLUTION`. State the action.

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
