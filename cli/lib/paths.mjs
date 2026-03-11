import { homedir } from 'node:os'
import { join } from 'node:path'

const COMPONENT_DIRS = {
  skill: 'skills',
  command: 'commands',
  agent: 'agents',
  hook: 'hooks',
  template: 'templates',
}

export function getComponentDir(type, global = false) {
  const base = global ? join(homedir(), '.claude') : join(process.cwd(), '.claude')
  return join(base, COMPONENT_DIRS[type])
}

export function getComponentPath(type, name, global = false) {
  const dir = getComponentDir(type, global)
  if (type === 'skill') return join(dir, name) // directory
  if (type === 'template') return join(dir, name) // keep original filename
  // commands & agents: append .md if not present
  return join(dir, name.endsWith('.md') ? name : `${name}.md`)
}

export function getSettingsPath(global = false) {
  const base = global ? join(homedir(), '.claude') : join(process.cwd(), '.claude')
  return join(base, 'settings.json')
}

// Backward compat
export function getSkillsDir(global = false) {
  return getComponentDir('skill', global)
}

export function getSkillPath(name, global = false) {
  return getComponentPath('skill', name, global)
}
