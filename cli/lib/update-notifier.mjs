import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { getComponentDir } from './paths.mjs'
import { getComponentCatalog } from './registry.mjs'
import { yellow, green, dim, bold, cyan } from './ui.mjs'

const CACHE_DIR = join(homedir(), '.cache', 'rubot')
const CACHE_FILE = join(CACHE_DIR, 'update-check.json')
const TTL = 4 * 60 * 60 * 1000 // 4 hours

const CLI_CACHE_FILE = join(CACHE_DIR, 'cli-version-check.json')
const CLI_TTL = 24 * 60 * 60 * 1000 // 24 hours
const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@bahrulbangsawan/rubot/latest'

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
    if (existsSync(CLI_CACHE_FILE)) unlinkSync(CLI_CACHE_FILE)
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

// ─── CLI self-update notification ──────────────────────────────────────────────

function readCliCache() {
  try {
    if (!existsSync(CLI_CACHE_FILE)) return null
    const data = JSON.parse(readFileSync(CLI_CACHE_FILE, 'utf8'))
    if (Date.now() - data.timestamp > CLI_TTL) return null
    return data
  } catch {
    return null
  }
}

function writeCliCache(latestVersion) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(CLI_CACHE_FILE, JSON.stringify({ timestamp: Date.now(), latestVersion }), 'utf8')
  } catch {
    // Silently fail — cache is optional
  }
}

async function fetchLatestCliVersion() {
  const res = await fetch(NPM_REGISTRY_URL, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) return null
  const data = await res.json()
  return data.version || null
}

function isNewerVersion(remote, local) {
  const r = remote.split('.').map(Number)
  const l = local.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (l[i] || 0)) return true
    if ((r[i] || 0) < (l[i] || 0)) return false
  }
  return false
}

export async function notifyCliUpdate(currentVersion) {
  try {
    const cache = readCliCache()
    let latestVersion

    if (cache !== null) {
      latestVersion = cache.latestVersion
    } else {
      latestVersion = await fetchLatestCliVersion()
      if (latestVersion) writeCliCache(latestVersion)
    }

    if (latestVersion && isNewerVersion(latestVersion, currentVersion)) {
      console.log()
      console.log(`  ${yellow('⚠')} CLI update available: ${dim(currentVersion)} → ${green(latestVersion)}`)
      console.log(`    Run ${cyan('npm i -g @bahrulbangsawan/rubot')} to update`)
    }
  } catch {
    // Silent fail — notification should never break the CLI
  }
}
