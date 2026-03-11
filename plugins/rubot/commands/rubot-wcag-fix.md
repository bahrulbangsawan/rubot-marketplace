---
name: rubot-wcag-fix
description: Fix WCAG 2.2 accessibility issues across the codebase. Use when the user wants to fix a11y problems, implement accessible components, or remediate issues from an accessibility audit.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Skill
  - Agent
---

# WCAG 2.2 Accessibility Fix Command

Systematically fix accessibility issues across the codebase.

## Prerequisites

Before running this command:
1. Load the `wcag-fix` skill for implementation patterns
2. Check if an audit report exists at `.claude/rubot/wcag-audit-report.md`
3. If no audit report exists, recommend running `/rubot-wcag-audit` first

## Execution Steps

### Step 1: Determine Fix Scope

If an audit report exists, read it and present the findings:

```
questions:
  - question: "Found accessibility audit report with [N] issues. What would you like to fix?"
    header: "Fix Scope"
    options:
      - label: "All issues (phase by phase)"
        description: "Fix all [N] issues starting with critical, then high, medium, low"
      - label: "Critical issues only"
        description: "Fix [X] critical issues that block user access"
      - label: "Critical + High"
        description: "Fix [X] critical and [Y] high-priority issues"
      - label: "Specific category"
        description: "Choose a category: keyboard, contrast, forms, images, ARIA, etc."
    multiSelect: false
```

If no audit report exists:

```
questions:
  - question: "No audit report found. How would you like to proceed?"
    header: "Starting Point"
    options:
      - label: "Run audit first (/rubot-wcag-audit)"
        description: "Recommended — audit first to identify all issues systematically"
      - label: "Quick scan and fix"
        description: "Do a rapid codebase scan and fix common issues without a full audit"
      - label: "Fix a specific issue"
        description: "I know what needs fixing — let me describe it"
    multiSelect: false
```

### Step 2: Fix Issues by Priority

Work through issues in priority order. For each fix:

1. Read the affected file
2. Apply the fix using patterns from the `wcag-fix` skill
3. Verify the fix doesn't break existing functionality

#### Fix Order

**Phase 1: Page-Level Foundation**
These affect every page and should be fixed first:

| Fix | Files | Pattern |
|-----|-------|---------|
| Add `lang` to `<html>` | Root layout/app.tsx | `<html lang="en">` |
| Add skip navigation link | Root layout | `SkipLink` component from wcag-fix skill |
| Verify landmark regions | Layout components | `<header>`, `<main>`, `<nav>`, `<footer>` |
| Fix heading hierarchy | All page components | Sequential h1-h6, single h1 per page |
| Add page titles | All routes | Unique `<title>` via TanStack `head()` |
| Add route announcer | Root layout | `RouteAnnouncer` component from wcag-fix skill |

**Phase 2: Interactive Elements**
Fix keyboard access and focus management:

| Fix | Files | Pattern |
|-----|-------|---------|
| Add focus styles | Global CSS | `focus-visible:ring-2 focus-visible:ring-ring` |
| Fix keyboard navigation | Custom components | Add key handlers, use semantic elements |
| Fix focus traps | Dialogs, modals, drawers | Verify shadcn Dialog handles this; fix custom ones |
| Focus restoration | Modal triggers | Return focus to trigger on close |
| Target size | Small buttons, icon buttons | `min-h-6 min-w-6` (24px minimum) |

**Phase 3: Forms**
Fix form accessibility:

| Fix | Files | Pattern |
|-----|-------|---------|
| Associate labels | All form fields | `<label htmlFor>` or `aria-label` |
| Required field indicators | Required inputs | Visual `*` + `aria-required="true"` |
| Error messages | Validation | `role="alert"` + `aria-describedby` |
| Error summary | Form components | Error summary linking to fields |
| Autocomplete | User data inputs | `autocomplete` attributes |

**Phase 4: Images & Media**
Fix non-text content:

| Fix | Files | Pattern |
|-----|-------|---------|
| Add alt text | All `<img>` | Descriptive alt or `alt=""` for decorative |
| Icon accessibility | Icon-only buttons | `aria-label` on button, `aria-hidden` on icon |
| SVG accessibility | Inline SVGs | `role="img" aria-label="..."` |
| Reduced motion | Animations | `prefers-reduced-motion` media query |

**Phase 5: Color & Contrast**
Fix visual accessibility:

| Fix | Files | Pattern |
|-----|-------|---------|
| Text contrast | CSS variables, theme | Adjust OKLCH lightness to meet 4.5:1 |
| Non-text contrast | Borders, icons, focus rings | Meet 3:1 ratio |
| Color independence | Status indicators | Add icons/text alongside color |

**Phase 6: Dynamic Content & ARIA**
Fix screen reader experience:

| Fix | Files | Pattern |
|-----|-------|---------|
| Live regions | Toast, notifications, search | `aria-live="polite"` or `role="status"` |
| Accessible names | Custom controls | `aria-label` or `aria-labelledby` |
| Table accessibility | Data tables | `<th scope>`, `<caption>`, `aria-sort` |
| Tab accessibility | Tab components | ARIA tab pattern with keyboard nav |

### Step 3: Verify Fixes

After applying fixes, run verification:

```bash
# If axe-core is installed
npx axe http://localhost:3000 --rules wcag2aa,wcag22aa

# Re-run codebase scans to verify issues resolved
grep -rn '<img' --include="*.tsx" | grep -v 'alt='
grep -rn 'onClick' --include="*.tsx" | grep -E '<(div|span).*onClick'
grep -rn 'tabIndex=[{"]?[1-9]' --include="*.tsx"
```

### Step 4: Update Audit Report

If an audit report exists, update it with fix status:

- Mark fixed issues as resolved
- Update scores
- Note any remaining issues with explanations

Write updated report to `.claude/rubot/wcag-audit-report.md`.

### Step 5: Present Results

```
questions:
  - question: "Accessibility fixes complete! Fixed [X] of [Y] issues. Score improved from [old] to [new]. What's next?"
    header: "Fix Results"
    options:
      - label: "Run validation (/rubot-check)"
        description: "Verify fixes didn't break anything"
      - label: "Re-audit (/rubot-wcag-audit)"
        description: "Run a fresh audit to verify compliance"
      - label: "Commit changes (/rubot-commit)"
        description: "Stage and commit all accessibility fixes"
      - label: "Done for now"
        description: "Stop here — I'll review the changes manually"
    multiSelect: false
```

## Guidelines

- Prefer semantic HTML over ARIA attributes. A `<button>` is better than `<div role="button">`.
- Don't add ARIA to elements that already have implicit roles (e.g., `role="navigation"` on `<nav>` is redundant).
- When in doubt about the right pattern, consult the `wcag-fix` skill's component patterns.
- Test keyboard navigation after every focus-related fix.
- Each fix should be minimal and focused — don't refactor surrounding code.

## Related Commands

- `/rubot-wcag-audit` — Run accessibility audit first
- `/rubot-check` — General project validation
- `/rubot-commit` — Commit accessibility fixes

## Related Skills

- `wcag-fix` — Implementation patterns and component examples
- `wcag-audit` — Audit methodology and scoring
