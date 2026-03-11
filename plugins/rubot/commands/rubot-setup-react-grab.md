---
name: rubot-setup-react-grab
description: Install and configure react-grab for AI-assisted element inspection
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

You are installing react-grab, a development tool that lets users hover over any React UI element and press ⌘C (Mac) or Ctrl+C (Windows/Linux) to copy the component name, file location, and HTML source — providing rich context for AI coding agents.

## Prerequisites Check

Before starting, verify the environment:

```bash
# Check for a React project
cat package.json 2>/dev/null | grep -E '"react"' | head -1

# Check package manager
bun --version 2>/dev/null || npm --version 2>/dev/null
```

If no React dependency is found in package.json, inform the user that react-grab requires a React project and stop.

## Setup Process

### Step 1: Detect Framework

Determine the project's framework to choose the correct integration method:

```bash
# Check for Next.js
cat package.json 2>/dev/null | grep -E '"next"' | head -1

# Check for Vite
ls vite.config.* 2>/dev/null

# Check for Webpack
ls webpack.config.* 2>/dev/null

# Check for Next.js App Router vs Pages Router
ls app/layout.tsx app/layout.jsx 2>/dev/null
ls pages/_document.tsx pages/_document.jsx 2>/dev/null
```

### Step 2: Choose Installation Method

Use AskUserQuestion to confirm the approach:

```
AskUserQuestion({
  questions: [{
    question: "How would you like to install react-grab?",
    header: "Installation Method",
    options: [
      { label: "Automatic (Recommended)", description: "Run npx grab init — detects framework and configures automatically" },
      { label: "Manual", description: "Install the package and configure the framework entry point yourself" }
    ],
    multiSelect: false
  }]
})
```

### Step 3a: Automatic Installation

If the user chose automatic:

```bash
npx -y grab@latest init
```

Verify the installation succeeded by checking for changes:

```bash
git diff --stat
```

Skip to Step 5.

### Step 3b: Manual Installation

If the user chose manual, install the package:

```bash
# Prefer bun if available, otherwise npm
bun add -d react-grab 2>/dev/null || npm install --save-dev react-grab
```

### Step 4: Configure Framework Entry Point (Manual only)

Based on the detected framework from Step 1:

**Next.js (App Router)** — Edit `app/layout.tsx`:

Add the Script import and tag inside `<head>`:

```tsx
import Script from "next/script";

// Inside the <html> tag, add to <head>:
{process.env.NODE_ENV === "development" && (
  <Script
    src="//unpkg.com/react-grab/dist/index.global.js"
    crossOrigin="anonymous"
    strategy="beforeInteractive"
  />
)}
```

**Next.js (Pages Router)** — Edit `pages/_document.tsx`:

Add the same Script tag inside the `<Head>` component.

**Vite** — Edit `index.html`:

Add before the closing `</head>` tag:

```html
<script type="module">
  if (import.meta.env.DEV) {
    import("react-grab");
  }
</script>
```

**Webpack / Other** — Edit the main entry file (e.g., `src/index.tsx` or `src/main.tsx`):

```tsx
if (process.env.NODE_ENV === "development") {
  import("react-grab");
}
```

### Step 5: Verify Installation

Start the dev server and confirm react-grab loads:

```bash
# Check the package was added
cat package.json | grep "react-grab"
```

## Completion Summary

After successful setup, report:

1. **What was installed**: react-grab (dev-only, zero production overhead)
2. **How to use it**:
   - Start your dev server (`bun run dev`)
   - Hover over any UI element
   - Press **⌘C** (Mac) or **Ctrl+C** (Windows/Linux) to copy element context
3. **What gets copied**: Component name, file path with line number, and HTML source
4. **Next steps**:
   - Use `/rubot-setup-react-grab-mcp` to add MCP integration for direct agent communication
   - The tool is dev-only — it automatically disables in production builds

## Error Handling

If any step fails:

1. **npx grab init fails**: Fall back to manual installation (Step 3b)
2. **Package install fails**: Check network connection, try clearing cache with `bun pm cache rm` or `npm cache clean --force`
3. **Framework not detected**: Ask the user which framework they're using with AskUserQuestion
4. **Dev server doesn't show overlay**: Verify the entry point was modified correctly and that NODE_ENV is "development"
