# Adding a Global Layout to Your TanStack Start Project

Your project is missing a root layout shell. In TanStack Start, the `__root.tsx` file is where you define UI that persists across every route. You need to create a Navbar and Footer component, then import them exclusively in `__root.tsx` so every route inherits the layout automatically through the `<Outlet />` mechanism.

Here is the full plan and implementation.

---

## 1. Create the Navbar Component

Create the file `src/components/layout/navbar.tsx`:

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

Key details on the navbar:

- **Sticky positioning** with `sticky top-0 z-50` -- this keeps the header pinned to the top on scroll while staying in normal document flow. Unlike `fixed`, you do not need to add padding offsets to the content below it.
- **Backdrop blur** with `bg-background/95 backdrop-blur` gives a frosted-glass effect so content scrolling underneath is subtly visible.
- **Mobile-first responsive nav**: Desktop links are hidden on small screens (`hidden md:flex`), and the hamburger button is hidden on desktop (`md:hidden`). The mobile drawer closes on link click via `onClick={() => setIsOpen(false)}`.
- **Touch targets**: The hamburger button uses `h-11 w-11` (44px) to meet WCAG 2.5.8 minimum touch target size. Mobile links use `py-3` for comfortable tap areas.
- **Accessibility**: `aria-expanded`, `aria-controls`, and `aria-label` on the hamburger button allow screen readers to understand the menu state.

---

## 2. Create the Footer Component

Create the file `src/components/layout/footer.tsx`:

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

The footer uses a semantic `<footer>` element so screen readers can announce it as a landmark region. The layout is responsive: stacked on mobile (`flex-col`), side-by-side on tablet and up (`sm:flex-row`).

---

## 3. Wire Everything into `__root.tsx`

Open your `app/routes/__root.tsx` file. If your project already has a `RootDocument` wrapper or providers, preserve them and insert the layout shell inside. If it is a fresh scaffold, it will look something like this:

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
      {/* Preserve any existing <Meta>, <Scripts>, <ScrollRestoration>, etc. */}
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

If you already have a `RootDocument` wrapper, keep it and nest the layout inside:

```tsx
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

**Why this works for all routes automatically**: TanStack Router renders every route as a child of `__root.tsx` via the `<Outlet />` slot. The Navbar and Footer sit outside the Outlet, so they persist across all navigation. New routes you add in the future will automatically get the navbar and footer without any per-page imports. React does not unmount/remount the layout shell during client-side navigation, which eliminates layout flicker and preserves component state (e.g., mobile menu open/closed).

**Why `min-h-dvh` instead of `min-h-screen`**: The `dvh` (dynamic viewport height) unit accounts for mobile browser chrome like the address bar and toolbar. Using `min-h-screen` (which maps to `100vh`) causes content to be hidden behind the mobile browser UI on iOS Safari and Android Chrome. `min-h-dvh` ensures the layout fills exactly the visible area.

**Why `flex-1` on `<main>`**: In the flex column layout, `flex-1` makes the main content area expand to fill all remaining space. This pushes the footer to the bottom of the viewport even on pages with very little content.

---

## File Structure Summary

```
src/components/layout/
  navbar.tsx        # Sticky navbar with logo + 4 links + mobile drawer
  footer.tsx        # Copyright + Privacy/Terms links

app/routes/
  __root.tsx        # Root layout -- the ONLY file that imports Navbar and Footer
```

---

## Verification Checklist

After implementing, confirm:

- [ ] Navbar and Footer are imported only in `__root.tsx` -- not in any route file
- [ ] Outer wrapper has `flex min-h-dvh flex-col`
- [ ] `<main>` has `flex-1` so footer pins to bottom on short pages
- [ ] Semantic elements used: `<header>`, `<nav>`, `<main>`, `<footer>`
- [ ] `<nav>` has `aria-label="Main navigation"`
- [ ] Sticky header uses `sticky top-0 z-50`
- [ ] Mobile hamburger has `aria-expanded`, `aria-controls`, and `aria-label`
- [ ] Mobile touch targets are at least 44px (`h-11`/`w-11`)
- [ ] Mobile drawer closes on link click
- [ ] All internal links use `<Link>` from TanStack Router, not `<a>` tags
- [ ] Footer renders correctly on pages with minimal content (not floating mid-page)
- [ ] No layout shift or flicker during client-side navigation

Replace `"Brand"` with your actual logo or site name, and you are done. Every current and future route will automatically inherit the navbar and footer.
