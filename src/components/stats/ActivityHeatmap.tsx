import { useMemo } from 'react'
import { getStartOfDay } from '../../utils/date'
import type { Event } from '../../types'

interface ActivityHeatmapProps {
  events: Event[]
  days: number
}

export function ActivityHeatmap({ events, days }: ActivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Group events by day and count
    const countByDay = new Map<string, number>()
    events.forEach((event) => {
      const dayKey = getStartOfDay(new Date(event.timestamp)).toISOString()
      countByDay.set(dayKey, (countByDay.get(dayKey) || 0) + 1)
    })

    // Find max for color scaling
    const maxCount = Math.max(...Array.from(countByDay.values()), 1)

    // Generate array of days
    const today = getStartOfDay(new Date())
    const daysArray: { date: Date; count: number; level: number }[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayKey = getStartOfDay(date).toISOString()
      const count = countByDay.get(dayKey) || 0

      // Calculate level (0-4) for color intensity
      let level = 0
      if (count > 0) {
        level = Math.min(4, Math.ceil((count / maxCount) * 4))
      }

      daysArray.push({ date, count, level })
    }

    return { days: daysArray, maxCount }
  }, [events, days])

  // Group days into weeks for GitHub-style layout
  const weeks = useMemo(() => {
    const result: typeof heatmapData.days[] = []
    let currentWeek: typeof heatmapData.days = []

    // Pad the beginning to align with day of week
    const firstDay = heatmapData.days[0]?.date
    if (firstDay) {
      const dayOfWeek = firstDay.getDay()
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({ date: new Date(0), count: -1, level: -1 }) // -1 = empty
      }
    }

    heatmapData.days.forEach((day) => {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        result.push(currentWeek)
        currentWeek = []
      }
    })

    // Add remaining days
    if (currentWeek.length > 0) {
      result.push(currentWeek)
    }

    return result
  }, [heatmapData.days])

  const getColor = (level: number) => {
    switch (level) {
      case -1: return 'bg-transparent'
      case 0: return 'bg-slate-700'
      case 1: return 'bg-green-900'
      case 2: return 'bg-green-700'
      case 3: return 'bg-green-500'
      case 4: return 'bg-green-400'
      default: return 'bg-slate-700'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get month labels
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = []
    let lastMonth = -1

    weeks.forEach((week, weekIndex) => {
      const validDay = week.find((d) => d.level >= 0)
      if (validDay) {
        const month = validDay.date.getMonth()
        if (month !== lastMonth) {
          labels.push({
            label: validDay.date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex,
          })
          lastMonth = month
        }
      }
    })

    return labels
  }, [weeks])

  return (
    <div>
      {/* Month labels */}
      <div className="flex mb-1 text-xs text-slate-500 overflow-hidden">
        <div className="w-6 flex-shrink-0" /> {/* Spacer for day labels */}
        <div className="flex-1 relative h-4">
          {monthLabels.map(({ label, weekIndex }) => (
            <span
              key={`${label}-${weekIndex}`}
              className="absolute"
              style={{ left: `${(weekIndex / weeks.length) * 100}%` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-0.5">
        {/* Day of week labels */}
        <div className="flex flex-col gap-0.5 text-xs text-slate-500 pr-1">
          <div className="h-3" /> {/* Mon */}
          <div className="h-3 flex items-center">M</div>
          <div className="h-3" /> {/* Tue */}
          <div className="h-3 flex items-center">W</div>
          <div className="h-3" /> {/* Thu */}
          <div className="h-3 flex items-center">F</div>
          <div className="h-3" /> {/* Sat */}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-0.5 flex-1 overflow-x-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-3 h-3 rounded-sm ${getColor(day.level)} ${
                    day.level >= 0 ? 'hover:ring-1 hover:ring-white/50 cursor-pointer' : ''
                  }`}
                  title={day.level >= 0 ? `${formatDate(day.date)}: ${day.count} logs` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3 text-xs text-slate-500">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={`w-3 h-3 rounded-sm ${getColor(level)}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
