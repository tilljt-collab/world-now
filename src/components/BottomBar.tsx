interface BottomBarProps { headlines: string[] }

export default function BottomBar({ headlines }: BottomBarProps) {
  const text = headlines.join(' · ')
  return (
    <div className="flex-none flex items-center h-[28px] bg-[#c0392b] overflow-hidden z-[1000]">
      <div className="bg-[#a02020] h-full px-3 flex items-center text-[9px] font-extrabold tracking-[2px] whitespace-nowrap flex-shrink-0">
        BREAKING
      </div>
      <div className="overflow-hidden flex-1">
        <span
          className="inline-block whitespace-nowrap text-[11px]"
          style={{ animation: 'tickerScroll 45s linear infinite', paddingLeft: '100%' }}
        >
          {text}
        </span>
      </div>
    </div>
  )
}
