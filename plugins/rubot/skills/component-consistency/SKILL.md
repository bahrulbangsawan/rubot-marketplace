---
name: component-consistency
version: 1.0.0
description: |
  Component pattern consistency audit and enforcement for shadcn/ui + Tailwind CSS projects. Ensures all instances of the same component type (cards, carousels, buttons, grids, forms) follow identical structural patterns, token usage, and responsive behavior across the entire codebase.

  MUST activate for: component consistency audits, carousel fixes, card pattern standardization, button style unification, grid layout consistency, component pattern enforcement, reusable component patterns, and any request to make components consistent or uniform across pages.

  Also activate when: "inconsistent components", "cards look different", "carousel broken", "carousel not working", "carousel fix", "carousel arrows", "carousel mobile", "carousel navigation", "carousel swipe", "prev next buttons", "slider broken", "card radius inconsistent", "buttons look different", "grid inconsistent", "component audit", "pattern consistency", "standardize components", "unify styles", "component library cleanup", "reusable patterns", "same component different styles", "visual consistency", "UI inconsistency", "design drift", "component drift".

  Do NOT activate for: theme/color token generation (use design-tokens + theme-master), responsive breakpoint logic (use responsive-design), WCAG accessibility compliance (use wcag-audit), backend API patterns, database schemas, deployment, SEO, or performance optimization.

  Covers: carousel implementation (navigation, slides, mobile behavior, touch/swipe, arrow controls, boundary states), card consistency (radius, padding, shadow, structure), button consistency (size, variant, icon placement), grid consistency (column counts, gaps, breakpoint behavior), form consistency (input sizing, label placement, error display), component structural patterns, cross-page component drift detection, and graceful degradation when fewer items than visible slots.
agents:
  - shadcn-ui-designer
  - responsive-master
---

# Component Consistency Skill

> Enforce identical patterns across all instances of the same component type

## When to Use

- Auditing components for visual/structural inconsistencies across pages
- Fixing carousel navigation, sliding, and mobile behavior
- Standardizing card patterns (radius, padding, shadow, structure)
- Unifying button styles, sizes, and variant usage
- Ensuring grids follow consistent column/gap patterns
- Detecting "component drift" — same component styled differently in different places

## Core Principle

Every instance of a component type should be **structurally identical** unless there is an explicit, documented reason for deviation. When a card appears on the homepage and the pricing page, it should use the same radius, padding, shadow depth, and content structure. When a carousel appears in features and testimonials sections, it should use the same navigation pattern, slide behavior, and mobile treatment.

## Component Audit Categories

### 1. Carousel / Slider

The carousel is the most common source of UI bugs. A working carousel requires correct coordination between container sizing, item basis, translation logic, and navigation controls.

#### Required Behavior

| Behavior | Requirement |
|----------|-------------|
| **Sliding mechanism** | CSS transform `translateX` or scroll-snap; items shift by exact slot width |
| **Prev/Next arrows** | Visible, clickable, update carousel index reliably |
| **Boundary handling** | Disabled state or loop behavior at first/last item |
| **Mobile (xs)** | `basis-full` — 1 card per view, no partial/cut-off cards |
| **Tablet (sm)** | `basis-1/2` — 2 cards per view |
| **Desktop (lg)** | `basis-1/3` — 3 cards per view |
| **Touch/Swipe** | Swipe gesture support on mobile (touch events or scroll-snap) |
| **Fewer items** | Graceful degradation — no empty slots, arrows hidden or disabled |
| **Spacing** | Consistent gap between slides, no overflow or broken spacing |
| **Accessibility** | `aria-label` on controls, `role="region"` on carousel, keyboard navigation |

#### Carousel Implementation Pattern

```tsx
// Carousel state
const [currentIndex, setCurrentIndex] = useState(0);

// Responsive items-per-view
const getItemsPerView = () => {
  if (window.innerWidth >= 992) return 3;  // lg
  if (window.innerWidth >= 576) return 2;  // sm
  return 1;                                 // xs
};

// Max index calculation (prevents overscroll)
const maxIndex = Math.max(0, items.length - itemsPerView);

// Navigation handlers
const prev = () => setCurrentIndex(i => Math.max(0, i - 1));
const next = () => setCurrentIndex(i => Math.min(maxIndex, i + 1));

// Slide container transform
<div
  className="flex transition-transform duration-300 ease-in-out"
  style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
>
  {items.map(item => (
    <div key={item.id} className="basis-full sm:basis-1/2 lg:basis-1/3 shrink-0 px-2">
      <Card>{/* ... */}</Card>
    </div>
  ))}
</div>
```

#### Arrow Control Pattern

```tsx
<Button
  variant="outline"
  size="icon"
  onClick={prev}
  disabled={currentIndex === 0}
  aria-label="Previous slide"
  className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
>
  <ChevronLeft className="h-4 w-4" />
</Button>

<Button
  variant="outline"
  size="icon"
  onClick={next}
  disabled={currentIndex >= maxIndex}
  aria-label="Next slide"
  className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
>
  <ChevronRight className="h-4 w-4" />
</Button>
```

#### Carousel Audit Checklist

- [ ] Sliding works correctly (no stuck states, no skipped items)
- [ ] Prev/next arrows are visible and functional
- [ ] Arrows disabled at boundaries (or carousel loops)
- [ ] Mobile shows 1 full card, no cut-off
- [ ] No horizontal overflow or broken spacing
- [ ] Touch/swipe works on mobile
- [ ] Fewer items than slots handled gracefully (no empty gaps)
- [ ] Consistent gap between slides
- [ ] Accessible: keyboard nav, aria-labels, role attributes

### 2. Cards

Cards are the most reused component. Consistency means identical structure across every instance.

#### Card Consistency Rules

| Property | Standard | Why |
|----------|----------|-----|
| **Border radius** | `rounded-lg` (via `--radius` token) or `rounded-[10%]` | Token-based, consistent visual language |
| **Padding** | `p-6` (default shadcn) | Standard component padding from design system |
| **Shadow** | `shadow-sm` for flat cards, `shadow-md` for elevated | Consistent depth hierarchy |
| **Overflow** | `overflow-hidden` on card root | Respects rounded corners on child content (images) |
| **Background** | `bg-card` | Uses token, not arbitrary color |
| **Text colors** | `text-card-foreground`, `text-muted-foreground` | Token-based |
| **Border** | `border border-border` | Consistent border treatment |

#### Card Audit Checklist

- [ ] All cards use the same border-radius value
- [ ] All cards use the same padding
- [ ] All cards use the same shadow depth (per hierarchy level)
- [ ] All cards have `overflow-hidden` when containing images
- [ ] All cards use token-based colors (`bg-card`, not `bg-white`)
- [ ] Card content structure is consistent (image → title → description → action)
- [ ] Card responsive behavior matches across pages

### 3. Buttons

Buttons drift when developers create ad-hoc styles instead of using shadcn/ui variants.

#### Button Consistency Rules

| Property | Standard | Variants |
|----------|----------|----------|
| **Sizes** | `default`, `sm`, `lg`, `icon` | Only shadcn/ui size variants |
| **Variants** | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` | Only shadcn/ui variants |
| **Icon placement** | Icon left of text with `gap-2`, or `size="icon"` for icon-only | Consistent across all buttons |
| **Full-width mobile** | `w-full sm:w-auto` on primary CTAs | Mobile-first pattern |
| **Loading state** | Spinner icon + disabled state | Consistent loading indicator |

#### Button Audit Checklist

- [ ] No custom button classes outside shadcn/ui variants
- [ ] Consistent icon placement (always left, or always right)
- [ ] Primary CTAs use `default` variant consistently
- [ ] Destructive actions use `destructive` variant
- [ ] No arbitrary padding/sizing (`px-[22px]`, `h-[42px]`)
- [ ] Loading states are consistent

### 4. Grids

Grid layouts should follow predictable column progression across breakpoints.

#### Grid Consistency Rules

| Breakpoint | Typical Columns | Pattern |
|------------|----------------|---------|
| xs (mobile) | 1 | `grid-cols-1` |
| sm (tablet) | 2 | `sm:grid-cols-2` |
| lg (desktop) | 3 | `lg:grid-cols-3` |
| xl (wide) | 4 | `xl:grid-cols-4` |

#### Grid Audit Checklist

- [ ] All feature/card grids use same column progression
- [ ] Gap values are consistent across grids (`gap-4 sm:gap-6`)
- [ ] No mixed grid systems (some flexbox, some CSS grid for same pattern)
- [ ] Grid items have consistent sizing within each grid

### 5. Forms

Form components should be uniform in structure and validation display.

#### Form Audit Checklist

- [ ] All inputs use same height/padding
- [ ] Labels are positioned consistently (above, inline, or floating)
- [ ] Error messages appear in same position relative to input
- [ ] Required field indicators are consistent
- [ ] Form spacing (gap between fields) is consistent

## Cross-Page Drift Detection

The most valuable part of a consistency audit is finding **drift** — the same component type styled differently on different pages.

### Detection Strategy

1. **Inventory**: Find all instances of each component type across the codebase
2. **Fingerprint**: Extract key style properties from each instance
3. **Compare**: Flag instances where the same type has different fingerprints
4. **Classify**: Determine if deviation is intentional (documented) or drift (bug)

### Grep Patterns for Component Discovery

**Cards:**
```
<Card|CardContent|CardHeader|CardFooter|CardTitle|CardDescription
```

**Carousels:**
```
[Cc]arousel|[Ss]lider|[Ss]wiper|translateX.*%|scroll-snap|embla
```

**Buttons:**
```
<Button|variant=|size=.*icon|btn-|button.*className
```

**Grids:**
```
grid-cols-|grid.*gap-|grid.*template
```

## Audit Report Format

```markdown
# Component Consistency Audit Report

**Date**: [timestamp]
**Scope**: [full codebase / specific components]
**Overall Score**: [calculated]/100

## Summary

| Component Type | Instances | Consistent | Drifted | Score |
|---------------|-----------|------------|---------|-------|
| Cards | X | Y | Z | X/100 |
| Carousels | X | Y | Z | X/100 |
| Buttons | X | Y | Z | X/100 |
| Grids | X | Y | Z | X/100 |
| Forms | X | Y | Z | X/100 |

## Detailed Findings

### Cards
[Per-instance comparison with file paths and specific deviations]

### Carousels
[Navigation status, mobile behavior, boundary handling per instance]

### Buttons
[Variant usage, size consistency, icon placement per instance]

### Grids
[Column progression, gap consistency per instance]

### Forms
[Input styling, label placement, error display per instance]

## Priority Fixes

1. **Critical**: [component type] — [issue description] — [files affected]
2. **High**: ...
3. **Medium**: ...
4. **Low**: ...
```

## Scoring Rubric

| Category | Weight | What Passes |
|----------|--------|-------------|
| Card consistency | 25% | All cards use identical radius, padding, shadow, colors |
| Carousel functionality | 25% | Navigation works, mobile correct, boundaries handled, accessible |
| Button consistency | 20% | All buttons use shadcn variants, consistent sizing and icon placement |
| Grid consistency | 15% | Predictable column progression, consistent gaps |
| Form consistency | 15% | Uniform input styling, label placement, error display |

## References

- shadcn/ui Card: https://ui.shadcn.com/docs/components/card
- shadcn/ui Button: https://ui.shadcn.com/docs/components/button
- shadcn/ui Carousel: https://ui.shadcn.com/docs/components/carousel
- `design-tokens` skill — Token compliance (colors, typography, spacing)
- `responsive-design` skill — Breakpoint behavior and mobile patterns
- `shadcn-ui-designer` agent — Frontend implementation authority
