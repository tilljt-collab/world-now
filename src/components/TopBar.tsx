'use client'
import { useRef } from 'react'
import type { Preset } from '@/lib/presets'

interface TopBarProps {
  storyCount: number
  breakingCount: number
  liveCount: number
  topHeadlines: string[]
  preset: Preset
  keyword: string
  onKeywordChange: (kw: string) => void
  onSearch: (kw: string) => void
  onChangeFocus: () => void
}

export default function TopBar({ storyCount, breakingCount, liveCount, topHeadlines, preset, keyword, onKeywordChange, onSearch, onChangeFocus }: TopBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const tickerText = topHeadlines.join(' · ')

  return (
    <div className="flex-none flex items-center gap-3 h-[50px] px-4 bg-[#0d0d1e] border-b-2 border-[#c0392b] z-[1000]">
      <span className="text-[17px] font-black tracking-[3px] whitespace-nowrap">
        WORLD<span className="text-[#e74c3c]">NOW</span>
      </span>
      <span className="text-[9px] font-extrabold bg-[#e74c3c] px-2 py-[2px] rounded-[3px] tracking-[1px] animate-pulse whitespace-nowrap">
        ● LIVE
      </span>
      <div className="flex-1 overflow-hidden text-[11px] text-[#99aabb] border-l-2 border-[#e74c3c] pl-3 whitespace-nowrap text-ellipsis min-w-0">
        <span className="text-[#e74c3c] font-bold mr-2">BREAKING</span>
        {tickerText}
      </div>

      {/* Keyword search */}
      <form
        onSubmit={e => { e.preventDefault(); onSearch(keyword) }}
        className="flex-shrink-0 flex items-center"
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={e => onKeywordChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { onKeywordChange(''); onSearch('') } }}
            placeholder="Search stories…"
            className="w-[168px] bg-[#0b0f1f] border border-[#2a3560] text-[11px] text-[#ccd6e8] px-[8px] py-[4px] pr-[52px] rounded-[3px] focus:outline-none focus:border-[#e74c3c] placeholder-[#445566] transition-colors"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => { onKeywordChange(''); onSearch(''); inputRef.current?.focus() }}
              className="absolute right-[26px] top-1/2 -translate-y-1/2 text-[#8899bb] hover:text-white text-[14px] leading-none px-[2px]"
              title="Clear"
            >×</button>
          )}
          <button
            type="submit"
            className="absolute right-[6px] top-1/2 -translate-y-1/2 text-[#445566] hover:text-[#e74c3c] transition-colors text-[13px] leading-none"
            title="Search"
          >⌕</button>
        </div>
      </form>

      <button
        type="button"
        onClick={onChangeFocus}
        title="Change focus"
        className="flex-shrink-0 flex items-center gap-[5px] px-[10px] py-[4px] border border-[#2a3560] bg-[#0b0f1f] hover:border-[#e74c3c] hover:bg-[#0f1428] transition-colors cursor-pointer rounded-[3px]"
      >
        <span className="text-[13px] leading-none">{preset.emoji}</span>
        <span className="text-[8px] tracking-[1.5px] text-[#8899bb] uppercase whitespace-nowrap">{preset.label}</span>
      </button>
      <div className="flex gap-4 flex-shrink-0">
        <Stat n={storyCount} label="Stories" color="text-[#e74c3c]" />
        <Stat n={breakingCount} label="Breaking" color="text-[#e67e22]" />
        <Stat n={liveCount} label="Live" color="text-[#2ecc71]" />
      </div>
    </div>
  )
}

function Stat({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-[19px] font-extrabold leading-none ${color}`}>{n}</div>
      <div className="text-[8px] text-[#8899bb] tracking-[1px] uppercase">{label}</div>
    </div>
  )
}
