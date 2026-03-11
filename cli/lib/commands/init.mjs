import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { getSkillPath } from '../paths.mjs'
import { bold, dim, cyan, green, yellow, symbols, fatal, confirm, choose } from '../ui.mjs'

// ─── Templates ─────────────────────────────────────────────────────────────────

const CLAUDE_MD_TEMPLATE = `# Project Guidelines

> Instructions for AI agents working in this codebase.

## Project Overview

**Name**: {{PROJECT_NAME}}
**Type**: <!-- e.g., Web App, API, CLI, Library -->
**Stack**: <!-- e.g., TypeScript, React, Node.js, PostgreSQL -->

## Quick Start

\`\`\`bash
# Install dependencies
{{INSTALL_CMD}}

# Start development
{{DEV_CMD}}

# Build for production
{{BUILD_CMD}}

# Run tests
{{TEST_CMD}}

# Lint & format
{{LINT_CMD}}
\`\`\`

## Code Style

- **Formatting**: <!-- e.g., Prettier, Biome -->
- **Linting**: <!-- e.g., ESLint, Biome -->
- **Naming**: <!-- e.g., camelCase for functions, PascalCase for components -->

## Commit Convention

\`\`\`
type(scope): description

# Types: feat | fix | docs | style | refactor | test | chore
# Example: feat(auth): add OAuth2 login flow
\`\`\`

## Key Files

| File | Purpose |
|------|---------|
| \`{{PACKAGE_FILE}}\` | Dependencies and scripts |
| \`{{CONFIG_FILE}}\` | Project configuration |
| \`.env.example\` | Environment variables |

## Directory Structure

\`\`\`
{{PROJECT_NAME}}/
├── src/           # Source code
├── tests/         # Test files
├── public/        # Static assets
└── scripts/       # Build/deploy scripts
\`\`\`

## Rules

### DO
- Follow existing patterns in the file you're editing
- Run linter before committing
- Write tests for new features
- Keep functions small and focused

### DON'T
- Add dependencies without checking existing ones
- Ignore TypeScript/linter errors
- Over-engineer simple solutions
- Commit sensitive data (.env, credentials)

## Validation Checklist

Before completing any task:

\`\`\`bash
{{LINT_CMD}}    # No lint errors
{{TEST_CMD}}    # Tests pass
{{BUILD_CMD}}   # Build succeeds
\`\`\`
`

const AGENTS_MD_ROOT_TEMPLATE = `# AGENTS.md

> Universal guidance for AI agents. Nearest AGENTS.md wins — check subdirectories for specifics.

## Project Overview

**Name**: {{PROJECT_NAME}}
**Type**: <!-- e.g., Web App, CLI Tool, Library, Monorepo -->
**Stack**: <!-- e.g., TypeScript, React, Node.js -->

## Quick Start

\`\`\`bash
{{INSTALL_CMD}}    # Install dependencies
{{DEV_CMD}}        # Start development
{{BUILD_CMD}}      # Build for production
{{TEST_CMD}}       # Run tests
{{LINT_CMD}}       # Lint & format
\`\`\`

## Directory Map

| Path | Purpose | Has AGENTS.md |
|------|---------|---------------|
| \`src/\` | Source code | No |
| \`tests/\` | Test files | No |
| \`docs/\` | Documentation | No |

## Universal Rules

### DO
- Read nearest AGENTS.md before making changes
- Run linter before committing
- Follow existing patterns in the file you're editing

### DON'T
- Create new files without checking existing structure
- Add dependencies without checking existing ones
- Ignore TypeScript/linter errors
- Over-engineer simple solutions

## Code Style

- **Formatting**: <!-- e.g., Prettier, Biome -->
- **Linting**: <!-- e.g., ESLint, Biome -->
- **Naming**: <!-- e.g., camelCase for functions, PascalCase for components -->

## Commit Convention

\`\`\`
type(scope): description

# Types: feat | fix | docs | style | refactor | test | chore
\`\`\`

## Key Files

| File | Purpose | Read When |
|------|---------|-----------|
| \`{{PACKAGE_FILE}}\` | Dependencies | Adding packages |
| \`{{CONFIG_FILE}}\` | Project config | Setting up or configuring |
| \`.env.example\` | Environment vars | Configuring secrets |

## Sub-Agents Index

<!-- Add subdirectory AGENTS.md files as your project grows -->

| Domain | Path | Description |
|--------|------|-------------|
| <!-- e.g., API --> | \`src/api/AGENTS.md\` | <!-- API-specific rules --> |

## Validation Checklist

Before completing any task:

\`\`\`bash
{{LINT_CMD}}    # No lint errors
{{TEST_CMD}}    # Tests pass
{{BUILD_CMD}}   # Build succeeds
\`\`\`

---

> **Token Budget**: Keep this file under 200 lines. Move details to sub-AGENTS.md files.
`

const SKILL_TEMPLATE = `---
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function detectProjectInfo() {
  const cwd = process.cwd()
  const name = cwd.split('/').pop() || 'my-project'

  // Detect package manager and scripts
  let installCmd = 'npm install'
  let devCmd = 'npm run dev'
  let buildCmd = 'npm run build'
  let testCmd = 'npm test'
  let lintCmd = 'npm run lint'
  let packageFile = 'package.json'
  let configFile = 'tsconfig.json'

  // Check for bun
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) {
    installCmd = 'bun install'
    devCmd = 'bun run dev'
    buildCmd = 'bun run build'
    testCmd = 'bun test'
    lintCmd = 'bun run lint'
  }
  // Check for pnpm
  else if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
    installCmd = 'pnpm install'
    devCmd = 'pnpm dev'
    buildCmd = 'pnpm build'
    testCmd = 'pnpm test'
    lintCmd = 'pnpm lint'
  }
  // Check for yarn
  else if (existsSync(join(cwd, 'yarn.lock'))) {
    installCmd = 'yarn'
    devCmd = 'yarn dev'
    buildCmd = 'yarn build'
    testCmd = 'yarn test'
    lintCmd = 'yarn lint'
  }

  // Check for tsconfig
  if (!existsSync(join(cwd, 'tsconfig.json'))) {
    if (existsSync(join(cwd, 'jsconfig.json'))) configFile = 'jsconfig.json'
    else configFile = 'package.json'
  }

  return { name, installCmd, devCmd, buildCmd, testCmd, lintCmd, packageFile, configFile }
}

function applyProjectVars(template, info) {
  return template
    .replaceAll('{{PROJECT_NAME}}', info.name)
    .replaceAll('{{INSTALL_CMD}}', info.installCmd)
    .replaceAll('{{DEV_CMD}}', info.devCmd)
    .replaceAll('{{BUILD_CMD}}', info.buildCmd)
    .replaceAll('{{TEST_CMD}}', info.testCmd)
    .replaceAll('{{LINT_CMD}}', info.lintCmd)
    .replaceAll('{{PACKAGE_FILE}}', info.packageFile)
    .replaceAll('{{CONFIG_FILE}}', info.configFile)
}

function titleCase(name) {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ─── Sub-commands ──────────────────────────────────────────────────────────────

function generateClaudeMd() {
  const outPath = join(process.cwd(), 'CLAUDE.md')
  const info = detectProjectInfo()
  const content = applyProjectVars(CLAUDE_MD_TEMPLATE, info)

  if (existsSync(outPath)) {
    fatal(`CLAUDE.md already exists. Delete it first or edit it directly.`)
  }

  writeFileSync(outPath, content, 'utf8')
  console.log()
  console.log(`${symbols.success} Created ${bold('CLAUDE.md')}`)
  console.log(`  ${symbols.arrow} ${dim(outPath)}`)
  console.log()
  console.log(`  ${dim('Edit the file to add your project-specific instructions.')}`)
  console.log()
}

function generateAgentsMd(targetDir) {
  const dir = targetDir ? resolve(process.cwd(), targetDir) : process.cwd()
  const outPath = join(dir, 'AGENTS.md')
  const info = detectProjectInfo()
  const content = applyProjectVars(AGENTS_MD_ROOT_TEMPLATE, info)

  if (existsSync(outPath)) {
    fatal(`AGENTS.md already exists at ${outPath}. Delete it first or edit it directly.`)
  }

  mkdirSync(dir, { recursive: true })
  writeFileSync(outPath, content, 'utf8')
  console.log()
  console.log(`${symbols.success} Created ${bold('AGENTS.md')}`)
  console.log(`  ${symbols.arrow} ${dim(outPath)}`)
  console.log()
  console.log(`  ${dim('Edit the file to add agent guidance for this directory.')}`)
  console.log()
}

function generateSkillMd(name, global) {
  if (!name) {
    fatal('Skill name required. Usage: rubot init skill <name>')
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    fatal('Skill name must be lowercase alphanumeric with hyphens only')
  }

  const skillDir = getSkillPath(name, global)

  if (existsSync(skillDir)) {
    fatal(`Skill directory already exists: ${skillDir}`)
  }

  const title = titleCase(name)
  const content = SKILL_TEMPLATE.replaceAll('{{NAME}}', name).replaceAll('{{TITLE}}', title)

  mkdirSync(skillDir, { recursive: true })
  writeFileSync(join(skillDir, 'SKILL.md'), content, 'utf8')

  console.log()
  console.log(`${symbols.success} Created ${bold(name)} skill template`)
  console.log(`  ${symbols.arrow} ${dim(join(skillDir, 'SKILL.md'))}`)
  console.log()
  console.log(`  ${dim('Edit the SKILL.md to add your skill content.')}`)
  console.log()
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export async function run({ flags, positional }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot init')} - Generate project configuration files

  ${dim('Usage:')} rubot init [type] [options]

  ${dim('Types:')}
    ${dim('(default)')}       CLAUDE.md — project instructions for Claude Code
    claude           CLAUDE.md explicitly
    agents           AGENTS.md — hierarchical agent guidance
    agents <path>    AGENTS.md in a subdirectory
    skill <name>     SKILL.md template for a custom skill

  ${dim('Options:')}
    --global, -g     Install globally (~/.claude/) — only for skill type

  ${dim('Examples:')}
    rubot init                   Interactive — choose CLAUDE.md or AGENTS.md
    rubot init claude            Generate CLAUDE.md in current directory
    rubot init agents            Generate root AGENTS.md
    rubot init agents src/api    Generate AGENTS.md in src/api/
    rubot init skill my-skill    Create .claude/skills/my-skill/SKILL.md
    `)
    return
  }

  const type = positional[0]?.toLowerCase()

  // Direct type specified
  if (type === 'claude') {
    return generateClaudeMd()
  }
  if (type === 'agents') {
    return generateAgentsMd(positional[1])
  }
  if (type === 'skill') {
    return generateSkillMd(positional[1], flags.global)
  }

  // Unknown positional — treat as skill name for backward compat
  if (type && /^[a-z0-9-]+$/.test(type)) {
    return generateSkillMd(type, flags.global)
  }

  // No argument — interactive choice (default: CLAUDE.md)
  const choice = await choose('What would you like to generate?', [
    'CLAUDE.md  — project instructions for Claude Code',
    'AGENTS.md  — hierarchical agent guidance',
    'SKILL.md   — custom skill template',
  ])

  if (choice === 0) {
    return generateClaudeMd()
  }
  if (choice === 1) {
    return generateAgentsMd()
  }
  if (choice === 2) {
    const { createInterface } = await import('node:readline')
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const name = await new Promise((resolve) => {
      rl.question(`  ${dim('Skill name (lowercase-with-hyphens):')} `, (answer) => {
        rl.close()
        resolve(answer.trim())
      })
    })
    return generateSkillMd(name, flags.global)
  }
}
