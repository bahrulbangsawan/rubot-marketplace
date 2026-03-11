---
name: cf-workers-setup
version: 1.1.0
description: |
  Sets up Cloudflare Workers deployment for any web project. Detects framework (TanStack Start, Vite, Remix, Astro, or vanilla), installs wrangler, generates wrangler.jsonc/wrangler.toml with compatibility_date and nodejs_compat flag, configures the cloudflare() Vite plugin, adds deploy scripts, and verifies the build output.
  MUST activate for: deploy to Cloudflare Workers, add Workers support to an existing project, set up wrangler for the first time, run wrangler init, configure edge deployment, do a first production deploy, migrate from Vercel/other hosting to Cloudflare Workers, fix Node.js built-in module not found errors, fix empty dist/server/ after vite build, fix cloudflare() plugin ordering in Vite config, authenticate with wrangler deploy, set up SSR deployment on Cloudflare, deploy to cloudflare, wrangler setup, wrangler init, add workers, edge deployment, cloudflare workers setup, first deploy to cloudflare, wrangler.jsonc, wrangler.toml, cloudflare vite plugin.
  Also activate when: user has a Vite/TanStack/Astro/Remix app and asks about edge or serverless deployment, user needs help fixing a broken Cloudflare Workers setup, user mentions production deployment targeting Cloudflare.
  Do NOT activate for: KV/R2/Durable Objects/D1 bindings, Cloudflare Pages, writing Worker request handlers, Cloudflare DNS config, or deploying to non-Cloudflare platforms.
  Covers: framework detection (TanStack Start, Vite, Remix, Astro, vanilla), wrangler installation and configuration, wrangler.jsonc/wrangler.toml generation, compatibility_date and nodejs_compat setup, cloudflare() Vite plugin integration, deploy script generation, build output verification, monorepo support, package manager detection.
agents:
  - rubot
  - cloudflare
---

# Cloudflare Workers Setup Skill

> Detect framework, install wrangler, generate config, and verify build for Cloudflare Workers deployment

## When to Use

- User wants to deploy an existing web project to Cloudflare Workers
- User asks to add Cloudflare Workers support to a project
- User wants to set up wrangler for the first time in a project
- User mentions "first deploy", "production deployment", or "SSR deployment" targeting Cloudflare
- User has a Vite/TanStack/Astro/Remix app and asks about edge or serverless deployment
- User asks to run `wrangler init` or configure wrangler for an existing project
- User wants to migrate from another hosting provider to Cloudflare Workers
- User needs help fixing a broken Cloudflare Workers setup

## Quick Reference

| Step | Action | Key Output |
|------|--------|------------|
| 1. Detect | Scan project for framework, package manager, metadata | Framework ID + package manager |
| 2. Install | Add wrangler, Cloudflare plugins, and type packages | Updated `package.json` with CF deps |
| 3. Configure | Generate `wrangler.jsonc` and update Vite/Astro config | `wrangler.jsonc` + updated config files |
| 4. Scripts | Add `deploy`, `dev`, `build`, `serve` scripts | Updated `package.json` scripts |
| 5. Build & Verify | Run build, confirm `dist/` output structure | Successful build with correct output tree |

## Core Principles

1. **Detection-First** — Always scan the project before making changes. WHY: Applying the wrong config for a framework (e.g., Vite config on an Astro project) causes silent build failures that are hard to debug.
2. **Build Verification** — Every setup must end with a successful build. WHY: Catching config errors before the first deploy saves the user from debugging cryptic Cloudflare deployment errors.
3. **Framework-Specific Configs** — Each framework gets a tailored wrangler and plugin setup. WHY: Frameworks produce different output structures (client/server split, single bundle, static + SSR), and wrangler must match the output format.
4. **Non-Destructive Merging** — Never overwrite existing configs or scripts; merge into them. WHY: Users have existing build pipelines, plugin chains, and custom scripts that must be preserved.
5. **Monorepo Awareness** — Detect and handle monorepo structures automatically. WHY: Installing dependencies or placing config at the wrong level breaks builds in monorepo setups.

---

## Step 1: Detect the Project

Execute all steps sequentially. Only pause to ask the user if a critical ambiguity blocks progress (e.g., multiple apps in a monorepo and you can't determine which one to deploy).

Scan the project to determine:

### 1a. Package Manager

Check for lock files in order of priority:

| Lock file        | Package manager |
|------------------|-----------------|
| `bun.lockb` / `bun.lock` | bun             |
| `pnpm-lock.yaml` | pnpm            |
| `yarn.lock`      | yarn            |
| `package-lock.json` | npm          |

Default to `bun` if no lock file is found but `bunfig.toml` exists. Otherwise default to `npm`.

### 1b. Framework Detection

Read the app-level `package.json` (check `apps/web/package.json` first for monorepos, then root `package.json`). Identify the framework by checking dependencies and devDependencies:

| Dependency                    | Framework       | Setup Path       |
|-------------------------------|-----------------|------------------|
| `@tanstack/react-start`      | TanStack Start  | **Read TANSTACK.md** |
| `@tanstack/solid-start`      | TanStack Start  | **Read TANSTACK.md** |
| `astro`                       | Astro           | Astro path       |
| `@remix-run/cloudflare`      | Remix           | Remix path       |
| `next`                        | Next.js         | Next.js path     |
| `vite` (without framework)   | Vite (vanilla)  | Vite path        |
| None of the above             | Vanilla/Other   | Generic path     |

### 1c. Project Metadata

Extract from the app-level `package.json`:

- **Project name**: the `name` field (lowercase, hyphenated). Use this as the Worker name.
- **Today's date**: Use as `compatibility_date` in `YYYY-MM-DD` format.
- **Existing vite.config.ts**: Read it if it exists — you'll merge the Cloudflare plugin into it rather than overwriting.
- **Monorepo structure**: Check if `apps/` or `packages/` directories exist. If so, identify the deployable app directory.

---

## Step 2: Install Dependencies

### TanStack Start Projects

**Read `TANSTACK.md` in this skill directory for the complete TanStack-specific setup.** It contains the exact dependency list, config format, and build verification steps. Follow it precisely.

### Vite-Based Projects (Astro, Remix with Vite, vanilla Vite)

At the **app level**:

```bash
<pkg> add -D @cloudflare/vite-plugin wrangler
```

At the **monorepo root** (if applicable):

```bash
<pkg> add -D @cloudflare/workers-types
```

Replace `<pkg>` with the detected package manager's install command (`bun add`, `pnpm add`, `npm install`, `yarn add`).

### Non-Vite Projects (vanilla Workers, Next.js)

```bash
<pkg> add -D wrangler @cloudflare/workers-types
```

---

## Step 3: Generate Configuration

### TanStack Start Projects

Follow `TANSTACK.md` — it uses `wrangler.jsonc` with specific field semantics.

### Vite-Based Projects

Create `wrangler.jsonc` at the app root:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "<PROJECT_NAME>",
  "compatibility_date": "<TODAY_YYYY-MM-DD>",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  }
}
```

Update `vite.config.ts` — add the Cloudflare plugin as the **first** plugin:

```typescript
import { cloudflare } from "@cloudflare/vite-plugin";
// ... existing imports

export default defineConfig({
  plugins: [
    cloudflare(),
    // ... existing plugins preserved in their original order
  ],
  // ... existing config preserved
});
```

Preserve all existing plugins, settings, and imports. Only add what's new.

### Astro Projects

Create `wrangler.jsonc` as above, then ensure `astro.config.mjs` uses the Cloudflare adapter:

```typescript
import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
});
```

Install the adapter: `<pkg> add @astrojs/cloudflare`

### Remix Projects (with Vite)

Create `wrangler.jsonc` as above. The `@remix-run/cloudflare` package handles the integration. Ensure `vite.config.ts` includes the Cloudflare plugin before the Remix plugin.

### Vanilla Workers (no framework)

Create `wrangler.toml` (not JSONC — vanilla workers use TOML by convention):

```toml
name = "<PROJECT_NAME>"
main = "src/index.ts"
compatibility_date = "<TODAY_YYYY-MM-DD>"
compatibility_flags = ["nodejs_compat"]

[observability]
enabled = true
```

Create `src/index.ts` if it doesn't exist:

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return new Response("Hello from Cloudflare Workers!");
  },
};

interface Env {}
```

---

## Step 4: Add Scripts

Merge these scripts into the app-level `package.json`. Do not overwrite existing scripts — only add or update deployment-related ones:

### Vite-Based Projects (TanStack, Astro, Remix with Vite)

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

If `dev` or `build` scripts already exist and use a different command (e.g., `astro dev`), preserve the existing ones and add `deploy` only.

### Vanilla Workers

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  }
}
```

---

## Step 5: Build and Verify

Run the build:

```bash
cd <app-directory>
<pkg-run> build
```

Use the correct run command (`bun run`, `pnpm run`, `npm run`, `yarn`).

### Verify Output

For Vite-based projects, confirm the `dist/` directory contains:

```
dist/
├── client/          ← Static assets
│   ├── assets/
│   └── manifest.json
└── server/
    ├── index.js     ← Worker script
    └── wrangler.json ← Auto-generated deployment config
```

For vanilla workers, confirm `dist/` or `.wrangler/` output exists.

### If the Build Fails

Check these common issues in order:

1. **`Node.js built-in module not found`** — Ensure `"compatibility_flags": ["nodejs_compat"]` is in wrangler config
2. **Plugin order error** — `cloudflare()` must be the first plugin in `vite.config.ts`
3. **Missing dependencies** — Run the install step again at both app and root levels
4. **Worker size limit exceeded (3 MB)** — Enable code splitting in Vite, lazy-load heavy dependencies
5. **`compatibility_date` errors** — Update to today's date

---

## Monorepo Considerations

When working in a monorepo:

- Install `wrangler` and `@cloudflare/vite-plugin` at the **app level** (e.g., `apps/web/`)
- Install `@cloudflare/workers-types` at the **root level** for shared type access
- Place `wrangler.jsonc` in the **app directory**, not the root
- Run build commands from the **app directory**
- Ensure the app's `tsconfig.json` includes `@cloudflare/workers-types`:

```json
{
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"]
  }
}
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Build fails with "Node built-in not found" | Missing `nodejs_compat` flag | Add `"compatibility_flags": ["nodejs_compat"]` to `wrangler.jsonc` |
| Deploy fails with worker size error | Bundle too large (>3 MB limit) | Enable Vite code splitting, lazy-load heavy deps, check for bundled node_modules |
| `wrangler deploy` says "not authenticated" | Wrangler not logged in | Run `wrangler login` and complete the browser OAuth flow |
| Build succeeds but `dist/server/` is empty | Cloudflare plugin not first in Vite config | Move `cloudflare()` to the first position in the `plugins` array |
| "No such module" errors at runtime | Wrong `compatibility_date` | Update `compatibility_date` to today's date in `wrangler.jsonc` |
| `wrangler dev` fails with port conflict | Port 8787 already in use | Kill the existing process or use `wrangler dev --port <other>` |
| TypeScript errors for `Env`, `KVNamespace` | Missing Workers types | Install `@cloudflare/workers-types` and add to `tsconfig.json` types |
| Monorepo build can't find wrangler config | Config placed at repo root instead of app dir | Move `wrangler.jsonc` to the app directory (e.g., `apps/web/`) |

---

## Constraints

- **Do NOT overwrite existing scripts** — merge `deploy` and only add missing scripts
- **Do NOT overwrite existing Vite/Astro configs** — merge the Cloudflare plugin into the existing plugin array
- **Do NOT place wrangler config at the repo root in monorepos** — always place it at the app level
- **Do NOT skip the build verification step** — every setup must end with a confirmed successful build
- **Do NOT assume the package manager** — always detect from lock files first
- **Do NOT use `wrangler.toml` for Vite-based projects** — use `wrangler.jsonc` (TOML is only for vanilla Workers)
- **Do NOT install dependencies at the wrong level in monorepos** — wrangler and plugins go at app level, types go at root
- **Worker size limit is 3 MB** — if the build output exceeds this, you must fix it before declaring success

---

## Verification Checklist

After completing all steps, verify each item before reporting success:

- [ ] Framework correctly detected and matching setup path followed
- [ ] Package manager detected from lock file (not assumed)
- [ ] All required dependencies installed at correct level (app vs root)
- [ ] `wrangler.jsonc` (or `wrangler.toml` for vanilla) created with correct `name`, `compatibility_date`, and `nodejs_compat` flag
- [ ] Vite/Astro config updated with Cloudflare plugin in correct position (first in plugins array)
- [ ] Existing configs, plugins, and scripts preserved (nothing overwritten)
- [ ] `deploy` script added to `package.json`
- [ ] Build completes successfully with no errors
- [ ] Output directory structure matches expected format (`dist/client/` + `dist/server/` for Vite-based)
- [ ] Worker bundle size is under 3 MB

---

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Vite Plugin](https://developers.cloudflare.com/workers/frameworks/framework-guides/vite/)
- [TanStack Start on Cloudflare](https://tanstack.com/start/latest/docs/hosting/cloudflare) — also see `TANSTACK.md` in this skill directory
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Remix on Cloudflare](https://remix.run/docs/en/main/guides/cloudflare)
