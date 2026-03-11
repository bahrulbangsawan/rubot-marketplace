# Design: `npx rubot` CLI Tool

## Purpose

A zero-dependency Node.js CLI published to npm that lets users install, manage, and discover skills from the `bahrulbangsawan/rubot-marketplace` GitHub repository.

## Usage

```bash
npx rubot add --skill biome              # Install to .claude/skills/
npx rubot add -g --skill biome           # Install to ~/.claude/skills/
npx rubot add --skill biome drizzle-orm  # Install multiple
npx rubot add --all                      # Install all 26 skills
npx rubot ls                             # List installed skills
npx rubot rm --skill biome               # Remove a skill
npx rubot search seo                     # Search available skills
npx rubot update                         # Update outdated skills
npx rubot init my-skill                  # Scaffold a new SKILL.md
```

## Architecture

### Package Structure

```
rubot-cli/
├── bin/
│   └── cli.mjs            # Entry point (#!/usr/bin/env node)
├── lib/
│   ├── commands/
│   │   ├── add.mjs         # Install skills from GitHub
│   │   ├── list.mjs        # List installed skills
│   │   ├── remove.mjs      # Uninstall a skill
│   │   ├── search.mjs      # Search available skills
│   │   ├── update.mjs      # Update installed skills
│   │   └── init.mjs        # Create SKILL.md template
│   ├── github.mjs          # GitHub API fetcher (raw + contents)
│   ├── registry.mjs        # Parses marketplace.json for skill catalog
│   ├── paths.mjs           # Resolves install paths (local vs global)
│   └── ui.mjs              # ANSI colors, spinner, prompts (zero-dep)
├── package.json
└── README.md
```

### Key Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Dependencies | Zero | Fast npx cold start, no node_modules download |
| Runtime | Node.js ESM | Universal, npx runs via Node regardless |
| Source repo | Hardcoded to bahrulbangsawan/rubot-marketplace | Curated, branded experience |
| Fetch method | GitHub REST API | No git clone needed, fetch only what's needed |
| Install paths | .claude/skills/ (local) or ~/.claude/skills/ (global) | Matches Claude Code conventions |
| Skipped files | evals/ directories | Dev-only, not useful for end users |

## Command Specifications

### `rubot add`

1. Fetch `marketplace.json` from GitHub raw content
2. Validate requested skill names against catalog
3. Fetch skill directory contents via GitHub Contents API
4. Write files to install path (skip evals/)
5. Print confirmation with skill name + version

**Catalog source:**
```
GET https://raw.githubusercontent.com/bahrulbangsawan/rubot-marketplace/main/plugins/rubot/.claude-plugin/marketplace.json
```

**Skill files source:**
```
GET https://api.github.com/repos/bahrulbangsawan/rubot-marketplace/contents/plugins/rubot/skills/{name}
```

**Install paths:**
- Local (default): `<cwd>/.claude/skills/<name>/`
- Global (-g): `~/.claude/skills/<name>/`

### `rubot list` / `rubot ls`

Scan install directories for SKILL.md files. Parse YAML frontmatter for name, version, description. Display as table grouped by local/global.

### `rubot remove` / `rubot rm`

Prompt for confirmation (unless -y), delete skill directory.

### `rubot search`

Fetch catalog, filter by query against name + description fields, display matches.

### `rubot update`

Compare installed SKILL.md versions against catalog versions. Re-fetch any outdated skills.

### `rubot init`

Generate a SKILL.md template with proper YAML frontmatter at `.claude/skills/<name>/SKILL.md`.

## CLI Arguments

```
rubot <command> [options]

Commands:
  add         Install skill(s)
  list|ls     Show installed skills
  remove|rm   Uninstall a skill
  search      Search available skills
  update      Update installed skills
  init        Create a new SKILL.md template

Flags (add):
  --skill, -s <names...>   Skill name(s) to install
  --global, -g             Install globally (~/.claude/skills/)
  --yes, -y                Skip confirmation
  --all                    Install all skills

Flags (remove):
  --skill, -s <name>       Skill to remove
  --global, -g             Remove from global directory

Flags (global):
  --help, -h               Show help
  --version, -v            Show version
```

## Terminal UI

Zero-dependency ANSI output:
- Colors: green (success), red (error), cyan (info), dim (secondary), bold (emphasis)
- Spinner: stdout overwrite animation (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏)
- Prompts: Node readline for Y/n confirmations
- No chalk, ora, or inquirer
