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
