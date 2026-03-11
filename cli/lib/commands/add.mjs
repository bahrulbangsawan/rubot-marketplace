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
