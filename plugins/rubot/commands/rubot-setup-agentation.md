---
name: rubot-setup-agentation
description: Add Agentation visual feedback toolbar to a React project (dev-only)
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

You are installing Agentation, a visual feedback toolbar that appears in your app during development only.

## Prerequisites Check

Before starting, verify the environment:

```bash
# Check for a React project
cat package.json 2>/dev/null | grep -E '"react"' | head -1

# Check package manager
bun --version 2>/dev/null || npm --version 2>/dev/null
```

If no React dependency is found in package.json, inform the user that Agentation requires a React project and stop.

## Setup Process

### Step 1: Detect Framework

Determine the project's framework to choose the correct integration:

```bash
# Check for TanStack Start / TanStack Router
cat package.json 2>/dev/null | grep -E '"@tanstack/(start|react-router)"' | head -2

# Check for Next.js (App Router)
ls app/layout.tsx app/layout.jsx 2>/dev/null

# Check for Vite (plain React)
ls vite.config.* 2>/dev/null
```

Also locate the root layout file:

- **TanStack Start / TanStack Router**: `src/routes/__root.tsx`
- **Next.js (App Router)**: `app/layout.tsx`
- **Vite (plain React)**: `src/main.tsx` or `src/App.tsx`

If unsure, use AskUserQuestion to ask the user which framework they're using.

### Step 2: Install the Package

```bash
# Prefer bun if available, otherwise fall back
bun add -d agentation 2>/dev/null || npm install -D agentation
```

### Step 3: Add to Root Layout

Read the detected root layout file first, then edit it to add the lazy-loaded Agentation component.

**Add the lazy import near the top of the file** (after existing React imports):

```tsx
import { lazy, Suspense } from "react"

const LazyAgentation = lazy(() =>
  import("agentation").then((mod) => ({ default: mod.Agentation }))
)
```

If `lazy` and `Suspense` are already imported from React, do not duplicate the import — just add the `LazyAgentation` const.

**Add the component at the end of `<body>`**, after `{children}` and `<Scripts />`:

**TanStack Start / TanStack Router** (`src/routes/__root.tsx`):

```tsx
{import.meta.env.DEV && (
  <Suspense>
    <LazyAgentation />
  </Suspense>
)}
```

Place it inside `<body>`, after `<Scripts />` and before the closing `</body>`.

**Next.js App Router** (`app/layout.tsx`):

```tsx
{process.env.NODE_ENV === "development" && (
  <Suspense>
    <LazyAgentation />
  </Suspense>
)}
```

Place it inside `<body>`, after `{children}` and before the closing `</body>`.

**Vite plain React** (`src/main.tsx` or `src/App.tsx`):

```tsx
{import.meta.env.DEV && (
  <Suspense>
    <LazyAgentation />
  </Suspense>
)}
```

Place it inside the main return JSX, after the app content.

### Step 4: Verify Installation

```bash
# Confirm the package was added
cat package.json | grep "agentation"

# Confirm the root layout was modified
grep -n "LazyAgentation" src/routes/__root.tsx app/layout.tsx src/main.tsx src/App.tsx 2>/dev/null
```

## Completion Summary

After successful setup, report:

1. **What was installed**: `agentation` (dev dependency only, zero production overhead)
2. **How it works**:
   - Lazy-loaded via `React.lazy()` + `<Suspense>` so it adds nothing to your main bundle
   - Gated behind `import.meta.env.DEV` or `process.env.NODE_ENV === "development"` so it never ships to production
   - Renders at the end of `<body>` after all main content
3. **How to use it**: Run `bun dev` (or your dev command) and the Agentation toolbar will appear in your browser
4. **Named export note**: The package exports `Agentation` as a named export, which is why the dynamic import uses `.then((mod) => ({ default: mod.Agentation }))`

## Error Handling

If any step fails:

1. **Package install fails**: Check network connection, try `bun pm cache rm` or `npm cache clean --force`
2. **Root layout file not found**: Ask the user for the path to their root layout file using AskUserQuestion
3. **`lazy` or `Suspense` import conflicts**: Merge with existing React imports instead of adding a duplicate import line
4. **Toolbar doesn't appear**: Verify the dev gate (`import.meta.env.DEV` or `process.env.NODE_ENV`) is correct for the framework, and that the component is placed inside `<body>`
