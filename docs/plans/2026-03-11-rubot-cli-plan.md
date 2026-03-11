# `npx rubot` CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a zero-dependency Node.js CLI tool published to npm as `rubot` that installs, manages, and discovers skills from the `bahrulbangsawan/rubot-marketplace` GitHub repository.

**Architecture:** A single npm package with a `bin/cli.mjs` entry point that parses arguments manually (no deps), fetches skill data via GitHub REST API, and writes files to `.claude/skills/` (local) or `~/.claude/skills/` (global). The CLI is structured as a command router dispatching to individual command modules.

**Tech Stack:** Node.js 20+ ESM, GitHub REST API, zero npm dependencies.

**Design doc:** `docs/plans/2026-03-11-rubot-cli-design.md`

---

### Task 1: Scaffold Package Structure

**Files:**
- Create: `cli/package.json`
- Create: `cli/bin/cli.mjs`

**Step 1: Create package.json**

Create `cli/package.json`:

```json
{
  "name": "rubot",
  "version": "1.0.0",
  "description": "Install and manage skills from rubot-marketplace",
  "type": "module",
  "bin": {
    "rubot": "bin/cli.mjs"
  },
  "files": [
    "bin/",
    "lib/"
  ],
  "keywords": [
    "rubot",
    "skills",
    "claude-code",
    "ai-agent",
    "cli"
  ],
  "author": "bahrulbangsawan",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/bahrulbangsawan/rubot-marketplace"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Step 2: Create CLI entry point stub**

Create `cli/bin/cli.mjs`:

```js
#!/usr/bin/env node

const args = process.argv.slice(2)
const command = args[0]

if (!command || command === '--help' || command === '-h') {
  console.log('rubot - Install and manage skills from rubot-marketplace')
  console.log('')
  console.log('Usage: rubot <command> [options]')
  console.log('')
  console.log('Commands:')
  console.log('  add         Install skill(s)')
  console.log('  list, ls    Show installed skills')
  console.log('  remove, rm  Uninstall a skill')
  console.log('  search      Search available skills')
  console.log('  update      Update installed skills')
  console.log('  init        Create a new SKILL.md template')
  console.log('')
  console.log('Run rubot <command> --help for command-specific help')
  process.exit(0)
}

if (command === '--version' || command === '-v') {
  const { readFileSync } = await import('node:fs')
  const { fileURLToPath } = await import('node:url')
  const { dirname, join } = await import('node:path')
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))
  console.log(pkg.version)
  process.exit(0)
}

console.log(`Unknown command: ${command}`)
console.log('Run rubot --help for usage')
process.exit(1)
```

**Step 3: Verify it runs**

Run: `cd cli && node bin/cli.mjs --help`
Expected: Shows help text with all 6 commands listed.

Run: `node bin/cli.mjs --version`
Expected: `1.0.0`

Run: `node bin/cli.mjs foobar`
Expected: `Unknown command: foobar`

**Step 4: Commit**

```bash
git add cli/
git commit -m "feat(cli): scaffold rubot CLI package structure"
```

---

### Task 2: Build UI Utilities

**Files:**
- Create: `cli/lib/ui.mjs`

**Step 1: Implement ANSI color helpers, spinner, and prompt**

Create `cli/lib/ui.mjs`:

```js
import { createInterface } from 'node:readline'

// ANSI color helpers
export const green = (s) => `\x1b[32m${s}\x1b[0m`
export const red = (s) => `\x1b[31m${s}\x1b[0m`
export const cyan = (s) => `\x1b[36m${s}\x1b[0m`
export const dim = (s) => `\x1b[2m${s}\x1b[0m`
export const bold = (s) => `\x1b[1m${s}\x1b[0m`
export const yellow = (s) => `\x1b[33m${s}\x1b[0m`

// Status symbols
export const symbols = {
  success: green('✓'),
  error: red('✗'),
  arrow: cyan('→'),
  bullet: dim('•'),
}

// Spinner using braille characters
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export function createSpinner(message) {
  let i = 0
  let timer = null

  return {
    start() {
      timer = setInterval(() => {
        process.stdout.write(`\r${cyan(frames[i++ % frames.length])} ${message}`)
      }, 80)
    },
    stop(finalMessage) {
      clearInterval(timer)
      process.stdout.write(`\r${' '.repeat(message.length + 4)}\r`)
      if (finalMessage) console.log(finalMessage)
    },
  }
}

// Y/n confirmation prompt
export function confirm(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`${question} ${dim('(Y/n)')} `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() !== 'n')
    })
  })
}

// Error and exit
export function fatal(message) {
  console.error(`${symbols.error} ${message}`)
  process.exit(1)
}
```

**Step 2: Quick smoke test**

Run: `node -e "import('./cli/lib/ui.mjs').then(ui => { console.log(ui.green('green'), ui.red('red'), ui.bold('bold')); console.log(ui.symbols.success, 'works') })"`
Expected: Colored output with `✓ works`

**Step 3: Commit**

```bash
git add cli/lib/ui.mjs
git commit -m "feat(cli): add zero-dep terminal UI utilities"
```

---

### Task 3: Build Paths Module

**Files:**
- Create: `cli/lib/paths.mjs`

**Step 1: Implement install path resolution**

Create `cli/lib/paths.mjs`:

```js
import { homedir } from 'node:os'
import { join } from 'node:path'

export function getSkillsDir(global = false) {
  if (global) {
    return join(homedir(), '.claude', 'skills')
  }
  return join(process.cwd(), '.claude', 'skills')
}

export function getSkillPath(name, global = false) {
  return join(getSkillsDir(global), name)
}
```

**Step 2: Commit**

```bash
git add cli/lib/paths.mjs
git commit -m "feat(cli): add install path resolution module"
```

---

### Task 4: Build GitHub Fetcher

**Files:**
- Create: `cli/lib/github.mjs`

**Step 1: Implement GitHub API fetch functions**

This module does two things:
1. Fetches `marketplace.json` via raw.githubusercontent.com (no API rate limit)
2. Fetches skill directory contents via GitHub Contents API (returns file list with download URLs)
3. Fetches individual file content via download_url (raw file content)

Create `cli/lib/github.mjs`:

```js
import { request } from 'node:https'

const REPO_OWNER = 'bahrulbangsawan'
const REPO_NAME = 'rubot-marketplace'
const BRANCH = 'main'
const SKILLS_PATH = 'plugins/rubot/skills'
const MARKETPLACE_PATH = 'plugins/rubot/.claude-plugin/marketplace.json'

function fetch(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'rubot-cli',
        Accept: 'application/vnd.github.v3+json',
      },
    }
    request(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location).then(resolve, reject)
      }
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${url}`))
          return
        }
        resolve(data)
      })
      res.on('error', reject)
    }).on('error', reject).end()
  })
}

export async function fetchMarketplace() {
  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${MARKETPLACE_PATH}`
  const data = await fetch(url)
  return JSON.parse(data)
}

export async function fetchSkillContents(skillName) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${SKILLS_PATH}/${skillName}?ref=${BRANCH}`
  const data = await fetch(url)
  return JSON.parse(data)
}

export async function fetchFileContent(downloadUrl) {
  return fetch(downloadUrl)
}
```

**Step 2: Verify marketplace fetch works**

Run: `node -e "import('./cli/lib/github.mjs').then(async g => { const m = await g.fetchMarketplace(); console.log(m.name, m.version, m.components.skills.count + ' skills') })"`
Expected: `rubot 2.13.0 26 skills`

**Step 3: Verify skill contents fetch works**

Run: `node -e "import('./cli/lib/github.mjs').then(async g => { const c = await g.fetchSkillContents('biome'); console.log(c.map(f => f.name + ' (' + f.type + ')').join(', ')) })"`
Expected: `SKILL.md (file), evals (dir)`

**Step 4: Commit**

```bash
git add cli/lib/github.mjs
git commit -m "feat(cli): add GitHub API fetcher for marketplace and skill files"
```

---

### Task 5: Build Registry Module

**Files:**
- Create: `cli/lib/registry.mjs`

**Step 1: Implement catalog parsing**

This module fetches the marketplace.json and provides a clean API for looking up skills by name, listing all skills, and searching.

Create `cli/lib/registry.mjs`:

```js
import { fetchMarketplace } from './github.mjs'

let _catalog = null

export async function getCatalog() {
  if (_catalog) return _catalog
  const marketplace = await fetchMarketplace()
  _catalog = marketplace.components.skills.list.map((skill) => ({
    name: skill.name,
    description: skill.description,
    agents: skill.agents,
  }))
  return _catalog
}

export async function findSkill(name) {
  const catalog = await getCatalog()
  return catalog.find((s) => s.name === name) || null
}

export async function searchSkills(query) {
  const catalog = await getCatalog()
  if (!query) return catalog
  const q = query.toLowerCase()
  return catalog.filter(
    (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  )
}
```

**Step 2: Verify skill lookup**

Run: `node -e "import('./cli/lib/registry.mjs').then(async r => { const s = await r.findSkill('biome'); console.log(s.name, '-', s.description.slice(0, 50)) })"`
Expected: `biome - ...` with partial description

**Step 3: Commit**

```bash
git add cli/lib/registry.mjs
git commit -m "feat(cli): add registry module for skill catalog lookups"
```

---

### Task 6: Build Argument Parser

**Files:**
- Modify: `cli/bin/cli.mjs`

**Step 1: Implement argument parsing in cli.mjs**

Replace the stub `cli/bin/cli.mjs` with a full argument parser that routes to command modules. The parser needs to handle:
- Commands: `add`, `list`/`ls`, `remove`/`rm`, `search`, `update`, `init`
- Flags: `--skill`/`-s` (variadic), `--global`/`-g`, `--yes`/`-y`, `--all`
- Positional args after command (for `search` query and `init` name)

```js
#!/usr/bin/env node

function parseArgs(argv) {
  const args = argv.slice(2)
  const command = args[0]
  const flags = { skills: [], global: false, yes: false, all: false, help: false }
  const positional = []

  let i = 1
  while (i < args.length) {
    const arg = args[i]
    if (arg === '--skill' || arg === '-s') {
      i++
      while (i < args.length && !args[i].startsWith('-')) {
        flags.skills.push(args[i])
        i++
      }
    } else if (arg === '--global' || arg === '-g') {
      flags.global = true
      i++
    } else if (arg === '--yes' || arg === '-y') {
      flags.yes = true
      i++
    } else if (arg === '--all') {
      flags.all = true
      i++
    } else if (arg === '--help' || arg === '-h') {
      flags.help = true
      i++
    } else if (!arg.startsWith('-')) {
      positional.push(arg)
      i++
    } else {
      console.error(`Unknown flag: ${arg}`)
      process.exit(1)
    }
  }

  return { command, flags, positional }
}

function showHelp() {
  console.log(`
  ${'\x1b[1m'}rubot${'\x1b[0m'} - Install and manage skills from rubot-marketplace

  ${'\x1b[2m'}Usage:${'\x1b[0m'} rubot <command> [options]

  ${'\x1b[2m'}Commands:${'\x1b[0m'}
    add          Install skill(s)
    list, ls     Show installed skills
    remove, rm   Uninstall a skill
    search       Search available skills
    update       Update installed skills
    init         Create a new SKILL.md template

  ${'\x1b[2m'}Options:${'\x1b[0m'}
    --skill, -s  Skill name(s) to install/remove
    --global, -g Install/remove globally (~/.claude/skills/)
    --yes, -y    Skip confirmation prompts
    --all        Install all available skills
    --help, -h   Show help
    --version, -v Show version
  `)
}

const { command, flags, positional } = parseArgs(process.argv)

if (!command || command === '--help' || command === '-h') {
  showHelp()
  process.exit(0)
}

if (command === '--version' || command === '-v') {
  const { readFileSync } = await import('node:fs')
  const { fileURLToPath } = await import('node:url')
  const { dirname, join } = await import('node:path')
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))
  console.log(pkg.version)
  process.exit(0)
}

const commands = {
  add: () => import('../lib/commands/add.mjs'),
  list: () => import('../lib/commands/list.mjs'),
  ls: () => import('../lib/commands/list.mjs'),
  remove: () => import('../lib/commands/remove.mjs'),
  rm: () => import('../lib/commands/remove.mjs'),
  search: () => import('../lib/commands/search.mjs'),
  update: () => import('../lib/commands/update.mjs'),
  init: () => import('../lib/commands/init.mjs'),
}

const loader = commands[command]
if (!loader) {
  console.error(`Unknown command: ${command}`)
  console.error('Run rubot --help for usage')
  process.exit(1)
}

const mod = await loader()
await mod.run({ flags, positional })
```

**Step 2: Verify argument parsing**

Run: `node cli/bin/cli.mjs --help`
Expected: Formatted help text

Run: `node cli/bin/cli.mjs --version`
Expected: `1.0.0`

Run: `node cli/bin/cli.mjs add --skill biome drizzle-orm -g`
Expected: Error about missing module (commands don't exist yet), but it parsed correctly.

**Step 3: Commit**

```bash
git add cli/bin/cli.mjs
git commit -m "feat(cli): implement argument parser and command router"
```

---

### Task 7: Build `add` Command

**Files:**
- Create: `cli/lib/commands/add.mjs`

**Step 1: Implement the add command**

This is the core command. It:
1. Validates arguments (--skill or --all required)
2. Fetches the catalog to validate skill names
3. For each skill: fetches directory contents from GitHub, writes files locally (skipping evals/)
4. Handles recursive directory fetching for skills with subdirectories

Create `cli/lib/commands/add.mjs`:

```js
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { getCatalog, findSkill } from '../registry.mjs'
import { fetchSkillContents, fetchFileContent } from '../github.mjs'
import { getSkillPath, getSkillsDir } from '../paths.mjs'
import { bold, cyan, dim, green, symbols, fatal, createSpinner, confirm } from '../ui.mjs'

async function fetchAndWriteFiles(skillName, destDir, entries) {
  for (const entry of entries) {
    if (entry.name === 'evals' || entry.name === '.eval') continue

    if (entry.type === 'file') {
      const content = await fetchFileContent(entry.download_url)
      const filePath = join(destDir, entry.name)
      writeFileSync(filePath, content, 'utf8')
    } else if (entry.type === 'dir') {
      const subDir = join(destDir, entry.name)
      mkdirSync(subDir, { recursive: true })
      const subEntries = await fetchSkillContents(`${skillName}/${entry.name}`)
      await fetchAndWriteFiles(`${skillName}/${entry.name}`, subDir, subEntries)
    }
  }
}

function parseVersion(content) {
  const match = content.match(/^version:\s*(.+)$/m)
  return match ? match[1].trim() : 'unknown'
}

async function installSkill(name, global, skipConfirm) {
  const catalogEntry = await findSkill(name)
  if (!catalogEntry) {
    fatal(`Skill "${name}" not found. Run ${cyan('rubot search')} to see available skills.`)
  }

  const destDir = getSkillPath(name, global)
  const location = global ? '~/.claude/skills/' : '.claude/skills/'

  if (existsSync(destDir)) {
    console.log(`${symbols.bullet} ${dim(`${name} already installed at ${location}${name}/`)}`)
    return false
  }

  const spinner = createSpinner(`Installing ${bold(name)}...`)
  spinner.start()

  const entries = await fetchSkillContents(name)
  mkdirSync(destDir, { recursive: true })
  await fetchAndWriteFiles(name, destDir, entries)

  // Read version from installed SKILL.md
  const { readFileSync } = await import('node:fs')
  const skillMd = readFileSync(join(destDir, 'SKILL.md'), 'utf8')
  const version = parseVersion(skillMd)

  spinner.stop(`${symbols.success} Installed ${bold(name)} ${dim(`v${version}`)}`)
  console.log(`  ${symbols.arrow} ${dim(`${location}${name}/`)}`)
  return true
}

export async function run({ flags, positional }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot add')} - Install skill(s) from rubot-marketplace

  ${dim('Usage:')}
    rubot add --skill <names...> [--global] [--yes]
    rubot add --all [--global] [--yes]

  ${dim('Options:')}
    --skill, -s  Skill name(s) to install
    --global, -g Install to ~/.claude/skills/
    --yes, -y    Skip confirmation
    --all        Install all skills
    `)
    return
  }

  let skillNames = flags.skills

  if (flags.all) {
    const catalog = await getCatalog()
    skillNames = catalog.map((s) => s.name)
  }

  if (skillNames.length === 0) {
    fatal('No skills specified. Use --skill <name> or --all')
  }

  const location = flags.global ? bold('global') + dim(' (~/.claude/skills/)') : bold('local') + dim(' (.claude/skills/)')
  console.log()
  console.log(`  Installing ${bold(String(skillNames.length))} skill(s) to ${location}`)
  console.log()

  if (!flags.yes) {
    const ok = await confirm(`  Install ${skillNames.join(', ')}?`)
    if (!ok) {
      console.log(dim('  Cancelled.'))
      return
    }
    console.log()
  }

  let installed = 0
  for (const name of skillNames) {
    try {
      const didInstall = await installSkill(name, flags.global, flags.yes)
      if (didInstall) installed++
    } catch (err) {
      console.error(`${symbols.error} Failed to install ${bold(name)}: ${err.message}`)
    }
  }

  console.log()
  if (installed > 0) {
    console.log(`  ${symbols.success} ${bold(String(installed))} skill(s) installed successfully`)
  }
}
```

**Step 2: Test with a real skill**

Run: `node cli/bin/cli.mjs add --skill biome -y`
Expected:
```
  Installing 1 skill(s) to local (.claude/skills/)

✓ Installed biome v1.1.0
  → .claude/skills/biome/

  ✓ 1 skill(s) installed successfully
```

Verify: `ls .claude/skills/biome/` should show `SKILL.md` (no `evals/` directory).

**Step 3: Test with a multi-file skill**

Run: `node cli/bin/cli.mjs add --skill tanstack-router -y`
Expected: Installs `SKILL.md`, `ROUTING.md`, `LOADERS.md`, `NAVIGATION.md`, `SEARCH-PARAMS.md`, `SSR.md` — but NOT `evals/`.

Verify: `ls .claude/skills/tanstack-router/`

**Step 4: Clean up test files and commit**

```bash
rm -rf .claude/skills/biome .claude/skills/tanstack-router
git add cli/lib/commands/add.mjs
git commit -m "feat(cli): implement add command with GitHub fetch and file install"
```

---

### Task 8: Build `list` Command

**Files:**
- Create: `cli/lib/commands/list.mjs`

**Step 1: Implement list command**

Scans both local and global skill directories, reads YAML frontmatter from each SKILL.md, displays a table.

Create `cli/lib/commands/list.mjs`:

```js
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { getSkillsDir } from '../paths.mjs'
import { bold, dim, cyan, symbols } from '../ui.mjs'

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const yaml = match[1]
  const name = yaml.match(/^name:\s*(.+)$/m)?.[1]?.trim() || 'unknown'
  const version = yaml.match(/^version:\s*(.+)$/m)?.[1]?.trim() || '?'
  const descMatch = yaml.match(/^description:\s*\|?\s*\n?\s*(.+)$/m)
  const descShort = descMatch ? descMatch[1].trim().slice(0, 60) : ''
  return { name, version, description: descShort }
}

function listDir(dir, label) {
  if (!existsSync(dir)) return 0

  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .filter((e) => existsSync(join(dir, e.name, 'SKILL.md')))

  if (entries.length === 0) return 0

  console.log(`  ${bold(label)}`)
  console.log()

  const maxName = Math.max(...entries.map((e) => e.name.length))

  for (const entry of entries) {
    const content = readFileSync(join(dir, entry.name, 'SKILL.md'), 'utf8')
    const meta = parseFrontmatter(content)
    const padded = meta.name.padEnd(maxName + 2)
    console.log(`    ${cyan(padded)} ${dim(`v${meta.version}`)}  ${meta.description}`)
  }
  console.log()
  return entries.length
}

export async function run({ flags }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot list')} - Show installed skills

  ${dim('Usage:')} rubot list
  ${dim('Alias:')} rubot ls
    `)
    return
  }

  console.log()
  const localDir = getSkillsDir(false)
  const globalDir = getSkillsDir(true)

  const localCount = listDir(localDir, `Local ${dim(`(${localDir})`)}`)
  const globalCount = listDir(globalDir, `Global ${dim(`(${globalDir})`)}`)

  if (localCount === 0 && globalCount === 0) {
    console.log(`  ${dim('No skills installed.')}`)
    console.log(`  ${dim(`Install with: ${cyan('npx rubot add --skill <name>')}`)}`)
    console.log()
  }
}
```

**Step 2: Test**

Run: `node cli/bin/cli.mjs add --skill biome -y && node cli/bin/cli.mjs ls`
Expected: Shows biome in the local skills list.

**Step 3: Clean up and commit**

```bash
rm -rf .claude/skills/biome
git add cli/lib/commands/list.mjs
git commit -m "feat(cli): implement list command to show installed skills"
```

---

### Task 9: Build `remove` Command

**Files:**
- Create: `cli/lib/commands/remove.mjs`

**Step 1: Implement remove command**

Create `cli/lib/commands/remove.mjs`:

```js
import { existsSync, rmSync } from 'node:fs'
import { getSkillPath } from '../paths.mjs'
import { bold, dim, symbols, fatal, confirm } from '../ui.mjs'

export async function run({ flags }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot remove')} - Uninstall a skill

  ${dim('Usage:')} rubot remove --skill <name> [--global] [--yes]
  ${dim('Alias:')} rubot rm
    `)
    return
  }

  if (flags.skills.length === 0) {
    fatal('No skill specified. Use --skill <name>')
  }

  for (const name of flags.skills) {
    const skillDir = getSkillPath(name, flags.global)
    const location = flags.global ? '~/.claude/skills/' : '.claude/skills/'

    if (!existsSync(skillDir)) {
      console.log(`${symbols.bullet} ${dim(`${name} is not installed at ${location}`)}`)
      continue
    }

    if (!flags.yes) {
      const ok = await confirm(`  Remove ${bold(name)} from ${location}?`)
      if (!ok) {
        console.log(dim('  Skipped.'))
        continue
      }
    }

    rmSync(skillDir, { recursive: true })
    console.log(`${symbols.success} Removed ${bold(name)}`)
  }
}
```

**Step 2: Test**

Run:
```bash
node cli/bin/cli.mjs add --skill biome -y
node cli/bin/cli.mjs rm --skill biome -y
```
Expected: Installs then removes biome. `ls .claude/skills/` should be empty.

**Step 3: Commit**

```bash
git add cli/lib/commands/remove.mjs
git commit -m "feat(cli): implement remove command"
```

---

### Task 10: Build `search` Command

**Files:**
- Create: `cli/lib/commands/search.mjs`

**Step 1: Implement search command**

Create `cli/lib/commands/search.mjs`:

```js
import { searchSkills } from '../registry.mjs'
import { bold, dim, cyan, symbols } from '../ui.mjs'

export async function run({ flags, positional }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot search')} - Search available skills

  ${dim('Usage:')} rubot search [query]

  ${dim('Examples:')}
    rubot search           List all available skills
    rubot search seo       Find SEO-related skills
    rubot search tanstack  Find TanStack skills
    `)
    return
  }

  const query = positional[0] || ''
  const results = await searchSkills(query)

  console.log()
  if (results.length === 0) {
    console.log(`  ${dim(`No skills found for "${query}"`)}`)
    console.log()
    return
  }

  const maxName = Math.max(...results.map((s) => s.name.length))

  if (query) {
    console.log(`  ${bold(`Results for "${query}"`)} ${dim(`(${results.length} found)`)}`)
  } else {
    console.log(`  ${bold('Available skills')} ${dim(`(${results.length} total)`)}`)
  }
  console.log()

  for (const skill of results) {
    const padded = skill.name.padEnd(maxName + 2)
    console.log(`    ${cyan(padded)} ${skill.description}`)
  }

  console.log()
  console.log(`  ${dim(`Install with: ${cyan('npx rubot add --skill <name>')}`)}`)
  console.log()
}
```

**Step 2: Test**

Run: `node cli/bin/cli.mjs search seo`
Expected: Shows 5 SEO-related skills (rubot-seo-audit, schema-markup, core-web-vitals, social-sharing, crawl-config)

Run: `node cli/bin/cli.mjs search`
Expected: Lists all 26 skills

**Step 3: Commit**

```bash
git add cli/lib/commands/search.mjs
git commit -m "feat(cli): implement search command"
```

---

### Task 11: Build `update` Command

**Files:**
- Create: `cli/lib/commands/update.mjs`

**Step 1: Implement update command**

Compares installed skill versions against the latest from GitHub, re-installs outdated ones.

Create `cli/lib/commands/update.mjs`:

```js
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { getSkillsDir, getSkillPath } from '../paths.mjs'
import { fetchSkillContents, fetchFileContent } from '../github.mjs'
import { getCatalog } from '../registry.mjs'
import { bold, dim, cyan, green, symbols, createSpinner } from '../ui.mjs'

function getInstalledVersion(skillDir) {
  const skillMd = join(skillDir, 'SKILL.md')
  if (!existsSync(skillMd)) return null
  const content = readFileSync(skillMd, 'utf8')
  const match = content.match(/^version:\s*(.+)$/m)
  return match ? match[1].trim() : null
}

async function reinstallSkill(name, destDir) {
  rmSync(destDir, { recursive: true })
  mkdirSync(destDir, { recursive: true })

  const entries = await fetchSkillContents(name)
  for (const entry of entries) {
    if (entry.name === 'evals' || entry.name === '.eval') continue
    if (entry.type === 'file') {
      const content = await fetchFileContent(entry.download_url)
      writeFileSync(join(destDir, entry.name), content, 'utf8')
    } else if (entry.type === 'dir') {
      const subDir = join(destDir, entry.name)
      mkdirSync(subDir, { recursive: true })
      const subEntries = await fetchSkillContents(`${name}/${entry.name}`)
      for (const sub of subEntries) {
        if (sub.type === 'file') {
          const content = await fetchFileContent(sub.download_url)
          writeFileSync(join(subDir, sub.name), content, 'utf8')
        }
      }
    }
  }
}

async function checkDir(dir, label) {
  if (!existsSync(dir)) return 0

  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .filter((e) => existsSync(join(dir, e.name, 'SKILL.md')))

  if (entries.length === 0) return 0

  let updated = 0
  for (const entry of entries) {
    const skillDir = join(dir, entry.name)
    const localVersion = getInstalledVersion(skillDir)

    const spinner = createSpinner(`Checking ${entry.name}...`)
    spinner.start()

    try {
      const remoteEntries = await fetchSkillContents(entry.name)
      const skillMdEntry = remoteEntries.find((e) => e.name === 'SKILL.md')
      if (!skillMdEntry) {
        spinner.stop(`${symbols.bullet} ${dim(`${entry.name} - not found in registry`)}`)
        continue
      }

      const remoteContent = await fetchFileContent(skillMdEntry.download_url)
      const remoteMatch = remoteContent.match(/^version:\s*(.+)$/m)
      const remoteVersion = remoteMatch ? remoteMatch[1].trim() : null

      if (localVersion === remoteVersion) {
        spinner.stop(`${symbols.bullet} ${dim(`${entry.name} v${localVersion} — up to date`)}`)
      } else {
        await reinstallSkill(entry.name, skillDir)
        spinner.stop(`${symbols.success} ${bold(entry.name)} ${dim(`v${localVersion}`)} → ${green(`v${remoteVersion}`)}`)
        updated++
      }
    } catch (err) {
      spinner.stop(`${symbols.error} ${entry.name} — ${err.message}`)
    }
  }

  return updated
}

export async function run({ flags }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot update')} - Update installed skills to latest versions

  ${dim('Usage:')} rubot update
    `)
    return
  }

  console.log()
  console.log(`  ${bold('Checking for updates...')}`)
  console.log()

  const localUpdated = await checkDir(getSkillsDir(false), 'local')
  const globalUpdated = await checkDir(getSkillsDir(true), 'global')
  const total = localUpdated + globalUpdated

  console.log()
  if (total === 0) {
    console.log(`  ${symbols.success} All skills are up to date`)
  } else {
    console.log(`  ${symbols.success} Updated ${bold(String(total))} skill(s)`)
  }
  console.log()
}
```

**Step 2: Commit**

```bash
git add cli/lib/commands/update.mjs
git commit -m "feat(cli): implement update command"
```

---

### Task 12: Build `init` Command

**Files:**
- Create: `cli/lib/commands/init.mjs`

**Step 1: Implement init command**

Generates a SKILL.md template for users creating their own skills.

Create `cli/lib/commands/init.mjs`:

```js
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { getSkillPath } from '../paths.mjs'
import { bold, dim, cyan, symbols, fatal } from '../ui.mjs'

const TEMPLATE = `---
name: {{NAME}}
version: 1.0.0
description: |
  Describe when this skill should activate. Include trigger phrases,
  tool names, and scenarios. Also describe what it should NOT activate for.
agents:
  - agent-name
---

# {{TITLE}}

> One-line summary of what this skill does

## When to Use

- Scenario 1
- Scenario 2

## Quick Reference

| Pattern | Example |
|---------|---------|
| ... | ... |

## Implementation Guide

### Step 1

Details here.
`

export async function run({ flags, positional }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot init')} - Create a new SKILL.md template

  ${dim('Usage:')} rubot init <name> [--global]

  ${dim('Examples:')}
    rubot init my-skill        Create .claude/skills/my-skill/SKILL.md
    rubot init my-skill -g     Create ~/.claude/skills/my-skill/SKILL.md
    `)
    return
  }

  const name = positional[0]
  if (!name) {
    fatal('Skill name required. Usage: rubot init <name>')
  }

  // Validate skill name
  if (!/^[a-z0-9-]+$/.test(name)) {
    fatal('Skill name must be lowercase alphanumeric with hyphens only')
  }

  const skillDir = getSkillPath(name, flags.global)

  if (existsSync(skillDir)) {
    fatal(`Skill directory already exists: ${skillDir}`)
  }

  const title = name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const content = TEMPLATE.replaceAll('{{NAME}}', name).replaceAll('{{TITLE}}', title)

  mkdirSync(skillDir, { recursive: true })
  writeFileSync(join(skillDir, 'SKILL.md'), content, 'utf8')

  console.log()
  console.log(`${symbols.success} Created ${bold(name)} skill template`)
  console.log(`  ${symbols.arrow} ${dim(join(skillDir, 'SKILL.md'))}`)
  console.log()
  console.log(`  ${dim('Edit the SKILL.md to add your skill content.')}`)
  console.log()
}
```

**Step 2: Test**

Run: `node cli/bin/cli.mjs init test-skill`
Expected: Creates `.claude/skills/test-skill/SKILL.md` with template content.

Verify: `cat .claude/skills/test-skill/SKILL.md` shows frontmatter with `name: test-skill`.

**Step 3: Clean up and commit**

```bash
rm -rf .claude/skills/test-skill
git add cli/lib/commands/init.mjs
git commit -m "feat(cli): implement init command for SKILL.md scaffolding"
```

---

### Task 13: End-to-End Integration Test

**Step 1: Make cli.mjs executable**

Run: `chmod +x cli/bin/cli.mjs`

**Step 2: Test all commands**

Run each command and verify output:

```bash
# Help
node cli/bin/cli.mjs --help
# Expected: Shows all 6 commands

# Version
node cli/bin/cli.mjs --version
# Expected: 1.0.0

# Search all
node cli/bin/cli.mjs search
# Expected: 26 skills listed

# Search filtered
node cli/bin/cli.mjs search seo
# Expected: ~5 SEO skills

# Add single
node cli/bin/cli.mjs add --skill biome -y
# Expected: ✓ Installed biome v1.1.0

# Add multiple
node cli/bin/cli.mjs add --skill drizzle-orm tanstack-router -y
# Expected: ✓ 2 skill(s) installed

# List
node cli/bin/cli.mjs ls
# Expected: Shows 3 installed skills

# Already installed
node cli/bin/cli.mjs add --skill biome -y
# Expected: • biome already installed

# Remove
node cli/bin/cli.mjs rm --skill biome -y
# Expected: ✓ Removed biome

# Init
node cli/bin/cli.mjs init test-skill
# Expected: ✓ Created test-skill skill template

# Clean up
rm -rf .claude/skills
```

**Step 3: Commit**

```bash
git add cli/bin/cli.mjs
git commit -m "feat(cli): make CLI executable and complete integration testing"
```

---

### Task 14: Final Polish

**Step 1: Add .gitignore for cli directory**

Create `cli/.gitignore`:

```
node_modules/
```

**Step 2: Verify package is ready for npm publish**

Run: `cd cli && npm pack --dry-run`
Expected: Shows files that would be included: `bin/cli.mjs`, `lib/**/*.mjs`, `package.json`

No `node_modules`, no test artifacts, no `.gitignore` in the tarball.

**Step 3: Commit**

```bash
git add cli/.gitignore
git commit -m "chore(cli): add gitignore and verify npm pack"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Package scaffold | `cli/package.json`, `cli/bin/cli.mjs` |
| 2 | UI utilities | `cli/lib/ui.mjs` |
| 3 | Path resolution | `cli/lib/paths.mjs` |
| 4 | GitHub fetcher | `cli/lib/github.mjs` |
| 5 | Registry catalog | `cli/lib/registry.mjs` |
| 6 | Argument parser | `cli/bin/cli.mjs` (rewrite) |
| 7 | `add` command | `cli/lib/commands/add.mjs` |
| 8 | `list` command | `cli/lib/commands/list.mjs` |
| 9 | `remove` command | `cli/lib/commands/remove.mjs` |
| 10 | `search` command | `cli/lib/commands/search.mjs` |
| 11 | `update` command | `cli/lib/commands/update.mjs` |
| 12 | `init` command | `cli/lib/commands/init.mjs` |
| 13 | E2E integration test | All files |
| 14 | Final polish | `cli/.gitignore` |

**Total: 11 files, 14 tasks, 0 dependencies.**
