---
name: rubot-fix-prompt
description: Rewrite a vague prompt into a strict task-based execution plan (MAIN PROBLEM / GOALS / CONTEXT / mandatory RULES / numbered TASKs / VERIFICATION / EXECUTION). Runs parallel Explore agents, discovers connected MCPs and installed skills, and outputs a single copy-ready prompt that defaults to plan mode. Use when the user wants to improve a prompt or transform ambiguous instructions into precise task lists.
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
- Plan mode: required for any multi-file/architectural rewrite.
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

EXECUTION: Start in plan mode (`EnterPlanMode`). Present the plan and wait for approval before writing any code.

reply 'go' to execute.
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
- `EXECUTION` — required for multi-file/architectural rewrites. For trivial single-line changes, replace with: `EXECUTION: Direct execution OK — single-line change.`
- Closing line `reply 'go' to execute.` — exact text, lowercase.

**Forbidden in output:**

- `Original Prompt` section
- `Issues Identified` section
- `Why This Is Better` section
- Any preamble or commentary outside the template
- Empty or missing `RULES` block

### Step 5 — Next Step

```
AskUserQuestion:
  question: "Ready?"
  header: "Prompt Ready"
  options:
    - label: "Run it now (plan mode)"
      description: "EnterPlanMode and execute the rewrite"
    - label: "Adjust"
      description: "Tell me which TASK ID to change"
    - label: "Alternatives"
      description: "Generate minimal + maximum-detail versions"
    - label: "Done"
      description: "I'll copy it myself"
  multiSelect: false
```

**By choice:**
- **Run it now** → call `EnterPlanMode`, feed the rewritten prompt as plan input.
- **Adjust** → ask which `TASK-NNN` to change, edit just that task, redisplay full block.
- **Alternatives** → emit two more code blocks: `MINIMAL` (only verification added) and `MAXIMUM` (full task expansion + every relevant skill/MCP).
- **Done** → end.

## Hard Rules

- Output the strict template only. No "Original Prompt" / "Issues Identified" / "Why This Is Better".
- `RULES` block is **mandatory** in every output. Never empty, never omitted.
- Real paths only. No inventions.
- Recommend a skill or MCP when discovery surfaces a match. Skip when none.
- Default execution = plan mode. Override only on explicit "skip plan mode."
- `[YOUR: ...]` placeholders only for user-supplied context (screenshots, error logs, secrets).
- Match length to task size. Single-line fix → 1 task. Multi-file refactor → multi-task.
- If the original is already specific, reply: `Prompt is already specific. No rewrite needed.` and stop.

## Related

- Skill: `prompt-fixer`
