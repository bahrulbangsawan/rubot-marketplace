import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { getComponentCatalog, findComponent } from '../registry.mjs'
import {
  fetchSkillContents,
  fetchComponentFile,
  fetchFileContent,
  fetchHooksConfig,
} from '../github.mjs'
import { getComponentPath, getComponentDir, getSettingsPath } from '../paths.mjs'
import {
  bold,
  cyan,
  dim,
  green,
  symbols,
  fatal,
  createSpinner,
  confirm,
  multiSelect,
  ALL_TYPES,
  TYPE_LABELS,
} from '../ui.mjs'

// ── Mark already-installed items as disabled ──

function markInstalled(catalog, type, global) {
  if (type === 'hook') return markInstalledHooks(catalog, global)
  return catalog.map((item) => {
    const dest = getComponentPath(type, item.name, global)
    if (existsSync(dest)) {
      return { ...item, disabled: true, disabledReason: 'installed' }
    }
    return item
  })
}

function markInstalledHooks(catalog, global) {
  const settingsPath = getSettingsPath(global)
  let hooks = {}
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf8'))
      hooks = settings.hooks || {}
    } catch { /* ignore */ }
  }
  const allPrompts = Object.values(hooks).flat().map((h) => (h.prompt || '').toUpperCase())
  return catalog.map((item) => {
    const prefix = item.name.replace(/-/g, ' ').toUpperCase()
    if (allPrompts.some((p) => p.startsWith(prefix))) {
      return { ...item, disabled: true, disabledReason: 'installed' }
    }
    return item
  })
}

// ── Skill installation (directory with multiple files) ──

async function fetchAndWriteSkillFiles(skillPath, destDir, entries) {
  for (const entry of entries) {
    if (entry.name === 'evals' || entry.name === '.eval') continue

    if (entry.type === 'file') {
      const content = await fetchFileContent(entry.download_url)
      writeFileSync(join(destDir, entry.name), content, 'utf8')
    } else if (entry.type === 'dir') {
      const subDir = join(destDir, entry.name)
      mkdirSync(subDir, { recursive: true })
      const subEntries = await fetchSkillContents(`${skillPath}/${entry.name}`)
      await fetchAndWriteSkillFiles(`${skillPath}/${entry.name}`, subDir, subEntries)
    }
  }
}

function parseVersion(content) {
  const match = content.match(/^version:\s*(.+)$/m)
  return match ? match[1].trim() : 'unknown'
}

async function installSkill(name, global) {
  const destDir = getComponentPath('skill', name, global)
  if (existsSync(destDir)) {
    console.log(`  ${symbols.bullet} ${dim(`skill/${name} already installed`)}`)
    return false
  }

  const spinner = createSpinner(`Installing skill ${bold(name)}...`)
  spinner.start()

  const entries = await fetchSkillContents(name)
  mkdirSync(destDir, { recursive: true })
  await fetchAndWriteSkillFiles(name, destDir, entries)

  const skillMdPath = join(destDir, 'SKILL.md')
  const version = existsSync(skillMdPath)
    ? parseVersion(readFileSync(skillMdPath, 'utf8'))
    : 'unknown'

  spinner.stop(`  ${symbols.success} Installed skill/${bold(name)} ${dim(`v${version}`)}`)
  return true
}

// ── Single-file installation (commands, agents, templates) ──

async function installSingleFile(type, name, global) {
  const destPath = getComponentPath(type, name, global)
  if (existsSync(destPath)) {
    console.log(`  ${symbols.bullet} ${dim(`${type}/${name} already installed`)}`)
    return false
  }

  const spinner = createSpinner(`Installing ${type} ${bold(name)}...`)
  spinner.start()

  // Commands/agents: file is name.md; templates: file is name as-is
  const fileName = type === 'template' ? name : `${name}.md`
  const content = await fetchComponentFile(type, fileName)

  mkdirSync(dirname(destPath), { recursive: true })
  writeFileSync(destPath, content, 'utf8')

  spinner.stop(`  ${symbols.success} Installed ${type}/${bold(name)}`)
  return true
}

// ── Hook installation (merge into settings.json) ──

function buildHookLookup(remoteConfig, catalogHooks) {
  // Map marketplace hook names to their actual hook entries from hooks.json
  // by matching the hook name (kebab-case) to the prompt prefix (UPPER CASE)
  const result = new Map()
  for (const hook of catalogHooks) {
    const prefix = hook.name.replace(/-/g, ' ').toUpperCase()
    for (const [event, entries] of Object.entries(remoteConfig.hooks)) {
      for (const entry of entries) {
        if (entry.prompt.toUpperCase().startsWith(prefix)) {
          result.set(hook.name, { event, ...entry })
        }
      }
    }
  }
  return result
}

async function installHooks(hookNames, global) {
  const spinner = createSpinner('Installing hooks...')
  spinner.start()

  const remoteConfig = await fetchHooksConfig()
  const catalogHooks = await getComponentCatalog('hook')
  const lookup = buildHookLookup(remoteConfig, catalogHooks)

  const settingsPath = getSettingsPath(global)
  let settings = {}
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf8'))
    } catch {
      settings = {}
    }
  }
  if (!settings.hooks) settings.hooks = {}

  let installed = 0
  for (const hookName of hookNames) {
    const entry = lookup.get(hookName)
    if (!entry) continue

    const { event, matcher, type, prompt } = entry
    if (!settings.hooks[event]) settings.hooks[event] = []

    // Skip if already installed (match by prompt prefix)
    const prefix = hookName.replace(/-/g, ' ').toUpperCase()
    const already = settings.hooks[event].some((h) =>
      h.prompt.toUpperCase().startsWith(prefix)
    )
    if (already) {
      spinner.stop('')
      console.log(`  ${symbols.bullet} ${dim(`hook/${hookName} already installed`)}`)
      spinner.start()
      continue
    }

    const hookEntry = { type, prompt }
    if (matcher) hookEntry.matcher = matcher
    settings.hooks[event].push(hookEntry)
    installed++
  }

  mkdirSync(dirname(settingsPath), { recursive: true })
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8')

  spinner.stop(
    installed > 0
      ? `  ${symbols.success} Installed ${bold(String(installed))} hook(s) into settings.json`
      : ''
  )
  return installed
}

// ── Dependency resolution ──

async function resolveDependencies(toInstall, global) {
  // Collect all required skill names from components being installed
  const requiredSkills = new Set()
  for (const [type, names] of Object.entries(toInstall)) {
    if (type === 'hook' || type === 'template') continue
    const catalog = await getComponentCatalog(type)
    for (const name of names) {
      const item = catalog.find((c) => c.name === name)
      if (item?.requires) {
        for (const dep of item.requires) requiredSkills.add(dep)
      }
    }
  }

  if (requiredSkills.size === 0) return []

  // Remove skills already in the install list
  const explicitSkills = new Set(toInstall.skill || [])
  for (const name of explicitSkills) requiredSkills.delete(name)

  // Remove skills already installed locally
  const missing = []
  for (const name of requiredSkills) {
    const dest = getComponentPath('skill', name, global)
    if (!existsSync(dest)) missing.push(name)
  }

  return missing
}

// ── Unified installer ──

async function installComponents(toInstall, global) {
  const totalCount = Object.values(toInstall).reduce((sum, names) => sum + names.length, 0)
  if (totalCount === 0) {
    console.log(dim('  Nothing to install.'))
    return
  }

  // Auto-resolve skill dependencies
  const deps = await resolveDependencies(toInstall, global)
  if (deps.length > 0) {
    if (!toInstall.skill) toInstall.skill = []
    toInstall.skill.unshift(...deps)
    console.log()
    console.log(`  ${cyan('+')} ${bold(String(deps.length))} required skill(s): ${deps.join(', ')}`)
  }

  const finalCount = Object.values(toInstall).reduce((sum, names) => sum + names.length, 0)
  const location = global
    ? bold('global') + dim(' (~/.claude/)')
    : bold('local') + dim(' (.claude/)')
  console.log()
  console.log(`  Installing ${bold(String(finalCount))} component(s) to ${location}`)
  console.log()

  // Install skills first (dependencies before dependents)
  let installed = 0
  const orderedTypes = ['skill', ...Object.keys(toInstall).filter((t) => t !== 'skill')]
  for (const type of orderedTypes) {
    const names = toInstall[type]
    if (!names || names.length === 0) continue

    if (type === 'hook') {
      installed += await installHooks(names, global)
      continue
    }
    for (const name of names) {
      try {
        const ok =
          type === 'skill'
            ? await installSkill(name, global)
            : await installSingleFile(type, name, global)
        if (ok) installed++
      } catch (err) {
        console.error(`  ${symbols.error} Failed to install ${type}/${bold(name)}: ${err.message}`)
      }
    }
  }

  console.log()
  if (installed > 0) {
    console.log(`  ${symbols.success} ${bold(String(installed))} component(s) installed successfully`)
  }
}

// ── Exported command handler ──

export async function run({ flags, positional }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot add')} - Install components from rubot-marketplace

  ${dim('Usage:')}
    rubot add                              Interactive multi-select
    rubot add --type skill                 Multi-select skills
    rubot add --type skill drizzle-orm     Install specific skill
    rubot add --skill drizzle-orm          Install skill (shorthand)
    rubot add --type command --all         Install all commands
    rubot add --all                        Install everything

  ${dim('Options:')}
    --type, -t   Component type: skill, command, agent, hook, template
    --skill, -s  Skill name(s) — shorthand for --type skill <names>
    --all        Install all (of specified type, or everything)
    --global, -g Install to ~/.claude/
    --yes, -y    Skip confirmation
    `)
    return
  }

  const types = [...flags.types]
  const names = [...flags.skills, ...positional]

  // --skill flag implies --type skill
  if (flags.skills.length > 0 && types.length === 0) {
    types.push('skill')
  }

  // ── Direct install: names + type specified ──
  if (names.length > 0 && types.length > 0) {
    const type = types[0]
    if (!flags.yes) {
      const ok = await confirm(`  Install ${names.length} ${TYPE_LABELS[type].toLowerCase()}?`)
      if (!ok) {
        console.log(dim('  Cancelled.'))
        return
      }
    }
    await installComponents({ [type]: names }, flags.global)
    return
  }

  // ── Direct install: names without type — auto-detect ──
  if (names.length > 0 && types.length === 0) {
    const toInstall = {}
    for (const name of names) {
      let found = false
      for (const type of ALL_TYPES) {
        const match = await findComponent(type, name)
        if (match) {
          if (!toInstall[type]) toInstall[type] = []
          toInstall[type].push(name)
          found = true
          break
        }
      }
      if (!found) {
        console.error(`  ${symbols.error} "${name}" not found in any component type`)
      }
    }
    if (Object.keys(toInstall).length > 0) {
      await installComponents(toInstall, flags.global)
    }
    return
  }

  // ── --all: install everything (or all of specified types) ──
  if (flags.all) {
    const installTypes = types.length > 0 ? types : ALL_TYPES
    const toInstall = {}
    for (const type of installTypes) {
      const catalog = await getComponentCatalog(type)
      toInstall[type] = catalog.map((c) => c.name)
    }
    const totalCount = Object.values(toInstall).reduce((sum, n) => sum + n.length, 0)
    if (!flags.yes) {
      const ok = await confirm(`  Install all ${totalCount} components?`)
      if (!ok) {
        console.log(dim('  Cancelled.'))
        return
      }
    }
    await installComponents(toInstall, flags.global)
    return
  }

  // ── --type specified without names: multi-select items for those types ──
  if (types.length > 0 && names.length === 0) {
    if (!process.stdin.isTTY) {
      fatal('Interactive mode requires a terminal. Use named arguments or --all')
    }
    const toInstall = {}
    for (const type of types) {
      const catalog = await getComponentCatalog(type)
      if (catalog.length === 0) continue
      console.log()
      const items = markInstalled(catalog, type, flags.global)
      const selected = await multiSelect({
        items,
        message: `Select ${TYPE_LABELS[type].toLowerCase()} to install:`,
      })
      if (selected.length > 0) {
        toInstall[type] = selected.map((s) => s.name)
      }
    }
    if (Object.keys(toInstall).length > 0) {
      await installComponents(toInstall, flags.global)
    } else {
      console.log(dim('  Nothing selected.'))
    }
    return
  }

  // ── Fully interactive: pick types, then pick items ──
  if (!process.stdin.isTTY) {
    fatal('Interactive mode requires a terminal. Use --skill <name>, --type <type>, or --all')
  }

  // Step 1: fetch counts and let user pick types
  const typeItems = []
  for (const type of ALL_TYPES) {
    const catalog = await getComponentCatalog(type)
    typeItems.push({
      name: type,
      description: `${catalog.length} available`,
    })
  }

  console.log()
  const selectedTypes = await multiSelect({
    items: typeItems,
    message: 'What would you like to install?',
  })

  if (selectedTypes.length === 0) {
    console.log(dim('  Nothing selected.'))
    return
  }

  // Step 2: for each selected type, multi-select items
  const toInstall = {}
  for (const typeItem of selectedTypes) {
    const type = typeItem.name
    const catalog = await getComponentCatalog(type)
    if (catalog.length === 0) continue

    console.log()
    const items = markInstalled(catalog, type, flags.global)
    const selected = await multiSelect({
      items,
      message: `Select ${TYPE_LABELS[type].toLowerCase()} to install:`,
    })
    if (selected.length > 0) {
      toInstall[type] = selected.map((s) => s.name)
    }
  }

  if (Object.keys(toInstall).length === 0) {
    console.log(dim('  Nothing selected.'))
    return
  }

  // Step 3: summary and confirm
  const totalCount = Object.values(toInstall).reduce((sum, n) => sum + n.length, 0)
  console.log()
  console.log(`  ${bold('Summary:')}`)
  for (const [type, items] of Object.entries(toInstall)) {
    const names = items.length <= 3 ? items.join(', ') : `${items.slice(0, 3).join(', ')}...`
    console.log(`    ${bold(String(items.length))} ${TYPE_LABELS[type].toLowerCase()}: ${dim(names)}`)
  }
  console.log()

  if (!flags.yes) {
    const ok = await confirm(`  Install ${totalCount} component(s)?`)
    if (!ok) {
      console.log(dim('  Cancelled.'))
      return
    }
  }

  await installComponents(toInstall, flags.global)
}
