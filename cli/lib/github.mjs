import { request } from 'node:https'

const REPO_OWNER = 'bahrulbangsawan'
const REPO_NAME = 'rubot-marketplace'
const BRANCH = 'main'
const SKILLS_PATH = 'plugins/rubot/skills'
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
    }).on('error', reject).end()
  })
}

export async function fetchMarketplace() {
  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${MARKETPLACE_PATH}`
  const data = await fetch(url)
  return JSON.parse(data)
}

export async function fetchSkillContents(skillName) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${SKILLS_PATH}/${skillName}?ref=${BRANCH}`
  const data = await fetch(url)
  return JSON.parse(data)
}

export async function fetchFileContent(downloadUrl) {
  return fetch(downloadUrl)
}
