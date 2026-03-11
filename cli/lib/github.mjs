import { request } from 'node:https'
import { execFileSync } from 'node:child_process'

const REPO_OWNER = 'bahrulbangsawan'
const REPO_NAME = 'rubot-marketplace'
const BRANCH = 'main'

const COMPONENT_PATHS = {
  skill: 'plugins/rubot/skills',
  command: 'plugins/rubot/commands',
  agent: 'plugins/rubot/agents',
  hook: 'plugins/rubot/hooks',
  template: 'plugins/rubot/templates',
}

const MARKETPLACE_PATH = 'plugins/rubot/.claude-plugin/marketplace.json'

let _token = undefined // lazy-initialized

function getGitHubToken() {
  if (_token !== undefined) return _token

  // Check environment variables first
  _token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null
  if (_token) return _token

  // Fall back to gh CLI auth
  try {
    _token = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch {
    _token = null
  }
  return _token
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function fetchOnce(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'rubot-cli',
      Accept: 'application/vnd.github.v3+json',
    }
    const token = getGitHubToken()
    if (token) headers.Authorization = `token ${token}`

    request(url, { headers }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchOnce(res.headers.location).then(resolve, reject)
      }
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(Object.assign(new Error(`HTTP ${res.statusCode}: ${url}`), { statusCode: res.statusCode, headers: res.headers }))
          return
        }
        resolve(data)
      })
      res.on('error', reject)
    })
      .on('error', reject)
      .end()
  })
}

async function fetch(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetchOnce(url)
    } catch (err) {
      const isRateLimit = err.statusCode === 403 || err.statusCode === 429
      if (!isRateLimit || attempt === retries) throw err
      // Exponential backoff: 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, attempt - 1)
      await sleep(delay)
    }
  }
}

// ── Marketplace metadata ──

export async function fetchMarketplace() {
  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${MARKETPLACE_PATH}`
  const data = await fetch(url)
  return JSON.parse(data)
}

// ── Skills (directory-based) ──

export async function fetchSkillContents(skillPath) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${COMPONENT_PATHS.skill}/${skillPath}?ref=${BRANCH}`
  const data = await fetch(url)
  return JSON.parse(data)
}

// ── Single-file components (commands, agents, templates) ──

export async function fetchComponentFile(type, fileName) {
  const basePath = COMPONENT_PATHS[type]
  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${basePath}/${fileName}`
  return fetch(url)
}

// ── Hooks config ──

export async function fetchHooksConfig() {
  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${COMPONENT_PATHS.hook}/hooks.json`
  const data = await fetch(url)
  return JSON.parse(data)
}

// ── Generic file download ──

export async function fetchFileContent(downloadUrl) {
  return fetch(downloadUrl)
}
