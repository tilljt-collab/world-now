import { NextResponse } from 'next/server'
import { storyCache } from '@/lib/cache'
import { geolocate } from '@/lib/geolocate'
import { categorize } from '@/lib/categorize'
import { scoreImportance } from '@/lib/importance'
import type { Story } from '@/lib/types'
import { createHash } from 'crypto'

const QUERIES = [
  'world news', 'war conflict', 'politics election',
  'economy finance', 'climate disaster', 'diplomacy international',
]

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`
  return `${Math.floor(secs / 86400)}d`
}

function zoomTier(importance: number): 2 | 4 | 6 | 8 {
  if (importance >= 4) return 2
  if (importance === 3) return 4
  if (importance === 2) return 6
  return 8
}

async function fetchStories(): Promise<Story[]> {
  const key = process.env.NEWS_API_KEY
  if (!key) throw new Error('NEWS_API_KEY not set')

  const results = await Promise.allSettled(
    QUERIES.map(q =>
      fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=20&language=en`,
        { headers: { 'X-Api-Key': key }, cache: 'no-store' }
      ).then(r => r.json())
    )
  )

  const articles: any[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') {
      if (r.value.status === 'error') {
        console.error('NewsAPI error:', r.value.code, r.value.message)
      } else if (Array.isArray(r.value.articles)) {
        articles.push(...r.value.articles)
      }
    }
  }

  const seen = new Set<string>()
  const stories: Story[] = []

  for (const a of articles) {
    if (!a.title || !a.url || !a.publishedAt) continue
    const id = createHash('md5').update(a.url).digest('hex').slice(0, 8)
    if (seen.has(id)) continue
    seen.add(id)

    const geo = geolocate(a)
    if (!geo) continue

    const importance = scoreImportance(a)
    stories.push({
      id,
      lat: geo.lat,
      lng: geo.lng,
      countryCode: geo.countryCode,
      headline: a.title,
      summary: a.description ?? 'Developing story.',
      url: a.url,
      source: a.source?.name ?? 'Unknown',
      publishedAt: a.publishedAt,
      ago: timeAgo(a.publishedAt),
      category: categorize(a.title),
      importance,
      minZoom: zoomTier(importance),
    })
  }

  return stories
}

let inflight: Promise<Story[]> | null = null

export async function GET() {
  const cached = storyCache.get('stories')
  if (cached) return NextResponse.json(cached)

  if (!inflight) {
    inflight = fetchStories()
      .then(stories => {
        storyCache.set('stories', stories)
        inflight = null
        return stories
      })
      .catch(err => {
        inflight = null
        throw err
      })
  }

  try {
    return NextResponse.json(await inflight)
  } catch (err) {
    console.error('news fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}
