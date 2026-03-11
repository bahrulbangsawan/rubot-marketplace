# Deploying Your TanStack Start App to Cloudflare Workers

Here's how to set up Cloudflare Workers deployment for your TanStack Start app in `apps/web/`.

---

## 1. Install Dependencies

In your app directory (`apps/web/`):

```bash
cd apps/web
bun add -D wrangler @cloudflare/vite-plugin
```

- `wrangler` is the Cloudflare CLI for deploying Workers
- `@cloudflare/vite-plugin` integrates Cloudflare Workers with Vite-based projects

---

## 2. Create Wrangler Config

Create `apps/web/wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "web",
  "compatibility_date": "2026-03-11",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  }
}
```

Replace `"web"` with whatever you want your Worker to be named. The `nodejs_compat` flag is important -- TanStack Start uses Node.js built-ins that need to be polyfilled in the Workers runtime.

---

## 3. Update `vite.config.ts`

Add the Cloudflare plugin to your existing Vite config. It should be added to the plugins array:

```typescript
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    cloudflare(),
    tanstackStart(),
    viteReact(),
    // ... your other existing plugins
  ],
  // ... rest of your existing config
});
```

Keep all your existing plugins and config -- just add the `cloudflare()` call and its import.

---

## 4. Add Deploy Script

Add a deploy script to `apps/web/package.json`:

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "deploy": "wrangler deploy"
  }
}
```

---

## 5. Build and Deploy

```bash
cd apps/web

# Build first to verify everything works
bun run build

# Login to Cloudflare (first time only)
wrangler login

# Deploy
bun run deploy
```

The build should produce a `dist/` directory with `client/` (static assets) and `server/` (Worker script) subdirectories.

---

## Common Issues

- If you see errors about Node.js built-in modules, make sure `"nodejs_compat"` is in your `compatibility_flags`.
- If the build fails, check that the Cloudflare plugin is properly added to your Vite config.
- If deploy fails with auth errors, run `wrangler login` first.
- For local development with the Workers runtime, use `vite preview` instead of `vite dev`.
