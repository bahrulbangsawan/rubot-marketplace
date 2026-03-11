import { homedir } from 'node:os'
import { join } from 'node:path'

export function getSkillsDir(global = false) {
  if (global) {
    return join(homedir(), '.claude', 'skills')
  }
  return join(process.cwd(), '.claude', 'skills')
}

export function getSkillPath(name, global = false) {
  return join(getSkillsDir(global), name)
}
