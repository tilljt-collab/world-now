'use client'
import { useEffect } from 'react'
import { PRESETS, type PresetId } from '@/lib/presets'

interface WelcomeScreenProps {
  onSelect: (id: PresetId) => void
}

export default function WelcomeScreen({ onSelect }: WelcomeScreenProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSelect('everything')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSelect])

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-[#060a16]">
      <div className="mb-1 text-[26px] font-black tracking-[6px]">
        WORLD<span className="text-[#e74c3c]">NOW</span>
      </div>
      <div className="mb-2 text-[10px] text-[#e74c3c] tracking-[4px] uppercase font-bold">
        Live Global Intelligence
      </div>
      <div className="mb-8 text-[12px] text-[#8899bb] tracking-[0.5px]">
        What&apos;s on your radar today?
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[660px] px-4">
        {PRESETS.map(preset => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className="group flex flex-col items-center text-center p-5 border border-[#1a2040] bg-[#0b0f1f] hover:border-[#e74c3c] hover:bg-[#0f1428] transition-colors duration-150 cursor-pointer rounded-[3px]"
          >
            <div className="text-[26px] mb-3 group-hover:scale-110 transition-transform duration-150">
              {preset.emoji}
            </div>
            <div className="text-[10px] font-bold tracking-[2px] text-white uppercase mb-[5px]">
              {preset.label}
            </div>
            <div className="text-[9px] text-[#556688] leading-[1.6] tracking-[0.3px]">
              {preset.tagline}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 text-[9px] text-[#2a3560] tracking-[2px] uppercase">
        Press ESC to see everything
      </div>
    </div>
  )
}
