---
name: rubot-fix-prompt
description: Rewrite a vague prompt into a strict task-based execution plan (MAIN PROBLEM / GOALS / CONTEXT / mandatory RULES / numbered TASKs / VERIFICATION / EXECUTION). Runs parallel Explore agents, discovers connected MCPs and installed skills, then asks the user to choose between task-list execution (TaskCreate + TodoWrite), plan mode (EnterPlanMode), or cancel. Use when the user wants to improve a prompt or transform ambiguous instructions into precise task lists.
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

## Execution

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

3. `ListMcpResourcesTool` — list connected MCPs.

4. `Bash`:
   ```bash
   { ls plugins/rubot/skills/ 2>/dev/null; ls .claude/skills/ 2>/dev/null; ls ~/.claude/skills/ 2>/dev/null; } | sort -u
   ```

5. `Read` — `package.json` (or `wrangler.toml` / `pyproject.toml` / `Cargo.toml`).

6. `WebFetch` — only if the user prompt contains a doc/design URL.

7. `TeamCreate` — optional, only if `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

### Step 3 — Synthesize

Apply Patterns 1-10 from `prompt-fixer` skill. Constraints:

- File paths: real only, from Step 2 discovery. No invention.
- Skills: only those listed by Step 2.4.
- MCPs: only those returned by Step 2.3.
- Each task: imperative title, single TASK ID, specific ISSUES, real FILE RELATED, ≤3-step SOLUTION.
- Verification: required. At least one runnable check (test, build, screenshot diff, axe-core, lighthouse).
- Execution decision: deferred to Step 5 `AskUserQuestion`. The `EXECUTION:` line in the output is always the deferred placeholder.
- **RULES: mandatory.** Assemble from rule banks in `prompt-fixer` skill:
  - Always include the **Universal** bank.
  - Add **Frontend** bank when task touches UI/components/pages/styles/responsive/a11y.
  - Add **Backend** bank when task touches API/routes/server/db.
  - Add **Security** bank when task touches auth/secrets/crypto.
  - Multiple banks may apply — combine them.

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

EXECUTION: Awaiting user choice — task-list execution, plan mode, or cancel (see prompt below).
```

**Format rules (non-negotiable):**

- `MAIN PROBLEM` — one sentence, present-tense, names the gap.
- `GOALS` — measurable outcomes only. No fluff like "make it nicer."
- `CONTEXT` — omit any line whose value is empty. Drop the whole block if all four are empty.
- `RULES` — **mandatory**, never omitted. Pull from `prompt-fixer` skill rule banks. Universal bank is always included. Domain banks added by task signal. Minimum 4 rules.
- Tasks — numbered from 1. TASK ID format: `TASK-NNN` (zero-padded).
- `FILE RELATED` — must be a real path from discovery, with line range if narrowable. Use `"new file: <path>"` when creating.
- `SOLUTION` — imperative, technical, ≤3 steps. No prose paragraphs.
- `VERIFICATION` — at least one runnable check.
- `EXECUTION` — always defers to the Step 5 `AskUserQuestion` choice. Do not invent a different execution line.

**Forbidden in output:**

- `Original Prompt` section
- `Issues Identified` section
- `Why This Is Better` section
- Any preamble or commentary outside the template
- Empty or missing `RULES` block

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
  1. Call `TodoWrite` once with one `pending` todo per `TASK-NNN` (content = imperative title, activeForm = present-progressive form).
  2. Call `TaskCreate` for each TASK-NNN. Pass the full task body (TASK ID + ISSUES + FILE RELATED + SOLUTION) plus the global RULES block as the agent prompt. Use `subagent_type: general-purpose` unless a more specific subagent fits.
  3. Track progress with `TaskList` / `TaskGet` / `TaskUpdate`. Mark each TodoWrite item `in_progress` before starting and `completed` immediately on success.
  4. On user interrupt, call `TaskStop` to halt the active task.
  5. After the last task finishes, run the `VERIFICATION` checks and report results.
- **Create plan using EnterPlanMode** → call `EnterPlanMode` and feed the rewritten prompt as plan input. Do not write code until the user approves the plan.
- **Cancel** → end. Do not call TaskCreate, TodoWrite, or EnterPlanMode.

## Hard Rules

- Output the strict template only. No "Original Prompt" / "Issues Identified" / "Why This Is Better".
- `RULES` block is **mandatory** in every output. Never empty, never omitted.
- Real paths only. No inventions.
- Recommend a skill or MCP when discovery surfaces a match. Skip when none.
- Always emit the Step 5 `AskUserQuestion` (Create tasks list / EnterPlanMode / Cancel). Never auto-enter plan mode and never auto-create tasks without the user choosing.
- `[YOUR: ...]` placeholders only for user-supplied context (screenshots, error logs, secrets).
- Match length to task size. Single-line fix → 1 task. Multi-file refactor → multi-task.
- If the original is already specific, reply: `Prompt is already specific. No rewrite needed.` and stop.

## Related

- Skill: `prompt-fixer`
