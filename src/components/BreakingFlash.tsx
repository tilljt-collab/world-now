'use client'

interface BreakingFlashProps { headline: string; visible: boolean }

export default function BreakingFlash({ headline, visible }: BreakingFlashProps) {
  if (!visible) return null
  return (
    <div
      className="fixed top-[50px] left-0 right-0 z-[2000] flex items-center gap-3 bg-[#c0392b] px-4 py-2"
      style={{ animation: 'flashDrop 6s ease forwards' }}
      role="alert"
      aria-live="assertive"
    >
      <span className="text-[10px] font-extrabold tracking-[2px] bg-[#a02020] px-2 py-[2px] rounded whitespace-nowrap">
        ⚡ BREAKING
      </span>
      <span className="text-[12px] font-semibold truncate">{headline}</span>
    </div>
  )
}
