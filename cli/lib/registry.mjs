import { fetchMarketplace } from './github.mjs'

let _marketplace = null

async function getMarketplace() {
  if (_marketplace) return _marketplace
  _marketplace = await fetchMarketplace()
  return _marketplace
}

// Map type → marketplace components key
const TYPE_KEY = {
  skill: 'skills',
  command: 'commands',
  agent: 'agents',
  hook: 'hooks',
  template: 'templates',
}

export async function getComponentCatalog(type) {
  const marketplace = await getMarketplace()
  const section = marketplace.components[TYPE_KEY[type]]
  if (!section) return []

  // Templates are stored as plain string array
  if (type === 'template') {
    return section.list.map((name) => ({
      name,
      description: 'Project template',
    }))
  }

  return section.list.map((item) => ({
    name: item.name,
    description: item.description || '',
    ...(item.role ? { role: item.role } : {}),
    ...(item.event ? { event: item.event } : {}),
    ...(item.agents ? { agents: item.agents } : {}),
    ...(item.requires ? { requires: item.requires } : {}),
  }))
}

export async function findComponent(type, name) {
  const catalog = await getComponentCatalog(type)
  return catalog.find((c) => c.name === name) || null
}

export async function searchComponents(type, query) {
  const catalog = await getComponentCatalog(type)
  if (!query) return catalog
  const q = query.toLowerCase()
  return catalog.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
  )
}

// Backward compat
export async function getCatalog() {
  return getComponentCatalog('skill')
}

export async function findSkill(name) {
  return findComponent('skill', name)
}

export async function searchSkills(query) {
  return searchComponents('skill', query)
}
