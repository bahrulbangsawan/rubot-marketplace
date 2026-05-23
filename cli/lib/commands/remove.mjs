import { existsSync, rmSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expandTargets, getComponentDir, getComponentPath, getSettingsPath } from '../paths.mjs'
import {
  bold,
  cyan,
  dim,
  symbols,
  fatal,
  confirm,
  multiSelect,
  ALL_TYPES,
  TYPE_LABELS,
} from '../ui.mjs'

// ── Scan installed components by type ──

function getInstalledSkills(global, target) {
  const dir = getComponentDir('skill', global, target)
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'SKILL.md')))
    .map((e) => {
      const content = readFileSync(join(dir, e.name, 'SKILL.md'), 'utf8')
      const version = content.match(/^version:\s*(.+)$/m)?.[1]?.trim() || '?'
      return { name: e.name, description: `v${version}` }
    })
}

function getInstalledFiles(type, global, target) {
  const dir = getComponentDir(type, global, target)
  if (!existsSync(dir)) return []
  const ext = type === 'template' ? '' : '.md'
  return readdirSync(dir)
    .filter((f) => (type === 'template' ? f.includes('.') : f.endsWith('.md')))
    .map((f) => {
      const name = ext ? f.slice(0, -ext.length) : f
      return { name, description: type }
    })
}

function getInstalledHooks(global, target) {
  const settingsPath = getSettingsPath(global, target)
  if (!existsSync(settingsPath)) return []
  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'))
    if (!settings.hooks) return []
    const installed = []
    for (const [event, entries] of Object.entries(settings.hooks)) {
      for (const entry of entries) {
        // New format: { matcher, hooks: [{ type, prompt }] }
        const innerHook = (entry.hooks || [])[0]
        if (!innerHook) continue
        const colonIdx = innerHook.prompt.indexOf(':')
        if (colonIdx > 0) {
          const prefix = innerHook.prompt.slice(0, colonIdx).trim()
          const name = prefix.toLowerCase().replace(/\s+/g, '-')
          installed.push({ name, description: `${event} hook` })
        }
      }
    }
    return installed
  } catch {
    return []
  }
}

function getInstalledComponents(type, global, target) {
  if (type === 'skill') return getInstalledSkills(global, target)
  if (type === 'hook') return getInstalledHooks(global, target)
  return getInstalledFiles(type, global, target)
}

// ── Remove functions ──

function removeSkill(name, global, target) {
  const dir = getComponentPath('skill', name, global, target)
  if (!existsSync(dir)) return false
  rmSync(dir, { recursive: true })
  return true
}

function removeSingleFile(type, name, global, target) {
  const path = getComponentPath(type, name, global, target)
  if (!existsSync(path)) return false
  rmSync(path)
  return true
}

function removeHooks(hookNames, global, target) {
  const settingsPath = getSettingsPath(global, target)
  if (!existsSync(settingsPath)) return 0
  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'))
    if (!settings.hooks) return 0

    let removed = 0
    for (const hookName of hookNames) {
      const prefix = hookName.replace(/-/g, ' ').toUpperCase()
      for (const [event, entries] of Object.entries(settings.hooks)) {
        const before = entries.length
        settings.hooks[event] = entries.filter((entry) => {
          const innerHook = (entry.hooks || [])[0]
          return !innerHook || !innerHook.prompt.toUpperCase().startsWith(prefix)
        })
        removed += before - settings.hooks[event].length
        if (settings.hooks[event].length === 0) delete settings.hooks[event]
      }
    }

    if (Object.keys(settings.hooks).length === 0) delete settings.hooks
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8')
    return removed
  } catch {
    return 0
  }
}

function removeComponents(toRemove, global, target) {
  let totalRemoved = 0

  for (const [type, names] of Object.entries(toRemove)) {
    if (type === 'hook') {
      const count = removeHooks(names, global, target)
      if (count > 0) {
        console.log(`  ${symbols.success} Removed ${bold(String(count))} hook(s) from settings.json`)
      }
      totalRemoved += count
      continue
    }

    for (const name of names) {
      const ok = type === 'skill' ? removeSkill(name, global, target) : removeSingleFile(type, name, global, target)
      if (ok) {
        console.log(`  ${symbols.success} Removed ${type}/${bold(name)}`)
        totalRemoved++
      } else {
        console.log(`  ${symbols.bullet} ${dim(`${type}/${name} not found`)}`)
      }
    }
  }

  return totalRemoved
}

// ── Exported command handler ──

export async function run({ flags, positional }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot remove')} - Uninstall components

  ${dim('Usage:')}
    rubot remove                                  Interactive multi-select
    rubot remove --type skill drizzle-orm          Remove specific skill
    rubot remove --skill drizzle-orm               Remove skill (shorthand)
    rubot remove --type command --all              Remove all commands
    rubot remove --all                             Remove everything

  ${dim('Alias:')} rubot rm

  ${dim('Options:')}
    --type, -t   Component type: skill, command, agent, hook, template
    --skill, -s  Skill name(s) — shorthand for --type skill
    --all        Remove all (of specified type, or everything)
    --global, -g Remove globally (~/.claude/ or ~/.codex/)
    --target     Target runtime: claude, codex, or both
    --yes, -y    Skip confirmation
    `)
    return
  }

  const types = [...flags.types]
  const names = [...flags.skills, ...positional]
  const global = flags.global
  const targets = expandTargets(flags.target)

  // --skill flag implies --type skill
  if (flags.skills.length > 0 && types.length === 0) {
    types.push('skill')
  }

  // ── Direct remove: names + type specified ──
  if (names.length > 0 && types.length > 0) {
    const type = types[0]
    if (!flags.yes) {
      const ok = await confirm(`  Remove ${names.length} ${TYPE_LABELS[type].toLowerCase()}?`)
      if (!ok) {
        console.log(dim('  Cancelled.'))
        return
      }
    }
    console.log()
    for (const target of targets) {
      removeComponents({ [type]: names }, global, target)
    }
    return
  }

  // ── Direct remove: names without type — auto-detect from installed ──
  if (names.length > 0 && types.length === 0) {
    const toRemove = {}
    for (const name of names) {
      let found = false
      for (const type of ALL_TYPES) {
        const installed = getInstalledComponents(type, global, targets[0])
        if (installed.some((c) => c.name === name)) {
          if (!toRemove[type]) toRemove[type] = []
          toRemove[type].push(name)
          found = true
          break
        }
      }
      if (!found) {
        console.log(`  ${symbols.bullet} ${dim(`"${name}" is not installed`)}`)
      }
    }
    if (Object.keys(toRemove).length > 0) {
      console.log()
      for (const target of targets) {
        removeComponents(toRemove, global, target)
      }
    }
    return
  }

  // ── --all: remove everything (or all of specified types) ──
  if (flags.all) {
    const removeTypes = types.length > 0 ? types : ALL_TYPES
    const toRemove = {}
    for (const type of removeTypes) {
      const installed = getInstalledComponents(type, global, targets[0])
      if (installed.length > 0) {
        toRemove[type] = installed.map((c) => c.name)
      }
    }
    const totalCount = Object.values(toRemove).reduce((sum, n) => sum + n.length, 0)
    if (totalCount === 0) {
      console.log(dim('  Nothing to remove.'))
      return
    }
    if (!flags.yes) {
      const ok = await confirm(`  Remove all ${totalCount} installed component(s)?`)
      if (!ok) {
        console.log(dim('  Cancelled.'))
        return
      }
    }
    console.log()
    for (const target of targets) {
      removeComponents(toRemove, global, target)
    }
    return
  }

  // ── --type specified without names: multi-select installed items ──
  if (types.length > 0 && names.length === 0) {
    if (!process.stdin.isTTY) {
      fatal('Interactive mode requires a terminal. Use named arguments or --all')
    }
    const toRemove = {}
    for (const type of types) {
      const installed = getInstalledComponents(type, global, targets[0])
      if (installed.length === 0) {
        console.log(`  ${dim(`No ${TYPE_LABELS[type].toLowerCase()} installed.`)}`)
        continue
      }
      console.log()
      const selected = await multiSelect({
        items: installed,
        message: `Select ${TYPE_LABELS[type].toLowerCase()} to remove:`,
      })
      if (selected.length > 0) {
        toRemove[type] = selected.map((s) => s.name)
      }
    }
    if (Object.keys(toRemove).length > 0) {
      const totalCount = Object.values(toRemove).reduce((sum, n) => sum + n.length, 0)
      if (!flags.yes) {
        const ok = await confirm(`  Remove ${totalCount} component(s)?`)
        if (!ok) {
          console.log(dim('  Cancelled.'))
          return
        }
      }
      console.log()
      for (const target of targets) {
        removeComponents(toRemove, global, target)
      }
    }
    return
  }

  // ── Fully interactive ──
  if (!process.stdin.isTTY) {
    fatal('Interactive mode requires a terminal. Use --skill <name>, --type <type>, or --all')
  }

  // Step 1: find installed components by type
  const installedByType = {}
  for (const type of ALL_TYPES) {
    const items = getInstalledComponents(type, global, targets[0])
    if (items.length > 0) installedByType[type] = items
  }

  if (Object.keys(installedByType).length === 0) {
    console.log()
    console.log(`  ${dim('No components installed.')}`)
    console.log(`  ${dim(`Run ${cyan('rubot add')} to install components.`)}`)
    console.log()
    return
  }

  // Step 2: pick types
  const typeItems = Object.entries(installedByType).map(([type, items]) => ({
    name: type,
    description: `${items.length} installed`,
  }))

  console.log()
  const selectedTypes = await multiSelect({
    items: typeItems,
    message: 'What would you like to remove?',
  })

  if (selectedTypes.length === 0) {
    console.log(dim('  Nothing selected.'))
    return
  }

  // Step 3: for each type, multi-select items to remove
  const toRemove = {}
  for (const typeItem of selectedTypes) {
    const type = typeItem.name
    const installed = installedByType[type]

    console.log()
    const selected = await multiSelect({
      items: installed,
      message: `Select ${TYPE_LABELS[type].toLowerCase()} to remove:`,
    })
    if (selected.length > 0) {
      toRemove[type] = selected.map((s) => s.name)
    }
  }

  if (Object.keys(toRemove).length === 0) {
    console.log(dim('  Nothing selected.'))
    return
  }

  // Step 4: confirm and remove
  const totalCount = Object.values(toRemove).reduce((sum, n) => sum + n.length, 0)
  console.log()
  if (!flags.yes) {
    const ok = await confirm(`  Remove ${totalCount} component(s)?`)
    if (!ok) {
      console.log(dim('  Cancelled.'))
      return
    }
  }

  console.log()
  let removed = 0
  for (const target of targets) {
    removed += removeComponents(toRemove, global, target)
  }
  console.log()
  if (removed > 0) {
    console.log(`  ${symbols.success} ${bold(String(removed))} component(s) removed`)
  }
}
