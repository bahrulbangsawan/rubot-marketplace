---
name: design-tokens
version: 1.0.0
description: |
  Design token consistency enforcement for Tailwind CSS + shadcn/ui projects. Ensures all UI elements use centralized, reusable tokens (CSS variables) for colors, typography, spacing, border-radius, and shadows instead of hardcoded or arbitrary values.

  MUST activate for: design token audits, token consistency checks, CSS variable enforcement, arbitrary value cleanup, "magic number" elimination, design system compliance, reusable token creation, theme variable validation, and any request to make styling consistent or token-based.

  Also activate when users mention: "design tokens", "CSS variables", "inconsistent colors", "hardcoded values", "arbitrary Tailwind values", "text-[15px]", "bg-[#f5f5f5]", "p-[13px]", "magic numbers in CSS", "style consistency", "token system", "reusable styles", "design system tokens", "color tokens", "spacing tokens", "typography tokens", "shadow tokens", "radius tokens", "--font-sans", "--radius", "--spacing", "oklch variables", "theme variables", "index.css variables", "centralize styles", "remove arbitrary values", "tailwind arbitrary cleanup".

  Do NOT activate for: responsive layout issues (use responsive-design), WCAG accessibility audits (use wcag-audit), SEO metadata, API or backend logic, database schemas, deployment configs, hydration issues, or chart-specific styling (use chart-master).

  Covers: CSS custom property architecture (:root/.dark/@theme), OKLCH color token validation, typography token scale (--font-sans/serif/mono + Tailwind text-*), spacing token scale (--spacing + Tailwind p-*/m-*/gap-*), border-radius tokens (--radius + rounded-*), shadow system tokens (--shadow-*), arbitrary value detection and replacement, token reuse patterns, light/dark mode token parity, and design system compliance scoring.
agents:
  - shadcn-ui-designer
  - theme-master
  - responsive-master
---

# Design Tokens Skill

> Centralized, reusable token system enforcement for consistent UI styling

## When to Use

- Auditing a codebase for hardcoded/arbitrary style values
- Enforcing design token usage across all components
- Creating or extending a CSS custom property token system
- Cleaning up inconsistent color, font, spacing, or radius values
- Validating that light and dark mode tokens are in parity
- Reviewing Tailwind config alignment with CSS variables
- Ensuring new components use tokens instead of raw values

## Token Architecture

The token system has three layers that must stay synchronized:

```
:root { }       → Light mode CSS custom properties (source of truth)
.dark { }       → Dark mode overrides (same variable names, different values)
@theme inline { } → Tailwind mappings that consume the CSS variables
```

### Token Categories

| Category | CSS Variable Pattern | Tailwind Consumption | Example |
|----------|---------------------|---------------------|---------|
| **Colors** | `--background`, `--primary`, `--muted` | `bg-background`, `bg-primary` | `oklch(0.98 0 0)` |
| **Typography** | `--font-sans`, `--font-serif`, `--font-mono` | `font-sans`, `font-mono` | `"Inter", sans-serif` |
| **Spacing** | `--spacing` | `p-4`, `gap-6`, `m-8` | `0.25rem` base unit |
| **Radius** | `--radius` | `rounded-lg`, `rounded-md` | `0.625rem` |
| **Shadows** | `--shadow-*` | `shadow-sm`, `shadow-lg` | Composite shadow values |

## Color Tokens (OKLCH Required)

All color tokens MUST use OKLCH format: `oklch(L C H)` or `oklch(L C H / alpha)`.

### Required Color Variables (in order)

| Token | Purpose | Light Mode Guidance | Dark Mode Guidance |
|-------|---------|--------------------|--------------------|
| `--background` | Page background | High lightness (0.95-0.99), near-zero chroma | Low lightness (0.10-0.20) |
| `--foreground` | Primary text | Low lightness (0.10-0.25) | High lightness (0.90-0.98) |
| `--card` | Card surfaces | Slightly lighter than background | Slightly lighter than background |
| `--card-foreground` | Card text | Same as foreground | Same as foreground |
| `--popover` | Popover surfaces | Same as card | Same as card |
| `--popover-foreground` | Popover text | Same as foreground | Same as foreground |
| `--primary` | Primary actions | Brand hue, chroma 0.15-0.25 | Adjusted for dark bg contrast |
| `--primary-foreground` | Text on primary | White or near-white | Dark or near-black |
| `--secondary` | Secondary surfaces | Muted, low chroma | Muted, adjusted lightness |
| `--secondary-foreground` | Text on secondary | Readable contrast | Readable contrast |
| `--muted` | Muted backgrounds | Very low chroma, high lightness | Very low chroma, low lightness |
| `--muted-foreground` | Muted text | Mid lightness for deemphasis | Mid lightness for deemphasis |
| `--accent` | Hover/focus highlights | Similar to muted but slightly different | Adjusted for dark |
| `--accent-foreground` | Text on accent | Readable contrast | Readable contrast |
| `--destructive` | Error/danger | Red hue (15-30), high chroma | Adjusted for dark bg |
| `--destructive-foreground` | Text on destructive | White or near-white | Appropriate contrast |
| `--border` | Borders | Low chroma, mid-high lightness | Low chroma, low-mid lightness |
| `--input` | Input borders | Similar to border | Similar to border |
| `--ring` | Focus rings | Primary hue | Primary hue |
| `--chart-1` to `--chart-5` | Chart colors | Distinct hues, consistent chroma | Adjusted for dark bg |
| `--sidebar-*` | Sidebar tokens | Visual hierarchy variants | Dark mode variants |

### Contrast Requirements

- Normal text (foreground on background): minimum 4.5:1 ratio
- Large text (headings): minimum 3:1 ratio
- UI components (borders, icons): minimum 3:1 ratio
- Chart colors: visually distinguishable and colorblind-friendly

## Typography Tokens

### Font Family Tokens

```css
:root {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Georgia", ui-serif, serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

### Typography Scale (Tailwind Built-in, rem-based)

These are the ONLY acceptable font sizes. No arbitrary values.

| Token | Size | Use Case |
|-------|------|----------|
| `text-xs` | 0.75rem | Badges, fine print |
| `text-sm` | 0.875rem | Secondary text, form labels |
| `text-base` | 1rem | Body text (default) |
| `text-lg` | 1.125rem | Emphasized body, card titles |
| `text-xl` | 1.25rem | Section headings (mobile) |
| `text-2xl` | 1.5rem | Page headings (mobile) |
| `text-3xl` | 1.875rem | Hero heading (mobile) |
| `text-4xl`+ | 2.25rem+ | Hero heading (larger breakpoints) |

### Font Weight Tokens

Only standard weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`.

## Spacing Tokens

The `--spacing` CSS variable defines the base spacing unit (default: `0.25rem`). Tailwind multiplies this by the spacing scale number.

### Allowed Spacing Values

| Tailwind | Computed | Common Use |
|----------|---------|------------|
| `1` | 0.25rem | Fine gaps |
| `2` | 0.5rem | Tight padding |
| `3` | 0.75rem | Compact spacing |
| `4` | 1rem | Standard padding |
| `5` | 1.25rem | Medium padding |
| `6` | 1.5rem | Section gaps |
| `8` | 2rem | Large gaps |
| `10` | 2.5rem | Generous padding |
| `12` | 3rem | Section padding |
| `16` | 4rem | Large section padding |
| `20` | 5rem | Hero-level spacing |

### Violations to Detect

- `p-[13px]`, `m-[25px]`, `gap-[18px]` — arbitrary pixel spacing
- `p-7`, `m-9`, `gap-11` — off-scale Tailwind values (usable but non-standard)
- `padding: 13px`, `margin: 25px` — inline or CSS pixel values

## Border Radius Tokens

The `--radius` CSS variable (default: `0.625rem`) feeds the Tailwind radius scale.

### Allowed Radius Values

| Tailwind | Computed | Use Case |
|----------|---------|----------|
| `rounded-sm` | `calc(var(--radius) - 0.25rem)` | Small elements, badges |
| `rounded-md` | `calc(var(--radius) - 0.125rem)` | Inputs, small cards |
| `rounded-lg` | `var(--radius)` | Default card radius |
| `rounded-xl` | `calc(var(--radius) + 0.125rem)` | Large cards |
| `rounded-2xl` | `calc(var(--radius) + 0.25rem)` | Hero sections |
| `rounded-full` | `9999px` | Pills, avatars |
| `rounded-[10%]` | 10% | Percentage-based (cards) |

### Violations to Detect

- `rounded-[12px]`, `rounded-[8px]` — hardcoded pixel radius
- Inconsistent radius across same-type components (e.g., some cards `rounded-lg`, others `rounded-xl`)

## Shadow Tokens

The shadow system uses CSS variables for composable shadows:

```css
:root {
  --shadow-color: oklch(0 0 0 / 0.1);
  --shadow-2xs: 0 1px oklch(0 0 0 / 0.07);
  --shadow-xs: 0 1px 2px 0 oklch(0 0 0 / 0.05);
  --shadow-sm: 0 2px 4px oklch(0 0 0 / 0.1);
  /* ... up to --shadow-2xl */
}
```

### Allowed Shadow Usage

Use Tailwind shadow utilities: `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`.

### Violations to Detect

- `shadow-[0_2px_4px_rgba(0,0,0,0.1)]` — hardcoded shadow
- Inline `box-shadow` styles
- Inconsistent shadow depth across same-level surfaces

## Audit Rules

### Severity Levels

| Severity | Description | Examples |
|----------|-------------|---------|
| **Critical** | Breaks token system entirely | Raw hex colors `bg-[#333]`, inline styles, raw Tailwind colors `bg-gray-100` |
| **High** | Arbitrary values bypass tokens | `text-[15px]`, `p-[13px]`, `rounded-[12px]`, `shadow-[...]` |
| **Medium** | Inconsistent token usage | Mixed radius on same component type, inconsistent spacing patterns |
| **Low** | Opportunity for better token use | Off-scale but valid Tailwind values (`p-7`), missing responsive scaling |

### Detection Patterns

**Color violations:**
```
bg-\[#[0-9a-fA-F]+\]|text-\[#[0-9a-fA-F]+\]|border-\[#[0-9a-fA-F]+\]
bg-\[rgb|text-\[rgb|border-\[rgb
bg-(red|blue|green|yellow|purple|pink|orange|gray|slate|zinc|neutral|stone)-\d+
text-(red|blue|green|yellow|purple|pink|orange|gray|slate|zinc|neutral|stone)-\d+
```

**Typography violations:**
```
text-\[\d+px\]|text-\[\d+rem\]|font-size:\s*\d+px
```

**Spacing violations:**
```
[mp][xytblr]?-\[\d+px\]|gap-\[\d+px\]|[mp][xytblr]?-\[\d+rem\]
```

**Radius violations:**
```
rounded-\[\d+px\]|border-radius:\s*\d+px
```

**Shadow violations:**
```
shadow-\[.*\]|box-shadow:\s*[^v]
```

## Token Parity Checklist

When auditing, verify these are in sync:

- [ ] Every `:root` color token has a corresponding `.dark` override
- [ ] `@theme inline` maps all CSS variables to Tailwind utilities
- [ ] `--font-sans`, `--font-serif`, `--font-mono` are defined and consumed
- [ ] `--radius` is defined and Tailwind radius utilities reference it
- [ ] `--spacing` is defined and Tailwind spacing utilities reference it
- [ ] Shadow tokens are defined in both light and dark modes
- [ ] Chart tokens (`--chart-1` through `--chart-5`) exist in both modes
- [ ] Sidebar tokens exist in both modes

## Remediation Patterns

### Replace Arbitrary Colors

```diff
- <div className="bg-[#f5f5f5] text-[#333]">
+ <div className="bg-muted text-foreground">
```

### Replace Arbitrary Typography

```diff
- <p className="text-[15px]">
+ <p className="text-sm">  {/* 0.875rem = 14px, closest standard size */}
```

### Replace Arbitrary Spacing

```diff
- <div className="p-[13px] gap-[18px]">
+ <div className="p-3 gap-4">  {/* 0.75rem and 1rem */}
```

### Replace Arbitrary Radius

```diff
- <div className="rounded-[12px]">
+ <div className="rounded-xl">  {/* Uses --radius token */}
```

### Replace Raw Tailwind Colors

```diff
- <span className="text-gray-500 bg-slate-100">
+ <span className="text-muted-foreground bg-muted">
```

## Scoring Rubric

| Category | Weight | What Passes |
|----------|--------|-------------|
| Color token compliance | 25% | Zero raw hex, rgb, or Tailwind color classes; all colors via CSS variables |
| Typography token compliance | 20% | Zero arbitrary font sizes; all text uses standard Tailwind scale |
| Spacing token compliance | 20% | Zero arbitrary spacing; all padding/margin/gap uses Tailwind scale |
| Radius token compliance | 15% | Zero arbitrary radius; consistent radius per component type |
| Shadow token compliance | 10% | Zero arbitrary shadows; all shadows via Tailwind utilities |
| Light/dark parity | 10% | All tokens defined in both modes; @theme inline complete |

## References

- shadcn/ui theming: https://ui.shadcn.com/docs/theming
- Tailwind CSS theme configuration: https://tailwindcss.com/docs/theme
- OKLCH color space: https://oklch.com
- CSS custom properties: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- `responsive-design` skill — Unit compliance (rem enforcement)
- `theme-master` agent — OKLCH theme generation
