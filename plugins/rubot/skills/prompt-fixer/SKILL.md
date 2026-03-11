---
name: prompt-fixer
version: 1.0.0
description: |
  Rewrites vague, ambiguous prompts into specific, actionable Claude Code instructions using official best practices. Analyzes the user's intent, scans the codebase for relevant context (file paths, patterns, frameworks), and produces a copy-ready prompt with verification criteria, scoped file references, and phased execution steps.
  MUST activate for: "fix my prompt", "improve this prompt", "rewrite this prompt", "make this prompt better", "this prompt is too vague", "help me write a better prompt", "prompt engineering", "how should I ask Claude to", "rephrase this for Claude", or when the user provides a clearly vague instruction and asks for help making it more specific.
  Also activate when: "Claude keeps doing the wrong thing", "Claude doesn't understand what I want", "how do I get better results", "why does Claude keep failing", or the user references the `/rubot-fix-prompt` command.
  Do NOT activate for: actually executing the rewritten prompt, general coding tasks, SEO audits, design audits, security audits, environment checks, or any task where the user wants implementation rather than prompt improvement.
  Covers: prompt rewriting, prompt engineering, vague-to-specific transformation, verification criteria injection, file path scoping, phased execution planning, and codebase-aware context enrichment.
agents:
  - debug-master
---

# Prompt Fixer Skill

> Transform vague instructions into precise, verifiable Claude Code prompts that produce correct results on the first attempt.

## Why This Matters

Claude Code's performance degrades as context fills with failed approaches and corrections. A vague prompt like "make the dashboard look better" forces Claude to guess intent, often producing code that solves the wrong problem. Two rounds of corrections later, the context is polluted and performance drops further.

A well-written prompt gives Claude:
1. **Clear scope** — which files, which components, what boundaries
2. **Verification criteria** — how to confirm the work is correct
3. **Existing patterns** — what conventions to follow in the codebase
4. **Phased execution** — explore → plan → implement → verify

The result: correct output on the first attempt, clean context, happy developer.

## Transformation Patterns

Apply these 7 patterns (derived from the official Claude Code best practices) to rewrite any vague prompt:

### Pattern 1: Add Verification Criteria

The single highest-leverage improvement. Claude performs dramatically better when it can check its own work.

| Vague | Fixed |
|-------|-------|
| "implement email validation" | "write a validateEmail function. Test cases: user@example.com → true, invalid → false, user@.com → false. Run the tests after implementing" |
| "make the dashboard look better" | "[paste screenshot] implement this design. Take a screenshot of the result and compare it to the original. List differences and fix them" |
| "fix the build" | "the build fails with this error: [paste error]. Fix it and verify the build succeeds. Address the root cause, don't suppress the error" |

**How to apply:** Ask "how will we know this is done correctly?" and encode the answer into the prompt.

### Pattern 2: Scope to Specific Files and Components

Vague scope makes Claude read dozens of files searching for context, burning tokens and degrading performance.

| Vague | Fixed |
|-------|-------|
| "add tests for foo" | "write a test for src/utils/foo.ts covering the edge case where the user is logged out. Avoid mocks" |
| "fix the login bug" | "users report that login fails after session timeout. Check the auth flow in src/auth/, especially token refresh. Write a failing test that reproduces the issue, then fix it" |
| "add a calendar widget" | "look at how existing widgets are implemented on the home page. HotDogWidget.tsx is a good example. Follow the pattern to implement a new calendar widget" |

**How to apply:** Scan the codebase for relevant files and reference them by path.

### Pattern 3: Reference Existing Patterns

Claude produces more consistent code when it can follow an existing pattern in the codebase rather than inventing from scratch.

**How to apply:**
1. Identify a similar feature/component that already exists
2. Tell Claude to study it first: "look at how X is implemented in src/components/X.tsx"
3. Say "follow the same pattern" or "use the same approach"

### Pattern 4: Describe Symptoms with Root Cause Hints

Don't just say "it's broken." Describe what happens, where it likely originates, and what "fixed" looks like.

| Vague | Fixed |
|-------|-------|
| "fix the login bug" | "users report login fails after session timeout. Check src/auth/token-refresh.ts. Write a failing test, then fix the root cause" |
| "the page is slow" | "the /dashboard page takes 8s to load. Profile the React components for unnecessary re-renders. Check if the data fetch in useEffect has a missing dependency causing repeated calls" |

### Pattern 5: Break Complex Tasks into Phases

For anything touching multiple files or requiring design decisions, use the explore → plan → implement → verify workflow.

**Template for complex prompts:**
```
1. Explore: Read [specific files/directories] to understand the current [feature/pattern]
2. Plan: Propose an approach for [goal]. List files that need changes
3. Implement: Make the changes following [existing pattern/convention]
4. Verify: Run [tests/build/linter] and fix any failures
```

### Pattern 6: Specify Output Format

When Claude needs to produce a report, config, or structured output, show the exact format.

**How to apply:** Include a template or example of what the output should look like, even if rough.

### Pattern 7: Provide Rich Context

Instead of describing where code lives, reference it directly.

- Reference files with `@` — e.g., `@src/components/Dashboard.tsx`
- Paste screenshots for visual changes
- Paste error messages for debugging
- Give URLs for documentation or API references

## Codebase-Aware Rewriting Process

When rewriting a prompt, follow these steps to gather context:

### Step 1: Parse User Intent

Identify the core action from the vague prompt:
- **Build/Add** — new feature, component, endpoint
- **Fix** — bug, error, broken functionality
- **Improve** — performance, design, UX, code quality
- **Refactor** — restructure, rename, reorganize
- **Configure** — setup, environment, deployment
- **Test** — add tests, improve coverage

### Step 2: Scan for Relevant Files

Based on the intent, search the codebase:

```
# For UI changes — find relevant components
Glob: src/components/**/*.tsx, src/pages/**/*.tsx, app/**/*.tsx

# For API changes — find routes and handlers
Glob: src/api/**/*.ts, src/routes/**/*.ts, app/api/**/*.ts

# For style changes — find CSS/theme files
Glob: **/*.css, **/theme.*, **/tailwind.config.*

# For config changes — find config files
Glob: *.config.*, .env*, wrangler.toml
```

### Step 3: Identify Existing Patterns

Look for similar implementations the rewritten prompt can reference:
- Same type of component already exists? Reference it
- Similar API endpoint? Point to it
- Established naming convention? Mention it
- Test patterns? Reference an existing test file

### Step 4: Determine Verification Method

Choose the right verification based on the task:

| Task Type | Verification |
|-----------|-------------|
| New feature | Unit tests + integration test |
| Bug fix | Failing test → fix → passing test |
| UI change | Screenshot comparison (if Chrome extension available) |
| Refactor | Existing tests still pass |
| Performance | Benchmark before/after |
| Config | Build/deploy succeeds |

### Step 5: Compose the Rewritten Prompt

Assemble the improved prompt using the applicable patterns. Structure:

1. **What** — specific action with file paths
2. **How** — reference existing patterns, constraints, approach
3. **Verify** — how to confirm it works
4. **Edge cases** — anything Claude should watch for

## Output Format

Present the rewritten prompt in this exact format so the user can copy it:

```markdown
## Original Prompt
> [user's original vague prompt]

## Issues Identified
- [list what's vague, missing, or problematic about the original]

## Improved Prompt
```

[the rewritten prompt in a fenced code block — this is what the user copies]

```

## Why This Is Better
- [bullet points explaining each improvement]

## Tips
- [optional: suggest breaking into multiple prompts if the task is very large]
- [optional: suggest using Plan Mode first if the approach is uncertain]
```

The improved prompt inside the fenced code block must be:
- **Self-contained** — works without additional context
- **Copy-paste ready** — no placeholder brackets unless the user needs to fill something in (mark those clearly with `[YOUR: description]`)
- **Actionable** — Claude can start working immediately after reading it

## Common Vague Prompt Rewrites

### "Make it look better"

**Before:** `make the dashboard look better`

**After:**
```
Look at the current dashboard layout in src/pages/dashboard.tsx and the
components it uses. Take a screenshot of the current state.

Improve the visual hierarchy:
1. Use consistent spacing from the project's spacing tokens (check index.css for --spacing)
2. Align the card grid to a consistent column layout
3. Ensure typography follows the existing heading/body hierarchy in the codebase

Take a screenshot after changes and compare with the original. List any
visual regressions and fix them. Run the build to verify no errors.
```

### "Add authentication"

**Before:** `add authentication`

**After:**
```
Read src/routes/ to understand the current routing structure and check
if any auth utilities already exist in src/lib/ or src/utils/.

Plan an authentication system:
- Session-based auth using [framework's built-in session handling]
- Login page at /login with email/password
- Protected routes that redirect to /login when unauthenticated
- Logout endpoint that clears the session

Follow the existing route patterns in src/routes/index.tsx for new routes.
Write tests for: successful login, failed login (wrong password), accessing
protected route while logged out, and logout. Run all tests after implementing.
```

### "Fix the bug"

**Before:** `fix the bug`

**After:**
```
The [describe symptom] happens when [describe trigger]. The likely cause
is in src/[relevant-path].

1. Write a failing test that reproduces the issue
2. Find the root cause (don't just suppress the symptom)
3. Fix the underlying issue
4. Verify the test passes
5. Run the full test suite to check for regressions
```

### "Refactor this code"

**Before:** `refactor this file, it's messy`

**After:**
```
Read src/components/Dashboard.tsx and identify:
1. Duplicated logic that can be extracted into shared utilities
2. Components that are too large (>200 lines) and should be split
3. Inconsistencies with patterns used in sibling components

Make changes incrementally — one refactor at a time. After each change,
run the existing tests to verify nothing breaks. Don't change any
external behavior — the component should work identically after refactoring.
```

### "Deploy this"

**Before:** `deploy this to production`

**After:**
```
Check the deployment configuration:
1. Read wrangler.toml for the current deployment target
2. Verify wrangler whoami shows valid authentication
3. Run the full build: bun run build
4. Run all tests: bun run test
5. If everything passes, deploy with: wrangler deploy

Report any build or test failures before deploying. Do not deploy if
tests fail.
```

## Anti-Patterns to Avoid in Rewritten Prompts

- **Don't over-specify** — leave room for Claude's judgment on implementation details
- **Don't add unnecessary steps** — if the task is simple, keep the prompt simple
- **Don't include redundant context** — if Claude can read the file, don't describe its contents
- **Don't make prompts longer than necessary** — longer prompts consume more context
- **Don't use `ALWAYS` or `NEVER` excessively** — explain the why instead

## When NOT to Rewrite

Some prompts are intentionally open-ended and should stay that way:
- **Exploration prompts**: "what would you improve in this file?" — good for discovery
- **Learning prompts**: "explain how this works" — specificity would limit the answer
- **Simple tasks**: "rename foo to bar in utils.ts" — already specific enough

If the user's prompt falls into these categories, acknowledge that it's already well-formed and doesn't need rewriting.

## References

- Claude Code Best Practices: https://code.claude.com/docs/en/best-practices
- How Claude Code Works: https://code.claude.com/docs/en/how-claude-code-works
- Common Workflows: https://code.claude.com/docs/en/common-workflows
