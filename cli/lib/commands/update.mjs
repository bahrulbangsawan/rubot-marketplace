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
