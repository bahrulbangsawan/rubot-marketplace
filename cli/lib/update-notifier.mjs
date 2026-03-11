import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { getComponentDir } from './paths.mjs'
import { getComponentCatalog } from './registry.mjs'
import { yellow, dim, bold, cyan } from './ui.mjs'

const CACHE_DIR = join(homedir(), '.cache', 'rubot')
const CACHE_FILE = join(CACHE_DIR, 'update-check.json')
const TTL = 4 * 60 * 60 * 1000 // 4 hours

function readCache() {
  try {
    if (!existsSync(CACHE_FILE)) return null
    const data = JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
    if (Date.now() - data.timestamp > TTL) return null
    return data
  } catch {
    return null
  }
}

function writeCache(outdated) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(CACHE_FILE, JSON.stringify({ timestamp: Date.now(), outdated }), 'utf8')
  } catch {
    // Silently fail — cache is optional
  }
}

export function clearUpdateCache() {
  try {
    if (existsSync(CACHE_FILE)) unlinkSync(CACHE_FILE)
  } catch {
    // Silently fail
  }
}

function getInstalledSkills() {
  const skills = []
  for (const global of [false, true]) {
    const dir = getComponentDir('skill', global)
    if (!existsSync(dir)) continue
    const entries = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'SKILL.md')))
    for (const entry of entries) {
      const content = readFileSync(join(dir, entry.name, 'SKILL.md'), 'utf8')
      const version = content.match(/^version:\s*(.+)$/m)?.[1]?.trim()
      skills.push({ name: entry.name, version })
    }
  }
  // Deduplicate (local takes precedence over global)
  const seen = new Set()
  return skills.filter((s) => {
    if (seen.has(s.name)) return false
    seen.add(s.name)
    return true
  })
}

async function countOutdated() {
  const installed = getInstalledSkills()
  if (installed.length === 0) return 0

  const catalog = await getComponentCatalog('skill')
  const versionMap = new Map(catalog.filter((c) => c.version).map((c) => [c.name, c.version]))

  let outdated = 0
  for (const skill of installed) {
    const remoteVersion = versionMap.get(skill.name)
    if (remoteVersion && skill.version !== remoteVersion) outdated++
  }
  return outdated
}

export async function notifyUpdates() {
  try {
    const cache = readCache()
    let outdated

    if (cache !== null) {
      outdated = cache.outdated
    } else {
      outdated = await countOutdated()
      writeCache(outdated)
    }

    if (outdated > 0) {
      const label = outdated === 1 ? 'component has' : 'components have'
      console.log()
      console.log(`  ${yellow('⚠')} ${bold(String(outdated))} ${label} updates available. Run ${cyan('rubot update')} to upgrade.`)
    }
  } catch {
    // Silent fail — notification should never break the CLI
  }
}
