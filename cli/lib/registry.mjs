import { fetchMarketplace } from './github.mjs'

let _catalog = null

export async function getCatalog() {
  if (_catalog) return _catalog
  const marketplace = await fetchMarketplace()
  _catalog = marketplace.components.skills.list.map((skill) => ({
    name: skill.name,
    description: skill.description,
    agents: skill.agents,
  }))
  return _catalog
}

export async function findSkill(name) {
  const catalog = await getCatalog()
  return catalog.find((s) => s.name === name) || null
}

export async function searchSkills(query) {
  const catalog = await getCatalog()
  if (!query) return catalog
  const q = query.toLowerCase()
  return catalog.filter(
    (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  )
}
