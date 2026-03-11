---
name: responsive-design
version: 1.1.0
description: |
  Mobile-first responsive design system with strict relative unit enforcement for Tailwind CSS. MUST activate for: responsive layout fixes, breakpoint audits, px-to-rem conversion, mobile-first Tailwind patterns, and any UI that must work across xs/sm/md/lg breakpoints. Also activate when users mention: "responsive", "mobile layout", "breakpoint", "overflow on mobile", "cut off on iPhone", "cards cut off", "sideways scroll", "layout broken on phone", "hamburger menu", "drawer menu", "Sheet component for mobile nav", "carousel shows partial cards on mobile", "hero section doesn't fill viewport", "h-screen vs min-h-dvh", "Safari address bar", "convert px to rem", "w-[400px]", "text-[18px]", "p-[20px]", "gap-[15px]", "rounded-[12px]", "rem vs px", "custom Tailwind breakpoints", "touch target too small", "2.75rem minimum", "CTA full-width on mobile", "footer grid columns", "basis-full mobile", or "typography scaling across breakpoints". Do NOT activate for: dark mode/theme/OKLCH, container queries (@container), hydration mismatches, WCAG accessibility audits (alt text, ARIA), OG image generation, Largest Contentful Paint optimization, code splitting, sidebar component setup, or ECharts responsive resizing.

  Covers: breakpoint system (xs/sm/md/lg), relative unit rules (rem/vh/dvh/%), mobile-first Tailwind patterns, hero section layouts, mobile drawer/hamburger menus, card radius consistency, carousel per-slide behavior, typography scaling, component sizing, touch targets, and responsive quality validation checklists.
agents:
  - responsive-master
  - shadcn-ui-designer
---

# Responsive Design Skill

> Mobile-first responsive layout system with strict relative unit enforcement

## When to Use

- Fixing or auditing responsive layouts across breakpoints
- Converting fixed `px` values to relative units (`rem`, `vh`, `%`)
- Building mobile-first components (hero, drawer, carousel, cards)
- Debugging overflow, clipping, or layout breakage on mobile
- Implementing a consistent responsive design system
- Reviewing Tailwind responsive class usage
- Implementing hamburger/drawer navigation that replaces desktop nav on mobile
- Setting up or customizing Tailwind breakpoints for a project

## Quick Reference

| Breakpoint | Min Width | Tailwind Prefix | Target Devices |
|-----------|-----------|-----------------|----------------|
| **xs** | 0px | _(default)_ | Phones portrait |
| **sm** | 576px | `sm:` | Phones landscape, small tablets |
| **md** | 768px | `md:` | Tablets, small laptops |
| **lg** | 992px | `lg:` | Desktops, large tablets landscape |
| **xl** | 1200px | `xl:` | Large desktops |
| **2xl** | 1400px | `2xl:` | Ultra-wide monitors |

### px to rem Conversion (base 16px)

| px | rem | Tailwind | px | rem | Tailwind |
|----|-----|----------|----|-----|----------|
| 4 | 0.25 | `1` | 32 | 2 | `8` |
| 8 | 0.5 | `2` | 40 | 2.5 | `10` |
| 12 | 0.75 | `3` | 48 | 3 | `12` |
| 16 | 1 | `4` | 64 | 4 | `16` |
| 20 | 1.25 | `5` | 80 | 5 | `20` |
| 24 | 1.5 | `6` | 96 | 6 | `24` |

### Unit Rules at a Glance

| Property | Allowed | Banned |
|----------|---------|--------|
| Font sizes | `rem` | `px`, `em` |
| Margins, padding, gaps | `rem` | `px` |
| Border radius | `rem`, `%` | `px` (except `1px`) |
| Component width/height | `rem`, `%`, `vw`, `vh`, `dvh` | `px` |
| Viewport heights | `vh`, `dvh`, `svh` | `px` |
| Borders, box shadows | `px` allowed | -- |

## Core Principles

### 1. Mobile-First Always

Write base styles for the smallest screen, then layer up with `sm:`, `md:`, `lg:` prefixes. **Why**: Progressive enhancement is fundamentally more reliable than graceful degradation. Starting with mobile ensures every device gets a working layout by default, and larger screens receive enhancements only when the browser supports the breakpoint. Graceful degradation starts with a full desktop experience and tries to strip it down, which inevitably misses edge cases and leaves mobile users with broken layouts.

### 2. No px for Layout Measurements

Use `rem` for font sizes, margins, padding, gaps, and component dimensions. **Why**: Accessibility. When a user sets their browser font size to 20px (common for low-vision users), `rem`-based layouts scale proportionally because `rem` is relative to the root font size. `px` values ignore the user's preference entirely, violating WCAG 1.4.4 (Resize Text). A button set to `height: 44px` stays 44px regardless of user settings; `height: 2.75rem` scales to 55px when the user needs larger text.

### 3. Four-Tier Breakpoint System

Use xs/sm/md/lg as the primary breakpoints, with xl/2xl for wide-screen refinements. **Why**: These four tiers map to real device classes that users actually own -- phones in portrait (xs), phones in landscape and small tablets (sm), tablets and small laptops (md), and desktops (lg). Fewer breakpoints leave gaps where layouts break; more breakpoints add complexity without covering meaningfully different device classes. Four tiers hit the practical sweet spot.

### 4. Content Determines Breakpoints, Not Devices

When the default breakpoints do not fit, adjust them based on where content actually breaks. **Why**: Device screen sizes change every year, but the point where a two-column layout becomes unreadable stays the same. Designing for specific device pixel widths creates a moving target; designing for content readability creates durable layouts.

## Unit Rules

These rules apply to **every** component, section, and breakpoint without exception.

### Allowed Units

| Property Type | Allowed Units | Examples |
|--------------|---------------|---------|
| Font sizes | `rem` | `text-base` (1rem), `text-lg` (1.125rem) |
| Margins, padding, gaps | `rem` | `p-4` (1rem), `gap-6` (1.5rem) |
| Border radius | `rem` or `%` | `rounded-xl` (0.75rem), `rounded-[10%]` |
| Component width/height | `rem`, `%`, `vw`, `vh`, `dvh` | `w-full`, `h-[3rem]`, `min-h-dvh` |
| Viewport heights | `vh`, `dvh`, `svh` | `h-dvh`, `min-h-svh` |

### Banned Units

**Avoid `px`** for font sizes, margins, padding, gaps, and component dimensions. Using px for layout measurements prevents the UI from scaling when users adjust their browser font size, breaking accessibility (WCAG 1.4.4). Relative units like rem scale proportionally.

**Exception**: `px` is acceptable only for:
- `1px` borders (`border`, `border-b`)
- Box shadows (browser-level detail)
- Fine optical adjustments in isolated utility classes

### Base Font Size

Ensure `:root` / `html` has a proper base font size so `rem` scales correctly:

```css
/* In your global CSS */
html {
  font-size: 100%; /* 16px default — DO NOT set a fixed px value */
}
```

## Breakpoint System

The project uses 4 responsive breakpoints aligned with Tailwind CSS defaults.

### Custom Tailwind Breakpoints

If the project uses default Tailwind breakpoints (640, 768, 1024, 1280), map them to these ranges in `tailwind.config.ts`:

```ts
// tailwind.config.ts
export default {
  theme: {
    screens: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      '2xl': '1400px',
    },
  },
}
```

### Mobile-First Pattern

Always write styles mobile-first -- base styles target `xs`, then layer up:

```tsx
{/* Mobile base → scales up */}
<div className="px-4 sm:px-6 md:px-8 lg:px-12">
  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
    Heading
  </h1>
</div>
```

## Component Patterns

For detailed code examples of responsive components, see [references/component-patterns.md](references/component-patterns.md).

### Available Patterns

| Pattern | Key Rule | Breakpoint Behavior |
|---------|----------|-------------------|
| Hero Section | `min-h-dvh`, flexbox centering | Full viewport mobile, reduced desktop |
| Mobile Drawer | Sheet component, `rem` sizing, touch targets | Visible below `md` |
| Card Radius | `rounded-[10%]` globally | Consistent all breakpoints |
| Carousel | `basis-full` mobile | 1 card, 2 cards (`sm`), 3 cards (`lg`) |
| Navbar | Sticky, backdrop-blur | Hamburger mobile, inline links `md`+ |
| Footer | Grid columns | 1 col, 2 col (`sm`), 4 col (`lg`) |

## Typography Scale (rem-based)

All text uses Tailwind's built-in `rem` scale:

| Tailwind Class | Size | Use Case |
|---------------|------|----------|
| `text-xs` | 0.75rem | Fine print, badges |
| `text-sm` | 0.875rem | Captions, secondary text |
| `text-base` | 1rem | Body text, menu items |
| `text-lg` | 1.125rem | Emphasized body, card titles |
| `text-xl` | 1.25rem | Section headings (mobile) |
| `text-2xl` | 1.5rem | Page headings (mobile) |
| `text-3xl` | 1.875rem | Hero heading (mobile) |
| `text-4xl` | 2.25rem | Hero heading (sm) |
| `text-5xl` | 3rem | Hero heading (md) |
| `text-6xl` | 3.75rem | Hero heading (lg) |

### Responsive Typography Pattern

```tsx
{/* Heading scales across breakpoints */}
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
  Page Title
</h1>

{/* Body text */}
<p className="text-base sm:text-lg leading-relaxed">
  Body content with comfortable line height.
</p>

{/* Caption / helper text */}
<span className="text-xs sm:text-sm text-muted-foreground">
  Helper text
</span>
```

## Spacing Scale (rem-based)

Use Tailwind's spacing scale consistently:

| Tailwind | Value | Common Use |
|----------|-------|------------|
| `1` | 0.25rem | Fine gaps |
| `2` | 0.5rem | Tight padding |
| `3` | 0.75rem | Compact spacing |
| `4` | 1rem | Standard padding |
| `6` | 1.5rem | Section gap |
| `8` | 2rem | Large gap |
| `12` | 3rem | Section padding |
| `16` | 4rem | Large section padding |
| `20` | 5rem | Hero padding |

### Responsive Spacing Pattern

```tsx
{/* Container padding scales with breakpoint */}
<div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-12 lg:px-12 lg:py-16">
  {/* Content gap scales */}
  <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
    ...
  </div>
</div>
```

## Responsive Grid Patterns

### Auto-fit Grid (Cards, Features)

```tsx
<div className="
  grid gap-4 sm:gap-6
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
">
  {items.map(item => <Card key={item.id} ... />)}
</div>
```

### Sidebar Layout

```tsx
<div className="
  flex flex-col
  md:flex-row md:gap-8
">
  <aside className="w-full md:w-[16rem] lg:w-[18rem] shrink-0">
    Sidebar
  </aside>
  <main className="flex-1 min-w-0">
    Content
  </main>
</div>
```

## Common Anti-Patterns to Avoid

| Anti-Pattern | Fix |
|-------------|-----|
| `w-[400px]` fixed width | `w-full max-w-[25rem]` |
| `text-[18px]` px font | `text-lg` (1.125rem) |
| `p-[20px]` px padding | `p-5` (1.25rem) |
| `h-screen` on mobile | `min-h-dvh` (accounts for browser chrome) |
| `gap-[15px]` px gap | `gap-4` (1rem) |
| `rounded-[12px]` on cards | `rounded-[10%]` |
| Hidden nav without close button | Always include `SheetClose` / X button |
| Carousel showing partial cards on mobile | `basis-full` on mobile |
| Absolute positioning for centering | Flexbox `items-center justify-center` |
| `overflow-hidden` on body/main | Find and fix the actual overflow source |

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Content overflows horizontally on mobile | Fixed widths (`w-[400px]`) or `min-width` values wider than the viewport | Replace with `w-full max-w-[25rem]`, remove `min-width`, check for elements with hardcoded `px` widths |
| Layout jumps or breaks at a breakpoint | Tailwind responsive classes applied in wrong order or conflicting at adjacent breakpoints | Verify classes follow mobile-first order (base, `sm:`, `md:`, `lg:`), check for missing intermediate breakpoints |
| Text too small on mobile | Base font size overridden to a small `px` value, or `text-xs`/`text-sm` used for body text | Ensure `html { font-size: 100% }`, use `text-base` (1rem) minimum for body text on all breakpoints |
| Hero section does not fill mobile viewport | Using `h-screen` which does not account for mobile browser chrome (address bar, toolbar) | Replace with `min-h-dvh` which uses dynamic viewport height |
| Images overflow their containers on mobile | Missing `max-w-full` or `w-full` on images, or parent has no width constraint | Add `max-w-full h-auto` to images, ensure parent has `overflow-hidden` or width constraint |
| Drawer/hamburger menu has no close button | Sheet component rendered without a close affordance | Always include `SheetClose` or a visible X button with minimum `2.75rem` touch target |
| Cards look squished on small screens | Grid forcing multiple columns on narrow viewports | Start with `grid-cols-1` as the base, add `sm:grid-cols-2` and `lg:grid-cols-3` progressively |
| Spacing feels too tight on mobile | Desktop spacing values used without responsive scaling | Use progressive spacing: `px-4 sm:px-6 md:px-8 lg:px-12` |
| Carousel shows partial/cut-off cards on mobile | `basis-1/2` or `basis-1/3` applied without a mobile override | Use `basis-full` as the base for mobile, then `sm:basis-1/2 lg:basis-1/3` |
| `rem` values not scaling when user changes browser font size | Root font size set to a fixed `px` value like `font-size: 14px` | Set `html { font-size: 100% }` to respect user preferences |

## Constraints

- **Tailwind breakpoints are min-width only**: Tailwind uses `min-width` media queries exclusively. You cannot target "only small screens" without also affecting larger ones. Base styles always apply to all sizes; prefixed styles add overrides upward. If you need max-width queries, use arbitrary values like `max-sm:hidden`.
- **dvh/svh browser support**: Dynamic viewport height (`dvh`) and small viewport height (`svh`) are supported in all modern browsers but not in older browsers (pre-2023). For projects requiring legacy support, fall back to `vh` with a JavaScript resize listener to handle mobile browser chrome.
- **Tailwind JIT purging**: Arbitrary values like `w-[25rem]` or `rounded-[10%]` require Tailwind's JIT compiler. Ensure your `content` paths in `tailwind.config.ts` include all files where classes are used, or the arbitrary values will be purged from production CSS.
- **Container queries are not breakpoints**: Tailwind v3.3+ supports `@container` queries via the `@container` plugin. These respond to the parent container's size, not the viewport. Use container queries for components that appear in different layout contexts (sidebar vs. main content), but use breakpoints for page-level layout decisions.
- **px exceptions are narrow**: The `px` exception for borders and shadows does not extend to border-radius, padding, margins, or any spacing. When reviewing code, only `border-width` and `box-shadow` values in `px` pass the unit compliance check.
- **Touch target minimums are 2.75rem (44px)**: This is the minimum, not the recommendation. For primary CTAs and navigation items, prefer `3rem` (48px) to accommodate users with motor impairments.

## Verification Checklist

After implementing responsive changes, verify across all 4 breakpoints:

### Layout Integrity
- [ ] No horizontal overflow (no sideways scroll on any breakpoint)
- [ ] No content clipping or overlap
- [ ] Flex/grid layouts wrap correctly
- [ ] Images scale within containers (`max-w-full`, `object-cover`)

### Unit Compliance
- [ ] Zero `px` values in font-size, margin, padding, gap, or component dimensions
- [ ] All border-radius on cards uses `10%` or `rem`
- [ ] Viewport heights use `dvh` / `svh` / `vh` (not fixed `px`)
- [ ] Base font size (`html`) is `100%` or `16px`, not a custom `px` value

### Mobile (xs) Specifics
- [ ] Hero fills `min-h-dvh`
- [ ] Drawer menu has visible close button
- [ ] Drawer menu items have visible hover/active/focus states
- [ ] Carousel shows 1 full card per slide (no cut-off)
- [ ] Touch targets minimum `2.75rem` height
- [ ] CTAs are full-width and stacked

### Typography and Spacing
- [ ] Headings scale down gracefully on mobile
- [ ] Body text is `text-base` (1rem) minimum on all breakpoints
- [ ] Padding/gap scales with breakpoint (`px-4 sm:px-6 md:px-8 lg:px-12`)
- [ ] No text truncation that hides critical information

### Interactive Elements
- [ ] Buttons have adequate touch size on mobile
- [ ] Form inputs are full-width on mobile
- [ ] Dropdowns/popovers don't overflow viewport
- [ ] Modals/dialogs are properly sized on mobile

## References

- Tailwind CSS responsive design: https://tailwindcss.com/docs/responsive-design
- WCAG 1.4.4 Resize Text: https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html
- Dynamic viewport units (dvh/svh/lvh): https://web.dev/blog/viewport-units
- Tailwind CSS screens configuration: https://tailwindcss.com/docs/screens
- Container queries in Tailwind: https://tailwindcss.com/docs/responsive-design#container-queries
- `core-web-vitals` skill -- CLS prevention (image dimensions, skeleton loaders)
- `wcag-audit` skill -- Accessibility (touch targets, focus management)
- `social-sharing` skill -- Responsive OG images
