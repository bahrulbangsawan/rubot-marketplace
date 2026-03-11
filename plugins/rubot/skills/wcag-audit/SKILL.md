---
name: wcag-audit
version: 1.1.0
description: |
  Audit websites, pages, and components for WCAG 2.2 Level AA accessibility compliance, producing scored reports with prioritized remediation plans.
  MUST activate for: run an accessibility audit, check WCAG 2.2 compliance, assess ADA/Section 508 compliance, generate an accessibility report, audit forms for missing labels/ARIA attributes/error announcements, check color contrast ratios against 4.5:1 AA threshold, audit data tables for th scope/caption/keyboard navigation, evaluate focus management (2.4.11 Focus Not Obscured, 2.4.3 Focus Order), run axe-core or Lighthouse accessibility scans, perform manual keyboard navigation testing, investigate screen reader issues, do a pre-launch accessibility check, WCAG, accessibility audit, a11y audit, ADA compliance, Section 508, screen reader issues, is my site accessible, accessibility compliance, accessibility score, Lighthouse accessibility, keyboard navigation problems, contrast ratio check, focus trap issues, assistive technology.
  Also activate when: user asks for a WCAG compliance report with severity-based prioritization, user wants to validate fixes against WCAG 2.2 success criteria, user needs to evaluate ADA or Section 508 compliance requirements for a public-facing site.
  Do NOT activate for: fixing individual accessibility issues (use wcag-fix), adding specific ARIA attributes, implementing skip-to-content links, adding alt text, setting up eslint-plugin-jsx-a11y, or adding prefers-reduced-motion. Those are implementation tasks, not auditing.
  Covers: automated testing (axe-core, Lighthouse), semi-automated codebase scanning (anti-patterns), manual keyboard navigation testing, screen reader testing (VoiceOver, NVDA, JAWS), visual testing (contrast, zoom, reflow, reduced motion), WCAG 2.2 AA success criteria (Perceivable, Operable, Understandable, Robust), severity-based scoring system, scored audit reports with phased remediation plans.
agents:
  - seo-master
  - responsive-master
  - shadcn-ui-designer
---

# WCAG 2.2 Audit Skill

> Systematic accessibility auditing for WCAG 2.2 Level AA compliance

## When to Use

- Running accessibility audits on pages or components
- Generating WCAG 2.2 compliance reports
- Creating prioritized remediation plans for accessibility issues
- Reviewing code for accessibility before deployment or PR merge
- Investigating screen reader, keyboard, or visual accessibility issues
- Validating fixes against WCAG 2.2 success criteria
- Performing pre-launch accessibility checks for public-facing sites
- Evaluating ADA or Section 508 compliance requirements

For implementation patterns and code fixes, see the `wcag-fix` skill.

## Quick Reference

| Audit Phase | Method | What It Catches | Coverage |
|-------------|--------|-----------------|----------|
| Phase 1: Automated | axe-core, Lighthouse | Missing alt text, contrast failures, missing labels, ARIA errors | ~30-40% of issues |
| Phase 2: Semi-Automated | Codebase grep scans | Anti-patterns (onClick without labels, positive tabindex, autoplay) | Pattern-level violations |
| Phase 3: Manual Keyboard | Tab through all flows | Focus traps, unreachable elements, missing skip links, broken tab order | Operability issues |
| Phase 4: Manual Screen Reader | VoiceOver / NVDA | Announcement gaps, missing live regions, confusing reading order | Perceivability issues |
| Phase 5: Visual Review | Zoom, contrast, motion | Reflow failures, contrast edge cases, motion sensitivity | Visual access issues |

## Core Principles

### 1. Automated + Manual Testing Are Both Required

Automated tools (axe, Lighthouse) catch only 30-40% of WCAG violations. They excel at programmatic checks like missing alt attributes, contrast ratios, and ARIA syntax errors. But they cannot evaluate whether alt text is meaningful, whether keyboard navigation is logical, or whether screen reader announcements make sense in context. Manual testing catches the remaining 60-70%. Neither approach alone is sufficient — always combine both.

### 2. Severity Levels Drive Prioritization

Not all accessibility issues are equal. A critical issue (e.g., no keyboard access to a form) blocks entire user populations from completing tasks. A low issue (e.g., a decorative image with redundant alt text) is cosmetic. Severity-based prioritization ensures the most impactful barriers are removed first, making the biggest real-world difference with limited development time.

### 3. WCAG 2.2 Over 2.1

WCAG 2.2 (published October 2023) adds nine new success criteria that address real gaps in 2.1. Key additions include: dragging movements must have click alternatives (2.5.7), minimum target sizes of 24x24px (2.5.8), consistent help placement (3.2.6), accessible authentication without cognitive function tests (3.3.8), and focus-not-obscured requirements (2.4.11). Always audit against 2.2, not 2.1.

### 4. Accessibility Is a Spectrum, Not a Checkbox

Passing all WCAG criteria does not guarantee a great experience for disabled users. WCAG is a floor, not a ceiling. After achieving compliance, consider usability testing with actual assistive technology users to find experience gaps that no checklist can capture.

## Audit Methodology

### Phase 1: Automated Testing

Run automated tools first to catch low-hanging issues. These typically find ~30-40% of WCAG violations.

```bash
# Install axe-core for automated scanning
bun add -D @axe-core/cli

# Run axe on a URL
npx axe http://localhost:3000 --rules wcag2aa,wcag22aa

# Run axe on multiple pages
npx axe http://localhost:3000 http://localhost:3000/about http://localhost:3000/contact
```

**Lighthouse Accessibility Audit:**
```bash
# Via Chrome DevTools > Lighthouse > Accessibility
# Or via CLI
npx lighthouse http://localhost:3000 --only-categories=accessibility --output=json
```

### Phase 2: Semi-Automated Review

Scan the codebase for common accessibility anti-patterns:

```bash
# Images missing alt text
grep -rn '<img' --include="*.tsx" --include="*.jsx" | grep -v 'alt='

# Interactive elements without accessible names
grep -rn 'onClick' --include="*.tsx" | grep -v 'aria-label\|aria-labelledby\|title'

# Missing form labels
grep -rn '<input\|<select\|<textarea' --include="*.tsx" | grep -v 'aria-label\|id=.*\|aria-labelledby'

# Hardcoded color values (potential contrast issues)
grep -rn 'color:\s*#\|color:\s*rgb' --include="*.css" --include="*.tsx"

# Missing lang attribute
grep -rn '<html' --include="*.tsx" --include="*.html" | grep -v 'lang='

# Positive tabindex (disrupts tab order)
grep -rn 'tabIndex=[{"]?[1-9]' --include="*.tsx" --include="*.jsx"

# Autoplaying media
grep -rn 'autoPlay\|autoplay' --include="*.tsx" --include="*.jsx"
```

### Phase 3: Manual Testing

Manual testing catches the ~60-70% of issues that automated tools miss.

**Keyboard Navigation Checklist:**
| Test | How | Pass Criteria |
|------|-----|---------------|
| Tab through page | Press Tab repeatedly | All interactive elements reachable |
| Reverse tab | Shift+Tab | Logical reverse order |
| Activate controls | Enter/Space | Buttons, links, toggles work |
| Close overlays | Escape | Dialogs, dropdowns dismiss |
| Navigate menus | Arrow keys | Menu items accessible |
| Skip navigation | Tab from top | Skip link appears and works |
| No traps | Tab through modals | Focus always escapable |

**Screen Reader Testing:**
| Reader | Platform | Command |
|--------|----------|---------|
| VoiceOver | macOS | Cmd+F5 to toggle |
| NVDA | Windows | Free download from nvaccess.org |
| JAWS | Windows | Commercial, industry standard |
| TalkBack | Android | Settings > Accessibility |

**Visual Testing:**
| Test | Tool/Method |
|------|-------------|
| Color contrast | Chrome DevTools > Rendering > CSS Overview |
| High contrast mode | Windows High Contrast or forced-colors media query |
| 200% zoom | Ctrl/Cmd + to zoom, verify no content loss |
| 400% zoom (reflow) | Content reflows to single column, no horizontal scroll |
| Reduced motion | prefers-reduced-motion: reduce in DevTools |

## WCAG 2.2 AA Success Criteria Quick Reference

For the complete criteria list with examples and techniques, see [references/success-criteria.md](references/success-criteria.md).

### Perceivable (Principle 1)

| SC | Name | Key Requirement |
|----|------|-----------------|
| 1.1.1 | Non-text Content | All images, icons, controls have text alternatives |
| 1.2.1-5 | Time-based Media | Captions, audio descriptions, transcripts |
| 1.3.1 | Info and Relationships | Semantic HTML structure (headings, lists, tables) |
| 1.3.2 | Meaningful Sequence | DOM order matches visual order |
| 1.3.3 | Sensory Characteristics | Don't rely solely on shape, size, position, or sound |
| 1.3.4 | Orientation | Content works in portrait and landscape |
| 1.3.5 | Identify Input Purpose | Use autocomplete attributes on user data inputs |
| 1.4.1 | Use of Color | Color is not the only way to convey info |
| 1.4.2 | Audio Control | Auto-playing audio can be paused/stopped |
| 1.4.3 | Contrast (Minimum) | 4.5:1 for normal text, 3:1 for large text |
| 1.4.4 | Resize Text | Text resizable to 200% without loss |
| 1.4.5 | Images of Text | Use real text, not images of text |
| 1.4.10 | Reflow | No horizontal scroll at 320px width |
| 1.4.11 | Non-text Contrast | 3:1 for UI components and graphical objects |
| 1.4.12 | Text Spacing | Content adapts to custom text spacing |
| 1.4.13 | Content on Hover/Focus | Dismissible, hoverable, persistent |

### Operable (Principle 2)

| SC | Name | Key Requirement |
|----|------|-----------------|
| 2.1.1 | Keyboard | All functionality via keyboard |
| 2.1.2 | No Keyboard Trap | Focus never gets stuck |
| 2.1.4 | Character Key Shortcuts | Single-key shortcuts can be remapped/disabled |
| 2.2.1 | Timing Adjustable | Time limits can be extended |
| 2.2.2 | Pause, Stop, Hide | Moving content can be paused |
| 2.3.1 | Three Flashes | Nothing flashes more than 3 times/second |
| 2.4.1 | Bypass Blocks | Skip navigation links |
| 2.4.2 | Page Titled | Descriptive page titles |
| 2.4.3 | Focus Order | Logical tab sequence |
| 2.4.4 | Link Purpose | Link text describes destination |
| 2.4.5 | Multiple Ways | 2+ ways to find pages (nav, search, sitemap) |
| 2.4.6 | Headings and Labels | Descriptive headings and labels |
| 2.4.7 | Focus Visible | Clear visible focus indicator |
| 2.4.11 | Focus Not Obscured (Min) | Focused element not fully hidden |
| 2.5.1 | Pointer Gestures | Complex gestures have single-pointer alternative |
| 2.5.2 | Pointer Cancellation | Down-event doesn't trigger action alone |
| 2.5.3 | Label in Name | Visible label is part of accessible name |
| 2.5.4 | Motion Actuation | Motion-triggered actions have UI alternative |
| 2.5.7 | Dragging Movements | Drag actions have click alternative |
| 2.5.8 | Target Size (Minimum) | 24x24px minimum target size |

### Understandable (Principle 3)

| SC | Name | Key Requirement |
|----|------|-----------------|
| 3.1.1 | Language of Page | html lang attribute set |
| 3.1.2 | Language of Parts | lang on content in different language |
| 3.2.1 | On Focus | No unexpected changes on focus |
| 3.2.2 | On Input | No unexpected changes on input |
| 3.2.3 | Consistent Navigation | Navigation order consistent across pages |
| 3.2.4 | Consistent Identification | Same functions labeled consistently |
| 3.2.6 | Consistent Help | Help links in same relative position |
| 3.3.1 | Error Identification | Errors clearly described in text |
| 3.3.2 | Labels or Instructions | Required fields and formats indicated |
| 3.3.3 | Error Suggestion | Suggest corrections when known |
| 3.3.4 | Error Prevention (Legal) | Reversible, checked, confirmed for legal/financial |
| 3.3.7 | Redundant Entry | Don't ask for the same info twice |
| 3.3.8 | Accessible Authentication (Min) | No cognitive function tests for login |

### Robust (Principle 4)

| SC | Name | Key Requirement |
|----|------|-----------------|
| 4.1.2 | Name, Role, Value | All controls have accessible name and role |
| 4.1.3 | Status Messages | Dynamic updates announced to screen readers |

## Scoring System

### Category Weights

| Category | Weight | What's Evaluated |
|----------|--------|-----------------|
| Structure & Semantics | 20% | Heading hierarchy, landmarks, HTML semantics |
| Keyboard & Focus | 20% | Tab order, focus visibility, keyboard operability |
| Color & Contrast | 15% | Text contrast, non-text contrast, color independence |
| Forms & Validation | 15% | Labels, errors, required fields, autocomplete |
| Images & Media | 10% | Alt text, captions, reduced motion |
| ARIA & Screen Reader | 10% | Roles, states, live regions, accessible names |
| Navigation & Wayfinding | 10% | Skip links, page titles, multiple ways, consistent nav |

### Severity Levels

| Level | Impact | Action Required |
|-------|--------|----------------|
| **Critical** | Blocks users entirely (no keyboard access, missing form labels, contrast below 2:1) | Fix immediately |
| **High** | Significant barriers (poor focus visibility, missing skip links, empty alt on informative images) | Fix before release |
| **Medium** | Degraded experience (inconsistent navigation, missing lang on parts, suboptimal target sizes) | Fix in next sprint |
| **Low** | Minor improvements (redundant ARIA, slightly under contrast ratio, decorative image with alt) | Schedule for backlog |

### Score Calculation

```
Score = Sum of (category_weight * category_pass_rate) * 100

Where category_pass_rate = passed_criteria / total_applicable_criteria
```

| Score | Rating | Meaning |
|-------|--------|---------|
| 90-100 | Excellent | Strong WCAG 2.2 AA compliance |
| 75-89 | Good | Minor issues, no critical blockers |
| 50-74 | Needs Work | Significant gaps in compliance |
| 0-49 | Poor | Major accessibility barriers |

## Audit Report Template

```markdown
# WCAG 2.2 Accessibility Audit Report

**URL**: [audited URL]
**Date**: [timestamp]
**Scope**: [pages/components audited]
**Target Level**: AA
**Overall Score**: [calculated score]/100 — [rating]

## Executive Summary

[2-3 sentences summarizing findings, critical count, and top priority]

## Score Breakdown

| Category | Score | Issues |
|----------|-------|--------|
| Structure & Semantics | [X]% | [count] |
| Keyboard & Focus | [X]% | [count] |
| Color & Contrast | [X]% | [count] |
| Forms & Validation | [X]% | [count] |
| Images & Media | [X]% | [count] |
| ARIA & Screen Reader | [X]% | [count] |
| Navigation & Wayfinding | [X]% | [count] |

## Issues Found

### Critical

| # | WCAG SC | Issue | Location | Impact |
|---|---------|-------|----------|--------|
| 1 | [SC#] | [description] | [file:line or selector] | [who is affected] |

### High

| # | WCAG SC | Issue | Location | Impact |
|---|---------|-------|----------|--------|
| 1 | [SC#] | [description] | [file:line or selector] | [who is affected] |

### Medium

| # | WCAG SC | Issue | Location | Impact |
|---|---------|-------|----------|--------|
| 1 | [SC#] | [description] | [file:line or selector] | [who is affected] |

### Low

| # | WCAG SC | Issue | Location | Impact |
|---|---------|-------|----------|--------|
| 1 | [SC#] | [description] | [file:line or selector] | [who is affected] |

## Remediation Plan

### Phase 1: Critical Fixes (Immediate)
| # | Issue | Fix | Estimated Effort | WCAG SC |
|---|-------|-----|-------------------|---------|
| 1 | [issue] | [fix description] | [hours] | [SC#] |

### Phase 2: High Priority (Before Release)
| # | Issue | Fix | Estimated Effort | WCAG SC |
|---|-------|-----|-------------------|---------|
| 1 | [issue] | [fix description] | [hours] | [SC#] |

### Phase 3: Medium Priority (Next Sprint)
| # | Issue | Fix | Estimated Effort | WCAG SC |
|---|-------|-----|-------------------|---------|
| 1 | [issue] | [fix description] | [hours] | [SC#] |

### Phase 4: Low Priority (Backlog)
| # | Issue | Fix | Estimated Effort | WCAG SC |
|---|-------|-----|-------------------|---------|
| 1 | [issue] | [fix description] | [hours] | [SC#] |
```

## Integration with Existing Workflow

### Adding to `/rubot-check` Validation

The accessibility audit integrates as a validation step. When the project targets public-facing pages, include WCAG checks alongside the existing responsive audit and SEO audit.

### Related Skills

- `wcag-fix` — Implementation patterns for fixing accessibility issues
- `core-web-vitals` — Performance optimization (overlaps with perceived accessibility)
- `schema-markup` — Structured data (supports assistive technology discovery)

### Related Commands

- `/rubot-wcag-audit` — Run a WCAG 2.2 audit on a URL
- `/rubot-wcag-fix` — Fix accessibility issues from audit findings

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| axe reports 0 issues but site is not accessible | axe only catches programmatic issues (missing attributes, invalid ARIA), not UX problems like confusing reading order or poor focus management | Always pair automated testing with manual keyboard and screen reader testing |
| Lighthouse score is 100 but keyboard navigation is broken | Lighthouse accessibility checks do not fully test keyboard operability, focus traps, or complex widget interactions | Run the full keyboard navigation checklist from Phase 3 manually |
| Screen reader announces elements in wrong order | Visual order (CSS) differs from DOM order, or flex/grid `order` property rearranges elements | Ensure DOM source order matches visual reading order; avoid CSS `order` for content reordering |
| Contrast checker says pass but text is hard to read | WCAG contrast ratios are minimums, not guarantees of readability; thin fonts, busy backgrounds, and transparency reduce legibility | Aim for 7:1 (AAA) on body text; avoid thin font weights below 300; test on real screens |
| Focus indicator is invisible on some elements | Custom styles or CSS resets override default browser focus outlines | Add explicit `:focus-visible` styles with minimum 2px outline and 3:1 contrast against adjacent colors |
| Dynamic content updates are silent to screen readers | Content injected via JavaScript does not trigger assistive technology announcements | Use `aria-live="polite"` regions or `role="status"` / `role="alert"` for dynamic updates |
| Audit misses issues in SPA route changes | Single-page apps do not trigger page load events that reset screen reader state | Manage focus on route change (move focus to main heading or use `aria-live` announcements) |

## Constraints

- **Automated tools have hard limits.** No automated tool can evaluate whether alt text is meaningful, navigation is intuitive, or error messages are helpful. Automated coverage tops out at ~40% of WCAG criteria.
- **WCAG compliance does not equal usability.** A site can pass every WCAG 2.2 AA criterion and still be frustrating for disabled users. Compliance is necessary but not sufficient — usability testing with real assistive technology users is the gold standard.
- **Legal requirements vary by jurisdiction.** ADA (US), EN 301 549 (EU), AODA (Ontario), and DDA (UK/Australia) reference different WCAG versions and levels. Always confirm which standard applies to the project before auditing.
- **Component-level audits miss page-level issues.** Auditing individual components in isolation cannot catch issues like heading hierarchy gaps, missing skip links, or inconsistent navigation that only appear in the full page context.
- **WCAG 2.2 is not the final word.** WCAG 3.0 (Silver) is in development and will eventually replace 2.x with a new conformance model. For now, 2.2 AA is the current standard, but stay informed about upcoming changes.

## Verification Checklist

This checklist verifies the audit itself was thorough — separate from the compliance checklist in the audit report.

- [ ] Automated scan was run with axe-core or equivalent on all pages in scope
- [ ] Lighthouse accessibility audit was run and results compared with axe findings
- [ ] Semi-automated codebase scan was run for common anti-patterns (missing alt, onClick without labels, positive tabindex)
- [ ] Manual keyboard testing was performed on all core user flows
- [ ] Screen reader testing was performed with at least one reader (VoiceOver, NVDA, or JAWS)
- [ ] Color contrast was verified for both normal text (4.5:1) and large text (3:1)
- [ ] Non-text contrast was verified for UI components and graphical objects (3:1)
- [ ] Page was tested at 200% and 400% zoom for content reflow
- [ ] Reduced motion preference was tested (prefers-reduced-motion)
- [ ] All four WCAG principles were covered (Perceivable, Operable, Understandable, Robust)
- [ ] Severity levels were assigned to every issue found
- [ ] Remediation plan was created with phased priorities
- [ ] WCAG 2.2-specific criteria were explicitly checked (2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8)
- [ ] Audit report was generated using the standard template

## References

- WCAG 2.2 Specification: https://www.w3.org/TR/WCAG22/
- Understanding WCAG 2.2: https://www.w3.org/WAI/WCAG22/Understanding/
- WCAG Techniques: https://www.w3.org/WAI/WCAG22/Techniques/
- axe-core Rules: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
- WAI-ARIA Practices: https://www.w3.org/WAI/ARIA/apg/
- Deque University: https://dequeuniversity.com/
- WCAG 2.2 What's New: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- Section 508 Standards: https://www.section508.gov/
