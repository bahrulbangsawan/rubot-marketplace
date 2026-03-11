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
