'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { Category, Story } from '@/lib/types'
import { PRESETS, type Preset, type PresetId } from '@/lib/presets'
import TopBar from './TopBar'
import BottomBar from './BottomBar'
import LeftPanel, { LIVE_STREAM_COUNT } from './LeftPanel'
import RightPanel from './RightPanel'
import CategoryFilter from './CategoryFilter'
import BreakingFlash from './BreakingFlash'
import ZoomHint from './ZoomHint'
import WelcomeScreen from './WelcomeScreen'

const MapContainer = dynamic(() => import('./MapContainer'), { ssr: false })

const ALL_CATS = new Set<Category>(['conflict','politics','economy','climate','disaster','diplomacy','society'])
const POLL_MS  = 3 * 60 * 1000  // 3 minutes

export default function Shell() {
  const [stories,    setStories]    = useState<Story[]>([])
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(ALL_CATS))
  const [refreshing, setRefreshing] = useState(false)
  const [flash,      setFlash]      = useState<{ headline: string; visible: boolean }>({ headline: '', visible: false })
  const [preset,     setPreset]     = useState<Preset>(PRESETS[0])
  const [showWelcome, setShowWelcome] = useState(true)
  const [keyword,    setKeyword]    = useState('')
  const flyToRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null)
  const prevIdsRef = useRef<Set<string>>(new Set())
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePresetSelect = useCallback((id: PresetId) => {
    const p = PRESETS.find(pr => pr.id === id) ?? PRESETS[0]
    setPreset(p)
    setShowWelcome(false)
  }, [])

  const fetchStories = useCallback(async (isInitial = false) => {
    if (!isInitial) setRefreshing(true)
    try {
      const res  = await fetch('/api/news')
      if (!res.ok) throw new Error(`/api/news returned ${res.status}`)
      const data: Story[] = await res.json()
      setStories(data)

      // Trigger breaking flash for new importance-5 stories on refresh
      if (!isInitial) {
        const incoming = data.filter(s => s.importance === 5 && !prevIdsRef.current.has(s.id))
        if (incoming.length > 0) {
          if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
          setFlash({ headline: incoming[0].headline, visible: true })
          flashTimerRef.current = setTimeout(() => setFlash(f => ({ ...f, visible: false })), 6500)
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
    return () => {
      clearInterval(interval)
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [fetchStories])

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    flyToRef.current?.(lat, lng, 5)
  }, [])

  const handleKeywordSearch = useCallback((kw: string) => {
    setKeyword(kw)
    if (!kw.trim()) return
    const lower = kw.trim().toLowerCase()
    const matches = stories.filter(s =>
      s.headline.toLowerCase().includes(lower) ||
      s.summary.toLowerCase().includes(lower)
    )
    if (!matches.length) return
    const best = matches.reduce((a, b) => b.importance > a.importance ? b : a)
    flyToRef.current?.(best.lat, best.lng, 5)
  }, [stories])

  const handleMapFlyTo = useCallback((fn: (lat: number, lng: number, zoom?: number) => void) => {
    flyToRef.current = fn
  }, [])

  const visible = stories.filter(s => activeCategories.has(s.category))
  const topHeadlines = [...stories]
    .sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance
      return (b.source === 'BBC News' ? 1 : 0) - (a.source === 'BBC News' ? 1 : 0)
    })
    .slice(0, 5)
    .map(s => s.headline)

  return (
    <div className="flex flex-col h-screen">
      {showWelcome && <WelcomeScreen onSelect={handlePresetSelect} />}
      <TopBar
        storyCount={visible.length}
        breakingCount={stories.filter(s => s.importance === 5).length}
        liveCount={LIVE_STREAM_COUNT}
        topHeadlines={topHeadlines}
        preset={preset}
        keyword={keyword}
        onKeywordChange={setKeyword}
        onSearch={handleKeywordSearch}
        onChangeFocus={() => setShowWelcome(true)}
      />
      <BreakingFlash headline={flash.headline} visible={flash.visible} />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <LeftPanel />
        <div className="flex-1 relative min-w-0">
          <MapContainer
            stories={stories}
            activeCategories={activeCategories}
            preset={preset}
            keyword={keyword}
            onFlyTo={handleMapFlyTo}
          />
          <CategoryFilter active={activeCategories} onChange={setActiveCategories} />
          <ZoomHint />
        </div>
        <RightPanel stories={stories} onFlyTo={handleFlyTo} refreshing={refreshing} preset={preset} />
      </div>
      <BottomBar headlines={topHeadlines} />
    </div>
  )
}
