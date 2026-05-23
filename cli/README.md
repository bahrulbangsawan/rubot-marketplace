# @bahrulbangsawan/rubot

CLI tool to install and manage components from [rubot-marketplace](https://github.com/bahrulbangsawan/rubot-marketplace) for Claude Code and Codex.

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
- Claude Code or Codex installed

## Component Types

The CLI manages 5 types of components:

| Type | Count | Claude Code path | Codex path | Description |
|------|-------|------------------|------------|-------------|
| **Skills** | 60 | `.claude/skills/<name>/` | `.agents/skills/<name>/` locally, `~/.codex/skills/<name>/` globally | Domain-specific knowledge and patterns |
| **Commands** | 38 | `.claude/commands/<name>.md` | `.codex/prompts/<name>.md` locally, `~/.codex/prompts/<name>.md` globally | Workflow commands/prompts |
| **Agents** | 16 | `.claude/agents/<name>.md` | `.codex/agents/<name>.md` reference files | Specialist subagent definitions |
| **Hooks** | 8 | `.claude/settings.json` | Not installed; Codex does not support Claude-style hooks | Lifecycle event handlers |
| **Templates** | 10 | `.claude/templates/<name>` | `.codex/templates/<name>` | Project template files |

Claude Code remains the default target and auto-discovers `.claude/`. Codex skills are installed where Codex already discovers them, and commands are installed as Codex prompts with a compatibility adapter.

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

# Install to global directory (~/.claude/ by default)
rubot add --skill biome --global

# Install for Codex instead of Claude Code
rubot add --target codex --skill biome
rubot add --target codex --type command rubot-fix-prompt

# Install to both runtimes
rubot add --target both --skill biome

# Skip confirmation
rubot add --all --yes
```

**Interactive mode** (just `rubot add`):

```
? What would you like to install? (↑↓ move, space toggle, a all, / filter, enter confirm)
  > ◉ skill       60 available
    ◯ command     38 available
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
| `--global` | `-g` | Install globally (`~/.claude/` for Claude Code, `~/.codex/` for Codex) |
| `--target <target>` | | Runtime target: `claude`, `codex`, or `both` |
| `--yes` | `-y` | Skip confirmation prompts |

### `rubot list` — Show installed components

Display all installed components grouped by type and scope.

```bash
rubot list
rubot ls
rubot list --type skill
rubot list --target codex --type skill
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
rubot remove --target codex --skill drizzle-orm

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
rubot update --target codex --type skill
```

### `rubot init` — Create a new skill template

Scaffold a new `SKILL.md` template for authoring custom skills.

```bash
rubot init my-custom-skill
rubot init my-custom-skill --global
rubot init --target codex skill my-custom-skill
rubot init --target both skill my-custom-skill
```

## Install Locations

Components are installed to one of two scopes and one runtime target:

| Target | Scope | Path | When to use |
|--------|-------|------|-------------|
| `claude` | Local (default) | `.claude/<type>/` | Project-specific Claude Code components |
| `claude` | Global (`--global`) | `~/.claude/<type>/` | Claude Code components you want everywhere |
| `codex` | Local (default) | `.agents/skills/` for skills, `.codex/prompts/` for commands | Project-specific Codex skills/prompts |
| `codex` | Global (`--global`) | `~/.codex/skills/`, `~/.codex/prompts/` | Codex skills/prompts you want everywhere |

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
For Codex, use `--target codex`; installed skills appear in Codex skill discovery, and installed commands appear as Codex prompts.

## License

MIT
