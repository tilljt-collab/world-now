import type { Story } from '@/lib/types'
import { CATEGORY_COLORS, CATEGORY_LABELS, DOT_RADII } from '@/lib/types'

interface StoryCardProps {
  story: Story
  onFlyTo: (lat: number, lng: number) => void
}

export default function StoryCard({ story, onFlyTo }: StoryCardProps) {
  const color = CATEGORY_COLORS[story.category]
  const size  = DOT_RADII[story.importance]

  return (
    <button
      type="button"
      className="w-full text-left px-[11px] py-[9px] border-b border-[#111828] cursor-pointer hover:bg-[#111826]"
      onClick={() => onFlyTo(story.lat, story.lng)}
    >
      <div className="flex items-center gap-[6px] mb-[4px]">
        <div className="rounded-full flex-shrink-0" style={{ width: size, height: size, background: color, boxShadow: `0 0 6px ${color}` }} />
        <span className="text-[8px] tracking-[1px] uppercase" style={{ color }}>{CATEGORY_LABELS[story.category]}</span>
      </div>
      <div className="text-[11px] font-semibold text-[#dde8ff] leading-[1.38] mb-[2px]">{story.headline}</div>
      <div className="text-[9px] text-[#445566]">{story.source} · {story.ago} ago</div>
    </button>
  )
}
