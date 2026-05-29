import { homedir } from 'node:os'
import { join } from 'node:path'

const COMPONENT_DIRS = {
  skill: 'skills',
  command: 'commands',
  agent: 'agents',
  hook: 'hooks',
  template: 'templates',
  workflow: 'workflows',
}

const CODEX_COMPONENT_DIRS = {
  ...COMPONENT_DIRS,
  command: 'prompts',
}

export const TARGETS = ['claude', 'codex']

export function normalizeTarget(raw = process.env.RUBOT_TARGET || 'claude') {
  const value = String(raw || 'claude').toLowerCase()
  if (value === 'claude' || value === 'claude-code') return 'claude'
  if (value === 'codex' || value === 'openai-codex') return 'codex'
  if (value === 'both') return 'both'
  throw new Error(`Unknown target: ${raw}. Valid: claude, codex, both`)
}

export function expandTargets(raw = process.env.RUBOT_TARGET || 'claude') {
  const target = normalizeTarget(raw)
  return target === 'both' ? TARGETS : [target]
}

function getTargetBase(type, global, target) {
  if (target === 'claude') {
    return global ? join(homedir(), '.claude') : join(process.cwd(), '.claude')
  }

  if (type === 'skill') {
    return global ? join(homedir(), '.codex') : join(process.cwd(), '.agents')
  }

  return global ? join(homedir(), '.codex') : join(process.cwd(), '.codex')
}

export function getComponentDir(type, global = false, target = 'claude') {
  const normalized = normalizeTarget(target)
  if (normalized === 'both') {
    throw new Error('getComponentDir expects a single target, not "both"')
  }
  // Workflows are Claude-only; Codex has no equivalent (no-op like hooks).
  if (normalized === 'codex' && type === 'workflow') return null
  const dirs = normalized === 'codex' ? CODEX_COMPONENT_DIRS : COMPONENT_DIRS
  return join(getTargetBase(type, global, normalized), dirs[type])
}

export function getComponentPath(type, name, global = false, target = 'claude') {
  const dir = getComponentDir(type, global, target)
  if (dir === null) return null // workflow + codex: no-op
  if (type === 'skill') return join(dir, name) // directory
  if (type === 'template') return join(dir, name) // keep original filename
  if (type === 'workflow') return join(dir, name.endsWith('.js') ? name : `${name}.js`) // append .js if missing
  // commands & agents: append .md if not present
  return join(dir, name.endsWith('.md') ? name : `${name}.md`)
}

export function getSettingsPath(global = false, target = 'claude') {
  const normalized = normalizeTarget(target)
  if (normalized === 'both') {
    throw new Error('getSettingsPath expects a single target, not "both"')
  }
  const base = getTargetBase('hook', global, normalized)
  return join(base, 'settings.json')
}

export function getTargetLabel(global = false, target = 'claude', type = 'command') {
  const normalized = normalizeTarget(target)
  const base = getTargetBase(type, global, normalized)
  const root = global
    ? base.replace(homedir(), '~')
    : base.replace(process.cwd(), '.')

  return `${normalized}:${global ? 'global' : 'local'} (${root}/)`
}

// Backward compat
export function getSkillsDir(global = false, target = 'claude') {
  return getComponentDir('skill', global, target)
}

export function getSkillPath(name, global = false, target = 'claude') {
  return getComponentPath('skill', name, global, target)
}
