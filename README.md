# Rubot Marketplace

Official marketplace for the **rubot** Claude Code plugin.

## Installation

1. **Add the marketplace:**
   ```bash
   /plugin marketplace add rulisme/rubot-marketplace
   ```

2. **Install the plugin:**
   ```bash
   /plugin install rubot@rubot-marketplace
   ```

## Available Plugins

### rubot (v2.6.0)

Strict multi-agent orchestration governor with workflow commands and 15 specialist subagents.

**Features:**
- Multi-agent orchestration with mandatory specialist consultation
- Workflow commands: `/rubot-init`, `/rubot-plan`, `/rubot-execute`, `/rubot-check`, `/rubot-commit`, `/rubot-new-pr`, `/rubot-new-repo`
- 15 specialist subagents for TanStack, backend, frontend, SEO, debugging, and more
- Cross-agent risk matrix and unified execution plans
- Validation checklists and quality enforcement

**Skills:**
- TanStack Router, Query, Form, Table, DB
- RBAC & Authorization
- URL State Management
- Backend Master (ElysiaJS, Drizzle, tRPC)
- SEO, Theming, Dashboard, Charts
- Debug & QA Testing

## Requirements

- Claude Code CLI
- Mac, Windows, or Linux

## License

MIT
