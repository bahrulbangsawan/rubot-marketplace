# TanStack Start — Cloudflare Workers Setup

This is the complete setup guide for deploying a TanStack Start (React) SSR application to Cloudflare Workers. Follow every step sequentially without asking the user questions.

## Prerequisites

Before starting, you should have already determined (from SKILL.md Step 1):

- **Project name**: from `package.json` `name` field — used as the Worker name in `wrangler.jsonc`
- **Today's date**: in `YYYY-MM-DD` format — used as `compatibility_date`
- **Existing `vite.config.ts` contents**: you'll merge the Cloudflare plugin into it, preserving existing plugins
- **Package manager**: detected from lock files (default: bun)
- **App directory**: typically `apps/web/` in a monorepo, or root for single-app projects

---

## 1. Install Dependencies

At the **app level** (e.g., `apps/web/`):

```bash
<pkg> add -D @cloudflare/vite-plugin wrangler
```

At the **monorepo root** (if applicable):

```bash
<pkg> add -D @cloudflare/workers-types
```

---

## 2. Create `wrangler.jsonc`

Create this file at the app root (e.g., `apps/web/wrangler.jsonc`):

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "<PROJECT_NAME>",
  "compatibility_date": "<TODAY_YYYY-MM-DD>",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
  "observability": {
    "enabled": true
  }
}
```

Replace `<PROJECT_NAME>` with the derived project name (lowercase, hyphenated).

### Field Semantics

| Field | Purpose |
|-------|---------|
| `name` | Worker name. Deploys to `<name>.<subdomain>.workers.dev` |
| `compatibility_date` | Pins Workers runtime behavior to this date |
| `compatibility_flags: ["nodejs_compat"]` | Enables Node.js built-ins (`crypto`, `stream`, `buffer`, etc.) |
| `main` | Virtual module resolved by `@cloudflare/vite-plugin` at build time. Do not change this value. |
| `observability.enabled` | Activates real-time logs and analytics in the Cloudflare dashboard |

---

## 3. Configure `vite.config.ts`

Read the existing `vite.config.ts`. Merge the Cloudflare plugin into it. The Cloudflare plugin **must be the first plugin** in the array. The `viteEnvironment` option must specify `{ name: "ssr" }` for TanStack Start.

### Target Structure

```typescript
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  server: {
    port: 3001,
  },
});
```

### Merge Rules

- `cloudflare()` goes **first** in the plugins array
- Preserve all existing plugins — append them after Cloudflare
- Preserve all existing config (server settings, resolve aliases, etc.)
- Only add imports that are new (`@cloudflare/vite-plugin`)
- If TailwindCSS Vite plugin is present, keep it. If not, don't add it.
- If `tsconfigPaths` is present, keep it. If not, don't add it.
- The `server.port` is only an example — preserve the existing port if one is set

---

## 4. Add Scripts to `package.json`

Ensure these scripts exist in the app-level `package.json` (merge, don't overwrite):

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "serve": "vite preview",
    "deploy": "wrangler deploy"
  }
}
```

If any of these scripts already exist with different values, prefer the Vite-based commands for `dev`, `build`, and `serve` since TanStack Start uses Vite as its build tool. Add `deploy` if it doesn't exist.

---

## 5. Build and Verify

Run the build:

```bash
cd <app-directory>
<pkg-run> build
```

### Expected Output Structure

```
<app-directory>/dist/
├── client/              ← Static assets (served by Workers Static Assets)
│   ├── assets/
│   │   ├── *.js         (code-split route bundles)
│   │   └── *.css        (Tailwind output, if used)
│   └── manifest.json
└── server/
    ├── index.js          ← The Worker script (SSR entry)
    └── wrangler.json     ← Auto-generated deployment config
```

The auto-generated `dist/server/wrangler.json` merges your `wrangler.jsonc` with build outputs:

- `main` is rewritten to `index.js`
- `assets.directory` is set to `../client`
- `no_bundle: true` (Vite already bundled everything)

### Troubleshooting

| Issue | Fix |
|-------|-----|
| `Node.js built-in module not found` | Ensure `"compatibility_flags": ["nodejs_compat"]` in `wrangler.jsonc` |
| Static assets 404 | Verify `vite build` completed and `dist/client/` exists |
| Worker size limit exceeded (3 MB) | Enable code splitting in Vite, lazy-load heavy deps |
| `compatibility_date` errors | Update to a recent date |
| Local dev differs from production | Use `vite preview` for full Workers runtime locally |
| Plugin order error | `cloudflare()` must be the first plugin in the plugins array |
| SSR environment not found | Ensure `viteEnvironment: { name: "ssr" }` is passed to `cloudflare()` |
