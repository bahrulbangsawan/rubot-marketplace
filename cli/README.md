# @bahrulbangsawan/rubot

CLI tool to install and manage components from [rubot-marketplace](https://github.com/bahrulbangsawan/rubot-marketplace) for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

## Installation

### One-line install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/bahrulbangsawan/rubot-marketplace/main/cli/install.sh | sh && exec $SHELL
```

This automatically handles permissions, sets up your PATH, and installs `rubot` globally — no `sudo` needed. The `exec $SHELL` reloads your terminal so `rubot` is available immediately.

### Run directly with npx (no install needed)

```bash
npx @bahrulbangsawan/rubot <command>
```

### Install globally with npm

```bash
npm install -g @bahrulbangsawan/rubot
```

> **Note:** If you get an `EACCES` permission error, use the one-line installer above — it fixes npm permissions automatically.

Then use:

```bash
rubot <command>
```

### Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/bahrulbangsawan/rubot-marketplace/main/cli/install.sh | sh -s -- --uninstall
```

Or manually:

```bash
npm uninstall -g @bahrulbangsawan/rubot
```

### Requirements

- Node.js >= 20.0.0
- Claude Code installed

## Component Types

The CLI manages 5 types of components:

| Type | Count | Install path | Description |
|------|-------|-------------|-------------|
| **Skills** | 60 | `.claude/skills/<name>/` | Domain-specific knowledge and patterns |
| **Commands** | 37 | `.claude/commands/<name>.md` | Workflow commands (slash commands) |
| **Agents** | 16 | `.claude/agents/<name>.md` | Specialist subagent definitions |
| **Hooks** | 8 | `.claude/settings.json` | Lifecycle event handlers |
| **Templates** | 10 | `.claude/templates/<name>` | Project template files |

All components are auto-discovered by Claude Code from the `.claude/` directory.

## Commands

### `rubot add` — Install components

Interactive multi-select or direct install.

```bash
# Interactive — pick types, then pick items
rubot add

# Multi-select skills only
rubot add --type skill

# Install specific skills
rubot add --skill drizzle-orm tanstack-router

# Install specific commands
rubot add --type command rubot-seo-audit rubot-design-audit

# Install all agents
rubot add --type agent --all

# Install everything (all types)
rubot add --all

# Install to global directory (~/.claude/)
rubot add --skill biome --global

# Skip confirmation
rubot add --all --yes
```

**Interactive mode** (just `rubot add`):

```
? What would you like to install? (↑↓ move, space toggle, a all, / filter, enter confirm)
  > ◉ skill       60 available
    ◯ command     37 available
    ◯ agent       16 available
    ◯ hook         8 available
    ◯ template    10 available

? Select skills to install: (↑↓ move, space toggle, a all, / filter, enter confirm)
  > ◉ drizzle-orm            Type-safe database operations with Drizzle ORM
    ◯ elysiajs               High-performance HTTP servers with ElysiaJS
    ◉ tanstack-router        TanStack Router patterns
    ...
  2 of 60 selected
```

**Options:**

| Flag | Alias | Description |
|------|-------|-------------|
| `--type <types>` | `-t` | Component type: skill, command, agent, hook, template |
| `--skill <names...>` | `-s` | Skill name(s) — shorthand for `--type skill <names>` |
| `--all` | | Install all (of specified type, or everything) |
| `--global` | `-g` | Install to `~/.claude/` instead of `.claude/` |
| `--yes` | `-y` | Skip confirmation prompts |

### `rubot list` — Show installed components

Display all installed components grouped by type and scope.

```bash
rubot list
rubot ls
rubot list --type skill
```

### `rubot search` — Search available components

Browse and search across all component types.

```bash
# List everything
rubot search

# Search by keyword across all types
rubot search seo

# Search only skills
rubot search --type skill tanstack
```

### `rubot remove` — Uninstall components

Interactive multi-select or direct removal.

```bash
# Interactive — shows installed, pick what to remove
rubot remove

# Remove specific skill
rubot remove --skill drizzle-orm

# Remove specific command
rubot remove --type command rubot-seo-audit

# Remove all hooks
rubot remove --type hook --all

# Remove everything
rubot remove --all

# Skip confirmation
rubot remove --skill drizzle-orm --yes
```

### `rubot update` — Update installed components

Check all installed components against the registry and update to latest.

```bash
rubot update
rubot update --type skill
```

### `rubot init` — Create a new skill template

Scaffold a new `SKILL.md` template for authoring custom skills.

```bash
rubot init my-custom-skill
rubot init my-custom-skill --global
```

## Install Locations

Components are installed to one of two scopes:

| Scope | Path | When to use |
|-------|------|------------|
| **Local** (default) | `.claude/<type>/` | Project-specific components |
| **Global** (`--global`) | `~/.claude/<type>/` | Components you want everywhere |

## Quick Start

```bash
# 1. Interactive install — browse and pick what you need
rubot add

# 2. Or install specific components directly
rubot add --skill drizzle-orm tanstack-router
rubot add --type command rubot-seo-audit rubot-commit

# 3. Verify installation
rubot list

# 4. Keep everything updated
rubot update
```

Once installed, Claude Code automatically discovers and uses the components.

## License

MIT
