import { useMemo } from 'react'
import { Header } from '../components/layout/Header'
import { useEventStore } from '../stores/eventStore'
import { useActivityStore } from '../stores/activityStore'

export function StatsPage() {
  const { events } = useEventStore()
  const { getBaseActivities, getChildren } = useActivityStore()

  // Get only base activities (not deleted)
  const baseActivities = getBaseActivities()

  // Pre-compute event counts per activity (single pass through events)
  const eventCountsById = useMemo(() => {
    const counts: Record<string, number> = {}
    events.forEach((event) => {
      counts[event.activityId] = (counts[event.activityId] || 0) + 1
    })
    return counts
  }, [events])

  // Calculate stats for all base activities with memoization
  const activityStats = useMemo(() => {
    const stats: Record<string, number> = {}

    // Recursive function to sum activity and all children
    const calculateStats = (activityId: string): number => {
      // Use cached result if available
      if (stats[activityId] !== undefined) return stats[activityId]

      let count = eventCountsById[activityId] || 0
      const children = getChildren(activityId)
      children.forEach((child) => {
        count += calculateStats(child.id)
      })
      stats[activityId] = count
      return count
    }

    // Calculate for all base activities
    baseActivities.forEach((activity) => {
      calculateStats(activity.id)
    })

    return stats
  }, [baseActivities, eventCountsById, getChildren])

  return (
    <div className="min-h-screen pb-20">
      <Header title="Stats" subtitle="Your activity overview" />

      <div className="p-4 space-y-4">
        <div className="bg-slate-800 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4">All Time</h3>
          <div className="space-y-3">
            {baseActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activity.emoji}</span>
                  <span className="text-slate-300">{activity.name}</span>
                </div>
                <span className="text-xl font-bold text-blue-400">
                  {activityStats[activity.id] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {baseActivities.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <span className="text-4xl block mb-2">📈</span>
            Start tracking to see your stats!
          </div>
        )}
      </div>
    </div>
  )
}
