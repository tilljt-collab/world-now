'use client'

interface TopBarProps {
  storyCount: number
  breakingCount: number
  liveCount: number
  topHeadlines: string[]
}

export default function TopBar({ storyCount, breakingCount, liveCount, topHeadlines }: TopBarProps) {
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
