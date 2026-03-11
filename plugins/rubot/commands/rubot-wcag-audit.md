---
name: rubot-wcag-audit
description: Run a WCAG 2.2 Level AA accessibility audit on a URL or codebase. Use when the user wants to check accessibility compliance, audit a11y issues, or generate an accessibility report with remediation plan.
argument-hint: <url>
allowed-tools:
  - Task
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - TodoWrite
  - Skill
---

# WCAG 2.2 Accessibility Audit Command

Run a comprehensive WCAG 2.2 Level AA accessibility audit.

## Prerequisites

Before running this command:
1. Have the target URL ready (local dev server or production) OR target codebase path
2. Dev server should be running if auditing locally
3. Load the `wcag-audit` skill for audit methodology

## Execution Steps

### Step 1: Confirm Audit Scope

Use the AskUserQuestion tool to clarify what to audit:

```
questions:
  - question: "What would you like to audit for accessibility?"
    header: "Audit Target"
    options:
      - label: "Live URL (local or production)"
        description: "Audit a running website by fetching pages and analyzing HTML"
      - label: "Codebase (static analysis)"
        description: "Scan source files for accessibility anti-patterns"
      - label: "Both URL + Codebase"
        description: "Full audit combining live page analysis with source code review"
    multiSelect: false
  - question: "What pages or components should be included?"
    header: "Scope"
    options:
      - label: "All pages (comprehensive)"
        description: "Audit every accessible route and shared component"
      - label: "Specific pages only"
        description: "I'll specify which pages to audit"
      - label: "Components only"
        description: "Focus on shared UI components (forms, dialogs, nav, tables)"
    multiSelect: false
```

### Step 2: Run Automated Scans

**For URL targets:**

Use WebFetch to retrieve each target page HTML. Analyze the HTML for:

| Check | What to Look For |
|-------|-----------------|
| Language | `<html lang="...">` present and valid |
| Title | `<title>` unique and descriptive |
| Headings | Sequential h1-h6, single h1 per page |
| Images | All `<img>` have `alt` attribute |
| Forms | All inputs have associated `<label>` or `aria-label` |
| Links | Link text is descriptive (no "click here") |
| ARIA | Valid roles, no redundant ARIA on semantic HTML |
| Landmarks | `<main>`, `<nav>`, `<header>`, `<footer>` present |
| Skip link | First focusable element is a skip-to-content link |
| Contrast | Check inline styles and CSS for potential contrast issues |
| Target size | Interactive elements have adequate dimensions |
| Tables | Data tables have `<th>`, `<caption>`, scope attributes |

**For codebase targets:**

Use Grep and Glob to scan source files:

```bash
# Missing alt text
grep -rn '<img' --include="*.tsx" --include="*.jsx" | grep -v 'alt='

# Click handlers on non-interactive elements (div, span)
grep -rn 'onClick' --include="*.tsx" | grep -E '<(div|span).*onClick'

# Missing form labels
grep -rn '<input\|<select\|<textarea' --include="*.tsx" | grep -v 'aria-label\|id=\|aria-labelledby'

# Positive tabIndex (disrupts natural tab order)
grep -rn 'tabIndex=[{"]?[1-9]' --include="*.tsx"

# Images of text (check for text-in-image patterns)
grep -rn 'background-image\|backgroundImage' --include="*.tsx" --include="*.css"

# Auto-playing media
grep -rn 'autoPlay\|autoplay' --include="*.tsx"

# Missing lang attribute
grep -rn '<html' --include="*.tsx" --include="*.html" | grep -v 'lang='

# Focus management in modals/dialogs
grep -rn 'Dialog\|Modal' --include="*.tsx" | head -20

# Keyboard event handlers (should have keyboard equivalents for mouse events)
grep -rn 'onMouseDown\|onMouseUp\|onMouseEnter' --include="*.tsx" | grep -v 'onKeyDown\|onKeyUp\|onKeyPress'

# Color-only indicators
grep -rn 'className.*text-red\|className.*text-green' --include="*.tsx" | grep -v 'aria-\|role='
```

### Step 3: Manual Testing Checklist

Present the manual testing checklist to the user:

```
questions:
  - question: "Have you performed these manual tests? (I can guide you through any of them)"
    header: "Manual Testing"
    options:
      - label: "Keyboard navigation"
        description: "Tab through the entire page — all interactive elements reachable, no focus traps"
      - label: "Screen reader"
        description: "Navigate with VoiceOver (Cmd+F5 on Mac) — content announced correctly"
      - label: "Zoom testing"
        description: "Browser zoom to 200% and 400% — no content loss or horizontal scroll"
      - label: "Color/contrast"
        description: "Check with browser devtools or contrast checker tool"
      - label: "Reduced motion"
        description: "Enable prefers-reduced-motion — animations respect preference"
      - label: "Skip all manual tests"
        description: "Generate report from automated findings only"
    multiSelect: true
```

### Step 4: Classify and Score Issues

Map each issue to a WCAG 2.2 success criterion and assign severity:

| Severity | Criteria |
|----------|----------|
| **Critical** | Blocks access entirely — no keyboard access, missing labels on critical forms, contrast below 2:1 |
| **High** | Significant barrier — poor focus visibility, missing skip links, empty alt on informative images |
| **Medium** | Degraded experience — inconsistent navigation, missing lang on parts, suboptimal target sizes |
| **Low** | Minor improvement — redundant ARIA, slightly under contrast, decorative image with non-empty alt |

Calculate scores using the category weights from the `wcag-audit` skill:

| Category | Weight |
|----------|--------|
| Structure & Semantics | 20% |
| Keyboard & Focus | 20% |
| Color & Contrast | 15% |
| Forms & Validation | 15% |
| Images & Media | 10% |
| ARIA & Screen Reader | 10% |
| Navigation & Wayfinding | 10% |

### Step 5: Generate Audit Report

Use the audit report template from the `wcag-audit` skill to compile findings.

Write the report to `.claude/rubot/wcag-audit-report.md`.

Include:
1. Overall score and rating
2. Score breakdown by category
3. All issues organized by severity (Critical > High > Medium > Low)
4. Each issue mapped to its WCAG 2.2 success criterion
5. Location (file:line or CSS selector)
6. Who is affected (keyboard users, screen reader users, low vision, etc.)

### Step 6: Generate Remediation Plan

Create a phased remediation plan within the report:

- **Phase 1** (Immediate): All critical issues
- **Phase 2** (Before release): All high issues
- **Phase 3** (Next sprint): Medium issues
- **Phase 4** (Backlog): Low issues

Each phase should include estimated effort and specific fix descriptions.

### Step 7: Present Results

Display summary to user, then use AskUserQuestion:

**If score >= 75:**
```
questions:
  - question: "Accessibility audit complete! Score: [X]/100. [N] issues found. What would you like to do?"
    header: "Audit Results"
    options:
      - label: "Create fix plan with OpenSpec (Recommended)"
        description: "Generate an OpenSpec change proposal and rubot execution plan for accessibility fixes"
      - label: "Fix all issues now (/rubot-wcag-fix)"
        description: "Automatically fix accessibility issues starting with critical"
      - label: "Fix critical/high only"
        description: "Fix only the most impactful issues"
      - label: "Review report first"
        description: "Read the full report before deciding"
      - label: "Done for now"
        description: "Save the report and stop here"
    multiSelect: false
```

**If score < 75:**
```
questions:
  - question: "Accessibility audit complete. Score: [X]/100 — significant work needed. [N] critical and [M] high issues found. How would you like to proceed?"
    header: "Audit Results"
    options:
      - label: "Create fix plan with OpenSpec (Recommended)"
        description: "Generate an OpenSpec change proposal and rubot execution plan for accessibility remediation"
      - label: "Fix critical issues first"
        description: "Start with blockers that prevent users from accessing content"
      - label: "Fix all issues systematically"
        description: "Work through all issues phase by phase"
      - label: "Review report first"
        description: "Read the full report before deciding"
      - label: "Done for now"
        description: "Save the report and stop here"
    multiSelect: false
```

### Step 8: Create OpenSpec Plan (If Requested)

If the user chose "Create fix plan with OpenSpec":

1. **Check OpenSpec installation and initialization:**
   ```bash
   which openspec && openspec --version
   ls -d openspec/ 2>/dev/null
   ```
   If not installed or initialized, install with `npm install -g @fission-ai/openspec@latest` and run `openspec init && openspec update`.

2. **Create OpenSpec change** named `fix-accessibility-issues` using the `/opsx:propose` workflow:
   - `proposal.md` — Accessibility audit findings, score, WCAG criteria failures
   - `specs/` — Requirements from each failed WCAG 2.2 success criterion
   - `design.md` — Technical approach for fixes, component changes needed
   - `tasks.md` — Phased remediation checklist (Phase 1-4 from the remediation plan)

3. **Invoke agents** for domain analysis:
   - `shadcn-ui-designer` — Review component accessibility fixes (ARIA, semantics, focus)
   - `responsive-master` — Validate touch target sizing and responsive focus behavior

4. **Generate rubot execution plan** at `.claude/rubot/plan.md` following the standard format from `/rubot-plan`

5. **Ask to execute:**
   ```
   questions:
     - question: "Accessibility fix plan created with OpenSpec. Execute now?"
       header: "Execute Plan"
       options:
         - label: "Yes, execute now"
           description: "Proceed with /rubot-execute to implement accessibility fixes"
         - label: "No, review first"
           description: "Review plan at .claude/rubot/plan.md and OpenSpec artifacts"
         - label: "Modify plan"
           description: "Make changes before execution"
       multiSelect: false
   ```

## Related Commands

- `/rubot-wcag-fix` — Fix accessibility issues from audit findings
- `/rubot-check` — General validation (includes accessibility in responsive audit)
- `/rubot-seo-audit` — SEO audit (overlapping concerns with accessibility)

## Related Skills

- `wcag-audit` — Audit methodology and scoring
- `wcag-fix` — Implementation patterns for fixes
- `core-web-vitals` — Performance (impacts perceived accessibility)
