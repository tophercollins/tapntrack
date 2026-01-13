import { useMemo } from 'react'
import { getStartOfDay } from '../../utils/date'
import type { Event, TrackingType, Dimension } from '../../types'

interface TimeSeriesChartProps {
  events: Event[]
  days: number
  trackingType: TrackingType
  dimensions?: Dimension[]
  valueFormula?: 'multiply' | 'add'
}

// Helper to calculate event score for custom type
function calculateEventScore(
  event: Event,
  dimensions: Dimension[],
  formula: 'multiply' | 'add'
): number {
  if (!event.dimensionValues) return 1

  const values = dimensions.map((dim) => {
    const selectedValue = event.dimensionValues?.[dim.id]
    const option = dim.options.find((o) => o.value === selectedValue)
    return option?.numericValue ?? 1
  })

  if (formula === 'add') {
    return values.reduce((sum, v) => sum + v, 0)
  }
  return values.reduce((product, v) => product * v, 1)
}

export function TimeSeriesChart({
  events,
  days,
  trackingType,
  dimensions,
  valueFormula = 'multiply',
}: TimeSeriesChartProps) {
  const chartData = useMemo(() => {
    // Determine aggregation period based on days
    let periodDays: number
    let periodLabel: string
    if (days <= 30) {
      periodDays = 1
      periodLabel = 'day'
    } else if (days <= 90) {
      periodDays = 7
      periodLabel = 'week'
    } else {
      periodDays = 30
      periodLabel = 'month'
    }

    // Group events by period
    const today = getStartOfDay(new Date())
    const periods: { start: Date; end: Date; value: number; count: number }[] = []

    for (let i = Math.floor(days / periodDays) - 1; i >= 0; i--) {
      const end = new Date(today)
      end.setDate(end.getDate() - i * periodDays)

      const start = new Date(end)
      start.setDate(start.getDate() - periodDays + 1)

      // Filter events in this period
      const periodEvents = events.filter((e) => {
        const timestamp = new Date(e.timestamp)
        return timestamp >= start && timestamp <= end
      })

      // Calculate value based on tracking type
      let value: number
      switch (trackingType) {
        case 'number':
          value = periodEvents.reduce((sum, e) => sum + (e.value || 0), 0)
          break
        case 'duration':
          value = periodEvents.reduce((sum, e) => sum + Math.floor((e.duration || 0) / 60), 0)
          break
        case 'custom':
          value = dimensions
            ? periodEvents.reduce((sum, e) => sum + calculateEventScore(e, dimensions, valueFormula), 0)
            : periodEvents.length
          break
        default:
          value = periodEvents.length
      }

      periods.push({ start, end, value, count: periodEvents.length })
    }

    const maxValue = Math.max(...periods.map((p) => p.value), 1)
    const avgValue = periods.length > 0
      ? periods.reduce((sum, p) => sum + p.value, 0) / periods.length
      : 0

    return { periods, maxValue, avgValue, periodLabel, periodDays }
  }, [events, days, trackingType, dimensions, valueFormula])

  const formatPeriodLabel = (period: { start: Date; end: Date }) => {
    if (chartData.periodDays === 1) {
      return period.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (chartData.periodDays === 7) {
      return `${period.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } else {
      return period.start.toLocaleDateString('en-US', { month: 'short' })
    }
  }

  const getValueLabel = () => {
    switch (trackingType) {
      case 'number':
        return 'total'
      case 'duration':
        return 'minutes'
      case 'custom':
        return dimensions ? 'points' : 'logs'
      default:
        return 'logs'
    }
  }

  // Calculate trend (compare last period to average)
  const trend = useMemo(() => {
    if (chartData.periods.length < 2) return null

    const lastPeriod = chartData.periods[chartData.periods.length - 1]
    const previousPeriods = chartData.periods.slice(0, -1)
    const previousAvg = previousPeriods.reduce((sum, p) => sum + p.value, 0) / previousPeriods.length

    if (previousAvg === 0) return null

    const change = ((lastPeriod.value - previousAvg) / previousAvg) * 100
    return {
      direction: change >= 0 ? 'up' : 'down',
      percentage: Math.abs(change).toFixed(0),
    }
  }, [chartData.periods])

  return (
    <div>
      {/* Trend indicator */}
      {trend && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-sm ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
          </span>
          <span className="text-xs text-slate-500">vs previous {chartData.periodLabel}s</span>
        </div>
      )}

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-32">
        {chartData.periods.map((period, index) => {
          const height = chartData.maxValue > 0 ? (period.value / chartData.maxValue) * 100 : 0
          const isLast = index === chartData.periods.length - 1

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-end gap-1"
            >
              {/* Value label on hover/last */}
              {(isLast || period.value > 0) && (
                <span className={`text-xs ${isLast ? 'text-blue-400' : 'text-slate-500'}`}>
                  {period.value > 0 ? period.value : ''}
                </span>
              )}

              {/* Bar */}
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  isLast ? 'bg-blue-500' : 'bg-slate-600'
                } ${period.value > 0 ? '' : 'bg-slate-700'}`}
                style={{ height: `${Math.max(height, period.value > 0 ? 4 : 2)}%` }}
                title={`${formatPeriodLabel(period)}: ${period.value} ${getValueLabel()}`}
              />
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1 mt-2">
        {chartData.periods.map((period, index) => {
          // Only show some labels to avoid crowding
          const showLabel = index === 0 ||
            index === chartData.periods.length - 1 ||
            index === Math.floor(chartData.periods.length / 2)

          return (
            <div key={index} className="flex-1 text-center">
              {showLabel && (
                <span className="text-xs text-slate-500">
                  {formatPeriodLabel(period)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Average line indicator */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>Avg: {chartData.avgValue.toFixed(1)} {getValueLabel()}/{chartData.periodLabel}</span>
      </div>
    </div>
  )
}
