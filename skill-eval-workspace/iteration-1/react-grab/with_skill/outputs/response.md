# Setting Up react-grab in Your Vite + React Project

Here is how to get react-grab running in dev mode only on your freshly scaffolded Vite + React project.

## 1. Install react-grab as a dev dependency

```bash
npm install -D react-grab
```

Installing it under `devDependencies` makes the intent clear and prevents accidental inclusion in production dependency lists.

## 2. Add the dev-only import in `index.html`

Open your `index.html` (at the project root) and add the following script block before the closing `</head>` tag:

```html
<script type="module">
  if (import.meta.env.DEV) {
    import("react-grab");
  }
</script>
```

Vite statically replaces `import.meta.env.DEV` at build time. In development it evaluates to `true` and the dynamic import loads react-grab. In production builds the entire `if` block is eliminated via dead-code elimination, so react-grab never reaches your production bundle.

## 3. Start your dev server

```bash
npm run dev
```

Once the app is running in the browser:

- **Hover** over any UI element -- you will see a react-grab overlay/highlight appear.
- **Press Cmd+C** (Mac) or **Ctrl+C** (Windows/Linux) while hovering to copy the element's context to your clipboard.

The copied text looks like this:

```
<button class="btn-primary" type="submit">
  Submit
</button>
in App at src/App.tsx:12:5
```

It includes the HTML source, the React component name, and the file path with line and column number -- exactly what an AI coding agent needs to locate and edit the right file.

## 4. Inspect transient/ephemeral UI states

react-grab includes a **page freeze** feature. When activated, it:

- Halts React state updates (components stop re-rendering)
- Pauses CSS animations and transitions
- Pauses JavaScript-driven animations (requestAnimationFrame)
- Preserves the current DOM state exactly as-is

This lets you hover-inspect tooltips, dropdown menus, focus rings, or animation mid-frames that would normally vanish the moment you move your cursor.

## 5. Temporarily disable react-grab

If react-grab's overlay interferes with something you are testing, you can disable it at runtime without removing the import. Add this to a script tag or run it in the browser console:

```js
window.__REACT_GRAB_DISABLED__ = true;
```

This restores native Cmd+C / Ctrl+C copy behavior.

## 6. Verify production safety

After building for production, confirm react-grab is absent:

```bash
npm run build
```

Search the `dist/` output for any trace of `react-grab`. You should find none. Vite's dead-code elimination guarantees the dev-only `import("react-grab")` is stripped when `import.meta.env.DEV` is `false`.

## Verification Checklist

- [ ] react-grab is listed in `devDependencies` in `package.json`
- [ ] The `index.html` script uses `import.meta.env.DEV` to gate loading
- [ ] Dev server starts without errors related to react-grab
- [ ] Hovering over a UI element shows the react-grab overlay/highlight
- [ ] Pressing Cmd+C (Mac) or Ctrl+C (Windows) copies component context to clipboard
- [ ] Copied text includes component name, file path with line number, and HTML source
- [ ] Page freeze works on transient elements (tooltips, dropdowns)
- [ ] Production build does NOT include react-grab (verify with bundle analysis or search built output)

## Requirements

- **React 17+** -- react-grab depends on the `_debugSource` fiber property which is only stable in React 17 and later.
- **Browser-only** -- react-grab uses DOM APIs and the React fiber tree, so it only runs in the browser, not during SSR.
- **Single instance** -- Only one react-grab instance should run per page. Multiple instances conflict on the copy shortcut and overlay rendering.
