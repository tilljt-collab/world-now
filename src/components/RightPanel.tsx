'use client'
import type { Story } from '@/lib/types'
import { type Preset, storyMatchesPreset } from '@/lib/presets'
import StoryCard from './StoryCard'

interface RightPanelProps {
  stories: Story[]
  onFlyTo: (lat: number, lng: number) => void
  refreshing: boolean
  preset: Preset
}

export default function RightPanel({ stories, onFlyTo, refreshing, preset }: RightPanelProps) {
  const top = [...stories]
    .sort((a, b) => {
      const aMatch = storyMatchesPreset(preset, a.category, a.countryCode) ? 1 : 0
      const bMatch = storyMatchesPreset(preset, b.category, b.countryCode) ? 1 : 0
      if (bMatch !== aMatch) return bMatch - aMatch
      return b.importance - a.importance
    })
    .slice(0, 12)

  return (
    <div className="w-[210px] flex-shrink-0 bg-[#0b0f1f] flex flex-col overflow-y-auto border-l border-[#1a2040]">
      <div className="sticky top-0 z-10 flex flex-col bg-[#0d1225] border-b border-[#1a2040]">
        <div className="flex justify-between items-center px-[11px] py-[7px] text-[8px] tracking-[2px] uppercase text-[#8899bb]">
          <span>Top Stories</span>
          <span className="text-[9px] text-[#2ecc71]">{refreshing ? '↻ Refreshing…' : '↻ Live'}</span>
        </div>
        {preset.id !== 'everything' && (
          <div className="flex items-center gap-[5px] px-[11px] pb-[6px]">
            <span className="text-[11px]">{preset.emoji}</span>
            <span className="text-[7px] tracking-[1.5px] uppercase text-[#e74c3c]">
              {preset.label} focus
            </span>
          </div>
        )}
      </div>
      {top.map(s => <StoryCard key={s.id} story={s} onFlyTo={onFlyTo} />)}
    </div>
  )
}
