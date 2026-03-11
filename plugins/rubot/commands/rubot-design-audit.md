---
name: rubot-design-audit
description: Audit component consistency, design token usage, and carousel functionality across the codebase. Generates a comprehensive report, creates an OpenSpec plan for fixes, and offers to execute. Use when the user wants to check UI consistency, fix carousels, enforce design tokens, or standardize component patterns.
argument-hint: "[component-path or --full]"
allowed-tools:
  - Task
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - TodoWrite
  - AskUserQuestion
  - Skill
  - WebFetch
---

# Design Audit & Fix Command

Comprehensive audit of design token usage, component pattern consistency, and carousel functionality. Workflow: **Scan → Audit → Plan → Execute**.

## Prerequisites

### 1. Load Required Skills

Before scanning, load these skills for audit rules and patterns:

1. Load the `design-tokens` skill — token compliance rules, detection patterns, remediation
2. Load the `component-consistency` skill — component patterns, carousel requirements, drift detection

### 2. Check OpenSpec Installation

```bash
which openspec && openspec --version
```

If not installed:

```bash
npm install -g @fission-ai/openspec@latest
```

### 3. Check OpenSpec Project Initialization

```bash
ls -d openspec/ 2>/dev/null
```

If not found:

```bash
openspec init && openspec update
```

### 4. Check Workspace Initialization

- Verify `.claude/rubot/rubot.local.yaml` exists
- If not, inform user to run `/rubot-init` first

### 5. Read Workspace Configuration

- Load `.claude/rubot/rubot.local.yaml` for project context

## Execution Steps

### Step 1: Confirm Audit Scope

Use AskUserQuestion to clarify scope:

```
questions:
  - question: "What would you like to audit?"
    header: "Design Audit Scope"
    options:
      - label: "Full design audit (Recommended)"
        description: "Scan everything: design tokens, component consistency, and carousels"
      - label: "Design tokens only"
        description: "Check CSS variable usage, arbitrary values, color/font/spacing token compliance"
      - label: "Component consistency only"
        description: "Check cards, buttons, grids, forms for pattern drift across pages"
      - label: "Carousel fix only"
        description: "Focus on carousel navigation, mobile behavior, and slide mechanics"
      - label: "Specific components"
        description: "I'll specify which files or components to audit"
    multiSelect: false
```

### Step 2: Scan for Design Token Violations

Run these scans in parallel using the detection patterns from the `design-tokens` skill:

**2a. Color token violations:**

```
Grep pattern: "bg-\[#[0-9a-fA-F]+\]|text-\[#[0-9a-fA-F]+\]|border-\[#[0-9a-fA-F]+\]"
  glob: "*.tsx,*.jsx,*.css,*.ts"
  (exclude: node_modules, .next, dist, build)
```

```
Grep pattern: "bg-(red|blue|green|yellow|purple|pink|orange|gray|slate|zinc|neutral|stone)-\d+"
  glob: "*.tsx,*.jsx,*.css,*.ts"
```

**2b. Typography violations:**

```
Grep pattern: "text-\[\d+px\]|text-\[\d+rem\]|font-size:\s*\d+px"
  glob: "*.tsx,*.jsx,*.css,*.ts"
```

**2c. Spacing violations:**

```
Grep pattern: "[mp][xytblr]?-\[\d+px\]|gap-\[\d+px\]|margin:\s*\d+px|padding:\s*\d+px"
  glob: "*.tsx,*.jsx,*.css,*.ts"
```

**2d. Radius violations:**

```
Grep pattern: "rounded-\[\d+px\]|border-radius:\s*\d+px"
  glob: "*.tsx,*.jsx,*.css,*.ts"
```

**2e. Shadow violations:**

```
Grep pattern: "shadow-\[.*\]"
  glob: "*.tsx,*.jsx,*.css,*.ts"
```

Compile results into a token violations summary with file paths and line numbers.

### Step 3: Scan for Component Pattern Drift

**3a. Inventory all component instances:**

```
Grep pattern: "<Card|CardContent|CardHeader|CardFooter" glob: "*.tsx,*.jsx"
```

```
Grep pattern: "[Cc]arousel|[Ss]lider|translateX|scroll-snap|embla" glob: "*.tsx,*.jsx"
```

```
Grep pattern: "<Button" glob: "*.tsx,*.jsx"
```

```
Grep pattern: "grid-cols-" glob: "*.tsx,*.jsx"
```

**3b. For each component type found**, read the files and extract:
- Styling properties (radius, padding, shadow, colors)
- Structural pattern (child order, slot usage)
- Responsive classes (breakpoint behavior)

**3c. Compare instances** of the same type and flag deviations.

### Step 4: Audit Carousel Functionality (if carousels exist)

For each carousel instance found in Step 3:

1. **Read the full carousel component file(s)**
2. Check against the `component-consistency` skill's carousel checklist:
   - [ ] Sliding mechanism exists and uses translateX or scroll-snap
   - [ ] Prev/next arrow controls are present and functional
   - [ ] Boundary handling (disabled at edges or infinite loop)
   - [ ] Mobile shows `basis-full` (1 card, no cut-off)
   - [ ] Touch/swipe support on mobile
   - [ ] Graceful degradation with fewer items than slots
   - [ ] Consistent gap between slides
   - [ ] Accessible (aria-labels, keyboard nav)
3. Document specific issues with file paths and line numbers

### Step 5: Check Token System Integrity

Read the project's CSS variable definitions:

```
Grep pattern: "--background|--foreground|--primary|--card|--muted|--accent|--destructive|--border|--ring|--chart|--sidebar|--font-sans|--radius|--spacing|--shadow"
  glob: "**/index.css,**/globals.css,**/global.css"
```

Verify:
- [ ] All required color tokens exist in `:root`
- [ ] All required color tokens have `.dark` overrides
- [ ] `@theme inline` maps CSS variables to Tailwind
- [ ] `--font-sans`, `--radius`, `--spacing` are defined
- [ ] OKLCH format used for all color values

### Step 6: Generate Audit Report

Compile all findings into a comprehensive report. Calculate scores per category using the scoring rubrics from both skills.

Write the report to `.claude/rubot/design-audit-report.md`:

```markdown
# Design Audit Report

**Date**: [ISO timestamp]
**Scope**: [full / tokens-only / components-only / carousel-only / specific]
**Overall Design Score**: [calculated]/100

---

## Token Compliance Score: [X]/100

| Category | Violations | Files Affected | Severity |
|----------|-----------|----------------|----------|
| Color tokens | X | [list] | Critical/High |
| Typography tokens | X | [list] | High |
| Spacing tokens | X | [list] | High |
| Radius tokens | X | [list] | Medium |
| Shadow tokens | X | [list] | Medium |
| Token system integrity | [pass/fail] | index.css | [severity] |
| Light/dark parity | [pass/fail] | index.css | [severity] |

## Component Consistency Score: [X]/100

| Component | Instances | Consistent | Drifted | Issues |
|-----------|-----------|------------|---------|--------|
| Cards | X | Y | Z | [summary] |
| Carousels | X | Y | Z | [summary] |
| Buttons | X | Y | Z | [summary] |
| Grids | X | Y | Z | [summary] |
| Forms | X | Y | Z | [summary] |

## Carousel Status: [Working / Broken / Partial]

| Check | Status | Details |
|-------|--------|---------|
| Slide navigation | Pass/Fail | [details] |
| Arrow controls | Pass/Fail | [details] |
| Boundary handling | Pass/Fail | [details] |
| Mobile (1 card) | Pass/Fail | [details] |
| Touch/swipe | Pass/Fail | [details] |
| Fewer items | Pass/Fail | [details] |
| Accessibility | Pass/Fail | [details] |

## Detailed Findings

### Critical Issues
[Numbered list with file paths, line numbers, and specific violations]

### High Priority
[Numbered list]

### Medium Priority
[Numbered list]

### Low Priority
[Numbered list]

## Recommended Fix Order

1. [Most impactful fix — description and affected files]
2. [Second priority]
3. [Continue...]
```

### Step 7: Present Results

Display the audit summary to the user with key metrics:

- Overall design score
- Token compliance score
- Component consistency score
- Carousel status
- Number of critical/high/medium/low issues
- Top 3 recommended fixes

### Step 8: Ask to Create Plan

Use AskUserQuestion:

```
questions:
  - question: "Design audit complete! Score: [X]/100. [N] issues found ([C] critical, [H] high). What would you like to do?"
    header: "Audit Complete"
    options:
      - label: "Create fix plan with OpenSpec (Recommended)"
        description: "Generate an OpenSpec change proposal and rubot execution plan for all fixes"
      - label: "Fix critical issues only"
        description: "Create a plan targeting only critical and high-severity issues"
      - label: "Fix carousel only"
        description: "Create a focused plan for carousel navigation and mobile behavior"
      - label: "Fix tokens only"
        description: "Create a plan for design token cleanup and arbitrary value replacement"
      - label: "Review report first"
        description: "Read the full report at .claude/rubot/design-audit-report.md before deciding"
      - label: "Done for now"
        description: "Save the report and stop"
    multiSelect: false
```

### Step 9: Create OpenSpec Plan (If Requested)

Based on the user's choice, create an OpenSpec change using the `/opsx:propose` workflow:

1. **Determine change name** from scope:
   - Full audit → `fix-design-consistency`
   - Critical only → `fix-critical-design-issues`
   - Carousel only → `fix-carousel-functionality`
   - Tokens only → `fix-design-tokens`

2. **Create OpenSpec artifacts** in `openspec/changes/<change-name>/`:
   - `proposal.md` — Why: audit findings, score, impact. What: fixes needed.
   - `specs/` — Requirements derived from audit checklist failures
   - `design.md` — Technical approach: which tokens to add/modify, which components to refactor
   - `tasks.md` — Ordered task checklist from the audit's recommended fix order

3. **Invoke relevant agents** for domain analysis:

| Findings | Agent | Task |
|----------|-------|------|
| Token violations, color issues | theme-master | Review OKLCH token values, generate missing tokens |
| Component pattern drift | shadcn-ui-designer | Standardize component patterns |
| Carousel broken | shadcn-ui-designer + responsive-master | Fix carousel implementation |
| Responsive issues in components | responsive-master | Fix breakpoint behavior |

4. **Generate rubot execution plan** at `.claude/rubot/plan.md` following the standard plan format from `/rubot-plan`

### Step 10: Ask to Execute

```
questions:
  - question: "Fix plan created with OpenSpec artifacts. Would you like to execute it now?"
    header: "Execute Plan"
    options:
      - label: "Yes, execute now (Recommended)"
        description: "Proceed with /rubot-execute to implement all fixes"
      - label: "No, review first"
        description: "Review the plan at .claude/rubot/plan.md and OpenSpec artifacts"
      - label: "Modify plan"
        description: "Make changes before execution"
    multiSelect: false
```

**Based on response:**
- **Execute now**: Invoke `/rubot-execute`
- **Review first**: Inform user of plan locations and exit
- **Modify plan**: Ask what to change, update, and ask again

## Important Rules

- Do NOT fix anything during the audit phase (Steps 1-7)
- Do NOT skip scanning steps — even if the user says "just fix the carousel", scan first to understand full context
- Do NOT auto-resolve — always present findings and ask before proceeding
- ALL audit findings must include file paths and line numbers
- ALL fixes must go through the OpenSpec plan workflow
- `shadcn-ui-designer` is the authority for all component fixes
- `theme-master` is the authority for token/color generation
- `responsive-master` validates responsive behavior of fixes
- `debug-master` and `qa-tester` should be included in verification steps of any plan

## Related Commands

- `/rubot-responsive-audit` — Responsive-specific audit (breakpoints, px-to-rem, mobile layout)
- `/rubot-plan` — General planning workflow
- `/rubot-execute` — Plan execution workflow
- `/rubot-check` — Post-fix validation

## Related Skills

- `design-tokens` — Token system rules, detection patterns, remediation
- `component-consistency` — Component patterns, carousel requirements, drift detection
- `responsive-design` — Breakpoint system, mobile-first patterns
