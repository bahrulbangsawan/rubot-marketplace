---
name: rubot-fix-prompt
description: Rewrite a vague prompt into a specific, actionable Claude Code instruction with verification criteria, file references, and phased execution. Use when the user wants to improve a prompt, get better results from Claude Code, or transform ambiguous instructions into precise ones.
argument-hint: <your vague prompt here>
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Skill
  - AskUserQuestion
---

# Fix Prompt Command

Rewrite vague prompts into specific, actionable Claude Code instructions following official best practices.

## Prerequisites

Before rewriting, load the `prompt-fixer` skill for transformation rules and patterns.

## Execution Steps

### Step 1: Capture the Vague Prompt

If no argument was provided, use AskUserQuestion:

```
questions:
  - question: "What prompt would you like me to improve?"
    header: "Paste Your Prompt"
    options:
      - label: "I'll type it now"
        description: "Enter your vague prompt in the next message"
    multiSelect: false
```

If an argument was provided (e.g., `/rubot-fix-prompt make the dashboard look better`), use that as the input prompt.

### Step 2: Analyze the Prompt

Classify the prompt's intent and identify what's missing:

1. **Intent type**: Build / Fix / Improve / Refactor / Configure / Test
2. **Missing elements** (check each):
   - [ ] Specific file paths or component names
   - [ ] Verification criteria (tests, screenshots, expected output)
   - [ ] Reference to existing patterns in the codebase
   - [ ] Scope boundaries (what's included, what's not)
   - [ ] Symptom description with root cause hints (for bugs)
   - [ ] Phased execution plan (for complex tasks)
   - [ ] Output format specification

### Step 3: Scan the Codebase for Context

Based on the intent, gather relevant context to make the rewrite specific:

**For UI/frontend prompts:**
```
Glob: src/components/**/*.tsx, src/pages/**/*.tsx, app/**/*.tsx
Grep: relevant component names or keywords from the prompt
```

**For backend/API prompts:**
```
Glob: src/api/**/*.ts, src/routes/**/*.ts, src/server/**/*.ts
Grep: relevant route or handler names
```

**For bug fixes:**
```
Grep: error messages, function names, or symptoms mentioned
```

**For styling/design:**
```
Glob: **/*.css, **/globals.css, **/index.css, tailwind.config.*
```

**For configuration:**
```
Glob: *.config.*, .env*, wrangler.toml, package.json
```

Collect:
- Relevant file paths to reference in the rewritten prompt
- Existing patterns that the rewrite should point Claude to
- Framework/library info from package.json
- Available test commands or build scripts

### Step 4: Determine Verification Method

Choose appropriate verification based on task type:

| Task Type | Verification to Add |
|-----------|-------------------|
| New feature | "Write tests for [specific scenarios]. Run them after implementing" |
| Bug fix | "Write a failing test that reproduces the issue, then fix it" |
| UI change | "Take a screenshot and compare with [reference]. List differences" |
| Refactor | "Run existing tests after each change to verify no regressions" |
| Performance | "Measure [metric] before and after. Report the improvement" |
| Config/deploy | "Run build and verify it succeeds. Check [endpoint/service] works" |

### Step 5: Compose and Present the Improved Prompt

Apply the transformation patterns from the `prompt-fixer` skill and present in this exact format:

---

**Display to user:**

```markdown
## Original Prompt
> [user's original vague prompt]

## Issues Identified
- [what's vague or missing — 2-4 bullet points]

## Improved Prompt

Copy the prompt below and paste it into Claude Code:
```

Then display the improved prompt inside a fenced code block (` ``` `) so it's easily copyable.

After the code block, add:

```markdown
## Why This Is Better
- [2-4 bullet points explaining each improvement]
```

---

### Step 6: Offer Next Steps

Use AskUserQuestion:

```
questions:
  - question: "Here's your improved prompt. What would you like to do?"
    header: "Prompt Fixed"
    options:
      - label: "Execute this prompt now"
        description: "Run the improved prompt in this session"
      - label: "Adjust the rewrite"
        description: "Tell me what to change about the improved prompt"
      - label: "Show me more alternatives"
        description: "Generate 2 more versions at different specificity levels"
      - label: "Done, I'll copy it"
        description: "I'll use the improved prompt myself"
    multiSelect: false
```

**Based on response:**
- **Execute now**: Run the improved prompt directly in this session
- **Adjust**: Ask what to change, rewrite, present again
- **More alternatives**: Generate a "minimal fix" version (just adds verification) and a "maximum detail" version (full phased plan with all context)
- **Done**: End the command

## Important Rules

- ALWAYS present the improved prompt in a copyable fenced code block
- NEVER execute the prompt without the user's explicit request — this command only rewrites
- Keep the rewrite concise — don't make a 1-line prompt into a 50-line one unnecessarily
- If the original prompt is already specific enough, say so — don't force unnecessary improvements
- Include `[YOUR: ...]` placeholders for any context only the user can provide (screenshots, error messages, specific requirements)
- Reference real file paths found during the codebase scan, not hypothetical ones

## Related Skills

- `prompt-fixer` — Transformation rules and patterns for prompt rewriting

## Related Commands

- `/rubot-plan` — For complex tasks that need a full implementation plan
- `/rubot-execute` — For executing plans
