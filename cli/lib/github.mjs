import { request } from 'node:https'

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

function fetch(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'rubot-cli',
        Accept: 'application/vnd.github.v3+json',
      },
    }
    request(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location).then(resolve, reject)
      }
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${url}`))
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
