---
name: global-layout
version: 1.1.0
description: |
  Build persistent global layouts with shared Navbar and Footer components in __root.tsx. ACTIVATE THIS SKILL when the user wants to: add a navbar or footer that appears on every page, build a sticky/fixed header, create an app shell or page wrapper with flex min-h-dvh layout, fix a footer floating in the middle of short-content pages, refactor per-route Navbar/Footer imports into a centralized root layout, build a multi-column responsive footer grid, add a hamburger menu / mobile drawer navigation, fix navbar remounting on route navigation, switch between fixed and sticky header positioning, add responsive mobile navigation with aria-expanded/aria-controls, or create a site-wide navigation bar component.

  Trigger on: "navbar", "footer", "site header", "site footer", "navigation bar", "app shell", "root layout", "global layout", "shared layout", "persistent navigation", "page wrapper", "header and footer", "sticky header", "fixed header", "hamburger menu", "mobile drawer", "nav bar".

  DO NOT trigger for: sidebar navigation, breadcrumbs, tab navigation, bottom nav bar, scroll-to-top buttons, pagination, command palettes, or content grid layouts.
agents:
  - shadcn-ui-designer
  - responsive-master
---

# Global Layout Skill — Navbar & Footer
> Build a persistent app shell with shared Navbar and Footer that wraps every route from a single root layout file.

## When to Use

Use this skill when:
- Creating a new global layout for a project
- Adding shared navigation (navbar, header) to all pages
- Building a persistent footer that appears on every page
- Restructuring a project to use a single root layout
- Migrating from per-page Navbar/Footer imports to a centralized layout
- Implementing sticky or fixed header patterns
- A user asks for "a navbar", "a footer", "site navigation", "page wrapper", "app shell", or "root layout"
- Adding responsive mobile navigation (hamburger menu, drawer)

## Quick Reference

| Task | Key Pattern |
|---|---|
| Root layout wrapper | `flex min-h-dvh flex-col` on outer div |
| Push footer to bottom | `flex-1` on `<main>` |
| Sticky header | `sticky top-0 z-50` on `<header>` |
| Mobile-first nav | `hidden md:flex` for desktop links, `md:hidden` for hamburger |
| Semantic landmarks | `<header>`, `<nav>`, `<main>`, `<footer>` |
| Touch targets | Minimum `h-11 w-11` (44px) on interactive elements |
| Layout file location | `src/components/layout/navbar.tsx` and `footer.tsx` |
| Root import point | `app/routes/__root.tsx` — the only file that imports layout components |

## Core Principles

1. **Single source of truth** — Navbar and Footer are defined in exactly one file each, imported only in the root layout. This eliminates duplication, guarantees consistency across every page, and means layout changes require editing only one file.

2. **Automatic inheritance** — Every page inherits the layout without any per-page configuration or imports. New routes get the navbar and footer for free, which prevents the common bug where a developer forgets to add navigation to a new page.

3. **Performance via single render** — Because the layout shell lives in the root route, React does not unmount and remount the Navbar and Footer during client-side navigation. Only the `<Outlet />` content swaps. This eliminates layout flicker and preserves component state (e.g., mobile menu open/closed, scroll position).

4. **Semantic structure** — Use `<header>`, `<nav>`, `<main>`, `<footer>` for accessibility and SEO. Screen readers expose these as landmark regions, letting users jump directly to the main content or navigation. Search engines also use landmarks to understand page structure.

5. **Footer pinning** — Use flexbox with `min-h-dvh` so the footer always sits at the bottom, even on short pages. Without this pattern, pages with little content leave the footer floating in the middle of the viewport.

## File Organization

```
src/components/layout/
├── navbar.tsx        # Standalone Navbar component
└── footer.tsx        # Standalone Footer component

app/routes/
└── __root.tsx        # Root layout — imports Navbar + Footer once
```

Place layout components in a `layout/` subdirectory under the project's existing components directory. This keeps them separate from feature components and makes the architecture self-documenting. Never place layout components in a route file or a shared `ui/` directory — they are infrastructure, not reusable UI primitives.

## Root Layout Integration

### TanStack Start / TanStack Router

The `__root.tsx` file is the root of all routes. It renders an `<Outlet />` that acts as the slot where child route components render. This is the only place Navbar and Footer should be imported.

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      {/* Head/meta/scripts — preserve any existing ones */}
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  )
}
```

**Why `min-h-dvh`**: The `dvh` unit (dynamic viewport height) accounts for mobile browser chrome (address bar, toolbar). Using `min-h-screen` causes content to be hidden behind the mobile browser UI on iOS Safari and Android Chrome. `min-h-dvh` ensures the layout fills exactly the visible area.

**Why `flex-1` on `<main>`**: In a flex column layout, `flex-1` makes the main content area expand to fill all available space. This pushes the Footer to the bottom of the viewport on pages with little content, while still allowing it to flow naturally below long content.

### Extending an Existing Root Layout

If `__root.tsx` already has providers, meta tags, error boundaries, or other wrappers, insert the Navbar/Footer inside the existing structure without replacing anything:

```tsx
// BEFORE (existing)
function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

// AFTER (extended)
function RootComponent() {
  return (
    <RootDocument>
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </RootDocument>
  )
}
```

Preserve `<RootDocument>`, `<Meta>`, `<Scripts>`, `<ScrollRestoration>`, and any context providers exactly as they are.

## Navbar Patterns

### Simple Navbar (Logo + Links)

```tsx
import { Link } from '@tanstack/react-router'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4" aria-label="Main navigation">
        <Link to="/" className="text-xl font-bold">
          Brand
        </Link>
        <ul className="flex items-center gap-6">
          <li><Link to="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">About</Link></li>
          <li><Link to="/features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</Link></li>
          <li><Link to="/contact" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Contact</Link></li>
        </ul>
      </nav>
    </header>
  )
}
```

### Navbar with Mobile Drawer

**Why mobile-first navigation**: Over 60% of web traffic comes from mobile devices. A mobile-first approach ensures touch-friendly targets and readable text on small screens by default, then progressively reveals the full desktop navigation at larger breakpoints. This is more reliable than trying to squeeze desktop nav into mobile after the fact.

```tsx
import { useState } from 'react'
import { Link } from '@tanstack/react-router'

const navLinks = [
  { to: '/about', label: 'About' },
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
] as const

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4" aria-label="Main navigation">
        <Link to="/" className="text-xl font-bold">
          Brand
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-md md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile drawer */}
      {isOpen && (
        <div id="mobile-menu" className="border-b md:hidden">
          <ul className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="block rounded-md px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
```

**Key details:**
- `h-11 w-11` on the hamburger button ensures touch targets >= 44px (WCAG 2.5.8)
- `aria-expanded` and `aria-controls` connect the button to the menu for screen readers
- `onClick={() => setIsOpen(false)}` on links closes the drawer after navigation
- Desktop links hidden with `hidden md:flex`, mobile button hidden with `md:hidden`
- `py-3` on mobile links ensures comfortable touch targets

### Sticky vs Fixed Header Positioning

| Pattern | Classes | Behavior |
|---|---|---|
| **Sticky** (recommended) | `sticky top-0 z-50` | Stays in normal flow, then pins to top on scroll. Content does not need padding offset. |
| **Fixed** | `fixed top-0 left-0 right-0 z-50` | Removed from flow entirely. Content needs `pt-16` (or the header height) to avoid being hidden behind it. |

**Prefer `sticky` over `fixed`** in nearly all cases. Sticky headers participate in the document flow, so they do not require manual padding offsets on the body or main content. Fixed headers require you to add top padding equal to the header height, which is fragile and breaks if the header height changes (e.g., on mobile with a taller nav).

Use `fixed` only when the header must remain visible even inside a scrollable sub-container (rare).

## Footer Patterns

### Simple Footer (Copyright + Links)

```tsx
import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Brand. All rights reserved.
        </p>
        <ul className="flex items-center gap-4">
          <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link></li>
          <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link></li>
        </ul>
      </div>
    </footer>
  )
}
```

### Multi-Column Footer

```tsx
import { Link } from '@tanstack/react-router'

const footerSections = [
  {
    title: 'Product',
    links: [
      { to: '/features', label: 'Features' },
      { to: '/pricing', label: 'Pricing' },
      { to: '/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About' },
      { to: '/blog', label: 'Blog' },
      { to: '/careers', label: 'Careers' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy' },
      { to: '/terms', label: 'Terms' },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/" className="text-xl font-bold">
              Brand
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              A short description of what this product does.
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Brand. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
```

**Grid behavior:**
- Mobile: 2 columns (link sections side by side)
- Tablet (`sm`): 3 columns
- Desktop (`lg`): 4 columns (brand + 3 link sections in a row)

**Why semantic `<footer>` matters**: The `<footer>` landmark tells assistive technology that this region contains site-wide metadata (copyright, legal links, contact info). Screen reader users can jump directly to it. Using a plain `<div>` would make this content invisible in landmark navigation.

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Layout shifts on navigation | Navbar/Footer unmounting and remounting per page | Move imports to `__root.tsx` so the layout shell persists across routes |
| Footer floating mid-page | Missing flex layout on wrapper | Add `flex min-h-dvh flex-col` on the outer div and `flex-1` on `<main>` |
| Navbar hidden behind content | `z-index` too low or not set | Use `z-50` on the `<header>` element |
| Content hidden behind fixed header | Fixed positioning removes header from flow | Switch to `sticky top-0` or add `pt-16` to `<main>` |
| Mobile address bar causes layout jump | Using `min-h-screen` (100vh) | Switch to `min-h-dvh` which respects dynamic viewport |
| Hydration mismatch on nav items | Rendering user-specific data (auth state, avatar) during SSR | Wrap dynamic nav content in a client-only boundary or use `useEffect` to set after mount |
| Mobile menu stays open after navigating | Not closing drawer on link click | Add `onClick={() => setIsOpen(false)}` to each mobile nav `<Link>` |
| Multiple "navigation" announcements in screen reader | Multiple `<nav>` elements without distinct labels | Add unique `aria-label` to each `<nav>` (e.g., "Main navigation", "Footer navigation") |

## Constraints

- **Root layout only**: Never import Navbar or Footer in individual route/page files. They belong exclusively in `__root.tsx`.
- **No absolute pixel heights**: Use Tailwind spacing scale (`h-16`, `h-14`) for header height, never raw `px` values. This keeps the design system consistent.
- **Semantic HTML required**: Always use `<header>`, `<nav>`, `<main>`, `<footer>` — never substitute with generic `<div>` elements for layout landmarks.
- **Touch target minimum**: All interactive elements in the navbar (links, buttons) must be at least 44px in both dimensions on mobile (use `h-11 w-11` or equivalent padding).
- **No layout-level data fetching**: The root layout should not fetch route-specific data. Keep data loading in route components. The layout shell is purely structural.
- **Preserve existing wrappers**: When adding navbar/footer to an existing root layout, never remove or replace existing providers, meta tags, or error boundaries.

## Verification Checklist

After implementing a global layout, verify:

- [ ] Navbar and Footer are imported only in `__root.tsx` — not in any route file
- [ ] Outer wrapper has `flex min-h-dvh flex-col` applied
- [ ] `<main>` has `flex-1` so footer pins to bottom on short pages
- [ ] Semantic elements used: `<header>`, `<nav>`, `<main>`, `<footer>`
- [ ] Each `<nav>` element has a unique `aria-label`
- [ ] Sticky header uses `sticky top-0 z-50` (not `fixed` unless justified)
- [ ] Mobile hamburger button has `aria-expanded`, `aria-controls`, and `aria-label`
- [ ] Mobile touch targets are at least 44px (h-11/w-11)
- [ ] Mobile drawer closes on link click
- [ ] Internal links use `<Link>` from TanStack Router, not `<a>` tags
- [ ] Footer renders correctly on pages with minimal content (no floating mid-page)
- [ ] Layout does not shift or flicker during client-side navigation
- [ ] No hydration warnings in browser console related to nav items

## References

- [TanStack Router — Root Route](https://tanstack.com/router/latest/docs/framework/react/guide/route-trees#the-root-route) — How `__root.tsx` and `<Outlet />` work
- [CSS `dvh` unit](https://developer.mozilla.org/en-US/docs/Web/CSS/length#dynamic_viewport_units) — Dynamic viewport height explained
- [WCAG 2.5.8 — Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — Minimum 44px touch target requirement
- [WAI-ARIA Landmarks](https://www.w3.org/WAI/ARIA/apd/landmark-roles/) — header, nav, main, contentinfo roles
- [Tailwind CSS — Flexbox](https://tailwindcss.com/docs/flex) — `flex-1` and flex column layout utilities
