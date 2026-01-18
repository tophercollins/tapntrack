import { useState, useMemo } from 'react'
import { getStartOfDay } from '../../utils/date'
import type { Event, TrackingType, Dimension } from '../../types'

interface TimeSeriesChartProps {
  events: Event[]
  days: number
  trackingType: TrackingType
  unit?: string
  dimensions?: Dimension[]
  valueFormula?: 'multiply' | 'add'
}

type PeriodType = 'daily' | 'weekly' | 'monthly'
type MetricType = 'points' | 'frequency'

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

// Get start of week (Monday)
function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Get start of month
function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function TimeSeriesChart({
  events,
  days,
  trackingType,
  unit,
  dimensions,
  valueFormula = 'multiply',
}: TimeSeriesChartProps) {
  const [periodType, setPeriodType] = useState<PeriodType>('weekly')
  const [metricType, setMetricType] = useState<MetricType>('frequency')

  // Check if points are available (custom type with dimensions)
  const hasPoints = trackingType === 'custom' && dimensions && dimensions.length > 0

  const chartData = useMemo(() => {
    const today = getStartOfDay(new Date())
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - days)

    // Generate period buckets
    const periods: { start: Date; end: Date; label: string; value: number; count: number }[] = []

    if (periodType === 'daily') {
      // For daily view, limit to last 14 days to keep bars visible
      const maxDailyDays = 14
      const dailyStartDate = new Date(today)
      dailyStartDate.setDate(dailyStartDate.getDate() - Math.min(days, maxDailyDays) + 1)

      let currentDay = new Date(dailyStartDate)
      currentDay.setHours(0, 0, 0, 0)

      while (currentDay <= today) {
        const dayEnd = new Date(currentDay)
        dayEnd.setHours(23, 59, 59, 999)

        periods.push({
          start: new Date(currentDay),
          end: dayEnd,
          label: currentDay.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
          value: 0,
          count: 0,
        })

        currentDay.setDate(currentDay.getDate() + 1)
      }
    } else if (periodType === 'weekly') {
      // Generate weekly buckets
      let currentWeekStart = getStartOfWeek(startDate)

      while (currentWeekStart <= today) {
        const weekEnd = new Date(currentWeekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)

        periods.push({
          start: new Date(currentWeekStart),
          end: weekEnd,
          label: currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: 0,
          count: 0,
        })

        currentWeekStart.setDate(currentWeekStart.getDate() + 7)
      }
    } else {
      // Generate monthly buckets
      let currentMonthStart = getStartOfMonth(startDate)

      while (currentMonthStart <= today) {
        const monthEnd = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0, 23, 59, 59, 999)

        periods.push({
          start: new Date(currentMonthStart),
          end: monthEnd,
          label: currentMonthStart.toLocaleDateString('en-US', { month: 'short' }),
          value: 0,
          count: 0,
        })

        currentMonthStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1)
      }
    }

    // Populate periods with event data
    for (const event of events) {
      const eventDate = new Date(event.timestamp)

      for (const period of periods) {
        if (eventDate >= period.start && eventDate <= period.end) {
          period.count++

          // Calculate value based on tracking type
          if (hasPoints) {
            period.value += calculateEventScore(event, dimensions!, valueFormula)
          } else {
            switch (trackingType) {
              case 'number':
                period.value += event.value || 0
                break
              case 'duration':
                period.value += Math.floor((event.duration || 0) / 60)
                break
              default:
                period.value++
            }
          }
          break
        }
      }
    }

    // Determine which value to display based on tracking type and metric toggle
    // For duration/number: always show the tracked value
    // For tap: show count
    // For custom: respect the metric toggle (frequency vs points)
    const displayPeriods = periods.map((p) => {
      let displayValue: number
      if (trackingType === 'duration' || trackingType === 'number') {
        // Always show actual tracked value for these types
        displayValue = p.value
      } else if (trackingType === 'custom' && hasPoints) {
        // Custom with dimensions: respect toggle
        displayValue = metricType === 'frequency' ? p.count : p.value
      } else {
        // Tap or custom without dimensions: show count
        displayValue = p.count
      }
      return { ...p, displayValue }
    })

    const maxValue = Math.max(...displayPeriods.map((p) => p.displayValue), 1)
    const totalValue = displayPeriods.reduce((sum, p) => sum + p.displayValue, 0)

    // Only count periods with activity for the average
    const activePeriods = displayPeriods.filter((p) => p.displayValue > 0)
    const avgValue = activePeriods.length > 0
      ? activePeriods.reduce((sum, p) => sum + p.displayValue, 0) / activePeriods.length
      : 0

    return { periods: displayPeriods, maxValue, avgValue, totalValue, activePeriodsCount: activePeriods.length }
  }, [events, days, trackingType, dimensions, valueFormula, periodType, metricType, hasPoints])

  // Calculate trend (compare last period to average of previous active periods)
  // Only show if the current period has activity
  const trend = useMemo(() => {
    if (chartData.periods.length < 2) return null

    const lastPeriod = chartData.periods[chartData.periods.length - 1]

    // Don't show trend if current period has no activity
    if (lastPeriod.displayValue === 0) return null

    const previousPeriods = chartData.periods.slice(0, -1).filter((p) => p.displayValue > 0)

    if (previousPeriods.length === 0) return null

    const previousAvg = previousPeriods.reduce((sum, p) => sum + p.displayValue, 0) / previousPeriods.length

    if (previousAvg === 0) return null

    const change = ((lastPeriod.displayValue - previousAvg) / previousAvg) * 100
    return {
      direction: change >= 0 ? 'up' : 'down',
      percentage: Math.abs(change).toFixed(0),
    }
  }, [chartData.periods])

  // Get the appropriate label for the metric
  const getMetricLabel = () => {
    switch (trackingType) {
      case 'number':
        return unit || 'reps'
      case 'duration':
        return 'mins'
      case 'custom':
        if (hasPoints && metricType === 'points') return 'points'
        return 'logs'
      default:
        return 'logs'
    }
  }

  // Get period label for display
  const getPeriodLabel = () => {
    switch (periodType) {
      case 'daily':
        return 'day'
      case 'weekly':
        return 'week'
      case 'monthly':
        return 'month'
    }
  }

  // Don't show chart if no data
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No data to display
      </div>
    )
  }

  return (
    <div>
      {/* Toggle controls */}
      <div className="flex gap-2 mb-4">
        {/* Period toggle */}
        <div className="flex bg-slate-700 rounded-lg p-0.5 flex-1">
          <button
            onClick={() => setPeriodType('daily')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
              periodType === 'daily'
                ? 'bg-slate-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriodType('weekly')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
              periodType === 'weekly'
                ? 'bg-slate-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriodType('monthly')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
              periodType === 'monthly'
                ? 'bg-slate-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Metric toggle (only for custom with dimensions) */}
        {hasPoints && (
          <div className="flex bg-slate-700 rounded-lg p-0.5 flex-1">
            <button
              onClick={() => setMetricType('frequency')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                metricType === 'frequency'
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Frequency
            </button>
            <button
              onClick={() => setMetricType('points')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                metricType === 'points'
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Points
            </button>
          </div>
        )}
      </div>

      {/* Trend indicator */}
      {trend && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-sm ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
          </span>
          <span className="text-xs text-slate-500">vs previous {getPeriodLabel()}s</span>
        </div>
      )}

      {/* Daily view note */}
      {periodType === 'daily' && days > 14 && (
        <div className="text-xs text-slate-500 mb-2">
          Showing last 14 days
        </div>
      )}

      {/* Bar chart */}
      <div className={`flex items-end h-32 ${periodType === 'daily' ? 'gap-0.5' : 'gap-1'}`}>
        {chartData.periods.map((period, index) => {
          const height = chartData.maxValue > 0 ? (period.displayValue / chartData.maxValue) * 100 : 0
          const isLast = index === chartData.periods.length - 1

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0"
            >
              {/* Value label - hide for daily to save space */}
              {period.displayValue > 0 && periodType !== 'daily' && (
                <span className={`text-xs truncate ${isLast ? 'text-blue-400' : 'text-slate-500'}`}>
                  {hasPoints && metricType === 'points'
                    ? period.displayValue.toFixed(1)
                    : Math.round(period.displayValue)}
                </span>
              )}

              {/* Bar */}
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  isLast ? 'bg-blue-500' : 'bg-slate-600'
                }`}
                style={{
                  height: `${Math.max(height, period.displayValue > 0 ? 8 : 2)}%`,
                  minHeight: period.displayValue > 0 ? '4px' : '2px'
                }}
                title={`${period.label}: ${period.displayValue} ${getMetricLabel()}`}
              />
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1 mt-2">
        {chartData.periods.map((period, index) => {
          // Show fewer labels to avoid crowding
          const totalPeriods = chartData.periods.length
          const showLabel = totalPeriods <= 6 ||
            index === 0 ||
            index === totalPeriods - 1 ||
            (totalPeriods > 6 && index === Math.floor(totalPeriods / 2))

          return (
            <div key={index} className="flex-1 text-center min-w-0">
              {showLabel && (
                <span className="text-xs text-slate-500 truncate block">
                  {period.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Average and total */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>
          Avg: {chartData.avgValue.toFixed(1)} {getMetricLabel()}/{getPeriodLabel()}
          {chartData.activePeriodsCount < chartData.periods.length && (
            <span className="text-slate-600"> ({chartData.activePeriodsCount} active)</span>
          )}
        </span>
        <span>
          Total: {hasPoints && metricType === 'points'
            ? chartData.totalValue.toFixed(1)
            : Math.round(chartData.totalValue)} {getMetricLabel()}
        </span>
      </div>
    </div>
  )
}
