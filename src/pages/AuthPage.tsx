import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { useAuthStore } from '../stores/authStore'

type AuthMode = 'signin' | 'signup'

export function AuthPage() {
  const navigate = useNavigate()
  const { signIn, signUp, isLoading, error, clearError } = useAuthStore()

  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!email || !password) {
      setLocalError('Please fill in all fields')
      return
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters')
        return
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match')
        return
      }

      const { error } = await signUp(email, password)
      if (!error) {
        navigate('/settings')
      }
    } else {
      const { error } = await signIn(email, password)
      if (!error) {
        navigate('/settings')
      }
    }
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setLocalError(null)
    clearError()
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen pb-24">
      <Header
        title={mode === 'signin' ? 'Sign In' : 'Create Account'}
        subtitle="Sync your data across devices"
        backTo="/settings"
      />

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2 bg-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'signin'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="bg-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white
                  placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white
                  placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white
                    placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {displayError && (
              <div className="p-3 rounded-xl bg-red-600/20 text-red-400 text-sm">
                {displayError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500
                font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? 'Loading...'
                : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </div>

          <p className="text-center text-slate-400 text-sm">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={switchMode} className="text-blue-400 hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={switchMode} className="text-blue-400 hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>

        <div className="mt-6 text-center text-slate-500 text-xs">
          <p>Your data stays on your device even without an account.</p>
          <p>Cloud sync is optional and lets you access your data anywhere.</p>
        </div>
      </div>
    </div>
  )
}
