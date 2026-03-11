# Setting Up react-grab in Your Vite + React Project

Here is how to set up react-grab so you can hover over components, see their file paths, and copy that information -- active only in development mode.

## 1. Install react-grab

```bash
npm install -D react-grab
```

Installing as a dev dependency keeps it out of your production dependency manifest.

## 2. Add a dev-only import

You have a couple of options for loading react-grab only in dev mode with Vite:

### Option A: In `index.html`

Add a script tag in your `index.html` before `</head>`:

```html
<script type="module">
  if (import.meta.env.DEV) {
    import("react-grab");
  }
</script>
```

### Option B: In your entry file (`src/main.tsx`)

```tsx
if (import.meta.env.DEV) {
  import("react-grab");
}
```

Vite replaces `import.meta.env.DEV` with a boolean at build time, so the import will be tree-shaken out of production builds.

## 3. Start your dev server

```bash
npm run dev
```

Once the app is loaded in the browser, hover over any element. You should see react-grab's overlay highlighting the component. Press Cmd+C (Mac) or Ctrl+C (Windows/Linux) to copy the component info -- including the component name and its source file path -- to your clipboard.

## 4. Confirm it is excluded from production

Run a production build:

```bash
npm run build
```

Inspect the output in `dist/` to verify that no references to react-grab are present. Since the import is gated behind `import.meta.env.DEV`, Vite's build process will eliminate it entirely.

## Notes

- react-grab works by inspecting React's internal fiber tree, so it requires a development build of React (which Vite serves by default in dev mode).
- If you run into issues where component names show as "Anonymous", make sure your components are defined with named functions or named variable assignments.
- Some versions of react-grab may provide a CDN script option as well (e.g., via unpkg), which you could conditionally load in `index.html` instead of installing via npm.
