---
name: rubot-setup-cf-workers
description: Set up Cloudflare Workers deployment for the current project — detects framework, installs wrangler, generates config, and verifies the build
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

You are setting up Cloudflare Workers deployment for this project. Use the `cf-workers-setup` skill to execute the full setup workflow.

## Execution Steps

1. **Read the skill**: Read `plugins/rubot/skills/cf-workers-setup/SKILL.md` for the complete workflow
2. **Detect the framework**: Scan `package.json` (and `apps/*/package.json` for monorepos) to identify the framework
3. **If TanStack Start is detected**: Also read `plugins/rubot/skills/cf-workers-setup/TANSTACK.md` for the TanStack-specific path
4. **Follow the skill instructions**: Execute Steps 1-5 from the skill sequentially
5. **Report results**: Summarize what was done, files created/modified, and next steps

Do not ask the user questions unless there is a genuine ambiguity (e.g., multiple apps in a monorepo). Execute all steps automatically.
