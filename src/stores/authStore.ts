import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isConfigured: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isConfigured: isSupabaseConfigured(),
  error: null,

  initialize: async () => {
    if (!supabase) {
      set({ isLoading: false, isConfigured: false })
      return
    }

    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
        set({ isLoading: false, error: error.message })
        return
      }

      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
      })

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        })
      })
    } catch (err) {
      console.error('Auth initialization error:', err)
      set({ isLoading: false })
    }
  },

  signUp: async (email, password) => {
    if (!supabase) {
      return { error: 'Cloud sync not configured' }
    }

    set({ isLoading: true, error: null })

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        set({ isLoading: false, error: error.message })
        return { error: error.message }
      }

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      })

      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      set({ isLoading: false, error: message })
      return { error: message }
    }
  },

  signIn: async (email, password) => {
    if (!supabase) {
      return { error: 'Cloud sync not configured' }
    }

    set({ isLoading: true, error: null })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        set({ isLoading: false, error: error.message })
        return { error: error.message }
      }

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      })

      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      set({ isLoading: false, error: message })
      return { error: message }
    }
  },

  signOut: async () => {
    if (!supabase) return

    set({ isLoading: true })

    try {
      await supabase.auth.signOut()
      set({ user: null, session: null, isLoading: false })
    } catch (err) {
      console.error('Sign out error:', err)
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
