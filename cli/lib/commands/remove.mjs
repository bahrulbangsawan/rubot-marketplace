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
