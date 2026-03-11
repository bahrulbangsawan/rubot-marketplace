---
name: figma-slicing
version: 1.0.0
description: |
  Pixel-perfect Figma-to-code implementation using Figma MCP tools to extract design context, tokens, and screenshots from Figma node links and build production-ready, responsive UI sections with a complete design system.
  TRIGGER when: user mentions Figma slicing, Figma-to-code, implementing a Figma design, design handoff, design implementation, pixel-perfect from Figma, extracting design tokens from Figma, building sections from Figma nodes, or references a section-figma.yaml file.
  Also TRIGGER when: user runs /rubot-implement-figma with a YAML file, wants to convert Figma frames into code, asks about design-to-code workflow, or mentions Figma node URLs.
  DO NOT TRIGGER when: user is designing IN Figma (not implementing from it), asking about Figma plugin development, or working with non-Figma design tools like Sketch or Adobe XD.
agents:
  - shadcn-ui-designer
  - frontend
---

# Figma Slicing — Design-to-Code Implementation Skill

Transform Figma designs into pixel-perfect, production-ready code by extracting design context from Figma MCP tools and implementing each section with a complete design system, full responsiveness, SSR support, and SEO best practices.

## When to Use

- Implementing a landing page or web app from Figma designs
- Converting Figma frames/components into production code
- Extracting design tokens (colors, typography, spacing) from Figma
- Building responsive sections that match a Figma reference exactly
- Running the `/rubot-implement-figma` command with a section config file

## Prerequisites

- **Figma MCP server** must be connected and available (provides tools like `get_file`, `get_node`, `get_images`, `get_styles`)
- A `section-figma.yaml` file with valid Figma node URLs per section
- Project scaffolding in place (package.json, framework config)

## Implementation Workflow

### Phase 1: Design Extraction

For each section's Figma node URL, use Figma MCP tools to extract:

1. **Node structure** — hierarchy of frames, components, text layers, and groups
2. **Visual properties** — colors (fills, strokes), typography (font family, size, weight, line height, letter spacing), spacing (padding, gaps, margins), border radius, shadows, opacity
3. **Screenshots** — visual reference of each section at desktop resolution
4. **Component inventory** — identify reusable patterns across sections (buttons, cards, badges, section headers, input fields)

**Extraction sequence for each node:**

```
1. Use Figma MCP to fetch the node data from the Figma node URL
2. Extract the node-id from the URL query parameter (?node-id=X-Y)
3. Fetch node details: children, layout properties, fills, strokes, effects
4. Fetch node image export for visual reference
5. Recursively analyze children for typography, color, and spacing values
6. Record all extracted values in a structured format before coding
```

### Phase 2: Design System Setup

Before building any section, establish the design system from extracted values:

#### 2.1 Color Tokens
Extract every unique color from the Figma file and organize into semantic categories:

```
tokens/
  colors.ts       — primary, secondary, neutral, semantic, surface, border
```

- Map Figma fill colors → semantic token names
- Include opacity variants where used
- NO hardcoded hex/rgb values in components — tokens only

#### 2.2 Typography Scale
Extract all text styles and create a typography scale:

```
tokens/
  typography.ts   — font families, size scale, weight scale, line heights, letter spacing
```

- Map Figma text styles → named typography tokens
- Include responsive adjustments per breakpoint

#### 2.3 Spacing Scale
Extract padding, gaps, and margins to build a spacing scale:

```
tokens/
  spacing.ts      — spacing scale derived from Figma layout properties
```

#### 2.4 Other Tokens

```
tokens/
  shadows.ts      — elevation/shadow tokens from Figma effects
  radius.ts       — border radius tokens from Figma corner radius values
  breakpoints.ts  — responsive breakpoints (xs: 0, sm: 576, md: 768, lg: 992)
```

### Phase 3: Folder Structure

Organize implementation following best practices:

```
src/
  tokens/              — design tokens (colors, typography, spacing, shadows, radius)
  components/          — reusable UI components (Button, Card, Badge, SectionHeader, etc.)
    Button/
      Button.tsx
      Button.styles.ts
      Button.types.ts
    ...
  sections/            — page-level sections (Navbar, Hero, Stats, etc.)
    Navbar/
      Navbar.tsx
      Navbar.styles.ts
    Hero/
      Hero.tsx
      Hero.styles.ts
    ...
  layouts/             — layout wrappers (Container, Grid, Stack)
  pages/               — full page compositions
  assets/              — placeholder images and icons
  utils/               — helper utilities
```

### Phase 4: Reusable Components

Build shared components identified during extraction:

- **Buttons** — variants (primary, secondary, ghost), sizes, states (default, hover, active, focus, disabled)
- **Cards** — with consistent padding, radius, shadow tokens
- **Badges** — status indicators, tags
- **Section Headers** — title + subtitle pattern used across sections
- **Container** — max-width wrapper with responsive padding
- Any other repeated pattern found in the Figma design

All components must:
- Use design tokens exclusively (no hardcoded values)
- Support all interactive states from the Figma design
- Be SSR-compatible (no browser-only APIs at render time)
- Use semantic HTML elements

### Phase 5: Section-by-Section Implementation

Implement each section in the order defined by the `section-figma.yaml` file. For each section:

1. **Re-read the Figma node** — fetch fresh design context from Figma MCP
2. **Screenshot comparison** — capture a Figma screenshot for reference
3. **Build the section** using tokens and reusable components
4. **Match the design exactly** — same layout, spacing, typography, colors, alignment
5. **Preserve all copywriting** — text content must match the Figma design verbatim
6. **Use placeholder images** — do not use final assets, use dimensionally-accurate placeholders
7. **Verify responsiveness** — test across all 4 breakpoints after each section

**Per-section responsive checks:**
- **xs (0–575px):** single column, stacked layout, touch-friendly tap targets
- **sm (576–767px):** adjusted spacing, may introduce 2-column where appropriate
- **md (768–991px):** tablet layout, intermediate spacing
- **lg (992px+):** full desktop layout matching Figma exactly

### Phase 6: SEO & SSR Compliance

Each section must follow:

**SEO:**
- Semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<header>`)
- Proper heading hierarchy (`h1` → `h2` → `h3`, never skip levels)
- Alt text on all images (even placeholders)
- Accessible link text (no "click here")
- Crawlable content (no content hidden behind JS-only interactions)

**SSR:**
- No `window`, `document`, or browser-only APIs during server render
- Use `useEffect` / `onMount` for client-only logic
- Ensure hydration-safe markup (server HTML matches client)

### Phase 7: Final Integration & QA

After all sections are implemented:

1. Compose all sections into the full page
2. Verify section-to-section spacing and visual flow
3. Full responsive sweep at all 4 breakpoints
4. Check for overflow, cut-off content, broken alignment
5. Validate heading hierarchy is correct across the full page
6. Confirm all design tokens are used (no hardcoded values leaked in)

## Figma MCP Tool Usage Reference

When interacting with Figma MCP, use these patterns:

| Task | Figma MCP Approach |
|------|-------------------|
| Get section design | Fetch node by node-id from the section's Figma URL |
| Extract colors | Read `fills` and `strokes` arrays from node properties |
| Extract typography | Read `style` object: `fontFamily`, `fontSize`, `fontWeight`, `lineHeightPx`, `letterSpacing` |
| Extract spacing | Read `paddingLeft/Right/Top/Bottom`, `itemSpacing` from auto-layout nodes |
| Extract radius | Read `cornerRadius` or `rectangleCornerRadii` from frame nodes |
| Extract shadows | Read `effects` array filtered by type `DROP_SHADOW` or `INNER_SHADOW` |
| Get visual reference | Export node as PNG image for screenshot comparison |
| List components | Read node children recursively to inventory component instances |

## Constraints

- NEVER hardcode colors, font sizes, spacing, or radius values in section/component code
- NEVER skip a section or implement them out of order
- NEVER alter copywriting text from the Figma design
- NEVER use final production images — use sized placeholders only
- ALWAYS extract design context from Figma MCP before implementing each section
- ALWAYS verify responsive behavior after each section, not just at the end

## Verification Checklist

After implementation, verify:

- [ ] All design tokens extracted and organized (colors, typography, spacing, shadows, radius)
- [ ] Reusable components built and used consistently across sections
- [ ] Each section matches Figma design at desktop (lg) breakpoint
- [ ] Each section is responsive across xs/sm/md/lg with no overflow or broken layout
- [ ] All text content matches Figma verbatim
- [ ] No hardcoded style values in any component or section file
- [ ] Semantic HTML and proper heading hierarchy throughout
- [ ] SSR-compatible (no browser API usage during render)
- [ ] Placeholder images used with correct dimensions
- [ ] Folder structure follows the defined organization pattern

## References

- [Figma REST API documentation](https://www.figma.com/developers/api)
- [Figma MCP server](https://github.com/nicholasgriffintn/figma-mcp)
- OWASP Top 10 for web security in frontend code
- WCAG 2.2 Level AA for accessibility compliance
