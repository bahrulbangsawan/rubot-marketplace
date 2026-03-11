---
name: rubot-responsive-audit
description: Audit and fix responsive layout issues across all breakpoints. Use when the user wants to check responsive behavior, fix mobile layouts, audit breakpoint consistency, convert px to rem, or validate responsive quality across xs/sm/md/lg.
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

# Responsive Layout Audit & Fix Command

Audit and fix responsive layout issues across all 4 breakpoints (xs, sm, md, lg) with mobile as highest priority.

## Prerequisites

Before running this command:
1. Load the `responsive-design` skill for patterns and validation rules
2. Have the target codebase path or component files ready
3. Dev server should be running if visual verification is needed

## Execution Steps

### Step 1: Confirm Audit Scope

Use the AskUserQuestion tool to clarify what to audit:

```
questions:
  - question: "What would you like to audit for responsive design?"
    header: "Audit Scope"
    options:
      - label: "Full codebase audit"
        description: "Scan all components, pages, and layouts for responsive issues"
      - label: "Specific components only"
        description: "I'll specify which components or pages to audit"
      - label: "Quick px-to-rem conversion"
        description: "Find and convert all px values to rem across the codebase"
      - label: "Carousel & cards only"
        description: "Fix carousel slide counts and card radius consistency"
    multiSelect: false
  - question: "What is the highest priority?"
    header: "Priority Focus"
    options:
      - label: "Mobile (xs) — fix first"
        description: "Focus on phones (0-575px), then scale up"
      - label: "All breakpoints equally"
        description: "Fix issues across xs, sm, md, and lg together"
      - label: "Tablet (md) focus"
        description: "Special attention to 768-991px range"
    multiSelect: false
```

### Step 2: Scan for Unit Violations

Use Grep to find `px` usage violations across the codebase:

**Font size violations:**
```
Grep pattern: "text-\[\d+px\]|font-size:\s*\d+px|fontSize:\s*['\"]?\d+px"
  glob: "*.tsx,*.jsx,*.css,*.ts"
```

**Spacing violations (margin, padding, gap):**
```
Grep pattern: "[mp][xytblr]?-\[\d+px\]|gap-\[\d+px\]|margin:\s*\d+px|padding:\s*\d+px"
  glob: "*.tsx,*.jsx,*.css,*.ts"
```

**Dimension violations (width, height):**
```
Grep pattern: "[wh]-\[\d+px\]|width:\s*\d+px|height:\s*\d+px|min-height:\s*\d+px|max-width:\s*\d+px"
  glob: "*.tsx,*.jsx,*.css,*.ts"
```

**Border radius violations on cards:**
```
Grep pattern: "rounded-\[\d+px\]|border-radius:\s*\d+px"
  glob: "*.tsx,*.jsx,*.css,*.ts"
```

Exclude from scan:
- `node_modules/`, `.next/`, `dist/`, `build/`
- `1px` border values (these are acceptable)
- SVG attributes (viewBox, etc.)
- Third-party library files

### Step 3: Audit Component Patterns

For each major component category, verify compliance with the `responsive-design` skill:

**Hero Section:**
- [ ] Uses `min-h-dvh` (not `min-h-screen` or fixed height) on mobile
- [ ] Content centered with flexbox
- [ ] CTAs stack vertically on mobile, row on sm+
- [ ] No viewport overflow

**Navigation/Drawer:**
- [ ] Mobile drawer has visible close button (X icon)
- [ ] Menu items have hover/active/focus states
- [ ] Touch targets ≥ 2.75rem height
- [ ] Drawer width uses rem or %, not px

**Cards:**
- [ ] All cards use `rounded-[10%]` (or CSS variable equivalent)
- [ ] Cards have `overflow-hidden` to respect rounded corners
- [ ] Card content padding scales with breakpoint

**Carousels:**
- [ ] Mobile shows `basis-full` (1 card per slide)
- [ ] No cut-off or partial cards visible on mobile
- [ ] Proper gap matching (negative margin on content = padding on item)

**Grid Layouts:**
- [ ] `grid-cols-1` on mobile (xs)
- [ ] Progressive column count: `sm:grid-cols-2`, `lg:grid-cols-3`
- [ ] Gap scales with breakpoint

### Step 4: Check Tailwind Breakpoint Config

Verify the project's Tailwind breakpoints match the expected system:

```
Grep pattern: "screens" glob: "**/tailwind.config.*"
```

Expected breakpoints:
- `sm: '576px'`
- `md: '768px'`
- `lg: '992px'`

If using default Tailwind breakpoints (640, 768, 1024), flag for the user to decide whether to customize.

### Step 5: Check Base Font Size

```
Grep pattern: "font-size|fontSize" glob: "**/*.css,**/globals.css,**/global.css,**/index.css"
```

Verify `html` / `:root` uses `100%` or `16px` base, not a custom px value that would break rem calculations.

### Step 6: Generate Audit Report

Compile all findings into the report format:

```markdown
# Responsive Audit Report

**Date**: [timestamp]
**Scope**: [full codebase / specific components]
**Overall Score**: [calculated]/100

## Unit Violation Summary

| Category | Violations Found | Files Affected |
|----------|-----------------|----------------|
| Font sizes (px) | X | [list] |
| Spacing (px) | X | [list] |
| Dimensions (px) | X | [list] |
| Card radius (px) | X | [list] |
| **Total** | **X** | **Y files** |

## Component Audit

### Hero Section
- Status: ✅ Pass / ⚠️ Issues / ❌ Failing
- Details: [findings]

### Mobile Drawer
- Status: ✅ Pass / ⚠️ Issues / ❌ Failing
- Has close button: ✅/❌
- Interaction states: ✅/❌

### Cards
- Status: ✅ Pass / ⚠️ Issues / ❌ Failing
- Consistent 10% radius: ✅/❌

### Carousels
- Status: ✅ Pass / ⚠️ Issues / ❌ Failing
- 1 card per slide on mobile: ✅/❌

### Grid Layouts
- Status: ✅ Pass / ⚠️ Issues / ❌ Failing

## Breakpoint Configuration
- Custom breakpoints: ✅ Configured / ⚠️ Using defaults
- Base font size: ✅ 100% / ❌ [actual value]

## Priority Fixes
1. **Critical**: [most impactful issue]
2. **High**: [second priority]
3. **Medium**: [improvement]
4. **Low**: [nice-to-have]
```

Write the report to `.claude/rubot/responsive-audit-report.md`.

### Step 7: Scoring Rubric

| Category | Weight | Checks |
|----------|--------|--------|
| Unit Compliance | 30% | Zero px violations in fonts, spacing, dimensions |
| Mobile Layout | 25% | Hero dvh, drawer close button, carousel 1-card, touch targets |
| Card Consistency | 10% | 10% radius, overflow hidden |
| Breakpoint Behavior | 20% | No overflow, no clipping, proper scaling |
| Typography Scaling | 15% | rem fonts, responsive heading scale, readable body text |

### Step 8: Present Results and Offer Fixes

**If score >= 80:**
```
questions:
  - question: "Responsive audit complete! Score: [X]/100. [N] issues found. What next?"
    header: "Audit Results"
    options:
      - label: "Create fix plan with OpenSpec (Recommended)"
        description: "Generate an OpenSpec change proposal and rubot execution plan for all responsive fixes"
      - label: "Auto-fix all issues"
        description: "Convert px to rem, fix card radius, update breakpoints"
      - label: "Fix critical/high only"
        description: "Fix the most impactful issues first"
      - label: "Review report first"
        description: "Read the full report before deciding"
      - label: "Done for now"
        description: "Save report and stop"
    multiSelect: false
```

**If score < 80:**
```
questions:
  - question: "Responsive audit complete. Score: [X]/100 — needs work. [N] critical issues. How to proceed?"
    header: "Audit Results"
    options:
      - label: "Create fix plan with OpenSpec (Recommended)"
        description: "Generate an OpenSpec change proposal and rubot execution plan for responsive fixes"
      - label: "Fix critical issues first"
        description: "Start with layout-breaking issues and px violations"
      - label: "Full responsive overhaul"
        description: "Systematically fix everything across all breakpoints"
      - label: "Review report first"
        description: "Read the full report before deciding"
      - label: "Done for now"
        description: "Save report and stop"
    multiSelect: false
```

### Step 9: Create OpenSpec Plan (If Requested)

If the user chose "Create fix plan with OpenSpec":

1. **Check OpenSpec installation and initialization:**
   ```bash
   which openspec && openspec --version
   ls -d openspec/ 2>/dev/null
   ```
   If not installed or initialized, install with `npm install -g @fission-ai/openspec@latest` and run `openspec init && openspec update`.

2. **Create OpenSpec change** named `fix-responsive-issues` using the `/opsx:propose` workflow:
   - `proposal.md` — Responsive audit findings, score, impact assessment
   - `specs/` — Requirements from audit checklist failures
   - `design.md` — Technical approach for responsive fixes (unit conversions, component patterns)
   - `tasks.md` — Ordered fix checklist from the audit's priority recommendations

3. **Invoke agents** for domain analysis:
   - `responsive-master` — Validate fix approach for breakpoint behavior
   - `shadcn-ui-designer` — Review component pattern changes

4. **Generate rubot execution plan** at `.claude/rubot/plan.md` following the standard format from `/rubot-plan`

5. **Ask to execute:**
   ```
   questions:
     - question: "Responsive fix plan created with OpenSpec. Execute now?"
       header: "Execute Plan"
       options:
         - label: "Yes, execute now"
           description: "Proceed with /rubot-execute to implement all responsive fixes"
         - label: "No, review first"
           description: "Review plan at .claude/rubot/plan.md and OpenSpec artifacts"
         - label: "Modify plan"
           description: "Make changes before execution"
       multiSelect: false
   ```

### Step 10: Apply Fixes Directly (If Requested)

If the user chose to fix directly without an OpenSpec plan, follow this priority order:
1. **Unit conversions**: Replace all px values with rem equivalents (divide by 16)
2. **Card radius**: Replace all card border-radius with `rounded-[10%]`
3. **Hero section**: Ensure `min-h-dvh`, flexbox centering, stacked CTAs
4. **Mobile drawer**: Add close button, interaction states, proper sizing
5. **Carousel**: Set `basis-full` on mobile, proper gap matching
6. **Typography**: Apply responsive heading scale pattern
7. **Grid layouts**: Ensure `grid-cols-1` mobile base

After each fix, verify no responsive regressions were introduced.

## Related Commands

- `/rubot-check` — General validation (includes responsive checks)
- `/rubot-wcag-audit` — Accessibility audit (overlapping with touch targets, focus)
- `/rubot-seo-check-vitals` — Core Web Vitals (CLS from layout issues)

## Related Skills

- `responsive-design` — Patterns, rules, and component examples
- `core-web-vitals` — CLS prevention
- `wcag-audit` — Accessibility touch targets and focus
