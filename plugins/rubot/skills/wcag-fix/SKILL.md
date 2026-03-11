---
name: wcag-fix
version: 1.1.0
description: |
  Fix and implement WCAG 2.2 Level AA accessibility patterns in React, shadcn/ui, and TanStack Start. Use when fixing accessibility violations, implementing accessible components, adding ARIA attributes (aria-label, aria-describedby, aria-live, aria-sort, role), fixing keyboard navigation, improving focus management, fixing color contrast ratio (4.5:1, OKLCH adjustments), adding skip-to-content links, making modals/dialogs trap focus, fixing tab order, building accessible dropdown menus with roving tabindex, making forms accessible (label associations, required field indication, validation error linking), fixing heading hierarchy (h1->h3->h2 issues), adding route announcer for SPA navigation, making toast notifications announced by screen readers, or respecting prefers-reduced-motion. Also use when users mention "axe-core violations", "make this accessible", "fix a11y", "add aria", "keyboard support", "screen reader not announcing", "focus trap", "focus escapes modal", "icon button no accessible name", "muted-foreground contrast", or "Tab doesn't reach element". NOT for: WCAG auditing/reporting (use wcag-audit), automated a11y test setup (axe-core in Playwright), accessibility statement pages, eslint-plugin-jsx-a11y config, responsive design, dark mode, performance optimization, SEO structured data, or i18n of ARIA labels.
agents:
  - shadcn-ui-designer
  - responsive-master
  - seo-master
---

# WCAG 2.2 Fix Skill

> Accessible component patterns and fixes for React + shadcn/ui + TanStack Start

## When to Use

Use this skill when:
- Fixing accessibility issues found in audits or automated scans
- Building new components that need to be accessible from the start
- Adding keyboard navigation to interactive elements
- Implementing focus management (traps, restoration, skip links)
- Fixing color contrast violations or contrast ratio failures
- Making forms accessible (labels, errors, validation, required fields)
- Adding ARIA attributes and roles for screen reader support
- Handling dynamic content updates accessibly (live regions, route changes)

For auditing and reporting, see the `wcag-audit` skill.

## Quick Reference

| Fix Category | Key WCAG Criteria | What to Check |
|---|---|---|
| Text alternatives | 1.1.1 Non-text Content | Images have `alt`, icons have labels, SVGs have roles |
| Semantic structure | 1.3.1 Info and Relationships | Headings sequential, form labels linked, table headers scoped |
| Color contrast | 1.4.3 / 1.4.11 Contrast | Text 4.5:1, large text 3:1, UI components 3:1 |
| Reflow | 1.4.10 Reflow | No horizontal scroll at 320px viewport width |
| Keyboard access | 2.1.1 Keyboard | All interactive elements reachable and operable via keyboard |
| Focus visible | 2.4.7 Focus Visible | Every focusable element has a visible focus indicator |
| Skip navigation | 2.4.1 Bypass Blocks | Skip link as first focusable element on each page |
| Page titles | 2.4.2 Page Titled | Unique descriptive `<title>` per route |
| Target size | 2.5.8 Target Size | Minimum 24x24px for interactive targets |
| Language | 3.1.1 Language of Page | `lang` attribute on `<html>` element |
| Error identification | 3.3.1 / 3.3.2 Errors | Errors described in text, required fields indicated |
| Name/role/value | 4.1.2 Name, Role, Value | All components have accessible names and correct roles |
| Status messages | 4.1.3 Status Messages | Dynamic updates announced via live regions |
| Motion | 2.3.1 Three Flashes | Animations respect `prefers-reduced-motion` |

## Core Principles

### 1. Semantic HTML Before ARIA

**Why:** The first rule of ARIA is "don't use ARIA if native HTML does the job." Native elements like `<button>`, `<nav>`, and `<input type="checkbox">` have built-in keyboard handling, roles, and states that work universally. ARIA only patches semantics — it adds no behavior. A `<div role="button">` still needs manual `onClick`, `onKeyDown`, `tabIndex`, and `aria-pressed` that `<button>` gives you for free.

### 2. Focus Management Is Navigation

**Why:** SPAs do not perform full page loads on navigation, so focus stays wherever it was on the previous page. Keyboard and screen reader users lose their place entirely. Without explicit focus management — moving focus to main content on route change, trapping in modals, restoring on dismiss — users get stranded in removed DOM nodes or must tab through the entire page.

### 3. Test with Real Assistive Technology

**Why:** ARIA support varies across browser/screen reader combinations. VoiceOver + Safari, NVDA + Firefox, and JAWS + Chrome each interpret roles, states, and live regions differently. Automated testing catches only 30-40% of issues. Manual testing with a real screen reader is the only way to verify components work for users who depend on assistive technology.

### 4. Color Is Never the Only Channel

**Why:** Roughly 8% of men have some form of color vision deficiency. Information conveyed solely through color — red for errors, green for success — is invisible to these users. Always pair color with a secondary indicator: icons, text labels, patterns, or positional cues.

## Foundation: Page-Level Accessibility

Every page needs these baseline accessibility features before component-level fixes matter.

### HTML Language Declaration

```tsx
// app.tsx or root route
<html lang="en">
```

For multi-language content, mark sections with different languages:
```tsx
<p>The French word <span lang="fr">bonjour</span> means hello.</p>
```

### Skip Navigation Link

Skip links let keyboard users bypass repeated navigation blocks. Place this as the first focusable element in the page.

```tsx
// src/components/layout/SkipLink.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-ring focus:outline-none"
    >
      Skip to main content
    </a>
  );
}

// In your layout:
<body>
  <SkipLink />
  <header>...</header>
  <main id="main-content" tabIndex={-1}>
    {children}
  </main>
</body>
```

### Landmark Regions

Use semantic HTML to create navigable landmarks. Screen reader users rely on these to jump between page sections.

```tsx
<header role="banner">          {/* Site header */}
  <nav aria-label="Main">       {/* Primary navigation */}
</header>
<main id="main-content">        {/* Main content */}
  <section aria-labelledby="section-heading">
    <h2 id="section-heading">Section Title</h2>
  </section>
  <aside aria-label="Related">  {/* Sidebar */}
</main>
<footer role="contentinfo">     {/* Site footer */}
</footer>
```

Multiple `<nav>` elements need distinct labels so screen reader users can tell them apart:
```tsx
<nav aria-label="Main">...</nav>
<nav aria-label="Breadcrumb">...</nav>
<nav aria-label="Footer">...</nav>
```

### Heading Hierarchy

Headings create the document outline. Screen reader users navigate by heading level, so never skip levels.

```tsx
{/* Correct: sequential heading levels */}
<h1>Page Title</h1>
  <h2>Section</h2>
    <h3>Subsection</h3>
  <h2>Another Section</h2>

{/* Wrong: skipping from h1 to h3 */}
<h1>Page Title</h1>
  <h3>Subsection</h3>  {/* screen reader users expect h2 first */}
```

If you need a visually smaller heading, use CSS instead of a lower heading level:
```tsx
<h2 className="text-lg">Visually smaller but semantically correct</h2>
```

### Page Titles

Every route needs a descriptive title that follows a consistent pattern. TanStack Start handles this through the `head` function:

```tsx
export const Route = createFileRoute('/products/$id')({
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData.product.name} | Products | Site Name` },
    ],
  }),
});
```

## Keyboard Navigation Patterns

### Focus Visibility

Every interactive element needs a visible focus indicator. The default browser outline is often insufficient — use a consistent ring style.

```css
/* Global focus styles — apply via Tailwind or CSS */
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-radius: var(--radius);
}

/* Remove default outline only when replacing with custom */
:focus:not(:focus-visible) {
  outline: none;
}
```

shadcn/ui components use `focus-visible:ring-2 focus-visible:ring-ring` — extend this pattern consistently across custom components.

### Keyboard Interaction Patterns

| Component | Keys | Behavior |
|-----------|------|----------|
| Button | Enter, Space | Activate |
| Link | Enter | Navigate |
| Checkbox | Space | Toggle |
| Radio | Arrow keys | Move selection |
| Tab panel | Arrow keys | Switch tabs |
| Menu | Arrow keys, Enter, Escape | Navigate, select, dismiss |
| Dialog | Escape, Tab | Dismiss, cycle focus |
| Combobox | Arrow keys, Enter, Escape | Navigate, select, dismiss |
| Slider | Arrow keys | Adjust value |
| Tree | Arrow keys, Enter | Navigate, expand/collapse |

### Focus Trapping & Restoration

shadcn/ui `Dialog` handles focus trapping and restoration automatically via Radix. For custom modals, you need to:

1. **Trap focus** — cycle Tab/Shift+Tab within the modal's focusable elements
2. **Restore focus** — save `document.activeElement` on open, call `.focus()` on it when closing

See [references/component-patterns.md](references/component-patterns.md) for full `useFocusTrap` and `useDialogFocus` hooks.

## Component-Level Fixes

### Accessible Buttons

```tsx
{/* Text button — accessible name comes from content */}
<Button onClick={handleSave}>Save changes</Button>

{/* Icon-only button — MUST have accessible name */}
<Button onClick={handleClose} aria-label="Close dialog" size="icon">
  <X className="h-4 w-4" />
</Button>

{/* Toggle button — expose pressed state */}
<Button
  onClick={() => setIsActive(!isActive)}
  aria-pressed={isActive}
  aria-label="Toggle notifications"
>
  <Bell className="h-4 w-4" />
</Button>

{/* Loading button — announce loading state */}
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>Saving...</span>
    </>
  ) : (
    'Save'
  )}
</Button>
```

### Accessible Images

```tsx
{/* Informative image — describe the content */}
<img src="/chart.png" alt="Revenue grew 25% from Q1 to Q4 2025" />

{/* Decorative image — hide from screen readers */}
<img src="/decoration.svg" alt="" aria-hidden="true" />

{/* Complex image — use longer description */}
<figure>
  <img src="/org-chart.png" alt="Organization chart" aria-describedby="org-desc" />
  <figcaption id="org-desc">
    The CEO oversees three departments: Engineering, Marketing, and Sales...
  </figcaption>
</figure>

{/* Icon with text — icon is decorative */}
<span>
  <Mail className="h-4 w-4" aria-hidden="true" />
  Send email
</span>

{/* SVG icon alone — needs accessible name */}
<svg role="img" aria-label="Warning">
  <path d="..." />
</svg>
```

### Accessible Forms

Forms are the most common source of accessibility failures. Every input needs a programmatic label, validation errors need to be announced, and required fields need to be indicated.

```tsx
// Accessible form field with label, description, and error
function FormField({
  label,
  name,
  type = 'text',
  required = false,
  error,
  description,
}: FormFieldProps) {
  const inputId = `field-${name}`;
  const descId = description ? `${inputId}-desc` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div>
      <label htmlFor={inputId}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      <input
        id={inputId}
        name={name}
        type={type}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={[descId, errorId].filter(Boolean).join(' ') || undefined}
      />

      {description && (
        <p id={descId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Error Summary

When a form has multiple errors, provide a summary at the top that links to each field:

```tsx
function ErrorSummary({ errors }: { errors: Record<string, string> }) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;

  return (
    <div role="alert" aria-labelledby="error-summary-heading" className="rounded-md border border-destructive p-4">
      <h2 id="error-summary-heading" className="text-sm font-medium text-destructive">
        {entries.length} {entries.length === 1 ? 'error' : 'errors'} found
      </h2>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {entries.map(([field, message]) => (
          <li key={field}>
            <a href={`#field-${field}`} className="text-destructive underline">
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Accessible Data Tables

```tsx
<table>
  <caption className="sr-only">Monthly revenue by product category</caption>
  <thead>
    <tr>
      <th scope="col">Category</th>
      <th scope="col">January</th>
      <th scope="col">February</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Electronics</th>
      <td>$45,000</td>
      <td>$52,000</td>
    </tr>
  </tbody>
</table>
```

For sortable tables (TanStack Table):
```tsx
<th
  scope="col"
  aria-sort={
    column.getIsSorted() === 'asc' ? 'ascending' :
    column.getIsSorted() === 'desc' ? 'descending' :
    'none'
  }
>
  <button
    onClick={column.getToggleSortingHandler()}
    aria-label={`Sort by ${column.columnDef.header}, currently ${column.getIsSorted() || 'unsorted'}`}
  >
    {column.columnDef.header}
    <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
  </button>
</th>
```

For accessible tabs, tooltips, combobox, accordion, carousel, pagination, search, and other complex component patterns, see [references/component-patterns.md](references/component-patterns.md).

## Color & Contrast

### Minimum Contrast Ratios (WCAG 2.2 AA)

| Element | Minimum Ratio | Notes |
|---------|---------------|-------|
| Normal text (< 18px / < 14px bold) | 4.5:1 | Most body text |
| Large text (>= 18px / >= 14px bold) | 3:1 | Headings, large UI text |
| UI components & graphical objects | 3:1 | Borders, icons, focus rings |
| Disabled controls | No requirement | But consider usability |
| Decorative / logos | No requirement | Purely decorative content |

### Fixing Contrast with OKLCH

When fixing contrast violations, adjust the lightness channel in OKLCH. This preserves the hue while meeting contrast requirements:

```css
/* Too low contrast — L too high for light mode */
--muted-foreground: oklch(0.7 0.02 250);

/* Fixed — lower L for more contrast against white background */
--muted-foreground: oklch(0.45 0.02 250);
```

### Color Independence

Never use color as the only way to convey information. Always pair color with text, icons, or patterns:

```tsx
{/* Bad: color-only status */}
<span className={status === 'error' ? 'text-red-500' : 'text-green-500'}>
  {status}
</span>

{/* Good: color + icon + text */}
<span className={status === 'error' ? 'text-destructive' : 'text-success'}>
  {status === 'error' ? (
    <><AlertCircle className="h-4 w-4" aria-hidden="true" /> Error: {message}</>
  ) : (
    <><CheckCircle className="h-4 w-4" aria-hidden="true" /> Success: {message}</>
  )}
</span>
```

## Dynamic Content & Live Regions

When content updates without a page reload, screen readers need to be notified. Use ARIA live regions:

```tsx
{/* Polite: announced at next pause (non-urgent updates) */}
<div aria-live="polite" aria-atomic="true">
  {searchResults.length} results found
</div>

{/* Assertive: announced immediately (errors, critical alerts) */}
<div role="alert">
  Session expires in 2 minutes
</div>

{/* Status: polite + role for status messages */}
<div role="status" aria-live="polite">
  Form submitted successfully
</div>

{/* Progress updates */}
<div role="progressbar" aria-valuenow={75} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
  75% complete
</div>
```

### Toast/Notification Pattern

Wrap toast containers in `aria-live="polite"` with `aria-relevant="additions"`. Each toast uses `role="status"` and dismiss buttons need `aria-label="Dismiss notification"`. See [references/component-patterns.md](references/component-patterns.md) for the full pattern.

## Motion & Animation

Respect the user's motion preferences. Some users experience motion sickness or seizures from animations.

```css
/* Reduce or remove animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

In React, check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before applying animation classes.

## Target Size

WCAG 2.2 requires interactive targets to be at least 24x24px (SC 2.5.8). For touch interfaces, 44x44px is strongly recommended.

```tsx
{/* Ensure minimum target size for small controls */}
<button className="min-h-6 min-w-6 p-1">  {/* 24px minimum */}
  <X className="h-4 w-4" />
</button>

{/* For touch targets, use larger sizes */}
<button className="min-h-11 min-w-11 p-2">  {/* 44px for touch */}
  <Menu className="h-5 w-5" />
</button>
```

For inline links, adequate spacing between targets satisfies the requirement without increasing individual target size.

## Visually Hidden Utility

Use Tailwind's `sr-only` class to hide content visually while keeping it accessible to screen readers. Use `sr-only focus:not-sr-only` for elements (like skip links) that should appear on focus.

## TanStack Start Route-Level Patterns

### Route Announcements & Focus

SPAs need two things on route change:

1. **Route announcer** — a `sr-only` div with `aria-live="assertive"` that updates with the page title after each navigation
2. **Focus management** — move focus to `#main-content` on route change so keyboard users start at the right place

Both hooks use `useRouterState().location.pathname` as the trigger. Add `RouteAnnouncer` component and `useFocusOnRouteChange` hook to your root layout.

## Quick Fix Reference

For the full component patterns reference, see [references/component-patterns.md](references/component-patterns.md).

| Issue | Fix | WCAG SC |
|-------|-----|---------|
| Missing alt text | Add descriptive `alt` or `alt=""` for decorative | 1.1.1 |
| No form labels | Add `<label htmlFor>` or `aria-label` | 1.3.1, 4.1.2 |
| Heading levels skipped | Use sequential heading levels | 1.3.1 |
| Low text contrast | Increase to 4.5:1 (3:1 for large) | 1.4.3 |
| Low non-text contrast | Increase to 3:1 for borders, icons | 1.4.11 |
| Horizontal scroll at 320px | Use responsive layout, avoid fixed widths | 1.4.10 |
| No keyboard access | Add `tabIndex`, key handlers, use `<button>` | 2.1.1 |
| No focus indicator | Add `focus-visible` styles | 2.4.7 |
| No skip link | Add skip-to-content link | 2.4.1 |
| Missing page title | Set unique `<title>` per route | 2.4.2 |
| Small touch targets | Ensure 24x24px minimum | 2.5.8 |
| No lang attribute | Add `lang="en"` to `<html>` | 3.1.1 |
| Unclear error messages | Describe what went wrong and how to fix | 3.3.1 |
| Missing required indication | Mark required fields with text + `aria-required` | 3.3.2 |
| No accessible name | Add `aria-label` or `aria-labelledby` | 4.1.2 |
| Dynamic updates not announced | Use `aria-live` or `role="status"` | 4.1.3 |
| Animations ignore preference | Respect `prefers-reduced-motion` | 2.3.1 |

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `aria-label` not announced | Element lacks a valid ARIA role | Ensure element has an implicit role (`<button>`) or explicit `role`. `aria-label` only works on elements with roles that support naming |
| Focus trap not working in dialog | Portal or shadow DOM breaks containment | Mount the focus trap inside the portal container, not outside it |
| Skip link does not move focus | Target element is not focusable | Add `tabIndex={-1}` to the target (`<main id="main-content" tabIndex={-1}>`) |
| Live region not announcing | Region added and populated in same render | Render the `aria-live` container empty first, then update its content in a subsequent render |
| Screen reader reads decorative icon | Icon lacks `aria-hidden="true"` | Add `aria-hidden="true"` to decorative icons that have adjacent text labels |
| Keyboard user cannot reach control | Uses `<div>`/`<span>` without `tabIndex` | Replace with native element (`<button>`, `<a>`) or add `tabIndex={0}` with key handlers |
| Focus ring not visible | Component uses `outline: none` globally | Apply `outline: none` only on `:focus:not(:focus-visible)`, add visible `:focus-visible` styles |
| `aria-describedby` not read | Referenced ID missing from DOM | Verify `id` matches exactly; conditionally set attribute only when the element exists |
| Contrast passes tool but fails visually | Overlays or background images reduce contrast | Check actual rendered contrast accounting for opacity, gradients, and background images |
| Route change not announced in SPA | No route announcer in layout | Add visually hidden `aria-live="assertive"` element that updates with page title on navigation |

## Constraints

- **ARIA support varies across browser/AT combinations.** Test critical flows in at least two combinations (e.g., VoiceOver + Safari, NVDA + Firefox). Avoid newer ARIA attributes (e.g., `aria-description`) without checking the support matrix.
- **Native HTML is always more reliable than ARIA.** Use `<button>`, `<nav>`, `<dialog>`, `<details>` before ARIA roles. ARIA adds semantics but not behavior.
- **shadcn/ui + Radix handle many patterns automatically.** `Dialog`, `DropdownMenu`, `Tabs`, `Accordion`, `Tooltip`, and `Popover` include focus management, keyboard nav, and ARIA out of the box. Do not re-implement.
- **Some patterns need polyfills for older browsers.** `inert` attribute, `:focus-visible`, and `dialog` element may need polyfills depending on your browser support matrix.
- **Automated tools catch only 30-40% of issues.** axe-core and Lighthouse cannot verify reading order, meaningful alt text, focus flow, or real screen reader behavior.
- **Contrast requirements apply to both light and dark themes.** Dark mode frequently introduces new failures, especially with muted/secondary text colors.

## Verification Checklist

Before considering an accessibility fix complete, verify:

- [ ] **Keyboard navigation:** Every interactive element is reachable via Tab and operable via Enter/Space/Arrow keys as appropriate
- [ ] **Focus visibility:** Focus indicator is clearly visible on every focusable element (meets 3:1 contrast against adjacent colors)
- [ ] **Focus management:** Focus moves to new content (dialogs, route changes) and restores on dismiss
- [ ] **Screen reader names:** Every interactive element has an accessible name (check via browser accessibility inspector)
- [ ] **Heading hierarchy:** Headings are sequential (h1 > h2 > h3) with no skipped levels
- [ ] **Form accessibility:** All inputs have labels, errors are linked via `aria-describedby`, required fields are indicated
- [ ] **Color contrast:** Text meets 4.5:1 (normal) or 3:1 (large), UI components meet 3:1
- [ ] **Color independence:** Information is not conveyed by color alone — icons, text, or patterns supplement color
- [ ] **Alt text:** Informative images have descriptive `alt`, decorative images have `alt=""` and `aria-hidden="true"`
- [ ] **Live regions:** Dynamic content updates are announced via `aria-live` or `role="status"`/`role="alert"`
- [ ] **Reduced motion:** Animations respect `prefers-reduced-motion` media query
- [ ] **Target size:** Interactive targets are at least 24x24px (44x44px for touch)
- [ ] **Skip link:** Skip-to-content link is present and functional as the first focusable element
- [ ] **Page title:** Each route has a unique, descriptive `<title>`
- [ ] **Language:** `<html lang="...">` is set and sub-language sections use `lang` attribute

## References

- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- WCAG 2.2 Techniques: https://www.w3.org/WAI/WCAG22/Techniques/
- Inclusive Components: https://inclusive-components.design/
- A11y Project Checklist: https://www.a11yproject.com/checklist/
- shadcn/ui Accessibility: https://ui.shadcn.com/docs (built on Radix — accessible by default)
- ARIA Support Matrix: https://a11ysupport.io/
