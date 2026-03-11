#!/usr/bin/env node

import { normalizeType } from '../lib/ui.mjs'

function parseArgs(argv) {
  const args = argv.slice(2)
  const command = args[0]
  const flags = {
    skills: [],
    types: [],
    global: false,
    yes: false,
    all: false,
    help: false,
  }
  const positional = []

  let i = 1
  while (i < args.length) {
    const arg = args[i]
    if (arg === '--skill' || arg === '-s') {
      i++
      while (i < args.length && !args[i].startsWith('-')) {
        flags.skills.push(args[i])
        i++
      }
    } else if (arg === '--type' || arg === '-t') {
      i++
      if (i < args.length) {
        const rawTypes = args[i].split(',')
        for (const rt of rawTypes) {
          const nt = normalizeType(rt)
          if (!flags.types.includes(nt)) flags.types.push(nt)
        }
        i++
      }
    } else if (arg === '--global' || arg === '-g') {
      flags.global = true
      i++
    } else if (arg === '--yes' || arg === '-y') {
      flags.yes = true
      i++
    } else if (arg === '--all') {
      flags.all = true
      i++
    } else if (arg === '--help' || arg === '-h') {
      flags.help = true
      i++
    } else if (!arg.startsWith('-')) {
      positional.push(arg)
      i++
    } else {
      console.error(`Unknown flag: ${arg}`)
      process.exit(1)
    }
  }

  return { command, flags, positional }
}

function showHelp() {
  console.log(`
  \x1b[1mrubot\x1b[0m - Install and manage components from rubot-marketplace

  \x1b[2mUsage:\x1b[0m rubot <command> [options]

  \x1b[2mCommands:\x1b[0m
    add          Install component(s) — interactive multi-select or direct
    list, ls     Show installed components
    remove, rm   Uninstall component(s) — interactive or direct
    search       Search available components
    update       Update installed components
    init         Create a new SKILL.md template

  \x1b[2mOptions:\x1b[0m
    --type, -t   Component type: skill, command, agent, hook, template
    --skill, -s  Skill name(s) — shorthand for --type skill <names>
    --all        Install/remove all (of specified type, or everything)
    --global, -g Install/remove globally (~/.claude/)
    --yes, -y    Skip confirmation prompts
    --help, -h   Show help
    --version, -v Show version

  \x1b[2mExamples:\x1b[0m
    rubot add                              Interactive multi-select
    rubot add --type skill                 Multi-select skills
    rubot add --skill drizzle-orm          Install specific skill
    rubot add --type command --all         Install all commands
    rubot add --all                        Install everything
    rubot remove                           Interactive remove
    rubot remove --type skill drizzle-orm  Remove specific skill
    rubot search seo                       Search across all types
  `)
}

const { command, flags, positional } = parseArgs(process.argv)

if (!command || command === '--help' || command === '-h') {
  showHelp()
  process.exit(0)
}

if (command === '--version' || command === '-v') {
  const { readFileSync } = await import('node:fs')
  const { fileURLToPath } = await import('node:url')
  const { dirname, join } = await import('node:path')
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))
  console.log(pkg.version)
  process.exit(0)
}

const commands = {
  add: () => import('../lib/commands/add.mjs'),
  list: () => import('../lib/commands/list.mjs'),
  ls: () => import('../lib/commands/list.mjs'),
  remove: () => import('../lib/commands/remove.mjs'),
  rm: () => import('../lib/commands/remove.mjs'),
  search: () => import('../lib/commands/search.mjs'),
  update: () => import('../lib/commands/update.mjs'),
  init: () => import('../lib/commands/init.mjs'),
}

const loader = commands[command]
if (!loader) {
  console.error(`Unknown command: ${command}`)
  console.error('Run rubot --help for usage')
  process.exit(1)
}

const mod = await loader()
await mod.run({ flags, positional })

// Show update notifications after commands (skip component check for 'update' itself)
if (command !== 'update') {
  const { readFileSync } = await import('node:fs')
  const { fileURLToPath } = await import('node:url')
  const { dirname, join } = await import('node:path')
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))

  const { notifyUpdates, notifyCliUpdate } = await import('../lib/update-notifier.mjs')
  await Promise.all([notifyUpdates(), notifyCliUpdate(pkg.version)])
}
