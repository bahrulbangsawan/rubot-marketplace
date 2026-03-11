# WCAG 2.2 Accessibility Audit Report

**URL**: http://localhost:3000
**Date**: 2026-03-11
**Scope**: Landing page — Hero section, Feature cards grid, Testimonial carousel, Pricing table, Contact form
**Target Level**: AA
**Overall Score**: Pending automated + manual testing (see plan below)

## Executive Summary

This audit plan covers a full WCAG 2.2 Level AA assessment of the landing page at http://localhost:3000 across all five sections. The audit follows a five-phase methodology combining automated scanning, semi-automated code review, and manual keyboard/screen reader/visual testing. Given the one-week deadline before launch, the remediation plan is phased by severity to ensure critical and high-priority blockers are resolved first.

## Audit Plan — Five-Phase Methodology

### Phase 1: Automated Testing (~30-40% Issue Coverage)

Run automated tools first to catch programmatic violations.

```bash
# Install axe-core for automated scanning
bun add -D @axe-core/cli

# Run axe on the landing page with WCAG 2.2 AA ruleset
npx axe http://localhost:3000 --rules wcag2aa,wcag22aa

# Run Lighthouse accessibility audit
npx lighthouse http://localhost:3000 --only-categories=accessibility --output=json
```

**What this catches:** Missing alt text, contrast ratio failures, missing form labels, ARIA syntax errors, missing lang attribute, heading hierarchy gaps.

**What this misses:** Whether alt text is meaningful, whether keyboard navigation is logical, whether screen reader announcements make sense in context. That is why phases 3-5 are mandatory.

### Phase 2: Semi-Automated Codebase Scan (Pattern-Level Violations)

Scan source files for known anti-patterns that indicate WCAG violations:

```bash
# Images missing alt text
grep -rn '<img' --include="*.tsx" --include="*.jsx" | grep -v 'alt='

# Interactive elements without accessible names (onClick without labels)
grep -rn 'onClick' --include="*.tsx" | grep -v 'aria-label\|aria-labelledby\|title'

# Missing form labels (critical for the contact form)
grep -rn '<input\|<select\|<textarea' --include="*.tsx" | grep -v 'aria-label\|id=.*\|aria-labelledby'

# Hardcoded color values (potential contrast issues)
grep -rn 'color:\s*#\|color:\s*rgb' --include="*.css" --include="*.tsx"

# Missing lang attribute on html element
grep -rn '<html' --include="*.tsx" --include="*.html" | grep -v 'lang='

# Positive tabindex (disrupts natural tab order)
grep -rn 'tabIndex=[{"]?[1-9]' --include="*.tsx" --include="*.jsx"

# Autoplaying media (testimonial carousel may have autoplay)
grep -rn 'autoPlay\|autoplay' --include="*.tsx" --include="*.jsx"
```

### Phase 3: Manual Keyboard Testing (Operability Issues)

This is essential for each section on the page. Tab through every interactive element and verify:

| Test | How | Pass Criteria |
|------|-----|---------------|
| Tab through entire page | Press Tab repeatedly from top | All interactive elements reachable in logical order |
| Reverse tab | Shift+Tab | Logical reverse order, no elements skipped |
| Activate buttons/links | Enter/Space | Hero CTA, feature card links, pricing buttons, form submit all work |
| Carousel controls | Arrow keys / Tab | Testimonial carousel navigable, slides accessible, pause available |
| Close overlays | Escape | Any modals or dropdowns dismiss correctly |
| Skip navigation | Tab from top of page | Skip link appears and jumps to main content |
| No focus traps | Tab through all sections | Focus never gets stuck (especially in carousel and form) |
| Focus visible | Tab through page | Clear visible focus indicator on every interactive element |

**Section-specific keyboard concerns:**

- **Hero section**: CTA button must be keyboard-accessible with visible focus ring
- **Feature cards grid**: If cards are clickable, each card needs keyboard access and clear focus state
- **Testimonial carousel**: Must be fully operable via keyboard (next/prev/pause), must not trap focus, must have `aria-live` region or equivalent for slide announcements
- **Pricing table**: Comparison information must be navigable; "Select plan" buttons must have distinct accessible names (not just "Select" repeated)
- **Contact form**: All fields must be labeled, error messages announced, submit button keyboard-operable

### Phase 4: Screen Reader Testing (Perceivability Issues)

Test with VoiceOver (macOS: Cmd+F5 to toggle):

| Check | What to Verify |
|-------|---------------|
| Page title | Descriptive title announced on page load |
| Landmark regions | header, nav, main, footer announced correctly |
| Heading hierarchy | h1 for hero, h2 for sections, h3 for subsections — no skipped levels |
| Image alt text | Hero images, feature icons, testimonial photos all announced meaningfully |
| Carousel announcements | Slide changes announced via aria-live region |
| Pricing table structure | Table read correctly with row/column headers |
| Form labels | Every input announced with its label and required state |
| Error messages | Form validation errors announced to screen reader |
| Dynamic content | Any content updates (carousel, form submission) announced |

### Phase 5: Visual Review (Visual Access Issues)

| Test | Method | What to Check |
|------|--------|---------------|
| Color contrast — normal text | Chrome DevTools CSS Overview | 4.5:1 minimum ratio |
| Color contrast — large text | Chrome DevTools CSS Overview | 3:1 minimum ratio |
| Non-text contrast | Manual check on buttons, icons, form borders | 3:1 for UI components |
| 200% zoom | Ctrl/Cmd + zoom | All content readable, no overlap |
| 400% zoom (reflow) | Zoom to 400% | Content reflows to single column, no horizontal scroll at 320px equivalent |
| Reduced motion | Set `prefers-reduced-motion: reduce` in DevTools | Carousel animation pauses or uses crossfade; no parallax in hero |
| Target size | Inspect button/link dimensions | Minimum 24x24px touch/click targets (WCAG 2.5.8) |

## Section-by-Section WCAG 2.2 AA Checklist

### Hero Section

| WCAG SC | Requirement | Check |
|---------|-------------|-------|
| 1.1.1 | Hero image has meaningful alt text (or `alt=""` if decorative with text overlay) | [ ] |
| 1.4.3 | Text over hero image meets 4.5:1 contrast ratio | [ ] |
| 1.4.11 | CTA button has 3:1 contrast against background | [ ] |
| 2.4.7 | CTA button has visible focus indicator | [ ] |
| 2.5.8 | CTA button meets 24x24px minimum target size | [ ] |
| 1.3.1 | h1 used for main heading | [ ] |

### Feature Cards Grid

| WCAG SC | Requirement | Check |
|---------|-------------|-------|
| 1.1.1 | Feature icons have alt text or are aria-hidden with text labels | [ ] |
| 1.3.1 | Cards use semantic HTML (heading for title, paragraph for description) | [ ] |
| 1.3.2 | DOM order of cards matches visual grid order | [ ] |
| 2.1.1 | If cards are interactive, all accessible via keyboard | [ ] |
| 2.4.6 | Each card has descriptive heading | [ ] |
| 2.5.8 | Clickable areas meet 24x24px minimum | [ ] |
| 1.4.1 | Color not the only differentiator between card types | [ ] |

### Testimonial Carousel

| WCAG SC | Requirement | Check |
|---------|-------------|-------|
| 1.1.1 | Testimonial author photos have alt text | [ ] |
| 1.3.1 | Testimonials use blockquote/cite semantics | [ ] |
| 2.1.1 | Carousel fully operable via keyboard (next, prev, pause) | [ ] |
| 2.1.2 | Focus does not get trapped in carousel | [ ] |
| 2.2.2 | Auto-rotation can be paused/stopped | [ ] |
| 2.4.7 | Carousel controls have visible focus indicators | [ ] |
| 4.1.2 | Controls have accessible names ("Next slide", "Previous slide", "Pause carousel") | [ ] |
| 4.1.3 | Slide changes announced to screen readers (aria-live="polite") | [ ] |
| 2.5.7 | If drag-to-swipe is used, click alternative provided | [ ] |
| 2.5.8 | Carousel control buttons meet 24x24px minimum | [ ] |

### Pricing Table

| WCAG SC | Requirement | Check |
|---------|-------------|-------|
| 1.3.1 | Table uses `<table>`, `<th>`, `<td>` with proper headers, OR if CSS grid layout, equivalent ARIA roles | [ ] |
| 1.3.2 | Reading order makes sense — plan names before features | [ ] |
| 1.4.1 | "Recommended" plan not indicated by color alone | [ ] |
| 1.4.3 | All text meets 4.5:1 contrast including price amounts | [ ] |
| 2.4.4 | "Select plan" buttons have distinct accessible names ("Select Basic plan", "Select Pro plan") | [ ] |
| 2.4.6 | Plan names are headings | [ ] |
| 2.5.8 | Select buttons meet 24x24px minimum target size | [ ] |

### Contact Form

| WCAG SC | Requirement | Check |
|---------|-------------|-------|
| 1.3.1 | Form uses `<form>`, `<fieldset>`, `<legend>` appropriately | [ ] |
| 1.3.5 | Inputs have `autocomplete` attributes (name, email, tel) | [ ] |
| 1.4.11 | Input borders have 3:1 contrast against background | [ ] |
| 2.4.7 | All inputs and submit button have visible focus indicators | [ ] |
| 3.3.1 | Validation errors clearly described in text (not just red border) | [ ] |
| 3.3.2 | Required fields indicated (both visually and programmatically: `required` or `aria-required`) | [ ] |
| 3.3.3 | Error messages suggest corrections (e.g., "Enter a valid email like name@example.com") | [ ] |
| 3.3.7 | Form does not ask for the same information twice | [ ] |
| 4.1.2 | All inputs have accessible names via `<label>`, `aria-label`, or `aria-labelledby` | [ ] |
| 4.1.3 | Form submission success/failure announced to screen readers (`role="status"` or `aria-live`) | [ ] |
| 2.5.8 | Submit button meets 24x24px minimum target size | [ ] |

### Page-Level Checks

| WCAG SC | Requirement | Check |
|---------|-------------|-------|
| 2.4.1 | Skip navigation link present, jumps to main content | [ ] |
| 2.4.2 | Page has descriptive `<title>` | [ ] |
| 2.4.3 | Tab order is logical through all five sections | [ ] |
| 2.4.11 | Focused element is never fully obscured by sticky headers or footers | [ ] |
| 3.1.1 | `<html>` has `lang` attribute set | [ ] |
| 3.2.6 | If help/support link exists, it is in consistent position | [ ] |
| 3.3.8 | If any authentication is required, no cognitive function tests | [ ] |
| 1.4.4 | Text resizable to 200% without content loss | [ ] |
| 1.4.10 | No horizontal scroll at 320px width (reflow) | [ ] |
| 1.4.12 | Content adapts to custom text spacing overrides | [ ] |
| 2.3.1 | Nothing flashes more than 3 times per second | [ ] |

## Scoring Framework

After completing all five phases, score each category:

| Category | Weight | What to Evaluate |
|----------|--------|-----------------|
| Structure & Semantics | 20% | Heading hierarchy, landmarks, semantic HTML across all sections |
| Keyboard & Focus | 20% | Tab order through page, focus visibility, carousel keyboard operability |
| Color & Contrast | 15% | Text contrast, CTA button contrast, pricing table contrast, form input contrast |
| Forms & Validation | 15% | Contact form labels, errors, required fields, autocomplete |
| Images & Media | 10% | Hero image alt, feature icons, testimonial photos, carousel motion |
| ARIA & Screen Reader | 10% | Carousel live regions, form status messages, accessible names on controls |
| Navigation & Wayfinding | 10% | Skip link, page title, heading structure for easy navigation |

**Score calculation:**
```
Score = Sum of (category_weight * category_pass_rate) * 100
Where category_pass_rate = passed_criteria / total_applicable_criteria
```

| Score | Rating |
|-------|--------|
| 90-100 | Excellent — strong WCAG 2.2 AA compliance |
| 75-89 | Good — minor issues, no critical blockers |
| 50-74 | Needs Work — significant gaps |
| 0-49 | Poor — major accessibility barriers |

## Remediation Plan (Phased for One-Week Deadline)

### Phase 1: Critical Fixes (Days 1-2)

| Priority | Likely Issue | Fix | Effort | WCAG SC |
|----------|-------------|-----|--------|---------|
| 1 | Missing form labels on contact form | Add `<label>` elements linked to each input via `for`/`id` | 1h | 1.1.1, 4.1.2 |
| 2 | Carousel keyboard trap | Add keyboard handlers for arrow keys, Escape, and ensure Tab exits carousel | 2h | 2.1.1, 2.1.2 |
| 3 | No skip navigation link | Add skip link as first focusable element targeting `<main>` | 30m | 2.4.1 |
| 4 | Missing `lang` attribute on `<html>` | Add `lang="en"` to root element | 5m | 3.1.1 |
| 5 | Text contrast failures on hero overlay | Increase contrast or add text shadow/backdrop | 1h | 1.4.3 |

### Phase 2: High Priority (Days 3-4)

| Priority | Likely Issue | Fix | Effort | WCAG SC |
|----------|-------------|-----|--------|---------|
| 1 | No visible focus indicators | Add `:focus-visible` styles with 2px outline, 3:1 contrast | 2h | 2.4.7 |
| 2 | Carousel auto-play without pause | Add pause/play button with accessible name | 1h | 2.2.2 |
| 3 | Pricing "Select" buttons not distinct | Change to "Select Basic plan", "Select Pro plan" etc. | 30m | 2.4.4 |
| 4 | No `aria-live` on carousel slide changes | Add `aria-live="polite"` wrapper around slide content | 1h | 4.1.3 |
| 5 | Form errors only shown as red border | Add text error messages with `role="alert"` or `aria-live="assertive"` | 2h | 3.3.1, 4.1.3 |

### Phase 3: Medium Priority (Days 5-6)

| Priority | Likely Issue | Fix | Effort | WCAG SC |
|----------|-------------|-----|--------|---------|
| 1 | Missing `autocomplete` on form fields | Add `autocomplete="name"`, `autocomplete="email"`, etc. | 30m | 1.3.5 |
| 2 | Feature cards not using semantic headings | Change card titles to appropriate heading level | 30m | 1.3.1 |
| 3 | Target size too small on carousel dots | Increase to minimum 24x24px | 1h | 2.5.8 |
| 4 | Carousel drag-only navigation | Add click-based prev/next buttons | 1h | 2.5.7 |
| 5 | Focus obscured by sticky header | Add scroll-margin-top to focusable elements | 1h | 2.4.11 |

### Phase 4: Low Priority (Post-Launch Backlog)

| Priority | Issue | Fix | Effort | WCAG SC |
|----------|-------|-----|--------|---------|
| 1 | Decorative images with redundant alt text | Set `alt=""` on decorative images | 30m | 1.1.1 |
| 2 | Custom text spacing tolerance | Test and fix overflow with custom letter/word spacing | 2h | 1.4.12 |
| 3 | High contrast mode support | Test and fix with `forced-colors` media query | 2h | 1.4.11 |

## Verification Checklist (Post-Audit Completeness)

- [ ] Automated scan was run with axe-core on the landing page
- [ ] Lighthouse accessibility audit was run and results compared with axe findings
- [ ] Semi-automated codebase scan was run for common anti-patterns
- [ ] Manual keyboard testing was performed on all five page sections
- [ ] Screen reader testing was performed with VoiceOver (macOS)
- [ ] Color contrast verified for normal text (4.5:1) and large text (3:1)
- [ ] Non-text contrast verified for UI components (3:1)
- [ ] Page tested at 200% and 400% zoom for content reflow
- [ ] Reduced motion preference tested (carousel, hero animations)
- [ ] All four WCAG principles covered (Perceivable, Operable, Understandable, Robust)
- [ ] Severity levels assigned to every issue found
- [ ] Remediation plan created with phased priorities matching the one-week deadline
- [ ] WCAG 2.2-specific criteria explicitly checked (2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8)
- [ ] Audit report generated using the standard template

## Next Steps

1. **Run Phase 1 and Phase 2 now** — Execute the automated tools (`npx axe`, `npx lighthouse`) and the codebase grep scans against the actual source code
2. **Perform manual testing** — Keyboard-tab through the entire page, test with VoiceOver, check zoom/reflow
3. **Generate scored report** — Fill in the score breakdown once all phases are complete
4. **Begin critical fixes immediately** — Focus on form labels, keyboard traps, skip links, and contrast
5. **Use `/rubot-wcag-fix`** to generate implementation code for each identified issue

For fixing the issues found in this audit, use the `wcag-fix` skill which provides implementation patterns and code templates for each category of accessibility fix.
