import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { useAuthStore } from '../stores/authStore'

export function AuthPage() {
  const navigate = useNavigate()
  const { signIn, isLoading, error, clearError, isConfigured } = useAuthStore()

  const [key, setKey] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!key.trim()) {
      setLocalError('Please enter your access key')
      return
    }

    const { error } = await signIn(key)
    if (!error) {
      navigate('/settings')
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen pb-24">
      <Header title="Connect" subtitle="Sync your data across devices" backTo="/settings" />

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Access key</label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Paste your access key"
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white
                  placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-xs text-slate-500">
                The key from your server's <code>server/.env</code> (<code>API_SECRET</code>).
              </p>
            </div>

            {!isConfigured && (
              <div className="p-3 rounded-xl bg-amber-600/20 text-amber-400 text-sm">
                No sync server configured (VITE_API_URL is unset). The app still works offline.
              </div>
            )}

            {displayError && (
              <div className="p-3 rounded-xl bg-red-600/20 text-red-400 text-sm">{displayError}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500
                font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-slate-500 text-xs">
          <p>Your data stays on your device even without an account.</p>
          <p>Cloud sync is optional and lets you access your data anywhere.</p>
        </div>
      </div>
    </div>
  )
}
