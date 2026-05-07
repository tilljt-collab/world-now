'use client'
import StreamTile from './StreamTile'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types'

const STREAMS = [
  { name: 'Al Jazeera English', region: 'Middle East / Global', youtubeId: 'h3MuIUNCCzI', live: true },
  { name: 'BBC World News',     region: 'Global',               youtubeId: 'w_Ma8oQLmSM', live: true },
  { name: 'France 24',          region: 'Europe / Africa',      youtubeId: 'ikR7_EA8G0o', live: true, defaultCollapsed: true },
  { name: 'DW News',            region: 'Europe',               youtubeId: 'oMjFoRkynhc', live: true },
  { name: 'CNN International',  region: 'Americas / Global',    youtubeId: 'IFYVhkwHcls', live: false },
]

export const LIVE_STREAM_COUNT = STREAMS.filter(s => s.live).length

export default function LeftPanel() {
  const liveCount = STREAMS.filter(s => s.live).length
  return (
    <div className="w-[210px] flex-shrink-0 bg-[#0b0f1f] flex flex-col overflow-y-auto border-r border-[#1a2040]">
      <div className="sticky top-0 z-10 flex justify-between items-center px-[11px] py-[7px] text-[8px] tracking-[2px] uppercase text-[#8899bb] bg-[#0d1225] border-b border-[#1a2040]">
        <span>Live Streams</span>
        <span className="text-[#e74c3c]">● {liveCount} Live</span>
      </div>
      {STREAMS.map(s => <StreamTile key={s.name} {...s} />)}
      <Legend />
    </div>
  )
}

function Legend() {
  return (
    <div className="p-[11px] flex flex-col gap-[5px] border-t border-[#1a2040] mt-auto">
      <div className="text-[8px] tracking-[1px] text-[#445566] uppercase mb-[2px]">Category</div>
      {(Object.keys(CATEGORY_COLORS) as (keyof typeof CATEGORY_COLORS)[]).map(cat => (
        <div key={cat} className="flex items-center gap-[7px] text-[9px] text-[#8899bb]">
          <div className="w-[9px] h-[9px] rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[cat], boxShadow: `0 0 5px ${CATEGORY_COLORS[cat]}` }} />
          {CATEGORY_LABELS[cat]}
        </div>
      ))}
      <div className="text-[8px] tracking-[1px] text-[#445566] uppercase mt-[8px] mb-[2px]">Dot size = Importance</div>
      <div className="flex items-center gap-[5px]">
        {[6, 9, 13, 17, 21].map(s => (
          <div key={s} className="rounded-full bg-[#aaa] flex-shrink-0" style={{ width: s, height: s }} />
        ))}
        <span className="text-[9px] text-[#8899bb] ml-1">Minor → Major</span>
      </div>
    </div>
  )
}
