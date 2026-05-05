'use client'
import { useState } from 'react'

interface StreamTileProps {
  name: string
  region: string
  youtubeId: string
  live: boolean
  defaultCollapsed?: boolean
}

export default function StreamTile({ name, region, youtubeId, live, defaultCollapsed = false }: StreamTileProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <div className="border-b border-[#111828]">
      <div
        className="flex justify-between items-center px-[10px] py-[7px] cursor-pointer bg-[#0f1428] hover:bg-[#141a35]"
        onClick={() => setCollapsed(c => !c)}
      >
        <div>
          <div className="text-[11px] font-semibold text-[#ccd8ff]">{name}</div>
          <div className="text-[9px] text-[#556688]">{region}</div>
        </div>
        <div className="flex flex-col items-end gap-[3px]">
          {live
            ? <span className="text-[#e74c3c] text-[9px] font-bold">● LIVE</span>
            : <span className="text-[9px] text-[#445566]">OFFLINE</span>
          }
          <button
            className="bg-transparent border-none text-[#556677] text-[10px] px-1 cursor-pointer hover:text-[#aab]"
            onClick={e => { e.stopPropagation(); setCollapsed(c => !c) }}
          >
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="border-t border-[#1a2040]">
          <iframe
            title={name}
            width="100%"
            height="108"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            allowFullScreen
            className="block"
          />
        </div>
      )}
    </div>
  )
}
