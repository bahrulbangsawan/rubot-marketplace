import { searchComponents } from '../registry.mjs'
import { bold, dim, cyan, ALL_TYPES, TYPE_LABELS } from '../ui.mjs'

export async function run({ flags, positional }) {
  if (flags.help) {
    console.log(`
  ${bold('rubot search')} - Search available components

  ${dim('Usage:')}
    rubot search                   List everything
    rubot search seo               Search across all types
    rubot search --type skill seo  Search only skills

  ${dim('Options:')}
    --type, -t   Filter by component type
    `)
    return
  }

  const query = positional[0] || ''
  const types = flags.types.length > 0 ? flags.types : ALL_TYPES

  console.log()

  let totalResults = 0

  for (const type of types) {
    const results = await searchComponents(type, query)
    if (results.length === 0) continue

    console.log(`  ${bold(TYPE_LABELS[type])} ${dim(`(${results.length})`)}`)
    console.log()

    const maxName = Math.max(...results.map((s) => s.name.length), 5)
    for (const item of results) {
      const padded = item.name.padEnd(maxName + 2)
      console.log(`    ${cyan(padded)} ${dim(item.description || '')}`)
    }
    console.log()
    totalResults += results.length
  }

  if (totalResults === 0) {
    if (query) {
      console.log(`  ${dim(`No results for "${query}"`)}`)
    } else {
      console.log(`  ${dim('No components found.')}`)
    }
    console.log()
    return
  }

  console.log(`  ${dim(`${totalResults} components found. Install with: ${cyan('rubot add')}`)}`)
  console.log()
}
