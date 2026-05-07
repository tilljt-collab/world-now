'use client'
import type { Category } from '@/lib/types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types'

interface CategoryFilterProps {
  active: Set<Category>
  onChange: (active: Set<Category>) => void
}

const ALL_CATS = Object.keys(CATEGORY_COLORS) as Category[]

export default function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  const toggle = (cat: Category) => {
    const next = new Set(active)
    if (next.has(cat)) {
      if (next.size > 1) next.delete(cat) // always keep at least one active
    } else {
      next.add(cat)
    }
    onChange(next)
  }

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[900] flex gap-[6px] bg-[rgba(6,10,22,0.9)] border border-[#2a3560] rounded-full px-3 py-[5px]">
      {ALL_CATS.map(cat => {
        const on = active.has(cat)
        const color = CATEGORY_COLORS[cat]
        return (
          <button
            key={cat}
            type="button"
            onClick={() => toggle(cat)}
            title={CATEGORY_LABELS[cat]}
            aria-label={`${on ? 'Hide' : 'Show'} ${CATEGORY_LABELS[cat]}`}
            aria-pressed={on}
            className="w-[14px] h-[14px] rounded-full border-2 transition-opacity cursor-pointer"
            style={{
              background: on ? color : 'transparent',
              borderColor: color,
              opacity: on ? 1 : 0.4,
            }}
          />
        )
      })}
      <span className="text-[9px] text-[#8899bb] self-center ml-1 tracking-[1px]">FILTER</span>
    </div>
  )
}
