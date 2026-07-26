import { create } from 'zustand'
import { isApiConfigured, getApiKey, setApiKey, clearApiKey, validateKey } from '../lib/api'

// Single-user model: "signed in" == a valid access key is stored. No email/password, no session.
interface AuthUser {
  id: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isConfigured: boolean
  error: string | null

  initialize: () => Promise<void>
  signIn: (key: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isConfigured: isApiConfigured(),
  error: null,

  initialize: async () => {
    if (!isApiConfigured()) {
      set({ isLoading: false, isConfigured: false })
      return
    }
    const key = getApiKey()
    if (!key) {
      set({ isLoading: false, isConfigured: true, user: null })
      return
    }
    // Optimistically treat a stored key as signed in; validate in the background and drop if stale.
    set({ isLoading: false, isConfigured: true, user: { id: 'local' } })
    const ok = await validateKey(key)
    if (!ok) {
      clearApiKey()
      set({ user: null })
    }
  },

  signIn: async (key) => {
    set({ isLoading: true, error: null })
    const trimmed = key.trim()
    if (!trimmed) {
      set({ isLoading: false, error: 'Enter your access key' })
      return { error: 'Enter your access key' }
    }
    const ok = await validateKey(trimmed)
    if (!ok) {
      const msg = 'Invalid access key or server unreachable'
      set({ isLoading: false, error: msg })
      return { error: msg }
    }
    setApiKey(trimmed)
    set({ user: { id: 'local' }, isLoading: false })
    return { error: null }
  },

  signOut: async () => {
    clearApiKey()
    set({ user: null })
  },

  clearError: () => set({ error: null }),
}))
