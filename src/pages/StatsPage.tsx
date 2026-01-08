import { Header } from '../components/layout/Header'
import { useEntryStore } from '../stores/entryStore'
import { useActivityStore } from '../stores/activityStore'

export function StatsPage() {
  const { entries } = useEntryStore()
  const { activities } = useActivityStore()

  const getActivityStats = () => {
    const stats: Record<string, number> = {}
    entries.forEach((entry) => {
      stats[entry.activityId] = (stats[entry.activityId] || 0) + 1
    })
    return stats
  }

  const stats = getActivityStats()

  return (
    <div className="min-h-screen pb-20">
      <Header title="Stats" subtitle="Your activity overview" />

      <div className="p-4 space-y-4">
        <div className="bg-slate-800 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4">All Time</h3>
          <div className="space-y-3">
            {activities.map((activity) => {
              const count = stats[activity.id] || 0
              return (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{activity.emoji}</span>
                    <span className="text-slate-300">{activity.name}</span>
                  </div>
                  <span className="text-xl font-bold text-blue-400">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {entries.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <span className="text-4xl block mb-2">📈</span>
            Start tracking to see your stats!
          </div>
        )}
      </div>
    </div>
  )
}
