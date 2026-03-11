import { createInterface, emitKeypressEvents } from 'node:readline'

// ANSI color helpers
export const green = (s) => `\x1b[32m${s}\x1b[0m`
export const red = (s) => `\x1b[31m${s}\x1b[0m`
export const cyan = (s) => `\x1b[36m${s}\x1b[0m`
export const dim = (s) => `\x1b[2m${s}\x1b[0m`
export const bold = (s) => `\x1b[1m${s}\x1b[0m`
export const yellow = (s) => `\x1b[33m${s}\x1b[0m`

// Status symbols
export const symbols = {
  success: green('✓'),
  error: red('✗'),
  arrow: cyan('→'),
  bullet: dim('•'),
}

// Component type labels and canonical list
export const TYPE_LABELS = {
  skill: 'Skills',
  command: 'Commands',
  agent: 'Agents',
  hook: 'Hooks',
  template: 'Templates',
}

export const ALL_TYPES = ['skill', 'command', 'agent', 'hook', 'template']

// Normalize user input like "skills" or "commands" to singular form
const TYPE_MAP = {
  skill: 'skill',
  skills: 'skill',
  command: 'command',
  commands: 'command',
  agent: 'agent',
  agents: 'agent',
  hook: 'hook',
  hooks: 'hook',
  template: 'template',
  templates: 'template',
}

export function normalizeType(raw) {
  const t = TYPE_MAP[raw.toLowerCase().trim()]
  if (!t) {
    fatal(`Unknown type: ${raw}. Valid: skill, command, agent, hook, template`)
  }
  return t
}

// Spinner using braille characters
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export function createSpinner(message) {
  let i = 0
  let timer = null

  return {
    start() {
      timer = setInterval(() => {
        process.stdout.write(`\r${cyan(frames[i++ % frames.length])} ${message}`)
      }, 80)
    },
    stop(finalMessage) {
      clearInterval(timer)
      process.stdout.write(`\r${' '.repeat(message.length + 4)}\r`)
      if (finalMessage) console.log(finalMessage)
    },
  }
}

// Y/n confirmation prompt
export function confirm(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`${question} ${dim('(Y/n)')} `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() !== 'n')
    })
  })
}

// Simple numbered choice prompt
export function choose(question, options, defaultIndex = 0) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    console.log()
    console.log(`  ${question}`)
    console.log()
    for (let i = 0; i < options.length; i++) {
      const marker = i === defaultIndex ? cyan('▸') : ' '
      const label = i === defaultIndex ? bold(options[i]) : options[i]
      console.log(`  ${marker} ${dim(`${i + 1}.`)} ${label}`)
    }
    console.log()
    rl.question(`  ${dim(`Choose [1-${options.length}]`)} ${dim(`(default: ${defaultIndex + 1}):`)} `, (answer) => {
      rl.close()
      const num = parseInt(answer, 10)
      if (!answer.trim()) resolve(defaultIndex)
      else if (num >= 1 && num <= options.length) resolve(num - 1)
      else resolve(defaultIndex)
    })
  })
}

// Error and exit
export function fatal(message) {
  console.error(`${symbols.error} ${message}`)
  process.exit(1)
}

// ─── Interactive multi-select ────────────────────────────────────────────────

let keypressInit = false

/**
 * Interactive multi-select with arrow keys, search, scroll, and select-all.
 *
 * @param {{ items: {name:string, description?:string}[], message: string, pageSize?: number }} opts
 * @returns {Promise<{name:string, description?:string}[]>} selected items
 */
export function multiSelect({ items, message, pageSize = 15 }) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      resolve(items)
      return
    }
    if (items.length === 0) {
      resolve([])
      return
    }

    if (!keypressInit) {
      emitKeypressEvents(process.stdin)
      keypressInit = true
    }

    process.stdin.setRawMode(true)
    process.stdin.resume()

    let cursor = 0
    let scroll = 0
    const selected = new Set()
    let filter = ''
    let filterMode = false
    let renderedLines = 0

    function getFiltered() {
      if (!filter) return items
      const q = filter.toLowerCase()
      return items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          (it.description || '').toLowerCase().includes(q)
      )
    }

    function clamp(filtered) {
      if (cursor >= filtered.length) cursor = Math.max(0, filtered.length - 1)
      if (cursor < scroll) scroll = cursor
      if (cursor >= scroll + pageSize) scroll = cursor - pageSize + 1
      if (scroll < 0) scroll = 0
    }

    function render() {
      // Erase previous output
      if (renderedLines > 0) {
        process.stdout.write(`\x1B[${renderedLines}A\x1B[0J`)
      }

      const filtered = getFiltered()
      clamp(filtered)
      const out = []

      // Header line
      if (filterMode) {
        out.push(`  ${message} ${dim('(type to filter, esc clear, enter apply)')}`)
        out.push(`  ${cyan('/')} ${filter}${dim('█')}`)
      } else {
        out.push(
          `  ${message} ${dim('(↑↓ move, space toggle, a all, / filter, enter confirm)')}`
        )
      }
      out.push('')

      if (filtered.length === 0) {
        out.push(dim(`    No matches for "${filter}"`))
      } else {
        const maxN = Math.max(...filtered.map((i) => i.name.length), 5)
        const end = Math.min(scroll + pageSize, filtered.length)

        if (scroll > 0) out.push(dim('    ↑ more'))

        for (let i = scroll; i < end; i++) {
          const it = filtered[i]
          const oi = items.indexOf(it)
          const cur = i === cursor

          if (it.disabled) {
            const pre = cur ? cyan('>') : ' '
            const nm = it.name.padEnd(maxN + 2)
            out.push(`  ${pre} ${dim('✓')} ${dim(nm)} ${dim(it.disabledReason || 'installed')}`)
            continue
          }

          const sel = selected.has(oi)
          const pre = cur ? cyan('>') : ' '
          const chk = sel ? green('◉') : dim('◯')
          const nm = it.name.padEnd(maxN + 2)
          const ds = dim((it.description || '').slice(0, 55))
          out.push(`  ${pre} ${chk} ${cur ? bold(nm) : nm} ${ds}`)
        }

        if (end < filtered.length) out.push(dim('    ↓ more'))
      }

      out.push('')
      const selectableCount = items.filter((it) => !it.disabled).length
      out.push(`  ${dim(`${selected.size} of ${selectableCount} selected`)}`)

      renderedLines = out.length
      process.stdout.write('\x1B[?25l' + out.join('\n') + '\n')
    }

    function cleanup() {
      process.stdout.write('\x1B[?25h') // show cursor
      process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdin.removeListener('keypress', onKey)
      // Erase the multi-select UI
      if (renderedLines > 0) {
        process.stdout.write(`\x1B[${renderedLines}A\x1B[0J`)
      }
    }

    function onKey(str, key) {
      if (!key && !str) return

      // Ctrl+C — abort
      if (key?.ctrl && key?.name === 'c') {
        cleanup()
        console.log(dim('  Cancelled.'))
        process.exit(0)
      }

      const filtered = getFiltered()

      // ── Filter mode keystrokes ──
      if (filterMode) {
        if (key?.name === 'escape') {
          filter = ''
          filterMode = false
          cursor = 0
          scroll = 0
        } else if (key?.name === 'backspace') {
          filter = filter.slice(0, -1)
          cursor = 0
          scroll = 0
        } else if (key?.name === 'return') {
          filterMode = false
        } else if (str && str.length === 1 && str.charCodeAt(0) >= 32) {
          filter += str
          cursor = 0
          scroll = 0
        }
        render()
        return
      }

      // ── Normal mode keystrokes ──
      if (key?.name === 'up') {
        cursor = Math.max(0, cursor - 1)
        if (cursor < scroll) scroll = cursor
      } else if (key?.name === 'down') {
        cursor = Math.min(filtered.length - 1, cursor + 1)
        if (cursor >= scroll + pageSize) scroll = cursor - pageSize + 1
      } else if (str === ' ') {
        if (filtered[cursor] && !filtered[cursor].disabled) {
          const oi = items.indexOf(filtered[cursor])
          selected.has(oi) ? selected.delete(oi) : selected.add(oi)
        }
      } else if (str === 'a') {
        // Toggle all selectable (operates on full list, not filtered)
        const selectable = items.reduce((ids, it, i) => { if (!it.disabled) ids.push(i); return ids }, [])
        if (selectable.every((i) => selected.has(i))) selectable.forEach((i) => selected.delete(i))
        else selectable.forEach((i) => selected.add(i))
      } else if (str === '/') {
        filterMode = true
        filter = ''
      } else if (key?.name === 'return') {
        cleanup()
        resolve(items.filter((_, i) => selected.has(i)))
        return
      }

      render()
    }

    process.stdin.on('keypress', onKey)
    render()
  })
}
