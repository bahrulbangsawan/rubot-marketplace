---
name: rubot-check
description: Run validation and invoke verification agents
allowed-tools:
  - Task
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - TodoWrite
  - AskUserQuestion
  - Skill
  - WebFetch
  - WebSearch
---

You are in the VALIDATION PHASE of the rubot orchestration workflow.

## Templates

Validation report template: `~/.claude/plugins/rubot/templates/validation-report.md.template`

## Prerequisites

1. **Load workspace configuration**:
   - Read `.claude/rubot/rubot.local.md` for validation rules
   - Find the most recent plan file (either `plan.md` or latest `*-plan.md`)

2. **Identify plan reference**:
   ```bash
   # Find current or most recent plan
   ls -t .claude/rubot/*plan.md 2>/dev/null | head -1
   ```

## Validation Process

### Step 1: Run Environment Check

First, validate the development environment is properly configured:

```bash
~/.claude/plugins/rubot/scripts/env_checker.sh .
```

This validates:
- Critical tooling (bun, node, git)
- Optional tooling (wrangler, gh)
- Version information
- Wrangler readiness and authentication
- Configuration files (package.json, lockfiles, env files)
- Project stack (ElysiaJS, Drizzle, tRPC, Zod, Neon, TanStack)

Capture exit code and output for the report.

### Step 2: Run Primary Validation

Execute the project's validation command:

```bash
bun run validate
```

Capture and analyze the output:
- Type errors (count and details)
- Lint violations (count and details)
- Build errors
- Test failures

### Step 3: Run CSS Theme Validation

If the project has an `index.css` theme file, validate it against theme-master rules:

```bash
python3 ~/.claude/plugins/rubot/scripts/css_validator.py .
```

This validates:
- Three-block structure (`:root`, `.dark`, `@theme inline`)
- All required color tokens in light/dark modes
- OKLCH color format compliance
- Typography, shadow, and radius tokens
- `@theme inline` Tailwind mappings

If the file doesn't exist, mark as "Skipped" in report.

### Step 4: Run Registry Validation

If the project has a `components.json` file (shadcn/ui projects), validate it against the mandatory registry template:

```bash
python3 ~/.claude/plugins/rubot/scripts/registry_validator.py .
```

This validates:
- All 20 mandatory shadcn-compatible registries are present
- Registry URL correctness
- Basic structure (schema, style, tsx, tailwind, aliases)
- Recommended alias configuration

If the file doesn't exist, mark as "Skipped" in report (not all projects use shadcn/ui).

Exit codes: 0 (pass), 1 (missing/misconfigured registries)

### Step 5: Run Responsive Audit

Run static responsive audit on Tailwind CSS usage:

```bash
python3 ~/.claude/plugins/rubot/scripts/responsive_audit.py .
```

This audits:
- Breakpoint compliance (only sm, md, lg, xl allowed)
- Breakpoint order violations (mobile-first)
- Hardcoded pixel values
- Layout anti-patterns (absolute/fixed without responsive)
- Responsive coverage gaps (grid/flex without variants)
- Flex/Grid pattern enforcement
- Inline style violations

Exit codes: 0 (pass), 1 (warnings), 2 (critical violations)

### Step 6: Run SEO Audit (User-Confirmed)

**IMPORTANT**: Before running SEO audit, you MUST ask the user to confirm if SEO is needed for this project.

```
AskUserQuestion({
  questions: [{
    question: "Does this project need SEO and public discoverability?",
    header: "SEO Required",
    options: [
      {
        label: "Yes - Public website",
        description: "This is a public-facing website that should be indexed by search engines and AI crawlers"
      },
      {
        label: "No - Dashboard/Admin (Recommended for dashboards)",
        description: "This is a dashboard, admin panel, or internal tool that should NOT be indexed for security reasons"
      },
      {
        label: "No - Authenticated app",
        description: "This is an authenticated application where content should remain private"
      }
    ],
    multiSelect: false
  }]
})
```

**If user selects "No"**:
- Skip SEO audit entirely
- Mark as "Skipped - Not applicable (dashboard/internal)" in report
- Recommend implementing anti-indexing measures:
  ```
  robots.txt: User-agent: * / Disallow: /
  Meta tag: <meta name="robots" content="noindex, nofollow">
  Header: X-Robots-Tag: noindex
  ```

**If user selects "Yes"**:
If the project has a deployed URL or local dev server, run technical SEO audit:

```bash
python3 ~/.claude/plugins/rubot/scripts/seo_audit.py <url>
```

This audits:
- Page accessibility and HTTP status
- Metadata (title, description, robots)
- Canonical link verification
- Open Graph and Twitter Card tags
- robots.txt analysis and syntax
- sitemap.xml validation
- Redirect chain detection
- Noindex directive detection

Exit codes: 0 (pass), 1 (critical SEO issues), 2 (execution error)

**Note**: Requires `requests` and `beautifulsoup4` packages. Skip if no URL available.

### Step 7: Invoke debug-master Agent

Use the Task tool to invoke debug-master for static analysis:

```
Task tool:
  subagent_type: "debug-master"
  prompt: |
    ## Validation Request

    Run a comprehensive validation check:
    1. Execute `bun run validate` and analyze results
    2. Check for TypeScript errors
    3. Check for Biome lint violations
    4. Verify no type errors remain

    Provide:
    - Pass/fail status for each check
    - List of any violations found
    - Recommended fixes if issues exist
```

### Step 8: Invoke Domain-Specific Verification Agents

Based on the plan's domains, invoke relevant agents for verification:

| Domain | Agent | Verification Focus |
|--------|-------|-------------------|
| Database | neon-master | Schema integrity, migration safety |
| API | backend-master | Type safety, endpoint validity |
| UI | shadcn-ui-designer | Component correctness, accessibility |
| SSR | hydration-solver | Hydration safety, determinism |
| Layout | responsive-master | Breakpoint compliance |
| Deploy | cloudflare | Wrangler config validity |
| Charts | chart-master | SSR safety, bundle optimization |
| Theme | theme-master | CSS validity, token completeness |
| SEO | seo-master | Metadata completeness |

For each relevant agent:
```
Task tool:
  subagent_type: "[agent-name]"
  prompt: |
    ## Verification Request

    Verify the recent changes in your domain:
    - Check for violations of domain constraints
    - Verify implementation follows best practices
    - Confirm no regressions introduced

    Return: Pass/fail with details
```

### Step 9: Compile Validation Report

Use the template from `~/.claude/plugins/rubot/templates/validation-report.md.template`.

Fill in all placeholders with collected data:
- Timestamps and references
- Summary counts (passed, failed, warnings)
- Environment validation results
- Primary validation results
- CSS theme validation results
- Registry validation results
- Responsive audit results
- SEO audit results
- Agent verification results
- Blockers and warnings lists
- Final recommendation

### Step 10: Save Report

Write validation report to `.claude/rubot/validation-report.md`

### Step 11: Present Results

Display summary to user, then **ALWAYS** use AskUserQuestion:

**If validation PASSED:**
```
AskUserQuestion({
  questions: [{
    question: "Validation passed! All checks completed successfully. What would you like to do next?",
    header: "Next Step",
    options: [
      {
        label: "Commit changes (/rubot-commit) (Recommended)",
        description: "Stage and commit all changes to git"
      },
      {
        label: "Create pull request (/rubot-new-pr)",
        description: "Commit and create a new pull request"
      },
      {
        label: "Done for now",
        description: "Stop here - I'll continue manually"
      }
    ],
    multiSelect: false
  }]
})
```

**If validation FAILED:**
```
AskUserQuestion({
  questions: [{
    question: "Validation failed with [X] errors and [Y] warnings. How would you like to proceed?",
    header: "Fix Issues",
    options: [
      {
        label: "Auto-fix all issues (Recommended)",
        description: "Invoke agents to automatically fix all detected issues"
      },
      {
        label: "Fix critical issues only",
        description: "Only fix errors, ignore warnings"
      },
      {
        label: "Show details and let me decide",
        description: "Display full error details so I can review before fixing"
      },
      {
        label: "Skip fixes and continue anyway",
        description: "Proceed without fixing (not recommended)"
      }
    ],
    multiSelect: false
  }]
})
```

## Report Archival

Validation reports follow the same archival pattern as plans.

When a new validation is run, the previous report can be archived:
```bash
TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%S")
mv .claude/rubot/validation-report.md ".claude/rubot/${TIMESTAMP}-validation-report.md"
```

This is optional - typically only the latest report is needed.

## Enforcement Rules

- Do NOT skip `bun run validate`
- Do NOT proceed to commit if validation fails
- Do NOT auto-fix without user consent
- ALL validation results must be documented in the report

## Handling Failures

If validation fails:
1. Present clear list of issues with file paths and line numbers
2. Use AskUserQuestion (as shown in Step 11) to get user direction
3. Based on user response:

**"Auto-fix all issues":**
- Invoke `debug-master` for type/lint errors
- Invoke domain-specific agents for their violations
- Re-run validation after fixes

**"Fix critical issues only":**
- Filter to only errors (not warnings)
- Invoke agents to fix errors only
- Re-run validation after fixes

**"Show details and let me decide":**
- Display full error output with context
- Use AskUserQuestion for each issue category:
  ```
  AskUserQuestion({
    questions: [{
      question: "Found [N] TypeScript errors. Would you like to fix these?",
      header: "TS Errors",
      options: [
        { label: "Yes, fix automatically", description: "Invoke debug-master to fix" },
        { label: "No, skip these", description: "Leave for manual fixing" }
      ],
      multiSelect: false
    }]
  })
  ```

**"Skip fixes and continue anyway":**
- Warn user about risks
- Allow proceeding but note in report

4. Re-run validation after any fixes
5. Repeat until pass or user explicitly aborts
