import type { HeatmapPoint } from '../../types'

interface Props {
  data: HeatmapPoint[]
}

const LEVELS = [
  'bg-line-faint',
  'bg-gold/20',
  'bg-gold/40',
  'bg-gold/60',
  'bg-gold/80',
  'bg-gold',
]

function getLevel(count: number, max: number): number {
  if (count === 0) return 0
  const ratio = count / max
  if (ratio <= 0.2) return 1
  if (ratio <= 0.4) return 2
  if (ratio <= 0.6) return 3
  if (ratio <= 0.8) return 4
  return 5
}

export function HeatMap({ data }: Props) {
  // Build last 90 days grid
  const dataMap = new Map(data.map(d => [d.date, d.count]))
  const max = Math.max(...data.map(d => d.count), 1)

  const days: { date: string; count: number; level: number }[] = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const count = dataMap.get(dateStr) || 0
    days.push({ date: dateStr, count, level: getLevel(count, max) })
  }

  // Group into weeks (7 rows)
  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-txt-muted">存钱热力图（近90天）</span>
        <div className="flex items-center gap-1 text-[10px] text-txt-muted">
          <span>少</span>
          {LEVELS.map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-sm ${LEVELS[i]}`} />
          ))}
          <span>多</span>
        </div>
      </div>
      <div className="flex gap-[2px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map(day => (
              <div
                key={day.date}
                className={`w-2.5 h-2.5 rounded-sm ${LEVELS[day.level]!} transition-colors`}
                title={`${day.date}: ${day.count} 格`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
