---
name: rubot-fix-prompt
description: Rewrite a vague prompt into a strict task-based execution plan (MAIN PROBLEM / GOALS / CONTEXT / mandatory RULES / numbered TASKs with per-task AGENT + USE / PARALLEL EXECUTION PLAN / VERIFICATION / EXECUTION) that is **OWASP ASVS 5.0.0 compliant** and **mobile-first responsive by default**. Requires the OWASP ASVS 5.0.0 skill suite (`owasp-asvs-audit` + V1-V17 chapter skills), `responsive-design`, a resolvable `@tanstack/intent` skill loader, and `react-doctor` for React projects — halts with install instructions if any blocking gate fails. Runs parallel Explore agents, discovers connected MCPs, installed skills, validation hooks, and available subagents, **matches each discovered skill and MCP to specific task signals**, embeds explicit `Use skills: …` / `Use MCP: …` directives in CONTEXT, and adds a per-task `USE:` field telling the agent exactly which skills/MCPs to load for that task (e.g. "Use Cloudflare skills and MCP"). Analyzes which tasks can fan out in parallel, maps each security task signal to the matching OWASP chapter(s), enforces TanStack standards when triggered, then asks the user to choose between task-list execution (TaskCreate/TaskUpdate/TaskList, parallel where possible), plan mode (EnterPlanMode), or cancel. Use when the user wants to improve a prompt or transform ambiguous instructions into precise task lists.
argument-hint: <your vague prompt here>
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Skill
  - Agent
  - EnterPlanMode
  - ListMcpResourcesTool
  - WebFetch
  - TaskCreate
  - TaskGet
  - TaskList
  - TaskUpdate
  - TaskStop
  - AskUserQuestion
---

# Fix Prompt Command

Rewrite vague prompts into a strict, technical, task-based instruction with mandatory engineering rules. Output is a single copy-ready prompt — nothing else.

## Prerequisite

Load the `prompt-fixer` skill once. Skill owns the rewrite rules + rule banks; this file owns the flow.

The command also requires the **OWASP ASVS 5.0.0 skill suite** (master + V1-V17 chapter skills), the `responsive-design` skill, a resolvable `@tanstack/intent` skill loader (`bunx` preferred, `npx` fallback), and `react-doctor` availability for React projects. These checks are enforced in Step 0 — if any blocking prerequisite fails, the command halts with install instructions.

Additionally, the `responsive-design` skill **MUST be loaded via the `Skill` tool** before Step 2 runs whenever ANY task signal hints at UI work (frontend, components, pages, styles, layout, breakpoints, mobile). Step 0 includes the load instruction; Step 3 enforces that it appears in `CONTEXT.Use skills` for every UI-touching rewrite.

## Execution

### Step 0 — Skill Prerequisite Check (MANDATORY, blocking)

Run this `Bash` check first. If any required skill is missing, **halt immediately** and print the install command. Do not proceed to Step 1.

```bash
required=(
  owasp-asvs-audit
  owasp-encoding-sanitization
  owasp-validation-logic
  owasp-web-frontend-security
  owasp-api-security
  owasp-file-handling
  owasp-authentication
  owasp-session-management
  owasp-authorization
  owasp-self-contained-tokens
  owasp-oauth-oidc
  owasp-cryptography
  owasp-secure-communication
  owasp-configuration-security
  owasp-data-protection
  owasp-secure-coding
  owasp-security-logging
  owasp-webrtc-security
  responsive-design
)
installed=$( { ls plugins/rubot/skills/ 2>/dev/null; ls .claude/skills/ 2>/dev/null; ls ~/.claude/skills/ 2>/dev/null; } | sort -u )
missing=()
for s in "${required[@]}"; do
  printf '%s\n' "$installed" | grep -qx "$s" || missing+=("$s")
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "BLOCKED — required skills missing:"
  printf '  - %s\n' "${missing[@]}"
  echo
  echo "Install with:"
  echo "  npx @bahrulbangsawan/rubot add ${missing[*]}"
  echo
  echo "Then re-run /rubot-fix-prompt."
  exit 1
fi
echo "OWASP ASVS 5.0.0 skill suite + responsive-design present."

# Hard check: project skill loader. Prefer bunx; fall back to npx only when bunx is unavailable or cannot resolve the CLI.
intent_cmd=""
if command -v bunx >/dev/null 2>&1 && bunx @tanstack/intent@latest list --help >/dev/null 2>&1; then
  intent_cmd="bunx @tanstack/intent@latest"
elif command -v npx >/dev/null 2>&1 && npx -y @tanstack/intent@latest list --help >/dev/null 2>&1; then
  intent_cmd="npx -y @tanstack/intent@latest"
fi
if [ -z "$intent_cmd" ]; then
  echo "BLOCKED — @tanstack/intent skill loader is unavailable."
  echo
  echo "Install Bun or Node, then verify one of:"
  echo "  bunx @tanstack/intent@latest list --help"
  echo "  npx -y @tanstack/intent@latest list --help"
  echo
  echo "Then re-run /rubot-fix-prompt."
  exit 1
fi
echo "TanStack intent skill loader resolves via: $intent_cmd"

# Hard check: React Doctor availability, but only when the workspace declares React/Next/Vite/React Native.
react_project=0
react_package=""
while IFS= read -r pkg; do
  if grep -Eq '"(react|next|vite|react-native|@vitejs/plugin-react|@tanstack/react-start|@tanstack/solid-start)"[[:space:]]*:' "$pkg"; then
    react_project=1
    react_package="$pkg"
    break
  fi
done < <(find . -path '*/node_modules' -prune -o -path '*/.git' -prune -o -name package.json -print 2>/dev/null)
if [ "$react_project" -eq 1 ]; then
  if ! command -v npx >/dev/null 2>&1; then
    echo "BLOCKED — React project detected in $react_package, but npx is unavailable for react-doctor."
    echo "Install Node.js/npm, then verify: npx -y react-doctor@latest --version"
    exit 1
  fi
  if ! npx -y react-doctor@latest --version >/dev/null 2>&1; then
    echo "BLOCKED — React project detected in $react_package, but react-doctor did not resolve."
    echo "Verify with: npx -y react-doctor@latest --version"
    echo "Then re-run /rubot-fix-prompt."
    exit 1
  fi
  echo "React project detected in $react_package — react-doctor resolves."
else
  echo "No React project detected in package.json scan — react-doctor preflight not required."
fi
```

Behavior:
- If exit code is non-zero → halt. Surface the missing list and install command back to the user. Do NOT call Step 1 / Step 2.
- Otherwise → emit ONE short status line — `Step 0 passed — all skills present ✅` (no recap of which loaders resolved or why) — then invoke `Skill` with `skill: "responsive-design"` (so its mobile-first ruleset is in context before discovery) and proceed to Step 1.

After the prereq check passes, **load the `responsive-design` skill via the `Skill` tool** so its breakpoint system, relative-unit rules, and component patterns are in working context before any discovery or rewrite work begins.

The Universal rule bank from the `prompt-fixer` skill also requires:
- **Mandatory skill detection** before substantial work via the Step 0-verified `@tanstack/intent` loader and `load <package>#<skill>` for any matching local skill.
- **TanStack standards** when a TanStack package or task signal is present: Router automatic code splitting, Query optimistic mutations, and DB/local-first consistency where applicable.
- **Validation & commit hooks** (lint / typecheck / test / build / format / hooks) after every phase.
- **React Doctor** (`npx react-doctor@latest --fail-on warning`) — mandatory after every React change in React/Next.js/Vite/React Native projects. Agent must resolve every diagnostic before emitting the final REPORT.
- **Final structured REPORT** block (see Pattern 13) at the end of task-list execution.

Detect React projects during Step 2 discovery (look for `react`, `next`, `vite`, or `react-native` in `package.json`) and, when present, emit `npx react-doctor@latest --fail-on warning` into the rewritten prompt's VERIFICATION block as a hard requirement.

These rules are baked into every emitted RULES block — the executing agent must honor them.

### Step 1 — Capture

- If `$ARGUMENTS` is provided: use it.
- Else: `AskUserQuestion` once with `header: "Original Prompt"`, single option `"I'll paste it next"`. Do not loop.

### Step 2 — Parallel Discovery (one batched message, no dependencies)

Run all of these concurrently:

1. `Agent` (`subagent_type: Explore`) — codebase map.
   - description: `"Codebase map for prompt rewrite"`
   - prompt: `"User wants: <prompt>. Report under 200 words: (a) framework + entry paths from package.json/wrangler.toml/next.config/pyproject.toml, (b) 3-5 directories most relevant, (c) 1-3 reference files demonstrating the pattern to follow. Real paths only — include line ranges where applicable."`

2. `Agent` (`subagent_type: Explore`) — reference implementation.
   - description: `"Find similar existing implementation"`
   - prompt: `"Find an existing component/feature/test/route similar to: <prompt>. Return path + 5-line summary of how it works. Skip if nothing exists. Under 150 words."`

3. `ListMcpResourcesTool` — list connected MCPs. **Used in Step 3 to match each MCP to specific task signals for the per-task `USE:` field.**

4. `Bash` — list installed skills:
   ```bash
   { ls plugins/rubot/skills/ 2>/dev/null; ls .claude/skills/ 2>/dev/null; ls ~/.claude/skills/ 2>/dev/null; } | sort -u
   ```
   **Used in Step 3 to match each skill to specific task signals for the per-task `USE:` field.**

5. `Bash` — list installed subagents (drives per-task `AGENT:` assignment):
   ```bash
   { ls plugins/rubot/agents/ 2>/dev/null; ls .claude/agents/ 2>/dev/null; ls ~/.claude/agents/ 2>/dev/null; } | sed 's/\.md$//' | sort -u
   ```

6. `Read` — `package.json` (or `wrangler.toml` / `pyproject.toml` / `Cargo.toml`).

7. `Bash` — detect validation hooks and package-manager commands:
   ```bash
   if [ -f bun.lockb ] || [ -f bun.lock ]; then pm="bun";
   elif [ -f pnpm-lock.yaml ]; then pm="pnpm";
   elif [ -f yarn.lock ]; then pm="yarn";
   else pm="npm"; fi
   echo "packageManager: $pm"
   echo "scripts:"
   if [ -f package.json ]; then
     for s in lint typecheck test build format format:check check; do
       if grep -Eq "\"$s\"[[:space:]]*:" package.json; then
         echo "  - $s"
       fi
     done
   fi
   echo "hooks:"
   for h in .husky/pre-commit .husky/pre-push .git/hooks/pre-commit .git/hooks/pre-push; do
     if [ -f "$h" ]; then
       echo "  - $h"
     fi
   done
   ```
   **Used in Step 3 and Step 5 to make validation hooks mandatory instead of advisory.**

8. `WebFetch` — only if the user prompt contains a doc/design URL.

9. `TeamCreate` — optional, only if `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

After discovery completes, **before writing the rewrite**, build two maps in working memory:
- `skill_relevance: { task_signal → [matching skills…] }` — per Pattern 8 in the `prompt-fixer` skill.
- `mcp_relevance:   { task_signal → [matching MCPs…] }` — per Pattern 9.

These maps feed Step 3's `CONTEXT.Use skills`, `CONTEXT.Use MCP`, and per-task `USE:` field.

### Step 3 — Synthesize

Apply Patterns 1-14 from `prompt-fixer` skill. Constraints:

- File paths: real only, from Step 2 discovery. No invention.
- Skills: only those listed by Step 2.4.
- MCPs: only those returned by Step 2.3.
- Subagents: only those listed by Step 2.5 (plus the always-available `general-purpose`, `Explore`, `Plan`).
- Each task: imperative title, single TASK ID, **single AGENT** (Pattern 11), **mandatory `USE:` field** (Pattern 12), specific ISSUES, real FILE RELATED, ≤3-step SOLUTION.
- Per-task AGENT assignment: pick the most specific discovered subagent that matches the task signal. Default to `general-purpose`. Use `Explore` for read-only inspection tasks.
- **Per-task `USE:` assignment (Pattern 12):** for every task, walk the discovered skill + MCP lists and select those whose purpose matches that task's signal. Format: `` skill `name` (purpose), MCP `name` via `tool` (purpose) ``. If discovery found no relevant skill/MCP for a task, write `USE: none — <reason>`. Each SOLUTION step that depends on a USE entry must mention the skill/MCP by name (e.g. "Activate `cloudflare` skill, then …").
- **`CONTEXT.Use skills` and `CONTEXT.Use MCP`:** include only skills/MCPs that appear in at least one task's `USE:` field. Phrase imperatively: "Use skills: `cloudflare` (platform), `wrangler` (CLI) — agent MUST load these before executing matched tasks." Drop the line if no skill/MCP matches.
- **PARALLEL EXECUTION PLAN: mandatory.** Group every TASK-NNN exactly once into ordered groups. Mark each group `(parallel)` or `(sequential after Group N)`. Single-task plans use `Group 1 (sequential)`. When in doubt about independence, default to sequential.
- Verification: required. Include every discovered validation script and hook from Step 2.7 that applies to the touched stack. At minimum include one runnable check (test, build, screenshot diff, axe-core, lighthouse). If a standard check is absent, the final REPORT must mark it `NOT RUN` with the concrete reason.
- Execution decision: deferred to Step 5 `AskUserQuestion`. The `EXECUTION:` line in the output is always the deferred placeholder.
- **RULES: mandatory.** Assemble from rule banks in `prompt-fixer` skill:
  - Always include the **Universal** bank.
  - Add **Frontend & Responsive** bank when ANY task touches UI/components/pages/styles/responsive/a11y. The full responsive ruleset (mobile-first, relative units, touch targets ≥2.75rem, no horizontal scroll, `min-h-dvh`, `Sheet` mobile nav) is **non-negotiable** and must appear verbatim — do not abbreviate.
  - Add **Backend** bank when ANY task touches API/routes/server/db.
  - Add **TanStack Standards** bank when Step 2 package discovery sees `@tanstack/*` or any task touches routing, data fetching, mutations, optimistic UI, local-first collections, or sync. Router automatic code splitting + Query optimistic mutation handling are mandatory when this bank applies.
  - Add **Security (OWASP ASVS 5.0.0)** bank when ANY task touches input validation, sanitization, auth, sessions, tokens, authorization, OAuth/OIDC, crypto, secure communication, file handling, configuration/secrets/headers, data protection/PII, logging, secure coding, or WebRTC. Map each task signal to the matching V1-V17 chapter(s) and prefix every Security rule emitted with `[Vn]` so the chapter is auditable.
  - Multiple banks may apply — combine them. Deduplicate overlapping rules.
- **OWASP ASVS 5.0.0 compliance is mandatory:** if ANY task in the rewrite touches a V1-V17 domain, the `RULES` block must include at least one chapter-prefixed rule from the matching chapter. A Security rule without a `[Vn]` prefix is forbidden.
- **Responsive enforcement is mandatory:** if ANY task touches UI, the `RULES` block must include the full responsive ruleset listed in the skill's Frontend & Responsive bank.
- **TanStack enforcement is mandatory:** if the TanStack bank is triggered, the `RULES` block must include TanStack Router automatic code splitting, official file-naming conventions, TanStack Query optimistic updates for mutations, and DB/local-first consistency rules where applicable.

### Step 3.5 — Blocking Rewrite Gate (MANDATORY)

Before Step 4 displays the rewritten prompt, self-check the draft. If any gate fails, discard the draft and regenerate it before showing anything to the user.

- Universal gate: `RULES` includes mandatory skill detection, validation/commit hooks, React Doctor, final structured REPORT, and the no-`git stash` rule.
- Skill-loader gate: every task with a relevant local skill has that skill in `USE:`, and every listed skill came from Step 2.4.
- Validation gate: `VERIFICATION` includes the discovered validation scripts/hooks from Step 2.7, or names absent checks that must be reported as `NOT RUN`.
- React gate: if Step 0 or Step 2 detects React/Next/Vite/React Native, `VERIFICATION` includes `npx react-doctor@latest --fail-on warning`.
- TanStack gate: if Step 2 or task signals trigger TanStack, `RULES` includes the TanStack Standards bank.
- Report gate: `RULES` includes the final structured REPORT requirement, and the Step 5 execution branch remains configured to block final completion until the canonical REPORT is emitted.
- OWASP gate: if security is triggered, every emitted security rule has a `[Vn]` prefix.
- Responsive gate: if UI is triggered, the full responsive ruleset appears in `RULES`.

### Step 4 — Output Format (STRICT)

Display ONLY this template, inside a fenced code block. Nothing before it. Nothing after it except Step 5's question.

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
-> AGENT: <agent-name from discovery>
-> USE: skill `<name>` (purpose), MCP `<mcp>` via `<tool>` (purpose) — agent must invoke these before SOLUTION steps.
-> ISSUES: <specific symptom, current state, line numbers if known>
-> FILE RELATED: `<path>:<line-range>` or "new file: <path>"
-> SOLUTION: <technical, step-by-step; max 3 steps; reference USE skills/MCPs by name>

2. <Imperative Title>
-> TASK ID: TASK-002
-> AGENT: <agent-name>
-> USE: <skills + MCPs matched to this task, or "none — <reason>" if discovery found no relevant match>
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

**Format rules (non-negotiable):**

- `MAIN PROBLEM` — one sentence, present-tense, names the gap.
- `GOALS` — measurable outcomes only. No fluff like "make it nicer."
- `CONTEXT.Use skills` — imperative phrasing, format `` `name` (one-line purpose) ``. List only skills surfaced by Step 2.4 that match a task signal. Every listed skill must also appear in at least one task's `USE:` field. Omit the line entirely if no skill matches.
- `CONTEXT.Use MCP` — imperative phrasing, format `` `name` via `tool` for <purpose> ``. List only MCPs surfaced by Step 2.3 that match a task signal. Every listed MCP must also appear in at least one task's `USE:` field. Omit the line if no MCP matches.
- `CONTEXT` — omit any line whose value is empty. Drop the whole block if all lines are empty. `Available subagents` lists only agents discovered in Step 2.5 (plus the always-available `general-purpose`, `Explore`, `Plan`).
- `RULES` — **mandatory**, never omitted. Pull from `prompt-fixer` skill rule banks. Universal bank is always included. Domain banks added by task signal. Minimum 4 rules.
- `RULES` — must include the Universal enforcement rules for `@tanstack/intent` skill detection, validation hooks, React Doctor, final REPORT, and no `git stash`.
- `RULES` — must include TanStack Standards when the repo or task signals trigger TanStack.
- Tasks — numbered from 1. TASK ID format: `TASK-NNN` (zero-padded).
- `AGENT` — **mandatory per task.** Single agent name from discovery. Default to `general-purpose` when no specialist matches. Use `Explore` for read-only inspection.
- `USE` — **mandatory per task.** Lists every skill + MCP whose purpose matches this task. Format: `` skill `name` (purpose), MCP `name` via `tool` (purpose) ``. Write `"none — <reason>"` only when discovery surfaced no relevant skill/MCP for this task. Agent loads these BEFORE running SOLUTION steps.
- `FILE RELATED` — must be a real path from discovery, with line range if narrowable. Use `"new file: <path>"` when creating.
- `SOLUTION` — imperative, technical, ≤3 steps. No prose paragraphs. When `USE:` lists a skill/MCP, reference it by name in at least one step ("Activate `<skill>` skill, then …" or "Query `<mcp>` MCP for …").
- `PARALLEL EXECUTION PLAN` — **mandatory.** Groups every TASK-NNN exactly once. Each group is `(parallel)` or `(sequential after Group N)`. Single-task plans: `Group 1 (sequential)`. When unsure about independence, default to sequential.
- `VERIFICATION` — at least one runnable check.
- `EXECUTION` — always defers to the Step 5 `AskUserQuestion` choice. Do not invent a different execution line.

**Forbidden in output:**

- `Original Prompt` section
- `Issues Identified` section
- `Why This Is Better` section
- Any preamble or commentary outside the template
- Empty or missing `RULES` block
- Empty or missing `PARALLEL EXECUTION PLAN` block
- Missing `AGENT:` field on any task
- **Missing `USE:` field on any task** — every task declares `USE:` (skills + MCPs, or `"none — <reason>"`).
- **A skill listed in `CONTEXT.Use skills` but not referenced by any task's `USE:` field** — every CONTEXT-listed skill must tie to ≥1 task.
- **An MCP listed in `CONTEXT.Use MCP` but not referenced by any task's `USE:` field** — every CONTEXT-listed MCP must tie to ≥1 task.
- **Passive phrasing** of skill/MCP usage — must read like a directive ("Use Cloudflare skills and MCP"), not a suggestion ("cloudflare stuff might help").
- **Hallucinated skills/MCPs** — anything in `USE:` or `CONTEXT.Use skills` / `CONTEXT.Use MCP` must come from Step 2 discovery output.
- Missing responsive rules in the `RULES` block when ANY task touches UI (mobile-first, relative units, touch targets, no horizontal scroll, `min-h-dvh`, `Sheet` mobile nav)
- Missing OWASP ASVS chapter rules in the `RULES` block when ANY task touches a V1-V17 domain
- Security rules without a `[Vn]` chapter prefix (e.g. "use crypto" without `[V11]`)
- Missing mandatory skill detection rule in the `RULES` block
- Missing validation/commit hook rule in the `RULES` block or missing discovered validation commands in `VERIFICATION`
- Missing `npx react-doctor@latest --fail-on warning` in `VERIFICATION` for React/Next/Vite/React Native projects
- Missing TanStack Standards rules when `@tanstack/*` or TanStack task signals are present
- Missing final structured REPORT requirement in the `RULES` block

### Step 5 — Next Step

After displaying the rewritten prompt, immediately call `AskUserQuestion` with exactly these three options (no more, no fewer):

```
AskUserQuestion:
  question: "How do you want to proceed?"
  header: "Prompt Ready"
  options:
    - label: "Create tasks list and execute"
      description: "Spawn each TASK-NNN as a TaskCreate subagent and run them group-by-group"
    - label: "Create plan using EnterPlanMode"
      description: "Enter plan mode, present the plan, and wait for approval before any code change"
    - label: "Cancel"
      description: "Stop here — keep the rewritten prompt only"
  multiSelect: false
```

**By choice:**

- **Create tasks list and execute** → track the run through the Task queue only (`TaskCreate` to spawn, `TaskList`/`TaskGet` to monitor, `TaskUpdate` to adjust, `TaskStop` to halt). Do NOT use `TodoWrite`. Narrate tersely — one short line per phase.
  1. Walk the `PARALLEL EXECUTION PLAN` group-by-group, in order. Emit ONE short status line before each group and nothing else: `Execute Group 1 (Parallel)` or `Execute Group 2 (Sequential)`.
     - **Parallel group** — send **one message containing multiple `TaskCreate` calls**, one per TASK-NNN in the group. Each `TaskCreate` uses the per-task `AGENT` value as `subagent_type` and `description` = `[GROUP N · AGENT: <agent>] <imperative title>`. Wait for the entire group to finish before starting the next group.
     - **Sequential group** (single task or `(sequential after Group N)`) — send `TaskCreate` calls one at a time, each using the per-task `AGENT` value and the same `[GROUP N · AGENT: <agent>]` description prefix.
     - Each `TaskCreate` prompt = full task body (TASK ID + AGENT + ISSUES + FILE RELATED + SOLUTION) + the global RULES block.
  2. Monitor with `TaskList` / `TaskGet` / `TaskUpdate`. The Task queue is the progress tracker — multiple tasks may run at once during a parallel group; that's expected.
  3. On user interrupt, call `TaskStop` to halt the active task(s).
  4. After the last group finishes, run the `VERIFICATION` checks (lint / typecheck / test / build / format / commit hooks). This is a blocking completion gate: never emit the final REPORT until each discovered validation hook is either executed and recorded as `PASS`/`FAIL`, or explicitly recorded as `NOT RUN` with a concrete reason.
  5. **React Doctor gate (mandatory for React projects)**: when the project declares `react`, `next`, `vite`, or `react-native` as a dependency, run `npx react-doctor@latest --fail-on warning` (add `--diff <base-branch>` when scoping to a PR). Parse every diagnostic — state & effects, performance, architecture, security, accessibility. Fix in scope and re-run until exit 0. If a finding cannot be safely fixed, move it to the `DEFERRED` section of the REPORT with an explicit Recommended Action. Do NOT skip this step for React-touching work.
  6. **Emit the canonical REPORT block** (Pattern 13 in `prompt-fixer` skill) — `TITLE`, `Agent`, `Skills Loaded`, `Total Files Changed`, `CHANGES`, `VALIDATION` (including every discovered validation hook and the react-doctor run for React projects), `DEFERRED` (omit if empty), and the `------------------- DONE -------------------` footer. This is a blocking completion gate: if the report does not match the canonical structure, rewrite the final message before sending it. The report is the final user-facing message of the execution branch.
- **Create plan using EnterPlanMode** → call `EnterPlanMode` and feed the rewritten prompt as plan input. The plan content MUST surface the `PARALLEL EXECUTION PLAN` block so the user can review fan-out before approving. Do not write code until the user approves the plan.
- **Cancel** → end. Do not call TaskCreate, TaskUpdate, or EnterPlanMode.

## Hard Rules

- **Step 0 is blocking.** If any OWASP ASVS 5.0.0 skill from `owasp-asvs-audit` + V1-V17, `responsive-design`, the `@tanstack/intent` loader, or React Doctor in a React project is missing, halt and print the install command. Do not proceed.
- Output the strict template only. No "Original Prompt" / "Issues Identified" / "Why This Is Better".
- `RULES` block is **mandatory** in every output. Never empty, never omitted.
- The Universal rule **"DON'T USE ANY GIT STASH COMMANDS"** must appear in every emitted `RULES` block. Pull it verbatim from the `prompt-fixer` skill's Universal bank.
- **OWASP ASVS 5.0.0 compliance is mandatory:** when ANY task touches a V1-V17 domain, the `RULES` block must include `[Vn]`-prefixed chapter rules for every matching chapter. Generic Security rules without a chapter prefix are forbidden.
- **Responsive enforcement is mandatory:** when ANY task touches UI, the `RULES` block must include the full responsive ruleset (mobile-first, relative units only, touch targets ≥2.75rem, no horizontal scroll on mobile, `min-h-dvh` over `h-screen`, `Sheet` mobile nav).
- **TanStack enforcement is mandatory:** when Step 2 discovers `@tanstack/*` or any task touches routing/data fetching/mutations/local-first state, the `RULES` block must include the TanStack Standards bank.
- **Validation enforcement is mandatory:** discovered validation scripts and commit hooks must appear in `VERIFICATION` and later in the REPORT `VALIDATION` section as `PASS`, `FAIL`, or `NOT RUN`.
- **React Doctor enforcement is mandatory:** React/Next/Vite/React Native projects must include and execute `npx react-doctor@latest --fail-on warning` before completion.
- **Final REPORT enforcement is mandatory:** task-list execution is incomplete until the canonical REPORT block is emitted as the final user-facing message.
- **Per-task `USE:` field is mandatory.** Every task must list the skills + MCPs from Step 2 discovery that apply to it, or `"none — <reason>"`. CONTEXT-listed skills/MCPs without a task tie-in are forbidden. Hallucinated skills/MCPs are forbidden.
- **Phrasing of USE / CONTEXT.Use lines must be imperative.** The rewritten prompt must read as a directive to the executing agent ("Use Cloudflare skills and MCP" + named skill + named MCP tool), not a passive suggestion.
- `AGENT:` field is **mandatory** on every task. Pulled from discovery.
- `PARALLEL EXECUTION PLAN` block is **mandatory** in every output. Single-task plans use `Group 1 (sequential)`.
- Real paths only. No inventions.
- Recommend a skill, MCP, or subagent when discovery surfaces a match. Skip when none. For security-touching tasks, the matching OWASP V1-V17 skills MUST be listed in `CONTEXT.Use skills` — they are guaranteed present by Step 0.
- Default to sequential when independence is unclear — false parallelism causes merge conflicts and broken builds.
- During execution, parallel groups MUST be fanned out via a single message containing multiple `TaskCreate` calls — never serialize a parallel group across messages.
- Always emit the Step 5 `AskUserQuestion` (Create tasks list / EnterPlanMode / Cancel). Never auto-enter plan mode and never auto-create tasks without the user choosing.
- **Never use `TodoWrite`.** Task-list execution is tracked entirely through the Task queue (`TaskCreate` / `TaskList` / `TaskGet` / `TaskUpdate` / `TaskStop`); the `[GROUP N · AGENT: <name>]` prefix lives in each task's `description`.
- **Narrate tersely.** Every status line emitted during Step 0 and execution is one short, informative line — no rationale, no per-agent breakdown. Use `Step 0 passed — all skills present ✅` and `Execute Group 1 (Parallel)` / `Execute Group 2 (Sequential)`. Keep the strict output template and the final REPORT exactly as specified; trim only the conversational text around them.
- Never emit `git stash` / `git stash push|pop|apply|drop|clear` in any `SOLUTION` or `VERIFICATION` block. If a task needs to set work aside, write `git switch -c wip/<topic>` instead.
- `[YOUR: ...]` placeholders only for user-supplied context (screenshots, error logs, secrets).
- Match length to task size. Single-line fix → 1 task. Multi-file refactor → multi-task.
- If the original is already specific, reply: `Prompt is already specific. No rewrite needed.` and stop.

## Related

- Skill: `prompt-fixer`
