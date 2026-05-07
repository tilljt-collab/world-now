import { clusterStories } from '@/lib/cluster'
import type { Story } from '@/lib/types'

const makeStory = (id: string, lat: number, lng: number, importance: number = 3): Story => ({
  id, lat, lng, countryCode: 'US',
  headline: 'Test', summary: '', url: 'https://example.com',
  source: 'Test', publishedAt: new Date().toISOString(), ago: '1h',
  category: 'politics', importance: importance as Story['importance'], minZoom: 2,
})

describe('clusterStories', () => {
  it('returns empty array for empty input', () => {
    expect(clusterStories([])).toEqual([])
  })

  it('returns a single cluster with count 1 for one story', () => {
    const story = makeStory('a', 10, 20)
    const result = clusterStories([story])
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(1)
    expect(result[0].stories).toContain(story)
    expect(result[0].topImportance).toBe(3)
  })

  it('groups two nearby stories into one cluster', () => {
    // Both within the same 8-degree grid cell
    const s1 = makeStory('a', 10, 20)
    const s2 = makeStory('b', 11, 21)
    const result = clusterStories([s1, s2])
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(2)
    expect(result[0].lat).toBeCloseTo(10.5, 1)
    expect(result[0].lng).toBeCloseTo(20.5, 1)
  })

  it('returns separate clusters for stories in different cells', () => {
    // Far apart — guaranteed different cells
    const s1 = makeStory('a', 10, 20)
    const s2 = makeStory('b', 60, 100)
    const result = clusterStories([s1, s2])
    expect(result).toHaveLength(2)
  })

  it('reports topImportance as the max in the group', () => {
    const s1 = makeStory('a', 10, 20, 2)
    const s2 = makeStory('b', 11, 21, 5)
    const result = clusterStories([s1, s2])
    expect(result[0].topImportance).toBe(5)
  })
})
