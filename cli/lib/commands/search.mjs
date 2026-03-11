import { searchSkills } from '../registry.mjs'
import { bold, dim, cyan, symbols } from '../ui.mjs'

export async function run({ flags, positional }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot search')} - Search available skills

  ${dim('Usage:')} rubot search [query]

  ${dim('Examples:')}
    rubot search           List all available skills
    rubot search seo       Find SEO-related skills
    rubot search tanstack  Find TanStack skills
    `)
    return
  }

  const query = positional[0] || ''
  const results = await searchSkills(query)

  console.log()
  if (results.length === 0) {
    console.log(`  ${dim(`No skills found for "${query}"`)}`)
    console.log()
    return
  }

  const maxName = Math.max(...results.map((s) => s.name.length))

  if (query) {
    console.log(`  ${bold(`Results for "${query}"`)} ${dim(`(${results.length} found)`)}`)
  } else {
    console.log(`  ${bold('Available skills')} ${dim(`(${results.length} total)`)}`)
  }
  console.log()

  for (const skill of results) {
    const padded = skill.name.padEnd(maxName + 2)
    console.log(`    ${cyan(padded)} ${skill.description}`)
  }

  console.log()
  console.log(`  ${dim(`Install with: ${cyan('npx rubot add --skill <name>')}`)}`)
  console.log()
}
