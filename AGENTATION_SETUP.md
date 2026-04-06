# How to Install Agentation

Visual feedback toolbar for development — shows a floating toolbar in your app during `dev` mode only.

## 1. Install the package

```bash
bun add -d agentation
```

> For npm/pnpm/yarn:
>
> ```bash
> npm install -D agentation
> pnpm add -D agentation
> yarn add -D agentation
> ```

## 2. Add to your root layout

In your root layout file (e.g. `__root.tsx` for TanStack Start, or `layout.tsx` for Next.js), add the lazy-loaded component:

### TanStack Start / TanStack Router

```tsx
// src/routes/__root.tsx
import { lazy, Suspense } from "react"

// Lazy-load to avoid bundling in production
const LazyAgentation = lazy(() =>
  import("agentation").then((mod) => ({ default: mod.Agentation }))
)

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        {/* Only render in development */}
        {import.meta.env.DEV && (
          <Suspense>
            <LazyAgentation />
          </Suspense>
        )}
      </body>
    </html>
  )
}
```

### Next.js (App Router)

```tsx
// app/layout.tsx
import { lazy, Suspense } from "react"

const LazyAgentation = lazy(() =>
  import("agentation").then((mod) => ({ default: mod.Agentation }))
)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV === "development" && (
          <Suspense>
            <LazyAgentation />
          </Suspense>
        )}
      </body>
    </html>
  )
}
```

### Vite (plain React)

```tsx
// src/main.tsx or src/App.tsx
import { lazy, Suspense } from "react"

const LazyAgentation = lazy(() =>
  import("agentation").then((mod) => ({ default: mod.Agentation }))
)

function App() {
  return (
    <>
      {/* Your app content */}
      {import.meta.env.DEV && (
        <Suspense>
          <LazyAgentation />
        </Suspense>
      )}
    </>
  )
}
```

## Key points

- **Dev-only** — Always gate behind `import.meta.env.DEV` (Vite) or `process.env.NODE_ENV === "development"` (Next.js) so it never ships to production.
- **Lazy-loaded** — Use `React.lazy()` + `<Suspense>` so it doesn't add to your main bundle, even in dev.
- **Placement** — Render it at the end of `<body>`, after `<Scripts />` and your main content.
- **Named export** — The package exports `Agentation` as a named export, so use `.then((mod) => ({ default: mod.Agentation }))` in the dynamic import.

That's it. Run `bun dev` and you'll see the Agentation toolbar in your browser.
