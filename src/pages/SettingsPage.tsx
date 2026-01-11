import { Header } from '../components/layout/Header'
import { useActivityStore } from '../stores/activityStore'
import { useUIStore } from '../stores/uiStore'
import { db } from '../db/database'

export function SettingsPage() {
  const { activities } = useActivityStore()
  const { showError } = useUIStore()

  // Filter out deleted activities for display
  const activeActivities = activities.filter((a) => !a.deletedAt)

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      try {
        // Use transaction to ensure both clears succeed or both fail (atomic)
        await db.transaction('rw', [db.events, db.activities], async () => {
          await db.events.clear()
          await db.activities.clear()
        })
        // Reload page to reset all state cleanly
        window.location.reload()
      } catch {
        showError('Failed to clear data. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen pb-24">
      <Header title="Settings" subtitle="Customize your experience" />

      <div className="p-4 space-y-4">
        {/* Activities section */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4">Your Activities</h3>
          <div className="space-y-2">
            {activeActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-2 px-3
                  bg-slate-700 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activity.emoji}</span>
                  <div>
                    <div className="font-medium">{activity.name}</div>
                    <div className="text-xs text-slate-400">{activity.trackingType}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {activeActivities.length === 0 && (
            <p className="text-slate-400 text-sm">No activities yet. Tap + on the home screen to add one.</p>
          )}
        </div>

        {/* Data section */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4">Data</h3>
          <button
            onClick={handleClearData}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500
              font-medium transition-colors"
          >
            Clear All Data
          </button>
        </div>

        {/* About section */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-2">About</h3>
          <p className="text-slate-400 text-sm">
            Tap N Track v1.0.0
          </p>
          <p className="text-slate-400 text-sm">
            Frictionless habit tracking
          </p>
        </div>
      </div>
    </div>
  )
}
