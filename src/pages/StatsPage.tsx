import { useMemo } from 'react'
import { Header } from '../components/layout/Header'
import { useEventStore } from '../stores/eventStore'
import { useActivityStore } from '../stores/activityStore'
import { getStartOfDay } from '../utils/date'
import type { Activity } from '../types'

// Helper to get day name
function getDayName(date: Date, short = true): string {
  return date.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long' })
}

// Helper to format date as "Mon 6"
function formatDayDate(date: Date): string {
  const day = date.toLocaleDateString('en-US', { weekday: 'short' })
  return `${day} ${date.getDate()}`
}

export function StatsPage() {
  const { events } = useEventStore()
  const { getBaseActivities, getChildren } = useActivityStore()

  const baseActivities = getBaseActivities()

  // Get last 7 days starting from today
  const last7Days = useMemo(() => {
    const days: Date[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(getStartOfDay(date))
    }
    return days
  }, [])

  // Pre-compute event counts per activity per day
  const eventsByActivityByDay = useMemo(() => {
    const result: Record<string, Record<string, number>> = {}

    events.forEach((event) => {
      const eventDate = getStartOfDay(new Date(event.timestamp)).toISOString()
      if (!result[event.activityId]) {
        result[event.activityId] = {}
      }
      result[event.activityId][eventDate] = (result[event.activityId][eventDate] || 0) + 1
    })

    return result
  }, [events])

  // Get count for activity on specific day (including children)
  const getCountForDay = (activity: Activity, day: Date): number => {
    const dayKey = day.toISOString()
    let count = eventsByActivityByDay[activity.id]?.[dayKey] || 0

    // Add children counts
    const children = getChildren(activity.id)
    children.forEach((child) => {
      count += eventsByActivityByDay[child.id]?.[dayKey] || 0
    })

    return count
  }

  // Get total count for activity (all time, including children)
  const getTotalCount = (activity: Activity): number => {
    let count = 0
    Object.values(eventsByActivityByDay[activity.id] || {}).forEach((c) => {
      count += c
    })

    const children = getChildren(activity.id)
    children.forEach((child) => {
      Object.values(eventsByActivityByDay[child.id] || {}).forEach((c) => {
        count += c
      })
    })

    return count
  }

  // Calculate streaks (consecutive days with at least one event)
  const getStreak = (activity: Activity): number => {
    let streak = 0
    const today = getStartOfDay(new Date())

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const count = getCountForDay(activity, checkDate)

      if (count > 0) {
        streak++
      } else if (i > 0) {
        // Allow today to be 0 (day not over yet)
        break
      }
    }

    return streak
  }

  // Get today's date for comparison
  const today = getStartOfDay(new Date())
  const todayKey = today.toISOString()

  // Calculate max count for week chart scaling
  const maxWeekCount = useMemo(() => {
    let max = 1
    baseActivities.forEach((activity) => {
      last7Days.forEach((day) => {
        const count = getCountForDay(activity, day)
        if (count > max) max = count
      })
    })
    return max
  }, [baseActivities, last7Days, eventsByActivityByDay])

  // Get today's progress for activities with daily targets
  const activitiesWithTargets = baseActivities.filter((a) => a.dailyTarget)

  return (
    <div className="min-h-screen pb-24">
      <Header title="Stats" subtitle="Your activity overview" />

      <div className="p-4 space-y-4">
        {/* Today's Progress */}
        {activitiesWithTargets.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-4">
            <h3 className="text-lg font-semibold mb-4">Today's Progress</h3>
            <div className="space-y-4">
              {activitiesWithTargets.map((activity) => {
                const todayCount = getCountForDay(activity, today)
                const target = activity.dailyTarget || 1
                const progress = Math.min((todayCount / target) * 100, 100)
                const isComplete = todayCount >= target

                return (
                  <div key={activity.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{activity.emoji}</span>
                        <span className="text-slate-300">{activity.name}</span>
                      </div>
                      <span className={`font-bold ${isComplete ? 'text-green-400' : 'text-blue-400'}`}>
                        {todayCount}/{target}
                        {isComplete && ' ✓'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isComplete ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* This Week */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4">This Week</h3>

          {baseActivities.length === 0 ? (
            <p className="text-slate-400 text-sm">No activities to show</p>
          ) : (
            <div className="space-y-4">
              {baseActivities.map((activity) => {
                const weekTotal = last7Days.reduce((sum, day) => sum + getCountForDay(activity, day), 0)

                return (
                  <div key={activity.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{activity.emoji}</span>
                        <span className="text-slate-300">{activity.name}</span>
                      </div>
                      <span className="text-sm text-slate-400">{weekTotal} this week</span>
                    </div>

                    {/* Day bars */}
                    <div className="flex gap-1 items-end h-16">
                      {last7Days.map((day) => {
                        const count = getCountForDay(activity, day)
                        const height = count > 0 ? Math.max((count / maxWeekCount) * 100, 15) : 5
                        const isToday = day.toISOString() === todayKey

                        return (
                          <div key={day.toISOString()} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className={`w-full rounded-t transition-all ${
                                count > 0 ? 'bg-blue-500' : 'bg-slate-700'
                              } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                              style={{ height: `${height}%` }}
                              title={`${formatDayDate(day)}: ${count}`}
                            />
                            <span className={`text-xs ${isToday ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
                              {getDayName(day)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Streaks */}
        {baseActivities.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-4">
            <h3 className="text-lg font-semibold mb-4">Current Streaks</h3>
            <div className="grid grid-cols-2 gap-3">
              {baseActivities.map((activity) => {
                const streak = getStreak(activity)
                return (
                  <div
                    key={activity.id}
                    className="bg-slate-700 rounded-xl p-3 flex items-center gap-3"
                  >
                    <span className="text-2xl">{activity.emoji}</span>
                    <div>
                      <div className="text-2xl font-bold text-orange-400">
                        {streak}
                        <span className="text-sm font-normal text-slate-400 ml-1">
                          {streak === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate">{activity.name}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* All Time */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4">All Time</h3>
          {baseActivities.length === 0 ? (
            <div className="text-center text-slate-400 py-4">
              <span className="text-4xl block mb-2">📈</span>
              Start tracking to see your stats!
            </div>
          ) : (
            <div className="space-y-3">
              {baseActivities.map((activity) => {
                const total = getTotalCount(activity)
                return (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{activity.emoji}</span>
                      <span className="text-slate-300">{activity.name}</span>
                    </div>
                    <span className="text-xl font-bold text-blue-400">{total}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
