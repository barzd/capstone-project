import type { CampusBuildingLabel } from "./campus-building-labels"

function normalizeLocation(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim()
}

export function groupCampusInventory<T extends { location: string }>(
  items: T[], labels: CampusBuildingLabel[],
) {
  const buildings = labels.filter((label) => label.name.trim())
    .map((label) => ({ ...label, items: [] as T[] }))
    .sort((a, b) => a.name.localeCompare(b.name))
  for (const item of items) {
    const location = ` ${normalizeLocation(item.location)} `
    // Prefer the most specific matching name and assign each item once.
    let match: typeof buildings[number] | undefined
    let matchLength = 0
    for (const building of buildings) {
      for (const alias of [building.name, ...(building.locations ?? [])]) {
        const name = normalizeLocation(alias)
        if (name && name.length > matchLength && location.includes(` ${name} `)) {
          match = building
          matchLength = name.length
        }
      }
    }
    match?.items.push(item)
  }
  return buildings
}
