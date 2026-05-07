import type { Story } from './types'

export interface Cluster {
  lat: number
  lng: number
  count: number
  stories: Story[]
  topImportance: number
}

export function clusterStories(stories: Story[], gridDeg = 8): Cluster[] {
  const cells = new Map<string, Story[]>()

  for (const s of stories) {
    const key = `${Math.round(s.lat / gridDeg)},${Math.round(s.lng / gridDeg)}`
    const cell = cells.get(key) ?? []
    cell.push(s)
    cells.set(key, cell)
  }

  return Array.from(cells.values()).map(group => ({
    lat: group.reduce((sum, s) => sum + s.lat, 0) / group.length,
    lng: group.reduce((sum, s) => sum + s.lng, 0) / group.length,
    count: group.length,
    stories: group,
    topImportance: group.reduce((max, s) => s.importance > max ? s.importance : max, 1),
  }))
}
