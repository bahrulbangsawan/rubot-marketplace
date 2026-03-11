---
name: rubot-implement-figma
description: Implement pixel-perfect UI from Figma designs using Figma MCP. Without arguments, generates a section-figma.yaml template. With a YAML file argument, reads Figma node links and implements each section with a complete design system, responsive layout, SSR, and SEO.
argument-hint: [section-figma.yaml]
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Skill
  - AskUserQuestion
  - WebFetch
  - WebSearch
---

# Figma Design Implementation Command

Implement a complete UI from Figma designs, section by section, with pixel-perfect accuracy.

**Two modes:**
- **No argument** → generates a `section-figma.yaml` template for the user to fill in
- **With YAML file** → reads the config and implements the full design pipeline

---

## Mode 1: Generate Template (no argument)

If the user runs `/rubot-implement-figma` without providing a YAML file path:

### Step 1: Ask for Project Details

Use AskUserQuestion to gather context:

```
questions:
  - question: "What is your project name?"
    header: "Project Name"
    options:
      - label: "Use current directory name"
        description: "Auto-detect from package.json or folder name"
      - label: "I'll type a custom name"
        description: "Enter a custom project name"
    multiSelect: false
  - question: "How many sections does your design have?"
    header: "Design Sections"
    options:
      - label: "Standard 8 sections (Navbar, Hero, Stats, Features, Products, Testimonial, CTA, Footer)"
        description: "Common landing page layout with all standard sections"
      - label: "Fewer than 8 — I'll remove sections I don't need"
        description: "Start with the full template and delete unused sections"
      - label: "More than 8 — I'll add custom sections"
        description: "Start with the full template and add additional sections at the bottom"
    multiSelect: false
```

### Step 2: Generate the YAML File

1. Read the template from `plugins/rubot/templates/section-figma.yaml.template`
2. Replace `{{PROJECT_NAME}}` with the project name (from package.json or user input)
3. Replace `{{TIMESTAMP}}` with the current ISO timestamp
4. Write the output to `section-figma.yaml` in the project root

### Step 3: Instruct the User

Tell the user:

```
✅ Created section-figma.yaml in your project root.

Next steps:
1. Open section-figma.yaml
2. Replace each [FIGMA LINK HERE] with the actual Figma node URL for that section
3. Set your Figma file URL at the top under figma.file_url
4. Add or remove sections as needed
5. Run: /rubot-implement-figma section-figma.yaml
```

**Stop here. Do not proceed to implementation.**

---

## Mode 2: Implement Design (with YAML file argument)

If the user provides a YAML file path (e.g., `/rubot-implement-figma section-figma.yaml`):

### Step 1: Validate the Configuration File

1. Read the provided YAML file using the Read tool
2. Parse and validate:
   - `figma.file_url` must not be `[FIGMA FILE URL HERE]` (still a placeholder)
   - Each section in `sections` must have a `figma_node_url` that is NOT `[FIGMA LINK HERE]`
   - At least one section must have a valid Figma URL
3. If any section still has a placeholder URL, use AskUserQuestion:

```
questions:
  - question: "Some sections still have placeholder Figma links. How should we proceed?"
    header: "Incomplete Figma Links Detected"
    options:
      - label: "Skip sections with missing links"
        description: "Only implement sections that have valid Figma node URLs"
      - label: "I'll fix the file first — stop here"
        description: "Exit so you can update the YAML with the correct Figma links"
    multiSelect: false
```

### Step 2: Confirm Implementation Scope

Use AskUserQuestion to confirm the implementation plan:

```
questions:
  - question: "Which sections should we implement?"
    header: "Implementation Scope — [N] sections with valid Figma links"
    options:
      - label: "All sections in order"
        description: "Implement every section from top to bottom as defined in the YAML"
      - label: "Specific sections only"
        description: "Choose which sections to implement (useful for incremental work)"
    multiSelect: false
  - question: "What framework/stack are you using?"
    header: "Tech Stack"
    options:
      - label: "React (TanStack Start / Next.js / Vite)"
        description: "React-based with JSX/TSX components"
      - label: "Vue (Nuxt / Vite)"
        description: "Vue-based with SFC components"
      - label: "Svelte (SvelteKit)"
        description: "Svelte-based with .svelte components"
      - label: "HTML + Tailwind (static)"
        description: "Plain HTML with Tailwind CSS classes"
      - label: "Other — I'll specify"
        description: "Custom framework or stack"
    multiSelect: false
  - question: "Styling approach?"
    header: "CSS Strategy"
    options:
      - label: "Tailwind CSS"
        description: "Utility-first CSS framework with design token integration"
      - label: "CSS Modules"
        description: "Scoped CSS with module-level class names"
      - label: "Styled Components / Emotion"
        description: "CSS-in-JS with runtime or build-time styling"
      - label: "Vanilla CSS with CSS Custom Properties"
        description: "Plain CSS using CSS variables for design tokens"
    multiSelect: false
```

If the user selected "Specific sections only", follow up:

```
questions:
  - question: "Select the sections to implement:"
    header: "Choose Sections"
    options:
      [dynamically list each section from the YAML that has a valid Figma link]
    multiSelect: true
```

### Step 3: Load the Figma Slicing Skill

Load the `figma-slicing` skill via the Skill tool to get the full implementation methodology:

```
Skill tool: figma-slicing
```

Follow the skill's phased approach strictly.

### Step 4: Extract Design Context from ALL Sections

Before writing any code, extract design context from every section's Figma node using Figma MCP tools. This ensures the design system captures tokens from the entire design, not just the first section.

For each section in the YAML:

1. Parse the `figma_node_url` to extract the file key and node-id
2. Use Figma MCP tools to fetch the node data
3. Use Figma MCP tools to export a screenshot of the node for visual reference
4. Extract and record:
   - All colors (fills, strokes, backgrounds)
   - All typography (font family, size, weight, line height, letter spacing)
   - All spacing (padding, gaps, margins from auto-layout)
   - All effects (shadows, blur, opacity)
   - All corner radius values
   - Component instances and variants used
5. Save extracted context per section for reference during implementation

### Step 5: Build the Design System

Using all extracted values from Step 4:

1. Create the design token files:
   - `tokens/colors.ts` — deduplicated, semantically named color tokens
   - `tokens/typography.ts` — font families, size scale, weight scale
   - `tokens/spacing.ts` — spacing scale from layout gaps and padding
   - `tokens/shadows.ts` — shadow/elevation tokens
   - `tokens/radius.ts` — border radius tokens
   - `tokens/breakpoints.ts` — responsive breakpoints (xs/sm/md/lg)

2. Create reusable components identified across sections:
   - Buttons (with variants and states)
   - Cards (with consistent styling)
   - Badges, tags, labels
   - Section headers (title + subtitle)
   - Container/wrapper components
   - Any other repeated patterns

3. Set up folder structure following the skill's organization pattern

### Step 6: Implement Sections Sequentially

For each section (in order from the YAML):

1. **Re-fetch** the Figma node data via Figma MCP for fresh context
2. **Reference the screenshot** — keep the Figma visual as the source of truth
3. **Build the section** using design tokens and reusable components
4. **Match the Figma design exactly**:
   - Same layout structure (flex, grid, positioning)
   - Same spacing (margins, padding, gaps) using spacing tokens
   - Same typography (font, size, weight, color) using typography tokens
   - Same visual styling (backgrounds, borders, shadows) using design tokens
5. **Preserve all text content** — copy must match Figma verbatim
6. **Use placeholder images** — correct dimensions, no final assets
7. **Ensure semantic HTML** — proper elements and heading hierarchy
8. **Verify responsiveness** after each section:
   - xs (0–575px): mobile-first stacked layout
   - sm (576–767px): small adjustments
   - md (768–991px): tablet layout
   - lg (992px+): full desktop matching Figma

After each section, briefly confirm progress to the user before moving to the next.

### Step 7: Final Integration

After all sections are complete:

1. Compose all sections into the full page
2. Verify section-to-section spacing and visual continuity
3. Full responsive audit at all 4 breakpoints
4. Check for:
   - No overflow or cut-off content
   - Consistent spacing between sections
   - Correct heading hierarchy across the full page (h1 → h2 → h3)
   - No hardcoded values anywhere
5. SSR compatibility check:
   - No `window` or `document` usage at render time
   - Hydration-safe markup
6. SEO check:
   - Semantic HTML structure
   - Alt text on images
   - Proper meta tag structure in place

### Step 8: Present Results

Use AskUserQuestion to offer next steps:

```
questions:
  - question: "Implementation complete. What would you like to do next?"
    header: "Figma Implementation Complete — [N] sections built"
    options:
      - label: "Review and refine specific sections"
        description: "Go back to any section for pixel-perfect adjustments"
      - label: "Run responsive audit"
        description: "Detailed responsive check at all 4 breakpoints using /rubot-responsive-audit"
      - label: "Run accessibility audit"
        description: "WCAG 2.2 Level AA compliance check using /rubot-wcag-audit"
      - label: "Run SEO audit"
        description: "SEO best practices verification using /rubot-seo-audit"
      - label: "Commit the implementation"
        description: "Stage and commit all implemented files using /rubot-commit"
    multiSelect: true
```

## Enforcement Rules

1. **NEVER** skip the design token extraction phase — always build the design system before sections
2. **NEVER** hardcode colors, font sizes, spacing, or radius values in section code
3. **NEVER** implement sections out of the order defined in the YAML file
4. **NEVER** alter text content from the Figma design
5. **NEVER** proceed to implementation if the YAML has placeholder links still present
6. **ALWAYS** use Figma MCP tools to extract design context — do not guess or assume values
7. **ALWAYS** verify responsiveness after each section, not just at the end
8. **ALWAYS** use semantic HTML and maintain proper heading hierarchy

## Related Skills

- `figma-slicing` — Core implementation methodology for Figma-to-code conversion
- `responsive-design` — Responsive design system and breakpoint management
- `design-tokens` — Design token extraction and organization patterns

## Related Commands

- `/rubot-responsive-audit` — Verify responsive behavior across all breakpoints
- `/rubot-wcag-audit` — Run WCAG 2.2 Level AA accessibility audit
- `/rubot-seo-audit` — Run SEO compliance audit
- `/rubot-check` — Run full validation suite
- `/rubot-commit` — Commit implementation files
