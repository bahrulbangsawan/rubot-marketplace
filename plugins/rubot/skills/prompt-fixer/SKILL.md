---
name: prompt-fixer
version: 3.13.0
description: |
  **Defaults to a Claude Code dynamic workflow** (`.claude/workflows/fix-prompt.js`) — a 4-phase adversarial pipeline (analysis → parallel candidate generation → adversarial cross-review → synthesis) that fans the rewrite across parallel subagents and returns one consolidated prompt; pass `--simple`/`--no-workflow` for the inline turn-by-turn flow. Dynamic workflows consume meaningfully more tokens than a standard session and require Claude Code v2.1.154+. Rewrites vague prompts into a strict task-based execution plan (MAIN PROBLEM / GOALS / CONTEXT / mandatory RULES / numbered TASKs with ID, AGENT, USE, ISSUES, FILE RELATED, SOLUTION / PARALLEL EXECUTION PLAN / VERIFICATION / EXECUTION) that is **OWASP ASVS 5.0.0 compliant**, **mobile-first responsive by default**, **TanStack-standard by default** (Router with automatic code splitting + Query with optimistic UI + DB for local-first state), **React Doctor-gated** (mandatory `npx react-doctor@latest --fail-on warning` scan after every React change), enforces **mandatory skill detection** via the Step 0-verified `@tanstack/intent` loader and `load <package>#<skill>` before substantial work, requires **validation & commit hooks** (lint/typecheck/test/build/format/react-doctor) after every phase, and emits a **canonical final REPORT block** (TITLE / Agent / Skills Loaded / Files Changed / CHANGES / VALIDATION / DEFERRED / DONE) after task-list execution. Runs parallel Explore agents, discovers connected MCPs, installed skills, validation hooks, and available subagents, **matches each discovered skill and MCP to specific task signals**, embeds explicit `Use skills: …` and `Use MCP: …` directives in CONTEXT, and adds a per-task `USE:` field telling the agent exactly which skills/MCPs to load for that task (e.g. "Use Cloudflare skills and MCP"). Analyzes tasks for parallel agent execution, enforces engineering rules from rule banks (Universal + Frontend/Responsive + Backend + TanStack + Security with V1-V17 chapter mappings), applies blocking rewrite gates before output, then — on the user's go — **creates the task list like before (TaskCreate/TaskUpdate/TaskList) and executes it via a second dynamic workflow** (`.claude/workflows/execute-tasks.js`) that fans each PARALLEL EXECUTION PLAN group across subagents, runs VERIFICATION + React Doctor, and returns the canonical REPORT. The only post-rewrite choices are **execute** or **cancel** — **there is no plan mode**. Output of the rewrite step is a single copy-ready prompt — no preamble, no commentary. The `rubot-fix-prompt` command halts if the OWASP ASVS 5.0.0 skill suite, `responsive-design`, the `@tanstack/intent` loader, or React Doctor in React projects is unavailable.
  MUST activate for: "fix my prompt", "improve this prompt", "rewrite this prompt", "make this prompt better", "this prompt is too vague", "help me write a better prompt", "prompt engineering", "how should I ask Claude to", "rephrase this for Claude", or when the user provides a clearly vague instruction and asks for help making it more specific.
  Also activate when: "Claude keeps doing the wrong thing", "Claude doesn't understand what I want", "how do I get better results", "why does Claude keep failing", or the user references the `/rubot-fix-prompt` command.
  Do NOT activate for: actually executing the rewritten prompt, general coding tasks, SEO audits, design audits, security audits, environment checks, or any task where the user wants implementation rather than prompt improvement.
  Covers: prompt rewriting, prompt engineering, vague-to-specific transformation, strict task-based output format, mandatory RULES enforcement, OWASP ASVS 5.0.0 V1-V17 chapter rule mapping, mobile-first responsive enforcement, per-task AGENT assignment, parallel agent execution analysis, dependency-aware grouping, verification injection, file path scoping, phased execution, codebase-aware enrichment, skill recommendation, MCP recommendation, subagent recommendation, user-chosen execution (create-tasks-and-execute / cancel — no plan mode), task-list creation via the TaskCreate/TaskUpdate/TaskList queue, parallel subagent fan-out via the `execute-tasks` dynamic workflow, terse one-line progress narration.
agents:
  - debug-master
  - owasp-asvs-audit
  - responsive-master
---

# Prompt Fixer Skill

Rewrite vague prompts into a strict, technical, task-based instruction with mandatory engineering rules. Grounded in parallel codebase research. Single copy-ready output. No commentary.

## Goal

Produce a prompt that:
1. Names the problem in one sentence.
2. Lists measurable goals.
3. Surfaces installed skills, connected MCPs, and available subagents — **matches each one to the prompt's task signals** and explicitly tells the executing agent to USE them (e.g. "Use Cloudflare skills and MCP", "Use PostHog MCP via `query-run`").
4. Enforces engineering rules from rule banks — **OWASP ASVS 5.0.0 (V1-V17) for any security-touching task; mobile-first responsive for any UI-touching task**.
5. Decomposes work into numbered TASKs with stable IDs.
6. Pins each task to real files and concrete solutions.
7. Assigns an AGENT per task, lists the skills + MCPs to invoke via the per-task `USE:` field, and analyzes which tasks can execute in parallel vs. sequentially.
8. Includes runnable verification.
9. Defers execution to the user via a 2-option `AskUserQuestion`: **create the task list and execute it via the `execute-tasks` workflow** (parallel where possible, sequential where dependent), or cancel. **No plan mode.**

## Default Execution: Dynamic Workflow

The `rubot-fix-prompt` command runs this skill **as a Claude Code dynamic workflow by default** — a JavaScript orchestration script saved at `.claude/workflows/fix-prompt.js` (project-level, version-controlled). The workflow fans the rewrite out across parallel subagents, keeps every intermediate result in script variables, and returns a single consolidated prompt. It also installs as a standalone `/fix-prompt` slash command.

> ⚠️ **Token-cost notice.** A dynamic workflow spawns many subagents, so a single run consumes **meaningfully more tokens** than a standard turn-by-turn session. Use the `--simple` / `--no-workflow` override for trivial, single-line fixes.

### Why a workflow

Moving the plan into a script lets the rewrite apply a **repeatable quality pattern**, not just run more agents: independent agents generate candidate rewrites from different angles, then other agents adversarially refute and score each candidate before synthesis — a more trustworthy result than a single pass.

### Phases

| Phase | What happens | Fan-out |
|-------|--------------|---------|
| 1 — Analysis | Parse intent, target model, constraints, failure modes; discover codebase paths, installed skills, connected MCPs, subagents, validation commands. | parallel (analysis + discovery) |
| 2 — Generation | Produce N independent candidate rewrites across distinct strategies (minimal / comprehensive / parallel-first / guardrail / reference-led / verification-led). | parallel (one agent per strategy) |
| 3 — Adversarial Review | Independent agents refute and score each candidate against the analysis criteria; flag hallucinated paths/skills, missing mandatory rules, unsafe parallelism. | pipeline (review starts as each candidate lands) |
| 4 — Synthesis | Converge on ONE final prompt: strongest base + best grafts from runners-up, every defect removed. Output copy-ready markdown. | single agent |

The final prompt follows the same Strict Output Format below, wrapped in a fenced markdown code block.

### Two workflows: rewrite, then execute

The command is backed by **two** version-controlled dynamic workflows that run at different moments:

1. **Rewrite** — `.claude/workflows/fix-prompt.js` (the 4-phase pipeline above). Runs first: vague prompt → strict-format plan.
2. **Execute** — `.claude/workflows/execute-tasks.js`. Runs only after the user picks "Create tasks list and execute". The command first **creates the task list like before** (`TaskCreate`, one item per TASK-NNN), then hands the **full rewritten prompt** to this workflow as `args`. It runs four phases and returns the finished REPORT:

   | Phase | What happens | Fan-out |
   |-------|--------------|---------|
   | 1 — Parse | One agent turns the strict-format prompt into a structured plan (tasks + groups + rules + verification). | single agent |
   | 2 — Execute | Walk the `PARALLEL EXECUTION PLAN` group-by-group; one real subagent per TASK-NNN (its per-task `AGENT`) loads its `USE:` skills and edits files in scope. | parallel groups concurrently, sequential groups in order |
   | 3 — Verify | Run the `VERIFICATION` checks + react-doctor once globally; record each as `PASS` / `FAIL` / `NOT RUN`. | single agent |
   | 4 — Report | Assemble the canonical Pattern 13 REPORT from the task + validation results. | deterministic (no agent) |

The execution decision is a clean handoff between the two workflows in the main session — **never a mid-run prompt**, and **never plan mode**.

### Override — inline (non-workflow) flow

Pass `--simple` (or its alias `--no-workflow`) to skip the workflow and run the inline turn-by-turn rewrite (the command's Steps 1–5) in the current session. Lowest token cost — best for trivial fixes. The command also falls back to the inline flow automatically when dynamic workflows are unavailable (disabled, or Claude Code < v2.1.154).

### Runtime constraints

- Requires **Claude Code v2.1.154 or later**, dynamic workflows enabled (research preview; `/config`).
- Up to **16 concurrent agents**, **1,000 agents per run**.
- **No mid-run user input** — the create-tasks-and-execute / cancel decision is emitted AFTER the rewrite workflow returns, in the main session. There is no plan mode.
- **Resumable within the same session.**

### Persistence

Both workflow scripts live under `.claude/workflows/` (`fix-prompt.js` for the rewrite, `execute-tasks.js` for the execution) and are committed with the repo so the orchestration is reusable and reviewable. Personal/global fallbacks live at `~/.claude/workflows/`. Editing a script changes the default behavior for everyone who clones the project.

## Prerequisites

The `rubot-fix-prompt` command **halts before Step 1** if the OWASP ASVS 5.0.0 skill suite is not installed. Required skills:

| Skill | Chapter |
|-------|---------|
| `owasp-asvs-audit` | Master orchestrator |
| `owasp-encoding-sanitization` | V1 — Encoding & Sanitization |
| `owasp-validation-logic` | V2 — Validation Logic |
| `owasp-web-frontend-security` | V3 — Web Frontend Security |
| `owasp-api-security` | V4 — API & Web Service Security |
| `owasp-file-handling` | V5 — File Handling |
| `owasp-authentication` | V6 — Authentication |
| `owasp-session-management` | V7 — Session Management |
| `owasp-authorization` | V8 — Authorization |
| `owasp-self-contained-tokens` | V9 — Self-Contained Tokens |
| `owasp-oauth-oidc` | V10 — OAuth & OIDC |
| `owasp-cryptography` | V11 — Cryptography |
| `owasp-secure-communication` | V12 — Secure Communication |
| `owasp-configuration-security` | V13 — Configuration Security |
| `owasp-data-protection` | V14 — Data Protection |
| `owasp-secure-coding` | V15 — Secure Coding & Architecture |
| `owasp-security-logging` | V16 — Security Logging & Error Handling |
| `owasp-webrtc-security` | V17 — WebRTC Security |

Recommended (non-blocking) for UI tasks: `responsive-design`, `wcag-fix`, `design-tokens`, `component-consistency`.

Install missing skills with:

```bash
npx @bahrulbangsawan/rubot add owasp-asvs-audit owasp-encoding-sanitization owasp-validation-logic owasp-web-frontend-security owasp-api-security owasp-file-handling owasp-authentication owasp-session-management owasp-authorization owasp-self-contained-tokens owasp-oauth-oidc owasp-cryptography owasp-secure-communication owasp-configuration-security owasp-data-protection owasp-secure-coding owasp-security-logging owasp-webrtc-security responsive-design
```

## Tool Strategy

### Discovery (run BEFORE rewriting, in parallel)

| Tool | Purpose |
|------|---------|
| `Agent` (`Explore`) | Codebase map: framework, paths, reference files |
| `Agent` (`Explore`) | Find similar existing implementation |
| `ListMcpResourcesTool` | **Connected MCPs (match each to prompt task signals)** — figma, shadcn, notion, drive, sandbox, cloudflare-docs, cloudflare-bindings, posthog, Neon, etc. |
| `Bash` | List skills in `plugins/rubot/skills/`, `.claude/skills/`, `~/.claude/skills/` — **match each to prompt task signals via Pattern 8** |
| `Bash` | List available subagents in `plugins/rubot/agents/`, `.claude/agents/`, `~/.claude/agents/` (for per-task `AGENT:` assignment) |
| `Read` | `package.json` / `wrangler.toml` / `pyproject.toml` |
| `WebFetch` | Doc/design URL only if user provided one |
| `TeamCreate` | Optional fan-out, requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |

**Skill/MCP relevance matching is mandatory.** After listing all installed skills and connected MCPs, for each one ask: *"does this skill/MCP help the executing agent perform any task in this rewrite?"* If yes, list it in `CONTEXT.Use skills:` / `CONTEXT.Use MCP:` with a one-line purpose, AND attach it to every matching task's `USE:` field. The output prompt must read like a directive: "Use Cloudflare skills and MCP", not a passive note.

### Decision (run AFTER displaying the rewritten prompt)

| Tool | Purpose |
|------|---------|
| `AskUserQuestion` | Single 2-option prompt: create-tasks-and-execute / cancel (**no plan mode**) |

### Execution — create the task list, then run the execution workflow

**Two roles.** `TaskCreate` & friends *track* (one queue item per TASK-NNN — like before). The `execute-tasks` dynamic workflow *executes* — it spawns one subagent per TASK-NNN group-by-group, verifies, and returns the REPORT.

| Tool | Role | Purpose |
|------|------|---------|
| `TaskCreate` | Track | Register one queue item per TASK-NNN (`subject` = imperative title; `description` = `[GROUP N · AGENT: <name>]` + task body) so the queue shows the parallel plan. Does NOT spawn. |
| `TaskUpdate` | Track | Encode the `PARALLEL EXECUTION PLAN` as a dependency graph (`addBlockedBy` / `addBlocks`); after the workflow returns, flip each status to `completed` / failed / deferred to match the result. |
| `TaskList` / `TaskGet` | Track | Inspect the queue / a specific task's full state. |
| `Workflow` | **Execute** | Run `.claude/workflows/execute-tasks.js` with the **full rewritten prompt** as `args`. It parses the plan, fans each group across subagents (parallel where independent, sequential where dependent), runs `VERIFICATION` + react-doctor, and returns the canonical REPORT. Track live progress via `/workflows`. |
| `TaskStop` | Halt | Stop tracked tasks on user interrupt (pair with stopping the workflow run). |

**Inline fallback (only when the `Workflow` tool, dynamic workflows, or the `execute-tasks.js` script are unavailable):** spawn subagents directly with `Agent`/`Task` (`subagent_type` = the per-task `AGENT`, `prompt` = full task body + RULES) — fan out a parallel group in a single message, run a sequential group one task at a time — then run verification and emit the REPORT yourself.

Rules:
- Never invent file paths. Discovery is the only source.
- Never recommend skills that aren't installed.
- Never recommend MCPs that aren't connected.
- Never recommend subagents that aren't installed (verify against the discovery list).
- Never auto-create-and-execute, and never enter plan mode. The 2-option `AskUserQuestion` (execute / cancel) is mandatory.
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
- Use skills: `<skill1>` (purpose), `<skill2>` (purpose) — agent MUST load these before executing matched tasks.
- Use MCP: `<mcp>` via `<tool>` for <purpose> — agent MUST call this MCP tool for matched tasks.
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
-> USE: skill `<skill-name>` (purpose), MCP `<mcp-name>` via `<tool>` (purpose) — agent must invoke these before SOLUTION steps.
-> ISSUES: <specific symptom, current state, line numbers if known>
-> FILE RELATED: `<path>:<line-range>` or "new file: <path>"
-> SOLUTION: <technical, step-by-step; max 3 steps; reference the USE skills/MCPs by name>

2. <Imperative Title>
-> TASK ID: TASK-002
-> AGENT: <agent-name>
-> USE: <skills + MCPs matched to this task, or "none" if discovery found no relevant match>
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

EXECUTION: Awaiting user choice — create the task list, then execute it via the execute-tasks workflow; or cancel (see prompt below).
```

After displaying the block, immediately call `AskUserQuestion` with the 2-option decision prompt (see "Decision Prompt" section).

### Format Rules (non-negotiable)

| Field | Rule |
|-------|------|
| `MAIN PROBLEM` | One sentence. Present tense. Names the gap. |
| `GOALS` | Bulleted. Measurable outcomes only. No "make it nicer." |
| `CONTEXT.Use skills` | **Imperative phrasing.** Format: `` `skill-name` (one-line purpose) ``. List only skills surfaced by discovery that match a task signal. Each skill must also appear in at least one task's `USE:` field. Omit the line if no skill matches. |
| `CONTEXT.Use MCP` | **Imperative phrasing.** Format: `` `mcp-name` via `tool-name` for <purpose> ``. List only MCPs surfaced by `ListMcpResourcesTool` that match a task signal. Each MCP must also appear in at least one task's `USE:` field. Omit the line if no MCP matches. |
| `CONTEXT` | Omit empty lines. Drop block if all empty. `Available subagents` line lists ONLY agents discovered in `plugins/rubot/agents/`, `.claude/agents/`, or `~/.claude/agents/` (plus the always-available `general-purpose`, `Explore`, `Plan`). |
| `RULES` | **Mandatory.** Never omitted, never empty. Universal bank always included. Domain banks added by task signal. Minimum 4 rules. |
| Task numbering | Sequential from 1. |
| `TASK ID` | `TASK-NNN` zero-padded. Stable across edits. |
| `AGENT` | **Mandatory per task.** Single agent name from discovery. Default to `general-purpose` if no specialist matches. Use `Explore` for read-only analysis tasks. |
| `USE` | **Mandatory per task.** Lists every skill + MCP from `CONTEXT` whose purpose matches this task. Format: `skill \`name\` (purpose), MCP \`mcp\` via \`tool\` (purpose)`. Write `"none"` only when discovery surfaced no relevant skill or MCP for this task. The agent loads these BEFORE running SOLUTION steps. |
| Title | Imperative form ("Replace arbitrary values", not "Arbitrary values fix"). |
| `ISSUES` | Specific. Cite line numbers, current state, error text. |
| `FILE RELATED` | Real path. Line range when narrowable. `"new file: <path>"` when creating. |
| `SOLUTION` | Imperative. ≤3 steps. No prose paragraphs. When `USE` lists a skill/MCP, reference it by name in at least one SOLUTION step (e.g. "Activate `design-tokens` skill, then …", "Query `cloudflare-docs` MCP for the binding pattern, then …"). |
| `PARALLEL EXECUTION PLAN` | **Mandatory.** Groups every TASK-NNN exactly once. Each group is either `(parallel)` (independent) or `(sequential after Group N)` (dependent). Single-task plans: one group, marked `(sequential)`. |
| `VERIFICATION` | At least one runnable check. |
| `EXECUTION` | Always the deferred line: `EXECUTION: Awaiting user choice — create the task list, then execute it via the execute-tasks workflow; or cancel (see prompt below).` |
| Decision prompt | Mandatory `AskUserQuestion` call after the code block (see "Decision Prompt"). |

### Forbidden in Output

- `Original Prompt` section
- `Issues Identified` section
- `Why This Is Better` section
- Empty or missing `RULES` block
- Empty or missing `PARALLEL EXECUTION PLAN` block
- Missing `AGENT:` line on any task
- **Missing `USE:` line on any task** — every task declares `USE:` (skills + MCPs, or `"none"` if discovery surfaced no relevant match).
- **A skill listed in `CONTEXT.Use skills` but not referenced by any task's `USE:` field** — every CONTEXT-listed skill must be tied to ≥1 task.
- **An MCP listed in `CONTEXT.Use MCP` but not referenced by any task's `USE:` field** — every CONTEXT-listed MCP must be tied to ≥1 task.
- **Passive phrasing of skill/MCP usage** — `CONTEXT` and `USE` lines must read like directives: "Use Cloudflare skills and MCP", not "Cloudflare skills may be helpful".
- A `USE:` field that lists a skill or MCP NOT present in the discovery output (Pattern 8 / Pattern 9 sources). No inventions.
- **Missing responsive rules when ANY task touches UI/component/page/style** — mobile-first, relative units, touch targets, and no-horizontal-scroll are non-negotiable for UI work.
- **Missing OWASP ASVS 5.0.0 chapter rules when ANY task touches a V1-V17 domain** — every Security rule must carry its `[Vn]` chapter prefix so reviewers can audit coverage.
- Generic Security rules without an ASVS chapter mapping (e.g. "use crypto" without `[V11]`).
- Any preamble, commentary, or explanation outside the template
- A custom `EXECUTION` line that auto-selects execution (or references plan mode) — the choice is always the user's via the decision prompt
- A `reply 'go' to execute.` closing line (replaced by the `AskUserQuestion` decision prompt)

## Decision Prompt (mandatory)

After emitting the rewritten prompt code block, call `AskUserQuestion` exactly once with these two options (**no plan mode**):

```
AskUserQuestion:
  question: "How do you want to proceed?"
  header: "Prompt Ready"
  options:
    - label: "Create tasks list and execute"
      description: "Register each TASK-NNN in the Task queue (like before), then execute the plan via the execute-tasks workflow"
    - label: "Cancel"
      description: "Stop here — keep the rewritten prompt only"
  multiSelect: false
```

### Branch — "Create tasks list and execute"

Two steps, in order. Narrate tersely — one short line per step. Do NOT use `TodoWrite`. Do NOT enter plan mode.

**Step 1 — Create the task list (TaskCreate, like before).** Register one queue item per TASK-NNN so the parallel plan is visible: `subject` = the imperative title; `description` = `[GROUP N · AGENT: <agent>]` + the full task body (TASK ID + AGENT + USE + ISSUES + FILE RELATED + SOLUTION). Mirror the `PARALLEL EXECUTION PLAN` as dependencies with `TaskUpdate` (`addBlockedBy`, so each later group waits on the prior group). `TaskCreate` spawns nothing — it only tracks. Emit ONE status line: `Task list created — N tasks across M groups`.

**Step 2 — Execute via the `execute-tasks` workflow.** Invoke the `Workflow` tool:
- `scriptPath:` — prefer `.claude/workflows/execute-tasks.js`; fall back to `~/.claude/workflows/execute-tasks.js`; if neither exists, use the inline fallback below.
- `args:` — the **full rewritten strict-format prompt** (the exact block shown to the user), as a string. The workflow re-parses it into tasks + groups + rules + verification.
- The script runs four phases — Parse → Execute (group-by-group, parallel where independent, sequential where dependent) → Verify (`VERIFICATION` + react-doctor, recorded `PASS`/`FAIL`/`NOT RUN`) → Report — and returns the finished REPORT.
- Emit ONE status line: `Executing tasks via workflow (4 phases) — track it with /workflows`. Narrate nothing else while it runs.

When the workflow returns, flip the Task queue to match the result with `TaskUpdate` (`completed` / failed / deferred), then **display the workflow's REPORT verbatim** as the final user-facing message — it already follows the canonical Pattern 13 `------------------- REPORT -------------------` … `------------------- DONE -------------------` structure. On user interrupt, call `TaskStop` and stop the workflow run.

**Inline fallback (only when the `Workflow` tool, dynamic workflows, or the `execute-tasks.js` script are unavailable):** print `Execution workflow unavailable — running tasks inline.`, then walk the `PARALLEL EXECUTION PLAN` group-by-group with the subagent spawner (`Agent`/`Task`, `subagent_type` = the per-task `AGENT`, `prompt` = full task body + RULES) — a parallel group in one message, a sequential group one task at a time, tracked via the Task queue. After the final group, run `VERIFICATION` + react-doctor (blocking completion gate), then emit the canonical Pattern 13 REPORT yourself.

### Branch — "Cancel"

- Stop. Do not call `TaskCreate`, `TaskUpdate`, or the execution workflow.
- Leave the rewritten prompt visible so the user can copy it.

## Progress Narration (terse)

Every status line emitted during Step 0 and execution is ONE short, informative line — no rationale, no per-agent breakdown. Keep the strict "Improved Prompt" block and the final REPORT exactly as specified; trim only the conversational narration around them.

| Moment | Emit (example) | Do NOT emit |
|--------|----------------|-------------|
| Step 0 passed | `Step 0 passed — all skills present ✅` | "…intent loader resolves, react-doctor available. The task touches UI, so I'll load responsive-design before discovery." |
| Starting a parallel group | `Execute Group 1 (Parallel)` | "Now I'll fan out Group 1 — TASK-001, TASK-002, TASK-004 — in a single message so they run concurrently. Each agent gets its full task body, the relevant RULES…" |
| Starting a sequential group | `Execute Group 2 (Sequential)` | a paragraph explaining the dependency chain |
| Group finished | `Group 1 done ✅` | a per-file recap — that belongs only in the final REPORT |

Do not explain *why* between tool calls — the plan already states the why.

## Rule Banks

`RULES` is mandatory in every output. Assemble from these banks:

### Universal (always include)

- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- Fix root causes; never suppress errors.
- No regressions: existing tests must pass after every change.
- **Mandatory skill detection (before substantial work)**: run the Step 0-verified `@tanstack/intent` loader (`bunx @tanstack/intent@latest list` or `npx -y @tanstack/intent@latest list`) to enumerate local project skills. If one local skill clearly matches the task, run `load <package>#<skill>` through the same loader and follow the returned `SKILL.md`. In monorepos, run the check from the workspace root and prefer the package-local skill. Multiple matches → pick the most specific local skill for the concern being changed.
- **Missing-skill halt**: if the required skill command, package, or local skill is unavailable, STOP immediately, surface what is missing + the install/setup command, and wait for the user to resolve it. Do not guess or invent skill instructions.
- **Validation & commit hooks (after every agent/phase)**: run every discovered project validation script and hook (`lint`, `typecheck`, `test`, `build`, format-check, pre-commit/pre-push hooks). Do not claim a check passed unless its command was actually run successfully. If a command fails, identify it, explain the cause, fix it if in scope, or record it as `FAIL` plus `DEFERRED` in the final report. Missing checks are not ignored; they are reported as `NOT RUN` with the reason.
- **React Doctor (MANDATORY for any React/Next.js/Vite/React Native project)**: Step 0 must verify `npx -y react-doctor@latest --version` resolves for React projects. Run `npx react-doctor@latest --fail-on warning` after every React-touching change, BEFORE the agent emits the final REPORT. The CLI scans state & effects, performance, architecture, security, and accessibility against a 0-100 health score (75+ Great, 50-74 Needs work, <50 Critical). For each diagnostic the CLI reports: read it, fix the root cause in scope, and re-run until exit 0. Use `--diff <base-branch>` in PR/branch mode to gate on net-new regressions only. Score < 50 is Critical and must be remediated before the task ends; score < 75 requires fixes unless the user explicitly accepts the regression. One-time agent rule-set install (recommended for new repos): `npx react-doctor@latest install` — teaches the executing agent the rule set so it stops emitting bad patterns in the first place. The agent MUST NOT declare a React task complete with unresolved react-doctor warnings.
- **Final structured report**: after all tasks finish, emit the canonical REPORT block (see Pattern 13 — Final Structured Report). It is mandatory whenever the user selects task-list execution, and task-list execution is incomplete until this block is the final user-facing message.
- **DON'T USE ANY GIT STASH COMMANDS** (`git stash`, `git stash push`, `git stash pop`, `git stash apply`, `git stash drop`, `git stash clear`). Stashed work is invisible, easy to lose, and conflates unrelated changes. If you need to set work aside, commit it to a scratch branch instead.

### Frontend & Responsive (add when task signal: UI / component / page / style / responsive / a11y) — MANDATORY for any UI task

- Follow the existing design system: tokens from `index.css` (colors, spacing, radius, typography). No arbitrary Tailwind values (`p-[13px]`, `text-[15px]`, `bg-[#aaa]`).
- **Mobile-first responsive (non-negotiable)**: design xs (375px) up; layer breakpoints sm (640px), md (768px), lg (1024px), xl (1280px). Never desktop-down.
- **Relative units only**: `rem`/`em` for spacing, typography, and radius; `vh`/`dvh`/`%`/`fr` for layout. Forbidden: `w-[400px]`, `text-[18px]`, `p-[20px]`, `gap-[15px]`, `rounded-[12px]`.
- **No horizontal scroll on mobile**: parents constrain children; only intentional carousels use `overflow-x-auto`.
- **Touch targets ≥2.75rem (44px)** for buttons, links, and form controls — verify with axe-core target-size rule.
- **Mobile navigation uses `Sheet` (drawer/hamburger)** — never collapse desktop `NavigationMenu` into an unusable half-state.
- **Use `min-h-dvh`, not `h-screen`**, for full-viewport sections to avoid mobile Safari address-bar jumps.
- **WCAG 2.2 AA**: ARIA on interactive elements, keyboard navigation, visible focus ring, contrast ≥4.5:1 (≥3:1 for large text).
- **UX visibility**: render loading, error, empty, and success states explicitly — no silent failures.
- Reuse `shadcn/ui` primitives before building custom components.
- **React Doctor (mandatory before task completion)**: run `npx react-doctor@latest --fail-on warning` after every React change and resolve every diagnostic (state & effects, performance, architecture, security, a11y) before emitting the REPORT. Use `--diff <base>` to scope to net-new regressions in branch/PR mode. The agent re-runs the CLI until it exits 0 or marks unresolved findings as `DEFERRED` with explicit justification.

### Backend (add when task signal: API / route / server / database)

- Validate all input at the boundary with Zod (or framework equivalent) — fail closed on unexpected input.
- Parameterized queries / ORM bindings — never string-concatenated SQL.
- Authenticate every endpoint by default; opt-out per route is explicit.
- Authorize server-side; never trust client-supplied role claims.
- Rate-limit by IP + account; return `429` with `Retry-After`.
- Secure cookies: `HttpOnly`, `Secure`, `SameSite=Lax|Strict`.
- Structured error responses — never leak stack traces or DB errors.

### TanStack Standards (add when project uses TanStack Router/Query/DB or task signal touches routing, data fetching, mutations, optimistic UI)

Default to TanStack for React projects unless the user explicitly opts out. When this bank applies, every emitted rule is non-negotiable:

- **Router**: use TanStack Router with automatic code splitting (see https://tanstack.com/router/latest/docs/guide/automatic-code-splitting). Follow the official file-naming conventions (https://tanstack.com/router/latest/docs/routing/file-naming-conventions). Route-level splitting is the default — never ship a single monolithic bundle.
- **Query (server state)**: use TanStack Query for fetching, caching, and mutations. Use optimistic updates by default for any interaction that mutates server state (https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates).
- **DB (local-first state)**: use TanStack DB for local-first collections, syncing, and optimistic actions when applicable (https://tanstack.com/db/latest/docs/reference/functions/createOptimisticAction).
- **Default mutation strategy** (apply to every user-triggered mutation):
  1. Show optimistic UI immediately.
  2. Sync through the DB/Query layer.
  3. Roll back safely on error.
  4. Revalidate / reconcile server state after completion.
  5. Keep UI state, query state, and DB state consistent.
- **No bypass**: do not introduce alternative routing/data libraries (react-router, SWR, Apollo, Zustand for server state) unless the user explicitly requests it. Prefer existing repo patterns.
- **React Doctor gate**: TanStack code is React code — the `npx react-doctor@latest --fail-on warning` run from the Universal bank applies here too. Pay particular attention to state-and-effects and architecture diagnostics around `useQuery`/`useMutation` usage.

### Security — OWASP ASVS 5.0.0 (mandatory when task signal touches ANY V1-V17 domain)

The OWASP ASVS 5.0.0 control set is the source of truth. Apply rules grouped by chapter; default to Level 2, bump to Level 3 for high-value targets (finance, health, auth services, PII-heavy data stores).

**V1 — Encoding & Sanitization**
- Context-aware output encoding (HTML, attribute, URL, JS, CSS) — never concat user input into sinks.
- Sanitize before storage as defense-in-depth; encode on output is primary.

**V2 — Validation Logic**
- Whitelist validation at every trust boundary; fail closed.
- Validate type, length, range, format, and business rules with Zod (or framework equivalent).

**V3 — Web Frontend Security**
- Strict CSP with nonces or hashes — no `unsafe-inline`, no `unsafe-eval`.
- Anti-clickjacking: `Content-Security-Policy: frame-ancestors 'none'` (or explicit allowlist).
- Trusted Types where supported; sanitize all DOM sinks.

**V4 — API & Web Service Security**
- Authenticate every endpoint by default; rate-limit by IP + account.
- CORS allowlist — never `Access-Control-Allow-Origin: *` together with `Access-Control-Allow-Credentials: true`.

**V5 — File Handling**
- Validate filename, MIME, and magic bytes — never trust client-supplied content-type.
- Store uploads outside webroot; generate random server-side filenames.
- Scan critical paths for malware.

**V6 — Authentication**
- Generic error messages — never reveal whether the username exists.
- Account lockout / exponential backoff after repeated failures.
- Support MFA for high-value accounts.

**V7 — Session Management**
- Server-side session storage; cookies are opaque references.
- Regenerate session ID on login and privilege change; expire on logout, inactivity, and absolute timeout.
- `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` for sensitive flows).

**V8 — Authorization**
- Server-side enforcement; deny-by-default — explicit allow per resource/action.
- Check authorization on every request, not just navigation.

**V9 — Self-Contained Tokens (JWT)**
- Sign with strong algorithm (`HS256` minimum, `RS256`/`EdDSA` preferred) — never `alg=none`.
- Validate `iss`, `aud`, `exp`, `nbf` on every verification.
- Short access-token expiry (≤15 min); rotate refresh tokens.

**V10 — OAuth / OIDC**
- PKCE on every public client; reject implicit flow.
- Validate `state` and `nonce`; bind to session.
- Verify `aud` and `iss` from issuer discovery.

**V11 — Cryptography**
- AES-256-GCM or ChaCha20-Poly1305 for symmetric encryption.
- Argon2id (preferred) or bcrypt cost ≥12 for password hashing.
- Constant-time comparison for secrets; platform crypto only (`crypto.subtle`, libsodium).

**V12 — Secure Communication**
- TLS 1.2+ (1.3 preferred); HSTS with `includeSubDomains`.
- Strong cipher suites; reject `RC4`, `3DES`, `MD5`, `SHA-1`.

**V13 — Configuration Security**
- No secrets in code or repo — env vars + secrets manager only.
- Security headers: `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`.
- Disable debug/verbose errors in production.

**V14 — Data Protection**
- Encrypt PII at rest; minimize storage; document retention windows.
- Never log secrets, tokens, or PII — redact at the logger layer.
- Secure deletion (overwrite) for sensitive blobs, not just unlink.

**V15 — Secure Coding & Architecture**
- Avoid memory-unsafe primitives; prefer safe wrappers.
- Strict type checks (`tsc --strict`); deny `any` for security-relevant code.
- Dependency audit (`npm audit`, `pip-audit`, `cargo audit`) in CI.

**V16 — Security Logging & Error Handling**
- Structured logs (JSON) include trace ID, hashed user ID, action.
- Alert on auth failures, authz denials, rate-limit hits.
- Logs are tamper-evident — append-only or HMAC-chained for high-value targets.

**V17 — WebRTC Security**
- DTLS-SRTP encryption for media; reject plain RTP.
- Authenticated STUN/TURN; rotate credentials.
- Origin pinning for signaling channels.

Pick only chapters whose domain the task touches; include at least the chapter's top rule (more if applicable). The chapter label (e.g. `[V6]`) MUST prefix each Security rule emitted into the `RULES` block.

### Selection logic

- Universal → always.
- Frontend & Responsive → triggered by: "UI", "component", "page", "style", "design", "responsive", "mobile", "breakpoint", "Tailwind", "shadcn", "carousel", "card", "form", "modal", "navbar", "footer", "hero", "drawer", "accessibility", "a11y", "WCAG", "ARIA", "keyboard", "touch target", "viewport". **The full responsive ruleset is mandatory whenever this bank applies** — mobile-first, relative units, touch targets, no horizontal scroll.
- Backend → triggered by: "API", "endpoint", "route", "server", "database", "schema", "migration", "query", "model", "ORM", "Drizzle", "Prisma", "Hono", "tRPC".
- TanStack Standards → triggered by: "TanStack", "Router", "Query", "useQuery", "useMutation", "TanStack DB", "createOptimisticAction", "optimistic UI", "mutation", "route", "code splitting", "data fetching", "local-first", "collection", "sync", OR detection of `@tanstack/*` in `package.json`. **Mandatory** for any data-mutation or routing task in a TanStack project.
- Security (OWASP ASVS 5.0.0) → **mandatory** when ANY task signal touches: "auth", "login", "password", "session", "token", "secret", "crypto", "hash", "encrypt", "JWT", "OAuth", "OIDC", "cookies", "CORS", "CSP", "headers", "input", "validation", "sanitization", "XSS", "SQL injection", "file upload", "PII", "logging", "config", "env", "WebRTC". Map each task signal to the matching V1-V17 chapter(s) and emit `[Vn]`-prefixed rules.
- Multiple banks may apply — combine. Deduplicate overlapping rules.

## Transformation Patterns

### Pattern 1 — Verification

Encode "how do we know it's correct?" into the `VERIFICATION` block. Include every validation script and hook discovered by the command (`lint`, `typecheck`, `test`, `build`, format-check, pre-commit/pre-push). Always include at least one runnable check: test command, build, screenshot diff, axe-core, lighthouse, curl + grep, etc. If a standard check is absent, the final REPORT records it as `NOT RUN` with the reason; absence is never silently ignored.

**React projects (Next.js / Vite / React Native / any `react` dep): `npx react-doctor@latest --fail-on warning` is mandatory in the VERIFICATION block.** It scans state & effects, performance, architecture, security, and accessibility against a 0-100 health score. Add `--diff <base-branch>` when verification should be scoped to PR-touched files only. The agent runs it, parses diagnostics, fixes them in scope, and re-runs until exit 0 — only then does the verification step pass.

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

Match task signal → skill from discovery list. Add to `CONTEXT.Use skills`. Common matches:

| Task signal | Skill |
|-------------|-------|
| responsive, mobile-first, breakpoints, touch target, overflow | `responsive-design` |
| cards inconsistent, carousel broken, button drift | `component-consistency` |
| color tokens, `text-[15px]`, arbitrary values, OKLCH | `design-tokens` |
| accessibility, ARIA, keyboard, contrast, focus | `wcag-fix` |
| full security audit, OWASP coverage review | `owasp-asvs-audit` |
| input validation, sanitization, XSS, SQL injection | `owasp-encoding-sanitization`, `owasp-validation-logic` |
| CSP, clickjacking, frontend hardening | `owasp-web-frontend-security` |
| API auth, rate limit, CORS | `owasp-api-security` |
| file upload, content-type validation | `owasp-file-handling` |
| login, MFA, password policy | `owasp-authentication` |
| sessions, cookies, session fixation | `owasp-session-management` |
| RBAC, ACL, authorization checks | `owasp-authorization` |
| JWT, token signing/validation | `owasp-self-contained-tokens` |
| OAuth, OIDC, PKCE, state/nonce | `owasp-oauth-oidc` |
| password hashing, encryption, crypto primitives | `owasp-cryptography` |
| TLS, HSTS, certificate pinning | `owasp-secure-communication` |
| security headers, secrets, env config | `owasp-configuration-security` |
| PII, data protection, retention | `owasp-data-protection` |
| memory safety, dep audit, strict types | `owasp-secure-coding` |
| security logging, monitoring, alerting | `owasp-security-logging` |
| WebRTC, peer-to-peer media security | `owasp-webrtc-security` |
| SEO audit, meta tags | `seo-audit` |
| AI search, citability, GEO, llms.txt | `geo-audit` |
| Cloudflare Workers / DO / Agents SDK / queues | `workers-best-practices`, `durable-objects`, `agents-sdk`, `wrangler` |
| LCP, INP, CLS, "make it faster" | `web-perf`, `performance` |
| Figma-to-code, pixel-perfect | `figma-slicing` |
| `settings.json`, hooks, env, permissions | `update-config` |
| CLAUDE.md audit | `claude-md-improver` |
| Agentation feedback toolbar | `agentation` |

Skip a skill row only if discovery did not surface it. For security-touching tasks, all relevant OWASP V1-V17 skills are **required** discovery hits — if any are missing, the `rubot-fix-prompt` command halts (see Prerequisites).

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

Always emit the deferred `EXECUTION:` line and the 2-option `AskUserQuestion` decision prompt. Do not enter plan mode and do not auto-create-and-execute.

The user picks:
- **Create tasks list and execute** → first create the task list (`TaskCreate` / `TaskUpdate` / `TaskList` / `TaskGet` / `TaskStop`, like before — no `TodoWrite`), then execute it via the `execute-tasks` workflow (the `Workflow` tool, with the full rewritten prompt as `args`). Inline `Agent`/`Task` fan-out is the fallback only when the workflow is unavailable.
- **Cancel** → no execution, prompt remains visible to copy.

**There is no plan mode.** For trivial single-line changes, the user typically picks "Cancel" and applies the edit themselves — but the choice is theirs, not yours.

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

When the user picks "Create tasks list and execute", the `execute-tasks` workflow reads the `PARALLEL EXECUTION PLAN` and honors it:
- A parallel group → all its tasks fan out concurrently (one subagent each).
- A sequential group → its tasks run one at a time.
- Group boundaries are never skipped — a "sequential after Group N" group waits for every Group N task to finish first.

The inline fallback follows the same rule by hand: a parallel group = subagent spawns (`Agent`/`Task`) in a single message; a sequential group = one spawn at a time.

### Pattern 12 — Per-task `USE:` Directive (skills + MCPs)

Every rewrite must tell the executing agent exactly which skills and MCPs to load for each task. Discovery (Step 2 of the command) lists *all* available skills and MCPs; the rewrite filters to *relevant* ones per task.

#### Step A — Match every discovered skill to task signals

For each installed skill, ask: *"would loading this skill help any task in the rewrite?"* If yes:
1. Add it to `CONTEXT.Use skills:` with a one-line purpose.
2. Add it to the `USE:` field of every task it applies to.

Examples:

| Task | Skills to USE |
|------|---------------|
| "Deploy this Worker to Cloudflare" | `cloudflare` (platform overview), `wrangler` (CLI commands), `workers-best-practices` (review checklist) |
| "Fix mobile layout on /dashboard" | `responsive-design` (breakpoint rules), `design-tokens` (token compliance), `wcag-fix` (touch targets) |
| "Add authentication" | `owasp-authentication` (V6 rules), `owasp-session-management` (V7), `owasp-cryptography` (V11), `responsive-design` (login UI) |
| "Send transactional email" | `cloudflare-email-service` (binding + REST patterns) |
| "Build durable game lobby" | `durable-objects` (DO patterns), `agents-sdk` (if agent-shaped), `cloudflare` |

#### Step B — Match every connected MCP to task signals

For each MCP returned by `ListMcpResourcesTool`, ask: *"can the executing agent invoke an MCP tool to do this task faster or more accurately?"* If yes:
1. Add to `CONTEXT.Use MCP:` as `` `mcp-name` via `tool-name` for <purpose> ``.
2. Add to the `USE:` field of matched tasks.

Examples:

| Task | MCPs to USE |
|------|-------------|
| "Pull Figma frame X into code" | `figma` MCP via node-extraction tool |
| "Install a new shadcn component" | `shadcn` MCP via `get_add_command_for_items`, `view_items_in_registries` |
| "Look up Cloudflare Workers binding syntax" | `cloudflare-docs` MCP via `search_cloudflare_documentation` |
| "Provision a Neon branch + run migration" | `Neon` MCP via `create_branch`, `prepare_database_migration` |
| "Query LLM cost in PostHog" | PostHog MCP via `query-run` |

#### Step C — Write the USE field imperatively

The USE field reads like a directive to the executing agent, not a passive suggestion:

✅ Good:
```
-> USE: skill `cloudflare` (platform patterns), skill `wrangler` (CLI), MCP `cloudflare-docs` via `search_cloudflare_documentation` for binding syntax.
```

❌ Bad (passive, not imperative):
```
-> USE: cloudflare stuff might help.
```

❌ Bad (skill not in discovery list):
```
-> USE: skill `cloudflare-magic` (purpose).   # invented skill, fails Pattern 12
```

#### Step D — Reference USE in SOLUTION steps

When `USE:` lists a skill or MCP, mention it by name in at least one SOLUTION step so the agent knows when to invoke it:

```
-> USE: skill `cloudflare-email-service` (binding patterns), MCP `cloudflare-docs` via `search_cloudflare_documentation`.
-> SOLUTION:
   1. Activate `cloudflare-email-service` skill; follow its Workers binding recipe.
   2. Query `cloudflare-docs` MCP for current `wrangler.jsonc` binding schema.
   3. Add the binding and deploy with `wrangler deploy`.
```

#### Step E — `USE: none` is allowed but must be honest

If discovery surfaced no relevant skill or MCP for a specific task, write `USE: none`. Do not invent. Do not pad with unrelated skills.

```
-> USE: none — task is a single-file rename, no skill/MCP applies.
```

### Pattern 13 — Final Structured Report (post-execution)

After every task in the execution branch completes (or the user explicitly stops), a single REPORT block in the canonical format below is emitted. When execution runs via the `execute-tasks` workflow, **the workflow assembles this REPORT deterministically and returns it — display it verbatim**. In the inline fallback, you assemble it yourself. The report is mandatory whenever the user picks **"Create tasks list and execute"**; skip only on **"Cancel"**.

**Canonical format (emit verbatim, fill the placeholders):**

```text
------------------- REPORT -------------------

[TITLE]

Agent: [Agent name or role]
Skills Loaded: [List loaded skills, or "None"]
Total Files Changed: [Number]

------------------- CHANGES -------------------

1. [CREATE | UPDATE | DELETE]: @[file-path]
   Explanation:
   [Clear explanation of what changed and why.]

2. [CREATE | UPDATE | DELETE]: @[file-path]
   Explanation:
   [Clear explanation of what changed and why.]

3. [CREATE | UPDATE | DELETE]: @[file-path]
   Explanation:
   [Clear explanation of what changed and why.]

------------------- VALIDATION -------------------

- [PASS | FAIL | NOT RUN]: [command]
  Result:
  [Brief result or reason it was not run.]

- [PASS | FAIL | NOT RUN]: [command]
  Result:
  [Brief result or reason it was not run.]

------------------- DEFERRED -------------------

1. Task:
   [Deferred task name]

   Related Files:
   @[file-path]

   Explanation:
   [Why this was deferred.]

   Recommended Action:
   [Next step to complete it.]

------------------- DONE -------------------
```

**Report rules:**

- **TITLE** — short imperative description of the overall change (e.g. "Migrate dashboard to TanStack Router + Query").
- **Agent** — the primary agent that executed the work, or "multiple (per task)" when parallel groups used different agents.
- **Skills Loaded** — list every skill the agent loaded via `Skill` tool or via the Step 0-verified `@tanstack/intent` loader. Write `"None"` only when truly none loaded.
- **Total Files Changed** — integer; counts CREATE + UPDATE + DELETE entries.
- **CHANGES** — one entry per touched file, prefixed with the operation (`CREATE`, `UPDATE`, or `DELETE`). Path begins with `@` so editors render it as a clickable mention. Explanation is one or two sentences: what changed AND why.
- **VALIDATION** — list every validation command from the `VERIFICATION` block of the rewrite plus any commit/lint hooks that ran. Status is `PASS`, `FAIL`, or `NOT RUN`. Never claim `PASS` unless the command actually ran successfully; if the command never executed, mark it `NOT RUN` with the reason (e.g. "no test runner configured", "skipped on user interrupt").
- **DEFERRED** — entries for any task or check that was scoped out, skipped, or punted. Each has: Task name, Related Files (`@`-prefixed paths), Explanation (why deferred), Recommended Action (next step). Omit the DEFERRED block entirely if nothing was deferred.
- The `------------------- DONE -------------------` footer terminates the report — nothing follows it in the same message.

**Forbidden in the report:**

- Inventing files that weren't actually touched.
- Marking a check `PASS` without running its command.
- Hiding deferred work — anything not done belongs in DEFERRED.
- Prose paragraphs outside the prescribed sections.

### Pattern 14 — Blocking Enforcement Gates

Before emitting the rewritten prompt, run this gate list against the draft. If any gate fails, regenerate the draft instead of showing it.

- **Universal gate**: `RULES` includes mandatory skill detection, missing-skill halt, validation/commit hooks, React Doctor, final structured REPORT, and no `git stash`.
- **Intent loader gate**: all local skill references come from discovery, and every task that needs a local skill uses the Step 0-verified `@tanstack/intent` loader through `USE:`.
- **Validation gate**: `VERIFICATION` includes discovered project validation scripts/hooks. Missing standard checks must be represented in the final REPORT as `NOT RUN` with a reason.
- **React gate**: React/Next/Vite/React Native projects include `npx react-doctor@latest --fail-on warning` in `VERIFICATION`; execution cannot complete while unresolved warnings remain.
- **TanStack gate**: if the repo contains `@tanstack/*` or tasks touch routing/data fetching/mutations/local-first state, `RULES` includes TanStack Router automatic code splitting, official file naming, TanStack Query optimistic updates, and DB/local-first consistency where applicable.
- **Report gate**: the final structured REPORT requirement appears in `RULES`, and task-list execution is incomplete until the Pattern 13 REPORT is the final user-facing message.
- **OWASP gate**: every security rule emitted from the Security bank is prefixed with its `[Vn]` chapter.
- **Responsive gate**: UI tasks include the full responsive ruleset, not a summary.

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
- Use skills: `design-tokens` (token compliance audit), `responsive-design` (mobile-first breakpoint rules), `component-consistency` (card pattern checks), `wcag-fix` (focus + touch targets) — agent MUST load these before executing matched tasks.
- Use MCP: `shadcn` via `view_items_in_registries` for card/grid reference patterns.
- Available subagents: `theme-master`, `responsive-master`, `shadcn-ui-designer`, `frontend-master`, `general-purpose`
- Reference: `src/components/widgets/HotDogWidget.tsx` (token-compliant pattern)

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- No regressions: existing tests must pass.
- DON'T USE ANY GIT STASH COMMANDS — commit to a scratch branch if you need to set work aside.
- Follow the existing design system: tokens from `index.css` (colors, spacing, radius, typography). No arbitrary Tailwind values (`p-[13px]`, `text-[15px]`, `bg-[#aaa]`).
- Mobile-first responsive: design xs (375px), scale up via sm (640px) / md (768px) / lg (1024px) / xl (1280px).
- Relative units only: `rem`/`em` for spacing/typography/radius; `vh`/`dvh`/`%`/`fr` for layout. No `w-[400px]`, `text-[18px]`, `p-[20px]`.
- No horizontal scroll on mobile — parents constrain children; carousels use `overflow-x-auto` only when intentional.
- Touch targets ≥2.75rem (44px) for buttons, links, form controls.
- Mobile navigation uses `Sheet` (drawer/hamburger), not desktop-only `NavigationMenu`.
- Use `min-h-dvh`, not `h-screen`, for full-viewport sections.
- WCAG 2.2 AA: ARIA on interactive elements, keyboard navigation, visible focus ring, contrast ≥4.5:1.
- UX visibility: render loading, error, empty, and success states explicitly.
- Reuse `shadcn/ui` primitives before building custom components.

1. Replace arbitrary Tailwind values with tokens
-> TASK ID: TASK-001
-> AGENT: theme-master
-> USE: skill `design-tokens` (token compliance audit), skill `responsive-design` (rem conversions for px).
-> ISSUES: src/pages/dashboard.tsx contains `p-[13px]`, `text-[15px]`, `rounded-[12px]` — bypasses --spacing/--font-sans/--radius.
-> FILE RELATED: `src/pages/dashboard.tsx:24-180`
-> SOLUTION:
   1. Activate `design-tokens` skill; enumerate every arbitrary bracket value in scope.
   2. Replace arbitrary brackets with token classes (p-3, text-base, rounded-lg); cross-check `responsive-design` skill for rem equivalents.
   3. Run `bun run build` — no Tailwind warnings.

2. Align card grid breakpoints
-> TASK ID: TASK-002
-> AGENT: responsive-master
-> USE: skill `responsive-design` (mobile-first breakpoint patterns), skill `component-consistency` (grid alignment), MCP `shadcn` via `view_items_in_registries` for canonical card-grid reference.
-> ISSUES: Cards collapse to 1 column at md but parent container stays at max-w-7xl, leaving dead space.
-> FILE RELATED: `src/pages/dashboard.tsx:62-95`
-> SOLUTION:
   1. Activate `responsive-design` skill; apply mobile-first grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3.
   2. Set container to max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8.
   3. Cross-check `component-consistency` skill: match HotDogWidget card padding pattern.

3. Normalize typography scale
-> TASK ID: TASK-003
-> AGENT: frontend-master
-> USE: skill `design-tokens` (typography token scale), skill `wcag-fix` (heading-hierarchy rule).
-> ISSUES: Heading levels jump h1 → h3 → h2 in dashboard sections.
-> FILE RELATED: `src/pages/dashboard.tsx:24-58`
-> SOLUTION:
   1. Activate `wcag-fix` skill; reorder to h1 → h2 → h3 per WCAG heading-hierarchy rule.
   2. Apply existing text-display/text-heading/text-body classes from `design-tokens` token scale.

PARALLEL EXECUTION PLAN:
- Group 1 (parallel): TASK-001, TASK-002, TASK-003 — all touch dashboard.tsx but on disjoint line ranges (24-180 token swap, 62-95 grid container, 24-58 heading order); each agent works on a different concern. Coordinate through the shared Task queue (`TaskList`).
- Note: if line ranges overlap during execution, fall back to sequential — token swap first, then grid, then headings.

VERIFICATION:
- Take a screenshot before and after, diff side-by-side, list deltas.
- Run `bun run build` — exit 0.
- Run `bun run lint` — no new warnings.

EXECUTION: Awaiting user choice — create the task list, then execute it via the execute-tasks workflow; or cancel (see prompt below).
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
- Use skills: `owasp-authentication` (V6 auth rules), `owasp-session-management` (V7 cookie/session lifecycle), `owasp-validation-logic` (V2 Zod schemas), `owasp-cryptography` (V11 password hashing), `owasp-configuration-security` (V13 secrets handling), `owasp-security-logging` (V16 structured logs), `responsive-design` (mobile-first login UI) — agent MUST load these before executing matched tasks.
- Available subagents: `backend-master`, `frontend-master`, `database-master`, `testing-master`, `general-purpose`
- Reference: `src/routes/index.tsx` (existing route pattern)

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- Fix root causes; never suppress errors.
- No regressions: existing tests must pass.
- DON'T USE ANY GIT STASH COMMANDS — commit to a scratch branch if you need to set work aside.
- [V2] Validate all input at the boundary with Zod — fail closed on unexpected fields.
- [V6] Generic auth error messages — never reveal whether the username exists.
- [V6] Account lockout / exponential backoff after repeated failed logins.
- [V7] Server-side session storage; regenerate session ID on login; expire on logout + idle + absolute timeout.
- [V7] Cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, opaque session reference only.
- [V8] Authorize server-side; deny-by-default per route.
- [V11] Argon2id (preferred) or bcrypt cost ≥12 for password hashing; constant-time compare; platform crypto only.
- [V13] No secrets in code — env vars + secrets manager only.
- [V14] Never log secrets, tokens, or PII — redact at the logger layer.
- [V16] Structured logs include trace ID + hashed user ID; alert on auth failures.
- Mobile-first responsive on `/login` UI: relative units, touch targets ≥2.75rem, no horizontal scroll.
- WCAG 2.2 AA: form labels, visible focus, contrast ≥4.5:1.
- Structured error responses — never leak stack traces.

1. Define session storage schema
-> TASK ID: TASK-001
-> AGENT: backend-master
-> USE: skill `owasp-session-management` (V7 lifecycle + cookie flags), skill `owasp-configuration-security` (V13 secret handling for session signing key).
-> ISSUES: No session table or cookie infrastructure exists.
-> FILE RELATED: "new file: src/server/session.ts"
-> SOLUTION:
   1. Activate `owasp-session-management` skill; define Session = { id, userId, expiresAt } with idle + absolute timeout.
   2. Use HttpOnly + SameSite=Lax + Secure cookie named "sid"; opaque session reference only.
   3. Regenerate session ID on login per skill's V7 checklist.

2. Build /login route + form
-> TASK ID: TASK-002
-> AGENT: frontend-master
-> USE: skill `owasp-authentication` (V6 auth flow), skill `owasp-validation-logic` (V2 Zod), skill `owasp-cryptography` (V11 password compare), skill `responsive-design` (mobile-first login UI).
-> ISSUES: No login UI.
-> FILE RELATED: "new file: src/routes/login.tsx"
-> SOLUTION:
   1. Activate `responsive-design` skill; build mobile-first login form, touch targets ≥2.75rem, mirror `src/routes/index.tsx` route export pattern.
   2. Activate `owasp-validation-logic` skill; POST handler validates credentials with Zod, fails closed.
   3. Activate `owasp-cryptography` skill; Argon2id or bcrypt cost ≥12 password compare; set cookie; redirect.

3. Add route guard for protected paths
-> TASK ID: TASK-003
-> AGENT: frontend-master
-> USE: skill `owasp-authorization` (V8 deny-by-default), skill `owasp-session-management` (V7 expiry check).
-> ISSUES: All routes accessible without auth.
-> FILE RELATED: `src/router.tsx:18-44`
-> SOLUTION:
   1. Activate `owasp-authorization` skill; add beforeLoad guard that checks session cookie, deny-by-default.
   2. Redirect to /login when missing/expired per `owasp-session-management` V7 expiry rules.
   3. Whitelist /login and /signup only.

4. Logout endpoint
-> TASK ID: TASK-004
-> AGENT: backend-master
-> USE: skill `owasp-session-management` (V7 server-side invalidation), skill `owasp-security-logging` (V16 structured logout log).
-> ISSUES: No way to invalidate session.
-> FILE RELATED: "new file: src/routes/logout.ts"
-> SOLUTION:
   1. Activate `owasp-session-management` skill; POST /logout deletes session row server-side + clears cookie.
   2. Emit structured logout event per `owasp-security-logging` V16 (trace ID + hashed user ID).
   3. Redirect to /login.

PARALLEL EXECUTION PLAN:
- Group 1 (sequential): TASK-001 — defines the Session type and cookie helpers consumed by every other task.
- Group 2 (parallel after Group 1): TASK-002, TASK-004 — both consume the session helper but write to different new files (`src/routes/login.tsx`, `src/routes/logout.ts`).
- Group 3 (sequential after Group 2): TASK-003 — guards rely on /login and /logout existing before the redirect logic can be tested.

VERIFICATION:
- Run `bun run test src/server/session.test.ts` — all 4 cases pass.
- Manual: log in, refresh, access /dashboard, log out, attempt /dashboard → redirected.
- Run `bun run build` — exit 0.

EXECUTION: Awaiting user choice — create the task list, then execute it via the execute-tasks workflow; or cancel (see prompt below).
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
- DON'T USE ANY GIT STASH COMMANDS — commit to a scratch branch if you need to set work aside.

1. Reproduce
-> TASK ID: TASK-001
-> AGENT: testing-master
-> USE: none — discovery surfaced no test-framework-specific skill or MCP for this codebase.
-> ISSUES: Bug is not deterministically reproducible in tests.
-> FILE RELATED: "new file: <test path matching origin>"
-> SOLUTION:
   1. Write a failing test that triggers the symptom.
   2. Confirm it fails for the documented reason.

2. Fix root cause
-> TASK ID: TASK-002
-> AGENT: debug-master
-> USE: none — single-file logic fix, no skill/MCP applies.
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

EXECUTION: Awaiting user choice — create the task list, then execute it via the execute-tasks workflow; or cancel (see prompt below).
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
- DON'T USE ANY GIT STASH COMMANDS — commit to a scratch branch if you need to set work aside.

1. Rename identifier
-> TASK ID: TASK-001
-> AGENT: general-purpose
-> USE: none — single atomic rename, no skill/MCP applies.
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

EXECUTION: Awaiting user choice — create the task list, then execute it via the execute-tasks workflow; or cancel (see prompt below).
```

### Vague: `deploy this to Cloudflare Workers`

```
MAIN PROBLEM: App is local-only — no Cloudflare Workers deployment, no wrangler config, no bindings declared.

GOALS:
- `wrangler deploy` succeeds and returns a `*.workers.dev` URL.
- All required bindings (KV, R2, secrets) declared in `wrangler.jsonc` and matched in code.
- Observability enabled (Workers Logs, tail logs visible via `wrangler tail`).

CONTEXT:
- Framework: Hono on Cloudflare Workers (detected from package.json)
- Use skills: `cloudflare` (platform overview), `wrangler` (CLI + config schema), `workers-best-practices` (anti-patterns, secrets, observability) — agent MUST load these before executing matched tasks.
- Use MCP: `cloudflare-docs` via `search_cloudflare_documentation` for current binding/config syntax; `cloudflare-bindings` via auth-required tools for binding inspection.
- Available subagents: `deployment-master`, `backend-master`, `general-purpose`
- Reference: existing `src/index.ts` Hono app entry

RULES:
- Follow existing patterns, naming, and conventions in the codebase.
- Use real file paths only — no invented paths.
- No regressions: existing tests must pass.
- DON'T USE ANY GIT STASH COMMANDS — commit to a scratch branch if you need to set work aside.
- [V13] No secrets in code — use `wrangler secret put` + env bindings.
- [V13] Security headers on responses (`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`).
- [V16] Structured logs — enable Workers Logs / Logpush, never log secrets or PII.
- Validate every endpoint with Zod at the boundary — fail closed.

1. Create `wrangler.jsonc` with bindings
-> TASK ID: TASK-001
-> AGENT: deployment-master
-> USE: skill `wrangler` (config schema), skill `cloudflare` (platform binding semantics), MCP `cloudflare-docs` via `search_cloudflare_documentation` for current binding format.
-> ISSUES: No `wrangler.jsonc` exists; no bindings declared.
-> FILE RELATED: "new file: wrangler.jsonc"
-> SOLUTION:
   1. Activate `wrangler` skill; query `cloudflare-docs` MCP for the current `wrangler.jsonc` schema.
   2. Declare entry `main = "src/index.ts"`, compatibility_date, observability.enabled = true.
   3. Add KV/R2/secret bindings matching env reads in `src/index.ts`.

2. Wire bindings into Hono app
-> TASK ID: TASK-002
-> AGENT: backend-master
-> USE: skill `workers-best-practices` (binding access patterns, no global state), skill `cloudflare` (Env typing).
-> ISSUES: `src/index.ts` reads `process.env.*`; Workers exposes bindings via `c.env`.
-> FILE RELATED: `src/index.ts`
-> SOLUTION:
   1. Activate `workers-best-practices` skill; type `Env` interface to match `wrangler.jsonc` bindings.
   2. Replace `process.env.X` with `c.env.X`.
   3. Validate inbound requests with Zod (fail closed); return structured errors.

3. Deploy + verify
-> TASK ID: TASK-003
-> AGENT: deployment-master
-> USE: skill `wrangler` (deploy + tail commands), skill `workers-best-practices` (smoke-test checklist).
-> ISSUES: Deployment never run.
-> FILE RELATED: `package.json` scripts
-> SOLUTION:
   1. Activate `wrangler` skill; `npx wrangler deploy` from project root.
   2. `npx wrangler tail` in a side terminal; hit one endpoint; confirm structured log appears.
   3. Curl the deployed URL; assert 200 + expected body.

PARALLEL EXECUTION PLAN:
- Group 1 (sequential): TASK-001 — `wrangler.jsonc` must exist before app code can be wired to its bindings.
- Group 2 (sequential after Group 1): TASK-002 — types depend on `wrangler.jsonc` bindings.
- Group 3 (sequential after Group 2): TASK-003 — deploy needs both config and code to be coherent.

VERIFICATION:
- `npx wrangler deploy` exits 0 and prints a `*.workers.dev` URL.
- `curl <url>` returns 200 with expected body.
- `npx wrangler tail` shows structured logs with no secrets.
- `npx wrangler types` runs cleanly; `tsc --noEmit` passes.

EXECUTION: Awaiting user choice — create the task list, then execute it via the execute-tasks workflow; or cancel (see prompt below).
```

## Anti-Patterns

- Don't invent file paths.
- Don't recommend uninstalled skills, unconnected MCPs, or undiscovered subagents.
- Don't enter plan mode or auto-create-and-execute. Always show the 2-option (create-tasks-and-execute / cancel) decision prompt.
- Don't pad single-line tasks into multi-task plans.
- Don't include `Original Prompt` / `Issues Identified` / `Why This Is Better` — ever.
- Don't omit the `RULES` block — it is mandatory in every output.
- **Don't omit the `USE:` field on any task.** If discovery surfaced no relevant skill/MCP, write `USE: none — <reason>`. Never silently drop the line.
- **Don't list a skill/MCP in `CONTEXT.Use skills` or `CONTEXT.Use MCP` without tying it to at least one task's `USE:` field.** Orphan context entries waste the agent's load budget.
- **Don't reference a skill/MCP in `USE:` that wasn't surfaced by discovery.** No inventions; no hallucinated MCPs.
- **Don't write passive USE phrasing.** "cloudflare might help" is wrong — write "Use Cloudflare skills and MCP" + name the specific skill/MCP.
- **Don't omit the responsive ruleset on a UI task.** Mobile-first + relative units + touch targets + no-horizontal-scroll are non-negotiable.
- **Don't omit OWASP ASVS 5.0.0 rules on a security-touching task.** Every Security rule must carry its `[Vn]` chapter prefix (V1-V17).
- **Don't emit Security rules without a chapter mapping.** "Use crypto" alone is wrong — it must be `[V11] Use AES-256-GCM …`.
- Don't omit the `AGENT:` field on any task — it drives parallel execution.
- Don't omit the `PARALLEL EXECUTION PLAN` block — even single-task plans must declare `Group 1 (sequential)`.
- Don't claim parallelism between tasks that touch the same file or share schema/types — default to sequential when uncertain.
- Don't write prose `SOLUTION` blocks. Imperative steps only.
- Don't use `ALWAYS` / `NEVER` excessively in `SOLUTION`. State the action.
- Don't use `TodoWrite` for progress — the Task queue (`TaskCreate` / `TaskList` / `TaskGet` / `TaskUpdate` / `TaskStop`) is the tracker. Keep the `[GROUP N · AGENT: <name>]` prefix in each task's `description` so the parallel plan stays visible.
- Don't narrate execution verbosely. Status is one short line per phase ("Step 0 passed — all skills present ✅", "Execute Group 1 (Parallel)") — no rationale, no per-agent breakdown.
- Don't fan out parallel subagent spawns (`Agent`/`Task`) in separate messages — group them in a single message so they actually run concurrently. (`TaskCreate` calls only populate the queue; they don't run anything.)
- Don't proceed past Step 0 if the OWASP ASVS 5.0.0 skill suite, `responsive-design`, the `@tanstack/intent` loader, or React Doctor in a React project is incomplete — the command halts.
- Don't emit any `git stash` instructions in `SOLUTION` or `VERIFICATION` blocks. Stashing is forbidden — recommend a scratch branch (`git switch -c wip/<topic>`) when work needs to be set aside.
- **Don't skip the mandatory skill detection step.** Every agent invoked from task-list execution runs `bunx @tanstack/intent@latest list` (or `npx` fallback) and loads matching local skills via `load <package>#<skill>` BEFORE substantial work. Halt with the install command if the loader is unavailable.
- **Don't claim a validation check passed without running its command.** `PASS` requires actual exit-0 evidence; otherwise mark it `NOT RUN` with the reason.
- **Don't omit the final REPORT block when the user selects task-list execution.** The canonical `------------------- REPORT -------------------` … `------------------- DONE -------------------` format (Pattern 13) is mandatory and is the last user-facing message of that branch.
- **Don't bypass TanStack standards in a TanStack project.** Router with automatic code splitting + Query with optimistic updates + DB for local-first state is the default; only deviate when the user explicitly requests otherwise.
- **Don't ship React work without a clean `npx react-doctor@latest --fail-on warning` run.** The CLI is mandatory for every React/Next/Vite/React Native task. If diagnostics remain unresolved, either fix them in scope or move them to `DEFERRED` with explicit reasoning — never mark VALIDATION `PASS` while warnings exist.
- **Don't show a rewrite that fails Pattern 14 gates.** Regenerate before output; partial enforcement is a command failure.

## When NOT to Rewrite

| Prompt category | Action |
|-----------------|--------|
| Exploration ("what could we improve?") | Reply: open-ended is the point. Do not rewrite. |
| Learning ("explain how X works") | Reply: specificity would limit the answer. Do not rewrite. |
| Already-specific ("rename foo to bar in src/utils.ts") | Reply: `Prompt is already specific. No rewrite needed.` Stop. |

## References

- Workflow (rewrite): `.claude/workflows/fix-prompt.js` — vague prompt → strict-format plan
- Workflow (execution): `.claude/workflows/execute-tasks.js` — run the rewritten plan group-by-group → verify → REPORT
- Dynamic Workflows: https://code.claude.com/docs/en/workflows
- Dynamic Workflows (announcement): https://claude.com/blog/introducing-dynamic-workflows-in-claude-code
- Tools Reference: https://code.claude.com/docs/en/tools-reference
- Best Practices: https://code.claude.com/docs/en/best-practices
- Subagents: https://code.claude.com/docs/en/sub-agents
- Common Workflows: https://code.claude.com/docs/en/common-workflows
