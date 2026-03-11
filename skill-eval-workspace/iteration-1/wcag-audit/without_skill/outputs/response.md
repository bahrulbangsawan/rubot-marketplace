# WCAG 2.2 AA Accessibility Audit — Landing Page

**URL**: http://localhost:3000
**Target**: WCAG 2.2 Level AA compliance
**Page sections**: Hero, Feature cards grid, Testimonial carousel, Pricing table, Contact form

## Overview

To achieve WCAG 2.2 AA compliance before launch, you need to audit the landing page across the four WCAG principles: Perceivable, Operable, Understandable, and Robust. Here is a breakdown of what to check and likely issues for each section.

## Automated Testing

Start by running automated tools:

```bash
# Install and run axe-core
npm install -D @axe-core/cli
npx axe http://localhost:3000

# Run Lighthouse accessibility audit
npx lighthouse http://localhost:3000 --only-categories=accessibility
```

These tools will catch things like missing alt text, contrast failures, missing form labels, and ARIA errors. However, automated tools only catch about 30-40% of accessibility issues, so manual testing is also needed.

## Manual Testing

### Keyboard Navigation

- Tab through the entire page to make sure every interactive element is reachable
- Make sure the testimonial carousel can be controlled with keyboard (arrow keys, and a way to pause auto-play)
- Verify the contact form can be filled out and submitted entirely via keyboard
- Check that focus is never trapped anywhere
- Ensure there is a visible focus indicator on all interactive elements

### Screen Reader

- Test with VoiceOver (Mac) or NVDA (Windows)
- Make sure headings are properly structured (h1 for hero, h2 for sections)
- Verify form fields are announced with their labels
- Check that the carousel announces slide changes

### Visual Checks

- Test at 200% and 400% zoom — content should reflow without horizontal scrolling
- Verify text contrast is at least 4.5:1 for normal text and 3:1 for large text
- Check that color is not the only way to convey information

## Section-Specific Concerns

### Hero Section
- If there is a background image with text on top, make sure there is sufficient contrast
- Hero image needs appropriate alt text
- CTA button must be keyboard accessible

### Feature Cards Grid
- Each card should use proper heading elements
- Icons should have alt text or be marked as decorative
- If cards are clickable, they need keyboard access

### Testimonial Carousel
- Must have pause/stop control for auto-rotation
- Keyboard navigation for next/previous slides
- Screen reader announcements for slide changes
- If swipe gestures are used, provide button alternatives

### Pricing Table
- Use proper table markup or ARIA roles
- "Select plan" buttons should have unique accessible names (e.g., "Select Basic plan" not just "Select")
- Do not use color alone to indicate the recommended plan

### Contact Form
- All inputs need visible labels
- Required fields should be indicated both visually and programmatically
- Error messages should be descriptive and associated with their fields
- Use autocomplete attributes where appropriate
- Success/error states should be announced to screen readers

## Page-Level Requirements

- Add a skip navigation link
- Set the `lang` attribute on the `<html>` element
- Ensure a descriptive page title
- Logical heading hierarchy
- Minimum touch/click target size of 24x24px (new in WCAG 2.2)

## Key WCAG 2.2 Additions to Check

WCAG 2.2 added several new criteria beyond 2.1:
- **2.4.11 Focus Not Obscured**: Make sure focused elements are not hidden behind sticky headers
- **2.5.7 Dragging Movements**: If the carousel uses drag, provide a click alternative
- **2.5.8 Target Size (Minimum)**: Interactive elements need to be at least 24x24px
- **3.2.6 Consistent Help**: If you have a help link, it should be in the same position
- **3.3.7 Redundant Entry**: Do not ask users for the same info twice in the form
- **3.3.8 Accessible Authentication**: No cognitive function tests for any login

## Prioritized Fix Order

Given the one-week timeline, prioritize fixes in this order:

1. **Critical (fix first)**: Missing form labels, keyboard traps, missing skip link, lang attribute, severe contrast failures
2. **High (fix before launch)**: Focus indicators, carousel pause control, unique button names, screen reader announcements
3. **Medium (fix if time permits)**: Autocomplete attributes, target sizes, focus-not-obscured issues
4. **Low (post-launch)**: Decorative image cleanup, text spacing tolerance, high contrast mode

## Tools Summary

- **axe-core / axe DevTools**: Automated scanning
- **Lighthouse**: Accessibility scoring
- **Chrome DevTools**: Contrast checking, CSS overview
- **VoiceOver / NVDA**: Screen reader testing
- **Keyboard**: Manual tab-through testing

Run the automated tools first, fix critical issues, then do manual testing to catch the remaining 60-70% of potential issues.
