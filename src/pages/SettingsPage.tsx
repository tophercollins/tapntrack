import { Link } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { useActivityStore } from '../stores/activityStore'
import { useUIStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'
import { useSyncStore } from '../stores/syncStore'
import { db } from '../db/database'

export function SettingsPage() {
  const { activities } = useActivityStore()
  const { showError, showConfirmation } = useUIStore()
  const { user, isConfigured, signOut, isLoading: authLoading } = useAuthStore()
  const { isSyncing, lastSyncAt, sync, uploadAll, downloadAll } = useSyncStore()

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

  const handleSync = async () => {
    const result = await sync()
    if (result?.success) {
      showConfirmation('Sync complete!')
    } else if (result?.error) {
      showError(result.error)
    }
  }

  const handleUploadAll = async () => {
    if (confirm('Upload all local data to the cloud? This will overwrite any existing cloud data.')) {
      const result = await uploadAll()
      if (result?.success) {
        showConfirmation(`Uploaded ${result.pushed.activities} activities, ${result.pushed.events} events`)
      } else if (result?.error) {
        showError(result.error)
      }
    }
  }

  const handleDownloadAll = async () => {
    if (confirm('Download all data from the cloud? This will merge with your local data.')) {
      const result = await downloadAll()
      if (result?.success) {
        showConfirmation(`Downloaded ${result.pulled.activities} activities, ${result.pulled.events} events`)
        window.location.reload()
      } else if (result?.error) {
        showError(result.error)
      }
    }
  }

  const handleSignOut = async () => {
    await signOut()
    showConfirmation('Signed out')
  }

  const formatLastSync = () => {
    if (!lastSyncAt) return 'Never'
    const now = new Date()
    const diff = now.getTime() - lastSyncAt.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return lastSyncAt.toLocaleDateString()
  }

  return (
    <div className="min-h-screen pb-24">
      <Header title="Settings" subtitle="Customize your experience" />

      <div className="p-4 space-y-4">
        {/* Cloud Sync section */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4">Cloud Sync</h3>

          {!isConfigured ? (
            <div className="text-slate-400 text-sm">
              <p className="mb-2">Cloud sync is not configured.</p>
              <p className="text-xs text-slate-500">
                Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable.
              </p>
            </div>
          ) : !user ? (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm">
                Sign in to sync your data across devices.
              </p>
              <Link
                to="/auth"
                className="block w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500
                  font-medium transition-colors text-center"
              >
                Sign In / Sign Up
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-300">{user.email}</div>
                  <div className="text-xs text-slate-500">Last sync: {formatLastSync()}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={authLoading}
                  className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600
                    text-sm transition-colors disabled:opacity-50"
                >
                  Sign Out
                </button>
              </div>

              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500
                  font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {isSyncing && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleUploadAll}
                  disabled={isSyncing}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600
                    text-sm transition-colors disabled:opacity-50"
                >
                  Upload All
                </button>
                <button
                  onClick={handleDownloadAll}
                  disabled={isSyncing}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600
                    text-sm transition-colors disabled:opacity-50"
                >
                  Download All
                </button>
              </div>
            </div>
          )}
        </div>

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
