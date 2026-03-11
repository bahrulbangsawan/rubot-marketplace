import {
  readdirSync,
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { getComponentDir, getComponentPath, getSettingsPath } from '../paths.mjs'
import {
  fetchSkillContents,
  fetchFileContent,
  fetchComponentFile,
  fetchHooksConfig,
} from '../github.mjs'
import { getComponentCatalog } from '../registry.mjs'
import { bold, dim, cyan, green, symbols, createSpinner, ALL_TYPES, TYPE_LABELS } from '../ui.mjs'

// ── Skills: version-compared update ──

async function updateSkills(global) {
  const dir = getComponentDir('skill', global)
  if (!existsSync(dir)) return 0

  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'SKILL.md')))

  if (entries.length === 0) return 0

  let updated = 0
  for (const entry of entries) {
    const skillDir = join(dir, entry.name)
    const localContent = readFileSync(join(skillDir, 'SKILL.md'), 'utf8')
    const localVersion = localContent.match(/^version:\s*(.+)$/m)?.[1]?.trim()

    const spinner = createSpinner(`Checking skill/${entry.name}...`)
    spinner.start()

    try {
      const remoteEntries = await fetchSkillContents(entry.name)
      const skillMdEntry = remoteEntries.find((e) => e.name === 'SKILL.md')
      if (!skillMdEntry) {
        spinner.stop(`  ${symbols.bullet} ${dim(`skill/${entry.name} — not in registry`)}`)
        continue
      }

      const remoteContent = await fetchFileContent(skillMdEntry.download_url)
      const remoteVersion = remoteContent.match(/^version:\s*(.+)$/m)?.[1]?.trim()

      if (localVersion === remoteVersion) {
        spinner.stop(`  ${symbols.bullet} ${dim(`skill/${entry.name} v${localVersion} — up to date`)}`)
      } else {
        // Re-download entire skill directory
        rmSync(skillDir, { recursive: true })
        mkdirSync(skillDir, { recursive: true })
        for (const re of remoteEntries) {
          if (re.name === 'evals' || re.name === '.eval') continue
          if (re.type === 'file') {
            const content = await fetchFileContent(re.download_url)
            writeFileSync(join(skillDir, re.name), content, 'utf8')
          } else if (re.type === 'dir') {
            const subDir = join(skillDir, re.name)
            mkdirSync(subDir, { recursive: true })
            const subEntries = await fetchSkillContents(`${entry.name}/${re.name}`)
            for (const sub of subEntries) {
              if (sub.type === 'file') {
                const content = await fetchFileContent(sub.download_url)
                writeFileSync(join(subDir, sub.name), content, 'utf8')
              }
            }
          }
        }
        spinner.stop(
          `  ${symbols.success} ${bold(`skill/${entry.name}`)} ${dim(`v${localVersion}`)} → ${green(`v${remoteVersion}`)}`
        )
        updated++
      }
    } catch (err) {
      spinner.stop(`  ${symbols.error} skill/${entry.name} — ${err.message}`)
    }
  }

  return updated
}

// ── Single-file components: always re-download ──

async function updateFiles(type, global) {
  const dir = getComponentDir(type, global)
  if (!existsSync(dir)) return 0

  const ext = type === 'template' ? '' : '.md'
  const files = readdirSync(dir).filter((f) =>
    type === 'template' ? f.includes('.') : f.endsWith('.md')
  )

  if (files.length === 0) return 0

  let updated = 0
  for (const file of files) {
    const name = ext ? file.slice(0, -ext.length) : file
    const filePath = join(dir, file)
    const localContent = readFileSync(filePath, 'utf8')

    const spinner = createSpinner(`Checking ${type}/${name}...`)
    spinner.start()

    try {
      const remoteContent = await fetchComponentFile(type, file)
      if (localContent === remoteContent) {
        spinner.stop(`  ${symbols.bullet} ${dim(`${type}/${name} — up to date`)}`)
      } else {
        writeFileSync(filePath, remoteContent, 'utf8')
        spinner.stop(`  ${symbols.success} ${bold(`${type}/${name}`)} — ${green('updated')}`)
        updated++
      }
    } catch (err) {
      spinner.stop(`  ${symbols.error} ${type}/${name} — ${err.message}`)
    }
  }

  return updated
}

// ── Hooks: re-merge from remote ──

async function updateHooks(global) {
  const settingsPath = getSettingsPath(global)
  if (!existsSync(settingsPath)) return 0

  let settings
  try {
    settings = JSON.parse(readFileSync(settingsPath, 'utf8'))
  } catch {
    return 0
  }
  if (!settings.hooks) return 0

  const spinner = createSpinner('Checking hooks...')
  spinner.start()

  try {
    const remoteConfig = await fetchHooksConfig()
    let updated = 0

    // For each installed hook, check if the prompt has changed
    for (const [event, localEntries] of Object.entries(settings.hooks)) {
      const remoteEntries = remoteConfig.hooks[event] || []

      for (let i = 0; i < localEntries.length; i++) {
        const local = localEntries[i]
        const colonIdx = local.prompt.indexOf(':')
        if (colonIdx <= 0) continue

        const prefix = local.prompt.slice(0, colonIdx).trim().toUpperCase()

        // Find matching remote entry
        const remote = remoteEntries.find((r) => r.prompt.toUpperCase().startsWith(prefix))
        if (remote && remote.prompt !== local.prompt) {
          localEntries[i] = { ...local, prompt: remote.prompt }
          if (remote.matcher) localEntries[i].matcher = remote.matcher
          updated++
        }
      }
    }

    if (updated > 0) {
      writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8')
    }

    spinner.stop(
      updated > 0
        ? `  ${symbols.success} Updated ${bold(String(updated))} hook(s)`
        : `  ${symbols.bullet} ${dim('hooks — up to date')}`
    )
    return updated
  } catch (err) {
    spinner.stop(`  ${symbols.error} hooks — ${err.message}`)
    return 0
  }
}

// ── Command handler ──

export async function run({ flags }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot update')} - Update installed components to latest versions

  ${dim('Usage:')}
    rubot update                 Update everything
    rubot update --type skill    Update only skills

  ${dim('Options:')}
    --type, -t   Filter by component type
    `)
    return
  }

  const types = flags.types.length > 0 ? flags.types : ALL_TYPES

  console.log()
  console.log(`  ${bold('Checking for updates...')}`)
  console.log()

  let totalUpdated = 0

  for (const global of [false, true]) {
    for (const type of types) {
      if (type === 'skill') totalUpdated += await updateSkills(global)
      else if (type === 'hook') totalUpdated += await updateHooks(global)
      else totalUpdated += await updateFiles(type, global)
    }
  }

  console.log()
  if (totalUpdated === 0) {
    console.log(`  ${symbols.success} All components are up to date`)
  } else {
    console.log(`  ${symbols.success} Updated ${bold(String(totalUpdated))} component(s)`)
  }
  console.log()
}
