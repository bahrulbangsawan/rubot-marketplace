---
name: react-grab
version: 1.1.0
description: |
  AI-assisted element inspection for React apps using react-grab. Hover over any UI element and press Cmd+C to copy component name, file path, and HTML source to clipboard so AI coding agents know which file to edit. ACTIVATE THIS SKILL when the user wants to: identify which .tsx file renders a specific UI element, hover-inspect components, point at UI to get component file path, set up react-grab, install element inspector, configure MCP bridge for react-grab, freeze page state to inspect tooltips or hover states, fix "Anonymous" component names, fix "unknown" file paths after HMR/hot module reload, disable the react-grab overlay, or use import.meta.env.DEV conditional loading.

  Also trigger for: "which file renders this", "find component file", "element picker", "copy component context", "locate this component", "grab element info", "hover to copy", "where is this component", window.__REACT_GRAB__ flag.

  DO NOT trigger for: Chrome DevTools inspection, React DevTools Profiler, Playwright/testing, drag-and-drop, clipboard hooks, or general DOM debugging unrelated to react-grab.
agents:
  - qa-tester
  - shadcn-ui-designer
---

# react-grab Skill

> Point at any React element, press Cmd+C / Ctrl+C, and copy the component name, file path, and HTML source for AI agents.

## When to Use

- Selecting UI elements to provide context to AI coding agents
- Finding which file and line number renders a specific element
- Copying component HTML and structure for debugging or refactoring
- Freezing transient UI states (hover menus, tooltips, dropdowns) for inspection
- Locating the source file for a visual element without manually searching the codebase
- Providing precise element context to AI agents via MCP integration
- Debugging layout or styling issues by identifying the exact component responsible
- Onboarding onto an unfamiliar React codebase by exploring the component tree visually

## Quick Reference

| Feature | Description |
|---------|-------------|
| **Copy shortcut** | Cmd+C (Mac) / Ctrl+C (Windows/Linux) while hovering |
| **Output format** | HTML source + component name + file path with line number |
| **Page freeze** | Halts React updates, CSS/JS animations, preserves pseudo-states |
| **Dev-only** | Automatically stripped from production via NODE_ENV check |
| **Frameworks** | Next.js (App/Pages Router), Vite, Webpack, TanStack Start |
| **MCP bridge** | Optional direct AI agent communication channel |
| **Disable flag** | `window.__REACT_GRAB_DISABLED__ = true` |

## Core Principles

1. **Dev-only by design**: react-grab must never reach production bundles. All integration patterns use environment checks (`NODE_ENV`, `import.meta.env.DEV`) to ensure tree-shaking removes it entirely. This matters because shipping it to production adds unnecessary bundle weight and exposes internal component paths, which is a security concern.

2. **Zero-config element context**: Unlike browser DevTools which show raw DOM, react-grab resolves the React component name and exact source file location (with line number). This is critical for AI agents because they need file paths to make edits, not just DOM selectors.

3. **Freeze-to-inspect**: Transient UI states (tooltips, hover menus, focus rings, animation mid-frames) disappear the moment you move your cursor. Page freezing halts React re-renders and CSS/JS animations so these states can be captured and copied. Without this, inspecting ephemeral UI is nearly impossible.

4. **Fiber tree traversal**: react-grab works by walking React's internal fiber tree from any DOM node upward to find the nearest user-defined component. This is why it requires React 17+ (the fiber architecture was stabilized in React 16, but source location metadata improved in 17+).

## How It Works

When you hover over a DOM element and press the copy shortcut, react-grab performs these steps:

1. **Identifies the DOM node** under the cursor using the browser's hit-testing API
2. **Locates the React fiber** attached to that DOM node via React's internal `__reactFiber$` property
3. **Walks up the fiber tree** to find the nearest user-defined component (skipping built-in elements like `div`, `span`)
4. **Extracts metadata** — component name, source file path, line number, and column from the fiber's `_debugSource` property
5. **Serializes the HTML** of the selected element's outer HTML
6. **Copies to clipboard** in a structured format that AI agents can parse

The `_debugSource` property is injected by React's JSX transform during development builds, which is another reason react-grab only works in development mode.

## Copied Output Format

When an element is selected, react-grab copies text like:

```
<a class="ml-auto inline-block text-sm" href="#">
  Forgot your password?
</a>
in LoginForm at components/login-form.tsx:46:19
```

This gives AI agents three essential pieces of information: the exact HTML to match, the component name for context, and the file path with line/column to open and edit directly.

## Framework Integration

### Next.js (App Router)

In `app/layout.tsx`, add inside `<head>`:

```tsx
import Script from "next/script";

{process.env.NODE_ENV === "development" && (
  <Script
    src="//unpkg.com/react-grab/dist/index.global.js"
    crossOrigin="anonymous"
    strategy="beforeInteractive"
  />
)}
```

The `beforeInteractive` strategy ensures react-grab loads before hydration, so it can attach to the fiber tree as components mount.

### Next.js (Pages Router)

In `pages/_document.tsx`, add the same `<Script>` tag inside the `<Head>` component. The pattern is identical to App Router.

### Vite

In `index.html`, add before `</head>`:

```html
<script type="module">
  if (import.meta.env.DEV) {
    import("react-grab");
  }
</script>
```

Vite's `import.meta.env.DEV` is statically replaced at build time, so the entire import is eliminated from production builds via dead-code elimination.

### TanStack Start

In `app/root.tsx` (or your root route file), add a client-side effect:

```tsx
import { createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  // Load react-grab in development only
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    import("react-grab");
  }

  return (
    // your root layout
  );
}
```

The `typeof window` guard prevents the import from executing during SSR, since react-grab is browser-only.

### Webpack / Generic

In the main entry file (e.g., `src/index.tsx`):

```tsx
if (process.env.NODE_ENV === "development") {
  import("react-grab");
}
```

Webpack replaces `process.env.NODE_ENV` at compile time via DefinePlugin, so the dynamic import is removed from production bundles entirely.

## Page Freezing

react-grab can freeze the page to inspect elements that are normally transient (tooltips, dropdowns, hover states). The freeze:

- Halts React state updates so components stop re-rendering
- Pauses CSS animations and transitions
- Pauses JavaScript-driven animations (requestAnimationFrame)
- Preserves the current DOM state exactly as it appears

This is essential for inspecting UI that only appears during specific interaction states. Without freezing, moving the cursor to inspect a tooltip would cause the tooltip to disappear.

## Disabling react-grab

To temporarily disable without removing from the codebase:

```html
<script>
  window.__REACT_GRAB_DISABLED__ = true;
</script>
```

This is useful when react-grab's overlay interferes with testing other interactions, or when you need native Cmd+C copy behavior temporarily.

## Installation

Use `/rubot-setup-react-grab` to install and configure react-grab. Use `/rubot-setup-react-grab-mcp` to add MCP integration for direct AI agent communication.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| No overlay on hover | react-grab not loaded or disabled | Check that the dev-only import is present and `__REACT_GRAB_DISABLED__` is not set. Verify dev server is running in development mode. |
| "Component" shows as `Anonymous` | Component is not named (arrow function without variable name) | Use named function components or ensure the variable name is preserved by the bundler. |
| File path shows as `unknown` | `_debugSource` not present in fiber | Ensure you are running a development build. Production builds strip `_debugSource`. Check that your JSX transform is not a custom one that omits source info. |
| Conflicts with browser DevTools | Both tools try to intercept hover/click | Close the browser DevTools Elements panel before using react-grab, or use the freeze feature first. |
| Not working after hot reload | Fiber references may become stale | Refresh the page fully (Cmd+Shift+R) to re-attach fiber references. |
| Cmd+C copies text instead of element | Cursor is over a text selection, not hovering an element | Clear any text selection first. react-grab only activates when hovering, not when text is selected. |
| SSR hydration warning | react-grab script loaded during SSR | Add a `typeof window !== "undefined"` guard before the import. react-grab must only run in the browser. |

## Constraints

- **Dev-only** — Never include in production bundles. Exposing component file paths in production leaks internal project structure and increases bundle size with zero user benefit.
- **React 17+** — Requires React 17.0.0 or later as a peer dependency. Earlier versions lack the stable `_debugSource` metadata on fibers that react-grab depends on.
- **Browser-only** — Runs exclusively in the browser, not during SSR or server-side rendering. The fiber tree and DOM APIs it relies on do not exist on the server.
- **Single instance** — Only one react-grab instance should run per page. Multiple instances will conflict on the copy shortcut and overlay rendering.
- **Development builds only** — The `_debugSource` fiber property only exists in development builds. Even if react-grab loads in production, it cannot resolve file paths because React strips that metadata.

## Verification Checklist

- [ ] react-grab is installed as a dev dependency (`devDependencies` in package.json)
- [ ] Integration code uses an environment check (`NODE_ENV` or `import.meta.env.DEV`) to gate loading
- [ ] Dev server starts without errors related to react-grab
- [ ] Hovering over a UI element shows the react-grab overlay/highlight
- [ ] Pressing Cmd+C (Mac) or Ctrl+C (Windows) copies component context to clipboard
- [ ] Copied text includes component name, file path with line number, and HTML source
- [ ] Page freeze works on transient elements (tooltips, dropdowns)
- [ ] Production build does NOT include react-grab (verify with bundle analysis or search built output)

## References

- [react-grab npm package](https://www.npmjs.com/package/react-grab)
- [react-grab GitHub repository](https://github.com/nicholasgriffintn/react-grab)
