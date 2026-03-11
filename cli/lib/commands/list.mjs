import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { getComponentDir, getSettingsPath } from '../paths.mjs'
import { bold, dim, cyan, symbols, ALL_TYPES, TYPE_LABELS } from '../ui.mjs'

// ── Scan installed components ──

function getInstalledSkills(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'SKILL.md')))
    .map((e) => {
      const content = readFileSync(join(dir, e.name, 'SKILL.md'), 'utf8')
      const version = content.match(/^version:\s*(.+)$/m)?.[1]?.trim() || '?'
      const desc = content.match(/^description:\s*\|?\s*\n?\s*(.+)$/m)?.[1]?.trim().slice(0, 55) || ''
      return { name: e.name, version, description: desc }
    })
}

function getInstalledFiles(type, dir) {
  if (!existsSync(dir)) return []
  const ext = type === 'template' ? '' : '.md'
  return readdirSync(dir)
    .filter((f) => (type === 'template' ? f.includes('.') : f.endsWith('.md')))
    .map((f) => {
      const name = ext ? f.slice(0, -ext.length) : f
      const content = readFileSync(join(dir, f), 'utf8')
      const desc = content.match(/^description:\s*(.+)$/m)?.[1]?.trim().slice(0, 55) || ''
      return { name, description: desc }
    })
}

function getInstalledHooks(settingsPath) {
  if (!existsSync(settingsPath)) return []
  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'))
    if (!settings.hooks) return []
    const installed = []
    for (const [event, entries] of Object.entries(settings.hooks)) {
      for (const entry of entries) {
        const colonIdx = entry.prompt.indexOf(':')
        if (colonIdx > 0) {
          const prefix = entry.prompt.slice(0, colonIdx).trim()
          const name = prefix.toLowerCase().replace(/\s+/g, '-')
          installed.push({ name, description: `${event}` })
        }
      }
    }
    return installed
  } catch {
    return []
  }
}

function getInstalled(type, global) {
  if (type === 'skill') return getInstalledSkills(getComponentDir('skill', global))
  if (type === 'hook') return getInstalledHooks(getSettingsPath(global))
  return getInstalledFiles(type, getComponentDir(type, global))
}

// ── Command handler ──

export async function run({ flags }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot list')} - Show installed components

  ${dim('Usage:')}
    rubot list                 Show all installed components
    rubot list --type skill    Show only installed skills

  ${dim('Alias:')} rubot ls

  ${dim('Options:')}
    --type, -t   Filter by component type
    `)
    return
  }

  const types = flags.types.length > 0 ? flags.types : ALL_TYPES
  console.log()

  let totalCount = 0

  for (const global of [false, true]) {
    const scopeLabel = global ? 'Global' : 'Local'
    const scopePath = global ? '~/.claude/' : '.claude/'
    let scopeItems = 0

    const sections = []
    for (const type of types) {
      const items = getInstalled(type, global)
      if (items.length > 0) {
        sections.push({ type, items })
        scopeItems += items.length
      }
    }

    if (scopeItems === 0) continue

    console.log(`  ${bold(scopeLabel)} ${dim(`(${scopePath})`)}`)
    console.log()

    for (const { type, items } of sections) {
      console.log(`    ${bold(TYPE_LABELS[type])} ${dim(`(${items.length})`)}`)
      const maxName = Math.max(...items.map((i) => i.name.length), 5)
      for (const item of items) {
        const version = item.version ? dim(` v${item.version}`) : ''
        const padded = item.name.padEnd(maxName + 2)
        console.log(`      ${cyan(padded)}${version}  ${dim(item.description || '')}`)
      }
      console.log()
    }

    totalCount += scopeItems
  }

  if (totalCount === 0) {
    console.log(`  ${dim('No components installed.')}`)
    console.log(`  ${dim(`Run ${cyan('rubot add')} to get started.`)}`)
    console.log()
  }
}
