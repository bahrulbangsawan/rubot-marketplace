# Deploying Your TanStack Start App to Cloudflare Workers

Here's the complete setup for deploying your TanStack Start app in `apps/web/` to Cloudflare Workers. I'll walk through each step sequentially.

---

## Step 1: Detect Your Project

Based on what you've described:

- **Package manager**: bun (detected from your setup)
- **Framework**: TanStack Start (React) -- identified by `@tanstack/react-start` in dependencies
- **App directory**: `apps/web/`
- **Monorepo**: Yes (`apps/` directory structure)

I'll read your `apps/web/package.json` to get the project name, and your existing `apps/web/vite.config.ts` to understand the current plugin setup.

---

## Step 2: Install Dependencies

At the **app level** (`apps/web/`):

```bash
cd apps/web
bun add -D @cloudflare/vite-plugin wrangler
```

At the **monorepo root**:

```bash
cd /path/to/monorepo-root
bun add -D @cloudflare/workers-types
```

This installs:
- `@cloudflare/vite-plugin` -- the Vite integration for Cloudflare Workers (app level)
- `wrangler` -- the Cloudflare CLI for deploying and managing Workers (app level)
- `@cloudflare/workers-types` -- TypeScript types for Workers APIs (root level for shared access)

---

## Step 3: Create `apps/web/wrangler.jsonc`

Create the file at `apps/web/wrangler.jsonc` (NOT at the repo root -- in a monorepo, wrangler config must live at the app level):

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "<your-project-name>",
  "compatibility_date": "2026-03-11",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
  "observability": {
    "enabled": true
  }
}
```

Replace `<your-project-name>` with the `name` field from your `apps/web/package.json` (lowercase, hyphenated). This becomes your Worker name and deploys to `<name>.<subdomain>.workers.dev`.

### Key fields explained

| Field | Purpose |
|-------|---------|
| `name` | Worker name. Deploys to `<name>.<subdomain>.workers.dev` |
| `compatibility_date` | Pins Workers runtime behavior to this date |
| `compatibility_flags: ["nodejs_compat"]` | Enables Node.js built-ins (`crypto`, `stream`, `buffer`, etc.) |
| `main` | Virtual module resolved by `@cloudflare/vite-plugin` at build time. Do not change this value. |
| `observability.enabled` | Activates real-time logs and analytics in the Cloudflare dashboard |

---

## Step 4: Update `apps/web/vite.config.ts`

Merge the Cloudflare plugin into your existing Vite config. The Cloudflare plugin **must be the first plugin** in the array, and it requires `viteEnvironment: { name: "ssr" }` for TanStack Start.

Add the import at the top:

```typescript
import { cloudflare } from "@cloudflare/vite-plugin";
```

Then add `cloudflare({ viteEnvironment: { name: "ssr" } })` as the **first entry** in your `plugins` array. Your updated config should look like this:

```typescript
import { cloudflare } from "@cloudflare/vite-plugin";
// ... your existing imports (tanstackStart, viteReact, etc.)

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    // ... all your existing plugins preserved in their original order
    // e.g. tanstackStart(), viteReact(), tsconfigPaths(), etc.
  ],
  // ... all existing config preserved (server settings, resolve aliases, etc.)
});
```

### Merge rules

- `cloudflare()` goes **first** in the plugins array
- Preserve all existing plugins after it -- do not remove or reorder them
- Preserve all existing config (server port, resolve aliases, etc.)
- Only add the new `@cloudflare/vite-plugin` import

---

## Step 5: Add Scripts to `apps/web/package.json`

Merge these scripts into `apps/web/package.json`. Only add or update deployment-related ones -- do not overwrite existing scripts:

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

Since TanStack Start uses Vite as its build tool, prefer the Vite-based commands. If `dev` or `build` scripts already exist, update them to use `vite dev` / `vite build`. Add `deploy` and `serve` if they don't exist.

---

## Step 6: Update TypeScript Config

Ensure `apps/web/tsconfig.json` includes the Cloudflare Workers types:

```json
{
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"]
  }
}
```

Merge this into your existing `compilerOptions.types` array if one exists.

---

## Step 7: Build and Verify

Run the build from the app directory:

```bash
cd apps/web
bun run build
```

### Expected output structure

```
apps/web/dist/
├── client/              <- Static assets (served by Workers Static Assets)
│   ├── assets/
│   │   ├── *.js         (code-split route bundles)
│   │   └── *.css        (Tailwind output, if used)
│   └── manifest.json
└── server/
    ├── index.js          <- The Worker script (SSR entry)
    └── wrangler.json     <- Auto-generated deployment config
```

The auto-generated `dist/server/wrangler.json` merges your `wrangler.jsonc` with build outputs:
- `main` is rewritten to `index.js`
- `assets.directory` is set to `../client`
- `no_bundle: true` (Vite already bundled everything)

Verify:
- `dist/client/` exists and contains static assets
- `dist/server/index.js` exists (the Worker script)
- Worker bundle size is under 3 MB

---

## Step 8: Deploy

Once the build succeeds, authenticate and deploy:

```bash
# First time only -- authenticate with Cloudflare
wrangler login

# Deploy
cd apps/web
bun run deploy
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Node.js built-in module not found` | Ensure `"compatibility_flags": ["nodejs_compat"]` in `wrangler.jsonc` |
| Static assets 404 | Verify `vite build` completed and `dist/client/` exists |
| Worker size limit exceeded (3 MB) | Enable code splitting in Vite, lazy-load heavy deps |
| `compatibility_date` errors | Update to a recent date |
| Local dev differs from production | Use `vite preview` for full Workers runtime locally |
| Plugin order error | `cloudflare()` must be the first plugin in the plugins array |
| SSR environment not found | Ensure `viteEnvironment: { name: "ssr" }` is passed to `cloudflare()` |
| Build succeeds but `dist/server/` is empty | Cloudflare plugin not first in Vite config |
| `wrangler deploy` says "not authenticated" | Run `wrangler login` and complete the browser OAuth flow |
| TypeScript errors for `Env`, `KVNamespace` | Verify `@cloudflare/workers-types` is installed and in `tsconfig.json` types |
| Monorepo build can't find wrangler config | Ensure `wrangler.jsonc` is in `apps/web/`, not the repo root |
