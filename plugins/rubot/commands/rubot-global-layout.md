---
name: rubot-global-layout
description: Build a persistent global layout with shared Navbar and Footer wrapping all routes. Use when the user wants to add a navbar, footer, global layout, site header, site footer, page wrapper, persistent navigation, or shared layout components.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Skill
---

# Global Layout — Navbar & Footer Command

Build a persistent global layout that wraps all current and future pages with a shared Navbar at the top and Footer at the bottom.

## Prerequisites

Before running this command:
1. Load the `global-layout` skill for patterns and component structures
2. Verify the project uses TanStack Start / TanStack Router (check `package.json`)
3. Identify the existing root layout file (`__root.tsx`)

## Execution Steps

### Step 1: Detect Project Structure

Scan the project to understand the current layout architecture:

```bash
# Detect framework from package.json
cat package.json 2>/dev/null | grep -E "(tanstack|react|next|vue|svelte|remix|astro)" | head -10

# Find existing root layout / app entry
find . -maxdepth 4 \( -name "__root.tsx" -o -name "__root.jsx" -o -name "root.tsx" -o -name "layout.tsx" -o -name "_app.tsx" -o -name "App.tsx" \) -not -path "*/node_modules/*" 2>/dev/null

# Find existing component directories
ls -d src/components/ app/components/ components/ src/lib/components/ 2>/dev/null

# Check for existing navbar/footer
find . -maxdepth 4 \( -iname "*navbar*" -o -iname "*header*" -o -iname "*footer*" -o -iname "*nav-bar*" -o -iname "*site-header*" -o -iname "*site-footer*" \) -not -path "*/node_modules/*" 2>/dev/null
```

### Step 2: Confirm Design Intent

Use AskUserQuestion to understand what the user wants:

```
questions:
  - question: "What style of Navbar do you want?"
    header: "Navbar Style"
    options:
      - label: "Simple — logo + navigation links"
        description: "Clean navbar with logo on the left, horizontal nav links, and optional CTA button"
      - label: "With mobile drawer"
        description: "Desktop: horizontal links. Mobile: hamburger menu with slide-out drawer"
      - label: "Minimal — logo only"
        description: "Just the logo/brand, no navigation links"
      - label: "Custom — I'll describe it"
        description: "Let me explain what I need"
    multiSelect: false
  - question: "What should the Footer include?"
    header: "Footer Style"
    options:
      - label: "Simple — copyright + links"
        description: "Single row with copyright text and a few links"
      - label: "Multi-column — organized sections"
        description: "Footer with columns: About, Links, Social, Contact, etc."
      - label: "Minimal — copyright only"
        description: "Just a copyright line, nothing else"
      - label: "Custom — I'll describe it"
        description: "Let me explain what I need"
    multiSelect: false
  - question: "Should the Navbar be sticky (fixed to top on scroll)?"
    header: "Sticky Navbar"
    options:
      - label: "Yes — sticky on scroll (Recommended)"
        description: "Navbar stays visible as the user scrolls down"
      - label: "No — scrolls with page"
        description: "Navbar scrolls away normally"
    multiSelect: false
```

### Step 3: Determine File Locations

Based on the project structure detected in Step 1, determine where to place files:

**Component directory** (in priority order):
1. `src/components/layout/` — if `src/components/` exists
2. `app/components/layout/` — if `app/components/` exists
3. `components/layout/` — if `components/` exists at root
4. Create `src/components/layout/` as default

**Root layout file** (in priority order):
1. `app/routes/__root.tsx` — TanStack Start convention
2. `src/routes/__root.tsx` — TanStack Router convention
3. `app/__root.tsx` — alternative TanStack location
4. `src/app.tsx` or `src/App.tsx` — React SPA convention

### Step 4: Create the Navbar Component

Create the Navbar component in the determined component directory.

The Navbar MUST:
- Be a standalone, reusable component in its own file
- Use Tailwind CSS for styling (consistent with project stack)
- Be responsive (mobile-friendly)
- Include semantic HTML (`<nav>`, `<header>`)
- Follow the user's chosen style from Step 2
- Use `Link` from `@tanstack/react-router` for internal navigation (not `<a>` tags)
- Include proper `aria-label` on the nav element

If the user chose "With mobile drawer":
- Use a hamburger button on mobile (below `md` breakpoint)
- Implement a slide-out drawer or dropdown menu
- Include a visible close button (X icon) in the drawer
- Ensure touch targets are ≥ 2.75rem

### Step 5: Create the Footer Component

Create the Footer component in the same component directory.

The Footer MUST:
- Be a standalone, reusable component in its own file
- Use Tailwind CSS for styling
- Include semantic HTML (`<footer>`)
- Follow the user's chosen style from Step 2
- Use `Link` from `@tanstack/react-router` for internal navigation
- Include a copyright line with the current year (use `new Date().getFullYear()`)

### Step 6: Integrate into the Root Layout

Read the existing root layout file and integrate the Navbar and Footer.

**For TanStack Start/Router (`__root.tsx`):**

The root layout should follow this structure:

```tsx
// Import Navbar and Footer
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

// Inside the RootComponent:
<div className="flex min-h-dvh flex-col">
  <Navbar />
  <main className="flex-1">
    <Outlet />
  </main>
  <Footer />
</div>
```

**Critical rules:**
- Import Navbar and Footer ONCE in the root layout only
- Do NOT import them in any individual page/route file
- Use `<Outlet />` from `@tanstack/react-router` as the content slot
- Wrap in a flex column with `min-h-dvh` so the footer sticks to the bottom
- The `<main>` element gets `flex-1` to fill available space

**If a layout already exists:**
- Extend it — do NOT replace unrelated logic (meta tags, scripts, providers, etc.)
- Insert Navbar before the existing content slot
- Insert Footer after the existing content slot
- Preserve all existing wrappers (providers, error boundaries, etc.)

### Step 7: Verify No Duplicate Imports

Scan the entire codebase to ensure Navbar and Footer are not imported in any page file:

```
Grep pattern: "import.*Navbar|import.*Footer|import.*SiteHeader|import.*SiteFooter"
  glob: "*.tsx,*.jsx"
```

If duplicates are found in page files, remove them — the layout handles it.

### Step 8: Verify Route Rendering

Check that existing routes still render correctly with the new layout:

```bash
# Verify no TypeScript errors
bunx tsc --noEmit 2>&1 | head -20

# Verify build still works
bun run build 2>&1 | tail -10
```

### Step 9: Present Results

```
questions:
  - question: "Global layout created! Navbar and Footer now wrap all routes automatically. Want to verify visually?"
    header: "Layout Complete"
    options:
      - label: "Start dev server and verify"
        description: "Run bun run dev and check the layout in the browser"
      - label: "Run validation (/rubot-check)"
        description: "Run full validation to check for any issues"
      - label: "Done — looks good"
        description: "All set, no further action needed"
    multiSelect: false
```

## Enforcement Rules

- Do NOT place Navbar or Footer imports in any individual page/route file
- Do NOT break existing page routes or content
- Do NOT replace unrelated logic in the root layout — extend it
- Do NOT use `<a>` tags for internal navigation — use `Link` from the router
- Navbar and Footer MUST each be defined in exactly one file
- The layout MUST use semantic HTML (`<header>`, `<nav>`, `<main>`, `<footer>`)
- ALL existing styles and functionality MUST be preserved

## Related Commands

- `/rubot-check` — Validate the implementation
- `/rubot-responsive-audit` — Audit responsive behavior of the new layout
- `/rubot-wcag-audit` — Check accessibility of navbar and footer

## Related Skills

- `global-layout` — Navbar, Footer, and root layout patterns
- `responsive-design` — Mobile-first responsive patterns
