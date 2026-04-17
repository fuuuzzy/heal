interface Props {
  percent: number
  height?: number
}

export function ProgressThermometer({ percent, height = 120 }: Props) {
  const clampedPercent = Math.min(Math.max(percent, 0), 100)
  const fillHeight = (clampedPercent / 100) * (height - 20)

  return (
    <div className="flex items-end gap-2">
      <div className="relative" style={{ height, width: 16 }}>
        {/* Tube */}
        <div className="absolute inset-x-0 top-0 bottom-5 rounded-t-full border border-line bg-surface-dark overflow-hidden">
          <div
            className="absolute bottom-0 inset-x-0 rounded-t-full transition-all duration-700 ease-out"
            style={{
              height: `${fillHeight}px`,
              background: clampedPercent >= 100
                ? 'linear-gradient(to top, rgb(var(--rgb-success)), rgb(var(--rgb-success) / 0.6))'
                : 'linear-gradient(to top, rgb(var(--rgb-gold)), rgb(var(--rgb-gold) / 0.6))',
            }}
          />
          {/* Bubble effect */}
          {clampedPercent > 10 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/30 animate-bounce" />
          )}
        </div>
        {/* Bulb */}
        <div
          className={`absolute -bottom-1 inset-x-[-4px] h-5 rounded-full border border-line transition-colors duration-700 ${
            clampedPercent > 0 ? (clampedPercent >= 100 ? 'bg-success' : 'bg-gold') : 'bg-surface-dark'
          }`}
        />
      </div>
      <div className="text-right pb-1">
        <span className={`text-lg font-bold ${clampedPercent >= 100 ? 'text-success' : 'text-gold'}`}>
          {clampedPercent}%
        </span>
      </div>
    </div>
  )
}
