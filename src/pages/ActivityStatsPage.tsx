import { useState, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useActivityStore } from '../stores/activityStore'
import { useEventStore } from '../stores/eventStore'
import { getStartOfDay } from '../utils/date'
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap'
import { DimensionBreakdown } from '../components/stats/DimensionBreakdown'
import { TimeSeriesChart } from '../components/stats/TimeSeriesChart'
import type { Event, Dimension } from '../types'

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

export function ActivityStatsPage() {
  const { activityId } = useParams<{ activityId: string }>()
  const { activities } = useActivityStore()
  const { getEventsForActivity } = useEventStore()
  const [activityEvents, setActivityEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'30' | '90' | '365'>('90')

  const activity = activities.find((a) => a.id === activityId && !a.deletedAt)

  useEffect(() => {
    const loadEvents = async () => {
      if (!activityId) return
      setLoading(true)
      const events = await getEventsForActivity(activityId, parseInt(timeRange))
      setActivityEvents(events)
      setLoading(false)
    }
    loadEvents()
  }, [activityId, timeRange, getEventsForActivity])

  // Calculate stats
  const stats = useMemo(() => {
    if (!activityEvents.length || !activity) {
      return { total: 0, totalPoints: 0, streak: 0, bestStreak: 0, avgPerDay: 0, activeDays: 0, totalLabel: 'logs', logCount: 0 }
    }

    // Group events by day
    const eventsByDay = new Map<string, Event[]>()
    activityEvents.forEach((event) => {
      const dayKey = getStartOfDay(new Date(event.timestamp)).toISOString()
      const existing = eventsByDay.get(dayKey) || []
      eventsByDay.set(dayKey, [...existing, event])
    })

    const activeDays = eventsByDay.size
    const logCount = activityEvents.length

    // Calculate total based on tracking type
    let total: number
    let totalPoints = 0
    let totalLabel: string
    switch (activity.trackingType) {
      case 'number':
        total = activityEvents.reduce((sum, e) => sum + (e.value || 0), 0)
        totalLabel = activity.unit || 'total'
        break
      case 'duration':
        total = activityEvents.reduce((sum, e) => sum + Math.floor((e.duration || 0) / 60), 0)
        totalLabel = 'minutes'
        break
      case 'custom':
        total = logCount
        totalLabel = 'logs'
        if (activity.dimensions) {
          totalPoints = activityEvents.reduce(
            (sum, e) => sum + calculateEventScore(e, activity.dimensions!, activity.valueFormula || 'multiply'),
            0
          )
        }
        break
      default:
        total = logCount
        totalLabel = 'logs'
    }

    // Calculate current streak
    let streak = 0
    const today = getStartOfDay(new Date())
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dayKey = getStartOfDay(checkDate).toISOString()
      if (eventsByDay.has(dayKey)) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    // Calculate best streak
    let bestStreak = 0
    let currentStreak = 0
    const sortedDays = Array.from(eventsByDay.keys()).sort()

    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        currentStreak = 1
      } else {
        const prevDate = new Date(sortedDays[i - 1])
        const currDate = new Date(sortedDays[i])
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          currentStreak++
        } else {
          currentStreak = 1
        }
      }
      bestStreak = Math.max(bestStreak, currentStreak)
    }

    const avgPerDay = activeDays > 0 ? (total / activeDays).toFixed(1) : '0'

    return { total, totalPoints, streak, bestStreak, avgPerDay: parseFloat(avgPerDay), activeDays, totalLabel, logCount }
  }, [activityEvents, activity])

  if (!activity) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <p className="text-slate-400 mb-4">Activity not found</p>
        <Link to="/stats" className="text-blue-400 hover:text-blue-300">
          Back to Stats
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <header className="px-4 pt-safe">
        <div className="flex items-center justify-between pt-4 pb-2">
          <Link
            to="/stats"
            className="text-blue-400 hover:text-blue-300 active:scale-95 transition-transform"
          >
            Back
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activity.emoji}</span>
            <h1 className="text-lg font-semibold">{activity.name}</h1>
          </div>
          <div className="w-12" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Time range selector */}
      <div className="px-4 py-3">
        <div className="flex gap-2 bg-slate-800 rounded-xl p-1">
          {(['30', '90', '365'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range === '30' ? '30 days' : range === '90' ? '90 days' : '1 year'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Loading...</div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
              <div className="text-sm text-slate-400">Total {stats.totalLabel}</div>
            </div>
            {activity.trackingType === 'custom' && stats.totalPoints > 0 && (
              <div className="bg-slate-800 rounded-xl p-4">
                <div className="text-3xl font-bold text-yellow-400">{stats.totalPoints.toFixed(1)}</div>
                <div className="text-sm text-slate-400">Total points</div>
              </div>
            )}
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-orange-400">{stats.streak}</div>
              <div className="text-sm text-slate-400">Current streak</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-400">{stats.bestStreak}</div>
              <div className="text-sm text-slate-400">Best streak</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-3xl font-bold text-purple-400">{stats.activeDays}</div>
              <div className="text-sm text-slate-400">Active days</div>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Activity</h3>
            <ActivityHeatmap
              events={activityEvents}
              days={parseInt(timeRange)}
              trackingType={activity.trackingType}
              dimensions={activity.dimensions}
              valueFormula={activity.valueFormula}
            />
          </div>

          {/* Time Series Chart */}
          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Trend</h3>
            <TimeSeriesChart
              events={activityEvents}
              days={parseInt(timeRange)}
              trackingType={activity.trackingType}
              unit={activity.unit}
              dimensions={activity.dimensions}
              valueFormula={activity.valueFormula}
            />
          </div>

          {/* Dimension Breakdown (for custom activities) */}
          {activity.trackingType === 'custom' && activity.dimensions && (
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Breakdown</h3>
              <DimensionBreakdown
                events={activityEvents}
                dimensions={activity.dimensions}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
