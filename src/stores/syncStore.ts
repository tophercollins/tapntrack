import { create } from 'zustand'
import { syncWithCloud, uploadAllData, downloadAllData, type SyncResult } from '../services/syncService'
import { useAuthStore } from './authStore'

interface SyncState {
  isSyncing: boolean
  lastSyncAt: Date | null
  lastSyncResult: SyncResult | null
  error: string | null

  // Actions
  sync: () => Promise<SyncResult | null>
  uploadAll: () => Promise<SyncResult | null>
  downloadAll: () => Promise<SyncResult | null>
  clearError: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  lastSyncResult: null,
  error: null,

  sync: async () => {
    const { user } = useAuthStore.getState()
    if (!user) {
      set({ error: 'Not signed in' })
      return null
    }

    set({ isSyncing: true, error: null })

    try {
      const result = await syncWithCloud(user.id)

      set({
        isSyncing: false,
        lastSyncAt: result.success ? new Date() : null,
        lastSyncResult: result,
        error: result.error || null,
      })

      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      set({ isSyncing: false, error: message })
      return null
    }
  },

  uploadAll: async () => {
    const { user } = useAuthStore.getState()
    if (!user) {
      set({ error: 'Not signed in' })
      return null
    }

    set({ isSyncing: true, error: null })

    try {
      const result = await uploadAllData(user.id)

      set({
        isSyncing: false,
        lastSyncAt: result.success ? new Date() : null,
        lastSyncResult: result,
        error: result.error || null,
      })

      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      set({ isSyncing: false, error: message })
      return null
    }
  },

  downloadAll: async () => {
    const { user } = useAuthStore.getState()
    if (!user) {
      set({ error: 'Not signed in' })
      return null
    }

    set({ isSyncing: true, error: null })

    try {
      const result = await downloadAllData(user.id)

      set({
        isSyncing: false,
        lastSyncAt: result.success ? new Date() : null,
        lastSyncResult: result,
        error: result.error || null,
      })

      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed'
      set({ isSyncing: false, error: message })
      return null
    }
  },

  clearError: () => set({ error: null }),
}))
