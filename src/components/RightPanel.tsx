'use client'
import type { Story } from '@/lib/types'
import StoryCard from './StoryCard'

interface RightPanelProps {
  stories: Story[]
  onFlyTo: (lat: number, lng: number) => void
  refreshing: boolean
}

export default function RightPanel({ stories, onFlyTo, refreshing }: RightPanelProps) {
  const top = [...stories].sort((a, b) => b.importance - a.importance).slice(0, 12)

  return (
    <div className="w-[210px] flex-shrink-0 bg-[#0b0f1f] flex flex-col overflow-y-auto border-l border-[#1a2040]">
      <div className="sticky top-0 z-10 flex justify-between items-center px-[11px] py-[7px] text-[8px] tracking-[2px] uppercase text-[#8899bb] bg-[#0d1225] border-b border-[#1a2040]">
        <span>Top Stories</span>
        <span className="text-[9px] text-[#2ecc71]">{refreshing ? '↻ Refreshing…' : '↻ Live'}</span>
      </div>
      {top.map(s => <StoryCard key={s.id} story={s} onFlyTo={onFlyTo} />)}
    </div>
  )
}
