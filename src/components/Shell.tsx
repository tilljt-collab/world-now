'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { Category, Story } from '@/lib/types'
import TopBar from './TopBar'
import BottomBar from './BottomBar'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import CategoryFilter from './CategoryFilter'
import BreakingFlash from './BreakingFlash'
import ZoomHint from './ZoomHint'

const MapContainer = dynamic(() => import('./MapContainer'), { ssr: false })

const ALL_CATS = new Set<Category>(['conflict','politics','economy','climate','disaster','diplomacy','society'])
const POLL_MS  = 3 * 60 * 1000  // 3 minutes

export default function Shell() {
  const [stories,    setStories]    = useState<Story[]>([])
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(ALL_CATS))
  const [refreshing, setRefreshing] = useState(false)
  const [flash,      setFlash]      = useState<{ headline: string; visible: boolean }>({ headline: '', visible: false })
  const flyToRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null)
  const prevIdsRef = useRef<Set<string>>(new Set())

  const fetchStories = useCallback(async (isInitial = false) => {
    if (!isInitial) setRefreshing(true)
    try {
      const res  = await fetch('/api/news')
      const data: Story[] = await res.json()
      setStories(data)

      // Trigger breaking flash for new importance-5 stories on refresh
      if (!isInitial) {
        const incoming = data.filter(s => s.importance === 5 && !prevIdsRef.current.has(s.id))
        if (incoming.length > 0) {
          setFlash({ headline: incoming[0].headline, visible: true })
          setTimeout(() => setFlash(f => ({ ...f, visible: false })), 6500)
        }
      }

      prevIdsRef.current = new Set(data.map(s => s.id))
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStories(true)
    const interval = setInterval(() => fetchStories(), POLL_MS)
    return () => clearInterval(interval)
  }, [fetchStories])

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    flyToRef.current?.(lat, lng, 5)
  }, [])

  const handleMapFlyTo = useCallback((fn: (lat: number, lng: number, zoom?: number) => void) => {
    flyToRef.current = fn
  }, [])

  const visible = stories.filter(s => activeCategories.has(s.category))
  const topHeadlines = [...stories]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5)
    .map(s => s.headline)

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        storyCount={visible.length}
        breakingCount={stories.filter(s => s.importance === 5).length}
        liveCount={4}
        topHeadlines={topHeadlines}
      />
      <BreakingFlash headline={flash.headline} visible={flash.visible} />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <LeftPanel />
        <div className="flex-1 relative min-w-0">
          <MapContainer
            stories={stories}
            activeCategories={activeCategories as Set<string>}
            onFlyTo={handleMapFlyTo}
          />
          <CategoryFilter active={activeCategories} onChange={setActiveCategories} />
          <ZoomHint />
        </div>
        <RightPanel stories={stories} onFlyTo={handleFlyTo} refreshing={refreshing} />
      </div>
      <BottomBar headlines={topHeadlines} />
    </div>
  )
}
