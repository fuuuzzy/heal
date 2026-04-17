import { useState } from 'react'
import type { TrendPoint } from '../../types'

interface Props {
  data: TrendPoint[]
}

export function TrendChart({ data }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (data.length === 0) {
    return <p className="text-xs text-txt-muted text-center py-4">暂无趋势数据</p>
  }

  const chartH = 120
  const padTop = 8
  const padBottom = 4
  const drawH = chartH - padTop - padBottom

  // Cumulative
  let cumulative = 0
  const points = data.map(d => {
    cumulative += d.amount
    return { week: d.week, amount: d.amount, cumulative }
  })
  const maxCum = Math.max(...points.map(p => p.cumulative), 1)

  const barW = 100 / Math.max(points.length, 1)

  const getX = (i: number) => (i + 0.5) * barW
  const getY = (cum: number) => chartH - padBottom - (cum / maxCum) * drawH

  // Smooth curve helper (Catmull-Rom → cubic bezier)
  const smoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return ''
    let d = `M${pts[0]!.x},${pts[0]!.y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)]!
      const p1 = pts[i]!
      const p2 = pts[i + 1]!
      const p3 = pts[Math.min(i + 2, pts.length - 1)]!
      const tension = 0.35
      const cp1x = p1.x + (p2.x - p0.x) * tension
      const cp1y = p1.y + (p2.y - p0.y) * tension
      const cp2x = p2.x - (p3.x - p1.x) * tension
      const cp2y = p2.y - (p3.y - p1.y) * tension
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
    }
    return d
  }

  const svgPoints = points.map((p, i) => ({ x: getX(i), y: getY(p.cumulative) }))
  const linePath = smoothPath(svgPoints)
  const areaPath = `${linePath} L${getX(points.length - 1)},${chartH - padBottom} L${getX(0)},${chartH - padBottom} Z`

  // Grid lines (3 horizontal)
  const gridLines = [0.25, 0.5, 0.75].map(ratio => {
    const y = chartH - padBottom - ratio * drawH
    const val = Math.round(maxCum * ratio)
    return { y, val }
  })

  // Format amount
  const fmtAmt = (n: number) => (n >= 10000 ? `¥${(n / 10000).toFixed(1)}万` : `¥${n}`)

  // Format week label: "2026-W15" → "第15周"
  const fmtWeek = (w: string) => {
    const m = w.match(/W(\d+)/)
    return m ? `第${Number(m[1]) + 1}周` : w
  }

  // Week labels: show first, last, and evenly spaced middle ones
  const labelCount = Math.min(points.length, 5)
  const labelIndices = labelCount <= 1
    ? [0]
    : Array.from({ length: labelCount }, (_, i) =>
        Math.round((i / (labelCount - 1)) * (points.length - 1))
      )

  return (
    <div className="space-y-2">
      <span className="text-xs text-txt-muted">累计存款趋势</span>
      <div className="relative group" style={{ height: chartH }}>
        <svg
          viewBox={`0 0 100 ${chartH}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trend-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--rgb-gold) / 0.20)" />
              <stop offset="100%" stopColor="rgb(var(--rgb-gold) / 0.01)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {gridLines.map((g, i) => (
            <line
              key={i}
              x1="0" y1={g.y} x2="100" y2={g.y}
              stroke="rgb(var(--rgb-line-faint))"
              strokeWidth="0.2"
              strokeDasharray="1,1"
            />
          ))}

          {/* Area */}
          <path d={areaPath} fill="url(#trend-area-grad)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="rgb(var(--rgb-gold))"
            strokeWidth="0.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Dots */}
          {points.map((p, i) => {
            const x = getX(i)
            const y = getY(p.cumulative)
            const isHovered = hoverIdx === i
            return (
              <g key={i}>
                {isHovered && (
                  <>
                    <line x1={x} y1={y} x2={x} y2={chartH - padBottom}
                      stroke="rgb(var(--rgb-gold) / 0.25)" strokeWidth="0.2" strokeDasharray="0.8,0.8" />
                    <circle cx={x} cy={y} r="3" fill="rgb(var(--rgb-gold) / 0.12)" />
                  </>
                )}
                <circle
                  cx={x} cy={y}
                  r={isHovered ? '1.4' : '0.8'}
                  fill="rgb(var(--rgb-gold))"
                  stroke={isHovered ? 'rgb(var(--rgb-surface))' : 'none'}
                  strokeWidth={isHovered ? '0.3' : '0'}
                />
              </g>
            )
          })}
        </svg>

        {/* Hover tooltip */}
        {hoverIdx !== null && points[hoverIdx] && (
          <div
            className="absolute top-0 pointer-events-none"
            style={{
              left: `${getX(hoverIdx)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-surface-elevated border border-line rounded-lg px-2.5 py-1.5 shadow-lg text-center min-w-[4rem]">
              <p className="text-[11px] font-semibold text-gold">{fmtAmt(points[hoverIdx]!.cumulative)}</p>
              <p className="text-[9px] text-txt-muted">本周 +¥{points[hoverIdx]!.amount}</p>
            </div>
          </div>
        )}

        {/* Invisible hover zones */}
        {points.map((_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full cursor-crosshair"
            style={{
              left: `${i * barW}%`,
              width: `${barW}%`,
            }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          />
        ))}
      </div>

      {/* Week labels */}
      <div className="relative h-4">
        {labelIndices.map(i => (
          <span
            key={i}
            className="absolute text-[10px] text-txt-muted -translate-x-1/2"
            style={{ left: `${getX(i)}%` }}
          >
            {fmtWeek(points[i]!.week)}
          </span>
        ))}
      </div>
    </div>
  )
}
