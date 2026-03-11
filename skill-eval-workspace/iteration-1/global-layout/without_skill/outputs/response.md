# Adding a Layout to Your TanStack Start Project

TanStack Start uses file-based routing built on TanStack Router. To get a shared layout across all routes, you need to modify the root route file and create layout components.

## 1. Create a Navbar Component

Create a file at `src/components/navbar.tsx`:

```tsx
import { Link } from '@tanstack/react-router'

export function Navbar() {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
      <nav style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '64px' }}>
        <Link to="/" style={{ fontSize: '20px', fontWeight: 'bold', textDecoration: 'none', color: '#111' }}>
          Logo
        </Link>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link to="/about" style={{ textDecoration: 'none', color: '#555' }}>About</Link>
          <Link to="/features" style={{ textDecoration: 'none', color: '#555' }}>Features</Link>
          <Link to="/pricing" style={{ textDecoration: 'none', color: '#555' }}>Pricing</Link>
          <Link to="/contact" style={{ textDecoration: 'none', color: '#555' }}>Contact</Link>
        </div>
      </nav>
    </header>
  )
}
```

## 2. Create a Footer Component

Create a file at `src/components/footer.tsx`:

```tsx
import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #e5e7eb', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '14px', color: '#666' }}>
          &copy; {new Date().getFullYear()} Your Company. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/privacy" style={{ fontSize: '14px', color: '#666', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/terms" style={{ fontSize: '14px', color: '#666', textDecoration: 'none' }}>Terms</Link>
        </div>
      </div>
    </footer>
  )
}
```

## 3. Update Your Root Route

In TanStack Start, the root route is typically at `app/routes/__root.tsx`. This is where you wrap all child routes with your layout. Open it and modify it to include the Navbar and Footer:

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Navbar } from '../components/navbar'
import { Footer } from '../components/footer'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
```

The `<Outlet />` component renders whatever child route is active. Since the Navbar and Footer sit outside the Outlet, they will persist across all page navigations without being re-rendered.

## How It Works

- `__root.tsx` is the root of all routes in TanStack Router. Every route renders as a child inside this component's `<Outlet />`.
- The `minHeight: '100vh'` with `display: flex` and `flexDirection: column` ensures the layout takes at least the full viewport height.
- `flex: 1` on the `<main>` element makes it grow to fill available space, pushing the footer to the bottom even on short pages.
- The navbar uses `position: sticky` with `top: 0` so it stays visible as the user scrolls.

## Making the Links Work

You will need to create route files for each of these pages if they do not exist yet:

- `app/routes/about.tsx`
- `app/routes/features.tsx`
- `app/routes/pricing.tsx`
- `app/routes/contact.tsx`
- `app/routes/privacy.tsx`
- `app/routes/terms.tsx`

Each one just needs a basic route export:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div>
      <h1>About</h1>
    </div>
  )
}
```

That should give you a working layout that wraps all your routes automatically.
