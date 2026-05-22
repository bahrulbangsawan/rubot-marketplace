---
name: rubot-fix-prompt
description: Rewrite a vague prompt into a strict task-based execution plan (MAIN PROBLEM / GOALS / CONTEXT / mandatory RULES / numbered TASKs with per-task AGENT + USE / PARALLEL EXECUTION PLAN / VERIFICATION / EXECUTION) that is **OWASP ASVS 5.0.0 compliant** and **mobile-first responsive by default**. Requires the OWASP ASVS 5.0.0 skill suite (`owasp-asvs-audit` + V1-V17 chapter skills) to be installed — halts with install instructions if any are missing. Runs parallel Explore agents, discovers connected MCPs, installed skills, and available subagents, **matches each discovered skill and MCP to specific task signals**, embeds explicit `Use skills: …` / `Use MCP: …` directives in CONTEXT, and adds a per-task `USE:` field telling the agent exactly which skills/MCPs to load for that task (e.g. "Use Cloudflare skills and MCP"). Analyzes which tasks can fan out in parallel, maps each security task signal to the matching OWASP chapter(s), then asks the user to choose between task-list execution (TaskCreate + TodoWrite, parallel where possible), plan mode (EnterPlanMode), or cancel. Use when the user wants to improve a prompt or transform ambiguous instructions into precise task lists.
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
  - TodoWrite
  - AskUserQuestion
---

# Fix Prompt Command

Rewrite vague prompts into a strict, technical, todo-based instruction with mandatory engineering rules. Output is a single copy-ready prompt — nothing else.

## Prerequisite

Load the `prompt-fixer` skill once. Skill owns the rewrite rules + rule banks; this file owns the flow.

The command also requires the **OWASP ASVS 5.0.0 skill suite** to be installed locally (master + V1-V17 chapter skills). The check is enforced in Step 0 — if any required skill is missing, the command halts with install instructions.

## Execution

### Step 0 — OWASP ASVS 5.0.0 Skill Prerequisite Check (MANDATORY, blocking)

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
)
installed=$( { ls plugins/rubot/skills/ 2>/dev/null; ls .claude/skills/ 2>/dev/null; ls ~/.claude/skills/ 2>/dev/null; } | sort -u )
missing=()
for s in "${required[@]}"; do
  printf '%s\n' "$installed" | grep -qx "$s" || missing+=("$s")
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "BLOCKED — OWASP ASVS 5.0.0 skills missing:"
  printf '  - %s\n' "${missing[@]}"
  echo
  echo "Install with:"
  echo "  npx @bahrulbangsawan/rubot add ${missing[*]}"
  echo
  echo "Then re-run /rubot-fix-prompt."
  exit 1
fi
# Soft check (advisory only, does not block): responsive-design recommended for UI tasks.
printf '%s\n' "$installed" | grep -qx "responsive-design" || echo "NOTE: responsive-design not installed — recommended for UI tasks. Install: npx @bahrulbangsawan/rubot add responsive-design"
echo "OWASP ASVS 5.0.0 skill suite present — proceeding."
```

Behavior:
- If exit code is non-zero → halt. Surface the missing list and install command back to the user. Do NOT call Step 1 / Step 2.
- If only the `responsive-design` advisory note prints → continue, but include the install hint in the final output's Verification block.
- Otherwise → proceed silently to Step 1.

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

7. `WebFetch` — only if the user prompt contains a doc/design URL.

8. `TeamCreate` — optional, only if `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

After discovery completes, **before writing the rewrite**, build two maps in working memory:
- `skill_relevance: { task_signal → [matching skills…] }` — per Pattern 8 in the `prompt-fixer` skill.
- `mcp_relevance:   { task_signal → [matching MCPs…] }` — per Pattern 9.

These maps feed Step 3's `CONTEXT.Use skills`, `CONTEXT.Use MCP`, and per-task `USE:` field.

### Step 3 — Synthesize

Apply Patterns 1-12 from `prompt-fixer` skill. Constraints:

- File paths: real only, from Step 2 discovery. No invention.
- Skills: only those listed by Step 2.4.
- MCPs: only those returned by Step 2.3.
- Subagents: only those listed by Step 2.5 (plus the always-available `general-purpose`, `Explore`, `Plan`).
- Each task: imperative title, single TASK ID, **single AGENT** (Pattern 11), **mandatory `USE:` field** (Pattern 12), specific ISSUES, real FILE RELATED, ≤3-step SOLUTION.
- Per-task AGENT assignment: pick the most specific discovered subagent that matches the task signal. Default to `general-purpose`. Use `Explore` for read-only inspection tasks.
- **Per-task `USE:` assignment (Pattern 12):** for every task, walk the discovered skill + MCP lists and select those whose purpose matches that task's signal. Format: `` skill `name` (purpose), MCP `name` via `tool` (purpose) ``. If discovery found no relevant skill/MCP for a task, write `USE: none — <reason>`. Each SOLUTION step that depends on a USE entry must mention the skill/MCP by name (e.g. "Activate `cloudflare` skill, then …").
- **`CONTEXT.Use skills` and `CONTEXT.Use MCP`:** include only skills/MCPs that appear in at least one task's `USE:` field. Phrase imperatively: "Use skills: `cloudflare` (platform), `wrangler` (CLI) — agent MUST load these before executing matched tasks." Drop the line if no skill/MCP matches.
- **PARALLEL EXECUTION PLAN: mandatory.** Group every TASK-NNN exactly once into ordered groups. Mark each group `(parallel)` or `(sequential after Group N)`. Single-task plans use `Group 1 (sequential)`. When in doubt about independence, default to sequential.
- Verification: required. At least one runnable check (test, build, screenshot diff, axe-core, lighthouse).
- Execution decision: deferred to Step 5 `AskUserQuestion`. The `EXECUTION:` line in the output is always the deferred placeholder.
- **RULES: mandatory.** Assemble from rule banks in `prompt-fixer` skill:
  - Always include the **Universal** bank.
  - Add **Frontend & Responsive** bank when ANY task touches UI/components/pages/styles/responsive/a11y. The full responsive ruleset (mobile-first, relative units, touch targets ≥2.75rem, no horizontal scroll, `min-h-dvh`, `Sheet` mobile nav) is **non-negotiable** and must appear verbatim — do not abbreviate.
  - Add **Backend** bank when ANY task touches API/routes/server/db.
  - Add **Security (OWASP ASVS 5.0.0)** bank when ANY task touches input validation, sanitization, auth, sessions, tokens, authorization, OAuth/OIDC, crypto, secure communication, file handling, configuration/secrets/headers, data protection/PII, logging, secure coding, or WebRTC. Map each task signal to the matching V1-V17 chapter(s) and prefix every Security rule emitted with `[Vn]` so the chapter is auditable.
  - Multiple banks may apply — combine them. Deduplicate overlapping rules.
- **OWASP ASVS 5.0.0 compliance is mandatory:** if ANY task in the rewrite touches a V1-V17 domain, the `RULES` block must include at least one chapter-prefixed rule from the matching chapter. A Security rule without a `[Vn]` prefix is forbidden.
- **Responsive enforcement is mandatory:** if ANY task touches UI, the `RULES` block must include the full responsive ruleset listed in the skill's Frontend & Responsive bank.

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

### Step 5 — Next Step

After displaying the rewritten prompt, immediately call `AskUserQuestion` with exactly these three options (no more, no fewer):

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

**By choice:**

- **Create tasks list and execute** →
  1. Call `TodoWrite` once with one `pending` todo per `TASK-NNN`.
     - `content` = `[GROUP N · AGENT: <agent>] <imperative title>` — the prefix surfaces the parallel plan and which agent owns each task.
     - `activeForm` = present-progressive form (e.g. `Replacing arbitrary Tailwind values with tokens`).
  2. Walk the `PARALLEL EXECUTION PLAN` group-by-group, in order:
     - **Parallel group** — send **one message containing multiple `TaskCreate` calls**, one per TASK-NNN in the group. Each `TaskCreate` uses the per-task `AGENT` value as `subagent_type`. Wait for the entire group to finish before starting the next group.
     - **Sequential group** (single task or `(sequential after Group N)`) — send `TaskCreate` calls one at a time, each using the per-task `AGENT` value.
     - Each `TaskCreate` prompt = full task body (TASK ID + AGENT + ISSUES + FILE RELATED + SOLUTION) + the global RULES block.
  3. Track progress with `TaskList` / `TaskGet` / `TaskUpdate`. Mark each TodoWrite item `in_progress` before its `TaskCreate` fires and `completed` immediately on success. Multiple items may be `in_progress` at once during parallel groups — that's expected.
  4. On user interrupt, call `TaskStop` to halt the active task(s).
  5. After the last group finishes, run the `VERIFICATION` checks and report results.
- **Create plan using EnterPlanMode** → call `EnterPlanMode` and feed the rewritten prompt as plan input. The plan content MUST surface the `PARALLEL EXECUTION PLAN` block so the user can review fan-out before approving. Do not write code until the user approves the plan.
- **Cancel** → end. Do not call TaskCreate, TodoWrite, or EnterPlanMode.

## Hard Rules

- **Step 0 is blocking.** If any OWASP ASVS 5.0.0 skill from `owasp-asvs-audit` + V1-V17 is missing, halt and print the install command. Do not proceed.
- Output the strict template only. No "Original Prompt" / "Issues Identified" / "Why This Is Better".
- `RULES` block is **mandatory** in every output. Never empty, never omitted.
- The Universal rule **"DON'T USE ANY GIT STASH COMMANDS"** must appear in every emitted `RULES` block. Pull it verbatim from the `prompt-fixer` skill's Universal bank.
- **OWASP ASVS 5.0.0 compliance is mandatory:** when ANY task touches a V1-V17 domain, the `RULES` block must include `[Vn]`-prefixed chapter rules for every matching chapter. Generic Security rules without a chapter prefix are forbidden.
- **Responsive enforcement is mandatory:** when ANY task touches UI, the `RULES` block must include the full responsive ruleset (mobile-first, relative units only, touch targets ≥2.75rem, no horizontal scroll on mobile, `min-h-dvh` over `h-screen`, `Sheet` mobile nav).
- **Per-task `USE:` field is mandatory.** Every task must list the skills + MCPs from Step 2 discovery that apply to it, or `"none — <reason>"`. CONTEXT-listed skills/MCPs without a task tie-in are forbidden. Hallucinated skills/MCPs are forbidden.
- **Phrasing of USE / CONTEXT.Use lines must be imperative.** The rewritten prompt must read as a directive to the executing agent ("Use Cloudflare skills and MCP" + named skill + named MCP tool), not a passive suggestion.
- `AGENT:` field is **mandatory** on every task. Pulled from discovery.
- `PARALLEL EXECUTION PLAN` block is **mandatory** in every output. Single-task plans use `Group 1 (sequential)`.
- Real paths only. No inventions.
- Recommend a skill, MCP, or subagent when discovery surfaces a match. Skip when none. For security-touching tasks, the matching OWASP V1-V17 skills MUST be listed in `CONTEXT.Activate skills` — they are guaranteed present by Step 0.
- Default to sequential when independence is unclear — false parallelism causes merge conflicts and broken builds.
- During execution, parallel groups MUST be fanned out via a single message containing multiple `TaskCreate` calls — never serialize a parallel group across messages.
- Always emit the Step 5 `AskUserQuestion` (Create tasks list / EnterPlanMode / Cancel). Never auto-enter plan mode and never auto-create tasks without the user choosing.
- Never emit `git stash` / `git stash push|pop|apply|drop|clear` in any `SOLUTION` or `VERIFICATION` block. If a task needs to set work aside, write `git switch -c wip/<topic>` instead.
- `[YOUR: ...]` placeholders only for user-supplied context (screenshots, error logs, secrets).
- Match length to task size. Single-line fix → 1 task. Multi-file refactor → multi-task.
- If the original is already specific, reply: `Prompt is already specific. No rewrite needed.` and stop.

## Related

- Skill: `prompt-fixer`
